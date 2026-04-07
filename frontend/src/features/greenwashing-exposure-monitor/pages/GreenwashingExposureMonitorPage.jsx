import React, { useState, useMemo, useCallback } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  LineChart, Line, ComposedChart, Area,
  ResponsiveContainer, Cell,
} from 'recharts';

const T = {
  bg: '#f8f6f0', card: '#ffffff', border: '#e2ded5', text: '#1a1a2e',
  sub: '#f6f4f0', muted: '#6b7280', indigo: '#4f46e5', gold: '#b8860b',
  green: '#16a34a', red: '#dc2626', blue: '#0369a1', amber: '#d97706',
  navy: '#1e3a5f', teal: '#0f766e', purple: '#7c3aed', orange: '#ea580c',
};

const sr = s => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };

const CLAIM_CATEGORIES = ['Net-Zero Pledge', 'Carbon Neutral', 'Green Product', 'Sustainable Investment', 'Eco-Friendly', 'Climate Positive', 'Science-Based', 'Nature-Positive', 'Circular Economy', 'Zero Emission'];
const CLAIM_STRENGTHS = ['Vague', 'Specific', 'Quantified', 'Verified'];
const TIME_TO_ACTIONS = ['Imminent', 'Near-Term', 'Medium-Term', 'Low Risk'];
const SECTORS = ['Energy', 'Financials', 'Consumer Staples', 'Materials', 'Industrials', 'Utilities', 'Real Estate', 'Technology', 'Healthcare', 'Transport'];
const COUNTRIES = ['USA', 'UK', 'EU', 'Germany', 'France', 'Australia', 'Canada', 'Japan', 'Netherlands', 'Sweden', 'Switzerland', 'Ireland', 'Singapore', 'Hong Kong', 'Brazil'];

const REGULATORS = [
  { id: 'FCA', name: 'FCA', jurisdiction: 'UK', avgFineM: 45, focusAreas: ['Greenwashing', 'Net-Zero Pledge', 'Sustainable Investment'], investigationsActive: 23, enforcementHistory: 41, fineRangeMin: 1, fineRangeMax: 200 },
  { id: 'SEC', name: 'SEC', jurisdiction: 'USA', avgFineM: 120, focusAreas: ['Securities Fraud', 'Carbon Neutral', 'Green Product'], investigationsActive: 38, enforcementHistory: 67, fineRangeMin: 5, fineRangeMax: 800 },
  { id: 'ASIC', name: 'ASIC', jurisdiction: 'Australia', avgFineM: 28, focusAreas: ['Greenwashing', 'Eco-Friendly', 'Climate Positive'], investigationsActive: 15, enforcementHistory: 22, fineRangeMin: 0.5, fineRangeMax: 100 },
  { id: 'BaFin', name: 'BaFin', jurisdiction: 'Germany', avgFineM: 35, focusAreas: ['Science-Based', 'Net-Zero Pledge', 'Circular Economy'], investigationsActive: 18, enforcementHistory: 29, fineRangeMin: 1, fineRangeMax: 150 },
  { id: 'ESMA', name: 'ESMA', jurisdiction: 'EU', avgFineM: 55, focusAreas: ['Sustainable Investment', 'Nature-Positive', 'Zero Emission'], investigationsActive: 31, enforcementHistory: 48, fineRangeMin: 2, fineRangeMax: 300 },
];

const ENTITY_NAMES = Array.from({ length: 150 }, (_, i) => {
  const bases = ['Apex', 'Global', 'Terra', 'EcoFirst', 'GreenPrime', 'CleanStar', 'NatureCo', 'SustainX', 'EarthFund', 'NetZeroPlc', 'CarbonFwd', 'EcoStar', 'GreenTrust', 'CleanEnergy', 'SustainIQ'];
  const suffixes = ['Corp', 'Ltd', 'AG', 'SE', 'PLC', 'Inc', 'GmbH', 'Holdings', 'Partners', 'Group'];
  return `${bases[i % bases.length]} ${suffixes[i % suffixes.length]} ${Math.floor(i / bases.length) > 0 ? Math.floor(i / bases.length) + 1 : ''}`.trim();
});

const ENTITIES = Array.from({ length: 150 }, (_, i) => {
  const sectorIdx = Math.floor(sr(i * 7) * 10);
  const countryIdx = Math.floor(sr(i * 11) * 15);
  const claimCatIdx = Math.floor(sr(i * 13) * 10);
  const claimStrIdx = Math.floor(sr(i * 17) * 4);
  const claimStrengthNorm = claimStrIdx / 3;
  const greenRevClaimed = Math.min(1, sr(i * 19) * 0.8 + 0.1);
  const greenRevActual = Math.min(greenRevClaimed, Math.max(0, greenRevClaimed * (sr(i * 23) * 0.8)));
  const gapScore = Math.max(0, Math.min(100, Math.round((greenRevClaimed - greenRevActual) * 100)));
  const regId1 = Math.floor(sr(i * 29) * 5);
  const regId2 = (regId1 + 1 + Math.floor(sr(i * 31) * 4)) % 5;
  const enforcementProb = Math.min(1, Math.max(0, gapScore / 100 * 0.6 + claimStrengthNorm * 0.2 + sr(i * 37) * 0.2));
  const controversyCount = Math.floor(sr(i * 41) * 15);
  const controversyNorm = controversyCount / 15;
  const esgImpact = -(sr(i * 43) * 15 + 1);
  const marketingSpend = +(sr(i * 47) * 50 + 0.5).toFixed(1);
  const fineEstimate = Math.round(enforcementProb * REGULATORS[regId1].avgFineM * 1e6 * (0.5 + sr(i * 53)));
  const disclosureScore = Math.round(sr(i * 59) * 80 + 10);
  const gwRisk = Math.min(100, Math.round(gapScore * 0.4 + enforcementProb * 100 * 0.3 + claimStrengthNorm * 100 * 0.2 + controversyNorm * 100 * 0.1));
  const ttaIdx = gwRisk >= 70 ? 0 : gwRisk >= 50 ? 1 : gwRisk >= 30 ? 2 : 3;
  return {
    id: i + 1,
    name: ENTITY_NAMES[i],
    sector: SECTORS[sectorIdx],
    country: COUNTRIES[countryIdx],
    claimCategory: CLAIM_CATEGORIES[claimCatIdx],
    claimStrength: CLAIM_STRENGTHS[claimStrIdx],
    realityScore: Math.round((1 - gapScore / 100) * 100),
    gapScore,
    regulatorExposure: [REGULATORS[regId1].id, REGULATORS[regId2].id],
    enforcementProbability: +enforcementProb.toFixed(3),
    fineEstimateUSD: fineEstimate,
    marketingSpend,
    greenrevenueActual: +greenRevActual.toFixed(3),
    greenrevenueClaimed: +greenRevClaimed.toFixed(3),
    disclosureScore,
    controversyCount,
    esgRatingImpact: +esgImpact.toFixed(1),
    timeToAction: TIME_TO_ACTIONS[ttaIdx],
    greenwashingRiskScore: gwRisk,
  };
});

const ENFORCEMENT_ACTIONS = Array.from({ length: 30 }, (_, k) => {
  const regIdx = Math.floor(sr(k * 61 + 2000) * 5);
  const claimIdx = Math.floor(sr(k * 67 + 2000) * 10);
  const sectorIdx = Math.floor(sr(k * 71 + 2000) * 10);
  const fineM = +(sr(k * 73 + 2000) * 180 + 0.5).toFixed(1);
  const year = 2018 + Math.floor(sr(k * 79 + 2000) * 6);
  const outcomes = ['Settled', 'Fined', 'Dismissed', 'Ongoing', 'Appealed'];
  const precLevels = ['High', 'Medium', 'Low'];
  return {
    id: k + 1,
    regulator: REGULATORS[regIdx].id,
    entityName: ENTITY_NAMES[k % 60],
    actionType: ['Fine', 'Mandatory Audit', 'Cease-and-Desist', 'Public Censure', 'Consent Order'][Math.floor(sr(k * 83 + 2000) * 5)],
    fineUSD: Math.round(fineM * 1e6),
    actionDate: `${year}-Q${1 + Math.floor(sr(k * 89 + 2000) * 4)}`,
    claimType: CLAIM_CATEGORIES[claimIdx],
    outcome: outcomes[Math.floor(sr(k * 97 + 2000) * 5)],
    precedentLevel: precLevels[Math.floor(sr(k * 101 + 2000) * 3)],
    sector: SECTORS[sectorIdx],
  };
});

const fmtUSD = v => {
  if (!isFinite(v) || isNaN(v)) return '$0';
  if (v >= 1e9) return `$${(v / 1e9).toFixed(1)}B`;
  if (v >= 1e6) return `$${(v / 1e6).toFixed(0)}M`;
  return `$${Math.round(v).toLocaleString()}`;
};

const riskColor = s => s >= 70 ? T.red : s >= 40 ? T.amber : T.green;

const KpiCard = ({ label, value, sub, color }) => (
  <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: '14px 18px', flex: 1, minWidth: 130 }}>
    <div style={{ fontSize: 10, color: T.muted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 5 }}>{label}</div>
    <div style={{ fontSize: 20, fontWeight: 700, color: color || T.text }}>{value}</div>
    {sub && <div style={{ fontSize: 10, color: T.muted, marginTop: 3 }}>{sub}</div>}
  </div>
);

const RiskBadge = ({ val }) => (
  <span style={{ background: riskColor(val) + '18', color: riskColor(val), border: `1px solid ${riskColor(val)}40`, borderRadius: 4, padding: '2px 7px', fontSize: 11, fontWeight: 600 }}>{val}</span>
);

const TABS = ['Exposure Dashboard', 'Entity Monitor', 'Claim Analysis', 'Regulator Intelligence', 'Enforcement Actions', 'Portfolio Greenwashing VaR', 'Summary & Export'];

export default function GreenwashingExposureMonitorPage() {
  const [activeTab, setActiveTab] = useState(0);
  const [regFilter, setRegFilter] = useState([]);
  const [sectorFilter, setSectorFilter] = useState('All');
  const [claimCatFilter, setClaimCatFilter] = useState('All');
  const [claimStrFilter, setClaimStrFilter] = useState('All');
  const [gapMin, setGapMin] = useState(0);
  const [ttaFilter, setTtaFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [sortCol, setSortCol] = useState('greenwashingRiskScore');
  const [sortDir, setSortDir] = useState('desc');
  const [drillEntity, setDrillEntity] = useState(null);
  const [enfSortCol, setEnfSortCol] = useState('fineUSD');
  const [enfSortDir, setEnfSortDir] = useState('desc');
  const [scenarioMultiplier, setScenarioMultiplier] = useState(1.0);

  const filtered = useMemo(() => {
    if (!ENTITIES.length) return [];
    let arr = [...ENTITIES];
    if (regFilter.length > 0) arr = arr.filter(e => e.regulatorExposure.some(r => regFilter.includes(r)));
    if (sectorFilter !== 'All') arr = arr.filter(e => e.sector === sectorFilter);
    if (claimCatFilter !== 'All') arr = arr.filter(e => e.claimCategory === claimCatFilter);
    if (claimStrFilter !== 'All') arr = arr.filter(e => e.claimStrength === claimStrFilter);
    if (ttaFilter !== 'All') arr = arr.filter(e => e.timeToAction === ttaFilter);
    if (search) arr = arr.filter(e => e.name.toLowerCase().includes(search.toLowerCase()));
    arr = arr.filter(e => e.gapScore >= gapMin);
    return [...arr].sort((a, b) => {
      const av = a[sortCol], bv = b[sortCol];
      if (typeof av === 'number') return sortDir === 'asc' ? av - bv : bv - av;
      return sortDir === 'asc' ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av));
    });
  }, [regFilter, sectorFilter, claimCatFilter, claimStrFilter, ttaFilter, gapMin, search, sortCol, sortDir]);

  const top20 = useMemo(() => [...ENTITIES].sort((a, b) => b.greenwashingRiskScore - a.greenwashingRiskScore).slice(0, 20), []);

  const riskDist = useMemo(() => [
    [0, 20], [20, 40], [40, 60], [60, 80], [80, 100]
  ].map(([lo, hi]) => ({
    range: `${lo}-${hi}`,
    count: filtered.filter(e => e.greenwashingRiskScore >= lo && e.greenwashingRiskScore < hi).length,
  })), [filtered]);

  const claimCatDist = useMemo(() => CLAIM_CATEGORIES.map(cat => ({
    cat, count: filtered.filter(e => e.claimCategory === cat).length,
    avgGap: (() => { const ents = filtered.filter(e => e.claimCategory === cat); return ents.length ? Math.round(ents.reduce((s, e) => s + e.gapScore, 0) / ents.length) : 0; })(),
  })).filter(d => d.count > 0).sort((a, b) => b.count - a.count), [filtered]);

  const claimStrDist = useMemo(() => CLAIM_STRENGTHS.map(s => ({
    strength: s,
    count: filtered.filter(e => e.claimStrength === s).length,
    avgRisk: (() => { const ents = filtered.filter(e => e.claimStrength === s); return ents.length ? Math.round(ents.reduce((a, e) => a + e.greenwashingRiskScore, 0) / ents.length) : 0; })(),
  })), [filtered]);

  const gapData = useMemo(() => claimCatDist.slice(0, 8).map(d => ({ ...d, maxGap: Math.max(...filtered.filter(e => e.claimCategory === d.cat).map(e => e.gapScore), 0) })), [claimCatDist, filtered]);

  const portfolioGwVaR = useMemo(() => {
    if (!filtered.length) return { base: 0, scenario: 0, sectorAttr: [] };
    const totalFine = filtered.reduce((s, e) => s + e.fineEstimateUSD, 0);
    const sectorMap = {};
    filtered.forEach(e => { sectorMap[e.sector] = (sectorMap[e.sector] || 0) + e.fineEstimateUSD; });
    return {
      base: totalFine,
      scenario: Math.round(totalFine * scenarioMultiplier),
      sectorAttr: Object.entries(sectorMap).map(([s, v]) => ({ sector: s, fineM: Math.round(v / 1e6) })).sort((a, b) => b.fineM - a.fineM),
    };
  }, [filtered, scenarioMultiplier]);

  const sortedEnf = useMemo(() => [...ENFORCEMENT_ACTIONS].sort((a, b) => {
    const av = a[enfSortCol], bv = b[enfSortCol];
    if (typeof av === 'number') return enfSortDir === 'asc' ? av - bv : bv - av;
    return enfSortDir === 'asc' ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av));
  }), [enfSortCol, enfSortDir]);

  const handleSort = useCallback(col => {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortCol(col); setSortDir('desc'); }
  }, [sortCol]);

  const toggleReg = useCallback(r => {
    setRegFilter(prev => prev.includes(r) ? prev.filter(x => x !== r) : [...prev, r]);
  }, []);

  const avgRisk = filtered.length ? (filtered.reduce((s, e) => s + e.greenwashingRiskScore, 0) / filtered.length).toFixed(1) : '0';
  const avgGap = filtered.length ? (filtered.reduce((s, e) => s + e.gapScore, 0) / filtered.length).toFixed(1) : '0';

  return (
    <div style={{ background: T.bg, minHeight: '100vh', padding: 24, fontFamily: 'DM Sans, sans-serif', color: T.text }}>
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
            <div style={{ background: T.green, borderRadius: 8, width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 12 }}>EP</div>
            <div>
              <div style={{ fontSize: 10, color: T.muted, letterSpacing: 1, textTransform: 'uppercase' }}>EP-DA2 · Disclosure & Stranded Asset Analytics</div>
              <h1 style={{ fontSize: 21, fontWeight: 700, margin: 0 }}>Greenwashing Exposure Monitor</h1>
            </div>
          </div>
          <div style={{ fontSize: 12, color: T.muted }}>150 entities · 5 regulators · 30 enforcement actions · claim-gap analysis · portfolio greenwashing VaR</div>
        </div>

        <div style={{ display: 'flex', gap: 2, marginBottom: 20, borderBottom: `2px solid ${T.border}`, overflowX: 'auto', paddingBottom: 1 }}>
          {TABS.map((t, i) => (
            <button key={t} onClick={() => setActiveTab(i)} style={{ padding: '8px 14px', border: 'none', background: activeTab === i ? T.green : 'transparent', color: activeTab === i ? '#fff' : T.muted, borderRadius: '6px 6px 0 0', cursor: 'pointer', fontWeight: activeTab === i ? 600 : 400, fontSize: 12, whiteSpace: 'nowrap' }}>{t}</button>
          ))}
        </div>

        {/* Filters */}
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 14, marginBottom: 14, display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'flex-end' }}>
          <div>
            <div style={{ fontSize: 10, color: T.muted, marginBottom: 3 }}>Search</div>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Entity name..." style={{ padding: '5px 9px', border: `1px solid ${T.border}`, borderRadius: 4, fontSize: 12, width: 140 }} />
          </div>
          <div>
            <div style={{ fontSize: 10, color: T.muted, marginBottom: 3 }}>Sector</div>
            <select value={sectorFilter} onChange={e => setSectorFilter(e.target.value)} style={{ padding: '5px 9px', border: `1px solid ${T.border}`, borderRadius: 4, fontSize: 12 }}>
              <option>All</option>
              {SECTORS.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <div style={{ fontSize: 10, color: T.muted, marginBottom: 3 }}>Claim Category</div>
            <select value={claimCatFilter} onChange={e => setClaimCatFilter(e.target.value)} style={{ padding: '5px 9px', border: `1px solid ${T.border}`, borderRadius: 4, fontSize: 12 }}>
              <option>All</option>
              {CLAIM_CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <div style={{ fontSize: 10, color: T.muted, marginBottom: 3 }}>Claim Strength</div>
            <select value={claimStrFilter} onChange={e => setClaimStrFilter(e.target.value)} style={{ padding: '5px 9px', border: `1px solid ${T.border}`, borderRadius: 4, fontSize: 12 }}>
              <option>All</option>
              {CLAIM_STRENGTHS.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <div style={{ fontSize: 10, color: T.muted, marginBottom: 3 }}>Time to Action</div>
            <select value={ttaFilter} onChange={e => setTtaFilter(e.target.value)} style={{ padding: '5px 9px', border: `1px solid ${T.border}`, borderRadius: 4, fontSize: 12 }}>
              <option>All</option>
              {TIME_TO_ACTIONS.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <div style={{ fontSize: 10, color: T.muted, marginBottom: 3 }}>Min Gap Score: {gapMin}</div>
            <input type="range" min={0} max={80} value={gapMin} onChange={e => setGapMin(+e.target.value)} style={{ width: 90 }} />
          </div>
          <div style={{ fontSize: 11, color: T.muted, marginLeft: 'auto' }}>{filtered.length}/{ENTITIES.length}</div>
        </div>

        {/* Regulator chips */}
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 10, marginBottom: 14, display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontSize: 10, color: T.muted, marginRight: 4 }}>REGULATOR FILTER:</span>
          {REGULATORS.map(r => (
            <button key={r.id} onClick={() => toggleReg(r.id)} style={{ padding: '3px 12px', fontSize: 11, border: `1px solid ${regFilter.includes(r.id) ? T.green : T.border}`, borderRadius: 12, background: regFilter.includes(r.id) ? T.green + '18' : 'transparent', color: regFilter.includes(r.id) ? T.green : T.muted, cursor: 'pointer', fontWeight: regFilter.includes(r.id) ? 600 : 400 }}>
              {r.name} ({r.jurisdiction})
            </button>
          ))}
          {regFilter.length > 0 && <button onClick={() => setRegFilter([])} style={{ padding: '3px 10px', fontSize: 11, border: `1px solid ${T.red}`, borderRadius: 12, background: T.red + '15', color: T.red, cursor: 'pointer' }}>Clear</button>}
        </div>

        {/* Drill-down Panel */}
        {drillEntity && (
          <div style={{ background: T.card, border: `2px solid ${T.green}`, borderRadius: 8, padding: 16, marginBottom: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ fontWeight: 700, fontSize: 15 }}>{drillEntity.name} — Greenwashing Profile</div>
              <button onClick={() => setDrillEntity(null)} style={{ background: T.red, color: '#fff', border: 'none', borderRadius: 4, padding: '3px 10px', cursor: 'pointer', fontSize: 12 }}>Close</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 12 }}>
              <KpiCard label="GW Risk Score" value={drillEntity.greenwashingRiskScore} color={riskColor(drillEntity.greenwashingRiskScore)} />
              <KpiCard label="Gap Score" value={`${drillEntity.gapScore}pts`} color={T.red} />
              <KpiCard label="Fine Estimate" value={fmtUSD(drillEntity.fineEstimateUSD)} color={T.amber} />
              <KpiCard label="Enforcement Prob." value={`${(drillEntity.enforcementProbability * 100).toFixed(1)}%`} color={T.orange} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 10 }}>
              {[['Claimed Green Rev', `${(drillEntity.greenrevenueClaimed * 100).toFixed(0)}%`], ['Actual Green Rev', `${(drillEntity.greenrevenueActual * 100).toFixed(0)}%`], ['Disclosure Score', drillEntity.disclosureScore], ['ESG Rating Impact', `${drillEntity.esgRatingImpact}`]].map(([k, v]) => (
                <div key={k} style={{ background: T.sub, borderRadius: 6, padding: 8, textAlign: 'center' }}>
                  <div style={{ fontSize: 10, color: T.muted, marginBottom: 3 }}>{k}</div>
                  <div style={{ fontSize: 16, fontWeight: 700 }}>{v}</div>
                </div>
              ))}
            </div>
            <div style={{ fontSize: 12, color: T.muted, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <span>Claim: <b>{drillEntity.claimCategory}</b></span>
              <span>|</span>
              <span>Strength: <b>{drillEntity.claimStrength}</b></span>
              <span>|</span>
              <span>Time to Action: <b style={{ color: drillEntity.timeToAction === 'Imminent' ? T.red : T.amber }}>{drillEntity.timeToAction}</b></span>
              <span>|</span>
              <span>Regulators: <b>{drillEntity.regulatorExposure.join(', ')}</b></span>
              <span>|</span>
              <span>Controversies: <b>{drillEntity.controversyCount}</b></span>
            </div>
          </div>
        )}

        {/* ── TAB 0: Exposure Dashboard ── */}
        {activeTab === 0 && (
          <div>
            <div style={{ display: 'flex', gap: 12, marginBottom: 18, flexWrap: 'wrap' }}>
              <KpiCard label="Entities Monitored" value={filtered.length} />
              <KpiCard label="Avg GW Risk" value={avgRisk} color={T.amber} />
              <KpiCard label="Avg Gap Score" value={avgGap} color={T.red} />
              <KpiCard label="Total Fine Exposure" value={fmtUSD(filtered.reduce((s, e) => s + e.fineEstimateUSD, 0))} color={T.red} />
              <KpiCard label="Imminent Action" value={filtered.filter(e => e.timeToAction === 'Imminent').length} color={T.orange} />
              <KpiCard label="Vague Claims" value={filtered.filter(e => e.claimStrength === 'Vague').length} color={T.purple} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, marginBottom: 18 }}>
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 14 }}>
                <div style={{ fontWeight: 600, marginBottom: 10, fontSize: 13 }}>GW Risk Score Distribution</div>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={riskDist}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="range" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="count" name="Entities" radius={[4, 4, 0, 0]}>
                      {riskDist.map((d, i) => <Cell key={i} fill={i < 2 ? T.green : i < 3 ? T.amber : T.red} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 14 }}>
                <div style={{ fontWeight: 600, marginBottom: 10, fontSize: 13 }}>Top 20 Highest-Risk Entities</div>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={top20} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10 }} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 9 }} width={100} />
                    <Tooltip />
                    <Bar dataKey="greenwashingRiskScore" name="GW Risk" radius={[0, 4, 4, 0]}>
                      {top20.map((e, i) => <Cell key={i} fill={riskColor(e.greenwashingRiskScore)} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 14 }}>
                <div style={{ fontWeight: 600, marginBottom: 10, fontSize: 13 }}>Time-to-Action Distribution</div>
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={TIME_TO_ACTIONS.map(t => ({ tta: t, count: filtered.filter(e => e.timeToAction === t).length }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="tta" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="count" name="Entities" radius={[4, 4, 0, 0]}>
                      {TIME_TO_ACTIONS.map((t, i) => <Cell key={i} fill={i === 0 ? T.red : i === 1 ? T.amber : i === 2 ? T.orange : T.green} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 14 }}>
                <div style={{ fontWeight: 600, marginBottom: 10, fontSize: 13 }}>Claim Strength Breakdown</div>
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={claimStrDist}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="strength" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="count" name="Entities" fill={T.blue} radius={[4, 4, 0, 0]} />
                    <Bar dataKey="avgRisk" name="Avg Risk" fill={T.amber} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 1: Entity Monitor ── */}
        {activeTab === 1 && (
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 14 }}>
            <div style={{ fontWeight: 600, marginBottom: 10, fontSize: 13 }}>Entity Monitor — {filtered.length} records</div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                <thead>
                  <tr style={{ background: T.sub }}>
                    {[['name', 'Name'], ['sector', 'Sector'], ['country', 'Country'], ['claimCategory', 'Claim'], ['claimStrength', 'Strength'], ['greenwashingRiskScore', 'GW Risk'], ['gapScore', 'Gap'], ['enforcementProbability', 'Enf. Prob.'], ['fineEstimateUSD', 'Fine Est.'], ['timeToAction', 'Time to Action']].map(([col, label]) => (
                      <th key={col} onClick={() => handleSort(col)} style={{ padding: '7px 8px', textAlign: 'left', cursor: 'pointer', borderBottom: `2px solid ${T.border}`, color: sortCol === col ? T.green : T.text, userSelect: 'none', whiteSpace: 'nowrap', fontSize: 11 }}>
                        {label} {sortCol === col ? (sortDir === 'asc' ? '▲' : '▼') : ''}
                      </th>
                    ))}
                    <th style={{ padding: '7px 8px' }}>Detail</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.slice(0, 100).map((e, i) => (
                    <tr key={e.id} style={{ background: i % 2 === 0 ? T.bg : T.card, borderBottom: `1px solid ${T.border}` }}>
                      <td style={{ padding: '6px 8px', fontWeight: 600, whiteSpace: 'nowrap' }}>{e.name}</td>
                      <td style={{ padding: '6px 8px' }}>{e.sector}</td>
                      <td style={{ padding: '6px 8px' }}>{e.country}</td>
                      <td style={{ padding: '6px 8px', fontSize: 10 }}>{e.claimCategory}</td>
                      <td style={{ padding: '6px 8px' }}>
                        <span style={{ background: e.claimStrength === 'Vague' ? T.red + '18' : e.claimStrength === 'Verified' ? T.green + '18' : T.amber + '18', color: e.claimStrength === 'Vague' ? T.red : e.claimStrength === 'Verified' ? T.green : T.amber, borderRadius: 3, padding: '1px 5px', fontSize: 10, fontWeight: 600 }}>{e.claimStrength}</span>
                      </td>
                      <td style={{ padding: '6px 8px' }}><RiskBadge val={e.greenwashingRiskScore} /></td>
                      <td style={{ padding: '6px 8px', fontWeight: 600, color: e.gapScore > 40 ? T.red : T.amber }}>{e.gapScore}</td>
                      <td style={{ padding: '6px 8px' }}>{(e.enforcementProbability * 100).toFixed(0)}%</td>
                      <td style={{ padding: '6px 8px' }}>{fmtUSD(e.fineEstimateUSD)}</td>
                      <td style={{ padding: '6px 8px', fontWeight: 600, color: e.timeToAction === 'Imminent' ? T.red : e.timeToAction === 'Near-Term' ? T.amber : T.muted, fontSize: 10 }}>{e.timeToAction}</td>
                      <td style={{ padding: '6px 8px' }}>
                        <button onClick={() => setDrillEntity(e)} style={{ background: T.green, color: '#fff', border: 'none', borderRadius: 3, padding: '2px 7px', fontSize: 10, cursor: 'pointer' }}>View</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filtered.length > 100 && <div style={{ textAlign: 'center', padding: 10, color: T.muted, fontSize: 11 }}>Showing 100 of {filtered.length}</div>}
            </div>
          </div>
        )}

        {/* ── TAB 2: Claim Analysis ── */}
        {activeTab === 2 && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, marginBottom: 18 }}>
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 14 }}>
                <div style={{ fontWeight: 600, marginBottom: 10, fontSize: 13 }}>Claim Category Distribution</div>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={claimCatDist} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis type="number" tick={{ fontSize: 10 }} />
                    <YAxis type="category" dataKey="cat" tick={{ fontSize: 9 }} width={110} />
                    <Tooltip />
                    <Bar dataKey="count" name="Entities" fill={T.blue} radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 14 }}>
                <div style={{ fontWeight: 600, marginBottom: 10, fontSize: 13 }}>Average Gap Score by Claim Category</div>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={gapData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis type="number" domain={[0, 80]} tick={{ fontSize: 10 }} />
                    <YAxis type="category" dataKey="cat" tick={{ fontSize: 9 }} width={110} />
                    <Tooltip />
                    <Bar dataKey="avgGap" name="Avg Gap" radius={[0, 4, 4, 0]}>
                      {gapData.map((d, i) => <Cell key={i} fill={riskColor(d.avgGap)} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 14 }}>
              <div style={{ fontWeight: 600, marginBottom: 10, fontSize: 13 }}>Claim Strength vs Gap Score Analysis</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
                {claimStrDist.map(d => (
                  <div key={d.strength} style={{ background: T.sub, borderRadius: 8, padding: 12, textAlign: 'center' }}>
                    <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 6 }}>{d.strength}</div>
                    <div style={{ fontSize: 24, fontWeight: 700, color: riskColor(d.avgRisk) }}>{d.count}</div>
                    <div style={{ fontSize: 11, color: T.muted, marginBottom: 4 }}>entities</div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>Avg Risk: {d.avgRisk}</div>
                    <div style={{ height: 3, background: T.border, borderRadius: 2, marginTop: 8 }}>
                      <div style={{ height: 3, width: `${d.avgRisk}%`, background: riskColor(d.avgRisk), borderRadius: 2 }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 3: Regulator Intelligence ── */}
        {activeTab === 3 && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginBottom: 18 }}>
              {REGULATORS.map(r => (
                <div key={r.id} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 14 }}>
                  <div style={{ fontWeight: 700, fontSize: 16, color: T.indigo, marginBottom: 6 }}>{r.name}</div>
                  <div style={{ fontSize: 11, color: T.muted, marginBottom: 8 }}>{r.jurisdiction}</div>
                  <div style={{ fontSize: 12, marginBottom: 4 }}>Active Investigations: <b>{r.investigationsActive}</b></div>
                  <div style={{ fontSize: 12, marginBottom: 4 }}>Historical Actions: <b>{r.enforcementHistory}</b></div>
                  <div style={{ fontSize: 12, marginBottom: 4 }}>Avg Fine: <b>${r.avgFineM}M</b></div>
                  <div style={{ fontSize: 12, marginBottom: 6 }}>Range: <b>${r.fineRangeMin}M–${r.fineRangeMax}M</b></div>
                  <div style={{ fontSize: 10, color: T.muted, marginBottom: 3 }}>Focus Areas:</div>
                  {r.focusAreas.map(f => <div key={f} style={{ fontSize: 10, background: T.green + '15', color: T.teal, borderRadius: 3, padding: '1px 5px', marginBottom: 2, display: 'inline-block', marginRight: 3 }}>{f}</div>)}
                </div>
              ))}
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 14 }}>
              <div style={{ fontWeight: 600, marginBottom: 10, fontSize: 13 }}>Enforcement History by Regulator</div>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={REGULATORS}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="id" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="enforcementHistory" name="Historical Actions" fill={T.indigo} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="investigationsActive" name="Active Investigations" fill={T.amber} radius={[4, 4, 0, 0]} />
                  <Legend />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* ── TAB 4: Enforcement Actions ── */}
        {activeTab === 4 && (
          <div>
            <div style={{ display: 'flex', gap: 12, marginBottom: 18, flexWrap: 'wrap' }}>
              <KpiCard label="Total Actions" value={ENFORCEMENT_ACTIONS.length} />
              <KpiCard label="Total Fines" value={fmtUSD(ENFORCEMENT_ACTIONS.reduce((s, a) => s + a.fineUSD, 0))} color={T.red} />
              <KpiCard label="Avg Fine" value={fmtUSD(ENFORCEMENT_ACTIONS.length ? ENFORCEMENT_ACTIONS.reduce((s, a) => s + a.fineUSD, 0) / ENFORCEMENT_ACTIONS.length : 0)} />
              <KpiCard label="High Precedent" value={ENFORCEMENT_ACTIONS.filter(a => a.precedentLevel === 'High').length} color={T.orange} />
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 14, marginBottom: 18 }}>
              <div style={{ fontWeight: 600, marginBottom: 10, fontSize: 13 }}>Fine History by Regulator</div>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={REGULATORS.map(r => ({ reg: r.id, totalFines: ENFORCEMENT_ACTIONS.filter(a => a.regulator === r.id).reduce((s, a) => s + a.fineUSD, 0) / 1e6 }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="reg" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={v => [`$${v.toFixed(0)}M`, 'Total Fines']} />
                  <Bar dataKey="totalFines" name="Total Fines ($M)" fill={T.red} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 14 }}>
              <div style={{ fontWeight: 600, marginBottom: 10, fontSize: 13 }}>Enforcement Action Database</div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                  <thead>
                    <tr style={{ background: T.sub }}>
                      {[['regulator', 'Regulator'], ['entityName', 'Entity'], ['actionType', 'Action Type'], ['claimType', 'Claim'], ['fineUSD', 'Fine'], ['actionDate', 'Date'], ['outcome', 'Outcome'], ['precedentLevel', 'Precedent']].map(([col, label]) => (
                        <th key={col} onClick={() => { if (enfSortCol === col) setEnfSortDir(d => d === 'asc' ? 'desc' : 'asc'); else { setEnfSortCol(col); setEnfSortDir('desc'); } }} style={{ padding: '7px 8px', textAlign: 'left', cursor: 'pointer', borderBottom: `2px solid ${T.border}`, color: enfSortCol === col ? T.green : T.text, userSelect: 'none', whiteSpace: 'nowrap', fontSize: 11 }}>
                          {label} {enfSortCol === col ? (enfSortDir === 'asc' ? '▲' : '▼') : ''}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sortedEnf.map((a, i) => (
                      <tr key={a.id} style={{ background: i % 2 === 0 ? T.bg : T.card, borderBottom: `1px solid ${T.border}` }}>
                        <td style={{ padding: '6px 8px', fontWeight: 600, color: T.indigo }}>{a.regulator}</td>
                        <td style={{ padding: '6px 8px' }}>{a.entityName}</td>
                        <td style={{ padding: '6px 8px', fontSize: 10 }}>{a.actionType}</td>
                        <td style={{ padding: '6px 8px', fontSize: 10 }}>{a.claimType}</td>
                        <td style={{ padding: '6px 8px', fontWeight: 600, color: T.red }}>{fmtUSD(a.fineUSD)}</td>
                        <td style={{ padding: '6px 8px' }}>{a.actionDate}</td>
                        <td style={{ padding: '6px 8px' }}>{a.outcome}</td>
                        <td style={{ padding: '6px 8px', fontWeight: 600, color: a.precedentLevel === 'High' ? T.red : a.precedentLevel === 'Medium' ? T.amber : T.muted }}>{a.precedentLevel}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 5: Portfolio Greenwashing VaR ── */}
        {activeTab === 5 && (
          <div>
            <div style={{ display: 'flex', gap: 12, marginBottom: 18, flexWrap: 'wrap' }}>
              <KpiCard label="Portfolio GW Exposure" value={fmtUSD(portfolioGwVaR.base)} color={T.red} />
              <KpiCard label="Scenario Exposure" value={fmtUSD(portfolioGwVaR.scenario)} color={T.orange} sub={`${scenarioMultiplier.toFixed(1)}× multiplier`} />
              <KpiCard label="Avg GW Risk" value={avgRisk} color={T.amber} />
              <KpiCard label="High Risk Entities" value={filtered.filter(e => e.greenwashingRiskScore >= 70).length} color={T.red} />
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 14, marginBottom: 18 }}>
              <div style={{ fontWeight: 600, marginBottom: 8, fontSize: 13 }}>What-If: Regulator Action Probability Increase</div>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12 }}>
                <span style={{ fontSize: 12, color: T.muted }}>Enforcement Probability Multiplier:</span>
                <input type="range" min={1.0} max={3.0} step={0.1} value={scenarioMultiplier} onChange={e => setScenarioMultiplier(+e.target.value)} style={{ width: 150 }} />
                <span style={{ fontWeight: 700, fontSize: 14, color: T.amber }}>{scenarioMultiplier.toFixed(1)}×</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div style={{ background: T.green + '10', border: `1px solid ${T.green}30`, borderRadius: 6, padding: 12, textAlign: 'center' }}>
                  <div style={{ fontSize: 11, color: T.muted }}>Base Scenario (1.0×)</div>
                  <div style={{ fontSize: 24, fontWeight: 700, color: T.green }}>{fmtUSD(portfolioGwVaR.base)}</div>
                </div>
                <div style={{ background: T.red + '10', border: `1px solid ${T.red}30`, borderRadius: 6, padding: 12, textAlign: 'center' }}>
                  <div style={{ fontSize: 11, color: T.muted }}>Scenario ({scenarioMultiplier.toFixed(1)}×)</div>
                  <div style={{ fontSize: 24, fontWeight: 700, color: T.red }}>{fmtUSD(portfolioGwVaR.scenario)}</div>
                  <div style={{ fontSize: 12, color: T.red }}>+{fmtUSD(portfolioGwVaR.scenario - portfolioGwVaR.base)} additional exposure</div>
                </div>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: 18 }}>
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 14 }}>
                <div style={{ fontWeight: 600, marginBottom: 10, fontSize: 13 }}>Fine Exposure Attribution by Sector ($M)</div>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={portfolioGwVaR.sectorAttr}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="sector" tick={{ fontSize: 10 }} angle={-25} textAnchor="end" height={45} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip formatter={v => [`$${v}M`, 'Fine Exposure']} />
                    <Bar dataKey="fineM" name="Fine Exp ($M)" fill={T.amber} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 14 }}>
                <div style={{ fontWeight: 600, marginBottom: 10, fontSize: 13 }}>AUM-Weighted Risk by Sector</div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                  <thead>
                    <tr style={{ background: T.sub }}>
                      {['Sector', 'Entities', 'Avg Risk', 'Fine Exp'].map(h => <th key={h} style={{ padding: '6px 8px', textAlign: 'left', borderBottom: `2px solid ${T.border}` }}>{h}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {SECTORS.map((s, i) => {
                      const ents = filtered.filter(e => e.sector === s);
                      const avgR = ents.length ? Math.round(ents.reduce((a, e) => a + e.greenwashingRiskScore, 0) / ents.length) : 0;
                      const fineExp = ents.reduce((a, e) => a + e.fineEstimateUSD, 0);
                      return ents.length > 0 ? (
                        <tr key={s} style={{ background: i % 2 === 0 ? T.bg : T.card, borderBottom: `1px solid ${T.border}` }}>
                          <td style={{ padding: '5px 8px', fontWeight: 600 }}>{s}</td>
                          <td style={{ padding: '5px 8px' }}>{ents.length}</td>
                          <td style={{ padding: '5px 8px' }}><RiskBadge val={avgR} /></td>
                          <td style={{ padding: '5px 8px' }}>{fmtUSD(fineExp)}</td>
                        </tr>
                      ) : null;
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 6: Summary & Export ── */}
        {activeTab === 6 && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 18 }}>
              <KpiCard label="Total Entities" value={ENTITIES.length} />
              <KpiCard label="Filtered" value={filtered.length} />
              <KpiCard label="Regulators" value={REGULATORS.length} />
              <KpiCard label="Enforcement Actions" value={ENFORCEMENT_ACTIONS.length} />
              <KpiCard label="Avg GW Risk" value={avgRisk} color={T.amber} />
              <KpiCard label="Avg Gap Score" value={avgGap} color={T.red} />
              <KpiCard label="Total Fine Exposure" value={fmtUSD(ENTITIES.reduce((s, e) => s + e.fineEstimateUSD, 0))} color={T.red} />
              <KpiCard label="Imminent Action" value={ENTITIES.filter(e => e.timeToAction === 'Imminent').length} color={T.orange} />
              <KpiCard label="Vague Claims" value={ENTITIES.filter(e => e.claimStrength === 'Vague').length} color={T.purple} />
              <KpiCard label="Verified Claims" value={ENTITIES.filter(e => e.claimStrength === 'Verified').length} color={T.green} />
              <KpiCard label="High GW Risk" value={ENTITIES.filter(e => e.greenwashingRiskScore >= 70).length} color={T.red} />
              <KpiCard label="Total Fines (Enforced)" value={fmtUSD(ENFORCEMENT_ACTIONS.reduce((s, a) => s + a.fineUSD, 0))} color={T.amber} />
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 14, marginBottom: 18 }}>
              <div style={{ fontWeight: 600, marginBottom: 10, fontSize: 13 }}>Full KPI Table — Top 50 by Greenwashing Risk</div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                  <thead>
                    <tr style={{ background: T.sub }}>
                      {['#', 'Name', 'Sector', 'Country', 'Claim Cat.', 'Strength', 'GW Risk', 'Gap', 'Enf.Prob%', 'Fine Est.', 'Time to Action', 'Controversies'].map(h => <th key={h} style={{ padding: '6px 7px', textAlign: 'left', borderBottom: `2px solid ${T.border}`, whiteSpace: 'nowrap', fontSize: 10 }}>{h}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {[...ENTITIES].sort((a, b) => b.greenwashingRiskScore - a.greenwashingRiskScore).slice(0, 50).map((e, i) => (
                      <tr key={e.id} style={{ background: i % 2 === 0 ? T.bg : T.card, borderBottom: `1px solid ${T.border}` }}>
                        <td style={{ padding: '4px 7px' }}>{i + 1}</td>
                        <td style={{ padding: '4px 7px', fontWeight: 600, whiteSpace: 'nowrap' }}>{e.name}</td>
                        <td style={{ padding: '4px 7px' }}>{e.sector}</td>
                        <td style={{ padding: '4px 7px' }}>{e.country}</td>
                        <td style={{ padding: '4px 7px', fontSize: 10 }}>{e.claimCategory}</td>
                        <td style={{ padding: '4px 7px', fontSize: 10 }}>{e.claimStrength}</td>
                        <td style={{ padding: '4px 7px' }}><RiskBadge val={e.greenwashingRiskScore} /></td>
                        <td style={{ padding: '4px 7px', fontWeight: 600, color: e.gapScore > 40 ? T.red : T.amber }}>{e.gapScore}</td>
                        <td style={{ padding: '4px 7px' }}>{(e.enforcementProbability * 100).toFixed(0)}%</td>
                        <td style={{ padding: '4px 7px' }}>{fmtUSD(e.fineEstimateUSD)}</td>
                        <td style={{ padding: '4px 7px', fontSize: 10, color: e.timeToAction === 'Imminent' ? T.red : T.muted }}>{e.timeToAction}</td>
                        <td style={{ padding: '4px 7px', textAlign: 'center' }}>{e.controversyCount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginTop: 18 }}>
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 14 }}>
                <div style={{ fontWeight: 600, marginBottom: 10, fontSize: 13 }}>Regulator Summary</div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                  <thead>
                    <tr style={{ background: T.sub }}>
                      {['Regulator', 'Active Inv.', 'Avg Fine', 'Focus'].map(h => <th key={h} style={{ padding: '5px 7px', textAlign: 'left', borderBottom: `2px solid ${T.border}` }}>{h}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {REGULATORS.map((r, i) => (
                      <tr key={r.id} style={{ background: i % 2 === 0 ? T.bg : T.card, borderBottom: `1px solid ${T.border}` }}>
                        <td style={{ padding: '4px 7px', fontWeight: 700, color: T.teal }}>{r.id}</td>
                        <td style={{ padding: '4px 7px', textAlign: 'center' }}>{r.investigationsActive}</td>
                        <td style={{ padding: '4px 7px', color: T.red }}>${r.avgFineM}M</td>
                        <td style={{ padding: '4px 7px', fontSize: 9, color: T.muted }}>{r.focusAreas[0]}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 14 }}>
                <div style={{ fontWeight: 600, marginBottom: 10, fontSize: 13 }}>Country Exposure ($M Fine Est.)</div>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={COUNTRIES.map(c => ({ country: c, fineM: Math.round(ENTITIES.filter(e => e.country === c).reduce((s, e) => s + e.fineEstimateUSD, 0) / 1e6) })).filter(d => d.fineM > 0).sort((a, b) => b.fineM - a.fineM).slice(0, 8)}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="country" tick={{ fontSize: 9 }} angle={-25} textAnchor="end" height={40} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip formatter={v => [`$${v}M`, 'Fine Est.']} />
                    <Bar dataKey="fineM" name="Fine Est. ($M)" fill={T.teal} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 14 }}>
                <div style={{ fontWeight: 600, marginBottom: 10, fontSize: 13 }}>ESG Rating Impact Distribution</div>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={[[-15, -10], [-10, -5], [-5, 0], [0, 5]].map(([lo, hi]) => ({ range: `${lo} to ${hi}`, count: ENTITIES.filter(e => e.esgRatingImpact >= lo && e.esgRatingImpact < hi).length }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="range" tick={{ fontSize: 9 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Bar dataKey="count" name="Entities" fill={T.red} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div style={{ marginTop: 18, background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 14 }}>
              <div style={{ fontWeight: 600, marginBottom: 10, fontSize: 13 }}>Greenwashing Risk Sensitivity Analysis — Gap Score vs Enforcement Probability</div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                  <thead>
                    <tr style={{ background: T.sub }}>
                      {['Gap Score Band', 'Entities', 'Avg Enf. Prob.', 'Avg Fine Est.', 'Avg GW Risk', 'Imminent Actions'].map(h => <th key={h} style={{ padding: '6px 9px', textAlign: 'left', borderBottom: `2px solid ${T.border}` }}>{h}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {[[0, 20], [20, 40], [40, 60], [60, 80], [80, 100]].map(([lo, hi], i) => {
                      const band = ENTITIES.filter(e => e.gapScore >= lo && e.gapScore < hi);
                      const avgEnf = band.length ? (band.reduce((s, e) => s + e.enforcementProbability, 0) / band.length * 100).toFixed(1) : '0';
                      const avgFine = band.length ? Math.round(band.reduce((s, e) => s + e.fineEstimateUSD, 0) / band.length / 1e6) : 0;
                      const avgRsk = band.length ? Math.round(band.reduce((s, e) => s + e.greenwashingRiskScore, 0) / band.length) : 0;
                      const imminent = band.filter(e => e.timeToAction === 'Imminent').length;
                      return (
                        <tr key={lo} style={{ background: i % 2 === 0 ? T.bg : T.card, borderBottom: `1px solid ${T.border}` }}>
                          <td style={{ padding: '5px 9px', fontWeight: 600 }}>{lo}–{hi}</td>
                          <td style={{ padding: '5px 9px' }}>{band.length}</td>
                          <td style={{ padding: '5px 9px', color: +avgEnf > 40 ? T.red : T.amber }}>{avgEnf}%</td>
                          <td style={{ padding: '5px 9px', color: T.red }}>${avgFine}M</td>
                          <td style={{ padding: '5px 9px' }}><RiskBadge val={avgRsk} /></td>
                          <td style={{ padding: '5px 9px', fontWeight: 600, color: imminent > 0 ? T.red : T.muted }}>{imminent}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
            <div style={{ marginTop: 18, background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 14 }}>
              <div style={{ fontWeight: 600, marginBottom: 10, fontSize: 13 }}>Claim Strength vs Enforcement Probability Matrix</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
                {CLAIM_STRENGTHS.map(strength => {
                  const ents = ENTITIES.filter(e => e.claimStrength === strength);
                  const avgEnf = ents.length ? (ents.reduce((s, e) => s + e.enforcementProbability, 0) / ents.length * 100).toFixed(0) : '0';
                  const avgGap = ents.length ? Math.round(ents.reduce((s, e) => s + e.gapScore, 0) / ents.length) : 0;
                  const totalFine = ents.reduce((s, e) => s + e.fineEstimateUSD, 0);
                  return (
                    <div key={strength} style={{ background: T.sub, borderRadius: 8, padding: 12, border: `1px solid ${T.border}` }}>
                      <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 8 }}>{strength}</div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, fontSize: 11 }}>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: 10, color: T.muted }}>Entities</div>
                          <div style={{ fontSize: 18, fontWeight: 700 }}>{ents.length}</div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: 10, color: T.muted }}>Avg Enf%</div>
                          <div style={{ fontSize: 18, fontWeight: 700, color: +avgEnf > 40 ? T.red : T.amber }}>{avgEnf}%</div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: 10, color: T.muted }}>Avg Gap</div>
                          <div style={{ fontSize: 16, fontWeight: 700, color: avgGap > 40 ? T.red : T.amber }}>{avgGap}</div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: 10, color: T.muted }}>Fine Exp</div>
                          <div style={{ fontSize: 14, fontWeight: 700, color: T.red }}>{fmtUSD(totalFine)}</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
