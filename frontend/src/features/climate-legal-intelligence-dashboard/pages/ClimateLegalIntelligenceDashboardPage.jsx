import React, { useState, useMemo, useCallback } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
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

const SECTORS = ['Energy', 'Financials', 'Materials', 'Industrials', 'Utilities', 'Consumer Staples', 'Real Estate', 'Technology', 'Transport', 'Healthcare'];
const COUNTRIES_100 = ['USA', 'UK', 'EU', 'Germany', 'France', 'Australia', 'Canada', 'Japan', 'Netherlands', 'Switzerland', 'Ireland', 'Singapore', 'India', 'Brazil', 'South Africa', 'Norway', 'Sweden', 'Denmark', 'Belgium', 'New Zealand'];
const JURISDICTIONS_25 = ['USA', 'UK', 'EU', 'Germany', 'France', 'Australia', 'Canada', 'Japan', 'Netherlands', 'Switzerland', 'Ireland', 'Singapore', 'India', 'Brazil', 'South Africa', 'Norway', 'New Zealand', 'Philippines', 'Colombia', 'Pakistan', 'Kenya', 'Belgium', 'Denmark', 'Sweden', 'Austria'];
const LEGAL_READINESS = ['Big Law', 'Boutique', 'In-House Only'];
const CLAIM_TYPES_6 = ['Failure to Disclose', 'Greenwashing', 'Stranded Asset', 'Human Rights', 'Securities Fraud', 'Constitutional Climate Rights'];
const SCENARIOS = ['Business as Usual', 'Litigation Wave', 'Regulatory Surge'];
const SCENARIO_CAGR = [0.08, 0.18, 0.14]; // sr seeded per entity

const ENTITY_NAMES_100 = Array.from({ length: 100 }, (_, i) => {
  const n = ['Apex', 'Global', 'Terra', 'Capital', 'Asset', 'Trust', 'Power', 'Energy', 'Green', 'Climate', 'Prime', 'Core', 'Peak', 'Clear', 'Net', 'First', 'Eco', 'Carbon', 'Risk', 'Intel'];
  const s = ['Corp', 'AG', 'SE', 'PLC', 'Ltd', 'Inc', 'Holdings', 'Group', 'Partners', 'Fund'];
  return `${n[i % n.length]} ${s[i % s.length]} ${Math.floor(i / Math.max(1, n.length)) > 0 ? String.fromCharCode(64 + Math.floor(i / Math.max(1, n.length))) : ''}`.trim();
});

const ENTITIES = Array.from({ length: 100 }, (_, i) => {
  const sectorIdx = Math.floor(sr(i * 7) * 10);
  const countryIdx = Math.floor(sr(i * 11) * 20);
  const jurCount = 1 + Math.floor(sr(i * 13) * 3);
  const jurStartIdx = Math.floor(sr(i * 17) * 20);
  const jurisdictions = Array.from({ length: jurCount }, (_, j) => COUNTRIES_100[(jurStartIdx + j) % 20]);
  const litigationRisk = Math.round(sr(i * 19) * 85 + 5);
  const greenwashingRisk = Math.round(sr(i * 23) * 85 + 5);
  const disclosureRisk = Math.round(sr(i * 29) * 85 + 5);
  const regulatoryRisk = Math.round(sr(i * 31) * 85 + 5);
  const reputationalRisk = Math.round(sr(i * 37) * 85 + 5);
  const precedentRisk = Math.round(sr(i * 41) * 85 + 5);
  const compositeLegalRisk = Math.round((litigationRisk + greenwashingRisk + disclosureRisk + regulatoryRisk + reputationalRisk + precedentRisk) / 6);
  const activeCases = Math.floor(sr(i * 43) * 15);
  const pendingLitigationM = +(sr(i * 47) * 500 + 10).toFixed(0);
  const fineExposureM = +(sr(i * 53) * 200 + 5).toFixed(0);
  const insuranceCoverageM = +(sr(i * 59) * 150 + 5).toFixed(0);
  const netLegalVaR = Math.max(0, pendingLitigationM * compositeLegalRisk / 100 - insuranceCoverageM * 0.8);
  const legalTeamSize = Math.floor(sr(i * 61) * 50 + 2);
  const externalCounsel = LEGAL_READINESS[Math.floor(sr(i * 67) * 3)];
  const legalReadinessScore = Math.round(sr(i * 71) * 70 + 20);
  return {
    id: i + 1,
    name: ENTITY_NAMES_100[i],
    sector: SECTORS[sectorIdx],
    country: COUNTRIES_100[countryIdx],
    jurisdictions,
    litigationRisk,
    greenwashingRisk,
    disclosureRisk,
    regulatoryRisk,
    reputationalRisk,
    precedentRisk,
    compositeLegalRisk,
    activeCases,
    pendingLitigationM: +pendingLitigationM,
    fineExposureM: +fineExposureM,
    insuranceCoverageM: +insuranceCoverageM,
    netLegalVaR: +netLegalVaR.toFixed(0),
    legalTeamSize,
    externalCounsel,
    legalReadinessScore,
  };
});

const JUR_INTELLIGENCE = JURISDICTIONS_25.map((jur, ji) => {
  const legalMaturityScore = Math.round(sr(ji * 73 + 6000) * 70 + 20);
  const caseCount = Math.floor(sr(ji * 79 + 6000) * 80 + 5);
  const totalDamagesM = Math.round((sr(ji * 83 + 6000) * 5 + 0.1) * 1e3);
  const activePrecedents = Math.floor(sr(ji * 89 + 6000) * 20);
  const liabilityStandards = ['Strict', 'Negligence', 'Statutory'];
  return {
    jurisdiction: jur,
    legalMaturityScore,
    caseCount,
    totalDamagesM,
    activePrecedents,
    climateConstitutionalization: sr(ji * 97 + 6000) > 0.6,
    liabilityStandard: liabilityStandards[Math.floor(sr(ji * 101 + 6000) * 3)],
    courtReceptiveness: Math.round(sr(ji * 103 + 6000) * 80 + 10),
  };
});

const KEY_PRECEDENTS = Array.from({ length: 30 }, (_, p) => {
  const jurIdx = Math.floor(sr(p * 107 + 6500) * 25);
  const claimIdx = Math.floor(sr(p * 109 + 6500) * 6);
  const year = 2005 + Math.floor(sr(p * 113 + 6500) * 19);
  const damagesM = Math.round((sr(p * 117 + 6500) * 2 + 0.01) * 1e3);
  const impactScore = Math.round(sr(p * 119 + 6500) * 80 + 15);
  const outcomes = ['Plaintiff Win', 'Defendant Win', 'Settlement', 'Dismissed', 'Precedent-Setting'];
  const principles = [
    'Corporate duty of care extends to climate-related harms',
    'Disclosure failures constitute securities fraud',
    'State must protect citizens from climate harms',
    'Climate-related greenwashing violates consumer protection',
    'Directors personally liable for inadequate climate governance',
    'Pension funds must consider climate risk in fiduciary duty',
    'Net-zero pledges are legally binding representations',
    'Science-based targets create contractual obligations',
    'Stranded asset write-downs must be disclosed prospectively',
    'Physical risk models must use IPCC-aligned scenarios',
  ];
  return {
    id: p + 1,
    caseName: `${ENTITY_NAMES_100[p % 30]} v. Climate Authority ${year}`,
    jurisdiction: JURISDICTIONS_25[jurIdx],
    year,
    outcome: outcomes[Math.floor(sr(p * 121 + 6500) * 5)],
    damagesM,
    impactScore,
    claimType: CLAIM_TYPES_6[claimIdx],
    keyPrinciple: principles[p % principles.length],
  };
});

const FORECAST_DATA = Array.from({ length: 11 }, (_, y) => {
  const year = 2025 + y;
  const bau = Math.round(500 * Math.pow(1 + SCENARIO_CAGR[0], y));
  const lw = Math.round(500 * Math.pow(1 + SCENARIO_CAGR[1], y));
  const rs = Math.round(500 * Math.pow(1 + SCENARIO_CAGR[2], y));
  return { year, 'Business as Usual': bau, 'Litigation Wave': lw, 'Regulatory Surge': rs };
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

const RISK_DIMENSIONS = ['litigationRisk', 'greenwashingRisk', 'disclosureRisk', 'regulatoryRisk', 'reputationalRisk', 'precedentRisk'];
const RISK_LABELS = { litigationRisk: 'Litigation', greenwashingRisk: 'Greenwashing', disclosureRisk: 'Disclosure', regulatoryRisk: 'Regulatory', reputationalRisk: 'Reputational', precedentRisk: 'Precedent' };
const SCENARIO_COLORS = [T.blue, T.red, T.orange];

const TABS = ['Legal Intelligence Dashboard', 'Entity Legal Profile', 'Jurisdiction Intelligence', 'Precedent Database', 'Risk Dimension Analysis', 'Legal Cost Forecast', 'Summary & Export'];

export default function ClimateLegalIntelligenceDashboardPage() {
  const [activeTab, setActiveTab] = useState(0);
  const [sectorFilter, setSectorFilter] = useState('All');
  const [jurFilter, setJurFilter] = useState('All');
  const [externalCounselFilter, setExternalCounselFilter] = useState('All');
  const [activeCasesFilter, setActiveCasesFilter] = useState(false);
  const [readinessMin, setReadinessMin] = useState(0);
  const [search, setSearch] = useState('');
  const [sortCol, setSortCol] = useState('compositeLegalRisk');
  const [sortDir, setSortDir] = useState('desc');
  const [drillEntity, setDrillEntity] = useState(null);
  const [selectedScenario, setSelectedScenario] = useState('All');
  const [dimWeights, setDimWeights] = useState({ litigationRisk: 20, greenwashingRisk: 20, disclosureRisk: 15, regulatoryRisk: 20, reputationalRisk: 15, precedentRisk: 10 });
  const [precSortCol, setPrecSortCol] = useState('impactScore');
  const [precSortDir, setPrecSortDir] = useState('desc');

  const filtered = useMemo(() => {
    if (!ENTITIES.length) return [];
    let arr = [...ENTITIES];
    if (sectorFilter !== 'All') arr = arr.filter(e => e.sector === sectorFilter);
    if (jurFilter !== 'All') arr = arr.filter(e => e.jurisdictions.includes(jurFilter));
    if (externalCounselFilter !== 'All') arr = arr.filter(e => e.externalCounsel === externalCounselFilter);
    if (activeCasesFilter) arr = arr.filter(e => e.activeCases > 0);
    if (search) arr = arr.filter(e => e.name.toLowerCase().includes(search.toLowerCase()));
    arr = arr.filter(e => e.legalReadinessScore >= readinessMin);
    return [...arr].sort((a, b) => {
      const av = a[sortCol], bv = b[sortCol];
      if (typeof av === 'number') return sortDir === 'asc' ? av - bv : bv - av;
      return sortDir === 'asc' ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av));
    });
  }, [sectorFilter, jurFilter, externalCounselFilter, activeCasesFilter, readinessMin, search, sortCol, sortDir]);

  const top20 = useMemo(() => [...ENTITIES].sort((a, b) => b.compositeLegalRisk - a.compositeLegalRisk).slice(0, 20), []);

  const riskDist = useMemo(() => [[0, 25], [25, 50], [50, 70], [70, 85], [85, 100]].map(([lo, hi]) => ({
    range: `${lo}-${hi}`,
    count: filtered.filter(e => e.compositeLegalRisk >= lo && e.compositeLegalRisk < hi).length,
  })), [filtered]);

  const weightedComposite = useMemo(() => {
    const totalWeight = Object.values(dimWeights).reduce((s, v) => s + v, 0);
    if (!totalWeight) return filtered.map(e => ({ ...e, weightedScore: e.compositeLegalRisk }));
    return filtered.map(e => {
      const weightedScore = Math.round(RISK_DIMENSIONS.reduce((s, d) => s + e[d] * dimWeights[d], 0) / totalWeight);
      return { ...e, weightedScore };
    });
  }, [filtered, dimWeights]);

  const jurStats = useMemo(() => [...JUR_INTELLIGENCE].sort((a, b) => b.legalMaturityScore - a.legalMaturityScore), []);

  const sortedPrecedents = useMemo(() => [...KEY_PRECEDENTS].sort((a, b) => {
    const av = a[precSortCol], bv = b[precSortCol];
    if (typeof av === 'number') return precSortDir === 'asc' ? av - bv : bv - av;
    return precSortDir === 'asc' ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av));
  }), [precSortCol, precSortDir]);

  const sectorDimAvg = useMemo(() => SECTORS.map(s => {
    const ents = ENTITIES.filter(e => e.sector === s);
    if (!ents.length) return null;
    const obj = { sector: s };
    RISK_DIMENSIONS.forEach(d => { obj[d] = Math.round(ents.reduce((sum, e) => sum + e[d], 0) / Math.max(1, ents.length)); });
    return obj;
  }).filter(Boolean), []);

  const radarData = useMemo(() => {
    if (!drillEntity) return [];
    return RISK_DIMENSIONS.map(d => ({ subject: RISK_LABELS[d], score: drillEntity[d], fullMark: 100 }));
  }, [drillEntity]);

  const forecastData = useMemo(() => {
    if (selectedScenario !== 'All') {
      return FORECAST_DATA.map(d => ({ year: d.year, value: d[selectedScenario] }));
    }
    return FORECAST_DATA;
  }, [selectedScenario]);

  const insuranceAdequacy = useMemo(() => ENTITIES.map(e => {
    const netVaR = e.netLegalVaR;
    const gap = e.pendingLitigationM * e.compositeLegalRisk / 100 - e.insuranceCoverageM * 0.8;
    return { name: e.name, netVaR, gap: Math.max(0, gap), coverage: e.insuranceCoverageM };
  }).sort((a, b) => b.gap - a.gap).slice(0, 20), []);

  const handleSort = useCallback(col => {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortCol(col); setSortDir('desc'); }
  }, [sortCol]);

  const avgComposite = filtered.length ? (filtered.reduce((s, e) => s + e.compositeLegalRisk, 0) / Math.max(1, filtered.length)).toFixed(1) : '0';
  const totalNetVaR = filtered.reduce((s, e) => s + e.netLegalVaR, 0);

  return (
    <div style={{ background: T.bg, minHeight: '100vh', padding: 24, fontFamily: 'DM Sans, sans-serif', color: T.text }}>
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
            <div style={{ background: T.purple, borderRadius: 8, width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 12 }}>EP</div>
            <div>
              <div style={{ fontSize: 10, color: T.muted, letterSpacing: 1, textTransform: 'uppercase' }}>EP-DA6 · Disclosure & Stranded Asset Analytics</div>
              <h1 style={{ fontSize: 21, fontWeight: 700, margin: 0 }}>Climate Legal Intelligence Dashboard</h1>
            </div>
          </div>
          <div style={{ fontSize: 12, color: T.muted }}>100 entities · 6 legal risk dimensions · 25 jurisdictions · 30 key precedents · 2025-2035 litigation forecast · insurance adequacy</div>
        </div>

        <div style={{ display: 'flex', gap: 2, marginBottom: 20, borderBottom: `2px solid ${T.border}`, overflowX: 'auto', paddingBottom: 1 }}>
          {TABS.map((t, i) => (
            <button key={t} onClick={() => setActiveTab(i)} style={{ padding: '8px 14px', border: 'none', background: activeTab === i ? T.purple : 'transparent', color: activeTab === i ? '#fff' : T.muted, borderRadius: '6px 6px 0 0', cursor: 'pointer', fontWeight: activeTab === i ? 600 : 400, fontSize: 12, whiteSpace: 'nowrap' }}>{t}</button>
          ))}
        </div>

        {/* Filters */}
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 14, marginBottom: 14, display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'flex-end' }}>
          <div>
            <div style={{ fontSize: 10, color: T.muted, marginBottom: 3 }}>Search</div>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Entity name..." style={{ padding: '5px 9px', border: `1px solid ${T.border}`, borderRadius: 4, fontSize: 12, width: 150 }} />
          </div>
          <div>
            <div style={{ fontSize: 10, color: T.muted, marginBottom: 3 }}>Sector</div>
            <select value={sectorFilter} onChange={e => setSectorFilter(e.target.value)} style={{ padding: '5px 9px', border: `1px solid ${T.border}`, borderRadius: 4, fontSize: 12 }}>
              <option>All</option>
              {SECTORS.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <div style={{ fontSize: 10, color: T.muted, marginBottom: 3 }}>Jurisdiction</div>
            <select value={jurFilter} onChange={e => setJurFilter(e.target.value)} style={{ padding: '5px 9px', border: `1px solid ${T.border}`, borderRadius: 4, fontSize: 12 }}>
              <option>All</option>
              {COUNTRIES_100.map(j => <option key={j}>{j}</option>)}
            </select>
          </div>
          <div>
            <div style={{ fontSize: 10, color: T.muted, marginBottom: 3 }}>External Counsel</div>
            <select value={externalCounselFilter} onChange={e => setExternalCounselFilter(e.target.value)} style={{ padding: '5px 9px', border: `1px solid ${T.border}`, borderRadius: 4, fontSize: 12 }}>
              <option>All</option>
              {LEGAL_READINESS.map(l => <option key={l}>{l}</option>)}
            </select>
          </div>
          <div>
            <div style={{ fontSize: 10, color: T.muted, marginBottom: 3 }}>Min Readiness: {readinessMin}</div>
            <input type="range" min={0} max={80} value={readinessMin} onChange={e => setReadinessMin(+e.target.value)} style={{ width: 90 }} />
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, cursor: 'pointer' }}>
            <input type="checkbox" checked={activeCasesFilter} onChange={e => setActiveCasesFilter(e.target.checked)} />Active Cases Only
          </label>
          <div style={{ fontSize: 11, color: T.muted, marginLeft: 'auto' }}>{filtered.length}/100</div>
        </div>

        {/* Drill-down Panel */}
        {drillEntity && (
          <div style={{ background: T.card, border: `2px solid ${T.purple}`, borderRadius: 8, padding: 16, marginBottom: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ fontWeight: 700, fontSize: 15 }}>{drillEntity.name} — Legal Intelligence Profile</div>
              <button onClick={() => setDrillEntity(null)} style={{ background: T.red, color: '#fff', border: 'none', borderRadius: 4, padding: '3px 10px', cursor: 'pointer', fontSize: 12 }}>Close</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 12 }}>
              <KpiCard label="Composite Risk" value={drillEntity.compositeLegalRisk} color={riskColor(drillEntity.compositeLegalRisk)} />
              <KpiCard label="Net Legal VaR" value={`$${drillEntity.netLegalVaR}M`} color={T.red} />
              <KpiCard label="Active Cases" value={drillEntity.activeCases} />
              <KpiCard label="Legal Readiness" value={drillEntity.legalReadinessScore} color={riskColor(100 - drillEntity.legalReadinessScore)} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 16 }}>
              <div>
                {[['Sector', drillEntity.sector], ['Country', drillEntity.country], ['Jurisdictions', drillEntity.jurisdictions.join(', ')], ['External Counsel', drillEntity.externalCounsel], ['Legal Team', `${drillEntity.legalTeamSize} pax`], ['Pending Litigation', `$${drillEntity.pendingLitigationM}M`], ['Fine Exposure', `$${drillEntity.fineExposureM}M`], ['Insurance Coverage', `$${drillEntity.insuranceCoverageM}M`]].map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '4px 0', borderBottom: `1px solid ${T.border}` }}>
                    <span style={{ color: T.muted }}>{k}</span><span style={{ fontWeight: 600, maxWidth: 180, textAlign: 'right' }}>{v}</span>
                  </div>
                ))}
              </div>
              <div>
                <div style={{ fontWeight: 600, marginBottom: 8, fontSize: 12 }}>Risk Dimension Breakdown</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                  {RISK_DIMENSIONS.map(d => (
                    <div key={d} style={{ background: riskColor(drillEntity[d]) + '12', border: `1px solid ${riskColor(drillEntity[d])}30`, borderRadius: 6, padding: 8, textAlign: 'center' }}>
                      <div style={{ fontSize: 10, color: T.muted, marginBottom: 3 }}>{RISK_LABELS[d]}</div>
                      <div style={{ fontSize: 20, fontWeight: 700, color: riskColor(drillEntity[d]) }}>{drillEntity[d]}</div>
                      <div style={{ height: 3, background: T.border, borderRadius: 2, marginTop: 4 }}>
                        <div style={{ height: 3, width: `${drillEntity[d]}%`, background: riskColor(drillEntity[d]), borderRadius: 2 }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 0: Legal Intelligence Dashboard ── */}
        {activeTab === 0 && (
          <div>
            <div style={{ display: 'flex', gap: 12, marginBottom: 18, flexWrap: 'wrap' }}>
              <KpiCard label="Entities Monitored" value={filtered.length} />
              <KpiCard label="Avg Composite Risk" value={avgComposite} color={riskColor(+avgComposite)} />
              <KpiCard label="Total Net Legal VaR" value={fmtUSD(totalNetVaR * 1e6)} color={T.red} />
              <KpiCard label="Active Cases" value={filtered.reduce((s, e) => s + e.activeCases, 0)} color={T.orange} />
              <KpiCard label="High Risk (>70)" value={filtered.filter(e => e.compositeLegalRisk >= 70).length} color={T.red} />
              <KpiCard label="Big Law Coverage" value={filtered.filter(e => e.externalCounsel === 'Big Law').length} color={T.green} />
              <KpiCard label="Jurisdictions" value={JURISDICTIONS_25.length} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, marginBottom: 18 }}>
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 14 }}>
                <div style={{ fontWeight: 600, marginBottom: 10, fontSize: 13 }}>Composite Risk Score Distribution</div>
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
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 8 }} width={85} />
                    <Tooltip />
                    <Bar dataKey="compositeLegalRisk" name="Composite Risk" radius={[0, 4, 4, 0]}>
                      {top20.map((e, i) => <Cell key={i} fill={riskColor(e.compositeLegalRisk)} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 14 }}>
                <div style={{ fontWeight: 600, marginBottom: 10, fontSize: 13 }}>Avg Risk by Sector</div>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={SECTORS.map(s => { const ents = filtered.filter(e => e.sector === s); return { sector: s, avg: ents.length ? Math.round(ents.reduce((a, e) => a + e.compositeLegalRisk, 0) / Math.max(1, ents.length)) : 0 }; }).filter(d => d.avg > 0)}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="sector" tick={{ fontSize: 9 }} angle={-25} textAnchor="end" height={45} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="avg" name="Avg Risk" radius={[4, 4, 0, 0]}>
                      {SECTORS.map((s, i) => <Cell key={i} fill={T.purple} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 14 }}>
                <div style={{ fontWeight: 600, marginBottom: 10, fontSize: 13 }}>Net Legal VaR by Sector ($M)</div>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={SECTORS.map(s => { const ents = filtered.filter(e => e.sector === s); return { sector: s, varM: ents.reduce((a, e) => a + e.netLegalVaR, 0) }; }).filter(d => d.varM > 0).sort((a, b) => b.varM - a.varM)}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="sector" tick={{ fontSize: 9 }} angle={-25} textAnchor="end" height={45} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip formatter={v => [`$${v}M`, 'Net VaR']} />
                    <Bar dataKey="varM" name="Net VaR ($M)" fill={T.red} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 1: Entity Legal Profile ── */}
        {activeTab === 1 && (
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 14 }}>
            <div style={{ fontWeight: 600, marginBottom: 10, fontSize: 13 }}>Entity Legal Profile — {filtered.length} records</div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                <thead>
                  <tr style={{ background: T.sub }}>
                    {[['name', 'Name'], ['sector', 'Sector'], ['country', 'Country'], ['compositeLegalRisk', 'Composite Risk'], ['netLegalVaR', 'Net VaR ($M)'], ['activeCases', 'Active Cases'], ['legalReadinessScore', 'Readiness'], ['externalCounsel', 'Counsel']].map(([col, label]) => (
                      <th key={col} onClick={() => handleSort(col)} style={{ padding: '7px 8px', textAlign: 'left', cursor: 'pointer', borderBottom: `2px solid ${T.border}`, color: sortCol === col ? T.purple : T.text, userSelect: 'none', whiteSpace: 'nowrap', fontSize: 11 }}>
                        {label} {sortCol === col ? (sortDir === 'asc' ? '▲' : '▼') : ''}
                      </th>
                    ))}
                    {RISK_DIMENSIONS.map(d => <th key={d} style={{ padding: '7px 6px', textAlign: 'center', borderBottom: `2px solid ${T.border}`, fontSize: 9, whiteSpace: 'nowrap' }}>{RISK_LABELS[d]}</th>)}
                    <th style={{ padding: '7px 8px' }}>Detail</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.slice(0, 100).map((e, i) => (
                    <tr key={e.id} style={{ background: i % 2 === 0 ? T.bg : T.card, borderBottom: `1px solid ${T.border}` }}>
                      <td style={{ padding: '6px 8px', fontWeight: 600, whiteSpace: 'nowrap' }}>{e.name}</td>
                      <td style={{ padding: '6px 8px' }}>{e.sector}</td>
                      <td style={{ padding: '6px 8px' }}>{e.country}</td>
                      <td style={{ padding: '6px 8px' }}><RiskBadge val={e.compositeLegalRisk} /></td>
                      <td style={{ padding: '6px 8px', fontWeight: 600, color: T.red }}>${e.netLegalVaR}M</td>
                      <td style={{ padding: '6px 8px', textAlign: 'center' }}>{e.activeCases}</td>
                      <td style={{ padding: '6px 8px', textAlign: 'center', color: e.legalReadinessScore < 40 ? T.red : T.muted }}>{e.legalReadinessScore}</td>
                      <td style={{ padding: '6px 8px', fontSize: 10 }}>{e.externalCounsel}</td>
                      {RISK_DIMENSIONS.map(d => (
                        <td key={d} style={{ padding: '6px 6px', textAlign: 'center' }}>
                          <div style={{ width: 24, height: 16, background: riskColor(e[d]) + '40', borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 600, color: riskColor(e[d]) }}>{e[d]}</div>
                        </td>
                      ))}
                      <td style={{ padding: '6px 8px' }}>
                        <button onClick={() => setDrillEntity(e)} style={{ background: T.purple, color: '#fff', border: 'none', borderRadius: 3, padding: '2px 7px', fontSize: 10, cursor: 'pointer' }}>View</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── TAB 2: Jurisdiction Intelligence ── */}
        {activeTab === 2 && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: 18, marginBottom: 18 }}>
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 14 }}>
                <div style={{ fontWeight: 600, marginBottom: 10, fontSize: 13 }}>Legal Maturity Score by Jurisdiction</div>
                <ResponsiveContainer width="100%" height={340}>
                  <BarChart data={jurStats} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10 }} />
                    <YAxis type="category" dataKey="jurisdiction" tick={{ fontSize: 9 }} width={80} />
                    <Tooltip />
                    <Bar dataKey="legalMaturityScore" name="Maturity" radius={[0, 4, 4, 0]}>
                      {jurStats.map((d, i) => <Cell key={i} fill={riskColor(d.legalMaturityScore)} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 14 }}>
                <div style={{ fontWeight: 600, marginBottom: 10, fontSize: 13 }}>Case Volume by Jurisdiction</div>
                <ResponsiveContainer width="100%" height={340}>
                  <BarChart data={jurStats} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis type="number" tick={{ fontSize: 10 }} />
                    <YAxis type="category" dataKey="jurisdiction" tick={{ fontSize: 9 }} width={80} />
                    <Tooltip />
                    <Bar dataKey="caseCount" name="Cases" fill={T.blue} radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 14 }}>
              <div style={{ fontWeight: 600, marginBottom: 10, fontSize: 13 }}>Jurisdiction Intelligence Table</div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                  <thead>
                    <tr style={{ background: T.sub }}>
                      {['Jurisdiction', 'Maturity Score', 'Cases', 'Damages ($M)', 'Active Prec.', 'Climate Const.', 'Liability Std.', 'Court Recept.'].map(h => <th key={h} style={{ padding: '7px 8px', textAlign: 'left', borderBottom: `2px solid ${T.border}`, whiteSpace: 'nowrap' }}>{h}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {jurStats.map((j, i) => (
                      <tr key={j.jurisdiction} style={{ background: i % 2 === 0 ? T.bg : T.card, borderBottom: `1px solid ${T.border}` }}>
                        <td style={{ padding: '6px 8px', fontWeight: 600 }}>{j.jurisdiction}</td>
                        <td style={{ padding: '6px 8px' }}><RiskBadge val={j.legalMaturityScore} /></td>
                        <td style={{ padding: '6px 8px', textAlign: 'center' }}>{j.caseCount}</td>
                        <td style={{ padding: '6px 8px' }}>${j.totalDamagesM}M</td>
                        <td style={{ padding: '6px 8px', textAlign: 'center' }}>{j.activePrecedents}</td>
                        <td style={{ padding: '6px 8px', textAlign: 'center' }}>{j.climateConstitutionalization ? <span style={{ color: T.green }}>✓</span> : <span style={{ color: T.muted }}>—</span>}</td>
                        <td style={{ padding: '6px 8px' }}>{j.liabilityStandard}</td>
                        <td style={{ padding: '6px 8px', textAlign: 'center', color: riskColor(j.courtReceptiveness) }}>{j.courtReceptiveness}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 3: Precedent Database ── */}
        {activeTab === 3 && (
          <div>
            <div style={{ display: 'flex', gap: 12, marginBottom: 18, flexWrap: 'wrap' }}>
              <KpiCard label="Key Precedents" value={KEY_PRECEDENTS.length} />
              <KpiCard label="Avg Impact Score" value={Math.round(KEY_PRECEDENTS.reduce((s, p) => s + p.impactScore, 0) / Math.max(1, KEY_PRECEDENTS.length))} color={T.amber} />
              <KpiCard label="Total Damages" value={fmtUSD(KEY_PRECEDENTS.reduce((s, p) => s + p.damagesM, 0) * 1e6)} color={T.red} />
              <KpiCard label="Plaintiff Wins" value={KEY_PRECEDENTS.filter(p => p.outcome === 'Plaintiff Win').length} color={T.red} />
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 14, marginBottom: 18 }}>
              <div style={{ fontWeight: 600, marginBottom: 10, fontSize: 13 }}>Impact Score by Precedent</div>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={[...KEY_PRECEDENTS].sort((a, b) => b.impactScore - a.impactScore)}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="caseName" tick={false} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v, n, p) => [v, p.payload.caseName]} />
                  <Bar dataKey="impactScore" name="Impact Score" radius={[4, 4, 0, 0]}>
                    {[...KEY_PRECEDENTS].sort((a, b) => b.impactScore - a.impactScore).map((p, i) => <Cell key={i} fill={riskColor(p.impactScore)} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 14 }}>
              <div style={{ fontWeight: 600, marginBottom: 10, fontSize: 13 }}>Precedent Case Table</div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                  <thead>
                    <tr style={{ background: T.sub }}>
                      {[['caseName', 'Case Name'], ['jurisdiction', 'Jur.'], ['year', 'Year'], ['claimType', 'Claim Type'], ['outcome', 'Outcome'], ['damagesM', 'Damages ($M)'], ['impactScore', 'Impact']].map(([col, label]) => (
                        <th key={col} onClick={() => { if (precSortCol === col) setPrecSortDir(d => d === 'asc' ? 'desc' : 'asc'); else { setPrecSortCol(col); setPrecSortDir('desc'); } }} style={{ padding: '7px 8px', textAlign: 'left', cursor: 'pointer', borderBottom: `2px solid ${T.border}`, color: precSortCol === col ? T.purple : T.text, userSelect: 'none', whiteSpace: 'nowrap' }}>
                          {label} {precSortCol === col ? (precSortDir === 'asc' ? '▲' : '▼') : ''}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sortedPrecedents.map((p, i) => (
                      <tr key={p.id} style={{ background: i % 2 === 0 ? T.bg : T.card, borderBottom: `1px solid ${T.border}` }}>
                        <td style={{ padding: '6px 8px', fontWeight: 600, fontSize: 10, maxWidth: 180 }}>{p.caseName}</td>
                        <td style={{ padding: '6px 8px' }}>{p.jurisdiction}</td>
                        <td style={{ padding: '6px 8px' }}>{p.year}</td>
                        <td style={{ padding: '6px 8px', fontSize: 10 }}>{p.claimType}</td>
                        <td style={{ padding: '6px 8px', fontWeight: 600, color: p.outcome === 'Plaintiff Win' ? T.red : p.outcome === 'Defendant Win' ? T.green : T.amber, fontSize: 10 }}>{p.outcome}</td>
                        <td style={{ padding: '6px 8px', fontWeight: 600, color: T.red }}>${p.damagesM}M</td>
                        <td style={{ padding: '6px 8px' }}><RiskBadge val={p.impactScore} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 4: Risk Dimension Analysis ── */}
        {activeTab === 4 && (
          <div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 14, marginBottom: 14 }}>
              <div style={{ fontWeight: 600, marginBottom: 10, fontSize: 13 }}>Select Entity for Radar Analysis</div>
              <select value={drillEntity?.id || ''} onChange={e => setDrillEntity(ENTITIES.find(x => x.id === +e.target.value) || null)} style={{ padding: '6px 10px', border: `1px solid ${T.border}`, borderRadius: 4, fontSize: 12, width: 260 }}>
                <option value="">-- Select Entity --</option>
                {ENTITIES.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
              </select>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, marginBottom: 18 }}>
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 14 }}>
                <div style={{ fontWeight: 600, marginBottom: 8, fontSize: 13 }}>Risk Dimension Radar — {drillEntity?.name || 'Select Entity'}</div>
                {drillEntity ? (
                  <ResponsiveContainer width="100%" height={280}>
                    <RadarChart data={radarData}>
                      <PolarGrid stroke={T.border} />
                      <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10 }} />
                      <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 8 }} />
                      <Radar name="Risk Score" dataKey="score" stroke={T.purple} fill={T.purple} fillOpacity={0.3} />
                      <Tooltip />
                    </RadarChart>
                  </ResponsiveContainer>
                ) : <div style={{ height: 280, display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.muted, fontSize: 12 }}>Select an entity to view radar</div>}
              </div>
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 14 }}>
                <div style={{ fontWeight: 600, marginBottom: 10, fontSize: 13 }}>Weighted Composite Calculator</div>
                <div style={{ fontSize: 11, color: T.muted, marginBottom: 10 }}>Adjust dimension weights (total = 100%)</div>
                {RISK_DIMENSIONS.map(d => (
                  <div key={d} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                    <span style={{ fontSize: 11, width: 100, color: T.muted }}>{RISK_LABELS[d]}</span>
                    <input type="range" min={0} max={40} value={dimWeights[d]} onChange={e => setDimWeights(prev => ({ ...prev, [d]: +e.target.value }))} style={{ flex: 1 }} />
                    <span style={{ fontSize: 11, fontWeight: 600, width: 30, textAlign: 'right' }}>{dimWeights[d]}%</span>
                  </div>
                ))}
                <div style={{ background: T.sub, borderRadius: 6, padding: 10, marginTop: 12 }}>
                  <div style={{ fontSize: 11, color: T.muted, marginBottom: 4 }}>Total Weight: {Object.values(dimWeights).reduce((s, v) => s + v, 0)}%</div>
                  {drillEntity && (
                    <div style={{ fontSize: 14, fontWeight: 700, color: T.purple }}>
                      Weighted Score: {Math.round(RISK_DIMENSIONS.reduce((s, d) => s + drillEntity[d] * dimWeights[d], 0) / Math.max(1, Object.values(dimWeights).reduce((s, v) => s + v, 0)))}
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 14 }}>
              <div style={{ fontWeight: 600, marginBottom: 10, fontSize: 13 }}>Sector Comparison — Avg Risk by Dimension</div>
              <ResponsiveContainer width="100%" height={230}>
                <BarChart data={sectorDimAvg}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="sector" tick={{ fontSize: 10 }} angle={-25} textAnchor="end" height={45} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="litigationRisk" name="Litigation" fill={T.red} />
                  <Bar dataKey="greenwashingRisk" name="Greenwashing" fill={T.green} />
                  <Bar dataKey="regulatoryRisk" name="Regulatory" fill={T.blue} />
                  <Legend />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* ── TAB 5: Legal Cost Forecast ── */}
        {activeTab === 5 && (
          <div>
            <div style={{ display: 'flex', gap: 12, marginBottom: 18, flexWrap: 'wrap' }}>
              {SCENARIOS.map((sc, si) => (
                <KpiCard key={sc} label={sc} value={`$${FORECAST_DATA[FORECAST_DATA.length - 1][sc]}M (2035)`} color={SCENARIO_COLORS[si]} sub={`CAGR: ${(SCENARIO_CAGR[si] * 100).toFixed(0)}%`} />
              ))}
            </div>
            <div style={{ display: 'flex', gap: 10, marginBottom: 14, alignItems: 'center' }}>
              <span style={{ fontSize: 12, color: T.muted }}>Scenario:</span>
              <select value={selectedScenario} onChange={e => setSelectedScenario(e.target.value)} style={{ padding: '5px 9px', border: `1px solid ${T.border}`, borderRadius: 4, fontSize: 12 }}>
                <option>All</option>
                {SCENARIOS.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 14, marginBottom: 18 }}>
              <div style={{ fontWeight: 600, marginBottom: 10, fontSize: 13 }}>Climate Litigation Cost Forecast 2025-2035 ($M)</div>
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={FORECAST_DATA}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  {SCENARIOS.map((sc, si) => (
                    <Line key={sc} type="monotone" dataKey={sc} stroke={SCENARIO_COLORS[si]} strokeWidth={2} dot={{ r: 3 }} strokeDasharray={si === 2 ? '5 5' : si === 1 ? '3 3' : undefined} />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 14 }}>
                <div style={{ fontWeight: 600, marginBottom: 10, fontSize: 13 }}>Insurance Adequacy — Top 20 Gap Entities ($M)</div>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={insuranceAdequacy} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis type="number" tick={{ fontSize: 10 }} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 8 }} width={80} />
                    <Tooltip />
                    <Bar dataKey="coverage" name="Insurance ($M)" fill={T.green} radius={[0, 4, 4, 0]} />
                    <Bar dataKey="gap" name="Uncovered Gap ($M)" fill={T.red} radius={[0, 4, 4, 0]} />
                    <Legend />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 14 }}>
                <div style={{ fontWeight: 600, marginBottom: 10, fontSize: 13 }}>Litigation Cost Trajectory Table</div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                  <thead>
                    <tr style={{ background: T.sub }}>
                      <th style={{ padding: '6px 8px', textAlign: 'left', borderBottom: `2px solid ${T.border}` }}>Year</th>
                      {SCENARIOS.map((sc, si) => <th key={sc} style={{ padding: '6px 8px', textAlign: 'center', borderBottom: `2px solid ${T.border}`, color: SCENARIO_COLORS[si], fontSize: 10 }}>{sc}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {FORECAST_DATA.map((d, i) => (
                      <tr key={d.year} style={{ background: i % 2 === 0 ? T.bg : T.card, borderBottom: `1px solid ${T.border}` }}>
                        <td style={{ padding: '5px 8px', fontWeight: 700 }}>{d.year}</td>
                        {SCENARIOS.map((sc, si) => <td key={sc} style={{ padding: '5px 8px', textAlign: 'center', fontWeight: 600, color: SCENARIO_COLORS[si] }}>${d[sc]}M</td>)}
                      </tr>
                    ))}
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
              <KpiCard label="Jurisdictions" value={JURISDICTIONS_25.length} />
              <KpiCard label="Key Precedents" value={KEY_PRECEDENTS.length} />
              <KpiCard label="Avg Composite Risk" value={avgComposite} color={riskColor(+avgComposite)} />
              <KpiCard label="Total Net Legal VaR" value={fmtUSD(totalNetVaR * 1e6)} color={T.red} />
              <KpiCard label="Total Active Cases" value={ENTITIES.reduce((s, e) => s + e.activeCases, 0)} color={T.orange} />
              <KpiCard label="Big Law Coverage" value={ENTITIES.filter(e => e.externalCounsel === 'Big Law').length} color={T.green} />
              <KpiCard label="High Risk (>70)" value={ENTITIES.filter(e => e.compositeLegalRisk >= 70).length} color={T.red} />
              <KpiCard label="Climate Const. Jurs" value={JUR_INTELLIGENCE.filter(j => j.climateConstitutionalization).length} color={T.teal} />
              <KpiCard label="Avg Readiness" value={Math.round(ENTITIES.reduce((s, e) => s + e.legalReadinessScore, 0) / Math.max(1, ENTITIES.length))} color={T.amber} />
              <KpiCard label="Plaintiff Wins" value={KEY_PRECEDENTS.filter(p => p.outcome === 'Plaintiff Win').length} color={T.red} />
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 14, marginBottom: 18 }}>
              <div style={{ fontWeight: 600, marginBottom: 10, fontSize: 13 }}>Full KPI Table — All 100 Entities by Composite Risk</div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 10 }}>
                  <thead>
                    <tr style={{ background: T.sub }}>
                      {['#', 'Name', 'Sector', 'Country', 'Comp.Risk', 'Net VaR($M)', 'Lit', 'GW', 'Disc', 'Reg', 'Rep', 'Prec', 'Active Cases', 'Readiness', 'Counsel', 'Insurance($M)'].map(h => <th key={h} style={{ padding: '5px 6px', textAlign: 'left', borderBottom: `2px solid ${T.border}`, whiteSpace: 'nowrap', fontSize: 10 }}>{h}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {[...ENTITIES].sort((a, b) => b.compositeLegalRisk - a.compositeLegalRisk).map((e, i) => (
                      <tr key={e.id} style={{ background: i % 2 === 0 ? T.bg : T.card, borderBottom: `1px solid ${T.border}` }}>
                        <td style={{ padding: '3px 6px' }}>{i + 1}</td>
                        <td style={{ padding: '3px 6px', fontWeight: 600, whiteSpace: 'nowrap' }}>{e.name}</td>
                        <td style={{ padding: '3px 6px' }}>{e.sector}</td>
                        <td style={{ padding: '3px 6px' }}>{e.country}</td>
                        <td style={{ padding: '3px 6px' }}><RiskBadge val={e.compositeLegalRisk} /></td>
                        <td style={{ padding: '3px 6px', fontWeight: 600, color: T.red }}>${e.netLegalVaR}M</td>
                        <td style={{ padding: '3px 6px', textAlign: 'center', color: riskColor(e.litigationRisk) }}>{e.litigationRisk}</td>
                        <td style={{ padding: '3px 6px', textAlign: 'center', color: riskColor(e.greenwashingRisk) }}>{e.greenwashingRisk}</td>
                        <td style={{ padding: '3px 6px', textAlign: 'center', color: riskColor(e.disclosureRisk) }}>{e.disclosureRisk}</td>
                        <td style={{ padding: '3px 6px', textAlign: 'center', color: riskColor(e.regulatoryRisk) }}>{e.regulatoryRisk}</td>
                        <td style={{ padding: '3px 6px', textAlign: 'center', color: riskColor(e.reputationalRisk) }}>{e.reputationalRisk}</td>
                        <td style={{ padding: '3px 6px', textAlign: 'center', color: riskColor(e.precedentRisk) }}>{e.precedentRisk}</td>
                        <td style={{ padding: '3px 6px', textAlign: 'center' }}>{e.activeCases}</td>
                        <td style={{ padding: '3px 6px', textAlign: 'center', color: e.legalReadinessScore < 40 ? T.red : T.muted }}>{e.legalReadinessScore}</td>
                        <td style={{ padding: '3px 6px', fontSize: 9 }}>{e.externalCounsel}</td>
                        <td style={{ padding: '3px 6px' }}>${e.insuranceCoverageM}M</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
