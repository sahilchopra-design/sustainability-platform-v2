import React, { useState, useMemo, useCallback } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ComposedChart,
} from 'recharts';

const T = {
  bg: '#f8f6f0', card: '#ffffff', border: '#e2ded5', text: '#1a1a2e',
  sub: '#f6f4f0', muted: '#6b7280', indigo: '#4f46e5', gold: '#b8860b',
  green: '#16a34a', red: '#dc2626', blue: '#0369a1', amber: '#d97706',
  navy: '#1e3a5f', teal: '#0f766e', purple: '#7c3aed', orange: '#ea580c',
};
const sr = s => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };

const DOMAINS = ['Physical Risk','Transition Risk','Underwriting Risk','Reserve Adequacy','Solvency Capital','Regulatory Compliance','Climate Governance','Catastrophe Modelling'];
const DOMAIN_COLORS = ['#dc2626','#d97706','#4f46e5','#0369a1','#7c3aed','#16a34a','#0f766e','#ea580c'];
const MATERIALITY_RATINGS = ['Critical','High','Medium','Low'];
const DATA_SOURCES = ['Internal Models','Third-Party Data','Regulator Data','Market Data','Climate Science'];
const REGULATORS = ['EIOPA','FCA','APRA','PRA','MAS','NAIC','FSB','BIS','IAIS','CFTC'];

const DOMAIN_WEIGHTS_DEFAULT = [15, 15, 12, 12, 12, 12, 11, 11];

const KRIS = Array.from({ length: 40 }, (_, i) => {
  const domainIdx = Math.floor(sr(i * 19 + 1) * 8);
  const matIdx = Math.floor(sr(i * 19 + 2) * 4);
  const threshold = +(sr(i * 19 + 3) * 80 + 20).toFixed(1);
  const value = +(sr(i * 19 + 4) * 90 + 10).toFixed(1);
  const breaching = value > threshold;
  const trend = Array.from({ length: 5 }, (_, j) => +(value * (0.85 + sr(i * 19 + 5 + j) * 0.3)).toFixed(1));
  const peer = +(sr(i * 19 + 10) * 70 + 25).toFixed(1);
  return {
    id: i,
    name: [
      'Physical Risk Exposure Index','Transition Risk Score','Climate VaR 95%','Reserve Climate Loading',
      'NatCat SCR Loading','TCFD Disclosure Score','Board Climate Competence','Green Investment %',
      'Climate Stress Test Pass Rate','Stranded Asset Exposure %','Carbon Footprint (tCO2e/$M)',
      'Flood Zone Exposure','Wildfire Underwriting Concentration','Climate IBNR Gap',
      'Solvency Climate Stress Buffer','Regulatory Action Count','Climate Data Quality Score',
      'Scope 3 Financed Emissions','Biodiversity Exposure Score','Deforestation Premium Exposure',
      'Extreme Heat Mortality Loading','Cold Weather Mortality Trend','ORSA Climate Coverage %',
      'Reinsurance Climate Availability','Cat Model Update Frequency','Social Inflation Rate',
      'Demand Surge Preparedness','Climate Litigation Reserve','Directors Liability Climate',
      'Parametric Trigger Accuracy','Flood Re Cession Rate','Wildfire Re Availability',
      'Agricultural Climate Index','D&O Climate Exposure','PI Climate Claims Ratio',
      'Marine Climate Risk Loading','EL Climate Frequency Trend','Product Liability Green Gap',
      'Aviation Climate Disruption Index','Cyber-Climate Nexus Score',
    ][i],
    domain: DOMAINS[domainIdx],
    domainIdx,
    value,
    threshold,
    breaching,
    direction: sr(i * 19 + 11) > 0.5 ? 'Higher = Worse' : 'Lower = Worse',
    trend,
    peerBenchmark: +peer,
    materialityRating: MATERIALITY_RATINGS[matIdx],
    dataSource: DATA_SOURCES[Math.floor(sr(i * 19 + 12) * 5)],
    lastUpdated: `2026-0${Math.floor(sr(i * 19 + 13) * 3 + 1)}-${String(Math.floor(sr(i * 19 + 14) * 28 + 1)).padStart(2,'0')}`,
    description: `KRI measuring ${DOMAINS[domainIdx].toLowerCase()} exposure in the climate risk framework.`,
    remediationAction: ['Increase reserves by 15%','Conduct board review','Update stress test parameters','Engage reinsurer','File regulatory update','Implement monitoring system'][Math.floor(sr(i * 19 + 15) * 6)],
  };
});

const REGULATORY_MILESTONES = [
  { name: 'EIOPA Climate Risk Opinion 2026', regulator: 'EIOPA', due: '2026-06-30', status: 'Upcoming', jurisdiction: 'EU', priority: 'High', daysRemaining: 84 },
  { name: 'EIOPA Climate Stress Test', regulator: 'EIOPA', due: '2026-09-30', status: 'Upcoming', jurisdiction: 'EU', priority: 'Critical', daysRemaining: 176 },
  { name: 'FCA Insurance Climate Guidance', regulator: 'FCA', due: '2026-04-30', status: 'Imminent', jurisdiction: 'UK', priority: 'Critical', daysRemaining: 23 },
  { name: 'PRA Climate Scenario Analysis', regulator: 'PRA', due: '2026-07-15', status: 'Upcoming', jurisdiction: 'UK', priority: 'High', daysRemaining: 99 },
  { name: 'APRA CPG 229 Annual Review', regulator: 'APRA', due: '2026-08-31', status: 'Upcoming', jurisdiction: 'AU', priority: 'High', daysRemaining: 146 },
  { name: 'MAS Insurance Climate Framework', regulator: 'MAS', due: '2026-05-31', status: 'Upcoming', jurisdiction: 'SG', priority: 'Medium', daysRemaining: 54 },
  { name: 'NAIC Climate Risk Disclosure', regulator: 'NAIC', due: '2026-04-15', status: 'Imminent', jurisdiction: 'US', priority: 'High', daysRemaining: 8 },
  { name: 'CFTC Climate Risk Advisory', regulator: 'CFTC', due: '2026-10-31', status: 'Upcoming', jurisdiction: 'US', priority: 'Medium', daysRemaining: 207 },
  { name: 'FSB Climate Risk Framework v2', regulator: 'FSB', due: '2026-12-31', status: 'Upcoming', jurisdiction: 'Global', priority: 'Critical', daysRemaining: 268 },
  { name: 'BIS FSB Climate Risk Framework', regulator: 'BIS', due: '2026-11-30', status: 'Upcoming', jurisdiction: 'Global', priority: 'High', daysRemaining: 237 },
  { name: 'IAIS Holistic Framework Update', regulator: 'IAIS', due: '2026-09-15', status: 'Upcoming', jurisdiction: 'Global', priority: 'High', daysRemaining: 161 },
  { name: 'FSB TCFD Insurance Progress Report', regulator: 'FSB', due: '2026-05-15', status: 'Upcoming', jurisdiction: 'Global', priority: 'Medium', daysRemaining: 38 },
  { name: 'Lloyds Climate Exposure Mgmt 2025', regulator: 'Lloyd\'s', due: '2026-04-30', status: 'Imminent', jurisdiction: 'UK', priority: 'High', daysRemaining: 23 },
  { name: 'EIOPA NatCat Framework Update', regulator: 'EIOPA', due: '2026-07-31', status: 'Upcoming', jurisdiction: 'EU', priority: 'Medium', daysRemaining: 115 },
  { name: 'PRA Physical Risk Reporting', regulator: 'PRA', due: '2026-06-15', status: 'Upcoming', jurisdiction: 'UK', priority: 'Medium', daysRemaining: 69 },
  { name: 'APRA Climate Vulnerability Assessment', regulator: 'APRA', due: '2026-10-15', status: 'Upcoming', jurisdiction: 'AU', priority: 'High', daysRemaining: 191 },
  { name: 'MAS Transition Finance Guidance', regulator: 'MAS', due: '2026-08-31', status: 'Upcoming', jurisdiction: 'SG', priority: 'Low', daysRemaining: 146 },
  { name: 'NAIC Property Climate Guidance', regulator: 'NAIC', due: '2026-06-30', status: 'Upcoming', jurisdiction: 'US', priority: 'Medium', daysRemaining: 84 },
  { name: 'EIOPA Solvency II Climate Review', regulator: 'EIOPA', due: '2026-12-15', status: 'Upcoming', jurisdiction: 'EU', priority: 'Critical', daysRemaining: 252 },
  { name: 'FCA Insurance Market Climate Guidance', regulator: 'FCA', due: '2027-03-31', status: 'Future', jurisdiction: 'UK', priority: 'High', daysRemaining: 358 },
];

const PEER_INSURERS = ['AXA','Allianz','Zurich','Munich Re','Swiss Re','Berkshire Re','Lloyd\'s','AIG','Chubb','Generali'];
const PEER_SCORES = PEER_INSURERS.map((p, i) => DOMAINS.map((_, di) => +(sr(i * 89 + di + 1) * 45 + 40).toFixed(1)));

const KpiCard = ({ label, value, unit, color, bold }) => (
  <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: '14px 18px', flex: 1, minWidth: 130 }}>
    <div style={{ fontSize: 10, color: T.muted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>{label}</div>
    <div style={{ fontSize: bold ? 28 : 22, fontWeight: 700, color: color || T.text }}>{value}<span style={{ fontSize: 12, color: T.muted, marginLeft: 4 }}>{unit}</span></div>
  </div>
);

const TabBtn = ({ label, active, onClick }) => (
  <button onClick={onClick} style={{ padding: '7px 16px', background: active ? T.indigo : 'transparent', color: active ? '#fff' : T.muted, border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: active ? 700 : 400, fontSize: 12 }}>{label}</button>
);

export default function InsuranceClimateHubPage() {
  const [tab, setTab] = useState(0);
  const [domainFilter, setDomainFilter] = useState('All');
  const [breachFilter, setBreachFilter] = useState('All');
  const [matFilter, setMatFilter] = useState('All');
  const [regulatorFilter, setRegulatorFilter] = useState('All');
  const [peerCompare, setPeerCompare] = useState(false);
  const [dataSourceFilter, setDataSourceFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [searchMilestone, setSearchMilestone] = useState('');
  const [domainWeights, setDomainWeights] = useState([...DOMAIN_WEIGHTS_DEFAULT]);
  const [selectedDomain, setSelectedDomain] = useState(0);
  const [selectedPeer, setSelectedPeer] = useState(0);
  const [sortCol, setSortCol] = useState('value');
  const [sortAsc, setSortAsc] = useState(false);

  const totalWeight = domainWeights.reduce((a, b) => a + b, 0);

  const filteredKRIs = useMemo(() => {
    let d = KRIS;
    if (domainFilter !== 'All') d = d.filter(k => k.domain === domainFilter);
    if (breachFilter === 'Breaching') d = d.filter(k => k.breaching);
    if (breachFilter === 'Compliant') d = d.filter(k => !k.breaching);
    if (matFilter !== 'All') d = d.filter(k => k.materialityRating === matFilter);
    if (dataSourceFilter !== 'All') d = d.filter(k => k.dataSource === dataSourceFilter);
    if (search) d = d.filter(k => k.name.toLowerCase().includes(search.toLowerCase()));
    return d;
  }, [domainFilter, breachFilter, matFilter, dataSourceFilter, search]);

  const sortedKRIs = useMemo(() => {
    return [...filteredKRIs].sort((a, b) => sortAsc ? (a[sortCol] > b[sortCol] ? 1 : -1) : (a[sortCol] < b[sortCol] ? 1 : -1));
  }, [filteredKRIs, sortCol, sortAsc]);

  const filteredMilestones = useMemo(() => {
    let d = REGULATORY_MILESTONES;
    if (regulatorFilter !== 'All') d = d.filter(m => m.regulator === regulatorFilter);
    if (searchMilestone) d = d.filter(m => m.name.toLowerCase().includes(searchMilestone.toLowerCase()));
    return d;
  }, [regulatorFilter, searchMilestone]);

  const overallScore = useMemo(() => {
    if (totalWeight === 0) return 0;
    const domainScores = DOMAINS.map((domain, di) => {
      const domainKRIs = KRIS.filter(k => k.domainIdx === di);
      if (!domainKRIs.length) return 50;
      const avgValue = domainKRIs.reduce((s, k) => s + k.value, 0) / domainKRIs.length;
      return Math.min(100, Math.max(0, 100 - avgValue * 0.3));
    });
    const weightedSum = domainScores.reduce((s, score, i) => s + score * domainWeights[i], 0);
    return +(weightedSum / totalWeight).toFixed(1);
  }, [domainWeights, totalWeight]);

  const domainCards = useMemo(() => DOMAINS.map((domain, di) => {
    const kris = KRIS.filter(k => k.domainIdx === di);
    const breaching = kris.filter(k => k.breaching).length;
    const avgValue = kris.length ? +(kris.reduce((s, k) => s + k.value, 0) / kris.length).toFixed(1) : 0;
    const score = Math.min(100, Math.max(0, +(100 - avgValue * 0.3).toFixed(1)));
    return { domain, breaching, total: kris.length, avgValue, score };
  }), []);

  const trajectoryData = useMemo(() => Array.from({ length: 5 }, (_, ti) => {
    const obj = { period: `Q${ti + 1}` };
    DOMAINS.forEach((domain, di) => {
      const kris = KRIS.filter(k => k.domainIdx === di);
      if (!kris.length) { obj[domain.slice(0,8)] = 50; return; }
      const avg = kris.reduce((s, k) => s + (k.trend[ti] || k.value), 0) / kris.length;
      obj[domain.slice(0,8)] = +(100 - avg * 0.3).toFixed(1);
    });
    return obj;
  }), []);

  const breachData = useMemo(() => DOMAINS.map((domain, di) => ({
    domain: domain.slice(0, 14),
    breaching: KRIS.filter(k => k.domainIdx === di && k.breaching).length,
    compliant: KRIS.filter(k => k.domainIdx === di && !k.breaching).length,
  })), []);

  const peerRadarData = useMemo(() => DOMAINS.map((domain, di) => {
    const myScore = domainCards[di].score;
    const obj = { domain: domain.slice(0, 10), 'Our Score': myScore };
    PEER_INSURERS.forEach((p, pi) => { obj[p] = PEER_SCORES[pi][di]; });
    return obj;
  }), [domainCards]);

  const percentileRankings = useMemo(() => DOMAINS.map((domain, di) => {
    const myScore = domainCards[di].score;
    const peerScoresDomain = PEER_SCORES.map(ps => ps[di]);
    const rank = peerScoresDomain.filter(s => s < myScore).length + 1;
    const percentile = +((rank / (PEER_INSURERS.length + 1)) * 100).toFixed(1);
    const best = Math.max(...peerScoresDomain);
    return { domain: domain.slice(0, 14), myScore, percentile, best, gap: +(best - myScore).toFixed(1) };
  }), [domainCards]);

  const domainKRIs = useMemo(() => KRIS.filter(k => k.domainIdx === selectedDomain), [selectedDomain]);

  const boardDecisions = [
    { decision: 'Increase climate catastrophe reinsurance cession by 5%', urgency: 'Immediate', rationale: `${KRIS.filter(k => k.breaching && k.materialityRating === 'Critical').length} Critical KRI breaches identified` },
    { decision: 'Mandate ORSA climate scenario expansion to 10 scenarios', urgency: 'Q2 2026', rationale: 'Regulatory compliance gap with EIOPA Climate Stress Test' },
    { decision: 'Establish Climate Risk Committee with quarterly reporting', urgency: 'Q3 2026', rationale: 'Governance score below peer median in Climate Governance domain' },
  ];

  const stressImpacts = useMemo(() => [
    { scenario: 'Climate 1.5°C Orderly', overallScore: +(overallScore * 0.97).toFixed(1), kriBreaches: KRIS.filter(k => k.breaching).length },
    { scenario: 'Hot House World 3°C', overallScore: +(overallScore * 0.82).toFixed(1), kriBreaches: KRIS.filter(k => k.breaching).length + 7 },
    { scenario: 'NatCat Mega-Event', overallScore: +(overallScore * 0.75).toFixed(1), kriBreaches: KRIS.filter(k => k.breaching).length + 12 },
  ], [overallScore]);

  const regulatoryRisk = useMemo(() => {
    const overdue = REGULATORY_MILESTONES.filter(m => m.daysRemaining < 0).length;
    const imminent = REGULATORY_MILESTONES.filter(m => m.daysRemaining >= 0 && m.daysRemaining < 30).length;
    return +(overdue * 10 + imminent * 5).toFixed(0);
  }, []);

  const handleWeightChange = useCallback((i, val) => {
    setDomainWeights(prev => { const next = [...prev]; next[i] = val; return next; });
  }, []);

  const handleSort = useCallback((col) => {
    if (sortCol === col) setSortAsc(v => !v);
    else { setSortCol(col); setSortAsc(false); }
  }, [sortCol]);

  const TABS = ['Executive Overview','KRI Monitor','Regulatory Calendar','Peer Benchmarking','Domain Deep Dive','Board Report','Summary & Export'];
  const thS = (col) => ({ padding: '7px 8px', cursor: 'pointer', fontWeight: 700, fontSize: 11, borderBottom: `2px solid ${T.border}`, color: sortCol === col ? T.indigo : T.text, whiteSpace: 'nowrap', textAlign: 'left' });
  const tdS = { padding: '5px 8px', fontSize: 11 };

  return (
    <div style={{ background: T.bg, minHeight: '100vh', fontFamily: 'DM Sans, sans-serif', color: T.text, padding: 24 }}>
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 10, color: T.muted, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 4 }}>EP-DC6 · Sprint DC · Climate-Integrated Actuarial Intelligence Suite</div>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: T.navy, margin: '0 0 6px' }}>Insurance Climate Intelligence Hub</h1>
        <div style={{ fontSize: 12, color: T.muted }}>8 actuarial domains · 40 KRIs · 20 regulatory milestones · 10 peer benchmarks · board-ready reporting</div>
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16, background: T.card, padding: 14, borderRadius: 8, border: `1px solid ${T.border}`, alignItems: 'center' }}>
        <select value={domainFilter} onChange={e => setDomainFilter(e.target.value)} style={{ padding: '6px 10px', borderRadius: 6, border: `1px solid ${T.border}`, fontSize: 12 }}>
          <option>All</option>{DOMAINS.map(d => <option key={d}>{d}</option>)}
        </select>
        <select value={breachFilter} onChange={e => setBreachFilter(e.target.value)} style={{ padding: '6px 10px', borderRadius: 6, border: `1px solid ${T.border}`, fontSize: 12 }}>
          <option>All</option><option>Breaching</option><option>Compliant</option>
        </select>
        <select value={matFilter} onChange={e => setMatFilter(e.target.value)} style={{ padding: '6px 10px', borderRadius: 6, border: `1px solid ${T.border}`, fontSize: 12 }}>
          <option>All</option>{MATERIALITY_RATINGS.map(m => <option key={m}>{m}</option>)}
        </select>
        <select value={dataSourceFilter} onChange={e => setDataSourceFilter(e.target.value)} style={{ padding: '6px 10px', borderRadius: 6, border: `1px solid ${T.border}`, fontSize: 12 }}>
          <option>All</option>{DATA_SOURCES.map(d => <option key={d}>{d}</option>)}
        </select>
        <select value={regulatorFilter} onChange={e => setRegulatorFilter(e.target.value)} style={{ padding: '6px 10px', borderRadius: 6, border: `1px solid ${T.border}`, fontSize: 12 }}>
          <option>All</option>{REGULATORS.map(r => <option key={r}>{r}</option>)}
        </select>
        <input placeholder="Search KRIs…" value={search} onChange={e => setSearch(e.target.value)} style={{ padding: '6px 10px', borderRadius: 6, border: `1px solid ${T.border}`, fontSize: 12, width: 140 }} />
        <input placeholder="Search milestones…" value={searchMilestone} onChange={e => setSearchMilestone(e.target.value)} style={{ padding: '6px 10px', borderRadius: 6, border: `1px solid ${T.border}`, fontSize: 12, width: 160 }} />
        <label style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
          <input type="checkbox" checked={peerCompare} onChange={e => setPeerCompare(e.target.checked)} /> Peer Comparison
        </label>
      </div>

      <div style={{ display: 'flex', gap: 6, marginBottom: 20, flexWrap: 'wrap', background: T.card, padding: 8, borderRadius: 8, border: `1px solid ${T.border}` }}>
        {TABS.map((t, i) => <TabBtn key={t} label={t} active={tab === i} onClick={() => setTab(i)} />)}
      </div>

      {/* TAB 0: Executive Overview */}
      {tab === 0 && (
        <div>
          <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', alignItems: 'stretch' }}>
            <div style={{ background: T.card, border: `2px solid ${overallScore >= 70 ? T.green : overallScore >= 50 ? T.amber : T.red}`, borderRadius: 12, padding: '20px 28px', flex: '0 0 auto', textAlign: 'center' }}>
              <div style={{ fontSize: 10, color: T.muted, textTransform: 'uppercase', letterSpacing: 1 }}>Overall Climate Risk Score</div>
              <div style={{ fontSize: 48, fontWeight: 800, color: overallScore >= 70 ? T.green : overallScore >= 50 ? T.amber : T.red, lineHeight: 1.1 }}>{overallScore}</div>
              <div style={{ fontSize: 12, color: T.muted }}>{overallScore >= 70 ? 'Good' : overallScore >= 50 ? 'Moderate' : 'Poor'} · /100</div>
            </div>
            <div style={{ flex: 1, display: 'flex', flexWrap: 'wrap', gap: 10 }}>
              <KpiCard label="KRI Breaches" value={KRIS.filter(k => k.breaching).length} unit="/ 40" color={T.red} />
              <KpiCard label="Critical KRI Breaches" value={KRIS.filter(k => k.breaching && k.materialityRating === 'Critical').length} unit="" color={T.red} />
              <KpiCard label="Regulatory Deadline Risk" value={regulatoryRisk} unit="pts" color={regulatoryRisk > 20 ? T.red : T.amber} />
              <KpiCard label="Imminent Deadlines" value={REGULATORY_MILESTONES.filter(m => m.daysRemaining < 30).length} unit="" color={T.orange} />
              <KpiCard label="Domains Analyzed" value={8} unit="" color={T.navy} />
              <KpiCard label="KRIs Monitored" value={40} unit="" color={T.teal} />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
            {domainCards.map((d, i) => (
              <div key={d.domain} onClick={() => { setSelectedDomain(i); setTab(4); }} style={{ background: T.card, border: `1px solid ${T.border}`, borderLeft: `4px solid ${DOMAIN_COLORS[i]}`, borderRadius: 8, padding: '12px 14px', cursor: 'pointer' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: DOMAIN_COLORS[i], marginBottom: 6 }}>{d.domain}</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: d.score >= 70 ? T.green : d.score >= 50 ? T.amber : T.red }}>{d.score}</div>
                <div style={{ fontSize: 10, color: T.muted }}>{d.breaching} / {d.total} KRIs breaching</div>
                <div style={{ marginTop: 6, fontSize: 10, color: T.muted }}>Weight: {domainWeights[i]}%</div>
              </div>
            ))}
          </div>
          <div style={{ background: T.card, borderRadius: 8, border: `1px solid ${T.border}`, padding: 20 }}>
            <h3 style={{ margin: '0 0 14px', fontSize: 14, fontWeight: 700 }}>Risk Score Trajectory by Domain (5 Quarters)</h3>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={trajectoryData}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="period" tick={{ fontSize: 12 }} />
                <YAxis domain={[20, 90]} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                {DOMAINS.map((d, di) => <Line key={d} type="monotone" dataKey={d.slice(0,8)} stroke={DOMAIN_COLORS[di]} strokeWidth={2} dot={false} />)}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* TAB 1: KRI Monitor */}
      {tab === 1 && (
        <div>
          <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
            <KpiCard label="Showing KRIs" value={filteredKRIs.length} unit="/ 40" color={T.indigo} />
            <KpiCard label="Breaching" value={filteredKRIs.filter(k => k.breaching).length} unit="" color={T.red} />
            <KpiCard label="Critical" value={filteredKRIs.filter(k => k.materialityRating === 'Critical').length} unit="" color={T.orange} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div style={{ background: T.card, borderRadius: 8, border: `1px solid ${T.border}`, padding: 20 }}>
              <h3 style={{ margin: '0 0 14px', fontSize: 14, fontWeight: 700 }}>KRI Breach Count by Domain</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={breachData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="domain" tick={{ fontSize: 9 }} angle={-20} textAnchor="end" height={60} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="breaching" name="Breaching" fill={T.red} stackId="a" />
                  <Bar dataKey="compliant" name="Compliant" fill={T.green} stackId="a" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, borderRadius: 8, border: `1px solid ${T.border}`, padding: 20 }}>
              <h3 style={{ margin: '0 0 14px', fontSize: 14, fontWeight: 700 }}>Breach Heatmap (Domain × Materiality)</h3>
              <div style={{ display: 'grid', gridTemplateColumns: `auto repeat(4, 1fr)`, gap: 2, fontSize: 10 }}>
                <div></div>
                {MATERIALITY_RATINGS.map((m, i) => <div key={i} style={{ padding: '3px 4px', textAlign: 'center', fontWeight: 700, color: T.muted, fontSize: 9 }}>{m.slice(0,4)}</div>)}
                {DOMAINS.map((domain, di) => [
                  <div key={`d${di}`} style={{ padding: '3px 4px', fontWeight: 700, color: DOMAIN_COLORS[di], fontSize: 9, whiteSpace: 'nowrap' }}>{domain.slice(0,10)}</div>,
                  ...MATERIALITY_RATINGS.map((mat, mi) => {
                    const count = KRIS.filter(k => k.domainIdx === di && k.materialityRating === mat && k.breaching).length;
                    const total = KRIS.filter(k => k.domainIdx === di && k.materialityRating === mat).length;
                    return <div key={`${di}-${mi}`} style={{ padding: '4px 3px', textAlign: 'center', background: count > 0 ? `rgba(220,38,38,${Math.min(1, count / 3)})` : '#f0fdf4', color: count > 1 ? '#fff' : T.text, fontSize: 9, borderRadius: 2 }}>{count}/{total}</div>;
                  })
                ])}
              </div>
            </div>
          </div>
          <div style={{ background: T.card, borderRadius: 8, border: `1px solid ${T.border}`, padding: 20 }}>
            <div style={{ display: 'flex', gap: 12, marginBottom: 12, alignItems: 'center' }}>
              <span style={{ fontSize: 14, fontWeight: 700 }}>40-KRI Monitor — {filteredKRIs.length} showing</span>
              <span style={{ fontSize: 11, color: T.muted }}>Click header to sort</span>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                <thead><tr style={{ background: T.sub }}>
                  {[['name','KRI Name'],['domain','Domain'],['value','Value'],['threshold','Threshold'],['peerBenchmark','Peer Benchmark'],['materialityRating','Materiality'],['dataSource','Data Source'],['lastUpdated','Updated']].map(([col, label]) => (
                    <th key={col} onClick={() => handleSort(col)} style={thS(col)}>{label}{sortCol === col ? (sortAsc ? ' ↑' : ' ↓') : ''}</th>
                  ))}
                  <th style={{ padding: '7px 8px', fontWeight: 700, fontSize: 11, borderBottom: `2px solid ${T.border}` }}>Status</th>
                  <th style={{ padding: '7px 8px', fontWeight: 700, fontSize: 11, borderBottom: `2px solid ${T.border}` }}>Trend</th>
                </tr></thead>
                <tbody>{sortedKRIs.map((k, i) => (
                  <tr key={k.id} style={{ background: i % 2 === 0 ? T.bg : T.card }}>
                    <td style={{ ...tdS, fontWeight: 600, maxWidth: 160, overflow: 'hidden', whiteSpace: 'nowrap' }}>{k.name}</td>
                    <td style={{ ...tdS, color: DOMAIN_COLORS[k.domainIdx], fontSize: 10 }}>{k.domain.slice(0, 16)}</td>
                    <td style={{ ...tdS, color: k.breaching ? T.red : T.green, fontWeight: 600 }}>{k.value}</td>
                    <td style={tdS}>{k.threshold}</td>
                    <td style={tdS}>{k.peerBenchmark}</td>
                    <td style={tdS}><span style={{ background: k.materialityRating === 'Critical' ? '#fee2e2' : k.materialityRating === 'High' ? '#fef3c7' : k.materialityRating === 'Medium' ? '#dbeafe' : '#f0fdf4', color: k.materialityRating === 'Critical' ? T.red : k.materialityRating === 'High' ? T.amber : k.materialityRating === 'Medium' ? T.blue : T.green, padding: '2px 7px', borderRadius: 4, fontSize: 10 }}>{k.materialityRating}</span></td>
                    <td style={{ ...tdS, fontSize: 10 }}>{k.dataSource}</td>
                    <td style={tdS}>{k.lastUpdated}</td>
                    <td style={tdS}><span style={{ background: k.breaching ? '#fee2e2' : '#dcfce7', color: k.breaching ? T.red : T.green, padding: '2px 7px', borderRadius: 4, fontSize: 10, fontWeight: 600 }}>{k.breaching ? 'BREACH' : 'OK'}</span></td>
                    <td style={tdS}>{k.trend.length ? <span style={{ color: k.trend[4] > k.trend[0] ? T.red : T.green }}>{k.trend[4] > k.trend[0] ? '↑' : '↓'}</span> : '—'}</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Regulatory Calendar */}
      {tab === 2 && (
        <div>
          <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
            <KpiCard label="Total Milestones" value={filteredMilestones.length} unit="/ 20" color={T.navy} />
            <KpiCard label="Imminent (<30 days)" value={filteredMilestones.filter(m => m.daysRemaining < 30).length} unit="" color={T.red} />
            <KpiCard label="Critical Priority" value={filteredMilestones.filter(m => m.priority === 'Critical').length} unit="" color={T.orange} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div style={{ background: T.card, borderRadius: 8, border: `1px solid ${T.border}`, padding: 20 }}>
              <h3 style={{ margin: '0 0 14px', fontSize: 14, fontWeight: 700 }}>Milestones by Regulator</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={REGULATORS.map(r => ({ regulator: r, count: REGULATORY_MILESTONES.filter(m => m.regulator === r).length })).filter(d => d.count > 0)}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="regulator" tick={{ fontSize: 10 }} angle={-20} textAnchor="end" height={60} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" name="Milestones" fill={T.indigo} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, borderRadius: 8, border: `1px solid ${T.border}`, padding: 20 }}>
              <h3 style={{ margin: '0 0 14px', fontSize: 14, fontWeight: 700 }}>Days Remaining Distribution</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={[
                  { range: 'Imminent (<30d)', count: REGULATORY_MILESTONES.filter(m => m.daysRemaining < 30).length },
                  { range: '30-90d', count: REGULATORY_MILESTONES.filter(m => m.daysRemaining >= 30 && m.daysRemaining < 90).length },
                  { range: '90-180d', count: REGULATORY_MILESTONES.filter(m => m.daysRemaining >= 90 && m.daysRemaining < 180).length },
                  { range: '180-365d', count: REGULATORY_MILESTONES.filter(m => m.daysRemaining >= 180 && m.daysRemaining < 365).length },
                ]}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="range" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" name="Milestones" fill={T.teal} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div style={{ background: T.card, borderRadius: 8, border: `1px solid ${T.border}`, padding: 20 }}>
            <h3 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 700 }}>Regulatory Calendar — {filteredMilestones.length} Milestones</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
              <thead><tr style={{ background: T.sub }}>
                {['Milestone','Regulator','Due Date','Jurisdiction','Priority','Days Remaining','Status'].map(h => <th key={h} style={{ padding: '7px 8px', fontWeight: 700, borderBottom: `2px solid ${T.border}`, textAlign: 'left', whiteSpace: 'nowrap' }}>{h}</th>)}
              </tr></thead>
              <tbody>{[...filteredMilestones].sort((a,b) => a.daysRemaining - b.daysRemaining).map((m, i) => (
                <tr key={m.name} style={{ background: i % 2 === 0 ? T.bg : T.card }}>
                  <td style={{ ...tdS, fontWeight: 600, maxWidth: 200 }}>{m.name}</td>
                  <td style={tdS}>{m.regulator}</td>
                  <td style={tdS}>{m.due}</td>
                  <td style={tdS}>{m.jurisdiction}</td>
                  <td style={tdS}><span style={{ background: m.priority === 'Critical' ? '#fee2e2' : m.priority === 'High' ? '#fef3c7' : '#dbeafe', color: m.priority === 'Critical' ? T.red : m.priority === 'High' ? T.amber : T.blue, padding: '2px 7px', borderRadius: 4, fontSize: 10, fontWeight: 600 }}>{m.priority}</span></td>
                  <td style={{ ...tdS, color: m.daysRemaining < 30 ? T.red : m.daysRemaining < 90 ? T.amber : T.green, fontWeight: 600 }}>{m.daysRemaining}d</td>
                  <td style={tdS}><span style={{ background: m.daysRemaining < 30 ? '#fee2e2' : '#fef3c7', color: m.daysRemaining < 30 ? T.red : T.amber, padding: '2px 7px', borderRadius: 4, fontSize: 10 }}>{m.status}</span></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: Peer Benchmarking */}
      {tab === 3 && (
        <div>
          <div style={{ display: 'flex', gap: 10, marginBottom: 14, alignItems: 'center' }}>
            <label style={{ fontSize: 12 }}>Compare peer: <select value={selectedPeer} onChange={e => setSelectedPeer(+e.target.value)} style={{ padding: '5px 10px', borderRadius: 6, border: `1px solid ${T.border}`, fontSize: 12 }}>
              {PEER_INSURERS.map((p, i) => <option key={i} value={i}>{p}</option>)}
            </select></label>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div style={{ background: T.card, borderRadius: 8, border: `1px solid ${T.border}`, padding: 20 }}>
              <h3 style={{ margin: '0 0 14px', fontSize: 14, fontWeight: 700 }}>Peer Radar — Our Score vs {PEER_INSURERS[selectedPeer]}</h3>
              <ResponsiveContainer width="100%" height={280}>
                <RadarChart data={peerRadarData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="domain" tick={{ fontSize: 9 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 9 }} />
                  <Radar name="Our Score" dataKey="Our Score" stroke={T.indigo} fill={T.indigo} fillOpacity={0.3} />
                  <Radar name={PEER_INSURERS[selectedPeer]} dataKey={PEER_INSURERS[selectedPeer]} stroke={T.red} fill={T.red} fillOpacity={0.2} />
                  <Legend />
                </RadarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, borderRadius: 8, border: `1px solid ${T.border}`, padding: 20 }}>
              <h3 style={{ margin: '0 0 14px', fontSize: 14, fontWeight: 700 }}>Percentile Rankings by Domain</h3>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={percentileRankings} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10 }} unit="%" />
                  <YAxis dataKey="domain" type="category" tick={{ fontSize: 9 }} width={100} />
                  <Tooltip />
                  <Bar dataKey="percentile" name="Percentile" fill={T.teal} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div style={{ background: T.card, borderRadius: 8, border: `1px solid ${T.border}`, padding: 20 }}>
            <h3 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 700 }}>Gap Analysis vs Best-in-Class</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
              <thead><tr style={{ background: T.sub }}>
                {['Domain','Our Score','Percentile','Best-in-Class','Gap','Priority Action'].map(h => <th key={h} style={{ padding: '7px 8px', fontWeight: 700, borderBottom: `2px solid ${T.border}` }}>{h}</th>)}
              </tr></thead>
              <tbody>{percentileRankings.map((r, i) => (
                <tr key={r.domain} style={{ background: i % 2 === 0 ? T.bg : T.card }}>
                  <td style={{ ...tdS, fontWeight: 600, color: DOMAIN_COLORS[i] }}>{r.domain}</td>
                  <td style={{ ...tdS, color: r.myScore >= 70 ? T.green : r.myScore >= 50 ? T.amber : T.red, fontWeight: 600 }}>{r.myScore}</td>
                  <td style={tdS}>{r.percentile}th</td>
                  <td style={tdS}>{r.best}</td>
                  <td style={{ ...tdS, color: r.gap > 10 ? T.red : r.gap > 5 ? T.amber : T.green, fontWeight: 600 }}>{r.gap > 0 ? '-' + r.gap : '+' + Math.abs(r.gap)}</td>
                  <td style={{ ...tdS, fontSize: 10 }}>{r.gap > 10 ? 'High Priority Gap' : r.gap > 5 ? 'Monitor' : 'On Track'}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: Domain Deep Dive */}
      {tab === 4 && (
        <div>
          <div style={{ display: 'flex', gap: 10, marginBottom: 14, alignItems: 'center' }}>
            <label style={{ fontSize: 12, fontWeight: 600 }}>Domain:</label>
            <select value={selectedDomain} onChange={e => setSelectedDomain(+e.target.value)} style={{ padding: '6px 10px', borderRadius: 6, border: `1px solid ${T.border}`, fontSize: 12 }}>
              {DOMAINS.map((d, i) => <option key={d} value={i}>{d}</option>)}
            </select>
            <div style={{ background: T.card, border: `2px solid ${DOMAIN_COLORS[selectedDomain]}`, borderRadius: 8, padding: '6px 16px', fontSize: 18, fontWeight: 700, color: DOMAIN_COLORS[selectedDomain] }}>
              Score: {domainCards[selectedDomain].score}
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div style={{ background: T.card, borderRadius: 8, border: `1px solid ${T.border}`, padding: 20 }}>
              <h3 style={{ margin: '0 0 14px', fontSize: 14, fontWeight: 700 }}>KRI Values — {DOMAINS[selectedDomain]}</h3>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={domainKRIs.map(k => ({ name: k.name.slice(0, 18), value: k.value, threshold: k.threshold }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="name" tick={{ fontSize: 8 }} angle={-20} textAnchor="end" height={70} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="value" name="Current Value" fill={T.indigo} />
                  <Bar dataKey="threshold" name="Threshold" fill={T.amber} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, borderRadius: 8, border: `1px solid ${T.border}`, padding: 20 }}>
              <h3 style={{ margin: '0 0 14px', fontSize: 14, fontWeight: 700 }}>5-Period KRI Trend</h3>
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={Array.from({ length: 5 }, (_, ti) => {
                  const obj = { period: `Q${ti + 1}` };
                  domainKRIs.forEach(k => { obj[k.name.slice(0,12)] = k.trend[ti] || k.value; });
                  return obj;
                })}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="period" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  {domainKRIs.map((k, ki) => <Line key={k.id} type="monotone" dataKey={k.name.slice(0,12)} stroke={DOMAIN_COLORS[ki % 8]} strokeWidth={1.5} dot={false} />)}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div style={{ background: T.card, borderRadius: 8, border: `1px solid ${T.border}`, padding: 20 }}>
            <h3 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 700 }}>Remediation Actions — {DOMAINS[selectedDomain]}</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
              <thead><tr style={{ background: T.sub }}>
                {['KRI','Value','Threshold','Materiality','Breach','Remediation Action','Data Source'].map(h => <th key={h} style={{ padding: '7px 8px', fontWeight: 700, borderBottom: `2px solid ${T.border}`, whiteSpace: 'nowrap' }}>{h}</th>)}
              </tr></thead>
              <tbody>{domainKRIs.map((k, i) => (
                <tr key={k.id} style={{ background: i % 2 === 0 ? T.bg : T.card }}>
                  <td style={{ ...tdS, fontWeight: 600 }}>{k.name.slice(0, 22)}</td>
                  <td style={{ ...tdS, color: k.breaching ? T.red : T.green, fontWeight: 600 }}>{k.value}</td>
                  <td style={tdS}>{k.threshold}</td>
                  <td style={tdS}><span style={{ background: k.materialityRating === 'Critical' ? '#fee2e2' : k.materialityRating === 'High' ? '#fef3c7' : '#dbeafe', color: k.materialityRating === 'Critical' ? T.red : k.materialityRating === 'High' ? T.amber : T.blue, padding: '2px 7px', borderRadius: 4, fontSize: 10 }}>{k.materialityRating}</span></td>
                  <td style={tdS}><span style={{ background: k.breaching ? '#fee2e2' : '#dcfce7', color: k.breaching ? T.red : T.green, padding: '2px 7px', borderRadius: 4, fontSize: 10 }}>{k.breaching ? 'BREACH' : 'OK'}</span></td>
                  <td style={{ ...tdS, fontSize: 10 }}>{k.remediationAction}</td>
                  <td style={{ ...tdS, fontSize: 10 }}>{k.dataSource}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: Board Report */}
      {tab === 5 && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 16, marginBottom: 20 }}>
            <div style={{ background: T.card, border: `2px solid ${overallScore >= 70 ? T.green : overallScore >= 50 ? T.amber : T.red}`, borderRadius: 12, padding: 24, textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: T.muted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Board Climate Risk Score</div>
              <div style={{ fontSize: 60, fontWeight: 800, color: overallScore >= 70 ? T.green : overallScore >= 50 ? T.amber : T.red, lineHeight: 1 }}>{overallScore}</div>
              <div style={{ fontSize: 14, color: T.muted, marginTop: 6 }}>{overallScore >= 70 ? 'Acceptable Position' : overallScore >= 50 ? 'Needs Attention' : 'Urgent Action Required'}</div>
              <div style={{ marginTop: 12, fontSize: 12 }}>
                <div>{KRIS.filter(k => k.breaching).length} KRI breaches</div>
                <div style={{ color: T.red }}>{KRIS.filter(k => k.breaching && k.materialityRating === 'Critical').length} Critical breaches</div>
                <div style={{ color: T.amber }}>{REGULATORY_MILESTONES.filter(m => m.daysRemaining < 30).length} Imminent deadlines</div>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ background: T.card, borderRadius: 8, border: `1px solid ${T.border}`, padding: 16 }}>
                <h4 style={{ margin: '0 0 10px', fontSize: 13, fontWeight: 700 }}>Top 5 Climate Risks for Board Attention</h4>
                {[...KRIS].filter(k => k.breaching).sort((a,b) => MATERIALITY_RATINGS.indexOf(a.materialityRating) - MATERIALITY_RATINGS.indexOf(b.materialityRating)).slice(0,5).map((k, i) => (
                  <div key={k.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: `1px solid ${T.border}`, fontSize: 12 }}>
                    <div>
                      <span style={{ fontWeight: 700, color: T.red }}>#{i+1} </span>
                      <span>{k.name.slice(0,28)}</span>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <span style={{ background: '#fee2e2', color: T.red, padding: '1px 6px', borderRadius: 4, fontSize: 10 }}>{k.materialityRating}</span>
                      <span style={{ fontSize: 11, color: T.muted }}>{k.domain.slice(0,12)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div style={{ background: T.card, borderRadius: 8, border: `1px solid ${T.border}`, padding: 20 }}>
              <h4 style={{ margin: '0 0 12px', fontSize: 13, fontWeight: 700 }}>Board Decisions Required</h4>
              {boardDecisions.map((d, i) => (
                <div key={i} style={{ padding: '10px 12px', marginBottom: 8, background: T.sub, borderRadius: 6, border: `1px solid ${T.border}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 12, fontWeight: 700 }}>#{i+1} {d.decision}</span>
                    <span style={{ background: d.urgency === 'Immediate' ? '#fee2e2' : '#fef3c7', color: d.urgency === 'Immediate' ? T.red : T.amber, padding: '2px 8px', borderRadius: 4, fontSize: 10 }}>{d.urgency}</span>
                  </div>
                  <div style={{ fontSize: 11, color: T.muted }}>{d.rationale}</div>
                </div>
              ))}
            </div>
            <div style={{ background: T.card, borderRadius: 8, border: `1px solid ${T.border}`, padding: 20 }}>
              <h4 style={{ margin: '0 0 12px', fontSize: 13, fontWeight: 700 }}>Scenario Stress Impacts</h4>
              {stressImpacts.map((s, i) => (
                <div key={i} style={{ padding: '10px 12px', marginBottom: 8, background: s.overallScore < 50 ? '#fef2f2' : '#f0fdf4', borderRadius: 6, border: `1px solid ${s.overallScore < 50 ? '#fca5a5' : '#86efac'}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 12, fontWeight: 700 }}>{s.scenario}</span>
                    <div style={{ display: 'flex', gap: 10 }}>
                      <span style={{ fontSize: 18, fontWeight: 800, color: s.overallScore < 50 ? T.red : T.amber }}>{s.overallScore}</span>
                      <span style={{ fontSize: 11, color: T.muted }}>{s.kriBreaches} breaches</span>
                    </div>
                  </div>
                </div>
              ))}
              <div style={{ marginTop: 12, padding: 12, background: T.sub, borderRadius: 6 }}>
                <h5 style={{ margin: '0 0 8px', fontSize: 12, fontWeight: 700 }}>Regulatory Actions Needed</h5>
                {REGULATORY_MILESTONES.filter(m => m.daysRemaining < 30).map(m => (
                  <div key={m.name} style={{ fontSize: 11, padding: '4px 0', borderBottom: `1px solid ${T.border}` }}>
                    <span style={{ color: T.red, fontWeight: 600 }}>DUE {m.daysRemaining}d: </span>{m.name.slice(0,35)}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: Summary & Export */}
      {tab === 6 && (
        <div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 20 }}>
            <KpiCard label="Overall Score" value={overallScore} unit="/ 100" color={overallScore >= 70 ? T.green : overallScore >= 50 ? T.amber : T.red} bold />
            <KpiCard label="KRI Breaches" value={KRIS.filter(k => k.breaching).length} unit="/ 40" color={T.red} />
            <KpiCard label="Critical Breaches" value={KRIS.filter(k => k.breaching && k.materialityRating === 'Critical').length} unit="" color={T.red} />
            <KpiCard label="Regulatory Milestones" value={20} unit="" color={T.navy} />
            <KpiCard label="Imminent Deadlines" value={REGULATORY_MILESTONES.filter(m => m.daysRemaining < 30).length} unit="" color={T.orange} />
            <KpiCard label="Domains" value={8} unit="" color={T.teal} />
            <KpiCard label="Peers Benchmarked" value={10} unit="" color={T.purple} />
          </div>
          <div style={{ background: T.card, borderRadius: 8, border: `1px solid ${T.border}`, padding: 20, marginBottom: 20 }}>
            <h3 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 700 }}>Domain Weight Sliders (Total: {totalWeight}%)</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
              {DOMAINS.map((d, i) => (
                <div key={d} style={{ padding: 10, background: T.sub, borderRadius: 6 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: DOMAIN_COLORS[i], marginBottom: 6 }}>{d.slice(0, 18)}</div>
                  <input type="range" min={0} max={30} value={domainWeights[i]} onChange={e => handleWeightChange(i, +e.target.value)} style={{ width: '100%' }} />
                  <div style={{ fontSize: 12, color: T.muted, textAlign: 'center' }}>{domainWeights[i]}%</div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 10, fontSize: 12, color: totalWeight !== 100 ? T.red : T.green, fontWeight: 600, textAlign: 'right' }}>
              Total Weight: {totalWeight}% {totalWeight !== 100 ? '(should sum to 100%)' : '✓'}
            </div>
          </div>
          <div style={{ background: T.card, borderRadius: 8, border: `1px solid ${T.border}`, padding: 20 }}>
            <h3 style={{ margin: '0 0 10px', fontSize: 14, fontWeight: 700 }}>Full KRI Export — 40 KRIs</h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                <thead><tr style={{ background: T.sub }}>
                  {['KRI Name','Domain','Value','Threshold','Peer Benchmark','Breach','Materiality','Direction','Data Source','Updated','Remediation','KRI Breach Probability %'].map(h => (
                    <th key={h} style={{ padding: '7px 8px', fontWeight: 700, borderBottom: `2px solid ${T.border}`, whiteSpace: 'nowrap', textAlign: 'left' }}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>{KRIS.map((k, i) => {
                  const breachProb = k.threshold > 0 ? +Math.min(200, Math.max(0, (k.value - k.threshold) / k.threshold * 100)).toFixed(1) : 0;
                  return (
                    <tr key={k.id} style={{ background: i % 2 === 0 ? T.bg : T.card }}>
                      <td style={{ ...tdS, fontWeight: 600, maxWidth: 160, overflow: 'hidden', whiteSpace: 'nowrap' }}>{k.name.slice(0, 24)}</td>
                      <td style={{ ...tdS, color: DOMAIN_COLORS[k.domainIdx], fontSize: 10 }}>{k.domain.slice(0, 14)}</td>
                      <td style={{ ...tdS, color: k.breaching ? T.red : T.green, fontWeight: 600 }}>{k.value}</td>
                      <td style={tdS}>{k.threshold}</td>
                      <td style={tdS}>{k.peerBenchmark}</td>
                      <td style={tdS}><span style={{ background: k.breaching ? '#fee2e2' : '#dcfce7', color: k.breaching ? T.red : T.green, padding: '2px 6px', borderRadius: 4, fontSize: 10 }}>{k.breaching ? 'BREACH' : 'OK'}</span></td>
                      <td style={tdS}><span style={{ background: k.materialityRating === 'Critical' ? '#fee2e2' : '#fef3c7', color: k.materialityRating === 'Critical' ? T.red : T.amber, padding: '2px 6px', borderRadius: 4, fontSize: 10 }}>{k.materialityRating}</span></td>
                      <td style={{ ...tdS, fontSize: 10 }}>{k.direction}</td>
                      <td style={{ ...tdS, fontSize: 10 }}>{k.dataSource}</td>
                      <td style={tdS}>{k.lastUpdated}</td>
                      <td style={{ ...tdS, fontSize: 10 }}>{k.remediationAction}</td>
                      <td style={{ ...tdS, color: breachProb > 50 ? T.red : T.text }}>{breachProb > 0 ? '+' + breachProb + '%' : '—'}</td>
                    </tr>
                  );
                })}</tbody>
              </table>
            </div>
          </div>
          {/* KRI Trend Analysis Table */}
          <div style={{ background: T.card, borderRadius: 8, border: `1px solid ${T.border}`, padding: 20, marginTop: 16 }}>
            <h3 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 700 }}>KRI Trend Analysis — 5-Period History</h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                <thead><tr style={{ background: T.sub }}>
                  <th style={{ padding: '7px 10px', fontWeight: 700, borderBottom: `2px solid ${T.border}`, textAlign: 'left' }}>KRI</th>
                  <th style={{ padding: '7px 8px', fontWeight: 700, borderBottom: `2px solid ${T.border}`, textAlign: 'left', fontSize: 10 }}>Domain</th>
                  {['T-4','T-3','T-2','T-1','Current'].map(t => <th key={t} style={{ padding: '7px 8px', fontWeight: 700, borderBottom: `2px solid ${T.border}`, textAlign: 'right', fontSize: 10 }}>{t}</th>)}
                  <th style={{ padding: '7px 8px', fontWeight: 700, borderBottom: `2px solid ${T.border}`, textAlign: 'right', fontSize: 10 }}>5P Δ%</th>
                  <th style={{ padding: '7px 8px', fontWeight: 700, borderBottom: `2px solid ${T.border}`, textAlign: 'center', fontSize: 10 }}>Trend</th>
                </tr></thead>
                <tbody>{KRIS.map((k, i) => {
                  const first = k.trend[0] || 1;
                  const last = k.trend[k.trend.length - 1] || 1;
                  const deltaP = first > 0 ? ((last - first) / first * 100).toFixed(1) : '0.0';
                  const rising = last > first;
                  const worsening = (k.direction === 'Lower is Better' && rising) || (k.direction === 'Higher is Better' && !rising);
                  return (
                    <tr key={k.id} style={{ background: i % 2 === 0 ? T.bg : T.card }}>
                      <td style={{ padding: '5px 10px', fontWeight: 600, fontSize: 11, maxWidth: 160, overflow: 'hidden', whiteSpace: 'nowrap' }}>{k.name.slice(0, 22)}</td>
                      <td style={{ padding: '5px 8px', color: DOMAIN_COLORS[k.domainIdx], fontSize: 10 }}>{k.domain.slice(0, 12)}</td>
                      {k.trend.map((v, ti) => <td key={ti} style={{ padding: '5px 8px', textAlign: 'right', fontWeight: ti === 4 ? 700 : 400, color: ti === 4 && k.breaching ? T.red : T.text }}>{v}</td>)}
                      <td style={{ padding: '5px 8px', textAlign: 'right', color: worsening ? T.red : T.green, fontWeight: 700 }}>{rising ? '+' : ''}{deltaP}%</td>
                      <td style={{ padding: '5px 8px', textAlign: 'center', fontSize: 14 }}>{worsening ? '▲' : '▼'}</td>
                    </tr>
                  );
                })}</tbody>
              </table>
            </div>
          </div>
          {/* Domain Weight Sensitivity Analysis */}
          <div style={{ background: T.card, borderRadius: 8, border: `1px solid ${T.border}`, padding: 20, marginTop: 16 }}>
            <h3 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 700 }}>Domain Weight Sensitivity — Overall Score vs Weight Shift</h3>
            <ResponsiveContainer width="100%" height={220}>
              <ComposedChart data={ACTUARIAL_DOMAINS.map((d, di) => {
                const base = domainScores[di] || 0;
                const totalW = Object.values(domainWeights).reduce((s, v) => s + v, 0) || 1;
                const currentScore = ACTUARIAL_DOMAINS.reduce((sum, _, i) => sum + (domainScores[i] || 0) * domainWeights[i] / totalW, 0);
                const upWeight = { ...domainWeights, [di]: Math.min(domainWeights[di] + 10, 50) };
                const upTotal = Object.values(upWeight).reduce((s, v) => s + v, 0) || 1;
                const upScore = ACTUARIAL_DOMAINS.reduce((sum, _, i) => sum + (domainScores[i] || 0) * upWeight[i] / upTotal, 0);
                return { name: d.name.slice(0, 8), domainScore: +base.toFixed(1), impactUp: +(upScore - currentScore).toFixed(2), currentWeight: domainWeights[di] };
              })} margin={{ top: 10, right: 30, left: 0, bottom: 50 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="name" tick={{ fontSize: 9 }} angle={-40} textAnchor="end" interval={0} />
                <YAxis yAxisId="left" tick={{ fontSize: 10 }} domain={[0, 100]} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10 }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar yAxisId="left" dataKey="domainScore" name="Domain Score" fill={T.indigo} opacity={0.7} />
                <Line yAxisId="right" type="monotone" dataKey="impactUp" name="+10pt Weight Impact" stroke={T.orange} strokeWidth={2} dot={{ r: 4 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          {/* Peer Gap Quantification */}
          <div style={{ background: T.card, borderRadius: 8, border: `1px solid ${T.border}`, padding: 20, marginTop: 16 }}>
            <h3 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 700 }}>Peer Gap Quantification — Domain-Level Benchmark Analysis</h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                <thead><tr style={{ background: T.sub }}>
                  <th style={{ padding: '7px 10px', fontWeight: 700, borderBottom: `2px solid ${T.border}`, textAlign: 'left' }}>Domain</th>
                  <th style={{ padding: '7px 8px', fontWeight: 700, borderBottom: `2px solid ${T.border}`, textAlign: 'right' }}>Our Score</th>
                  <th style={{ padding: '7px 8px', fontWeight: 700, borderBottom: `2px solid ${T.border}`, textAlign: 'right' }}>Peer Best</th>
                  <th style={{ padding: '7px 8px', fontWeight: 700, borderBottom: `2px solid ${T.border}`, textAlign: 'right' }}>Peer Avg</th>
                  <th style={{ padding: '7px 8px', fontWeight: 700, borderBottom: `2px solid ${T.border}`, textAlign: 'right' }}>Peer Worst</th>
                  <th style={{ padding: '7px 8px', fontWeight: 700, borderBottom: `2px solid ${T.border}`, textAlign: 'right' }}>Gap vs Best</th>
                  <th style={{ padding: '7px 8px', fontWeight: 700, borderBottom: `2px solid ${T.border}`, textAlign: 'right' }}>Percentile</th>
                  <th style={{ padding: '7px 8px', fontWeight: 700, borderBottom: `2px solid ${T.border}`, textAlign: 'center' }}>Status</th>
                </tr></thead>
                <tbody>{ACTUARIAL_DOMAINS.map((d, di) => {
                  const ourScore = domainScores[di] || 0;
                  const peerColScores = PEER_SCORES.map(p => p.scores[di]);
                  const peerBest = Math.max(...peerColScores);
                  const peerWorst = Math.min(...peerColScores);
                  const peerAvg = peerColScores.length ? peerColScores.reduce((s, v) => s + v, 0) / peerColScores.length : 0;
                  const gap = ourScore - peerBest;
                  const above = peerColScores.filter(v => v < ourScore).length;
                  const percentile = ((above / peerColScores.length) * 100).toFixed(0);
                  const statusColor = gap >= 0 ? T.green : gap > -10 ? T.amber : T.red;
                  const statusLabel = gap >= 0 ? 'Leader' : gap > -10 ? 'Follower' : 'Laggard';
                  return (
                    <tr key={d.id} style={{ background: di % 2 === 0 ? T.bg : T.card }}>
                      <td style={{ padding: '6px 10px', fontWeight: 600 }}>{d.name}</td>
                      <td style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 700, color: T.indigo }}>{ourScore.toFixed(1)}</td>
                      <td style={{ padding: '6px 8px', textAlign: 'right', color: T.green, fontWeight: 600 }}>{peerBest.toFixed(1)}</td>
                      <td style={{ padding: '6px 8px', textAlign: 'right' }}>{peerAvg.toFixed(1)}</td>
                      <td style={{ padding: '6px 8px', textAlign: 'right', color: T.red }}>{peerWorst.toFixed(1)}</td>
                      <td style={{ padding: '6px 8px', textAlign: 'right', color: gap >= 0 ? T.green : T.red, fontWeight: 700 }}>{gap >= 0 ? '+' : ''}{gap.toFixed(1)}</td>
                      <td style={{ padding: '6px 8px', textAlign: 'right' }}>{percentile}th</td>
                      <td style={{ padding: '6px 8px', textAlign: 'center' }}><span style={{ background: statusColor + '22', color: statusColor, padding: '2px 7px', borderRadius: 4, fontSize: 10, fontWeight: 700 }}>{statusLabel}</span></td>
                    </tr>
                  );
                })}</tbody>
              </table>
            </div>
          </div>
          {/* Regulatory Deadline Risk Matrix */}
          <div style={{ background: T.card, borderRadius: 8, border: `1px solid ${T.border}`, padding: 20, marginTop: 16 }}>
            <h3 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 700 }}>Regulatory Deadline Risk Matrix</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <h4 style={{ margin: '0 0 8px', fontSize: 12, fontWeight: 700, color: T.muted }}>Milestones by Domain & Urgency</h4>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                  <thead><tr style={{ background: T.sub }}>
                    {['Regulation', 'Domain', 'Days Left', 'Readiness', 'Risk Level'].map(h => (
                      <th key={h} style={{ padding: '5px 7px', fontWeight: 700, borderBottom: `1px solid ${T.border}`, textAlign: h === 'Regulation' || h === 'Domain' ? 'left' : 'right', fontSize: 10 }}>{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>{[...REGULATORY_MILESTONES].sort((a, b) => a.daysRemaining - b.daysRemaining).map((m, i) => {
                    const urgency = m.daysRemaining < 30 ? 'Critical' : m.daysRemaining < 90 ? 'High' : m.daysRemaining < 180 ? 'Medium' : 'Low';
                    const urgencyColor = { Critical: T.red, High: T.orange, Medium: T.amber, Low: T.green }[urgency];
                    return (
                      <tr key={m.id} style={{ background: i % 2 === 0 ? T.bg : T.card }}>
                        <td style={{ padding: '5px 7px', fontWeight: 600, fontSize: 10, maxWidth: 120, overflow: 'hidden', whiteSpace: 'nowrap' }}>{m.regulation.slice(0, 18)}</td>
                        <td style={{ padding: '5px 7px', fontSize: 9, color: T.muted }}>{m.domain.slice(0, 14)}</td>
                        <td style={{ padding: '5px 7px', textAlign: 'right', fontWeight: 700, color: urgencyColor }}>{m.daysRemaining}d</td>
                        <td style={{ padding: '5px 7px', textAlign: 'right' }}>{m.readinessScore}/100</td>
                        <td style={{ padding: '5px 7px', textAlign: 'center' }}><span style={{ background: urgencyColor + '22', color: urgencyColor, padding: '1px 5px', borderRadius: 3, fontSize: 9, fontWeight: 700 }}>{urgency}</span></td>
                      </tr>
                    );
                  })}</tbody>
                </table>
              </div>
              <div>
                <h4 style={{ margin: '0 0 8px', fontSize: 12, fontWeight: 700, color: T.muted }}>Board-Level Risk Summary Grid</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {[
                    { label: 'Total KRIs Monitored', value: KRIS.length, color: T.indigo },
                    { label: 'KRIs in Breach', value: KRIS.filter(k => k.breaching).length, color: T.red },
                    { label: 'Critical KRIs', value: KRIS.filter(k => k.materialityRating === 'Critical').length, color: T.orange },
                    { label: 'Regulatory Milestones', value: REGULATORY_MILESTONES.length, color: T.blue },
                    { label: 'Due <30 Days', value: REGULATORY_MILESTONES.filter(m => m.daysRemaining < 30).length, color: T.red },
                    { label: 'Peer Insurers Tracked', value: PEER_SCORES.length, color: T.teal },
                    { label: 'Domains Assessed', value: ACTUARIAL_DOMAINS.length, color: T.navy },
                    { label: 'Avg Readiness Score', value: (REGULATORY_MILESTONES.length ? REGULATORY_MILESTONES.reduce((s, m) => s + m.readinessScore, 0) / REGULATORY_MILESTONES.length : 0).toFixed(0) + '/100', color: T.green },
                    { label: 'KRI Breach Rate', value: (KRIS.length ? KRIS.filter(k => k.breaching).length / KRIS.length * 100 : 0).toFixed(0) + '%', color: T.amber },
                    { label: 'Board KPIs Tracked', value: '12 core', color: T.gold },
                    { label: 'Upcoming Deadlines', value: REGULATORY_MILESTONES.filter(m => m.daysRemaining < 90).length + ' urgent', color: T.purple },
                    { label: 'Risk Appetite Status', value: KRIS.filter(k => k.breaching).length > 3 ? 'Breached' : 'Within Limits', color: KRIS.filter(k => k.breaching).length > 3 ? T.red : T.green },
                  ].map(m => (
                    <div key={m.label} style={{ background: T.sub, borderRadius: 6, padding: '8px 10px', borderLeft: `3px solid ${m.color}` }}>
                      <div style={{ fontSize: 10, color: T.muted, marginBottom: 2 }}>{m.label}</div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: m.color }}>{m.value}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          {/* Overall Risk Appetite Radar */}
          <div style={{ background: T.card, borderRadius: 8, border: `1px solid ${T.border}`, padding: 20, marginTop: 16 }}>
            <h3 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 700 }}>Actuarial Intelligence Score vs Risk Appetite — Domain Radar</h3>
            <ResponsiveContainer width="100%" height={260}>
              <RadarChart data={ACTUARIAL_DOMAINS.map((d, di) => ({
                domain: d.name.slice(0, 10),
                ourScore: domainScores[di] || 0,
                peerAvg: PEER_SCORES.length ? (PEER_SCORES.reduce((s, p) => s + p.scores[di], 0) / PEER_SCORES.length) : 0,
                appetite: d.riskAppetite || 70,
              }))}>
                <PolarGrid stroke={T.border} />
                <PolarAngleAxis dataKey="domain" tick={{ fontSize: 10 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 9 }} />
                <Radar name="Our Score" dataKey="ourScore" stroke={T.indigo} fill={T.indigo} fillOpacity={0.25} />
                <Radar name="Peer Average" dataKey="peerAvg" stroke={T.teal} fill={T.teal} fillOpacity={0.15} />
                <Radar name="Risk Appetite" dataKey="appetite" stroke={T.gold} fill={T.gold} fillOpacity={0.10} strokeDasharray="5 3" />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          </div>
          {/* Top 10 Remediations Priority */}
          <div style={{ background: T.card, borderRadius: 8, border: `1px solid ${T.border}`, padding: 20, marginTop: 16 }}>
            <h3 style={{ margin: '0 0 10px', fontSize: 14, fontWeight: 700 }}>Top Priority Remediations — Breach KRIs</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
              {KRIS.filter(k => k.breaching).slice(0, 10).map((k, i) => {
                const gap = k.threshold > 0 ? ((k.value - k.threshold) / k.threshold * 100).toFixed(1) : 0;
                return (
                  <div key={k.id} style={{ background: T.sub, borderRadius: 6, padding: '10px 12px', borderLeft: `4px solid ${T.red}`, display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: T.text }}>{k.name.slice(0, 30)}</div>
                    <div style={{ fontSize: 10, color: T.muted }}>{k.domain} · {k.materialityRating}</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10 }}>
                      <span style={{ color: T.red, fontWeight: 700 }}>Value: {k.value} / Threshold: {k.threshold}</span>
                      <span style={{ color: T.orange }}>+{gap}% over</span>
                    </div>
                    <div style={{ fontSize: 10, color: T.indigo, fontStyle: 'italic' }}>{k.remediationAction}</div>
                  </div>
                );
              })}
            </div>
          </div>
          {/* Full Regulatory Compliance Tracker */}
          <div style={{ background: T.card, borderRadius: 8, border: `1px solid ${T.border}`, padding: 20, marginTop: 16 }}>
            <h3 style={{ margin: '0 0 10px', fontSize: 14, fontWeight: 700 }}>Full Regulatory Compliance Tracker — All {REGULATORY_MILESTONES.length} Milestones</h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                <thead><tr style={{ background: T.sub }}>
                  {['Regulation', 'Domain', 'Requirement', 'Days Left', 'Readiness', 'Owner', 'Gap Actions', 'Status'].map(h => (
                    <th key={h} style={{ padding: '6px 8px', fontWeight: 700, borderBottom: `2px solid ${T.border}`, textAlign: 'left', whiteSpace: 'nowrap', fontSize: 10 }}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>{REGULATORY_MILESTONES.map((m, i) => {
                  const urgency = m.daysRemaining < 30 ? 'Critical' : m.daysRemaining < 90 ? 'High' : m.daysRemaining < 180 ? 'Medium' : 'Low';
                  const urgencyColor = { Critical: T.red, High: T.orange, Medium: T.amber, Low: T.green }[urgency];
                  return (
                    <tr key={m.id} style={{ background: i % 2 === 0 ? T.bg : T.card }}>
                      <td style={{ padding: '5px 8px', fontWeight: 600, fontSize: 10 }}>{m.regulation.slice(0, 20)}</td>
                      <td style={{ padding: '5px 8px', fontSize: 10, color: T.muted }}>{m.domain.slice(0, 14)}</td>
                      <td style={{ padding: '5px 8px', fontSize: 9, maxWidth: 140, overflow: 'hidden', whiteSpace: 'nowrap' }}>{m.requirement}</td>
                      <td style={{ padding: '5px 8px', fontWeight: 700, color: urgencyColor }}>{m.daysRemaining}d</td>
                      <td style={{ padding: '5px 8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <div style={{ flex: 1, height: 6, background: T.border, borderRadius: 3 }}>
                            <div style={{ width: m.readinessScore + '%', height: 6, background: m.readinessScore > 70 ? T.green : m.readinessScore > 40 ? T.amber : T.red, borderRadius: 3 }} />
                          </div>
                          <span style={{ fontSize: 10 }}>{m.readinessScore}%</span>
                        </div>
                      </td>
                      <td style={{ padding: '5px 8px', fontSize: 10 }}>{m.owner}</td>
                      <td style={{ padding: '5px 8px', fontSize: 9, maxWidth: 120, overflow: 'hidden', whiteSpace: 'nowrap' }}>{m.gapActions}</td>
                      <td style={{ padding: '5px 8px' }}><span style={{ background: urgencyColor + '22', color: urgencyColor, padding: '2px 6px', borderRadius: 4, fontSize: 9, fontWeight: 700 }}>{urgency}</span></td>
                    </tr>
                  );
                })}</tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
