import React, { useState, useMemo } from 'react';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, ScatterChart, Scatter,
  ZAxis, ReferenceLine,
} from 'recharts';

const T = {
  bg: '#f8f6f0', card: '#ffffff', border: '#e2ded5', text: '#1a1a2e',
  sub: '#f6f4f0', muted: '#6b7280', indigo: '#4f46e5', gold: '#b8860b',
  green: '#16a34a', red: '#dc2626', blue: '#0369a1', amber: '#d97706',
  navy: '#1e3a5f', teal: '#0f766e', purple: '#7c3aed', orange: '#ea580c',
};
const sr = s => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };

const CLIENT_TYPES = ['Pension Fund','Insurance','Sovereign Wealth','Asset Manager','Bank','Endowment','Family Office','Foundation'];
const ENGAGEMENT_STAGES = ['Awareness','Commitment','Action','Leadership'];
const RISK_QUADRANTS = ['Leaders','Transitioners','Laggards','At-Risk'];
const SBTI_STATUSES = ['Committed','Approved','Not Committed','Under Review'];
const REPORTING_FRAMEWORKS = ['TCFD','CSRD','SFDR','ISSB','GRI','CDP','UK SDR'];

const CLIENT_NAMES = [
  'Apex Pension Fund','Nordic Life Insurance','Gulf Sovereign Wealth','Atlas Asset Management',
  'Prime Bank','Meridian Endowment','Crestwood Family Office','Blue Ridge Foundation',
  'Zenith Pension Trust','Pacific Life Re','Delta SWF','Vanguard Capital Mgmt',
  'Continental Bank','Oxford Endowment','Sterling Family Office','Global Impact Foundation',
  'Aurora Pension','Shield Insurance Group','Nordic SWF','Summit Asset Partners',
  'Horizon Bank','Rhodes Endowment','Walton Family Office','Earth First Foundation',
  'Cascade Pension','Granite Insurance','Arabia SWF','Orion Asset Management',
  'Pacific Bank','Turing Endowment','Rosewood Family Office','Climate Foundation',
  'Alpine Pension','Mercury Insurance','Singapore SWF','Nexus Capital',
  'Eastern Bank','Harvard Endowment','Windsor Family Office','Greenleaf Foundation',
  'Century Pension Fund','Coastal Insurance','Norway SWF','BlackRock AM',
  'Standard Bank','Trinity Endowment','Pemberton Family Office','Ocean Foundation',
  'Beacon Pension','Lloyd\'s Insurance','Abu Dhabi SWF','Fidelity Investments',
  'Chase Bank','Princeton Endowment','Rockefeller Family Office','Wellspring Foundation',
  'Cornerstone Pension','Zurich Insurance','Japan GPIF','Schroders AM',
];

// Generate 60 clients outside component
const CLIENTS = Array.from({ length: 60 }, (_, i) => {
  const typeIdx = Math.floor(sr(i * 7) * CLIENT_TYPES.length);
  const stageIdx = Math.floor(sr(i * 11) * ENGAGEMENT_STAGES.length);
  const aum = parseFloat((0.5 + sr(i * 13) * 499).toFixed(1)); // $Bn
  const portfolioITR = parseFloat((1.3 + sr(i * 17) * 3.2).toFixed(2));
  const climateScore = parseFloat((10 + sr(i * 19) * 90).toFixed(1));
  const transitionBudget = parseFloat((aum * 0.01 + sr(i * 23) * aum * 0.1).toFixed(1));
  const greenAllocation = parseFloat((sr(i * 29) * 35).toFixed(1));
  const regulatoryReadiness = parseFloat((sr(i * 31) * 100).toFixed(1));
  const netZeroTarget = 2030 + Math.floor(sr(i * 37) * 20);
  const sbtiIdx = Math.floor(sr(i * 41) * SBTI_STATUSES.length);
  const frameworkCount = Math.floor(1 + sr(i * 43) * REPORTING_FRAMEWORKS.length);
  const frameworks = REPORTING_FRAMEWORKS.slice(0, frameworkCount);
  // Risk quadrant: low ITR + high climate score = Leaders; high ITR + low climate score = At-Risk
  const quadrant = portfolioITR <= 1.8 && climateScore >= 70 ? 'Leaders'
    : portfolioITR <= 2.5 && climateScore >= 40 ? 'Transitioners'
    : portfolioITR <= 3.0 && climateScore >= 20 ? 'Laggards' : 'At-Risk';
  const daysLastEngagement = Math.floor(sr(i * 47) * 180);
  const nextReviewDays = Math.floor(30 + sr(i * 53) * 150);
  return {
    id: i,
    clientName: CLIENT_NAMES[i] || `Client ${i + 1}`,
    type: CLIENT_TYPES[typeIdx],
    aum, portfolioITR, climateScore,
    engagementStage: ENGAGEMENT_STAGES[stageIdx],
    transitionBudget, greenAllocation, regulatoryReadiness,
    netZeroTarget, sbtiStatus: SBTI_STATUSES[sbtiIdx],
    reportingFrameworks: frameworks,
    lastEngagementDate: `2026-${String(Math.floor(1 + sr(i * 59) * 3)).padStart(2,'0')}-${String(Math.floor(1 + sr(i * 61) * 27)).padStart(2,'0')}`,
    nextReviewDate: `2026-${String(Math.floor(3 + Math.floor(nextReviewDays/30))).padStart(2,'0')}-15`,
    riskQuadrant: quadrant,
    customInstruments: Math.floor(sr(i * 67) * 12),
    engagementScore: parseFloat((sr(i * 71) * 100).toFixed(1)),
    requiredCapex: parseFloat((aum * (0.05 + sr(i * 73) * 0.15)).toFixed(1)),
    frameworksRequired: Math.floor(2 + sr(i * 79) * 4),
  };
});

export default function ClientTransitionCommandCenterPage() {
  const [activeTab, setActiveTab] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [stageFilter, setStageFilter] = useState('All');
  const [aumMin, setAumMin] = useState(0);
  const [aumMax, setAumMax] = useState(500);
  const [itrMin, setItrMin] = useState(1.3);
  const [itrMax, setItrMax] = useState(4.5);
  const [sortCol, setSortCol] = useState('aum');
  const [sortDir, setSortDir] = useState('desc');
  const [selectedClient, setSelectedClient] = useState(null);
  const [compareA, setCompareA] = useState(0);
  const [compareB, setCompareB] = useState(1);
  const [compareMode, setCompareMode] = useState(false);
  const [leadershipShift, setLeadershipShift] = useState(5);

  const tabs = ['Command Center','Client Portfolio Table','Engagement Pipeline','Regulatory Readiness','Transition Finance','Portfolio ITR Decomposition','Summary & Export'];

  const filteredClients = useMemo(() => {
    let out = [...CLIENTS];
    if (searchTerm) out = out.filter(c => c.clientName.toLowerCase().includes(searchTerm.toLowerCase()) || c.type.toLowerCase().includes(searchTerm.toLowerCase()));
    if (typeFilter !== 'All') out = out.filter(c => c.type === typeFilter);
    if (stageFilter !== 'All') out = out.filter(c => c.engagementStage === stageFilter);
    out = out.filter(c => c.aum >= aumMin && c.aum <= aumMax && c.portfolioITR >= itrMin && c.portfolioITR <= itrMax);
    out = out.sort((a, b) => {
      const v = sortDir === 'asc' ? 1 : -1;
      if (typeof a[sortCol] === 'number') return (a[sortCol] - b[sortCol]) * v;
      return (a[sortCol] > b[sortCol] ? 1 : -1) * v;
    });
    return out;
  }, [searchTerm, typeFilter, stageFilter, aumMin, aumMax, itrMin, itrMax, sortCol, sortDir]);

  const aggregateKPIs = useMemo(() => {
    const totalAUM = CLIENTS.reduce((s, c) => s + c.aum, 0);
    const wITR = totalAUM > 0 ? CLIENTS.reduce((s, c) => s + c.portfolioITR * c.aum, 0) / totalAUM : 0;
    const leaders = CLIENTS.filter(c => c.riskQuadrant === 'Leaders').length;
    const atRisk = CLIENTS.filter(c => c.riskQuadrant === 'At-Risk').length;
    const avgReadiness = CLIENTS.reduce((s, c) => s + c.regulatoryReadiness, 0) / CLIENTS.length;
    const totalGreenAlloc = totalAUM > 0 ? CLIENTS.reduce((s, c) => s + c.greenAllocation * c.aum, 0) / totalAUM : 0;
    return { totalAUM: totalAUM.toFixed(0), wITR: wITR.toFixed(2), leaders, atRisk, avgReadiness: avgReadiness.toFixed(1), totalGreenAlloc: totalGreenAlloc.toFixed(1) };
  }, []);

  const engagementPipeline = useMemo(() => {
    return ENGAGEMENT_STAGES.map(stage => {
      const clients = CLIENTS.filter(c => c.engagementStage === stage);
      const totalAUM = clients.reduce((s, c) => s + c.aum, 0);
      const avgITR = clients.length > 0 ? clients.reduce((s, c) => s + c.portfolioITR, 0) / clients.length : 0;
      const avgScore = clients.length > 0 ? clients.reduce((s, c) => s + c.engagementScore, 0) / clients.length : 0;
      return { stage, count: clients.length, totalAUM: parseFloat(totalAUM.toFixed(1)), avgITR: parseFloat(avgITR.toFixed(2)), avgScore: parseFloat(avgScore.toFixed(1)) };
    });
  }, []);

  const frameworkHeatmap = useMemo(() => {
    return REPORTING_FRAMEWORKS.map(fw => {
      const adopted = CLIENTS.filter(c => c.reportingFrameworks.includes(fw)).length;
      return { framework: fw, adopted, pct: parseFloat((adopted / CLIENTS.length * 100).toFixed(1)) };
    });
  }, []);

  const typeStats = useMemo(() => {
    return CLIENT_TYPES.map(type => {
      const clients = CLIENTS.filter(c => c.type === type);
      const totalAUM = clients.reduce((s, c) => s + c.aum, 0);
      const avgITR = clients.length > 0 ? clients.reduce((s, c) => s + c.portfolioITR, 0) / clients.length : 0;
      const avgBudget = clients.length > 0 ? clients.reduce((s, c) => s + c.transitionBudget, 0) / clients.length : 0;
      return { type, count: clients.length, totalAUM: parseFloat(totalAUM.toFixed(1)), avgITR: parseFloat(avgITR.toFixed(2)), avgBudget: parseFloat(avgBudget.toFixed(1)) };
    });
  }, []);

  const quadrantCounts = useMemo(() => {
    const counts = {};
    RISK_QUADRANTS.forEach(q => { counts[q] = 0; });
    CLIENTS.forEach(c => { counts[c.riskQuadrant]++; });
    return counts;
  }, []);

  const itrDecomposition = useMemo(() => {
    const totalAUM = CLIENTS.reduce((s, c) => s + c.aum, 0);
    const baseITR = totalAUM > 0 ? CLIENTS.reduce((s, c) => s + c.portfolioITR * c.aum, 0) / totalAUM : 0;
    // Shift top N clients to Leadership stage (lower ITR by 0.3)
    const shiftedClients = [...CLIENTS].sort((a, b) => b.aum - a.aum).slice(0, leadershipShift);
    const shiftedITR = totalAUM > 0
      ? CLIENTS.reduce((s, c) => {
          const isShifted = shiftedClients.some(sc => sc.id === c.id);
          const itr = isShifted ? Math.max(1.5, c.portfolioITR - 0.3) : c.portfolioITR;
          return s + itr * c.aum;
        }, 0) / totalAUM : 0;
    return {
      baseITR: parseFloat(baseITR.toFixed(3)),
      shiftedITR: parseFloat(shiftedITR.toFixed(3)),
      delta: parseFloat((baseITR - shiftedITR).toFixed(3)),
      byType: typeStats.map(t => ({
        type: t.type,
        wITR: t.avgITR,
        aum: t.totalAUM,
      })),
    };
  }, [leadershipShift, typeStats]);

  const handleSort = (col) => {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortCol(col); setSortDir('desc'); }
  };

  const itrColor = (itr) => itr <= 1.5 ? T.green : itr <= 2.0 ? T.teal : itr <= 2.5 ? T.blue : itr <= 3.0 ? T.amber : T.red;
  const quadrantColor = (q) => ({ Leaders: T.green, Transitioners: T.blue, Laggards: T.amber, 'At-Risk': T.red }[q] || T.muted);
  const stageColor = (s) => ({ Awareness: T.muted, Commitment: T.blue, Action: T.teal, Leadership: T.green }[s] || T.muted);

  const KpiCard = ({ label, value, sub, color }) => (
    <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: '14px 18px', flex: 1 }}>
      <div style={{ fontSize: 11, color: T.muted, textTransform: 'uppercase', letterSpacing: 1 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 700, color: color || T.text, marginTop: 4 }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: T.muted, marginTop: 2 }}>{sub}</div>}
    </div>
  );

  const scatterData = CLIENTS.map(c => ({
    x: c.portfolioITR, y: c.climateScore, z: c.aum,
    name: c.clientName, stage: c.engagementStage, quadrant: c.riskQuadrant,
  }));

  return (
    <div style={{ background: T.bg, minHeight: '100vh', padding: 24, fontFamily: 'DM Sans, sans-serif' }}>
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
            <div style={{ width: 4, height: 32, background: T.navy, borderRadius: 2 }} />
            <h1 style={{ fontSize: 24, fontWeight: 700, color: T.text, margin: 0 }}>Client Transition Command Center</h1>
            <span style={{ background: T.navy, color: '#fff', fontSize: 11, padding: '2px 8px', borderRadius: 4 }}>EP-CY6</span>
          </div>
          <p style={{ color: T.muted, margin: 0, marginLeft: 16, fontSize: 13 }}>60 client portfolios · 8 client types · Risk quadrant classification · Engagement pipeline · Regulatory readiness</p>
        </div>

        <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
          <KpiCard label="Total Client AUM" value={`$${(Number(aggregateKPIs.totalAUM)/1000).toFixed(1)}T`} sub="across 60 clients" color={T.navy} />
          <KpiCard label="Weighted ITR" value={`${aggregateKPIs.wITR}°C`} sub="AUM-weighted" color={itrColor(parseFloat(aggregateKPIs.wITR))} />
          <KpiCard label="Leaders" value={aggregateKPIs.leaders} sub="low ITR + high score" color={T.green} />
          <KpiCard label="At-Risk" value={aggregateKPIs.atRisk} sub="high ITR + low score" color={T.red} />
          <KpiCard label="Avg Reg. Readiness" value={`${aggregateKPIs.avgReadiness}%`} sub="framework adoption" color={T.teal} />
          <KpiCard label="Wtd Green Alloc" value={`${aggregateKPIs.totalGreenAlloc}%`} sub="AUM-weighted" color={T.green} />
        </div>

        <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: `1px solid ${T.border}` }}>
          {tabs.map((t, i) => (
            <button key={i} onClick={() => setActiveTab(i)} style={{
              padding: '8px 13px', border: 'none', background: activeTab === i ? T.navy : 'transparent',
              color: activeTab === i ? '#fff' : T.muted, borderRadius: '6px 6px 0 0', cursor: 'pointer',
              fontWeight: activeTab === i ? 600 : 400, fontSize: 12,
            }}>{t}</button>
          ))}
        </div>

        {/* Filter Controls */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
          <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Search clients…"
            style={{ padding: '6px 12px', border: `1px solid ${T.border}`, borderRadius: 6, fontSize: 13, width: 180 }} />
          <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
            style={{ padding: '6px 10px', border: `1px solid ${T.border}`, borderRadius: 6, fontSize: 12 }}>
            <option value="All">All Types</option>
            {CLIENT_TYPES.map(t => <option key={t}>{t}</option>)}
          </select>
          <select value={stageFilter} onChange={e => setStageFilter(e.target.value)}
            style={{ padding: '6px 10px', border: `1px solid ${T.border}`, borderRadius: 6, fontSize: 12 }}>
            <option value="All">All Stages</option>
            {ENGAGEMENT_STAGES.map(s => <option key={s}>{s}</option>)}
          </select>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 11, color: T.muted }}>AUM $Bn:</span>
            <input type="number" value={aumMin} onChange={e => setAumMin(Number(e.target.value))} min="0" step="10"
              style={{ width: 60, padding: '4px 6px', border: `1px solid ${T.border}`, borderRadius: 4, fontSize: 11 }} />
            <span>–</span>
            <input type="number" value={aumMax} onChange={e => setAumMax(Number(e.target.value))} max="500" step="10"
              style={{ width: 60, padding: '4px 6px', border: `1px solid ${T.border}`, borderRadius: 4, fontSize: 11 }} />
          </div>
          <button onClick={() => setCompareMode(m => !m)} style={{ padding: '5px 12px', background: compareMode ? T.navy : T.card, border: `1px solid ${T.border}`, borderRadius: 5, fontSize: 12, cursor: 'pointer', color: compareMode ? '#fff' : T.text }}>
            {compareMode ? '✓ Compare ON' : 'Compare Mode'}
          </button>
        </div>

        {/* TAB 0 — Command Center */}
        {activeTab === 0 && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, marginBottom: 16 }}>
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
                <h3 style={{ margin: '0 0 12px', fontSize: 14 }}>Client Risk Quadrant Scatter (ITR vs Climate Score, bubble=AUM, color=stage)</h3>
                <div style={{ marginBottom: 8, display: 'flex', gap: 8 }}>
                  {ENGAGEMENT_STAGES.map(s => (
                    <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: stageColor(s) }} />
                      <span style={{ fontSize: 11, color: T.muted }}>{s}</span>
                    </div>
                  ))}
                </div>
                <ResponsiveContainer width="100%" height={300}>
                  <ScatterChart margin={{ top: 10, right: 20, bottom: 20, left: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="x" name="Portfolio ITR" type="number" domain={[1, 5]} tick={{ fontSize: 10 }} label={{ value: 'Portfolio ITR (°C)', position: 'insideBottom', offset: -10, fontSize: 11 }} />
                    <YAxis dataKey="y" name="Climate Score" tick={{ fontSize: 10 }} label={{ value: 'Climate Score', angle: -90, position: 'insideLeft', fontSize: 11 }} />
                    <ZAxis dataKey="z" range={[20, 400]} name="AUM $Bn" />
                    <Tooltip cursor={{ strokeDasharray: '3 3' }} content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const d = payload[0]?.payload;
                      return d ? (
                        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 6, padding: '8px 12px', fontSize: 11 }}>
                          <div style={{ fontWeight: 600 }}>{d.name}</div>
                          <div>ITR: {d.x}°C · Score: {d.y} · AUM: ${d.z}Bn</div>
                          <div style={{ color: stageColor(d.stage) }}>{d.stage} · {d.quadrant}</div>
                        </div>
                      ) : null;
                    }} />
                    <ReferenceLine x={2.0} stroke={T.green} strokeDasharray="4 2" label={{ value: '2°C', fontSize: 9 }} />
                    <ReferenceLine y={50} stroke={T.blue} strokeDasharray="4 2" label={{ value: 'Score 50', fontSize: 9 }} />
                    <Scatter data={scatterData} fill={T.navy} opacity={0.7} />
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {RISK_QUADRANTS.map(q => {
                  const clients = CLIENTS.filter(c => c.riskQuadrant === q);
                  const totalAUM = clients.reduce((s, c) => s + c.aum, 0);
                  return (
                    <div key={q} style={{ background: T.card, border: `1px solid ${quadrantColor(q)}40`, borderLeft: `4px solid ${quadrantColor(q)}`, borderRadius: 8, padding: '12px 14px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: quadrantColor(q) }}>{q}</div>
                          <div style={{ fontSize: 11, color: T.muted }}>{clients.length} clients · ${totalAUM.toFixed(0)}Bn AUM</div>
                        </div>
                        <div style={{ fontSize: 28, fontWeight: 800, color: quadrantColor(q) }}>{clients.length}</div>
                      </div>
                    </div>
                  );
                })}
                <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: '12px 14px' }}>
                  <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 8 }}>SBTi Status Distribution</div>
                  {SBTI_STATUSES.map(s => {
                    const count = CLIENTS.filter(c => c.sbtiStatus === s).length;
                    return (
                      <div key={s} style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', borderBottom: `1px solid ${T.border}`, fontSize: 12 }}>
                        <span>{s}</span>
                        <span style={{ fontWeight: 600 }}>{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 1 — Client Portfolio Table */}
        {activeTab === 1 && (
          <div>
            <div style={{ marginBottom: 8, display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 13, color: T.muted }}>{filteredClients.length} clients</span>
            </div>
            {compareMode && (
              <div style={{ background: T.card, border: `1px solid ${T.navy}`, borderRadius: 8, padding: 14, marginBottom: 12 }}>
                <div style={{ display: 'flex', gap: 12, marginBottom: 10 }}>
                  <select value={compareA} onChange={e => setCompareA(Number(e.target.value))}
                    style={{ flex: 1, padding: '6px 8px', border: `1px solid ${T.border}`, borderRadius: 5, fontSize: 12 }}>
                    {CLIENTS.map((c, i) => <option key={i} value={i}>{c.clientName}</option>)}
                  </select>
                  <span style={{ alignSelf: 'center', fontWeight: 700 }}>vs</span>
                  <select value={compareB} onChange={e => setCompareB(Number(e.target.value))}
                    style={{ flex: 1, padding: '6px 8px', border: `1px solid ${T.border}`, borderRadius: 5, fontSize: 12 }}>
                    {CLIENTS.map((c, i) => <option key={i} value={i}>{c.clientName}</option>)}
                  </select>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: 8 }}>
                  {[['AUM','aum','$Bn'],['ITR','portfolioITR','°C'],['Climate Score','climateScore',''],['Green Alloc','greenAllocation','%'],['Reg Readiness','regulatoryReadiness','%'],['Trans Budget','transitionBudget','$Bn'],['Net Zero','netZeroTarget',''],['SBTi','sbtiStatus',''],['Quadrant','riskQuadrant',''],['Stage','engagementStage',''],['Instruments','customInstruments',''],['Eng. Score','engagementScore','']].map(([label, field, unit]) => {
                    const vA = CLIENTS[compareA]?.[field];
                    const vB = CLIENTS[compareB]?.[field];
                    return (
                      <div key={field} style={{ background: T.sub, borderRadius: 5, padding: '7px 8px' }}>
                        <div style={{ fontSize: 9, color: T.muted, marginBottom: 2 }}>{label}</div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: T.navy }}>{typeof vA === 'number' ? `${vA}${unit}` : vA}</div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: T.teal }}>{typeof vB === 'number' ? `${vB}${unit}` : vB}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, overflow: 'hidden' }}>
              <div style={{ overflowX: 'auto', maxHeight: 520, overflowY: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead>
                    <tr style={{ background: T.sub }}>
                      {['clientName','type','aum','portfolioITR','climateScore','engagementStage','greenAllocation','regulatoryReadiness','riskQuadrant','sbtiStatus','netZeroTarget'].map(col => (
                        <th key={col} onClick={() => handleSort(col)} style={{ padding: '7px 10px', textAlign: 'left', cursor: 'pointer', whiteSpace: 'nowrap', fontSize: 11, fontWeight: 600, color: sortCol === col ? T.navy : T.text }}>
                          {col.replace(/([A-Z])/g, ' $1')} {sortCol === col ? (sortDir === 'asc' ? '↑' : '↓') : ''}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredClients.map((c, idx) => (
                      <tr key={c.id} onClick={() => setSelectedClient(selectedClient?.id === c.id ? null : c)}
                        style={{ background: selectedClient?.id === c.id ? '#eef2ff' : idx % 2 === 0 ? '#fff' : T.sub, cursor: 'pointer', borderBottom: `1px solid ${T.border}` }}>
                        <td style={{ padding: '7px 10px', fontWeight: 600, whiteSpace: 'nowrap' }}>{c.clientName}</td>
                        <td style={{ padding: '7px 10px', fontSize: 11 }}><span style={{ background: T.sub, padding: '1px 5px', borderRadius: 3 }}>{c.type}</span></td>
                        <td style={{ padding: '7px 10px', fontWeight: 600 }}>${c.aum}Bn</td>
                        <td style={{ padding: '7px 10px', fontWeight: 700, color: itrColor(c.portfolioITR) }}>{c.portfolioITR}°C</td>
                        <td style={{ padding: '7px 10px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <div style={{ width: 50, background: T.border, borderRadius: 3, overflow: 'hidden', height: 5 }}>
                              <div style={{ height: '100%', background: T.teal, width: `${c.climateScore}%` }} />
                            </div>
                            <span style={{ fontSize: 11 }}>{c.climateScore}</span>
                          </div>
                        </td>
                        <td style={{ padding: '7px 10px' }}><span style={{ color: stageColor(c.engagementStage), fontWeight: 600, fontSize: 11 }}>{c.engagementStage}</span></td>
                        <td style={{ padding: '7px 10px', color: T.green }}>{c.greenAllocation}%</td>
                        <td style={{ padding: '7px 10px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <div style={{ width: 50, background: T.border, borderRadius: 3, overflow: 'hidden', height: 5 }}>
                              <div style={{ height: '100%', background: T.indigo, width: `${c.regulatoryReadiness}%` }} />
                            </div>
                            <span style={{ fontSize: 11 }}>{c.regulatoryReadiness.toFixed(0)}%</span>
                          </div>
                        </td>
                        <td style={{ padding: '7px 10px' }}><span style={{ color: quadrantColor(c.riskQuadrant), fontWeight: 600, fontSize: 11 }}>{c.riskQuadrant}</span></td>
                        <td style={{ padding: '7px 10px', fontSize: 11, color: c.sbtiStatus === 'Approved' ? T.green : c.sbtiStatus === 'Committed' ? T.blue : T.muted }}>{c.sbtiStatus}</td>
                        <td style={{ padding: '7px 10px' }}>{c.netZeroTarget}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            {selectedClient && (
              <div style={{ background: T.card, border: `1px solid ${T.navy}`, borderRadius: 8, padding: 16, marginTop: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                  <h3 style={{ margin: 0, color: T.navy }}>{selectedClient.clientName} — Full Profile</h3>
                  <button onClick={() => setSelectedClient(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: T.muted }}>×</button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 8 }}>
                  {[['Type', selectedClient.type],['AUM', `$${selectedClient.aum}Bn`],['Portfolio ITR', `${selectedClient.portfolioITR}°C`],['Climate Score', selectedClient.climateScore],['Engagement Stage', selectedClient.engagementStage],['Green Allocation', `${selectedClient.greenAllocation}%`],['Regulatory Readiness', `${selectedClient.regulatoryReadiness.toFixed(0)}%`],['Net Zero Target', selectedClient.netZeroTarget],['SBTi Status', selectedClient.sbtiStatus],['Risk Quadrant', selectedClient.riskQuadrant],['Transition Budget', `$${selectedClient.transitionBudget}Bn`],['Required Capex', `$${selectedClient.requiredCapex}Bn`],['Custom Instruments', selectedClient.customInstruments],['Engagement Score', selectedClient.engagementScore],['Reporting Frameworks', selectedClient.reportingFrameworks.join(', ')],].map(([k,v]) => (
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

        {/* TAB 2 — Engagement Pipeline */}
        {activeTab === 2 && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 16 }}>
              {engagementPipeline.map(stage => (
                <div key={stage.stage} style={{ background: T.card, border: `1px solid ${stageColor(stage.stage)}40`, borderTop: `4px solid ${stageColor(stage.stage)}`, borderRadius: 8, padding: 16 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: stageColor(stage.stage), marginBottom: 8 }}>{stage.stage}</div>
                  <div style={{ fontSize: 28, fontWeight: 800, color: T.text }}>{stage.count}</div>
                  <div style={{ fontSize: 11, color: T.muted }}>clients</div>
                  <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <div style={{ fontSize: 11, color: T.muted }}>AUM: <span style={{ fontWeight: 600, color: T.text }}>${stage.totalAUM}Bn</span></div>
                    <div style={{ fontSize: 11, color: T.muted }}>Avg ITR: <span style={{ fontWeight: 600, color: itrColor(stage.avgITR) }}>{stage.avgITR}°C</span></div>
                    <div style={{ fontSize: 11, color: T.muted }}>Eng Score: <span style={{ fontWeight: 600 }}>{stage.avgScore}</span></div>
                  </div>
                  <div style={{ marginTop: 10 }}>
                    {CLIENTS.filter(c => c.engagementStage === stage.stage).slice(0, 4).map(c => (
                      <div key={c.id} style={{ fontSize: 10, padding: '2px 0', borderBottom: `1px solid ${T.border}`, color: T.muted }}>{c.clientName}</div>
                    ))}
                    {CLIENTS.filter(c => c.engagementStage === stage.stage).length > 4 && (
                      <div style={{ fontSize: 10, color: T.muted, marginTop: 2 }}>+{CLIENTS.filter(c => c.engagementStage === stage.stage).length - 4} more…</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
              <h3 style={{ margin: '0 0 12px', fontSize: 14 }}>Engagement Stage — AUM & Avg ITR</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={engagementPipeline}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="stage" tick={{ fontSize: 11 }} />
                  <YAxis yAxisId="left" tick={{ fontSize: 10 }} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10 }} unit="°C" />
                  <Tooltip />
                  <Legend />
                  <Bar yAxisId="left" dataKey="totalAUM" fill={T.navy} radius={[2,2,0,0]} name="Total AUM $Bn" />
                  <Bar yAxisId="right" dataKey="avgITR" fill={T.orange} radius={[2,2,0,0]} name="Avg ITR °C" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* TAB 3 — Regulatory Readiness */}
        {activeTab === 3 && (
          <div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16, marginBottom: 16 }}>
              <h3 style={{ margin: '0 0 12px', fontSize: 14 }}>Framework Adoption Rate Across 60 Clients</h3>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={frameworkHeatmap}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="framework" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 10 }} unit="%" />
                  <ReferenceLine y={70} stroke={T.amber} strokeDasharray="4 2" label={{ value: '70% Target', fontSize: 10 }} />
                  <Tooltip />
                  <Bar dataKey="pct" fill={T.navy} radius={[3,3,0,0]} name="Adoption %" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, overflow: 'hidden' }}>
                <div style={{ padding: '8px 14px', background: T.sub, borderBottom: `1px solid ${T.border}` }}>
                  <span style={{ fontWeight: 600, fontSize: 13 }}>Framework Adoption Detail</span>
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead>
                    <tr style={{ background: T.sub }}>
                      {['Framework','Adopted','%','Status'].map(h => (
                        <th key={h} style={{ padding: '7px 12px', textAlign: 'left', fontWeight: 600, fontSize: 11 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {frameworkHeatmap.map((f, i) => (
                      <tr key={f.framework} style={{ background: i % 2 === 0 ? '#fff' : T.sub, borderBottom: `1px solid ${T.border}` }}>
                        <td style={{ padding: '7px 12px', fontWeight: 600 }}>{f.framework}</td>
                        <td style={{ padding: '7px 12px' }}>{f.adopted}/60</td>
                        <td style={{ padding: '7px 12px', fontWeight: 700, color: f.pct > 70 ? T.green : f.pct > 40 ? T.amber : T.red }}>{f.pct}%</td>
                        <td style={{ padding: '7px 12px' }}>
                          <span style={{ background: f.pct > 70 ? '#dcfce7' : f.pct > 40 ? '#fef3c7' : '#fee2e2', color: f.pct > 70 ? T.green : f.pct > 40 ? T.amber : T.red, padding: '1px 6px', borderRadius: 4, fontSize: 11 }}>
                            {f.pct > 70 ? 'Strong' : f.pct > 40 ? 'Moderate' : 'Weak'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
                <h3 style={{ margin: '0 0 12px', fontSize: 14 }}>Readiness Gaps — Critical Clients</h3>
                <div style={{ overflowY: 'auto', maxHeight: 280 }}>
                  {[...CLIENTS].sort((a, b) => a.regulatoryReadiness - b.regulatoryReadiness).slice(0, 12).map(c => (
                    <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', borderBottom: `1px solid ${T.border}` }}>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 600 }}>{c.clientName}</div>
                        <div style={{ fontSize: 11, color: T.muted }}>{c.type} · {c.frameworksRequired} frameworks required</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: c.regulatoryReadiness < 40 ? T.red : T.amber }}>{c.regulatoryReadiness.toFixed(0)}%</div>
                        <div style={{ fontSize: 10, color: T.muted }}>readiness</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4 — Transition Finance */}
        {activeTab === 4 && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
                <h3 style={{ margin: '0 0 12px', fontSize: 14 }}>Transition Budget by Client Type ($Bn)</h3>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={typeStats}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="type" tick={{ fontSize: 9 }} angle={-25} textAnchor="end" height={50} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Bar dataKey="avgBudget" fill={T.navy} radius={[2,2,0,0]} name="Avg Trans Budget $Bn" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
                <h3 style={{ margin: '0 0 12px', fontSize: 14 }}>Budget vs Required Capex (Top 20 by AUM)</h3>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={[...CLIENTS].sort((a,b)=>b.aum-a.aum).slice(0,20).map(c=>({ name: c.clientName.split(' ').slice(0,2).join(' '), budget: c.transitionBudget, required: c.requiredCapex }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="name" tick={{ fontSize: 9 }} angle={-30} textAnchor="end" height={55} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="budget" fill={T.teal} radius={[2,2,0,0]} name="Transition Budget" />
                    <Bar dataKey="required" fill={T.orange} radius={[2,2,0,0]} name="Required Capex" opacity={0.7} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: T.sub }}>
                    {['Client','Type','AUM','Trans Budget','Required Capex','Sufficiency','Green Alloc','Instruments'].map(h => (
                      <th key={h} style={{ padding: '7px 12px', textAlign: 'left', fontWeight: 600, fontSize: 11 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[...CLIENTS].sort((a,b)=>b.aum-a.aum).slice(0,20).map((c, i) => {
                    const sufficiency = c.requiredCapex > 0 ? c.transitionBudget / c.requiredCapex * 100 : 100;
                    return (
                      <tr key={c.id} style={{ background: i % 2 === 0 ? '#fff' : T.sub, borderBottom: `1px solid ${T.border}` }}>
                        <td style={{ padding: '7px 12px', fontWeight: 600 }}>{c.clientName}</td>
                        <td style={{ padding: '7px 12px', fontSize: 11 }}>{c.type}</td>
                        <td style={{ padding: '7px 12px' }}>${c.aum}Bn</td>
                        <td style={{ padding: '7px 12px', color: T.teal, fontWeight: 600 }}>${c.transitionBudget}Bn</td>
                        <td style={{ padding: '7px 12px', color: T.orange }}>${c.requiredCapex}Bn</td>
                        <td style={{ padding: '7px 12px', color: sufficiency >= 100 ? T.green : T.red, fontWeight: 700 }}>{sufficiency.toFixed(0)}%</td>
                        <td style={{ padding: '7px 12px', color: T.green }}>{c.greenAllocation}%</td>
                        <td style={{ padding: '7px 12px' }}>{c.customInstruments}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 5 — Portfolio ITR Decomposition */}
        {activeTab === 5 && (
          <div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16, marginBottom: 16 }}>
              <h3 style={{ margin: '0 0 12px', fontSize: 14 }}>What-If: Shift Top N Clients to Leadership Stage</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
                <label style={{ fontSize: 13, fontWeight: 600 }}>Clients shifted to Leadership (by AUM):</label>
                <input type="range" min="1" max="20" step="1" value={leadershipShift} onChange={e => setLeadershipShift(Number(e.target.value))}
                  style={{ width: 200 }} />
                <span style={{ fontSize: 15, fontWeight: 700, color: T.navy }}>{leadershipShift}</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 16 }}>
                <div style={{ background: T.sub, borderRadius: 8, padding: '12px 16px', borderLeft: `4px solid ${T.muted}` }}>
                  <div style={{ fontSize: 11, color: T.muted }}>CURRENT Portfolio ITR</div>
                  <div style={{ fontSize: 28, fontWeight: 800, color: itrColor(itrDecomposition.baseITR) }}>{itrDecomposition.baseITR}°C</div>
                </div>
                <div style={{ background: T.sub, borderRadius: 8, padding: '12px 16px', borderLeft: `4px solid ${T.green}` }}>
                  <div style={{ fontSize: 11, color: T.muted }}>PROJECTED Portfolio ITR</div>
                  <div style={{ fontSize: 28, fontWeight: 800, color: T.green }}>{itrDecomposition.shiftedITR}°C</div>
                </div>
                <div style={{ background: T.sub, borderRadius: 8, padding: '12px 16px', borderLeft: `4px solid ${T.teal}` }}>
                  <div style={{ fontSize: 11, color: T.muted }}>ITR REDUCTION</div>
                  <div style={{ fontSize: 28, fontWeight: 800, color: T.teal }}>-{itrDecomposition.delta}°C</div>
                </div>
              </div>
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
              <h3 style={{ margin: '0 0 12px', fontSize: 14 }}>AUM-Weighted ITR by Client Type</h3>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={itrDecomposition.byType}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="type" tick={{ fontSize: 10 }} angle={-20} textAnchor="end" height={45} />
                  <YAxis domain={[0, 5]} tick={{ fontSize: 10 }} unit="°C" />
                  <ReferenceLine y={1.5} stroke={T.green} strokeDasharray="4 2" label={{ value: '1.5°C Paris', fontSize: 10 }} />
                  <ReferenceLine y={2.0} stroke={T.blue} strokeDasharray="4 2" label={{ value: '2°C', fontSize: 10 }} />
                  <Tooltip />
                  <Bar dataKey="wITR" fill={T.navy} radius={[2,2,0,0]} name="Avg ITR °C" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* TAB 6 — Summary & Export */}
        {activeTab === 6 && (
          <div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16, marginBottom: 16 }}>
              <h3 style={{ margin: '0 0 16px', fontSize: 15 }}>Client Transition Command Center — Full Scorecard</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
                {[
                  ['Total Clients', 60],['Client Types', 8],['Total AUM', `$${(Number(aggregateKPIs.totalAUM)/1000).toFixed(1)}T`],
                  ['Weighted Portfolio ITR', `${aggregateKPIs.wITR}°C`],
                  ['Leaders', aggregateKPIs.leaders],['Transitioners', quadrantCounts['Transitioners']],
                  ['Laggards', quadrantCounts['Laggards']],['At-Risk', aggregateKPIs.atRisk],
                  ['SBTi Approved', CLIENTS.filter(c=>c.sbtiStatus==='Approved').length],
                  ['SBTi Committed', CLIENTS.filter(c=>c.sbtiStatus==='Committed').length],
                  ['Avg Reg. Readiness', `${aggregateKPIs.avgReadiness}%`],
                  ['Avg Green Allocation', `${aggregateKPIs.totalGreenAlloc}%`],
                ].map(([k,v]) => (
                  <div key={k} style={{ background: T.sub, borderRadius: 6, padding: '10px 14px' }}>
                    <div style={{ fontSize: 11, color: T.muted, textTransform: 'uppercase' }}>{k}</div>
                    <div style={{ fontSize: 16, fontWeight: 700, marginTop: 3 }}>{v}</div>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, overflow: 'hidden' }}>
              <div style={{ padding: '8px 14px', background: T.sub, borderBottom: `1px solid ${T.border}` }}>
                <span style={{ fontWeight: 600, fontSize: 13 }}>Full Client Scorecard Export (60 clients)</span>
              </div>
              <div style={{ overflowX: 'auto', maxHeight: 400, overflowY: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                  <thead>
                    <tr style={{ background: T.sub }}>
                      {['Client','Type','AUM','ITR','Climate Score','Stage','Quadrant','Green Alloc','Reg Ready','Net Zero','SBTi','Trans Budget','Required Capex','Frameworks'].map(h => (
                        <th key={h} style={{ padding: '6px 8px', textAlign: 'left', fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {CLIENTS.map((c, idx) => (
                      <tr key={c.id} style={{ background: idx % 2 === 0 ? '#fff' : T.sub, borderBottom: `1px solid ${T.border}` }}>
                        <td style={{ padding: '5px 8px', fontWeight: 600, whiteSpace: 'nowrap' }}>{c.clientName}</td>
                        <td style={{ padding: '5px 8px', fontSize: 10 }}>{c.type}</td>
                        <td style={{ padding: '5px 8px' }}>${c.aum}Bn</td>
                        <td style={{ padding: '5px 8px', color: itrColor(c.portfolioITR), fontWeight: 700 }}>{c.portfolioITR}°C</td>
                        <td style={{ padding: '5px 8px' }}>{c.climateScore}</td>
                        <td style={{ padding: '5px 8px', color: stageColor(c.engagementStage) }}>{c.engagementStage}</td>
                        <td style={{ padding: '5px 8px', color: quadrantColor(c.riskQuadrant), fontWeight: 600 }}>{c.riskQuadrant}</td>
                        <td style={{ padding: '5px 8px', color: T.green }}>{c.greenAllocation}%</td>
                        <td style={{ padding: '5px 8px' }}>{c.regulatoryReadiness.toFixed(0)}%</td>
                        <td style={{ padding: '5px 8px' }}>{c.netZeroTarget}</td>
                        <td style={{ padding: '5px 8px', fontSize: 10 }}>{c.sbtiStatus}</td>
                        <td style={{ padding: '5px 8px' }}>${c.transitionBudget}Bn</td>
                        <td style={{ padding: '5px 8px' }}>${c.requiredCapex}Bn</td>
                        <td style={{ padding: '5px 8px', fontSize: 10 }}>{c.reportingFrameworks.join(', ')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Bottom always-on analytics panels */}
        <div style={{ marginTop: 20 }}>
          {/* Client type × risk quadrant cross-tab */}
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16, marginBottom: 16 }}>
            <h3 style={{ margin: '0 0 12px', fontSize: 14 }}>Client Type × Risk Quadrant Distribution</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ background: T.sub }}>
                  <th style={{ padding:'6px 10px', textAlign:'left', fontWeight:600 }}>Client Type</th>
                  {RISK_QUADRANTS.map(q=><th key={q} style={{ padding:'6px 10px', textAlign:'center', fontWeight:600, color:quadrantColor(q) }}>{q}</th>)}
                  <th style={{ padding:'6px 10px', textAlign:'center', fontWeight:600 }}>Total AUM</th>
                  <th style={{ padding:'6px 10px', textAlign:'center', fontWeight:600 }}>Avg ITR</th>
                </tr>
              </thead>
              <tbody>
                {CLIENT_TYPES.map((type,i)=>{
                  const typeClients = CLIENTS.filter(c=>c.type===type);
                  const totalAUM = typeClients.reduce((s,c)=>s+c.aum,0);
                  const avgITR = typeClients.length>0 ? typeClients.reduce((s,c)=>s+c.portfolioITR,0)/typeClients.length : 0;
                  return (
                    <tr key={type} style={{ background:i%2===0?'#fff':T.sub, borderBottom:`1px solid ${T.border}` }}>
                      <td style={{ padding:'5px 10px', fontWeight:600 }}>{type}</td>
                      {RISK_QUADRANTS.map(q=>{
                        const count = typeClients.filter(c=>c.riskQuadrant===q).length;
                        return <td key={q} style={{ padding:'5px 10px', textAlign:'center', color:count>0?quadrantColor(q):T.muted, fontWeight:count>0?700:400 }}>{count||'—'}</td>;
                      })}
                      <td style={{ padding:'5px 10px', textAlign:'center', fontWeight:600 }}>${totalAUM.toFixed(0)}Bn</td>
                      <td style={{ padding:'5px 10px', textAlign:'center', color:itrColor(avgITR), fontWeight:700 }}>{avgITR.toFixed(2)}°C</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {/* Engagement effectiveness matrix */}
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16, marginBottom: 16 }}>
            <h3 style={{ margin: '0 0 12px', fontSize: 14 }}>Engagement Effectiveness by Client Type × Stage</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10 }}>
              {ENGAGEMENT_STAGES.map(stage=>{
                const stageClients = CLIENTS.filter(c=>c.engagementStage===stage);
                const byType = CLIENT_TYPES.map(type=>{
                  const typeStageClients = stageClients.filter(c=>c.type===type);
                  return { type, count: typeStageClients.length, avgScore: typeStageClients.length>0 ? typeStageClients.reduce((s,c)=>s+c.engagementScore,0)/typeStageClients.length : 0 };
                }).filter(t=>t.count>0);
                return (
                  <div key={stage} style={{ background:T.sub, borderRadius:6, padding:'10px 12px', borderTop:`3px solid ${stageColor(stage)}` }}>
                    <div style={{ fontSize:12, fontWeight:700, color:stageColor(stage), marginBottom:8 }}>{stage}</div>
                    {byType.map(t=>(
                      <div key={t.type} style={{ display:'flex', justifyContent:'space-between', padding:'2px 0', fontSize:11 }}>
                        <span style={{ color:T.muted, fontSize:10 }}>{t.type.split(' ').slice(0,2).join(' ')}</span>
                        <span style={{ fontWeight:600 }}>{t.count} ({t.avgScore.toFixed(0)})</span>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
          {/* Net zero target distribution */}
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16, marginBottom: 16 }}>
            <h3 style={{ margin: '0 0 12px', fontSize: 14 }}>Net Zero Target Distribution (2030–2050)</h3>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {Array.from({length:5},(_,i)=>2030+i*5).map(year=>{
                const clients = CLIENTS.filter(c=>c.netZeroTarget>=year&&c.netZeroTarget<year+5);
                const totalAUM = clients.reduce((s,c)=>s+c.aum,0);
                return (
                  <div key={year} style={{ background:T.sub, borderRadius:6, padding:'10px 14px', minWidth:120 }}>
                    <div style={{ fontSize:13, fontWeight:700, color:T.navy }}>{year}–{year+4}</div>
                    <div style={{ fontSize:24, fontWeight:800, color:year<=2035?T.green:year<=2040?T.teal:T.amber }}>{clients.length}</div>
                    <div style={{ fontSize:11, color:T.muted }}>clients</div>
                    <div style={{ fontSize:11, marginTop:2 }}>${totalAUM.toFixed(0)}Bn AUM</div>
                  </div>
                );
              })}
            </div>
          </div>
          {/* AUM-weighted regulatory readiness by type */}
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
            <h3 style={{ margin: '0 0 12px', fontSize: 14 }}>AUM-Weighted Regulatory Readiness by Client Type</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10 }}>
              {CLIENT_TYPES.map(type=>{
                const typeClients = CLIENTS.filter(c=>c.type===type);
                const totalAUM = typeClients.reduce((s,c)=>s+c.aum,0);
                const wReadiness = totalAUM>0 ? typeClients.reduce((s,c)=>s+c.regulatoryReadiness*c.aum,0)/totalAUM : 0;
                const avgGap = typeClients.length>0 ? typeClients.reduce((s,c)=>s+Math.max(0,c.frameworksRequired-c.reportingFrameworks.length),0)/typeClients.length : 0;
                return (
                  <div key={type} style={{ background:T.sub, borderRadius:6, padding:'10px 12px' }}>
                    <div style={{ fontSize:11, fontWeight:600, marginBottom:4 }}>{type}</div>
                    <div style={{ fontSize:22, fontWeight:800, color:wReadiness>70?T.green:wReadiness>40?T.amber:T.red }}>{wReadiness.toFixed(0)}%</div>
                    <div style={{ fontSize:10, color:T.muted }}>AUM-wtd readiness</div>
                    <div style={{ fontSize:11, color:T.orange, marginTop:4 }}>Avg framework gap: {avgGap.toFixed(1)}</div>
                    <div style={{ fontSize:11, color:T.muted }}>{typeClients.length} clients · ${totalAUM.toFixed(0)}Bn</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        {/* Footer analytics — always visible */}
        <div style={{ marginTop:16, display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
          <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:8, padding:12 }}>
            <h4 style={{ margin:'0 0 10px', fontSize:13 }}>Top 10 Clients by AUM</h4>
            {[...CLIENTS].sort((a,b)=>b.aum-a.aum).slice(0,10).map((c,i)=>(
              <div key={c.id} style={{ display:'flex', justifyContent:'space-between', padding:'4px 0', borderBottom:`1px solid ${T.border}`, fontSize:12 }}>
                <div>
                  <span style={{ fontWeight:600 }}>{c.clientName}</span>
                  <span style={{ fontSize:10, color:T.muted, marginLeft:6 }}>{c.type}</span>
                </div>
                <div style={{ textAlign:'right' }}>
                  <span style={{ fontWeight:700, color:T.navy, marginRight:8 }}>${c.aum}Bn</span>
                  <span style={{ color:itrColor(c.portfolioITR), fontSize:11 }}>{c.portfolioITR}°C</span>
                </div>
              </div>
            ))}
          </div>
          <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:8, padding:12 }}>
            <h4 style={{ margin:'0 0 10px', fontSize:13 }}>At-Risk Clients — Priority Intervention Queue</h4>
            {CLIENTS.filter(c=>c.riskQuadrant==='At-Risk').map((c,i)=>(
              <div key={c.id} style={{ padding:'4px 0', borderBottom:`1px solid ${T.border}`, fontSize:11 }}>
                <div style={{ fontWeight:600, color:T.red }}>{c.clientName}</div>
                <div style={{ color:T.muted }}>{c.type} · ITR: {c.portfolioITR}°C · Score: {c.climateScore} · {c.engagementStage}</div>
              </div>
            ))}
          </div>
        </div>
        {/* Budget sufficiency analysis */}
        <div style={{ marginTop:14, background:T.card, border:`1px solid ${T.border}`, borderRadius:8, padding:14 }}>
          <h4 style={{ margin:'0 0 10px', fontSize:13 }}>Transition Budget Sufficiency — All Client Types</h4>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
            <thead>
              <tr style={{ background:T.sub }}>
                {['Type','Clients','Total AUM','Total Budget','Total Required','Sufficiency Ratio','Budget Gap','Avg Green%'].map(h=>(
                  <th key={h} style={{ padding:'6px 10px', textAlign:'left', fontWeight:600, fontSize:11 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {CLIENT_TYPES.map((type,i)=>{
                const typeClients = CLIENTS.filter(c=>c.type===type);
                const totalAUM = typeClients.reduce((s,c)=>s+c.aum,0);
                const totalBudget = typeClients.reduce((s,c)=>s+c.transitionBudget,0);
                const totalRequired = typeClients.reduce((s,c)=>s+c.requiredCapex,0);
                const ratio = totalRequired>0 ? totalBudget/totalRequired : 1;
                const gap = totalRequired - totalBudget;
                const avgGreen = typeClients.length>0 ? typeClients.reduce((s,c)=>s+c.greenAllocation,0)/typeClients.length : 0;
                return (
                  <tr key={type} style={{ background:i%2===0?'#fff':T.sub, borderBottom:`1px solid ${T.border}` }}>
                    <td style={{ padding:'5px 10px', fontWeight:600 }}>{type}</td>
                    <td style={{ padding:'5px 10px' }}>{typeClients.length}</td>
                    <td style={{ padding:'5px 10px' }}>${totalAUM.toFixed(0)}Bn</td>
                    <td style={{ padding:'5px 10px', color:T.teal, fontWeight:600 }}>${totalBudget.toFixed(1)}Bn</td>
                    <td style={{ padding:'5px 10px', color:T.orange }}>${totalRequired.toFixed(1)}Bn</td>
                    <td style={{ padding:'5px 10px', color:ratio>=1?T.green:T.red, fontWeight:700 }}>{(ratio*100).toFixed(0)}%</td>
                    <td style={{ padding:'5px 10px', color:gap>0?T.red:T.green, fontWeight:600 }}>{gap>0?`-$${gap.toFixed(1)}Bn`:'Surplus'}</td>
                    <td style={{ padding:'5px 10px', color:T.green }}>{avgGreen.toFixed(1)}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {/* SBTi + Net Zero summary */}
        <div style={{ marginTop:14, display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
          <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:8, padding:14 }}>
            <h4 style={{ margin:'0 0 10px', fontSize:13 }}>SBTi Status × Risk Quadrant</h4>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
              <thead>
                <tr style={{ background:T.sub }}>
                  <th style={{ padding:'5px 8px', textAlign:'left', fontWeight:600 }}>SBTi Status</th>
                  {RISK_QUADRANTS.map(q=><th key={q} style={{ padding:'5px 8px', textAlign:'center', fontWeight:600, color:quadrantColor(q), fontSize:10 }}>{q}</th>)}
                </tr>
              </thead>
              <tbody>
                {SBTI_STATUSES.map((status,i)=>{
                  const statusClients = CLIENTS.filter(c=>c.sbtiStatus===status);
                  return (
                    <tr key={status} style={{ background:i%2===0?'#fff':T.sub, borderBottom:`1px solid ${T.border}` }}>
                      <td style={{ padding:'5px 8px', fontWeight:600, fontSize:11 }}>{status}</td>
                      {RISK_QUADRANTS.map(q=>{
                        const count = statusClients.filter(c=>c.riskQuadrant===q).length;
                        return <td key={q} style={{ padding:'5px 8px', textAlign:'center', color:count>0?quadrantColor(q):T.muted, fontWeight:count>0?700:400 }}>{count||'—'}</td>;
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:8, padding:14 }}>
            <h4 style={{ margin:'0 0 10px', fontSize:13 }}>Custom Instruments by Client Type</h4>
            {typeStats.map((t,i)=>{
              const typeClients = CLIENTS.filter(c=>c.type===t.type);
              const totalInstruments = typeClients.reduce((s,c)=>s+c.customInstruments,0);
              const avgInstruments = typeClients.length>0 ? totalInstruments/typeClients.length : 0;
              return (
                <div key={t.type} style={{ display:'flex', justifyContent:'space-between', padding:'5px 0', borderBottom:`1px solid ${T.border}`, fontSize:12 }}>
                  <span style={{ fontWeight:600 }}>{t.type}</span>
                  <div>
                    <span style={{ color:T.navy, fontWeight:700, marginRight:10 }}>{totalInstruments} total</span>
                    <span style={{ color:T.muted }}>(avg {avgInstruments.toFixed(1)})</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
