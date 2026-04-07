import React, { useState, useMemo, useCallback } from 'react';
import {
  BarChart, Bar, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ComposedChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ReferenceLine,
} from 'recharts';

const T = {
  bg: '#f8f6f0', card: '#ffffff', border: '#e2ded5', text: '#1a1a2e',
  sub: '#f6f4f0', muted: '#6b7280', indigo: '#4f46e5', gold: '#b8860b',
  green: '#16a34a', red: '#dc2626', blue: '#0369a1', amber: '#d97706',
  navy: '#1e3a5f', teal: '#0f766e', purple: '#7c3aed', orange: '#ea580c',
};
const sr = s => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };

const LEGAL_ENTITIES = ['HoldCo','BankCo UK','BankCo EU','BankCo Americas','BankCo APAC','Asset Mgmt','Insurance Sub','RE Sub','Private Equity','Treasury','FinTech Sub','Commodities'];
const ASSET_CLASSES = ['Corporate Loans','Sovereign Bonds','Listed Equity','Real Estate','Infrastructure','Private Credit','Commodities','Derivatives','Cash/MMF','Trade Finance'];
const BUSINESS_LINES = ['Corporate Banking','Retail Banking','Investment Banking','Asset Management','Insurance','Trading & Sales','Private Banking','Treasury'];
const GEOGRAPHIES = ['UK','EU','North America','APAC','EM','Japan','Australia','Middle East'];
const LIQUIDITY_OPTS = ['High','Medium','Low'];
const NGFS3 = ['Orderly','Disorderly','Hot House'];
const NGFS3_MULTS = [1.0, 1.4, 2.1];

const EXPOSURES = Array.from({ length: 120 }, (_, i) => {
  const entityName = LEGAL_ENTITIES[Math.floor(sr(i * 7) * LEGAL_ENTITIES.length)];
  const assetClass = ASSET_CLASSES[Math.floor(sr(i * 11) * ASSET_CLASSES.length)];
  const businessLine = BUSINESS_LINES[Math.floor(sr(i * 13) * BUSINESS_LINES.length)];
  const geography = GEOGRAPHIES[Math.floor(sr(i * 17) * GEOGRAPHIES.length)];
  const sector = ['Energy','Financials','Utilities','Materials','Consumer','Technology'][Math.floor(sr(i * 19) * 6)];
  const exposureMN = 50 + sr(i * 23) * 2450;
  const physRisk = 10 + sr(i * 29) * 80;
  const transRisk = 10 + sr(i * 31) * 80;
  const climateVaR95 = exposureMN * (0.02 + sr(i * 37) * 0.18);
  const concentrationScore = 10 + sr(i * 41) * 80;
  const currency = ['USD','EUR','GBP','JPY','AUD','SGD','CHF'][Math.floor(sr(i * 43) * 7)];
  const vintage = 2015 + Math.floor(sr(i * 47) * 9);
  const liquidity = LIQUIDITY_OPTS[Math.floor(sr(i * 53) * 3)];
  const hedged = sr(i * 59) > 0.6;
  const hedgeCostBps = hedged ? 5 + sr(i * 61) * 95 : 0;
  const counterpartyRisk = 10 + sr(i * 67) * 80;
  const expectedReturnPct = 0.04 + sr(i * 71) * 0.12;
  return {
    id: i, entityName, assetClass, businessLine, geography, sector,
    exposureMN, physRisk, transRisk, climateVaR95, concentrationScore,
    currency, vintage, liquidity, hedged, hedgeCostBps, counterpartyRisk,
    expectedReturnPct,
  };
});

const TCFD_ITEMS = [
  { id: 0, domain: 'Governance', item: 'Board climate oversight' },
  { id: 1, domain: 'Governance', item: 'Management climate roles' },
  { id: 2, domain: 'Governance', item: 'Climate in exec compensation' },
  { id: 3, domain: 'Strategy', item: 'Climate risks & opportunities identified' },
  { id: 4, domain: 'Strategy', item: 'Impact on business, strategy & financial planning' },
  { id: 5, domain: 'Strategy', item: 'Strategy resilience under scenarios' },
  { id: 6, domain: 'Risk Mgmt', item: 'Climate risk identification process' },
  { id: 7, domain: 'Risk Mgmt', item: 'Climate risk assessment process' },
  { id: 8, domain: 'Risk Mgmt', item: 'Climate risk integrated into enterprise risk' },
  { id: 9, domain: 'Metrics', item: 'Climate metrics disclosed' },
  { id: 10, domain: 'Metrics', item: 'Scope 1, 2, 3 GHG emissions' },
  { id: 11, domain: 'Metrics', item: 'Climate-related targets set' },
  { id: 12, domain: 'Metrics', item: 'Progress against targets' },
  { id: 13, domain: 'Scenario', item: 'Scenario analysis performed' },
  { id: 14, domain: 'Scenario', item: 'Physical risk quantified' },
];

const TCFD_STATUS = TCFD_ITEMS.map((item, i) => ({
  ...item,
  status: ['Complete','Partial','Not Started'][Math.floor(sr(i * 13) * 3)],
  score: sr(i * 17) > 0.5 ? (sr(i * 19) > 0.5 ? 2 : 1) : 0,
}));

const KpiCard = ({ label, value, color = T.text, sub = '' }) => (
  <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: '14px 18px', flex: 1, minWidth: 150 }}>
    <div style={{ fontSize: 11, color: T.muted, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
    <div style={{ fontSize: 22, fontWeight: 700, color }}>{value}</div>
    {sub && <div style={{ fontSize: 11, color: T.muted, marginTop: 2 }}>{sub}</div>}
  </div>
);

const TABS = ['Enterprise Dashboard','Exposure Database','Legal Entity View','Concentration Analysis','Risk Attribution','TCFD Board View','Summary & Export'];

export default function EnterpriseClimateRiskPage() {
  const [tab, setTab] = useState(0);
  const [entityFilter, setEntityFilter] = useState('All');
  const [businessFilter, setBusinessFilter] = useState('All');
  const [assetFilter, setAssetFilter] = useState('All');
  const [geoFilter, setGeoFilter] = useState('All');
  const [scenario, setScenario] = useState(0);
  const [liquidityFilter, setLiquidityFilter] = useState('All');
  const [hedgedOnly, setHedgedOnly] = useState(false);
  const [vintageMin, setVintageMin] = useState(2015);
  const [search, setSearch] = useState('');
  const [sortCol, setSortCol] = useState('exposureMN');
  const [sortDir, setSortDir] = useState(-1);
  const [selectedId, setSelectedId] = useState(null);

  const filtered = useMemo(() => {
    let d = EXPOSURES;
    if (entityFilter !== 'All') d = d.filter(x => x.entityName === entityFilter);
    if (businessFilter !== 'All') d = d.filter(x => x.businessLine === businessFilter);
    if (assetFilter !== 'All') d = d.filter(x => x.assetClass === assetFilter);
    if (geoFilter !== 'All') d = d.filter(x => x.geography === geoFilter);
    if (liquidityFilter !== 'All') d = d.filter(x => x.liquidity === liquidityFilter);
    if (hedgedOnly) d = d.filter(x => x.hedged);
    d = d.filter(x => x.vintage >= vintageMin);
    if (search) d = d.filter(x => x.entityName.toLowerCase().includes(search.toLowerCase()) || x.assetClass.toLowerCase().includes(search.toLowerCase()));
    return [...d].sort((a, b) => sortDir * ((a[sortCol] || 0) - (b[sortCol] || 0)));
  }, [entityFilter, businessFilter, assetFilter, geoFilter, liquidityFilter, hedgedOnly, vintageMin, search, sortCol, sortDir]);

  const scenMult = NGFS3_MULTS[scenario];

  const totalExposure = useMemo(() => filtered.reduce((s, x) => s + x.exposureMN, 0), [filtered]);
  const portfolioCVaR = useMemo(() => {
    if (!filtered.length) return 0;
    const sumSq = filtered.reduce((s, x) => s + (x.climateVaR95 * scenMult) ** 2, 0);
    return Math.sqrt(sumSq) * 0.75; // diversification factor
  }, [filtered, scenMult]);
  const standaloneSum = useMemo(() => filtered.reduce((s, x) => s + x.climateVaR95 * scenMult, 0), [filtered, scenMult]);
  const diversBenefit = standaloneSum > 0 ? (standaloneSum - portfolioCVaR) / standaloneSum * 100 : 0;

  const entityBarData = useMemo(() => LEGAL_ENTITIES.map(e => {
    const sub = filtered.filter(x => x.entityName === e);
    const totalExp = sub.reduce((s, x) => s + x.exposureMN, 0);
    const physVaR = sub.reduce((s, x) => s + x.climateVaR95 * (x.physRisk / 100) * scenMult, 0);
    const transVaR = sub.reduce((s, x) => s + x.climateVaR95 * (x.transRisk / 100) * scenMult, 0);
    return { entity: e.split(' ')[0], totalExp: +(totalExp / 1000).toFixed(1), physVaR: +(physVaR).toFixed(0), transVaR: +(transVaR).toFixed(0) };
  }), [filtered, scenMult]);

  // HHI concentration
  const hhi = useMemo(() => {
    const byEntity = LEGAL_ENTITIES.map(e => {
      const sub = filtered.filter(x => x.entityName === e);
      const share = totalExposure > 0 ? sub.reduce((s, x) => s + x.exposureMN, 0) / totalExposure : 0;
      return { name: e, hhi: +(share * share * 10000).toFixed(0), exposure: sub.reduce((s, x) => s + x.exposureMN, 0) };
    }).filter(x => x.exposure > 0);
    return byEntity;
  }, [filtered, totalExposure]);

  const totalHHI = useMemo(() => hhi.reduce((s, x) => s + x.hhi, 0), [hhi]);

  // MRC (marginal risk contribution proxy)
  const mrcData = useMemo(() => {
    if (!filtered.length) return [];
    const totalVar = portfolioCVaR;
    return LEGAL_ENTITIES.map(e => {
      const sub = filtered.filter(x => x.entityName === e);
      const entityVar = sub.reduce((s, x) => s + x.climateVaR95 * scenMult, 0);
      const weight = totalExposure > 0 ? sub.reduce((s, x) => s + x.exposureMN, 0) / totalExposure : 0;
      const mrc = totalVar > 0 ? entityVar / totalVar * weight * 100 : 0;
      const riskAdjReturn = sub.length > 0 && entityVar > 0 ? sub.reduce((s, x) => s + x.exposureMN * x.expectedReturnPct, 0) / entityVar : 0;
      return { entity: e.split(' ')[0], mrc: +mrc.toFixed(3), riskAdjReturn: +riskAdjReturn.toFixed(4), exposure: +(sub.reduce((s, x) => s + x.exposureMN, 0) / 1000).toFixed(1) };
    }).filter(x => x.exposure > 0);
  }, [filtered, portfolioCVaR, totalExposure, scenMult]);

  const tcfdScore = useMemo(() => {
    const total = TCFD_STATUS.reduce((s, x) => s + x.score, 0);
    return total / (TCFD_STATUS.length * 2) * 100;
  }, []);

  const scenarioImpacts = useMemo(() => LEGAL_ENTITIES.map(e => {
    const sub = EXPOSURES.filter(x => x.entityName === e);
    const base = sub.reduce((s, x) => s + x.climateVaR95, 0);
    return {
      entity: e.split(' ')[0],
      orderly: +(base * 1.0 / 1000).toFixed(2),
      disorderly: +(base * 1.4 / 1000).toFixed(2),
      hotHouse: +(base * 2.1 / 1000).toFixed(2),
    };
  }).filter(x => x.orderly > 0), []);

  const handleSort = useCallback((col) => {
    if (sortCol === col) setSortDir(d => -d);
    else { setSortCol(col); setSortDir(-1); }
  }, [sortCol]);

  const selectedExposure = useMemo(() => selectedId != null ? EXPOSURES.find(x => x.id === selectedId) : null, [selectedId]);

  const filterRow = (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16, padding: '12px 16px', background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, alignItems: 'center' }}>
      <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search exposures..." style={{ padding: '6px 10px', border: `1px solid ${T.border}`, borderRadius: 6, fontSize: 12, width: 150 }} />
      <select value={entityFilter} onChange={e => setEntityFilter(e.target.value)} style={{ padding: '6px 8px', border: `1px solid ${T.border}`, borderRadius: 6, fontSize: 12 }}>
        <option>All</option>{LEGAL_ENTITIES.map(e => <option key={e}>{e}</option>)}
      </select>
      <select value={businessFilter} onChange={e => setBusinessFilter(e.target.value)} style={{ padding: '6px 8px', border: `1px solid ${T.border}`, borderRadius: 6, fontSize: 12 }}>
        <option>All</option>{BUSINESS_LINES.map(b => <option key={b}>{b}</option>)}
      </select>
      <select value={assetFilter} onChange={e => setAssetFilter(e.target.value)} style={{ padding: '6px 8px', border: `1px solid ${T.border}`, borderRadius: 6, fontSize: 12 }}>
        <option>All</option>{ASSET_CLASSES.map(a => <option key={a}>{a}</option>)}
      </select>
      <select value={geoFilter} onChange={e => setGeoFilter(e.target.value)} style={{ padding: '6px 8px', border: `1px solid ${T.border}`, borderRadius: 6, fontSize: 12 }}>
        <option>All</option>{GEOGRAPHIES.map(g => <option key={g}>{g}</option>)}
      </select>
      <select value={scenario} onChange={e => setScenario(+e.target.value)} style={{ padding: '6px 8px', border: `1px solid ${T.border}`, borderRadius: 6, fontSize: 12 }}>
        {NGFS3.map((s, i) => <option key={i} value={i}>{s} ({NGFS3_MULTS[i]}×)</option>)}
      </select>
      <select value={liquidityFilter} onChange={e => setLiquidityFilter(e.target.value)} style={{ padding: '6px 8px', border: `1px solid ${T.border}`, borderRadius: 6, fontSize: 12 }}>
        <option>All</option>{LIQUIDITY_OPTS.map(l => <option key={l}>{l}</option>)}
      </select>
      <label style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
        <input type="checkbox" checked={hedgedOnly} onChange={e => setHedgedOnly(e.target.checked)} /> Hedged Only
      </label>
      <label style={{ fontSize: 12 }}>Vintage ≥{vintageMin}
        <input type="range" min={2015} max={2023} value={vintageMin} onChange={e => setVintageMin(+e.target.value)} style={{ width: 70, marginLeft: 4 }} />
      </label>
    </div>
  );

  return (
    <div style={{ background: T.bg, minHeight: '100vh', padding: 24, fontFamily: 'DM Sans, sans-serif', color: T.text }}>
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 11, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.1em' }}>EP-DB5 · Sprint DB · Enterprise Climate Risk Capital</div>
        <h1 style={{ fontSize: 26, fontWeight: 700, margin: '4px 0 2px', color: T.navy }}>Enterprise Climate Risk Aggregator</h1>
        <div style={{ fontSize: 13, color: T.muted }}>120 exposures · 12 legal entities · 3 NGFS scenarios · TCFD readiness · Euler MRC attribution</div>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
        <KpiCard label="Total Exposure" value={`$${(totalExposure / 1000).toFixed(1)}B`} color={T.navy} sub={`${filtered.length} exposures`} />
        <KpiCard label="Portfolio CVaR" value={`$${(portfolioCVaR / 1000).toFixed(1)}B`} color={T.indigo} sub={`${NGFS3[scenario]} scenario`} />
        <KpiCard label="Diversif. Benefit" value={`${diversBenefit.toFixed(1)}%`} color={T.green} sub="vs standalone" />
        <KpiCard label="TCFD Readiness" value={`${tcfdScore.toFixed(0)}%`} color={tcfdScore > 60 ? T.green : tcfdScore > 40 ? T.amber : T.red} sub="15 items assessed" />
      </div>

      <div style={{ display: 'flex', gap: 0, borderBottom: `2px solid ${T.border}`, marginBottom: 24 }}>
        {TABS.map((t, i) => (
          <button key={i} onClick={() => setTab(i)} style={{ padding: '10px 16px', border: 'none', background: 'none', cursor: 'pointer', fontSize: 13, fontWeight: tab === i ? 700 : 400, color: tab === i ? T.indigo : T.muted, borderBottom: tab === i ? `2px solid ${T.indigo}` : '2px solid transparent', marginBottom: -2, whiteSpace: 'nowrap' }}>{t}</button>
        ))}
      </div>

      {tab === 0 && (
        <div>
          {filterRow}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
              <div style={{ fontWeight: 600, marginBottom: 12 }}>Exposure by Legal Entity ($B)</div>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={entityBarData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="entity" tick={{ fontSize: 10 }} angle={-20} textAnchor="end" height={40} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip formatter={v => `$${Number(v).toFixed(1)}B`} />
                  <Legend />
                  <Bar dataKey="totalExp" fill={T.indigo} name="Total Exposure ($B)" radius={[2,2,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
              <div style={{ fontWeight: 600, marginBottom: 12 }}>Physical vs Transition VaR by Entity — {NGFS3[scenario]}</div>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={entityBarData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="entity" tick={{ fontSize: 10 }} angle={-20} textAnchor="end" height={40} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip formatter={v => `$${Number(v).toFixed(0)}M`} />
                  <Legend />
                  <Bar dataKey="physVaR" stackId="a" fill={T.orange} name="Physical VaR ($M)" />
                  <Bar dataKey="transVaR" stackId="a" fill={T.blue} name="Transition VaR ($M)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
            {NGFS3.map((s, si) => {
              const sVaR = filtered.length ? Math.sqrt(filtered.reduce((acc, x) => acc + (x.climateVaR95 * NGFS3_MULTS[si]) ** 2, 0)) * 0.75 : 0;
              return (
                <div key={si} onClick={() => setScenario(si)} style={{ padding: '12px 16px', background: si === scenario ? '#eef2ff' : T.card, border: `2px solid ${si === scenario ? T.indigo : T.border}`, borderRadius: 8, cursor: 'pointer', textAlign: 'center' }}>
                  <div style={{ fontWeight: 600, color: si === scenario ? T.indigo : T.text }}>{s}</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: [T.green, T.amber, T.red][si], marginTop: 4 }}>${(sVaR / 1000).toFixed(1)}B</div>
                  <div style={{ fontSize: 11, color: T.muted }}>Portfolio CVaR</div>
                  <div style={{ fontSize: 11, color: T.muted }}>×{NGFS3_MULTS[si]} multiplier</div>
                </div>
              );
            })}
            <div style={{ padding: '12px 16px', background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, textAlign: 'center' }}>
              <div style={{ fontWeight: 600 }}>Diversification</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: T.green, marginTop: 4 }}>{diversBenefit.toFixed(1)}%</div>
              <div style={{ fontSize: 11, color: T.muted }}>vs standalone sum</div>
              <div style={{ fontSize: 11, color: T.muted }}>${(standaloneSum / 1000).toFixed(1)}B standalone</div>
            </div>
          </div>
        </div>
      )}

      {tab === 1 && (
        <div>
          {filterRow}
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, overflow: 'auto', maxHeight: 580 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
              <thead style={{ position: 'sticky', top: 0 }}>
                <tr style={{ background: T.sub }}>
                  {[['Entity','entityName'],['BizLine','businessLine'],['Asset Class','assetClass'],['Geography','geography'],['Exposure($M)','exposureMN'],['PhysRisk','physRisk'],['TransRisk','transRisk'],['CVaR95($M)','climateVaR95'],['Conc','concentrationScore'],['Liquidity','liquidity'],['Hedged','hedged'],['Hedge Cost(bps)','hedgeCostBps'],['Vintage','vintage'],['CCY','currency']].map(([h,k]) => (
                    <th key={k} onClick={() => handleSort(k)} style={{ padding: '7px 8px', textAlign: 'left', fontWeight: 600, fontSize: 10, color: sortCol === k ? T.indigo : T.muted, borderBottom: `1px solid ${T.border}`, cursor: 'pointer', whiteSpace: 'nowrap' }}>{h}{sortCol === k ? (sortDir > 0 ? ' ↑' : ' ↓') : ''}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((x, i) => (
                  <tr key={x.id} onClick={() => setSelectedId(x.id)} style={{ background: x.id === selectedId ? '#eef2ff' : i % 2 === 0 ? T.card : T.sub, cursor: 'pointer', borderBottom: `1px solid ${T.border}` }}>
                    <td style={{ padding: '5px 8px', fontWeight: 500 }}>{x.entityName}</td>
                    <td style={{ padding: '5px 8px', color: T.muted, fontSize: 10 }}>{x.businessLine.split(' ')[0]}</td>
                    <td style={{ padding: '5px 8px', color: T.muted }}>{x.assetClass}</td>
                    <td style={{ padding: '5px 8px' }}>{x.geography}</td>
                    <td style={{ padding: '5px 8px', fontWeight: 600 }}>{x.exposureMN.toFixed(0)}</td>
                    <td style={{ padding: '5px 8px', color: x.physRisk > 60 ? T.red : T.text }}>{x.physRisk.toFixed(1)}</td>
                    <td style={{ padding: '5px 8px', color: x.transRisk > 60 ? T.red : T.text }}>{x.transRisk.toFixed(1)}</td>
                    <td style={{ padding: '5px 8px', color: T.indigo }}>{(x.climateVaR95 * scenMult).toFixed(0)}</td>
                    <td style={{ padding: '5px 8px', color: x.concentrationScore > 60 ? T.amber : T.muted }}>{x.concentrationScore.toFixed(0)}</td>
                    <td style={{ padding: '5px 8px', color: x.liquidity === 'Low' ? T.red : x.liquidity === 'High' ? T.green : T.amber }}>{x.liquidity}</td>
                    <td style={{ padding: '5px 8px', color: x.hedged ? T.green : T.muted }}>{x.hedged ? 'Yes' : 'No'}</td>
                    <td style={{ padding: '5px 8px', color: T.muted }}>{x.hedged ? x.hedgeCostBps.toFixed(0) : '—'}</td>
                    <td style={{ padding: '5px 8px' }}>{x.vintage}</td>
                    <td style={{ padding: '5px 8px', color: T.muted }}>{x.currency}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ marginTop: 8, fontSize: 12, color: T.muted }}>{filtered.length} exposures · Total: ${(totalExposure/1000).toFixed(1)}B · Click to inspect</div>
          {selectedExposure && (
            <div style={{ marginTop: 12, background: T.card, border: `2px solid ${T.indigo}`, borderRadius: 8, padding: 16 }}>
              <div style={{ fontWeight: 600, marginBottom: 10, color: T.indigo }}>Drill-Down: {selectedExposure.entityName} — {selectedExposure.assetClass}</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10 }}>
                {[['Exposure', `$${selectedExposure.exposureMN.toFixed(0)}M`], ['Physical Risk', `${selectedExposure.physRisk.toFixed(1)}`], ['Transition Risk', `${selectedExposure.transRisk.toFixed(1)}`], ['Climate VaR95', `$${(selectedExposure.climateVaR95 * scenMult).toFixed(0)}M`], ['Concentration', `${selectedExposure.concentrationScore.toFixed(0)}`], ['Liquidity', selectedExposure.liquidity], ['Hedged', selectedExposure.hedged ? `Yes (${selectedExposure.hedgeCostBps.toFixed(0)}bps)` : 'No'], ['Expected Return', `${(selectedExposure.expectedReturnPct * 100).toFixed(1)}%`]].map(([l, v]) => (
                  <div key={l} style={{ padding: '8px 12px', background: T.sub, borderRadius: 6 }}>
                    <div style={{ fontSize: 10, color: T.muted }}>{l}</div>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>{v}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 2 && (
        <div>
          {filterRow}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
              <div style={{ fontWeight: 600, marginBottom: 12 }}>Stacked VaR by Legal Entity — {NGFS3[scenario]} ($M)</div>
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={entityBarData.filter(x => x.physVaR > 0 || x.transVaR > 0)} margin={{ bottom: 30 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="entity" tick={{ fontSize: 10 }} angle={-20} textAnchor="end" height={45} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip formatter={v => `$${Number(v).toFixed(0)}M`} />
                  <Legend />
                  <Bar dataKey="physVaR" stackId="a" fill={T.orange} name="Physical VaR ($M)" />
                  <Bar dataKey="transVaR" stackId="a" fill={T.indigo} name="Transition VaR ($M)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
              <div style={{ fontWeight: 600, marginBottom: 12 }}>Marginal Risk Contribution (MRC) by Entity</div>
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={mrcData} layout="vertical" margin={{ left: 80, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={v => `${Number(v).toFixed(2)}%`} />
                  <YAxis type="category" dataKey="entity" tick={{ fontSize: 11 }} width={80} />
                  <Tooltip formatter={v => `${Number(v).toFixed(3)}%`} />
                  <Bar dataKey="mrc" fill={T.blue} name="MRC%" radius={[0,2,2,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div style={{ marginTop: 20, background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
            <div style={{ fontWeight: 600, marginBottom: 12 }}>Scenario Stress — Portfolio CVaR by Scenario ($B)</div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={scenarioImpacts}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="entity" tick={{ fontSize: 10 }} angle={-20} textAnchor="end" height={40} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip formatter={v => `$${Number(v).toFixed(2)}B`} />
                <Legend />
                <Bar dataKey="orderly" fill={T.green} name="Orderly ($B)" radius={[2,2,0,0]} />
                <Bar dataKey="disorderly" fill={T.amber} name="Disorderly ($B)" radius={[2,2,0,0]} />
                <Bar dataKey="hotHouse" fill={T.red} name="Hot House ($B)" radius={[2,2,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {tab === 3 && (
        <div>
          {filterRow}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
              <div style={{ fontWeight: 600, marginBottom: 12 }}>HHI Concentration by Legal Entity</div>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={hhi} layout="vertical" margin={{ left: 80, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis type="number" tick={{ fontSize: 10 }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={80} />
                  <Tooltip formatter={v => `HHI: ${Number(v).toFixed(0)}`} />
                  <Bar dataKey="hhi" fill={T.indigo} name="HHI" radius={[0,2,2,0]} />
                  <ReferenceLine x={1000} stroke={T.amber} strokeDasharray="4 2" label={{ value: 'Moderate', fontSize: 10, fill: T.amber }} />
                  <ReferenceLine x={2500} stroke={T.red} strokeDasharray="4 2" label={{ value: 'High', fontSize: 10, fill: T.red }} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
              <div style={{ fontWeight: 600, marginBottom: 12 }}>Portfolio HHI Summary</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 12 }}>
                <div style={{ padding: '12px 16px', background: totalHHI > 2500 ? '#fef2f2' : totalHHI > 1000 ? '#fffbeb' : '#f0fdf4', borderRadius: 8 }}>
                  <div style={{ fontSize: 11, color: T.muted }}>TOTAL PORTFOLIO HHI</div>
                  <div style={{ fontSize: 28, fontWeight: 700, color: totalHHI > 2500 ? T.red : totalHHI > 1000 ? T.amber : T.green }}>{totalHHI.toFixed(0)}</div>
                  <div style={{ fontSize: 12, color: T.muted }}>{totalHHI > 2500 ? 'Highly Concentrated' : totalHHI > 1000 ? 'Moderately Concentrated' : 'Diversified'}</div>
                </div>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: T.sub }}>{['Entity','Exposure($B)','HHI','Share%','Risk Level'].map(h => <th key={h} style={{ padding: '6px 8px', textAlign: 'left', color: T.muted, fontWeight: 600, borderBottom: `1px solid ${T.border}` }}>{h}</th>)}</tr>
                </thead>
                <tbody>
                  {[...hhi].sort((a, b) => b.hhi - a.hhi).map((h, i) => {
                    const share = totalExposure > 0 ? h.exposure / totalExposure * 100 : 0;
                    return (
                      <tr key={i} style={{ background: i % 2 === 0 ? T.card : T.sub }}>
                        <td style={{ padding: '5px 8px', fontWeight: 500 }}>{h.name}</td>
                        <td style={{ padding: '5px 8px' }}>${(h.exposure / 1000).toFixed(1)}B</td>
                        <td style={{ padding: '5px 8px', fontWeight: 600 }}>{h.hhi}</td>
                        <td style={{ padding: '5px 8px' }}>{share.toFixed(1)}%</td>
                        <td style={{ padding: '5px 8px' }}><span style={{ background: h.hhi > 500 ? '#fef2f2' : '#f0fdf4', color: h.hhi > 500 ? T.red : T.green, padding: '2px 6px', borderRadius: 4, fontSize: 10, fontWeight: 600 }}>{h.hhi > 500 ? 'HIGH' : 'OK'}</span></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {tab === 4 && (
        <div>
          {filterRow}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
              <div style={{ fontWeight: 600, marginBottom: 12 }}>Euler MRC by Entity — {NGFS3[scenario]}</div>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={mrcData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="entity" tick={{ fontSize: 9 }} angle={-20} textAnchor="end" height={40} />
                  <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `${v.toFixed(2)}%`} />
                  <Tooltip formatter={v => `${Number(v).toFixed(3)}%`} />
                  <Bar dataKey="mrc" fill={T.indigo} name="MRC%" radius={[2,2,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
              <div style={{ fontWeight: 600, marginBottom: 12 }}>Risk-Adjusted Return by Entity</div>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={mrcData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="entity" tick={{ fontSize: 9 }} angle={-20} textAnchor="end" height={40} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip formatter={v => Number(v).toFixed(4)} />
                  <Bar dataKey="riskAdjReturn" fill={T.green} name="Risk-Adj Return" radius={[2,2,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div style={{ marginTop: 20, background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
            <div style={{ fontWeight: 600, marginBottom: 12 }}>Hedging Analysis — Hedged vs Unhedged Exposures</div>
            {(() => {
              const hedgedExp = filtered.filter(x => x.hedged);
              const unhedgedExp = filtered.filter(x => !x.hedged);
              const hedgedVaR = hedgedExp.reduce((s, x) => s + x.climateVaR95 * scenMult, 0);
              const unhedgedVaR = unhedgedExp.reduce((s, x) => s + x.climateVaR95 * scenMult, 0);
              return (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                  <div style={{ padding: '12px 16px', background: '#f0fdf4', borderRadius: 8 }}>
                    <div style={{ fontSize: 11, color: T.muted }}>HEDGED EXPOSURES</div>
                    <div style={{ fontSize: 20, fontWeight: 700, color: T.green }}>{hedgedExp.length}</div>
                    <div style={{ fontSize: 12, color: T.muted }}>VaR: ${(hedgedVaR/1000).toFixed(2)}B</div>
                    <div style={{ fontSize: 12, color: T.muted }}>Avg hedge cost: {hedgedExp.length ? (hedgedExp.reduce((s,x) => s + x.hedgeCostBps, 0) / hedgedExp.length).toFixed(0) : 0} bps</div>
                  </div>
                  <div style={{ padding: '12px 16px', background: '#fef2f2', borderRadius: 8 }}>
                    <div style={{ fontSize: 11, color: T.muted }}>UNHEDGED EXPOSURES</div>
                    <div style={{ fontSize: 20, fontWeight: 700, color: T.red }}>{unhedgedExp.length}</div>
                    <div style={{ fontSize: 12, color: T.muted }}>VaR: ${(unhedgedVaR/1000).toFixed(2)}B</div>
                    <div style={{ fontSize: 12, color: T.muted }}>No hedge protection</div>
                  </div>
                  <div style={{ padding: '12px 16px', background: T.sub, borderRadius: 8 }}>
                    <div style={{ fontSize: 11, color: T.muted }}>HEDGE EFFECTIVENESS</div>
                    <div style={{ fontSize: 20, fontWeight: 700, color: T.amber }}>{totalExposure > 0 ? (hedgedExp.reduce((s,x) => s+x.exposureMN,0)/totalExposure*100).toFixed(1) : 0}%</div>
                    <div style={{ fontSize: 12, color: T.muted }}>of portfolio hedged</div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {tab === 5 && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
              <div style={{ fontWeight: 600, marginBottom: 8 }}>TCFD Disclosure Readiness — {tcfdScore.toFixed(0)}%</div>
              <div style={{ marginBottom: 12, padding: '8px 12px', background: tcfdScore > 60 ? '#f0fdf4' : tcfdScore > 40 ? '#fffbeb' : '#fef2f2', borderRadius: 6 }}>
                <span style={{ fontWeight: 700, color: tcfdScore > 60 ? T.green : tcfdScore > 40 ? T.amber : T.red }}>{tcfdScore > 60 ? 'Advanced' : tcfdScore > 40 ? 'Developing' : 'Early Stage'}</span> disclosure maturity
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: T.sub }}>{['#','Domain','Item','Status','Score'].map(h => <th key={h} style={{ padding: '6px 8px', textAlign: 'left', color: T.muted, fontWeight: 600, borderBottom: `1px solid ${T.border}` }}>{h}</th>)}</tr>
                </thead>
                <tbody>
                  {TCFD_STATUS.map((item, i) => (
                    <tr key={i} style={{ background: i % 2 === 0 ? T.card : T.sub }}>
                      <td style={{ padding: '5px 8px', color: T.muted }}>{i + 1}</td>
                      <td style={{ padding: '5px 8px', fontWeight: 600, color: T.indigo, fontSize: 11 }}>{item.domain}</td>
                      <td style={{ padding: '5px 8px' }}>{item.item}</td>
                      <td style={{ padding: '5px 8px' }}><span style={{ background: item.status === 'Complete' ? '#f0fdf4' : item.status === 'Partial' ? '#fffbeb' : '#fef2f2', color: item.status === 'Complete' ? T.green : item.status === 'Partial' ? T.amber : T.red, padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600 }}>{item.status}</span></td>
                      <td style={{ padding: '5px 8px', fontWeight: 600 }}>{item.score}/2</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
                <div style={{ fontWeight: 600, marginBottom: 12 }}>Scenario Climate Impacts by Entity ($B)</div>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={scenarioImpacts.slice(0, 8)}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="entity" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip formatter={v => `$${Number(v).toFixed(2)}B`} />
                    <Legend />
                    <Bar dataKey="orderly" fill={T.green} name="Orderly" radius={[2,2,0,0]} />
                    <Bar dataKey="disorderly" fill={T.amber} name="Disorderly" radius={[2,2,0,0]} />
                    <Bar dataKey="hotHouse" fill={T.red} name="Hot House" radius={[2,2,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
                <div style={{ fontWeight: 600, marginBottom: 12 }}>Executive Summary Tiles</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {[['Total Enterprise Exposure', `$${(EXPOSURES.reduce((s,x)=>s+x.exposureMN,0)/1000).toFixed(0)}B`,'All 120 exposures'], ['Orderly CVaR', `$${(Math.sqrt(EXPOSURES.reduce((s,x)=>s+(x.climateVaR95*1.0)**2,0))*0.75/1000).toFixed(1)}B`,'1.0× multiplier'], ['Disorderly CVaR', `$${(Math.sqrt(EXPOSURES.reduce((s,x)=>s+(x.climateVaR95*1.4)**2,0))*0.75/1000).toFixed(1)}B`,'1.4× multiplier'], ['Hot House CVaR', `$${(Math.sqrt(EXPOSURES.reduce((s,x)=>s+(x.climateVaR95*2.1)**2,0))*0.75/1000).toFixed(1)}B`,'2.1× multiplier']].map(([l, v, s]) => (
                    <div key={l} style={{ padding: '10px 12px', background: T.sub, borderRadius: 8 }}>
                      <div style={{ fontSize: 10, color: T.muted }}>{l}</div>
                      <div style={{ fontSize: 18, fontWeight: 700 }}>{v}</div>
                      <div style={{ fontSize: 10, color: T.muted }}>{s}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === 6 && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginBottom: 20 }}>
            <KpiCard label="Total Exposure" value={`$${(totalExposure/1000).toFixed(1)}B`} color={T.navy} sub={`${filtered.length} exposures`} />
            <KpiCard label="Portfolio CVaR" value={`$${(portfolioCVaR/1000).toFixed(1)}B`} color={T.indigo} sub={NGFS3[scenario]} />
            <KpiCard label="Diversification Benefit" value={`${diversBenefit.toFixed(1)}%`} color={T.green} />
            <KpiCard label="TCFD Score" value={`${tcfdScore.toFixed(0)}%`} color={tcfdScore > 60 ? T.green : T.amber} />
            <KpiCard label="Hedged Exposures" value={`${filtered.filter(x=>x.hedged).length}/${filtered.length}`} color={T.teal} />
            <KpiCard label="Total HHI" value={`${totalHHI.toFixed(0)}`} color={totalHHI > 2500 ? T.red : T.green} sub="concentration" />
          </div>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
            <div style={{ fontWeight: 600, marginBottom: 12 }}>Full Exposure Export — {filtered.length} records</div>
            <div style={{ overflowX: 'auto', maxHeight: 500 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 10 }}>
                <thead style={{ position: 'sticky', top: 0 }}>
                  <tr style={{ background: T.sub }}>
                    {['Entity','BizLine','Asset','Geo','Sector','Exposure($M)','PhysRisk','TransRisk','CVaR95($M)','ScenCVaR($M)','Conc','Liquidity','Hedged','HedgeCost(bps)','Vintage','CCY','ExpReturn%'].map(h => (
                      <th key={h} style={{ padding: '5px 7px', textAlign: 'left', color: T.muted, fontWeight: 600, borderBottom: `1px solid ${T.border}`, whiteSpace: 'nowrap', fontSize: 9 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((x, i) => (
                    <tr key={x.id} style={{ background: i % 2 === 0 ? T.card : T.sub }}>
                      <td style={{ padding: '4px 7px', fontWeight: 500 }}>{x.entityName}</td>
                      <td style={{ padding: '4px 7px', color: T.muted }}>{x.businessLine.split(' ')[0]}</td>
                      <td style={{ padding: '4px 7px' }}>{x.assetClass.split(' ')[0]}</td>
                      <td style={{ padding: '4px 7px' }}>{x.geography}</td>
                      <td style={{ padding: '4px 7px', color: T.muted }}>{x.sector}</td>
                      <td style={{ padding: '4px 7px', fontWeight: 600 }}>{x.exposureMN.toFixed(0)}</td>
                      <td style={{ padding: '4px 7px', color: x.physRisk > 60 ? T.red : T.text }}>{x.physRisk.toFixed(1)}</td>
                      <td style={{ padding: '4px 7px', color: x.transRisk > 60 ? T.red : T.text }}>{x.transRisk.toFixed(1)}</td>
                      <td style={{ padding: '4px 7px' }}>{x.climateVaR95.toFixed(0)}</td>
                      <td style={{ padding: '4px 7px', color: T.indigo, fontWeight: 600 }}>{(x.climateVaR95 * scenMult).toFixed(0)}</td>
                      <td style={{ padding: '4px 7px' }}>{x.concentrationScore.toFixed(0)}</td>
                      <td style={{ padding: '4px 7px', color: x.liquidity === 'Low' ? T.red : x.liquidity === 'High' ? T.green : T.amber }}>{x.liquidity}</td>
                      <td style={{ padding: '4px 7px', color: x.hedged ? T.green : T.muted }}>{x.hedged ? 'Y' : 'N'}</td>
                      <td style={{ padding: '4px 7px', color: T.muted }}>{x.hedged ? x.hedgeCostBps.toFixed(0) : '—'}</td>
                      <td style={{ padding: '4px 7px' }}>{x.vintage}</td>
                      <td style={{ padding: '4px 7px', color: T.muted }}>{x.currency}</td>
                      <td style={{ padding: '4px 7px' }}>{(x.expectedReturnPct * 100).toFixed(1)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div style={{ marginTop: 20, background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
            <div style={{ fontWeight: 600, marginBottom: 12 }}>Enterprise Risk Analytics — Cross-Entity Breakdown</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 16 }}>
              {[
                ['Total Filtered Exposure', `$${(totalExposure/1000).toFixed(1)}B`, T.navy],
                ['Avg Physical Risk', `${filtered.length?(filtered.reduce((s,x)=>s+x.physRisk,0)/filtered.length).toFixed(1):0}`, T.orange],
                ['Avg Transition Risk', `${filtered.length?(filtered.reduce((s,x)=>s+x.transRisk,0)/filtered.length).toFixed(1):0}`, T.blue],
                ['Avg CVaR95', `$${filtered.length?(filtered.reduce((s,x)=>s+x.climateVaR95,0)/filtered.length/1000).toFixed(2):0}B`, T.red],
              ].map(([l,v,c])=>(
                <div key={l} style={{ padding:'10px 14px',background:T.sub,borderRadius:8 }}>
                  <div style={{ fontSize:10,color:T.muted }}>{l}</div>
                  <div style={{ fontSize:18,fontWeight:700,color:c }}>{v}</div>
                </div>
              ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <div style={{ fontWeight:600,fontSize:13,marginBottom:8 }}>Risk Profile by Asset Class</div>
                <table style={{ width:'100%',borderCollapse:'collapse',fontSize:12 }}>
                  <thead><tr style={{ background:T.sub }}>{['Asset Class','Count','Avg Exp($M)','Avg CVaR95($M)','CVaR/Exp%','Hedged%'].map(h=><th key={h} style={{ padding:'5px 8px',textAlign:'left',color:T.muted,fontWeight:600,borderBottom:`1px solid ${T.border}` }}>{h}</th>)}</tr></thead>
                  <tbody>
                    {ASSET_CLASSES.map((ac,ai)=>{
                      const sub=filtered.filter(x=>x.assetClass===ac);
                      if(!sub.length) return null;
                      const avgExp=sub.reduce((s,x)=>s+x.exposureMN,0)/sub.length;
                      const avgCVaR=sub.reduce((s,x)=>s+x.climateVaR95*scenMult,0)/sub.length;
                      const ratio=avgExp>0?avgCVaR/avgExp*100:0;
                      const hedgedPct=sub.filter(x=>x.hedged).length/sub.length*100;
                      return (
                        <tr key={ai} style={{ background:ai%2===0?T.card:T.sub }}>
                          <td style={{ padding:'5px 8px',fontWeight:500 }}>{ac}</td>
                          <td style={{ padding:'5px 8px' }}>{sub.length}</td>
                          <td style={{ padding:'5px 8px' }}>{avgExp.toFixed(0)}</td>
                          <td style={{ padding:'5px 8px',color:T.indigo,fontWeight:600 }}>{avgCVaR.toFixed(0)}</td>
                          <td style={{ padding:'5px 8px',color:ratio>15?T.red:T.text }}>{ratio.toFixed(1)}%</td>
                          <td style={{ padding:'5px 8px',color:hedgedPct>60?T.green:T.amber }}>{hedgedPct.toFixed(0)}%</td>
                        </tr>
                      );
                    }).filter(Boolean)}
                  </tbody>
                </table>
              </div>
              <div>
                <div style={{ fontWeight:600,fontSize:13,marginBottom:8 }}>Business Line Risk Summary</div>
                <table style={{ width:'100%',borderCollapse:'collapse',fontSize:12 }}>
                  <thead><tr style={{ background:T.sub }}>{['Business Line','Count','Total Exp($B)','Total CVaR($M)','Avg RiskAdj Ret','Low Liquidity%'].map(h=><th key={h} style={{ padding:'5px 8px',textAlign:'left',color:T.muted,fontWeight:600,borderBottom:`1px solid ${T.border}` }}>{h}</th>)}</tr></thead>
                  <tbody>
                    {BUSINESS_LINES.map((bl,bi)=>{
                      const sub=filtered.filter(x=>x.businessLine===bl);
                      if(!sub.length) return null;
                      const totalExp=sub.reduce((s,x)=>s+x.exposureMN,0)/1000;
                      const totalCVaR=sub.reduce((s,x)=>s+x.climateVaR95*scenMult,0);
                      const avgRAR=totalCVaR>0?sub.reduce((s,x)=>s+x.exposureMN*x.expectedReturnPct,0)/totalCVaR:0;
                      const lowLiqPct=sub.filter(x=>x.liquidity==='Low').length/sub.length*100;
                      return (
                        <tr key={bi} style={{ background:bi%2===0?T.card:T.sub }}>
                          <td style={{ padding:'5px 8px',fontWeight:500 }}>{bl.split(' ')[0]}</td>
                          <td style={{ padding:'5px 8px' }}>{sub.length}</td>
                          <td style={{ padding:'5px 8px' }}>${totalExp.toFixed(1)}B</td>
                          <td style={{ padding:'5px 8px',color:T.indigo,fontWeight:600 }}>{totalCVaR.toFixed(0)}</td>
                          <td style={{ padding:'5px 8px',color:avgRAR>0.05?T.green:T.muted }}>{avgRAR.toFixed(4)}</td>
                          <td style={{ padding:'5px 8px',color:lowLiqPct>30?T.red:T.muted }}>{lowLiqPct.toFixed(0)}%</td>
                        </tr>
                      );
                    }).filter(Boolean)}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          <div style={{ marginTop: 16, background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
            <div style={{ fontWeight: 600, marginBottom: 12 }}>CVaR Scenario Comparison — All 3 NGFS Scenarios × Legal Entity ($B)</div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={LEGAL_ENTITIES.map(e=>{
                const sub=filtered.filter(x=>x.entityName===e);
                if(!sub.length) return null;
                return {
                  entity:e.split(' ')[0],
                  orderly:+(sub.reduce((s,x)=>s+x.climateVaR95,0)/1000).toFixed(2),
                  disorderly:+(sub.reduce((s,x)=>s+x.climateVaR95*1.4,0)/1000).toFixed(2),
                  hotHouse:+(sub.reduce((s,x)=>s+x.climateVaR95*2.1,0)/1000).toFixed(2),
                };
              }).filter(Boolean)}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="entity" tick={{ fontSize:10 }} />
                <YAxis tick={{ fontSize:10 }} />
                <Tooltip formatter={v=>`$${Number(v).toFixed(2)}B`} />
                <Legend />
                <Bar dataKey="orderly" fill={T.green} name="Orderly" radius={[2,2,0,0]} />
                <Bar dataKey="disorderly" fill={T.amber} name="Disorderly" radius={[2,2,0,0]} />
                <Bar dataKey="hotHouse" fill={T.red} name="Hot House" radius={[2,2,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* ── Additional: Portfolio Attribution Detail ── */}
      {activeTab === 'attr' && (
        <div style={{ display:'flex',flexDirection:'column',gap:16,marginTop:16 }}>
          <div style={{ background:T.card,border:`1px solid ${T.border}`,borderRadius:8,padding:16 }}>
            <div style={{ fontWeight:700,fontSize:14,marginBottom:12 }}>Legal Entity × Asset Class Risk Matrix (CVaR $B)</div>
            <div style={{ overflowX:'auto' }}>
              <table style={{ width:'100%',borderCollapse:'collapse',fontSize:11 }}>
                <thead>
                  <tr style={{ background:T.sub }}>
                    <th style={{ padding:'5px 8px',textAlign:'left',color:T.muted }}>Legal Entity</th>
                    {ASSET_CLASSES.slice(0,6).map(ac=>(
                      <th key={ac} style={{ padding:'5px 6px',textAlign:'right',color:T.muted,fontSize:10 }}>{ac.substring(0,8)}</th>
                    ))}
                    <th style={{ padding:'5px 6px',textAlign:'right',color:T.muted,fontWeight:700 }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {LEGAL_ENTITIES.map((entity,ei)=>{
                    const sub=filtered.filter(x=>x.legalEntity===entity);
                    if(!sub.length) return null;
                    const acTotals=ASSET_CLASSES.slice(0,6).map(ac=>{
                      const acSub=sub.filter(x=>x.assetClass===ac);
                      return acSub.length?acSub.reduce((s,x)=>s+x.climateVaR95,0)/1e9:0;
                    });
                    const total=acTotals.reduce((a,b)=>a+b,0);
                    return (
                      <tr key={entity} style={{ background:ei%2===0?T.card:T.sub }}>
                        <td style={{ padding:'4px 8px',fontWeight:600,fontSize:10 }}>{entity.split(' ').slice(0,2).join(' ')}</td>
                        {acTotals.map((v,vi)=>(
                          <td key={vi} style={{ padding:'4px 6px',textAlign:'right',color:v>1?T.red:v>0.5?T.amber:T.text,fontSize:10 }}>{v.toFixed(2)}</td>
                        ))}
                        <td style={{ padding:'4px 6px',textAlign:'right',fontWeight:700,color:total>4?T.red:T.text,fontSize:10 }}>{total.toFixed(2)}</td>
                      </tr>
                    );
                  }).filter(Boolean)}
                </tbody>
              </table>
            </div>
          </div>

          <div style={{ background:T.card,border:`1px solid ${T.border}`,borderRadius:8,padding:16 }}>
            <div style={{ fontWeight:700,fontSize:14,marginBottom:12 }}>Climate VaR Term Structure — Physical vs Transition by Asset Class</div>
            <ResponsiveContainer width="100%" height={200}>
              <ComposedChart data={ASSET_CLASSES.map(ac=>{
                const sub=filtered.filter(x=>x.assetClass===ac);
                const avgPhys=sub.length?sub.reduce((s,x)=>s+x.physicalRisk,0)/sub.length:0;
                const avgTrans=sub.length?sub.reduce((s,x)=>s+x.transitionRisk,0)/sub.length:0;
                return { ac:ac.substring(0,10), phys:+(avgPhys/1e6).toFixed(2), trans:+(avgTrans/1e6).toFixed(2) };
              })}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="ac" tick={{ fontSize:9 }} />
                <YAxis tick={{ fontSize:10 }} />
                <Tooltip formatter={v=>`$${Number(v).toFixed(2)}M`} />
                <Legend />
                <Bar dataKey="phys" fill={T.orange} name="Physical Risk ($M)" radius={[2,2,0,0]} />
                <Bar dataKey="trans" fill={T.indigo} name="Transition Risk ($M)" radius={[2,2,0,0]} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          <div style={{ background:T.card,border:`1px solid ${T.border}`,borderRadius:8,padding:16 }}>
            <div style={{ fontWeight:700,fontSize:14,marginBottom:12 }}>TCFD Pillar Readiness Radar</div>
            <div style={{ display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10 }}>
              {[
                { pillar:'Governance', items:['Board Oversight','Management Roles','Climate Committees','Training Programs'] },
                { pillar:'Strategy', items:['Risk Identification','Business Impact','Resilience Analysis','Opportunity Assessment'] },
                { pillar:'Risk Mgmt', items:['Risk Integration','Process Documentation','Scenario Analysis','Third-party Risk'] },
                { pillar:'Metrics', items:['Scope 1/2 GHG','Scope 3 GHG','Climate Targets','TCFD Disclosure'] },
              ].map(({ pillar, items })=>{
                const scores=items.map((_,i)=>[2,1,2,0,2,1,2,1][i%8]);
                const avg=scores.length?scores.reduce((a,b)=>a+b,0)/scores.length/2*100:0;
                return (
                  <div key={pillar} style={{ background:T.sub,borderRadius:8,padding:12 }}>
                    <div style={{ fontWeight:700,fontSize:12,marginBottom:8,color:T.text }}>{pillar}</div>
                    {items.map((item,ii)=>{
                      const s=scores[ii];
                      return (
                        <div key={item} style={{ display:'flex',justifyContent:'space-between',marginBottom:4 }}>
                          <span style={{ fontSize:10,color:T.muted }}>{item}</span>
                          <span style={{ fontSize:10,fontWeight:600,color:s===2?T.green:s===1?T.amber:T.red }}>{['Not Started','Partial','Complete'][s]}</span>
                        </div>
                      );
                    })}
                    <div style={{ marginTop:8,paddingTop:8,borderTop:`1px solid ${T.border}`,fontSize:11,fontWeight:700,color:avg>60?T.green:avg>30?T.amber:T.red }}>
                      Readiness: {avg.toFixed(0)}%
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{ background:T.card,border:`1px solid ${T.border}`,borderRadius:8,padding:16 }}>
            <div style={{ fontWeight:700,fontSize:14,marginBottom:12 }}>Marginal Risk Contribution — Asset Class Decomposition</div>
            <ResponsiveContainer width="100%" height={190}>
              <ComposedChart data={ASSET_CLASSES.map(ac=>{
                const sub=filtered.filter(x=>x.assetClass===ac);
                const totalRisk=filtered.reduce((s,x)=>s+x.climateVaR95,0);
                const acRisk=sub.reduce((s,x)=>s+x.climateVaR95,0);
                const acWeight=filtered.reduce((s,x)=>s+x.exposureValue,0)>0?sub.reduce((s,x)=>s+x.exposureValue,0)/filtered.reduce((s,x)=>s+x.exposureValue,0):0;
                const mrc=totalRisk>0?acRisk/totalRisk*acWeight*100:0;
                return { ac:ac.substring(0,10), mrc:+mrc.toFixed(2), weight:+(acWeight*100).toFixed(1) };
              })}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="ac" tick={{ fontSize:9 }} />
                <YAxis yAxisId="left" tick={{ fontSize:10 }} tickFormatter={v=>`${v.toFixed(1)}%`} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize:10 }} tickFormatter={v=>`${v.toFixed(1)}%`} />
                <Tooltip formatter={v=>`${Number(v).toFixed(2)}%`} />
                <Legend />
                <Bar yAxisId="left" dataKey="mrc" fill={T.red} name="Marginal Risk Contr" radius={[2,2,0,0]} />
                <Line yAxisId="right" type="monotone" dataKey="weight" stroke={T.blue} strokeWidth={2} dot={{ r:3 }} name="Portfolio Weight%" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          <div style={{ background:T.card,border:`1px solid ${T.border}`,borderRadius:8,padding:16 }}>
            <div style={{ fontWeight:700,fontSize:14,marginBottom:12 }}>Scenario Impact on Portfolio VaR — Decomposition</div>
            <div style={{ display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10 }}>
              {[
                { label:'Orderly 1.5°C', mult:1.0, color:T.green },
                { label:'Disorderly 2°C', mult:1.4, color:T.amber },
                { label:'Hot House 4°C+', mult:2.1, color:T.red },
              ].map(({ label, mult, color })=>{
                const totalVaR=filtered.reduce((s,x)=>s+x.climateVaR95*mult,0)/1e9;
                const physVaR=filtered.reduce((s,x)=>s+x.physicalRisk*mult,0)/1e9;
                const transVaR=filtered.reduce((s,x)=>s+x.transitionRisk*mult,0)/1e9;
                const portCVaR=filtered.length?Math.sqrt(filtered.reduce((s,x)=>s+(x.climateVaR95*mult*x.exposureValue/filtered.reduce((ss,y)=>ss+y.exposureValue,0))**2,0))*0.75:0;
                return (
                  <div key={label} style={{ background:T.sub,borderRadius:8,padding:12 }}>
                    <div style={{ fontSize:12,fontWeight:700,color,marginBottom:8 }}>{label}</div>
                    <div style={{ display:'flex',justifyContent:'space-between',marginBottom:4 }}>
                      <span style={{ fontSize:10,color:T.muted }}>Total Climate VaR</span>
                      <span style={{ fontSize:11,fontWeight:700,color }}>${totalVaR.toFixed(2)}B</span>
                    </div>
                    <div style={{ display:'flex',justifyContent:'space-between',marginBottom:4 }}>
                      <span style={{ fontSize:10,color:T.muted }}>Physical Risk</span>
                      <span style={{ fontSize:11,color:T.orange }}>${physVaR.toFixed(2)}B</span>
                    </div>
                    <div style={{ display:'flex',justifyContent:'space-between',marginBottom:4 }}>
                      <span style={{ fontSize:10,color:T.muted }}>Transition Risk</span>
                      <span style={{ fontSize:11,color:T.indigo }}>${transVaR.toFixed(2)}B</span>
                    </div>
                    <div style={{ display:'flex',justifyContent:'space-between',marginTop:6,paddingTop:6,borderTop:`1px solid ${T.border}` }}>
                      <span style={{ fontSize:10,color:T.muted }}>Portfolio CVaR</span>
                      <span style={{ fontSize:11,fontWeight:700,color }}>${(portCVaR/1e6).toFixed(2)}M</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{ background:T.card,border:`1px solid ${T.border}`,borderRadius:8,padding:16 }}>
            <div style={{ fontWeight:700,fontSize:14,marginBottom:12 }}>Business Line Risk Attribution — Physical vs Transition</div>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={BUSINESS_LINES.map(bl=>{
                const sub=filtered.filter(x=>x.businessLine===bl);
                if(!sub.length) return null;
                const physTotal=sub.reduce((s,x)=>s+x.physicalRisk,0)/1e6;
                const transTotal=sub.reduce((s,x)=>s+x.transitionRisk,0)/1e6;
                return { bl:bl.substring(0,10), phys:+physTotal.toFixed(2), trans:+transTotal.toFixed(2) };
              }).filter(Boolean)}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="bl" tick={{ fontSize:9 }} />
                <YAxis tick={{ fontSize:10 }} tickFormatter={v=>`$${v}M`} />
                <Tooltip formatter={v=>`$${Number(v).toFixed(2)}M`} />
                <Legend />
                <Bar dataKey="phys" stackId="a" fill={T.orange} name="Physical ($M)" />
                <Bar dataKey="trans" stackId="a" fill={T.indigo} name="Transition ($M)" radius={[2,2,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div style={{ background:T.card,border:`1px solid ${T.border}`,borderRadius:8,padding:16 }}>
            <div style={{ fontWeight:700,fontSize:14,marginBottom:10 }}>Exposure Size Band Analysis — Count, VaR, and HHI</div>
            <div style={{ display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:8 }}>
              {['<$10M','$10–50M','$50–200M','$200M–1B','>$1B'].map((band,bi)=>{
                const [lo,hi]=[0,10e6,50e6,200e6,1e9,Infinity][bi];
                const hiVal=[10e6,50e6,200e6,1e9,Infinity][bi];
                const sub=filtered.filter(x=>x.exposureValue>=lo&&x.exposureValue<hiVal);
                const avgVaR=sub.length?sub.reduce((s,x)=>s+x.climateVaR95,0)/sub.length:0;
                const totalExp=sub.reduce((s,x)=>s+x.exposureValue,0);
                const portTotal=filtered.reduce((s,x)=>s+x.exposureValue,0);
                const share=portTotal>0?totalExp/portTotal:0;
                const hhi=share*share*10000;
                return (
                  <div key={band} style={{ background:T.sub,borderRadius:6,padding:10,textAlign:'center' }}>
                    <div style={{ fontSize:10,color:T.muted,marginBottom:4 }}>{band}</div>
                    <div style={{ fontSize:14,fontWeight:700,color:T.text }}>{sub.length}</div>
                    <div style={{ fontSize:10,color:T.muted }}>exposures</div>
                    <div style={{ fontSize:11,color:T.indigo,marginTop:4 }}>Avg VaR: ${(avgVaR/1e6).toFixed(1)}M</div>
                    <div style={{ fontSize:11,color:hhi>200?T.red:T.muted }}>HHI: {hhi.toFixed(0)}</div>
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
