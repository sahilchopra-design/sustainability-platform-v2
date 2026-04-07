import React, { useState, useMemo, useCallback } from 'react';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis, ScatterChart, Scatter, ZAxis,
} from 'recharts';

const T = {
  bg: '#f8f6f0', card: '#ffffff', border: '#e2ded5', text: '#1a1a2e',
  sub: '#f6f4f0', muted: '#6b7280', indigo: '#4f46e5', gold: '#b8860b',
  green: '#16a34a', red: '#dc2626', blue: '#0369a1', amber: '#d97706',
  navy: '#1e3a5f', teal: '#0f766e', purple: '#7c3aed', orange: '#ea580c',
};
const sr = s => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };

const SECTORS = ['Energy','Materials','Industrials','Consumer Disc','Consumer Staples',
  'Healthcare','Financials','IT','Comm Services','Utilities','Real Estate'];
const ENGAGEMENT_STATUSES = ['Not Engaged','Outreach Sent','In Dialogue','Committed','Escalated'];
const ESG_RATINGS = ['AAA','AA','A','BBB','BB','B','CCC'];
const COUNTRIES = ['US','UK','DE','FR','JP','CN','CA','AU','NL','CH','SE','DK','KR','SG','IN','BR'];

const COMPANY_NAMES = Array.from({ length: 150 }, (_, i) => {
  const prefixes = ['Alpha','Beta','Gamma','Delta','Epsilon','Zeta','Eta','Theta','Iota','Kappa',
    'Lambda','Mu','Nu','Xi','Omicron','Pi','Rho','Sigma','Tau','Upsilon','Phi','Chi','Psi','Omega',
    'Nova','Apex','Peak','Ridge','Summit','Crest','Horizon','Nexus','Core','Prime','Vanta'];
  const suffixes = ['Energy','Materials','Corp','Industries','Capital','Holdings','Solutions',
    'Technologies','Resources','Infrastructure','Ventures','Partners','Group','International','Systems'];
  return `${prefixes[i % prefixes.length]} ${suffixes[Math.floor(i / prefixes.length) % suffixes.length]}`;
});

// Generate 150 holdings outside component
const RAW_WEIGHTS = Array.from({ length: 150 }, (_, i) => sr(i * 7 + 1) + 0.1);
const TOTAL_W = RAW_WEIGHTS.reduce((s, w) => s + w, 0);

const HOLDINGS = Array.from({ length: 150 }, (_, i) => {
  const sector = SECTORS[Math.floor(sr(i * 11) * SECTORS.length)];
  const carbonIntensity = 10 + sr(i * 13) * 990; // tCO2e/$M revenue
  const physicalRiskScore = parseFloat((sr(i * 17) * 100).toFixed(1));
  const transitionRiskScore = parseFloat((sr(i * 19) * 100).toFixed(1));
  const itr = parseFloat((1.3 + sr(i * 23) * 3.2).toFixed(2));
  const greenRevenuePct = parseFloat((sr(i * 29) * 60).toFixed(1));
  const weight = parseFloat((RAW_WEIGHTS[i] / TOTAL_W * 100).toFixed(3));
  const marketCapBn = parseFloat((0.5 + sr(i * 31) * 499).toFixed(1));
  const scope1 = parseFloat((carbonIntensity * 0.3 * marketCapBn * 0.01).toFixed(0));
  const scope2 = parseFloat((carbonIntensity * 0.2 * marketCapBn * 0.01).toFixed(0));
  const scope3Up = parseFloat((carbonIntensity * 0.25 * marketCapBn * 0.01).toFixed(0));
  const scope3Dn = parseFloat((carbonIntensity * 0.25 * marketCapBn * 0.01).toFixed(0));
  return {
    id: i, name: COMPANY_NAMES[i], sector,
    isin: `US${String(i).padStart(9, '0')}X`,
    weight, carbonIntensity: parseFloat(carbonIntensity.toFixed(1)),
    physicalRiskScore, transitionRiskScore, itr,
    greenRevenuePct, engagementStatus: ENGAGEMENT_STATUSES[Math.floor(sr(i * 37) * ENGAGEMENT_STATUSES.length)],
    momentumScore: parseFloat((sr(i * 41) * 100).toFixed(1)),
    esgRating: ESG_RATINGS[Math.floor(sr(i * 43) * ESG_RATINGS.length)],
    country: COUNTRIES[Math.floor(sr(i * 47) * COUNTRIES.length)],
    marketCapBn, scope1, scope2, scope3Upstream: scope3Up, scope3Downstream: scope3Dn,
    reductionTarget2030: parseFloat((20 + sr(i * 53) * 50).toFixed(0)),
    reductionTarget2050: parseFloat((60 + sr(i * 59) * 40).toFixed(0)),
  };
});

const PATHWAY_YEARS = Array.from({ length: 26 }, (_, i) => 2025 + i);

export default function PortfolioClimatePulsePage() {
  const [activeTab, setActiveTab] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [sectorFilter, setSectorFilter] = useState([]);
  const [itrMin, setItrMin] = useState(1.3);
  const [itrMax, setItrMax] = useState(4.5);
  const [weightMin, setWeightMin] = useState(0);
  const [sortCol, setSortCol] = useState('weight');
  const [sortDir, setSortDir] = useState('desc');
  const [selectedHolding, setSelectedHolding] = useState(null);
  const [compareA, setCompareA] = useState(0);
  const [compareB, setCompareB] = useState(1);
  const [compareMode, setCompareMode] = useState(false);

  const tabs = ['Pulse Dashboard','Holdings Table','Carbon Analytics','Risk Decomposition','Engagement Monitor','Decarbonization Pathway','Summary & Export'];

  const filteredHoldings = useMemo(() => {
    let out = [...HOLDINGS];
    if (searchTerm) out = out.filter(h => h.name.toLowerCase().includes(searchTerm.toLowerCase()) || h.sector.toLowerCase().includes(searchTerm.toLowerCase()));
    if (sectorFilter.length > 0) out = out.filter(h => sectorFilter.includes(h.sector));
    out = out.filter(h => h.itr >= itrMin && h.itr <= itrMax && h.weight >= weightMin);
    out = out.sort((a, b) => {
      const v = sortDir === 'asc' ? 1 : -1;
      return (a[sortCol] > b[sortCol] ? 1 : -1) * v;
    });
    return out;
  }, [searchTerm, sectorFilter, itrMin, itrMax, weightMin, sortCol, sortDir]);

  const portfolioKPIs = useMemo(() => {
    if (!filteredHoldings.length) return { wITR: 0, waci: 0, physVaR: 0, transVaR: 0, avgGreenRev: 0, totalWeight: 0 };
    const totalW = filteredHoldings.reduce((s, h) => s + h.weight, 0);
    const wITR = totalW > 0 ? filteredHoldings.reduce((s, h) => s + h.itr * h.weight, 0) / totalW : 0;
    const waci = totalW > 0 ? filteredHoldings.reduce((s, h) => s + h.carbonIntensity * h.weight, 0) / totalW : 0;
    const physVaR = totalW > 0 ? filteredHoldings.reduce((s, h) => s + h.physicalRiskScore * h.weight, 0) / totalW : 0;
    const transVaR = totalW > 0 ? filteredHoldings.reduce((s, h) => s + h.transitionRiskScore * h.weight, 0) / totalW : 0;
    const avgGreenRev = totalW > 0 ? filteredHoldings.reduce((s, h) => s + h.greenRevenuePct * h.weight, 0) / totalW : 0;
    return { wITR: wITR.toFixed(2), waci: waci.toFixed(1), physVaR: physVaR.toFixed(1), transVaR: transVaR.toFixed(1), avgGreenRev: avgGreenRev.toFixed(1), totalWeight: totalW.toFixed(1) };
  }, [filteredHoldings]);

  const sectorBreakdown = useMemo(() => {
    const groups = {};
    HOLDINGS.forEach(h => {
      if (!groups[h.sector]) groups[h.sector] = { sector: h.sector, weight: 0, count: 0, totalCI: 0, totalITR: 0 };
      groups[h.sector].weight += h.weight;
      groups[h.sector].count += 1;
      groups[h.sector].totalCI += h.carbonIntensity;
      groups[h.sector].totalITR += h.itr;
    });
    return Object.values(groups).map(g => ({
      ...g,
      weight: parseFloat(g.weight.toFixed(2)),
      avgCI: parseFloat((g.count > 0 ? g.totalCI / g.count : 0).toFixed(1)),
      avgITR: parseFloat((g.count > 0 ? g.totalITR / g.count : 0).toFixed(2)),
    }));
  }, []);

  const scopeAttribution = useMemo(() => {
    return sectorBreakdown.map(s => {
      const holdings = HOLDINGS.filter(h => h.sector === s.sector);
      return {
        sector: s.sector,
        scope1: holdings.length > 0 ? parseFloat((holdings.reduce((a, h) => a + h.scope1, 0) / holdings.length).toFixed(0)) : 0,
        scope2: holdings.length > 0 ? parseFloat((holdings.reduce((a, h) => a + h.scope2, 0) / holdings.length).toFixed(0)) : 0,
        scope3: holdings.length > 0 ? parseFloat((holdings.reduce((a, h) => a + h.scope3Upstream + h.scope3Downstream, 0) / holdings.length).toFixed(0)) : 0,
      };
    });
  }, [sectorBreakdown]);

  const pathway = useMemo(() => {
    const baseCI = parseFloat(portfolioKPIs.waci) || 200;
    return PATHWAY_YEARS.map((yr, i) => {
      const reduction = i / 25;
      const parisTarget = baseCI * (1 - reduction * 0.95);
      const actual = baseCI * (1 - reduction * 0.45);
      const budget = baseCI * (1 - reduction * 0.85);
      return { year: yr, actual: parseFloat(actual.toFixed(1)), parisTarget: parseFloat(parisTarget.toFixed(1)), budget: parseFloat(budget.toFixed(1)) };
    });
  }, [portfolioKPIs.waci]);

  const engagementStats = useMemo(() => {
    const stats = {};
    ENGAGEMENT_STATUSES.forEach(s => { stats[s] = { status: s, count: 0, totalWeight: 0, avgITR: 0, totalITR: 0 }; });
    HOLDINGS.forEach(h => {
      if (stats[h.engagementStatus]) {
        stats[h.engagementStatus].count += 1;
        stats[h.engagementStatus].totalWeight += h.weight;
        stats[h.engagementStatus].totalITR += h.itr;
      }
    });
    return Object.values(stats).map(s => ({
      ...s,
      avgITR: s.count > 0 ? parseFloat((s.totalITR / s.count).toFixed(2)) : 0,
      totalWeight: parseFloat(s.totalWeight.toFixed(2)),
    }));
  }, []);

  const radarData = useMemo(() => [
    { metric: 'Physical Risk', value: parseFloat(portfolioKPIs.physVaR) },
    { metric: 'Transition Risk', value: parseFloat(portfolioKPIs.transVaR) },
    { metric: 'Carbon Intensity', value: Math.min(100, parseFloat(portfolioKPIs.waci) / 10) },
    { metric: 'Green Revenue', value: parseFloat(portfolioKPIs.avgGreenRev) * (100/60) },
    { metric: 'Engagement', value: HOLDINGS.filter(h => h.engagementStatus !== 'Not Engaged').length / HOLDINGS.length * 100 },
  ], [portfolioKPIs]);

  const handleSort = (col) => {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortCol(col); setSortDir('desc'); }
  };

  const toggleSector = (s) => {
    setSectorFilter(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
  };

  const itrColor = (itr) => {
    if (itr <= 1.5) return T.green;
    if (itr <= 2.0) return T.teal;
    if (itr <= 2.5) return T.blue;
    if (itr <= 3.0) return T.amber;
    return T.red;
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
            <div style={{ width: 4, height: 32, background: T.teal, borderRadius: 2 }} />
            <h1 style={{ fontSize: 24, fontWeight: 700, color: T.text, margin: 0 }}>Portfolio Climate Pulse</h1>
            <span style={{ background: T.teal, color: '#fff', fontSize: 11, padding: '2px 8px', borderRadius: 4 }}>EP-CY2</span>
          </div>
          <p style={{ color: T.muted, margin: 0, marginLeft: 16, fontSize: 13 }}>150 holdings · WACI methodology · Decarbonization pathway · Engagement tracker</p>
        </div>

        <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
          <KpiCard label="Portfolio ITR" value={`${portfolioKPIs.wITR}°C`} sub="WACI weighted avg" color={itrColor(parseFloat(portfolioKPIs.wITR))} />
          <KpiCard label="WACI" value={portfolioKPIs.waci} sub="tCO2e/$M invested" color={T.amber} />
          <KpiCard label="Physical VaR" value={`${portfolioKPIs.physVaR}%`} sub="wtd physical risk" color={T.orange} />
          <KpiCard label="Transition VaR" value={`${portfolioKPIs.transVaR}%`} sub="wtd transition risk" color={T.purple} />
          <KpiCard label="Green Revenue" value={`${portfolioKPIs.avgGreenRev}%`} sub="wtd avg green rev" color={T.green} />
          <KpiCard label="Holdings" value={filteredHoldings.length} sub="after filters" />
        </div>

        <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: `1px solid ${T.border}` }}>
          {tabs.map((t, i) => (
            <button key={i} onClick={() => setActiveTab(i)} style={{
              padding: '8px 16px', border: 'none', background: activeTab === i ? T.teal : 'transparent',
              color: activeTab === i ? '#fff' : T.muted, borderRadius: '6px 6px 0 0', cursor: 'pointer',
              fontWeight: activeTab === i ? 600 : 400, fontSize: 13,
            }}>{t}</button>
          ))}
        </div>

        {/* Filter Controls */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
          <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Search holdings…"
            style={{ padding: '6px 12px', border: `1px solid ${T.border}`, borderRadius: 6, fontSize: 13, width: 200 }} />
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {SECTORS.map(s => (
              <button key={s} onClick={() => toggleSector(s)} style={{
                padding: '4px 8px', fontSize: 11, border: `1px solid ${T.border}`, borderRadius: 4, cursor: 'pointer',
                background: sectorFilter.includes(s) ? T.teal : T.card, color: sectorFilter.includes(s) ? '#fff' : T.muted,
              }}>{s}</button>
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 12, color: T.muted }}>ITR:</span>
            <input type="number" value={itrMin} onChange={e => setItrMin(Number(e.target.value))} step="0.1" min="1" max="5"
              style={{ width: 55, padding: '4px 6px', border: `1px solid ${T.border}`, borderRadius: 4, fontSize: 12 }} />
            <span style={{ fontSize: 12, color: T.muted }}>–</span>
            <input type="number" value={itrMax} onChange={e => setItrMax(Number(e.target.value))} step="0.1" min="1" max="5"
              style={{ width: 55, padding: '4px 6px', border: `1px solid ${T.border}`, borderRadius: 4, fontSize: 12 }} />
          </div>
        </div>

        {/* TAB 0 — Pulse Dashboard */}
        {activeTab === 0 && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 16 }}>
              {/* ITR Gauge */}
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <h3 style={{ margin: '0 0 12px', fontSize: 14, alignSelf: 'flex-start' }}>Portfolio ITR Gauge</h3>
                <div style={{ width: 140, height: 140, borderRadius: '50%', border: `12px solid ${itrColor(parseFloat(portfolioKPIs.wITR))}`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ fontSize: 32, fontWeight: 700, color: itrColor(parseFloat(portfolioKPIs.wITR)) }}>{portfolioKPIs.wITR}°C</div>
                  <div style={{ fontSize: 11, color: T.muted }}>Portfolio ITR</div>
                </div>
                <div style={{ marginTop: 12, width: '100%' }}>
                  {[['1.5°C Paris', T.green],['2.0°C Well Below', T.teal],['3.0°C NDC', T.amber],['4.0°C BAU', T.red]].map(([label, color]) => (
                    <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      <div style={{ width: 10, height: 10, borderRadius: '50%', background: color }} />
                      <span style={{ fontSize: 11, color: T.muted }}>{label}</span>
                    </div>
                  ))}
                </div>
              </div>
              {/* Radar */}
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
                <h3 style={{ margin: '0 0 8px', fontSize: 14 }}>Risk & Quality Radar</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <RadarChart data={radarData}>
                    <PolarGrid stroke={T.border} />
                    <PolarAngleAxis dataKey="metric" tick={{ fontSize: 10 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 9 }} />
                    <Radar dataKey="value" stroke={T.teal} fill={T.teal} fillOpacity={0.3} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
              {/* ITR Distribution */}
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
                <h3 style={{ margin: '0 0 8px', fontSize: 14 }}>Holding ITR Distribution</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={[
                    { band: '<1.5°C', count: HOLDINGS.filter(h => h.itr < 1.5).length },
                    { band: '1.5–2°C', count: HOLDINGS.filter(h => h.itr >= 1.5 && h.itr < 2).length },
                    { band: '2–2.5°C', count: HOLDINGS.filter(h => h.itr >= 2 && h.itr < 2.5).length },
                    { band: '2.5–3°C', count: HOLDINGS.filter(h => h.itr >= 2.5 && h.itr < 3).length },
                    { band: '>3°C', count: HOLDINGS.filter(h => h.itr >= 3).length },
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="band" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Bar dataKey="count" fill={T.teal} radius={[3,3,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            {/* Sector ITR Heatmap */}
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
              <h3 style={{ margin: '0 0 12px', fontSize: 14 }}>Sector Weight × Average ITR</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={sectorBreakdown}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="sector" tick={{ fontSize: 10 }} angle={-20} textAnchor="end" height={45} />
                  <YAxis yAxisId="left" tick={{ fontSize: 10 }} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10 }} unit="°C" />
                  <Tooltip />
                  <Legend />
                  <Bar yAxisId="left" dataKey="weight" fill={T.teal} name="Weight %" radius={[2,2,0,0]} />
                  <Bar yAxisId="right" dataKey="avgITR" fill={T.orange} name="Avg ITR °C" radius={[2,2,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* TAB 1 — Holdings Table */}
        {activeTab === 1 && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: 13, color: T.muted }}>{filteredHoldings.length} holdings shown</span>
              <button onClick={() => setCompareMode(m => !m)} style={{ padding: '5px 12px', background: compareMode ? T.teal : T.card, border: `1px solid ${T.border}`, borderRadius: 5, fontSize: 12, cursor: 'pointer', color: compareMode ? '#fff' : T.text }}>
                {compareMode ? '✓ Compare Mode ON' : 'Compare Mode'}
              </button>
            </div>
            {compareMode && (
              <div style={{ background: T.card, border: `1px solid ${T.teal}`, borderRadius: 8, padding: 14, marginBottom: 12 }}>
                <div style={{ display: 'flex', gap: 12, marginBottom: 10 }}>
                  <select value={compareA} onChange={e => setCompareA(Number(e.target.value))}
                    style={{ flex: 1, padding: '6px 8px', border: `1px solid ${T.border}`, borderRadius: 5, fontSize: 12 }}>
                    {HOLDINGS.map((h, i) => <option key={i} value={i}>{h.name}</option>)}
                  </select>
                  <span style={{ alignSelf: 'center', fontWeight: 600 }}>vs</span>
                  <select value={compareB} onChange={e => setCompareB(Number(e.target.value))}
                    style={{ flex: 1, padding: '6px 8px', border: `1px solid ${T.border}`, borderRadius: 5, fontSize: 12 }}>
                    {HOLDINGS.map((h, i) => <option key={i} value={i}>{h.name}</option>)}
                  </select>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 8 }}>
                  {[['ITR','itr','°C'],['Carbon Intensity','carbonIntensity','tCO2e/$M'],['Physical Risk','physicalRiskScore',''],['Transition Risk','transitionRiskScore',''],['Green Revenue','greenRevenuePct','%'],['Weight','weight','%'],['Market Cap','marketCapBn','$Bn'],['ESG Rating','esgRating',''],['Momentum','momentumScore',''],['Engagement','engagementStatus','']].map(([label, field, unit]) => {
                    const vA = HOLDINGS[compareA]?.[field];
                    const vB = HOLDINGS[compareB]?.[field];
                    return (
                      <div key={field} style={{ background: T.sub, borderRadius: 6, padding: '8px 10px' }}>
                        <div style={{ fontSize: 10, color: T.muted }}>{label}</div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: T.teal }}>{typeof vA === 'number' ? `${vA}${unit}` : vA}</div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: T.indigo }}>{typeof vB === 'number' ? `${vB}${unit}` : vB}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, overflow: 'hidden' }}>
              <div style={{ overflowX: 'auto', maxHeight: 500, overflowY: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead>
                    <tr style={{ background: T.sub }}>
                      {['name','sector','weight','itr','carbonIntensity','physicalRiskScore','transitionRiskScore','greenRevenuePct','esgRating','engagementStatus','marketCapBn'].map(col => (
                        <th key={col} onClick={() => handleSort(col)} style={{ padding: '8px 10px', textAlign: 'left', cursor: 'pointer', whiteSpace: 'nowrap', fontSize: 11, fontWeight: 600, color: sortCol === col ? T.teal : T.text }}>
                          {col.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())} {sortCol === col ? (sortDir === 'asc' ? '↑' : '↓') : ''}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredHoldings.map((h, idx) => (
                      <tr key={h.id} onClick={() => setSelectedHolding(selectedHolding?.id === h.id ? null : h)}
                        style={{ background: selectedHolding?.id === h.id ? '#eef2ff' : idx % 2 === 0 ? '#fff' : T.sub, cursor: 'pointer', borderBottom: `1px solid ${T.border}` }}>
                        <td style={{ padding: '7px 10px', fontWeight: 600 }}>{h.name}</td>
                        <td style={{ padding: '7px 10px', fontSize: 11 }}><span style={{ background: T.sub, padding: '2px 5px', borderRadius: 4 }}>{h.sector}</span></td>
                        <td style={{ padding: '7px 10px' }}>{h.weight.toFixed(2)}%</td>
                        <td style={{ padding: '7px 10px', fontWeight: 700, color: itrColor(h.itr) }}>{h.itr}°C</td>
                        <td style={{ padding: '7px 10px' }}>{h.carbonIntensity}</td>
                        <td style={{ padding: '7px 10px' }}>
                          <div style={{ background: T.border, borderRadius: 4, overflow: 'hidden', height: 6, width: 60 }}>
                            <div style={{ height: '100%', background: T.orange, width: `${h.physicalRiskScore}%` }} />
                          </div>
                        </td>
                        <td style={{ padding: '7px 10px' }}>
                          <div style={{ background: T.border, borderRadius: 4, overflow: 'hidden', height: 6, width: 60 }}>
                            <div style={{ height: '100%', background: T.purple, width: `${h.transitionRiskScore}%` }} />
                          </div>
                        </td>
                        <td style={{ padding: '7px 10px', color: T.green }}>{h.greenRevenuePct}%</td>
                        <td style={{ padding: '7px 10px' }}><span style={{ fontSize: 11, background: T.sub, padding: '1px 5px', borderRadius: 3 }}>{h.esgRating}</span></td>
                        <td style={{ padding: '7px 10px', fontSize: 11, color: h.engagementStatus === 'Not Engaged' ? T.muted : h.engagementStatus === 'Escalated' ? T.red : T.teal }}>{h.engagementStatus}</td>
                        <td style={{ padding: '7px 10px' }}>${h.marketCapBn}Bn</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            {selectedHolding && (
              <div style={{ background: T.card, border: `1px solid ${T.teal}`, borderRadius: 8, padding: 16, marginTop: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                  <h3 style={{ margin: 0, color: T.teal, fontSize: 15 }}>{selectedHolding.name} — Full Detail</h3>
                  <button onClick={() => setSelectedHolding(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: T.muted }}>×</button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 8 }}>
                  {[['ISIN', selectedHolding.isin],['Sector', selectedHolding.sector],['Country', selectedHolding.country],['Weight', `${selectedHolding.weight.toFixed(3)}%`],['Market Cap', `$${selectedHolding.marketCapBn}Bn`],['ITR', `${selectedHolding.itr}°C`],['Carbon Intensity', `${selectedHolding.carbonIntensity} tCO2e/$M`],['Physical Risk', `${selectedHolding.physicalRiskScore}%`],['Transition Risk', `${selectedHolding.transitionRiskScore}%`],['ESG Rating', selectedHolding.esgRating],['Scope 1', `${selectedHolding.scope1} ktCO2e`],['Scope 2', `${selectedHolding.scope2} ktCO2e`],['Scope 3 Up', `${selectedHolding.scope3Upstream} ktCO2e`],['Scope 3 Dn', `${selectedHolding.scope3Downstream} ktCO2e`],['Green Rev', `${selectedHolding.greenRevenuePct}%`],['Momentum', `${selectedHolding.momentumScore}`],['Engagement', selectedHolding.engagementStatus],['Target 2030', `${selectedHolding.reductionTarget2030}%`],['Target 2050', `${selectedHolding.reductionTarget2050}%`],].map(([k, v]) => (
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

        {/* TAB 2 — Carbon Analytics */}
        {activeTab === 2 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
              <h3 style={{ margin: '0 0 12px', fontSize: 14 }}>Carbon Intensity by Sector (Avg tCO2e/$M)</h3>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={sectorBreakdown.sort((a,b)=>b.avgCI-a.avgCI)}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="sector" tick={{ fontSize: 10 }} angle={-25} textAnchor="end" height={50} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Bar dataKey="avgCI" fill={T.orange} radius={[2,2,0,0]} name="Avg CI" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
              <h3 style={{ margin: '0 0 12px', fontSize: 14 }}>Scope Attribution by Sector (Avg ktCO2e)</h3>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={scopeAttribution}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="sector" tick={{ fontSize: 10 }} angle={-25} textAnchor="end" height={50} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="scope1" stackId="a" fill={T.red} name="Scope 1" />
                  <Bar dataKey="scope2" stackId="a" fill={T.amber} name="Scope 2" />
                  <Bar dataKey="scope3" stackId="a" fill={T.indigo} name="Scope 3" radius={[2,2,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16, gridColumn: 'span 2' }}>
              <h3 style={{ margin: '0 0 12px', fontSize: 14 }}>Portfolio Carbon Footprint Summary</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 12 }}>
                {[
                  ['WACI', `${portfolioKPIs.waci} tCO2e/$M`, T.amber],
                  ['Total S1 (avg)', `${(HOLDINGS.reduce((s,h)=>s+h.scope1,0)/HOLDINGS.length).toFixed(0)} ktCO2e`, T.red],
                  ['Total S2 (avg)', `${(HOLDINGS.reduce((s,h)=>s+h.scope2,0)/HOLDINGS.length).toFixed(0)} ktCO2e`, T.orange],
                  ['Total S3 Up (avg)', `${(HOLDINGS.reduce((s,h)=>s+h.scope3Upstream,0)/HOLDINGS.length).toFixed(0)} ktCO2e`, T.indigo],
                  ['Avg Green Rev', `${portfolioKPIs.avgGreenRev}%`, T.green],
                ].map(([k,v,c]) => (
                  <div key={k} style={{ background: T.sub, borderRadius: 8, padding: '12px 14px', borderLeft: `4px solid ${c}` }}>
                    <div style={{ fontSize: 11, color: T.muted }}>{k}</div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: c, marginTop: 4 }}>{v}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3 — Risk Decomposition */}
        {activeTab === 3 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
              <h3 style={{ margin: '0 0 12px', fontSize: 14 }}>Physical Risk by Sector</h3>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={sectorBreakdown.map(s => ({ ...s, avgPhys: parseFloat((HOLDINGS.filter(h=>h.sector===s.sector).reduce((a,h)=>a+h.physicalRiskScore,0) / (HOLDINGS.filter(h=>h.sector===s.sector).length || 1)).toFixed(1)) }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="sector" tick={{ fontSize: 10 }} angle={-25} textAnchor="end" height={50} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Bar dataKey="avgPhys" fill={T.orange} radius={[2,2,0,0]} name="Avg Physical Risk" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
              <h3 style={{ margin: '0 0 12px', fontSize: 14 }}>Transition Risk by Sector</h3>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={sectorBreakdown.map(s => ({ ...s, avgTrans: parseFloat((HOLDINGS.filter(h=>h.sector===s.sector).reduce((a,h)=>a+h.transitionRiskScore,0) / (HOLDINGS.filter(h=>h.sector===s.sector).length || 1)).toFixed(1)) }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="sector" tick={{ fontSize: 10 }} angle={-25} textAnchor="end" height={50} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Bar dataKey="avgTrans" fill={T.purple} radius={[2,2,0,0]} name="Avg Transition Risk" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
              <h3 style={{ margin: '0 0 12px', fontSize: 14 }}>Portfolio Risk Radar</h3>
              <ResponsiveContainer width="100%" height={260}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke={T.border} />
                  <PolarAngleAxis dataKey="metric" tick={{ fontSize: 11 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 9 }} />
                  <Radar dataKey="value" stroke={T.teal} fill={T.teal} fillOpacity={0.3} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
              <h3 style={{ margin: '0 0 12px', fontSize: 14 }}>ITR vs Physical Risk Scatter (top 40)</h3>
              <ResponsiveContainer width="100%" height={260}>
                <ScatterChart>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="itr" name="ITR" type="number" domain={[1,5]} tick={{ fontSize: 10 }} label={{ value: 'ITR °C', position: 'insideBottom', offset: -5, fontSize: 11 }} />
                  <YAxis dataKey="physicalRiskScore" name="Physical Risk" tick={{ fontSize: 10 }} />
                  <ZAxis dataKey="weight" range={[20, 200]} />
                  <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                  <Scatter data={HOLDINGS.slice(0,40).map(h => ({ itr: h.itr, physicalRiskScore: h.physicalRiskScore, weight: h.weight }))} fill={T.teal} opacity={0.7} />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* TAB 4 — Engagement Monitor */}
        {activeTab === 4 && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, marginBottom: 16 }}>
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
                <h3 style={{ margin: '0 0 12px', fontSize: 14 }}>Engagement Stage Distribution</h3>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={engagementStats}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="status" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="count" fill={T.teal} name="# Holdings" radius={[2,2,0,0]} />
                    <Bar dataKey="avgITR" fill={T.orange} name="Avg ITR °C" radius={[2,2,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
                <h3 style={{ margin: '0 0 12px', fontSize: 14 }}>Engagement Summary</h3>
                {engagementStats.map(s => (
                  <div key={s.status} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: `1px solid ${T.border}` }}>
                    <span style={{ fontSize: 12 }}>{s.status}</span>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: T.teal }}>{s.count}</span>
                      <span style={{ fontSize: 11, color: T.muted }}> ({s.totalWeight.toFixed(1)}%)</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {/* Escalation Queue */}
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, overflow: 'hidden' }}>
              <div style={{ padding: '8px 14px', background: '#fef2f2', borderBottom: `1px solid ${T.border}` }}>
                <span style={{ fontWeight: 600, fontSize: 13, color: T.red }}>Escalation Queue — {HOLDINGS.filter(h=>h.engagementStatus==='Escalated').length} holdings</span>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: T.sub }}>
                    {['Company','Sector','ITR','Carbon Intensity','Weight','Reason'].map(h => (
                      <th key={h} style={{ padding: '7px 12px', textAlign: 'left', fontWeight: 600, fontSize: 11 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {HOLDINGS.filter(h => h.engagementStatus === 'Escalated').map((h, i) => (
                    <tr key={h.id} style={{ background: i % 2 === 0 ? '#fff' : T.sub, borderBottom: `1px solid ${T.border}` }}>
                      <td style={{ padding: '7px 12px', fontWeight: 600 }}>{h.name}</td>
                      <td style={{ padding: '7px 12px' }}>{h.sector}</td>
                      <td style={{ padding: '7px 12px', color: itrColor(h.itr), fontWeight: 700 }}>{h.itr}°C</td>
                      <td style={{ padding: '7px 12px' }}>{h.carbonIntensity} tCO2e/$M</td>
                      <td style={{ padding: '7px 12px' }}>{h.weight.toFixed(2)}%</td>
                      <td style={{ padding: '7px 12px', color: T.red, fontSize: 11 }}>No progress on emissions targets</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 5 — Decarbonization Pathway */}
        {activeTab === 5 && (
          <div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16, marginBottom: 16 }}>
              <h3 style={{ margin: '0 0 12px', fontSize: 14 }}>Portfolio Emissions Pathway 2025–2050 vs Paris Budget</h3>
              <ResponsiveContainer width="100%" height={320}>
                <LineChart data={pathway}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="year" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} label={{ value: 'tCO2e/$M', angle: -90, position: 'insideLeft', fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="actual" stroke={T.orange} strokeWidth={2} dot={false} name="Portfolio Trajectory" />
                  <Line type="monotone" dataKey="parisTarget" stroke={T.green} strokeWidth={2} dot={false} strokeDasharray="5 3" name="1.5°C Paris Budget" />
                  <Line type="monotone" dataKey="budget" stroke={T.blue} strokeWidth={2} dot={false} strokeDasharray="3 2" name="NDC Budget" />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
              <h3 style={{ margin: '0 0 12px', fontSize: 14 }}>Sector Reduction Targets (Avg 2030 & 2050)</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={sectorBreakdown.map(s => ({
                  sector: s.sector,
                  target2030: parseFloat((HOLDINGS.filter(h=>h.sector===s.sector).reduce((a,h)=>a+h.reductionTarget2030,0) / (HOLDINGS.filter(h=>h.sector===s.sector).length||1)).toFixed(0)),
                  target2050: parseFloat((HOLDINGS.filter(h=>h.sector===s.sector).reduce((a,h)=>a+h.reductionTarget2050,0) / (HOLDINGS.filter(h=>h.sector===s.sector).length||1)).toFixed(0)),
                }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="sector" tick={{ fontSize: 10 }} angle={-20} textAnchor="end" height={45} />
                  <YAxis tick={{ fontSize: 10 }} unit="%" />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="target2030" fill={T.teal} name="2030 Target %" radius={[2,2,0,0]} />
                  <Bar dataKey="target2050" fill={T.indigo} name="2050 Target %" radius={[2,2,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* TAB 6 — Summary & Export */}
        {activeTab === 6 && (
          <div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16, marginBottom: 16 }}>
              <h3 style={{ margin: '0 0 16px', fontSize: 15 }}>Portfolio Climate Pulse — Full Scorecard</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
                {[
                  ['Total Holdings', 150],['Portfolio ITR', `${portfolioKPIs.wITR}°C`],
                  ['WACI', `${portfolioKPIs.waci} tCO2e/$M`],['Physical VaR', `${portfolioKPIs.physVaR}%`],
                  ['Transition VaR', `${portfolioKPIs.transVaR}%`],['Green Revenue', `${portfolioKPIs.avgGreenRev}%`],
                  ['<1.5°C Holdings', HOLDINGS.filter(h=>h.itr<1.5).length],
                  ['>3°C Holdings', HOLDINGS.filter(h=>h.itr>=3).length],
                  ['Engaged Holdings', HOLDINGS.filter(h=>h.engagementStatus!=='Not Engaged').length],
                  ['Escalated', HOLDINGS.filter(h=>h.engagementStatus==='Escalated').length],
                  ['Committed', HOLDINGS.filter(h=>h.engagementStatus==='Committed').length],
                  ['Avg Green Revenue', `${(HOLDINGS.reduce((s,h)=>s+h.greenRevenuePct,0)/HOLDINGS.length).toFixed(1)}%`],
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
                <span style={{ fontWeight: 600, fontSize: 13 }}>Full Holdings Export (150 rows)</span>
              </div>
              <div style={{ overflowX: 'auto', maxHeight: 420, overflowY: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                  <thead>
                    <tr style={{ background: T.sub }}>
                      {['Name','Sector','Country','Weight','ITR','CI','Phys Risk','Trans Risk','ESG','Engagement','Green Rev','Scope1','Scope2','Target 2030','Target 2050'].map(h => (
                        <th key={h} style={{ padding: '6px 8px', textAlign: 'left', fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {HOLDINGS.map((h, idx) => (
                      <tr key={h.id} style={{ background: idx % 2 === 0 ? '#fff' : T.sub, borderBottom: `1px solid ${T.border}` }}>
                        <td style={{ padding: '5px 8px', fontWeight: 600, whiteSpace: 'nowrap' }}>{h.name}</td>
                        <td style={{ padding: '5px 8px' }}>{h.sector}</td>
                        <td style={{ padding: '5px 8px' }}>{h.country}</td>
                        <td style={{ padding: '5px 8px' }}>{h.weight.toFixed(2)}%</td>
                        <td style={{ padding: '5px 8px', color: itrColor(h.itr), fontWeight: 700 }}>{h.itr}°C</td>
                        <td style={{ padding: '5px 8px' }}>{h.carbonIntensity}</td>
                        <td style={{ padding: '5px 8px' }}>{h.physicalRiskScore}</td>
                        <td style={{ padding: '5px 8px' }}>{h.transitionRiskScore}</td>
                        <td style={{ padding: '5px 8px' }}>{h.esgRating}</td>
                        <td style={{ padding: '5px 8px', fontSize: 10 }}>{h.engagementStatus}</td>
                        <td style={{ padding: '5px 8px' }}>{h.greenRevenuePct}%</td>
                        <td style={{ padding: '5px 8px' }}>{h.scope1}</td>
                        <td style={{ padding: '5px 8px' }}>{h.scope2}</td>
                        <td style={{ padding: '5px 8px' }}>{h.reductionTarget2030}%</td>
                        <td style={{ padding: '5px 8px' }}>{h.reductionTarget2050}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Extra analytics shown below all tabs */}
        <div style={{ marginTop: 20, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {/* Sector top-line summary */}
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
            <h3 style={{ margin: '0 0 12px', fontSize: 14 }}>Sector Attribution Summary</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ background: T.sub }}>
                  {['Sector','Count','Wt%','Avg ITR','Avg CI','Avg Green Rev'].map(h=>(
                    <th key={h} style={{ padding:'6px 8px', textAlign:'left', fontWeight:600, fontSize:11 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sectorBreakdown.map((s,i)=>{
                  const holdings = HOLDINGS.filter(h=>h.sector===s.sector);
                  const avgGreen = holdings.length>0 ? holdings.reduce((a,h)=>a+h.greenRevenuePct,0)/holdings.length : 0;
                  return (
                    <tr key={s.sector} style={{ background:i%2===0?'#fff':T.sub, borderBottom:`1px solid ${T.border}` }}>
                      <td style={{ padding:'5px 8px', fontWeight:600 }}>{s.sector}</td>
                      <td style={{ padding:'5px 8px' }}>{s.count}</td>
                      <td style={{ padding:'5px 8px' }}>{s.weight.toFixed(1)}%</td>
                      <td style={{ padding:'5px 8px', color:itrColor(s.avgITR), fontWeight:700 }}>{s.avgITR}°C</td>
                      <td style={{ padding:'5px 8px' }}>{s.avgCI}</td>
                      <td style={{ padding:'5px 8px', color:T.green }}>{avgGreen.toFixed(1)}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {/* ITR sensitivity: what if sector reduces by 0.5°C */}
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
            <h3 style={{ margin: '0 0 12px', fontSize: 14 }}>Sensitivity: Sector -0.5°C ITR Impact on Portfolio ITR</h3>
            <div style={{ fontSize: 12, color: T.muted, marginBottom: 8 }}>If each sector's avg ITR drops by 0.5°C, how does portfolio ITR change?</div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ background: T.sub }}>
                  {['Sector','Sector Wt%','New Sector ITR','Portfolio ITR Impact'].map(h=>(
                    <th key={h} style={{ padding:'6px 8px', textAlign:'left', fontWeight:600, fontSize:11 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sectorBreakdown.map((s,i)=>{
                  const totalW = HOLDINGS.reduce((a,h)=>a+h.weight,0);
                  const sectorW = s.weight;
                  const impact = totalW > 0 ? (sectorW/totalW)*0.5 : 0;
                  return (
                    <tr key={s.sector} style={{ background:i%2===0?'#fff':T.sub, borderBottom:`1px solid ${T.border}` }}>
                      <td style={{ padding:'5px 8px', fontWeight:600 }}>{s.sector}</td>
                      <td style={{ padding:'5px 8px' }}>{(sectorW/totalW*100).toFixed(1)}%</td>
                      <td style={{ padding:'5px 8px', color:T.teal }}>{(s.avgITR-0.5).toFixed(2)}°C</td>
                      <td style={{ padding:'5px 8px', color:T.green, fontWeight:700 }}>-{impact.toFixed(3)}°C</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
        {/* Country Distribution */}
        <div style={{ marginTop: 16, background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
          <h3 style={{ margin: '0 0 12px', fontSize: 14 }}>Country Distribution — Holdings & Weight</h3>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {COUNTRIES.map(country => {
              const countryHoldings = HOLDINGS.filter(h=>h.country===country);
              const totalWeight = countryHoldings.reduce((s,h)=>s+h.weight,0);
              const avgITR = countryHoldings.length>0 ? countryHoldings.reduce((s,h)=>s+h.itr,0)/countryHoldings.length : 0;
              if(!countryHoldings.length) return null;
              return (
                <div key={country} style={{ background:T.sub, borderRadius:6, padding:'8px 12px', minWidth:90 }}>
                  <div style={{ fontSize:13, fontWeight:700, color:T.navy }}>{country}</div>
                  <div style={{ fontSize:11, color:T.muted }}>{countryHoldings.length} holdings</div>
                  <div style={{ fontSize:11 }}>Wt: <strong>{totalWeight.toFixed(1)}%</strong></div>
                  <div style={{ fontSize:11, color:itrColor(avgITR) }}>ITR: <strong>{avgITR.toFixed(2)}°C</strong></div>
                </div>
              );
            })}
          </div>
        </div>
        {/* ESG Rating Distribution */}
        <div style={{ marginTop: 16, background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
          <h3 style={{ margin: '0 0 12px', fontSize: 14 }}>ESG Rating Distribution & Average ITR per Rating</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 8 }}>
            {ESG_RATINGS.map(rating => {
              const rated = HOLDINGS.filter(h=>h.esgRating===rating);
              const avgITR = rated.length>0 ? rated.reduce((s,h)=>s+h.itr,0)/rated.length : 0;
              const totalWeight = rated.reduce((s,h)=>s+h.weight,0);
              return (
                <div key={rating} style={{ background:T.sub, borderRadius:6, padding:'10px 12px', textAlign:'center', borderTop:`3px solid ${rating.startsWith('A')?T.green:rating==='BBB'?T.blue:rating==='BB'?T.amber:T.red}` }}>
                  <div style={{ fontSize:16, fontWeight:800, color:rating.startsWith('A')?T.green:rating==='BBB'?T.blue:rating==='BB'?T.amber:T.red }}>{rating}</div>
                  <div style={{ fontSize:11, color:T.muted, marginTop:2 }}>{rated.length} holdings</div>
                  <div style={{ fontSize:11 }}>{totalWeight.toFixed(1)}%</div>
                  <div style={{ fontSize:12, fontWeight:600, color:itrColor(avgITR), marginTop:2 }}>{avgITR.toFixed(2)}°C</div>
                </div>
              );
            })}
          </div>
        </div>
        {/* Bottom footer analytics */}
        <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 14 }}>
            <h4 style={{ margin: '0 0 10px', fontSize: 13 }}>Momentum Score Leaders (Top 10 Holdings)</h4>
            {[...HOLDINGS].sort((a,b)=>b.momentumScore-a.momentumScore).slice(0,10).map((h,i)=>(
              <div key={h.id} style={{ display:'flex', justifyContent:'space-between', padding:'4px 0', borderBottom:`1px solid ${T.border}`, fontSize:12 }}>
                <div>
                  <span style={{ fontWeight:600 }}>{h.name}</span>
                  <span style={{ fontSize:10, color:T.muted, marginLeft:6 }}>{h.sector}</span>
                </div>
                <div style={{ textAlign:'right' }}>
                  <span style={{ color:T.teal, fontWeight:700, marginRight:8 }}>{h.momentumScore}</span>
                  <span style={{ color:itrColor(h.itr), fontSize:11 }}>{h.itr}°C</span>
                </div>
              </div>
            ))}
          </div>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 14 }}>
            <h4 style={{ margin: '0 0 10px', fontSize: 13 }}>Highest Carbon Intensity Holdings (Top 10)</h4>
            {[...HOLDINGS].sort((a,b)=>b.carbonIntensity-a.carbonIntensity).slice(0,10).map((h,i)=>(
              <div key={h.id} style={{ display:'flex', justifyContent:'space-between', padding:'4px 0', borderBottom:`1px solid ${T.border}`, fontSize:12 }}>
                <div>
                  <span style={{ fontWeight:600 }}>{h.name}</span>
                  <span style={{ fontSize:10, color:T.muted, marginLeft:6 }}>{h.sector}</span>
                </div>
                <div style={{ textAlign:'right' }}>
                  <span style={{ color:T.orange, fontWeight:700 }}>{h.carbonIntensity} tCO2e/$M</span>
                </div>
              </div>
            ))}
          </div>
        </div>
        {/* Portfolio construction metrics */}
        <div style={{ marginTop: 14, background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 14 }}>
          <h4 style={{ margin: '0 0 10px', fontSize: 13 }}>Portfolio Construction — Concentration Metrics</h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 10 }}>
            {[
              ['Top 10 Holdings Wt', `${HOLDINGS.slice(0,10).reduce((s,h)=>s+h.weight,0).toFixed(1)}%`],
              ['Top 25 Holdings Wt', `${HOLDINGS.slice(0,25).reduce((s,h)=>s+h.weight,0).toFixed(1)}%`],
              ['Largest Single Wt', `${Math.max(...HOLDINGS.map(h=>h.weight)).toFixed(3)}%`],
              ['Smallest Single Wt', `${Math.min(...HOLDINGS.map(h=>h.weight)).toFixed(4)}%`],
              ['Effective # Holdings', `${(1/HOLDINGS.reduce((s,h)=>s+Math.pow(h.weight/100,2),0)).toFixed(0)}`],
            ].map(([k,v])=>(
              <div key={k} style={{ background:T.sub, borderRadius:6, padding:'8px 10px' }}>
                <div style={{ fontSize:10, color:T.muted }}>{k}</div>
                <div style={{ fontSize:15, fontWeight:700, marginTop:2 }}>{v}</div>
              </div>
            ))}
          </div>
        </div>
        {/* Physical risk leaders */}
        <div style={{ marginTop:14, background:T.card, border:`1px solid ${T.border}`, borderRadius:8, padding:14 }}>
          <h4 style={{ margin:'0 0 10px', fontSize:13 }}>Physical Risk — Exposure Distribution by Score Band</h4>
          <div style={{ display:'flex', gap:8, marginBottom:8 }}>
            {[['Low (<25)','#dcfce7',T.green],[' Med (25–50)','#fef3c7',T.amber],['High (50–75)','#ffedd5',T.orange],['Critical (>75)','#fee2e2',T.red]].map(([label,bg,color])=>{
              const range = label.match(/[\d.]+/g);
              const min = Number(range?.[0])||0;
              const max = Number(range?.[1])||100;
              const items = HOLDINGS.filter(h=>h.physicalRiskScore>=min&&h.physicalRiskScore<(range?.[1]?max+1:101));
              const weight = items.reduce((s,h)=>s+h.weight,0);
              return (
                <div key={label} style={{ flex:1, background:bg, borderRadius:6, padding:'8px 10px' }}>
                  <div style={{ fontSize:11, color, fontWeight:600 }}>{label}</div>
                  <div style={{ fontSize:20, fontWeight:800, color, marginTop:3 }}>{items.length}</div>
                  <div style={{ fontSize:11, color:T.muted }}>holdings · {weight.toFixed(1)}% wt</div>
                </div>
              );
            })}
          </div>
        </div>
        {/* Green Revenue Leaders */}
        <div style={{ marginTop: 14, background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 14 }}>
          <h4 style={{ margin: '0 0 10px', fontSize: 13 }}>Green Revenue Leaders (Top 15 Holdings)</h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 8 }}>
            {[...HOLDINGS].sort((a,b)=>b.greenRevenuePct-a.greenRevenuePct).slice(0,15).map(h=>(
              <div key={h.id} style={{ background:T.sub, borderRadius:6, padding:'7px 10px' }}>
                <div style={{ fontSize:11, fontWeight:600 }}>{h.name}</div>
                <div style={{ fontSize:14, fontWeight:700, color:T.green, marginTop:2 }}>{h.greenRevenuePct}%</div>
                <div style={{ fontSize:10, color:T.muted }}>{h.sector} · {h.weight.toFixed(2)}wt</div>
              </div>
            ))}
          </div>
        </div>
        {/* Decarbonization target gap analysis */}
        <div style={{ marginTop: 14, background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 14 }}>
          <h4 style={{ margin: '0 0 10px', fontSize: 13 }}>Holdings Behind 2030 Reduction Target — Estimated Gap (top 15 by weight)</h4>
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
              <thead>
                <tr style={{ background:T.sub }}>
                  {['Holding','Sector','Weight','Current ITR','Target 2030 %','Current CI','Required CI Reduction','Status'].map(h=>(
                    <th key={h} style={{ padding:'5px 8px', textAlign:'left', fontWeight:600, fontSize:11 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[...HOLDINGS].sort((a,b)=>b.weight-a.weight).slice(0,15).map((h,i)=>{
                  const requiredReduction = h.carbonIntensity * h.reductionTarget2030 / 100;
                  const onTrack = h.itr <= 2.0;
                  return (
                    <tr key={h.id} style={{ background:i%2===0?'#fff':T.sub, borderBottom:`1px solid ${T.border}` }}>
                      <td style={{ padding:'4px 8px', fontWeight:600 }}>{h.name}</td>
                      <td style={{ padding:'4px 8px', fontSize:11 }}>{h.sector}</td>
                      <td style={{ padding:'4px 8px' }}>{h.weight.toFixed(2)}%</td>
                      <td style={{ padding:'4px 8px', color:itrColor(h.itr), fontWeight:700 }}>{h.itr}°C</td>
                      <td style={{ padding:'4px 8px' }}>{h.reductionTarget2030}%</td>
                      <td style={{ padding:'4px 8px' }}>{h.carbonIntensity}</td>
                      <td style={{ padding:'4px 8px', color:T.orange }}>{requiredReduction.toFixed(1)}</td>
                      <td style={{ padding:'4px 8px' }}>
                        <span style={{ background:onTrack?'#dcfce7':'#fee2e2', color:onTrack?T.green:T.red, padding:'1px 6px', borderRadius:4, fontSize:11 }}>
                          {onTrack?'On Track':'Behind'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
