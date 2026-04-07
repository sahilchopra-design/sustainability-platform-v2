import React, { useState, useMemo } from 'react';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, ReferenceLine,
} from 'recharts';

const T = {
  bg: '#f8f6f0', card: '#ffffff', border: '#e2ded5', text: '#1a1a2e',
  sub: '#f6f4f0', muted: '#6b7280', indigo: '#4f46e5', gold: '#b8860b',
  green: '#16a34a', red: '#dc2626', blue: '#0369a1', amber: '#d97706',
  navy: '#1e3a5f', teal: '#0f766e', purple: '#7c3aed', orange: '#ea580c',
};
const sr = s => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };

const SECTORS = ['Power','Steel','Cement','Oil & Gas','Chemicals','Aluminium','Paper',
  'Aviation','Shipping','Agriculture','Mining','Waste'];
const REGIONS = ['Europe','North America','Asia Pacific','Latin America','Middle East','Africa'];
const ALERT_TYPES = ['None','Warning','Breach','Critical'];
const COMPLIANCE_STATUSES = ['Compliant','Non-Compliant','Pending Review','Exempt'];
const VERIFICATION_STATUSES = ['Verified','Estimated','Pending'];

// 80 facilities generated outside component
const FACILITIES = Array.from({ length: 80 }, (_, i) => {
  const sectorIdx = Math.floor(sr(i * 7) * SECTORS.length);
  const regionIdx = Math.floor(sr(i * 11) * REGIONS.length);
  const sector = SECTORS[sectorIdx];
  const region = REGIONS[regionIdx];
  const permitLimit = 50 + sr(i * 13) * 950; // ktCO2e
  const budgetUtilization = 0.4 + sr(i * 17) * 0.8;
  const scope1Current = parseFloat((permitLimit * budgetUtilization).toFixed(1));
  const scope1Budget = parseFloat(permitLimit.toFixed(1));
  const scope1Variance = parseFloat((scope1Current - scope1Budget).toFixed(1));
  const scope2Location = parseFloat((scope1Current * (0.1 + sr(i * 19) * 0.3)).toFixed(1));
  const scope2Market = parseFloat((scope2Location * (0.5 + sr(i * 23) * 0.8)).toFixed(1));
  const scope3Up = parseFloat((scope1Current * (0.3 + sr(i * 29) * 0.7)).toFixed(1));
  const anomalyScore = parseFloat((sr(i * 31) * 100).toFixed(1));
  const alertIdx = anomalyScore > 80 ? 3 : anomalyScore > 60 ? 2 : anomalyScore > 35 ? 1 : 0;
  const complianceIdx = Math.floor(sr(i * 37) * COMPLIANCE_STATUSES.length);
  const verIdx = Math.floor(sr(i * 41) * VERIFICATION_STATUSES.length);
  const emissionFactor = parseFloat((0.1 + sr(i * 43) * 2).toFixed(3));
  // EWMA trend: 5 periods of sr-seeded history
  const lambda = 0.94;
  let ewmaVal = scope1Current;
  const trend = Array.from({ length: 5 }, (_, t) => {
    const obs = scope1Current * (0.8 + sr(i * 100 + t) * 0.4);
    ewmaVal = lambda * ewmaVal + (1 - lambda) * obs;
    return parseFloat(ewmaVal.toFixed(1));
  });
  return {
    id: i,
    name: `${['Alpha','Beta','Gamma','Delta','Epsilon','Zeta','Eta','Theta','Iota','Kappa'][i % 10]} ${sector} Plant ${Math.floor(i / 10) + 1}`,
    sector, region,
    country: ['Germany','USA','China','Japan','India','Brazil','UK','France','Australia','Canada',
      'South Korea','Mexico','Saudi Arabia','South Africa','Indonesia'][Math.floor(sr(i * 47) * 15)],
    scope1Current, scope1Budget, scope1Variance,
    scope2Location, scope2Market,
    scope3Upstream: scope3Up,
    alertType: ALERT_TYPES[alertIdx],
    anomalyScore,
    permitLimit: parseFloat(permitLimit.toFixed(1)),
    complianceStatus: COMPLIANCE_STATUSES[complianceIdx],
    trend,
    verificationStatus: VERIFICATION_STATUSES[verIdx],
    lastReportDate: `2026-${String(Math.floor(1 + sr(i * 53) * 3)).padStart(2,'0')}-${String(Math.floor(1 + sr(i * 57) * 27)).padStart(2,'0')}`,
    emissionFactor,
    reductionTarget2030: Math.round(20 + sr(i * 59) * 45),
    reductionTarget2050: Math.round(65 + sr(i * 61) * 35),
    permitUtilization: parseFloat((scope1Current / permitLimit * 100).toFixed(1)),
  };
});

const PATHWAY_YEARS = Array.from({ length: 26 }, (_, i) => 2025 + i);

export default function RealTimeEmissionsMonitorPage() {
  const [activeTab, setActiveTab] = useState(0);
  const [sectorFilter, setSectorFilter] = useState('All');
  const [alertFilter, setAlertFilter] = useState('All');
  const [complianceFilter, setComplianceFilter] = useState('All');
  const [regionFilter, setRegionFilter] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [anomalyThreshold, setAnomalyThreshold] = useState(40);
  const [showVariance, setShowVariance] = useState(false);
  const [sortCol, setSortCol] = useState('scope1Current');
  const [sortDir, setSortDir] = useState('desc');
  const [selectedFacility, setSelectedFacility] = useState(null);

  const tabs = ['Monitoring Dashboard','Facility Table','Anomaly Detection','Permit Compliance','Scope 2 Dual-Reporting','Reduction Pathways','Summary & Export'];

  const filteredFacilities = useMemo(() => {
    let out = [...FACILITIES];
    if (sectorFilter !== 'All') out = out.filter(f => f.sector === sectorFilter);
    if (alertFilter !== 'All') out = out.filter(f => f.alertType === alertFilter);
    if (complianceFilter !== 'All') out = out.filter(f => f.complianceStatus === complianceFilter);
    if (regionFilter !== 'All') out = out.filter(f => f.region === regionFilter);
    if (searchTerm) out = out.filter(f => f.name.toLowerCase().includes(searchTerm.toLowerCase()) || f.sector.toLowerCase().includes(searchTerm.toLowerCase()) || f.country.toLowerCase().includes(searchTerm.toLowerCase()));
    out = out.sort((a, b) => {
      const v = sortDir === 'asc' ? 1 : -1;
      if (typeof a[sortCol] === 'number') return (a[sortCol] - b[sortCol]) * v;
      return (a[sortCol] > b[sortCol] ? 1 : -1) * v;
    });
    return out;
  }, [sectorFilter, alertFilter, complianceFilter, regionFilter, searchTerm, sortCol, sortDir]);

  const kpis = useMemo(() => {
    const total = FACILITIES.reduce((s, f) => s + f.scope1Current, 0);
    const budget = FACILITIES.reduce((s, f) => s + f.scope1Budget, 0);
    const breaches = FACILITIES.filter(f => f.alertType === 'Breach' || f.alertType === 'Critical').length;
    const compliant = FACILITIES.filter(f => f.complianceStatus === 'Compliant').length;
    const avgAnomaly = FACILITIES.reduce((s, f) => s + f.anomalyScore, 0) / FACILITIES.length;
    return {
      totalEmissions: total.toFixed(0),
      totalBudget: budget.toFixed(0),
      utilizationRate: (total / budget * 100).toFixed(1),
      breaches, compliant,
      avgAnomaly: avgAnomaly.toFixed(1),
    };
  }, []);

  const sectorStats = useMemo(() => {
    const groups = {};
    FACILITIES.forEach(f => {
      if (!groups[f.sector]) groups[f.sector] = { sector: f.sector, total: 0, budget: 0, count: 0, totalAnomaly: 0 };
      groups[f.sector].total += f.scope1Current;
      groups[f.sector].budget += f.scope1Budget;
      groups[f.sector].count++;
      groups[f.sector].totalAnomaly += f.anomalyScore;
    });
    return Object.values(groups).map(g => ({
      ...g,
      total: parseFloat(g.total.toFixed(0)),
      budget: parseFloat(g.budget.toFixed(0)),
      avgAnomaly: parseFloat((g.count > 0 ? g.totalAnomaly / g.count : 0).toFixed(1)),
      utilization: parseFloat((g.budget > 0 ? g.total / g.budget * 100 : 0).toFixed(1)),
    }));
  }, []);

  const topEmitters = useMemo(() => {
    return [...FACILITIES].sort((a, b) => b.scope1Current - a.scope1Current).slice(0, 20).map(f => ({
      name: f.name.split(' ').slice(0, 3).join(' '),
      actual: f.scope1Current,
      budget: f.scope1Budget,
    }));
  }, []);

  const anomalyFacilities = useMemo(() => {
    return [...FACILITIES].filter(f => f.anomalyScore >= anomalyThreshold).sort((a, b) => b.anomalyScore - a.anomalyScore);
  }, [anomalyThreshold]);

  const scope2Comparison = useMemo(() => {
    return sectorStats.map(s => {
      const facilities = FACILITIES.filter(f => f.sector === s.sector);
      const avgLocation = facilities.length > 0 ? facilities.reduce((a, f) => a + f.scope2Location, 0) / facilities.length : 0;
      const avgMarket = facilities.length > 0 ? facilities.reduce((a, f) => a + f.scope2Market, 0) / facilities.length : 0;
      return { sector: s.sector, location: parseFloat(avgLocation.toFixed(1)), market: parseFloat(avgMarket.toFixed(1)), gap: parseFloat((avgLocation - avgMarket).toFixed(1)) };
    });
  }, [sectorStats]);

  const ewmaHistory = useMemo(() => {
    if (!selectedFacility) return [];
    const f = FACILITIES[selectedFacility];
    if (!f) return [];
    const base = f.scope1Current;
    const lambda = 0.94;
    let ewma = base;
    return Array.from({ length: 20 }, (_, i) => {
      const obs = base * (0.7 + sr(f.id * 200 + i) * 0.6);
      ewma = lambda * ewma + (1 - lambda) * obs;
      return {
        period: `T-${19 - i}`,
        observed: parseFloat(obs.toFixed(1)),
        ewma: parseFloat(ewma.toFixed(1)),
        upper: parseFloat((ewma * 1.15).toFixed(1)),
        lower: parseFloat((ewma * 0.85).toFixed(1)),
      };
    });
  }, [selectedFacility]);

  const reductionPathways = useMemo(() => {
    const sectorGrouped = {};
    SECTORS.slice(0, 6).forEach(s => {
      const facilities = FACILITIES.filter(f => f.sector === s);
      if (!facilities.length) return;
      const baseTotal = facilities.reduce((a, f) => a + f.scope1Current, 0);
      sectorGrouped[s] = baseTotal;
    });
    return PATHWAY_YEARS.map((yr, i) => {
      const reduction = i / 25;
      const row = { year: yr };
      Object.entries(sectorGrouped).forEach(([s, base]) => {
        row[s] = parseFloat((base * (1 - reduction * 0.7)).toFixed(0));
      });
      return row;
    });
  }, []);

  const alertColor = (a) => ({ None: T.green, Warning: T.amber, Breach: T.orange, Critical: T.red }[a] || T.muted);
  const alertBg = (a) => ({ None: '#dcfce7', Warning: '#fef3c7', Breach: '#ffedd5', Critical: '#fee2e2' }[a] || '#f3f4f6');
  const complianceColor = (c) => ({ Compliant: T.green, 'Non-Compliant': T.red, 'Pending Review': T.amber, Exempt: T.teal }[c] || T.muted);

  const handleSort = (col) => {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortCol(col); setSortDir('desc'); }
  };

  const KpiCard = ({ label, value, sub, color }) => (
    <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: '14px 18px', flex: 1 }}>
      <div style={{ fontSize: 11, color: T.muted, textTransform: 'uppercase', letterSpacing: 1 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 700, color: color || T.text, marginTop: 4 }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: T.muted, marginTop: 2 }}>{sub}</div>}
    </div>
  );

  return (
    <div style={{ background: T.bg, minHeight: '100vh', padding: 24, fontFamily: 'DM Sans, sans-serif' }}>
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
            <div style={{ width: 4, height: 32, background: T.orange, borderRadius: 2 }} />
            <h1 style={{ fontSize: 24, fontWeight: 700, color: T.text, margin: 0 }}>Real-Time Emissions Monitor</h1>
            <span style={{ background: T.orange, color: '#fff', fontSize: 11, padding: '2px 8px', borderRadius: 4 }}>EP-CY5</span>
          </div>
          <p style={{ color: T.muted, margin: 0, marginLeft: 16, fontSize: 13 }}>80 facilities · 12 sectors · EWMA anomaly detection · Scope 2 dual-reporting · Permit compliance</p>
        </div>

        <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
          <KpiCard label="Total Emissions" value={`${(Number(kpis.totalEmissions)/1000).toFixed(1)}Mt`} sub="ktCO2e all facilities" color={T.orange} />
          <KpiCard label="Budget Utilization" value={`${kpis.utilizationRate}%`} sub="actual vs permitted" color={Number(kpis.utilizationRate) > 100 ? T.red : T.teal} />
          <KpiCard label="Breaches / Critical" value={kpis.breaches} sub="permit exceedances" color={T.red} />
          <KpiCard label="Compliant" value={kpis.compliant} sub="of 80 facilities" color={T.green} />
          <KpiCard label="Avg Anomaly Score" value={kpis.avgAnomaly} sub="EWMA λ=0.94" color={Number(kpis.avgAnomaly) > 60 ? T.red : T.amber} />
          <KpiCard label="Facilities" value={filteredFacilities.length} sub="after filters" />
        </div>

        <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: `1px solid ${T.border}` }}>
          {tabs.map((t, i) => (
            <button key={i} onClick={() => setActiveTab(i)} style={{
              padding: '8px 14px', border: 'none', background: activeTab === i ? T.orange : 'transparent',
              color: activeTab === i ? '#fff' : T.muted, borderRadius: '6px 6px 0 0', cursor: 'pointer',
              fontWeight: activeTab === i ? 600 : 400, fontSize: 12,
            }}>{t}</button>
          ))}
        </div>

        {/* Filter Row */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
          <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Search facilities…"
            style={{ padding: '6px 12px', border: `1px solid ${T.border}`, borderRadius: 6, fontSize: 13, width: 180 }} />
          <select value={sectorFilter} onChange={e => setSectorFilter(e.target.value)}
            style={{ padding: '6px 10px', border: `1px solid ${T.border}`, borderRadius: 6, fontSize: 12 }}>
            <option value="All">All Sectors</option>
            {SECTORS.map(s => <option key={s}>{s}</option>)}
          </select>
          <select value={alertFilter} onChange={e => setAlertFilter(e.target.value)}
            style={{ padding: '6px 10px', border: `1px solid ${T.border}`, borderRadius: 6, fontSize: 12 }}>
            <option value="All">All Alerts</option>
            {ALERT_TYPES.map(a => <option key={a}>{a}</option>)}
          </select>
          <select value={complianceFilter} onChange={e => setComplianceFilter(e.target.value)}
            style={{ padding: '6px 10px', border: `1px solid ${T.border}`, borderRadius: 6, fontSize: 12 }}>
            <option value="All">All Compliance</option>
            {COMPLIANCE_STATUSES.map(c => <option key={c}>{c}</option>)}
          </select>
          <select value={regionFilter} onChange={e => setRegionFilter(e.target.value)}
            style={{ padding: '6px 10px', border: `1px solid ${T.border}`, borderRadius: 6, fontSize: 12 }}>
            <option value="All">All Regions</option>
            {REGIONS.map(r => <option key={r}>{r}</option>)}
          </select>
          <button onClick={() => setShowVariance(v => !v)} style={{ padding: '5px 12px', background: showVariance ? T.orange : T.card, border: `1px solid ${T.border}`, borderRadius: 5, fontSize: 12, cursor: 'pointer', color: showVariance ? '#fff' : T.text }}>
            {showVariance ? '✓ Variance View' : 'Variance View'}
          </button>
        </div>

        {/* TAB 0 — Monitoring Dashboard */}
        {activeTab === 0 && (
          <div>
            {/* Alert Summary */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 16 }}>
              {ALERT_TYPES.map(a => {
                const count = FACILITIES.filter(f => f.alertType === a).length;
                return (
                  <div key={a} style={{ background: alertBg(a), border: `1px solid ${alertColor(a)}30`, borderRadius: 8, padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: 11, color: alertColor(a), fontWeight: 600, textTransform: 'uppercase' }}>{a}</div>
                      <div style={{ fontSize: 24, fontWeight: 700, color: alertColor(a) }}>{count}</div>
                    </div>
                    <div style={{ fontSize: 24, color: alertColor(a) }}>
                      {a === 'None' ? '✓' : a === 'Warning' ? '⚠' : a === 'Breach' ? '⛔' : '🚨'}
                    </div>
                  </div>
                );
              })}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
                <h3 style={{ margin: '0 0 12px', fontSize: 14 }}>Top 20 Emitters vs Budget (ktCO2e)</h3>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={topEmitters}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="name" tick={{ fontSize: 9 }} angle={-30} textAnchor="end" height={55} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="actual" fill={T.orange} radius={[2,2,0,0]} name="Actual" />
                    <Bar dataKey="budget" fill={T.teal} radius={[2,2,0,0]} name="Budget" opacity={0.6} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
                <h3 style={{ margin: '0 0 12px', fontSize: 14 }}>Emissions by Sector</h3>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={sectorStats} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis type="number" tick={{ fontSize: 10 }} />
                    <YAxis dataKey="sector" type="category" tick={{ fontSize: 10 }} width={70} />
                    <Tooltip />
                    <Bar dataKey="total" fill={T.orange} radius={[0,2,2,0]} name="Total ktCO2e" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* TAB 1 — Facility Table */}
        {activeTab === 1 && (
          <div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, overflow: 'hidden' }}>
              <div style={{ overflowX: 'auto', maxHeight: 560, overflowY: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead>
                    <tr style={{ background: T.sub }}>
                      {['name','sector','region','scope1Current','scope1Budget','permitUtilization','scope2Location','scope2Market','alertType','complianceStatus','anomalyScore','verificationStatus'].map(col => (
                        <th key={col} onClick={() => handleSort(col)} style={{ padding: '7px 10px', textAlign: 'left', cursor: 'pointer', whiteSpace: 'nowrap', fontSize: 11, fontWeight: 600, color: sortCol === col ? T.orange : T.text }}>
                          {col.replace(/([A-Z])/g, ' $1')} {sortCol === col ? (sortDir === 'asc' ? '↑' : '↓') : ''}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredFacilities.map((f, idx) => (
                      <tr key={f.id} onClick={() => setSelectedFacility(selectedFacility === f.id ? null : f.id)}
                        style={{ background: selectedFacility === f.id ? '#fff7ed' : idx % 2 === 0 ? '#fff' : T.sub, cursor: 'pointer', borderBottom: `1px solid ${T.border}` }}>
                        <td style={{ padding: '7px 10px', fontWeight: 600, whiteSpace: 'nowrap' }}>{f.name}</td>
                        <td style={{ padding: '7px 10px' }}><span style={{ background: T.sub, padding: '1px 5px', borderRadius: 3, fontSize: 11 }}>{f.sector}</span></td>
                        <td style={{ padding: '7px 10px', fontSize: 11 }}>{f.region}</td>
                        <td style={{ padding: '7px 10px', fontWeight: 700, color: f.scope1Current > f.scope1Budget ? T.red : T.text }}>{f.scope1Current}</td>
                        <td style={{ padding: '7px 10px', color: T.muted }}>{f.scope1Budget}</td>
                        <td style={{ padding: '7px 10px', minWidth: 90 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <div style={{ flex: 1, background: T.border, borderRadius: 4, overflow: 'hidden', height: 6 }}>
                              <div style={{ height: '100%', background: f.permitUtilization > 100 ? T.red : f.permitUtilization > 80 ? T.amber : T.green, width: `${Math.min(100, f.permitUtilization)}%` }} />
                            </div>
                            <span style={{ fontSize: 10, color: T.muted }}>{f.permitUtilization}%</span>
                          </div>
                        </td>
                        <td style={{ padding: '7px 10px' }}>{f.scope2Location}</td>
                        <td style={{ padding: '7px 10px' }}>{f.scope2Market}</td>
                        <td style={{ padding: '7px 10px' }}>
                          <span style={{ background: alertBg(f.alertType), color: alertColor(f.alertType), padding: '2px 7px', borderRadius: 4, fontSize: 11, fontWeight: 600 }}>{f.alertType}</span>
                        </td>
                        <td style={{ padding: '7px 10px' }}>
                          <span style={{ color: complianceColor(f.complianceStatus), fontWeight: 600, fontSize: 11 }}>{f.complianceStatus}</span>
                        </td>
                        <td style={{ padding: '7px 10px', fontWeight: 700, color: f.anomalyScore > 70 ? T.red : f.anomalyScore > 40 ? T.amber : T.green }}>{f.anomalyScore}</td>
                        <td style={{ padding: '7px 10px', fontSize: 11, color: f.verificationStatus === 'Verified' ? T.green : f.verificationStatus === 'Pending' ? T.amber : T.muted }}>{f.verificationStatus}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            {selectedFacility !== null && FACILITIES[selectedFacility] && (
              <div style={{ background: T.card, border: `1px solid ${T.orange}`, borderRadius: 8, padding: 16, marginTop: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                  <h3 style={{ margin: 0, color: T.orange }}>{FACILITIES[selectedFacility].name} — Full Detail</h3>
                  <button onClick={() => setSelectedFacility(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: T.muted }}>×</button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 8 }}>
                  {[['Sector', FACILITIES[selectedFacility].sector],['Region', FACILITIES[selectedFacility].region],['Country', FACILITIES[selectedFacility].country],['Permit Limit', `${FACILITIES[selectedFacility].permitLimit} kt`],['Scope 1 Current', `${FACILITIES[selectedFacility].scope1Current} kt`],['Scope 1 Budget', `${FACILITIES[selectedFacility].scope1Budget} kt`],['Variance', `${FACILITIES[selectedFacility].scope1Variance} kt`],['Scope 2 Location', `${FACILITIES[selectedFacility].scope2Location} kt`],['Scope 2 Market', `${FACILITIES[selectedFacility].scope2Market} kt`],['Scope 3 Up', `${FACILITIES[selectedFacility].scope3Upstream} kt`],['Anomaly Score', FACILITIES[selectedFacility].anomalyScore],['Alert', FACILITIES[selectedFacility].alertType],['Compliance', FACILITIES[selectedFacility].complianceStatus],['Verification', FACILITIES[selectedFacility].verificationStatus],['Last Report', FACILITIES[selectedFacility].lastReportDate],['Emission Factor', FACILITIES[selectedFacility].emissionFactor],['Target 2030', `${FACILITIES[selectedFacility].reductionTarget2030}%`],['Target 2050', `${FACILITIES[selectedFacility].reductionTarget2050}%`]].map(([k,v]) => (
                    <div key={k} style={{ background: T.sub, borderRadius: 5, padding: '7px 10px' }}>
                      <div style={{ fontSize: 10, color: T.muted }}>{k}</div>
                      <div style={{ fontSize: 12, fontWeight: 600, marginTop: 2 }}>{v}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2 — Anomaly Detection */}
        {activeTab === 2 && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 14, background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 14 }}>
              <label style={{ fontSize: 13, fontWeight: 600 }}>Anomaly Threshold:</label>
              <input type="range" min="0" max="100" step="5" value={anomalyThreshold} onChange={e => setAnomalyThreshold(Number(e.target.value))}
                style={{ width: 200 }} />
              <span style={{ fontSize: 14, fontWeight: 700, color: T.orange }}>{anomalyThreshold}</span>
              <span style={{ fontSize: 12, color: T.muted }}>{anomalyFacilities.length} facilities exceed threshold</span>
              <div style={{ marginLeft: 'auto' }}>
                <label style={{ fontSize: 13, fontWeight: 600, marginRight: 8 }}>Drill-down Facility:</label>
                <select value={selectedFacility ?? 0} onChange={e => setSelectedFacility(Number(e.target.value))}
                  style={{ padding: '5px 8px', border: `1px solid ${T.border}`, borderRadius: 5, fontSize: 12 }}>
                  {FACILITIES.map((f, i) => <option key={i} value={i}>{f.name}</option>)}
                </select>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
                <h3 style={{ margin: '0 0 12px', fontSize: 14 }}>Anomaly Scores — Top Flagged Facilities</h3>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={anomalyFacilities.slice(0, 20).map(f => ({ name: f.name.split(' ').slice(0,3).join(' '), score: f.anomalyScore }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="name" tick={{ fontSize: 9 }} angle={-30} textAnchor="end" height={55} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                    <ReferenceLine y={anomalyThreshold} stroke={T.red} strokeDasharray="4 2" label={{ value: `Threshold ${anomalyThreshold}`, fontSize: 10 }} />
                    <Tooltip />
                    <Bar dataKey="score" fill={T.orange} radius={[2,2,0,0]} name="Anomaly Score" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
                <h3 style={{ margin: '0 0 12px', fontSize: 14 }}>
                  EWMA Trend — {selectedFacility !== null && FACILITIES[selectedFacility] ? FACILITIES[selectedFacility].name : 'Select Facility'}
                </h3>
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart data={ewmaHistory}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="period" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="observed" stroke={T.orange} strokeWidth={2} dot={false} name="Observed" />
                    <Line type="monotone" dataKey="ewma" stroke={T.indigo} strokeWidth={2} dot={false} name="EWMA (λ=0.94)" />
                    <Line type="monotone" dataKey="upper" stroke={T.red} strokeWidth={1} dot={false} strokeDasharray="4 2" name="Upper Band" />
                    <Line type="monotone" dataKey="lower" stroke={T.green} strokeWidth={1} dot={false} strokeDasharray="4 2" name="Lower Band" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3 — Permit Compliance */}
        {activeTab === 3 && (
          <div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16, marginBottom: 16 }}>
              <h3 style={{ margin: '0 0 12px', fontSize: 14 }}>Permit Utilization by Sector</h3>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={sectorStats}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="sector" tick={{ fontSize: 10 }} angle={-20} textAnchor="end" height={45} />
                  <YAxis tick={{ fontSize: 10 }} unit="%" />
                  <ReferenceLine y={100} stroke={T.red} strokeDasharray="4 2" label={{ value: '100% Limit', fontSize: 10 }} />
                  <Tooltip />
                  <Bar dataKey="utilization" fill={T.orange} radius={[2,2,0,0]} name="Utilization %" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: T.sub }}>
                    {['Facility','Sector','Permit Limit','Actual S1','Utilization','Alert','Compliance','Last Report'].map(h => (
                      <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600, fontSize: 11 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[...FACILITIES].sort((a,b) => b.permitUtilization - a.permitUtilization).slice(0,30).map((f, i) => (
                    <tr key={f.id} style={{ background: i % 2 === 0 ? '#fff' : T.sub, borderBottom: `1px solid ${T.border}` }}>
                      <td style={{ padding: '7px 12px', fontWeight: 600 }}>{f.name}</td>
                      <td style={{ padding: '7px 12px' }}>{f.sector}</td>
                      <td style={{ padding: '7px 12px' }}>{f.permitLimit} kt</td>
                      <td style={{ padding: '7px 12px', color: f.scope1Current > f.scope1Budget ? T.red : T.text, fontWeight: f.scope1Current > f.scope1Budget ? 700 : 400 }}>{f.scope1Current} kt</td>
                      <td style={{ padding: '7px 12px', minWidth: 100 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <div style={{ width: 60, background: T.border, borderRadius: 3, overflow: 'hidden', height: 5 }}>
                            <div style={{ height: '100%', background: f.permitUtilization > 100 ? T.red : f.permitUtilization > 80 ? T.amber : T.green, width: `${Math.min(100, f.permitUtilization)}%` }} />
                          </div>
                          <span style={{ fontSize: 11, fontWeight: 700, color: f.permitUtilization > 100 ? T.red : T.text }}>{f.permitUtilization}%</span>
                        </div>
                      </td>
                      <td style={{ padding: '7px 12px' }}><span style={{ background: alertBg(f.alertType), color: alertColor(f.alertType), padding: '2px 6px', borderRadius: 4, fontSize: 11 }}>{f.alertType}</span></td>
                      <td style={{ padding: '7px 12px', color: complianceColor(f.complianceStatus), fontWeight: 600, fontSize: 11 }}>{f.complianceStatus}</td>
                      <td style={{ padding: '7px 12px', fontSize: 11, color: T.muted }}>{f.lastReportDate}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4 — Scope 2 Dual-Reporting */}
        {activeTab === 4 && (
          <div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16, marginBottom: 16 }}>
              <h3 style={{ margin: '0 0 12px', fontSize: 14 }}>Location-Based vs Market-Based Scope 2 by Sector</h3>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={scope2Comparison}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="sector" tick={{ fontSize: 10 }} angle={-20} textAnchor="end" height={45} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="location" fill={T.orange} radius={[2,2,0,0]} name="Location-Based" />
                  <Bar dataKey="market" fill={T.teal} radius={[2,2,0,0]} name="Market-Based" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: T.sub }}>
                    {['Sector','Location-Based (avg kt)','Market-Based (avg kt)','Gap (kt)','Gap %','Renewable Coverage'].map(h => (
                      <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600, fontSize: 11 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {scope2Comparison.map((s, i) => (
                    <tr key={s.sector} style={{ background: i % 2 === 0 ? '#fff' : T.sub, borderBottom: `1px solid ${T.border}` }}>
                      <td style={{ padding: '7px 12px', fontWeight: 600 }}>{s.sector}</td>
                      <td style={{ padding: '7px 12px' }}>{s.location.toFixed(1)}</td>
                      <td style={{ padding: '7px 12px' }}>{s.market.toFixed(1)}</td>
                      <td style={{ padding: '7px 12px', color: s.gap > 0 ? T.orange : T.green, fontWeight: 700 }}>{s.gap > 0 ? '+' : ''}{s.gap.toFixed(1)}</td>
                      <td style={{ padding: '7px 12px', color: s.gap > 0 ? T.orange : T.green }}>{s.location > 0 ? (s.gap / s.location * 100).toFixed(1) : '0'}%</td>
                      <td style={{ padding: '7px 12px', color: T.teal }}>{s.gap > 0 ? `${(s.gap / s.location * 100).toFixed(0)}% RE certificates` : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 5 — Reduction Pathways */}
        {activeTab === 5 && (
          <div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16, marginBottom: 16 }}>
              <h3 style={{ margin: '0 0 12px', fontSize: 14 }}>Sector Emissions Pathways 2025–2050 (ktCO2e)</h3>
              <ResponsiveContainer width="100%" height={320}>
                <LineChart data={reductionPathways}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="year" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Legend />
                  {SECTORS.slice(0, 6).map((s, i) => (
                    <Line key={s} type="monotone" dataKey={s} stroke={[T.orange, T.blue, T.teal, T.purple, T.green, T.red][i]} strokeWidth={2} dot={false} />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
              {sectorStats.map(s => (
                <div key={s.sector} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 12 }}>
                  <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 6 }}>{s.sector}</div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <div style={{ flex: 1, background: T.sub, borderRadius: 5, padding: '6px 8px' }}>
                      <div style={{ fontSize: 10, color: T.muted }}>Current</div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: T.orange }}>{(s.total/1000).toFixed(1)}Mt</div>
                    </div>
                    <div style={{ flex: 1, background: T.sub, borderRadius: 5, padding: '6px 8px' }}>
                      <div style={{ fontSize: 10, color: T.muted }}>Utilization</div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: s.utilization > 100 ? T.red : T.green }}>{s.utilization}%</div>
                    </div>
                    <div style={{ flex: 1, background: T.sub, borderRadius: 5, padding: '6px 8px' }}>
                      <div style={{ fontSize: 10, color: T.muted }}>Facilities</div>
                      <div style={{ fontSize: 14, fontWeight: 700 }}>{s.count}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 6 — Summary & Export */}
        {activeTab === 6 && (
          <div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16, marginBottom: 16 }}>
              <h3 style={{ margin: '0 0 16px', fontSize: 15 }}>Emissions Monitor — Full Compliance Dashboard</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
                {[
                  ['Total Facilities', 80],['Sectors', 12],['Total Emissions', `${(Number(kpis.totalEmissions)/1000).toFixed(1)}Mt`],
                  ['Budget Utilization', `${kpis.utilizationRate}%`],['Compliant Facilities', kpis.compliant],
                  ['Non-Compliant', FACILITIES.filter(f=>f.complianceStatus==='Non-Compliant').length],
                  ['Breach/Critical Alerts', kpis.breaches],['Warning Alerts', FACILITIES.filter(f=>f.alertType==='Warning').length],
                  ['Verified Facilities', FACILITIES.filter(f=>f.verificationStatus==='Verified').length],
                  ['Estimated Facilities', FACILITIES.filter(f=>f.verificationStatus==='Estimated').length],
                  ['Avg Anomaly Score', kpis.avgAnomaly],
                  ['Avg Permit Utilization', `${(FACILITIES.reduce((s,f)=>s+f.permitUtilization,0)/FACILITIES.length).toFixed(1)}%`],
                ].map(([k,v]) => (
                  <div key={k} style={{ background: T.sub, borderRadius: 6, padding: '10px 14px' }}>
                    <div style={{ fontSize: 11, color: T.muted, textTransform: 'uppercase' }}>{k}</div>
                    <div style={{ fontSize: 16, fontWeight: 700, marginTop: 3 }}>{v}</div>
                  </div>
                ))}
              </div>
            </div>
            {/* Alert Log */}
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, overflow: 'hidden' }}>
              <div style={{ padding: '8px 14px', background: T.sub, borderBottom: `1px solid ${T.border}` }}>
                <span style={{ fontWeight: 600, fontSize: 13 }}>Full Facility Export (80 facilities)</span>
              </div>
              <div style={{ overflowX: 'auto', maxHeight: 380, overflowY: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                  <thead>
                    <tr style={{ background: T.sub }}>
                      {['Facility','Sector','Region','S1 Actual','S1 Budget','Util%','S2 Loc','S2 Mkt','Alert','Compliance','Anomaly','Verification','Last Report'].map(h => (
                        <th key={h} style={{ padding: '6px 8px', textAlign: 'left', fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {FACILITIES.map((f, idx) => (
                      <tr key={f.id} style={{ background: idx % 2 === 0 ? '#fff' : T.sub, borderBottom: `1px solid ${T.border}` }}>
                        <td style={{ padding: '5px 8px', fontWeight: 600, whiteSpace: 'nowrap' }}>{f.name}</td>
                        <td style={{ padding: '5px 8px' }}>{f.sector}</td>
                        <td style={{ padding: '5px 8px' }}>{f.region}</td>
                        <td style={{ padding: '5px 8px', color: f.scope1Current > f.scope1Budget ? T.red : T.text, fontWeight: f.scope1Current > f.scope1Budget ? 700 : 400 }}>{f.scope1Current}</td>
                        <td style={{ padding: '5px 8px' }}>{f.scope1Budget}</td>
                        <td style={{ padding: '5px 8px', color: f.permitUtilization > 100 ? T.red : T.green, fontWeight: 700 }}>{f.permitUtilization}%</td>
                        <td style={{ padding: '5px 8px' }}>{f.scope2Location}</td>
                        <td style={{ padding: '5px 8px' }}>{f.scope2Market}</td>
                        <td style={{ padding: '5px 8px' }}><span style={{ background: alertBg(f.alertType), color: alertColor(f.alertType), padding: '1px 5px', borderRadius: 3 }}>{f.alertType}</span></td>
                        <td style={{ padding: '5px 8px', color: complianceColor(f.complianceStatus), fontSize: 10 }}>{f.complianceStatus}</td>
                        <td style={{ padding: '5px 8px', color: f.anomalyScore > 70 ? T.red : f.anomalyScore > 40 ? T.amber : T.green }}>{f.anomalyScore}</td>
                        <td style={{ padding: '5px 8px' }}>{f.verificationStatus}</td>
                        <td style={{ padding: '5px 8px', whiteSpace: 'nowrap' }}>{f.lastReportDate}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Bottom always-on analytics */}
        <div style={{ marginTop: 20 }}>
          {/* EWMA anomaly matrix by sector × alert */}
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16, marginBottom: 16 }}>
            <h3 style={{ margin: '0 0 12px', fontSize: 14 }}>Sector × Alert Type Distribution</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ background: T.sub }}>
                  <th style={{ padding:'6px 10px', textAlign:'left', fontWeight:600 }}>Sector</th>
                  {ALERT_TYPES.map(a=><th key={a} style={{ padding:'6px 10px', textAlign:'center', fontWeight:600, color:alertColor(a) }}>{a}</th>)}
                  <th style={{ padding:'6px 10px', textAlign:'center', fontWeight:600 }}>Avg Anomaly</th>
                  <th style={{ padding:'6px 10px', textAlign:'center', fontWeight:600 }}>Avg Utilization</th>
                </tr>
              </thead>
              <tbody>
                {SECTORS.map((sector,i)=>{
                  const secFacilities = FACILITIES.filter(f=>f.sector===sector);
                  if(!secFacilities.length) return null;
                  const avgAnomaly = secFacilities.reduce((s,f)=>s+f.anomalyScore,0)/secFacilities.length;
                  const avgUtil = secFacilities.reduce((s,f)=>s+f.permitUtilization,0)/secFacilities.length;
                  return (
                    <tr key={sector} style={{ background:i%2===0?'#fff':T.sub, borderBottom:`1px solid ${T.border}` }}>
                      <td style={{ padding:'5px 10px', fontWeight:600 }}>{sector}</td>
                      {ALERT_TYPES.map(alert=>{
                        const count = secFacilities.filter(f=>f.alertType===alert).length;
                        return <td key={alert} style={{ padding:'5px 10px', textAlign:'center', color:count>0?alertColor(alert):T.muted, fontWeight:count>0?700:400 }}>{count||'—'}</td>;
                      })}
                      <td style={{ padding:'5px 10px', textAlign:'center', color:avgAnomaly>60?T.red:avgAnomaly>35?T.amber:T.green, fontWeight:700 }}>{avgAnomaly.toFixed(1)}</td>
                      <td style={{ padding:'5px 10px', textAlign:'center', color:avgUtil>100?T.red:T.green, fontWeight:700 }}>{avgUtil.toFixed(1)}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {/* Budget variance decomposition */}
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16, marginBottom: 16 }}>
            <h3 style={{ margin: '0 0 12px', fontSize: 14 }}>Budget Variance Analysis — Price vs Volume Attribution</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10 }}>
              {sectorStats.map(s=>{
                const overBudget = FACILITIES.filter(f=>f.sector===s.sector&&f.scope1Current>f.scope1Budget);
                const underBudget = FACILITIES.filter(f=>f.sector===s.sector&&f.scope1Current<=f.scope1Budget);
                const avgVariance = FACILITIES.filter(f=>f.sector===s.sector).length>0
                  ? FACILITIES.filter(f=>f.sector===s.sector).reduce((a,f)=>a+f.scope1Variance,0)/FACILITIES.filter(f=>f.sector===s.sector).length
                  : 0;
                return (
                  <div key={s.sector} style={{ background:T.sub, borderRadius:6, padding:'8px 10px' }}>
                    <div style={{ fontSize:11, fontWeight:600, marginBottom:4 }}>{s.sector}</div>
                    <div style={{ fontSize:11, color:T.red }}>Over budget: <strong>{overBudget.length}</strong></div>
                    <div style={{ fontSize:11, color:T.green }}>Under budget: <strong>{underBudget.length}</strong></div>
                    <div style={{ fontSize:12, fontWeight:700, color:avgVariance>0?T.red:T.green, marginTop:4 }}>
                      Avg variance: {avgVariance>0?'+':''}{avgVariance.toFixed(1)} kt
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          {/* Verification status breakdown */}
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16, marginBottom: 16 }}>
            <h3 style={{ margin: '0 0 12px', fontSize: 14 }}>Verification Status × Compliance Status Matrix</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ background: T.sub }}>
                  <th style={{ padding:'6px 10px', textAlign:'left', fontWeight:600 }}>Verification</th>
                  {COMPLIANCE_STATUSES.map(c=><th key={c} style={{ padding:'6px 10px', textAlign:'center', fontWeight:600 }}>{c}</th>)}
                  <th style={{ padding:'6px 10px', textAlign:'center', fontWeight:600 }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {VERIFICATION_STATUSES.map((ver,i)=>{
                  const verFacilities = FACILITIES.filter(f=>f.verificationStatus===ver);
                  return (
                    <tr key={ver} style={{ background:i%2===0?'#fff':T.sub, borderBottom:`1px solid ${T.border}` }}>
                      <td style={{ padding:'5px 10px', fontWeight:600, color:ver==='Verified'?T.green:ver==='Pending'?T.amber:T.muted }}>{ver}</td>
                      {COMPLIANCE_STATUSES.map(comp=>{
                        const count = verFacilities.filter(f=>f.complianceStatus===comp).length;
                        return <td key={comp} style={{ padding:'5px 10px', textAlign:'center', color:count>0?complianceColor(comp):T.muted, fontWeight:count>0?600:400 }}>{count||'—'}</td>;
                      })}
                      <td style={{ padding:'5px 10px', textAlign:'center', fontWeight:700 }}>{verFacilities.length}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {/* Emission factor distribution */}
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
            <h3 style={{ margin: '0 0 12px', fontSize: 14 }}>Emission Factor Distribution by Sector (tCO2e/unit)</h3>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {SECTORS.map(sector=>{
                const secFacilities = FACILITIES.filter(f=>f.sector===sector);
                const avgEF = secFacilities.length>0 ? secFacilities.reduce((s,f)=>s+f.emissionFactor,0)/secFacilities.length : 0;
                const minEF = secFacilities.length>0 ? Math.min(...secFacilities.map(f=>f.emissionFactor)) : 0;
                const maxEF = secFacilities.length>0 ? Math.max(...secFacilities.map(f=>f.emissionFactor)) : 0;
                return (
                  <div key={sector} style={{ background:T.sub, borderRadius:6, padding:'8px 12px', minWidth:110 }}>
                    <div style={{ fontSize:11, fontWeight:600, color:T.navy }}>{sector}</div>
                    <div style={{ fontSize:16, fontWeight:700, color:T.orange, marginTop:4 }}>{avgEF.toFixed(3)}</div>
                    <div style={{ fontSize:10, color:T.muted }}>avg EF</div>
                    <div style={{ fontSize:10, color:T.muted, marginTop:2 }}>Range: {minEF.toFixed(2)}–{maxEF.toFixed(2)}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        {/* Footer: Quick panels */}
        <div style={{ marginTop:16, display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12 }}>
          <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:8, padding:12 }}>
            <h4 style={{ margin:'0 0 8px', fontSize:13, color:T.red }}>Critical Alerts ({FACILITIES.filter(f=>f.alertType==='Critical').length})</h4>
            {FACILITIES.filter(f=>f.alertType==='Critical').map(f=>(
              <div key={f.id} style={{ padding:'4px 0', borderBottom:`1px solid ${T.border}`, fontSize:11 }}>
                <div style={{ fontWeight:600 }}>{f.name}</div>
                <div style={{ color:T.red }}>{f.sector} · Anomaly: {f.anomalyScore} · Util: {f.permitUtilization}%</div>
              </div>
            ))}
          </div>
          <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:8, padding:12 }}>
            <h4 style={{ margin:'0 0 8px', fontSize:13, color:T.green }}>Top Reduction Targets (2050)</h4>
            {[...FACILITIES].sort((a,b)=>b.reductionTarget2050-a.reductionTarget2050).slice(0,8).map(f=>(
              <div key={f.id} style={{ display:'flex', justifyContent:'space-between', padding:'4px 0', borderBottom:`1px solid ${T.border}`, fontSize:11 }}>
                <span style={{ fontWeight:600 }}>{f.name.split(' ').slice(0,3).join(' ')}</span>
                <span style={{ color:T.green, fontWeight:700 }}>{f.reductionTarget2050}%</span>
              </div>
            ))}
          </div>
          <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:8, padding:12 }}>
            <h4 style={{ margin:'0 0 8px', fontSize:13, color:T.orange }}>Highest Permit Utilization</h4>
            {[...FACILITIES].sort((a,b)=>b.permitUtilization-a.permitUtilization).slice(0,8).map(f=>(
              <div key={f.id} style={{ display:'flex', justifyContent:'space-between', padding:'4px 0', borderBottom:`1px solid ${T.border}`, fontSize:11 }}>
                <span style={{ fontWeight:600 }}>{f.name.split(' ').slice(0,3).join(' ')}</span>
                <span style={{ color:f.permitUtilization>100?T.red:T.amber, fontWeight:700 }}>{f.permitUtilization}%</span>
              </div>
            ))}
          </div>
        </div>
        {/* Country distribution */}
        <div style={{ marginTop:14, background:T.card, border:`1px solid ${T.border}`, borderRadius:8, padding:14 }}>
          <h4 style={{ margin:'0 0 10px', fontSize:13 }}>Country Distribution — Facilities, Emissions & Compliance</h4>
          <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
            {Array.from(new Set(FACILITIES.map(f=>f.country))).map(country=>{
              const countryFacilities = FACILITIES.filter(f=>f.country===country);
              const totalEmissions = countryFacilities.reduce((s,f)=>s+f.scope1Current,0);
              const compliant = countryFacilities.filter(f=>f.complianceStatus==='Compliant').length;
              return (
                <div key={country} style={{ background:T.sub, borderRadius:6, padding:'8px 10px', minWidth:100 }}>
                  <div style={{ fontSize:12, fontWeight:700, color:T.navy }}>{country}</div>
                  <div style={{ fontSize:11 }}>{countryFacilities.length} facilities</div>
                  <div style={{ fontSize:11, color:T.orange }}>{(totalEmissions/1000).toFixed(1)}Mt</div>
                  <div style={{ fontSize:11, color:T.green }}>{compliant}/{countryFacilities.length} compliant</div>
                </div>
              );
            })}
          </div>
        </div>
        {/* Verification quality gap */}
        <div style={{ marginTop:14, background:T.card, border:`1px solid ${T.border}`, borderRadius:8, padding:14 }}>
          <h4 style={{ margin:'0 0 10px', fontSize:13 }}>Data Quality Scorecard — Verification × Sector</h4>
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:11 }}>
              <thead>
                <tr style={{ background:T.sub }}>
                  <th style={{ padding:'5px 8px', textAlign:'left', fontWeight:600 }}>Sector</th>
                  {VERIFICATION_STATUSES.map(v=><th key={v} style={{ padding:'5px 8px', textAlign:'center', fontWeight:600 }}>{v}</th>)}
                  <th style={{ padding:'5px 8px', textAlign:'center', fontWeight:600 }}>Quality Score</th>
                </tr>
              </thead>
              <tbody>
                {SECTORS.map((sector,i)=>{
                  const secFacilities = FACILITIES.filter(f=>f.sector===sector);
                  if(!secFacilities.length) return null;
                  const verified = secFacilities.filter(f=>f.verificationStatus==='Verified').length;
                  const estimated = secFacilities.filter(f=>f.verificationStatus==='Estimated').length;
                  const pending = secFacilities.filter(f=>f.verificationStatus==='Pending').length;
                  const qualityScore = secFacilities.length>0 ? ((verified*100+pending*50)/secFacilities.length).toFixed(0) : 0;
                  return (
                    <tr key={sector} style={{ background:i%2===0?'#fff':T.sub, borderBottom:`1px solid ${T.border}` }}>
                      <td style={{ padding:'4px 8px', fontWeight:600 }}>{sector}</td>
                      <td style={{ padding:'4px 8px', textAlign:'center', color:T.green, fontWeight:verified>0?700:400 }}>{verified||'—'}</td>
                      <td style={{ padding:'4px 8px', textAlign:'center', color:T.muted }}>{estimated||'—'}</td>
                      <td style={{ padding:'4px 8px', textAlign:'center', color:T.amber }}>{pending||'—'}</td>
                      <td style={{ padding:'4px 8px', textAlign:'center', color:Number(qualityScore)>80?T.green:Number(qualityScore)>50?T.amber:T.red, fontWeight:700 }}>{qualityScore}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
        {/* Alert summary matrix */}
        <div style={{ marginTop:14, background:T.card, border:`1px solid ${T.border}`, borderRadius:8, padding:14 }}>
          <h4 style={{ margin:'0 0 10px', fontSize:13 }}>Alert Level Trend — 2026 Q1 Monthly Breakdown (sr-modeled)</h4>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10 }}>
            {['January 2026','February 2026','March 2026'].map((month,mi)=>{
              const seed = mi * 500;
              return (
                <div key={month} style={{ background:T.sub, borderRadius:6, padding:'10px 12px' }}>
                  <div style={{ fontSize:11, fontWeight:600, color:T.navy, marginBottom:6 }}>{month}</div>
                  {ALERT_TYPES.map((alert,ai)=>{
                    const count = Math.floor(sr(seed+ai*7)*15);
                    return (
                      <div key={alert} style={{ display:'flex', justifyContent:'space-between', padding:'2px 0', fontSize:11 }}>
                        <span style={{ color:alertColor(alert) }}>{alert}</span>
                        <span style={{ fontWeight:700, color:alertColor(alert) }}>{count}</span>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
        {/* Reduction target outlook */}
        <div style={{ marginTop:14, background:T.card, border:`1px solid ${T.border}`, borderRadius:8, padding:14 }}>
          <h4 style={{ margin:'0 0 10px', fontSize:13 }}>Reduction Target Achievement Outlook — 2030 & 2050</h4>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10 }}>
            {[
              ['Avg 2030 Target', `${(FACILITIES.reduce((s,f)=>s+f.reductionTarget2030,0)/FACILITIES.length).toFixed(0)}%`],
              ['Avg 2050 Target', `${(FACILITIES.reduce((s,f)=>s+f.reductionTarget2050,0)/FACILITIES.length).toFixed(0)}%`],
              ['On Track (util<80%)', FACILITIES.filter(f=>f.permitUtilization<80).length],
              ['At Risk (util>100%)', FACILITIES.filter(f=>f.permitUtilization>100).length],
            ].map(([k,v])=>(
              <div key={k} style={{ background:T.sub, borderRadius:6, padding:'8px 10px' }}>
                <div style={{ fontSize:10, color:T.muted }}>{k}</div>
                <div style={{ fontSize:18, fontWeight:700, marginTop:2 }}>{v}</div>
              </div>
            ))}
          </div>
        </div>
        {/* Scope 3 upstream summary */}
        <div style={{ marginTop:14, background:T.card, border:`1px solid ${T.border}`, borderRadius:8, padding:14 }}>
          <h4 style={{ margin:'0 0 10px', fontSize:13 }}>Scope 3 Upstream vs Scope 1 Ratio by Sector</h4>
          <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
            {sectorStats.map(s=>{
              const facilities = FACILITIES.filter(f=>f.sector===s.sector);
              const avgS1 = facilities.length>0 ? facilities.reduce((a,f)=>a+f.scope1Current,0)/facilities.length : 0;
              const avgS3 = facilities.length>0 ? facilities.reduce((a,f)=>a+f.scope3Upstream,0)/facilities.length : 0;
              const ratio = avgS1>0 ? avgS3/avgS1 : 0;
              return (
                <div key={s.sector} style={{ background:T.sub, borderRadius:6, padding:'8px 10px', minWidth:110 }}>
                  <div style={{ fontSize:11, fontWeight:600, color:T.navy }}>{s.sector}</div>
                  <div style={{ fontSize:15, fontWeight:700, color:ratio>1.5?T.red:ratio>1?T.amber:T.green, marginTop:2 }}>×{ratio.toFixed(2)}</div>
                  <div style={{ fontSize:10, color:T.muted }}>S3/S1 ratio</div>
                </div>
              );
            })}
          </div>
        </div>
        <div style={{ marginTop:14, background:T.card, border:`1px solid ${T.border}`, borderRadius:8, padding:14 }}>
          <h4 style={{ margin:'0 0 10px', fontSize:13 }}>Data Quality Scorecard by Sector</h4>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:8 }}>
            {sectorStats.map((s,si)=>{
              const verifiedCount = FACILITIES.filter(f=>f.sector===s.sector&&f.verificationStatus==='Verified').length;
              const total = FACILITIES.filter(f=>f.sector===s.sector).length;
              const dqPct = total>0 ? Math.round(verifiedCount/total*100) : 0;
              return (
                <div key={s.sector} style={{ background:T.sub, borderRadius:6, padding:'8px 10px' }}>
                  <div style={{ fontSize:11, fontWeight:600 }}>{s.sector}</div>
                  <div style={{ fontSize:15, fontWeight:700, color:dqPct>=80?T.green:dqPct>=60?T.amber:T.red, marginTop:2 }}>{dqPct}%</div>
                  <div style={{ fontSize:10, color:T.muted }}>{verifiedCount}/{total} verified</div>
                </div>
              );
            })}
          </div>
        </div>
        <div style={{ marginTop:14, background:T.card, border:`1px solid ${T.border}`, borderRadius:8, padding:14 }}>
          <h4 style={{ margin:'0 0 10px', fontSize:13 }}>Country Distribution of Facilities</h4>
          <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
            {['USA','Germany','UK','China','India','France','Japan','Australia','Canada','Brazil'].map((country,ci)=>{
              const count = FACILITIES.filter(f=>f.country===country).length;
              return (
                <div key={country} style={{ background:T.sub, borderRadius:6, padding:'8px 12px', textAlign:'center', minWidth:70 }}>
                  <div style={{ fontSize:11, fontWeight:600 }}>{country}</div>
                  <div style={{ fontSize:16, fontWeight:700, color:T.navy, marginTop:2 }}>{count}</div>
                  <div style={{ fontSize:10, color:T.muted }}>facilities</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
