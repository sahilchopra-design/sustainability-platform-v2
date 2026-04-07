import React, { useState, useMemo, useCallback } from 'react';
import {
  BarChart, Bar, ScatterChart, Scatter, LineChart, Line, RadarChart, Radar,
  PolarGrid, PolarAngleAxis, PolarRadiusAxis, ComposedChart,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine,
} from 'recharts';

const T = {
  bg: '#f8f6f0', card: '#ffffff', border: '#e2ded5', text: '#1a1a2e',
  sub: '#f6f4f0', muted: '#6b7280', indigo: '#4f46e5', gold: '#b8860b',
  green: '#16a34a', red: '#dc2626', blue: '#0369a1', amber: '#d97706',
  navy: '#1e3a5f', teal: '#0f766e', purple: '#7c3aed', orange: '#ea580c',
};
const sr = s => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };

const SECTORS = ['Energy','Financials','Utilities','Materials','Consumer','Industrials','Healthcare','Technology','Real Estate','Transportation'];
const RATINGS = ['AAA','AA','A','BBB','BB','B','CCC'];
const GEOGRAPHIES = ['US','EU','UK','Asia-Pac','EM','Japan','Canada','Australia'];
const ISSUER_TYPES = ['Corporate','Sovereign','Financial','Supranational','Municipal'];
const COVENANT_STRENGTHS = ['Strong','Moderate','Weak'];

const ISSUER_NAMES_BASE = [
  'Apple Inc','Microsoft Corp','Amazon Inc','Tesla Corp','ExxonMobil','BP PLC','Shell PLC','TotalEnergies',
  'BHP Group','Rio Tinto','Glencore PLC','Vale SA','AngloAmerican','Freeport-McMo','Alcoa Corp','Nucor Steel',
  'JPMorgan Chase','Bank America','Goldman Sachs','Morgan Stanley','Citigroup','Wells Fargo','HSBC Holdings','Barclays PLC',
  'Deutsche Bank','BNP Paribas','Société Gén','UniCredit','Santander','ING Group','ABN AMRO','Nordea Bank',
  'NextEra Energy','Duke Energy','Southern Co','Dominion Eng','Exelon Corp','PG&E Corp','Edison Intl','Entergy Corp',
  'Boeing Co','Airbus SE','Lockheed Mart','Raytheon','General Elec','Honeywell','3M Company','Caterpillar',
  'Walmart Inc','Amazon Retail','Target Corp','Costco Whlsl','CVS Health','UnitedHealth','Humana Inc','Cigna Corp',
  'Pfizer Inc','Johnson&Johnson','AbbVie Inc','Merck & Co','Bristol Myers','Eli Lilly','Amgen Inc','Gilead Sci',
  'US Treasury','Germany Bund','UK Gilt','France OAT','Japan JGB','Canada Bond','Australia CGS','Italy BTP',
  'Spain Bonos','Netherlands','Sweden Riksgld','Denmark DGB','Norway Norges','Finland Fin','Austria OGB','Belgium OLO',
  'IBRD Bond','EIB Bond','ADB Bond','AfDB Bond','IADB Bond','CDC Intl','KfW Dev Bank','EDF Finance',
  'Vonovia SE','Simon Property','Prologis Inc','Crown Castle','American Tower','SBA Comm','Welltower','Alexandria',
  'Delta Air Lines','United Airlines','Southwest Air','American Air','FedEx Corp','UPS Logistics','Maersk Group','MSC Ship',
  'Equinor ASA','Repsol SA','ENI SpA','Petrobras','YPF Argentina','Saudi Aramco','ADNOC Finance','Galp Energia',
  'Vestas Wind','Orsted A/S','Siemens Energy','Schneider Elec','Enel SpA','Iberdrola SA','RWE Group','E.ON SE',
  'Apple Green Bd','Volkswagen AG','BMW Group','Daimler Truck','Continental AG','BASF SE','Bayer AG','Covestro AG',
  'Alibaba Group','Tencent Hold','TSMC Finance','Samsung Elec','SK Hynix','LG Energy Sol','Posco Holdings','Hyundai Mtrs',
  'Macquarie Infr','BlackRock Fin','Vanguard Note','State St Corp','Fidelity Bond','Wellington Fin','T Rowe Note','Capital Grp',
  'Infrastructure Aus','DP World','Transurban','Brambles Ltd','Toll Holdings','Qantas Air','Auckland Intl','Sydney Airport',
  'Rusal Alumin','Norsk Hydro','Outokumpu Oy','Aperam SA','Acerinox SA','Tata Steel','JSW Steel','SAIL Bond',
  'Pembina Pipeln','Enbridge Inc','TC Energy','Keyera Corp','Inter Pipeline','Targa Res','Williams Cos','Kinder Morgan',
  'NiSource Inc','Atmos Energy','Sempra Energy','CenterPoint En','Spire Inc','ONE Gas Inc','Southwest Gas','Chesapeake Util',
];

const ISSUERS = ISSUER_NAMES_BASE.slice(0, 200).map((name, i) => {
  const sector = SECTORS[Math.floor(sr(i * 7) * SECTORS.length)];
  const rating = RATINGS[Math.floor(sr(i * 11) * RATINGS.length)];
  const geography = GEOGRAPHIES[Math.floor(sr(i * 13) * GEOGRAPHIES.length)];
  const issuerType = ISSUER_TYPES[Math.floor(sr(i * 17) * ISSUER_TYPES.length)];
  const maturity = 1 + Math.floor(sr(i * 19) * 29); // 1-30yr
  const totalSpread = 30 + sr(i * 23) * 470; // 30-500bps
  const physRiskScore = 5 + sr(i * 29) * 85;
  const transRiskScore = 5 + sr(i * 31) * 85;
  const physPremium = Math.max(0, totalSpread * (physRiskScore / 100) * (sr(i * 37) * 0.35 + 0.05));
  const transPremium = Math.max(0, totalSpread * (transRiskScore / 100) * (sr(i * 41) * 0.40 + 0.05));
  const residualPremium = Math.max(0, totalSpread - physPremium - transPremium);
  const basePD = 0.001 + sr(i * 43) * 0.08;
  const climatePD = basePD * (1 + transRiskScore / 100 * 0.5);
  const carbonBeta = (physRiskScore * 0.4 + transRiskScore * 0.6) / 100;
  const greenBondPremium = sr(i * 47) > 0.7 ? -(sr(i * 53) * 15) : 0; // greenium in bps
  const sectorBeta = 0.5 + sr(i * 59) * 1.5;
  const issuanceYear = 2015 + Math.floor(sr(i * 61) * 10);
  const callable = sr(i * 67) > 0.6;
  const covenantStrength = COVENANT_STRENGTHS[Math.floor(sr(i * 71) * 3)];
  return {
    id: i, name, sector, rating, geography, issuerType, maturity,
    totalSpread, physPremium, transPremium, residualPremium,
    physRiskScore, transRiskScore, climatePD, climateAdjSpread: totalSpread + carbonBeta * 10,
    greenBondPremium, sectorBeta, carbonBeta, issuanceYear, callable, covenantStrength,
    isGreen: greenBondPremium < 0,
  };
});

const CLIMATE_FACTORS = [
  { id: 0, name: 'Physical Acute',    color: T.orange },
  { id: 1, name: 'Physical Chronic',  color: T.amber  },
  { id: 2, name: 'Transition Policy', color: T.indigo },
  { id: 3, name: 'Transition Tech',   color: T.blue   },
];

const FACTOR_LOADINGS = SECTORS.map((sector, si) =>
  CLIMATE_FACTORS.map((f, fi) => ({
    sector, factor: f.name, loading: sr(si * 10 + fi * 3) * 1.2 - 0.3,
    factorReturn: sr(si * 10 + fi * 3 + 5) * 0.08 - 0.02,
    r2: 0.20 + sr(si * 10 + fi * 3 + 8) * 0.60,
  }))
).flat();

const KpiCard = ({ label, value, color = T.text, sub = '' }) => (
  <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: '14px 18px', flex: 1, minWidth: 150 }}>
    <div style={{ fontSize: 11, color: T.muted, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
    <div style={{ fontSize: 22, fontWeight: 700, color }}>{value}</div>
    {sub && <div style={{ fontSize: 11, color: T.muted, marginTop: 2 }}>{sub}</div>}
  </div>
);

const TABS = ['Spread Overview','Issuer Database','Sector Attribution','Factor Model','Rating Analysis','Portfolio Builder','Summary & Export'];

export default function ClimateRiskPremiumPage() {
  const [tab, setTab] = useState(0);
  const [sectorFilter, setSectorFilter] = useState('All');
  const [ratingFilter, setRatingFilter] = useState('All');
  const [geoFilter, setGeoFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');
  const [maturityMin, setMaturityMin] = useState(0);
  const [maturityMax, setMaturityMax] = useState(30);
  const [spreadMin, setSpreadMin] = useState(0);
  const [greenFilter, setGreenFilter] = useState(false);
  const [search, setSearch] = useState('');
  const [sortCol, setSortCol] = useState('totalSpread');
  const [sortDir, setSortDir] = useState(-1);
  const [selectedId, setSelectedId] = useState(null);
  const [compareId, setCompareId] = useState(null);
  const [portfolioIds, setPortfolioIds] = useState(new Set());
  const [factorWeights, setFactorWeights] = useState([0.25, 0.25, 0.25, 0.25]);

  const filtered = useMemo(() => {
    let d = ISSUERS;
    if (sectorFilter !== 'All') d = d.filter(x => x.sector === sectorFilter);
    if (ratingFilter !== 'All') d = d.filter(x => x.rating === ratingFilter);
    if (geoFilter !== 'All') d = d.filter(x => x.geography === geoFilter);
    if (typeFilter !== 'All') d = d.filter(x => x.issuerType === typeFilter);
    d = d.filter(x => x.maturity >= maturityMin && x.maturity <= maturityMax);
    d = d.filter(x => x.totalSpread >= spreadMin);
    if (greenFilter) d = d.filter(x => x.isGreen);
    if (search) d = d.filter(x => x.name.toLowerCase().includes(search.toLowerCase()) || x.sector.toLowerCase().includes(search.toLowerCase()));
    return [...d].sort((a, b) => sortDir * ((a[sortCol] || 0) - (b[sortCol] || 0)));
  }, [sectorFilter, ratingFilter, geoFilter, typeFilter, maturityMin, maturityMax, spreadMin, greenFilter, search, sortCol, sortDir]);

  const avgTotalSpread = useMemo(() => filtered.length ? filtered.reduce((s, x) => s + x.totalSpread, 0) / filtered.length : 0, [filtered]);
  const avgPhysPremium = useMemo(() => filtered.length ? filtered.reduce((s, x) => s + x.physPremium, 0) / filtered.length : 0, [filtered]);
  const avgTransPremium = useMemo(() => filtered.length ? filtered.reduce((s, x) => s + x.transPremium, 0) / filtered.length : 0, [filtered]);
  const climateSharePct = useMemo(() => avgTotalSpread > 0 ? (avgPhysPremium + avgTransPremium) / avgTotalSpread * 100 : 0, [avgPhysPremium, avgTransPremium, avgTotalSpread]);

  const top30 = useMemo(() => [...filtered].sort((a, b) => b.totalSpread - a.totalSpread).slice(0, 30).map(x => ({
    name: x.name.split(' ')[0],
    physPremium: +x.physPremium.toFixed(1),
    transPremium: +x.transPremium.toFixed(1),
    residualPremium: +x.residualPremium.toFixed(1),
  })), [filtered]);

  const sectorAttrib = useMemo(() => SECTORS.map(s => {
    const sub = filtered.filter(x => x.sector === s);
    if (!sub.length) return null;
    const avgPhys = sub.reduce((a, x) => a + x.physPremium, 0) / sub.length;
    const avgTrans = sub.reduce((a, x) => a + x.transPremium, 0) / sub.length;
    const avgRes = sub.reduce((a, x) => a + x.residualPremium, 0) / sub.length;
    const avgTotal = sub.reduce((a, x) => a + x.totalSpread, 0) / sub.length;
    const avgPhysRisk = sub.reduce((a, x) => a + x.physRiskScore, 0) / sub.length;
    const avgTransRisk = sub.reduce((a, x) => a + x.transRiskScore, 0) / sub.length;
    return { sector: s, avgPhys: +avgPhys.toFixed(1), avgTrans: +avgTrans.toFixed(1), avgRes: +avgRes.toFixed(1), avgTotal: +avgTotal.toFixed(1), avgPhysRisk: +avgPhysRisk.toFixed(1), avgTransRisk: +avgTransRisk.toFixed(1), count: sub.length };
  }).filter(Boolean), [filtered]);

  const scatterData = useMemo(() => filtered.slice(0, 80).map(x => ({
    physRisk: +x.physRiskScore.toFixed(1), transRisk: +x.transRiskScore.toFixed(1),
    spread: +x.totalSpread.toFixed(0), name: x.name, sector: x.sector,
  })), [filtered]);

  const ratingData = useMemo(() => RATINGS.map(r => {
    const sub = filtered.filter(x => x.rating === r);
    if (!sub.length) return null;
    const avgSpread = sub.reduce((a, x) => a + x.totalSpread, 0) / sub.length;
    const avgPD = sub.reduce((a, x) => a + x.climatePD * 100, 0) / sub.length;
    const avgClimate = sub.reduce((a, x) => a + x.climateAdjSpread, 0) / sub.length;
    return { rating: r, avgSpread: +avgSpread.toFixed(1), avgPD: +avgPD.toFixed(3), avgClimAdj: +avgClimate.toFixed(1), count: sub.length };
  }).filter(Boolean), [filtered]);

  const portfolioItems = useMemo(() => ISSUERS.filter(x => portfolioIds.has(x.id)), [portfolioIds]);
  const portfolioWeightedPremium = useMemo(() => {
    if (!portfolioItems.length) return 0;
    const totalSpread = portfolioItems.reduce((s, x) => s + x.totalSpread, 0);
    if (totalSpread <= 0) return 0;
    const climPremium = portfolioItems.reduce((s, x) => s + x.physPremium + x.transPremium, 0);
    return climPremium / portfolioItems.length;
  }, [portfolioItems]);

  const factorModelData = useMemo(() => SECTORS.map(s => {
    const sFactors = FACTOR_LOADINGS.filter(f => f.sector === s);
    const row = { sector: s.split(' ')[0] };
    sFactors.forEach(f => { row[f.factor.split(' ')[0]] = +f.loading.toFixed(3); });
    return row;
  }), []);

  const sectorR2 = useMemo(() => SECTORS.map((s, si) => ({
    sector: s,
    r2: +(0.25 + sr(si * 37) * 0.55).toFixed(3),
    avgIC: +(sr(si * 41) * 0.25 - 0.05).toFixed(3),
  })), []);

  const handleSort = useCallback((col) => {
    if (sortCol === col) setSortDir(d => -d);
    else { setSortCol(col); setSortDir(-1); }
  }, [sortCol]);

  const togglePortfolio = useCallback((id) => {
    setPortfolioIds(prev => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id); else n.add(id);
      return n;
    });
  }, []);

  const filterRow = (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16, padding: '12px 16px', background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, alignItems: 'center' }}>
      <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search issuers..." style={{ padding: '6px 10px', border: `1px solid ${T.border}`, borderRadius: 6, fontSize: 12, width: 150 }} />
      <select value={sectorFilter} onChange={e => setSectorFilter(e.target.value)} style={{ padding: '6px 8px', border: `1px solid ${T.border}`, borderRadius: 6, fontSize: 12 }}>
        <option>All</option>{SECTORS.map(s => <option key={s}>{s}</option>)}
      </select>
      <select value={ratingFilter} onChange={e => setRatingFilter(e.target.value)} style={{ padding: '6px 8px', border: `1px solid ${T.border}`, borderRadius: 6, fontSize: 12 }}>
        <option>All</option>{RATINGS.map(r => <option key={r}>{r}</option>)}
      </select>
      <select value={geoFilter} onChange={e => setGeoFilter(e.target.value)} style={{ padding: '6px 8px', border: `1px solid ${T.border}`, borderRadius: 6, fontSize: 12 }}>
        <option>All</option>{GEOGRAPHIES.map(g => <option key={g}>{g}</option>)}
      </select>
      <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} style={{ padding: '6px 8px', border: `1px solid ${T.border}`, borderRadius: 6, fontSize: 12 }}>
        <option>All</option>{ISSUER_TYPES.map(t => <option key={t}>{t}</option>)}
      </select>
      <label style={{ fontSize: 12 }}>Mat {maturityMin}–{maturityMax}yr
        <input type="range" min={0} max={30} value={maturityMin} onChange={e => setMaturityMin(+e.target.value)} style={{ width: 60, marginLeft: 4 }} />
        <input type="range" min={0} max={30} value={maturityMax} onChange={e => setMaturityMax(+e.target.value)} style={{ width: 60, marginLeft: 2 }} />
      </label>
      <label style={{ fontSize: 12 }}>Spread≥{spreadMin}bps
        <input type="range" min={0} max={400} value={spreadMin} onChange={e => setSpreadMin(+e.target.value)} style={{ width: 70, marginLeft: 4 }} />
      </label>
      <label style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
        <input type="checkbox" checked={greenFilter} onChange={e => setGreenFilter(e.target.checked)} /> Green Only
      </label>
    </div>
  );

  return (
    <div style={{ background: T.bg, minHeight: '100vh', padding: 24, fontFamily: 'DM Sans, sans-serif', color: T.text }}>
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 11, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.1em' }}>EP-DB4 · Sprint DB · Enterprise Climate Risk Capital</div>
        <h1 style={{ fontSize: 26, fontWeight: 700, margin: '4px 0 2px', color: T.navy }}>Climate Risk Premium Decomposer</h1>
        <div style={{ fontSize: 13, color: T.muted }}>200 issuers · 10 sectors · 4-factor climate model · Physical/Transition/Residual spread decomposition</div>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
        <KpiCard label="Avg Total Spread" value={`${avgTotalSpread.toFixed(0)} bps`} color={T.indigo} sub={`${filtered.length} issuers`} />
        <KpiCard label="Avg Physical Premium" value={`${avgPhysPremium.toFixed(0)} bps`} color={T.orange} sub="acute + chronic" />
        <KpiCard label="Avg Transition Premium" value={`${avgTransPremium.toFixed(0)} bps`} color={T.blue} sub="policy + tech" />
        <KpiCard label="Climate Share" value={`${climateSharePct.toFixed(1)}%`} color={T.red} sub="of total spread" />
      </div>

      <div style={{ display: 'flex', gap: 0, borderBottom: `2px solid ${T.border}`, marginBottom: 24 }}>
        {TABS.map((t, i) => (
          <button key={i} onClick={() => setTab(i)} style={{ padding: '10px 16px', border: 'none', background: 'none', cursor: 'pointer', fontSize: 13, fontWeight: tab === i ? 700 : 400, color: tab === i ? T.indigo : T.muted, borderBottom: tab === i ? `2px solid ${T.indigo}` : '2px solid transparent', marginBottom: -2, whiteSpace: 'nowrap' }}>{t}</button>
        ))}
      </div>

      {tab === 0 && (
        <div>
          {filterRow}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20 }}>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
              <div style={{ fontWeight: 600, marginBottom: 12 }}>Top 30 Issuers — Stacked Spread Decomposition (bps)</div>
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={top30} margin={{ bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="name" tick={{ fontSize: 9 }} angle={-45} textAnchor="end" interval={0} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip formatter={v => `${Number(v).toFixed(1)} bps`} />
                  <Legend />
                  <Bar dataKey="physPremium" stackId="a" fill={T.orange} name="Physical Premium" />
                  <Bar dataKey="transPremium" stackId="a" fill={T.indigo} name="Transition Premium" />
                  <Bar dataKey="residualPremium" stackId="a" fill={T.muted} name="Residual Premium" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
              <div style={{ fontWeight: 600, marginBottom: 12 }}>Climate Premium Share — Histogram</div>
              {(() => {
                const bins = Array.from({ length: 10 }, (_, i) => ({ bin: `${i * 10}-${i * 10 + 10}%`, count: 0 }));
                filtered.forEach(x => {
                  const share = x.totalSpread > 0 ? (x.physPremium + x.transPremium) / x.totalSpread * 100 : 0;
                  const idx = Math.min(9, Math.floor(share / 10));
                  bins[idx].count++;
                });
                return (
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={bins}>
                      <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                      <XAxis dataKey="bin" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip />
                      <Bar dataKey="count" fill={T.indigo} name="Issuers" radius={[2,2,0,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {tab === 1 && (
        <div>
          {filterRow}
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, overflow: 'auto', maxHeight: 600 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
              <thead style={{ position: 'sticky', top: 0 }}>
                <tr style={{ background: T.sub }}>
                  {[['Name','name'],['Sector','sector'],['Rating','rating'],['Geo','geography'],['Type','issuerType'],['Mat(yr)','maturity'],['TotalSprd','totalSpread'],['PhysPrem','physPremium'],['TransPrem','transPremium'],['Residual','residualPremium'],['ClimatePD%','climatePD'],['CarbonBeta','carbonBeta'],['Green?','isGreen'],['Covenant','covenantStrength']].map(([h,k]) => (
                    <th key={k} onClick={() => handleSort(k)} style={{ padding: '7px 8px', textAlign: 'left', fontWeight: 600, fontSize: 10, color: sortCol === k ? T.indigo : T.muted, borderBottom: `1px solid ${T.border}`, cursor: 'pointer', whiteSpace: 'nowrap' }}>{h}{sortCol === k ? (sortDir > 0 ? ' ↑' : ' ↓') : ''}</th>
                  ))}
                  <th style={{ padding: '7px 8px', textAlign: 'left', fontWeight: 600, fontSize: 10, color: T.muted, borderBottom: `1px solid ${T.border}` }}>Portfolio</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((x, i) => (
                  <tr key={x.id} onClick={() => setSelectedId(x.id)} style={{ background: x.id === selectedId ? '#eef2ff' : portfolioIds.has(x.id) ? '#f0fdf4' : i % 2 === 0 ? T.card : T.sub, cursor: 'pointer', borderBottom: `1px solid ${T.border}` }}>
                    <td style={{ padding: '5px 8px', fontWeight: 500 }}>{x.name}</td>
                    <td style={{ padding: '5px 8px', color: T.muted }}>{x.sector}</td>
                    <td style={{ padding: '5px 8px' }}>{x.rating}</td>
                    <td style={{ padding: '5px 8px' }}>{x.geography}</td>
                    <td style={{ padding: '5px 8px', color: T.muted }}>{x.issuerType.split(' ')[0]}</td>
                    <td style={{ padding: '5px 8px' }}>{x.maturity}yr</td>
                    <td style={{ padding: '5px 8px', fontWeight: 600 }}>{x.totalSpread.toFixed(0)}</td>
                    <td style={{ padding: '5px 8px', color: T.orange }}>{x.physPremium.toFixed(1)}</td>
                    <td style={{ padding: '5px 8px', color: T.indigo }}>{x.transPremium.toFixed(1)}</td>
                    <td style={{ padding: '5px 8px', color: T.muted }}>{x.residualPremium.toFixed(1)}</td>
                    <td style={{ padding: '5px 8px', color: T.red }}>{(x.climatePD * 100).toFixed(3)}%</td>
                    <td style={{ padding: '5px 8px' }}>{x.carbonBeta.toFixed(3)}</td>
                    <td style={{ padding: '5px 8px', color: x.isGreen ? T.green : T.muted }}>{x.isGreen ? `${x.greenBondPremium.toFixed(1)}` : '—'}</td>
                    <td style={{ padding: '5px 8px', color: x.covenantStrength === 'Strong' ? T.green : x.covenantStrength === 'Weak' ? T.red : T.amber }}>{x.covenantStrength}</td>
                    <td style={{ padding: '5px 8px' }}>
                      <button onClick={e => { e.stopPropagation(); togglePortfolio(x.id); }} style={{ padding: '2px 8px', background: portfolioIds.has(x.id) ? '#f0fdf4' : T.sub, border: `1px solid ${portfolioIds.has(x.id) ? T.green : T.border}`, borderRadius: 4, cursor: 'pointer', fontSize: 10, color: portfolioIds.has(x.id) ? T.green : T.muted }}>
                        {portfolioIds.has(x.id) ? '✓ Added' : '+ Add'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ marginTop: 8, fontSize: 12, color: T.muted }}>{filtered.length} issuers · {portfolioIds.size} in portfolio · Click to select or add to portfolio</div>
        </div>
      )}

      {tab === 2 && (
        <div>
          {filterRow}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
              <div style={{ fontWeight: 600, marginBottom: 12 }}>Sector Avg Spread Decomposition (bps)</div>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={sectorAttrib}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="sector" tick={{ fontSize: 9 }} angle={-20} textAnchor="end" height={40} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip formatter={v => `${Number(v).toFixed(1)} bps`} />
                  <Legend />
                  <Bar dataKey="avgPhys" stackId="a" fill={T.orange} name="Avg Physical" />
                  <Bar dataKey="avgTrans" stackId="a" fill={T.indigo} name="Avg Transition" />
                  <Bar dataKey="avgRes" stackId="a" fill={T.muted} name="Avg Residual" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
              <div style={{ fontWeight: 600, marginBottom: 12 }}>Physical vs Transition Risk — Scatter (80 issuers)</div>
              <ResponsiveContainer width="100%" height={300}>
                <ScatterChart margin={{ left: 10, right: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="physRisk" name="Physical Risk" tick={{ fontSize: 10 }} label={{ value: 'Physical Risk Score', position: 'insideBottom', fontSize: 10 }} height={30} />
                  <YAxis dataKey="transRisk" name="Transition Risk" tick={{ fontSize: 10 }} />
                  <Tooltip cursor={{ strokeDasharray: '3 3' }} content={({ payload }) => payload?.[0] ? <div style={{ background: T.card, border: `1px solid ${T.border}`, padding: '6px 10px', borderRadius: 6, fontSize: 12 }}><div style={{ fontWeight: 600 }}>{payload[0]?.payload?.name}</div><div>{payload[0]?.payload?.sector}</div><div>Phys: {payload[0]?.payload?.physRisk} | Trans: {payload[0]?.payload?.transRisk}</div><div>Spread: {payload[0]?.payload?.spread} bps</div></div> : null} />
                  <Scatter data={scatterData} fill={T.indigo} fillOpacity={0.6} />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
            <div style={{ fontWeight: 600, marginBottom: 12 }}>Sector Ranking Table</div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ background: T.sub }}>{['Sector','Issuers','Avg Total Spread','Avg Phys Premium','Avg Trans Premium','Avg Residual','Climate Share%','Avg Phys Risk','Avg Trans Risk'].map(h => <th key={h} style={{ padding: '7px 10px', textAlign: 'left', color: T.muted, fontWeight: 600, borderBottom: `1px solid ${T.border}` }}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {[...sectorAttrib].sort((a, b) => b.avgTotal - a.avgTotal).map((s, i) => (
                  <tr key={i} style={{ background: i % 2 === 0 ? T.card : T.sub }}>
                    <td style={{ padding: '7px 10px', fontWeight: 500 }}>{s.sector}</td>
                    <td style={{ padding: '7px 10px' }}>{s.count}</td>
                    <td style={{ padding: '7px 10px', fontWeight: 600 }}>{s.avgTotal} bps</td>
                    <td style={{ padding: '7px 10px', color: T.orange }}>{s.avgPhys} bps</td>
                    <td style={{ padding: '7px 10px', color: T.indigo }}>{s.avgTrans} bps</td>
                    <td style={{ padding: '7px 10px', color: T.muted }}>{s.avgRes} bps</td>
                    <td style={{ padding: '7px 10px', color: T.red }}>{s.avgTotal > 0 ? ((s.avgPhys + s.avgTrans) / s.avgTotal * 100).toFixed(1) : 0}%</td>
                    <td style={{ padding: '7px 10px' }}>{s.avgPhysRisk}</td>
                    <td style={{ padding: '7px 10px' }}>{s.avgTransRisk}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 3 && (
        <div>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16, marginBottom: 20 }}>
            <div style={{ fontWeight: 600, marginBottom: 12 }}>4-Factor Climate Loading by Sector</div>
            <div style={{ marginBottom: 12, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {CLIMATE_FACTORS.map((f, fi) => (
                <div key={f.id} style={{ display: 'flex', gap: 4, alignItems: 'center', fontSize: 12 }}>
                  <span style={{ width: 12, height: 12, borderRadius: '50%', background: f.color, display: 'inline-block' }} />
                  <span>{f.name}</span>
                  <label style={{ marginLeft: 8, fontSize: 11 }}>Weight:
                    <input type="range" min={0} max={100} value={Math.round(factorWeights[fi] * 100)} onChange={e => setFactorWeights(prev => { const n = [...prev]; n[fi] = +e.target.value / 100; return n; })} style={{ width: 60, marginLeft: 4 }} />
                    {(factorWeights[fi] * 100).toFixed(0)}%
                  </label>
                </div>
              ))}
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={factorModelData}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="sector" tick={{ fontSize: 9 }} angle={-20} textAnchor="end" height={40} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip formatter={v => Number(v).toFixed(3)} />
                <Legend />
                {CLIMATE_FACTORS.map(f => <Bar key={f.id} dataKey={f.name.split(' ')[0]} fill={f.color} name={f.name} radius={[2,2,0,0]} />)}
                <ReferenceLine y={0} stroke={T.border} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
              <div style={{ fontWeight: 600, marginBottom: 12 }}>R² by Sector (Climate Factor Explanatory Power)</div>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={sectorR2}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="sector" tick={{ fontSize: 9 }} angle={-20} textAnchor="end" height={40} />
                  <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `${(v * 100).toFixed(0)}%`} domain={[0, 1]} />
                  <Tooltip formatter={v => `${(Number(v) * 100).toFixed(1)}%`} />
                  <Bar dataKey="r2" fill={T.blue} name="R² (Climate Factors)" radius={[2,2,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
              <div style={{ fontWeight: 600, marginBottom: 12 }}>Factor IC Table (Information Coefficient by Sector)</div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: T.sub }}>{['Sector','R²','Avg IC','Factor Exposure','Significance'].map(h => <th key={h} style={{ padding: '6px 8px', textAlign: 'left', color: T.muted, fontWeight: 600, borderBottom: `1px solid ${T.border}` }}>{h}</th>)}</tr>
                </thead>
                <tbody>
                  {sectorR2.map((s, i) => (
                    <tr key={i} style={{ background: i % 2 === 0 ? T.card : T.sub }}>
                      <td style={{ padding: '6px 8px', fontWeight: 500 }}>{s.sector}</td>
                      <td style={{ padding: '6px 8px', color: s.r2 > 0.6 ? T.green : T.muted, fontWeight: 600 }}>{(s.r2 * 100).toFixed(1)}%</td>
                      <td style={{ padding: '6px 8px', color: s.avgIC > 0 ? T.green : T.red }}>{s.avgIC.toFixed(3)}</td>
                      <td style={{ padding: '6px 8px' }}>{CLIMATE_FACTORS.map(f => `${f.name.split(' ')[0]}`).join(', ')}</td>
                      <td style={{ padding: '6px 8px', color: s.r2 > 0.6 ? T.green : s.r2 > 0.4 ? T.amber : T.muted }}>{s.r2 > 0.6 ? 'High' : s.r2 > 0.4 ? 'Moderate' : 'Low'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {tab === 4 && (
        <div>
          {filterRow}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
              <div style={{ fontWeight: 600, marginBottom: 12 }}>Avg Spread by Rating (bps)</div>
              <ResponsiveContainer width="100%" height={260}>
                <ComposedChart data={ratingData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="rating" tick={{ fontSize: 11 }} />
                  <YAxis yAxisId="left" tick={{ fontSize: 10 }} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10 }} tickFormatter={v => `${v}%`} />
                  <Tooltip />
                  <Legend />
                  <Bar yAxisId="left" dataKey="avgSpread" fill={T.indigo} name="Avg Spread (bps)" radius={[2,2,0,0]} />
                  <Bar yAxisId="left" dataKey="avgClimAdj" fill={T.blue} name="Climate-Adj Spread" radius={[2,2,0,0]} />
                  <Line yAxisId="right" type="monotone" dataKey="avgPD" stroke={T.red} strokeWidth={2} dot={{ r: 4 }} name="Avg Climate PD%" />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
              <div style={{ fontWeight: 600, marginBottom: 12 }}>Credit Spread Term Structure by Rating</div>
              {(() => {
                const termData = [2,5,7,10,15,20,30].map(t => {
                  const row = { term: `${t}yr` };
                  RATINGS.forEach((r, ri) => { row[r] = +(30 + ri * 60 + t * 3 + sr(ri * 7 + t) * 20).toFixed(0); });
                  return row;
                });
                return (
                  <ResponsiveContainer width="100%" height={240}>
                    <LineChart data={termData}>
                      <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                      <XAxis dataKey="term" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip />
                      <Legend />
                      {RATINGS.slice(0, 5).map((r, ri) => <Line key={r} type="monotone" dataKey={r} stroke={[T.green, T.teal, T.blue, T.amber, T.red][ri]} strokeWidth={1.5} dot={false} />)}
                    </LineChart>
                  </ResponsiveContainer>
                );
              })()}
            </div>
          </div>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
            <div style={{ fontWeight: 600, marginBottom: 12 }}>Rating Analysis Summary Table</div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ background: T.sub }}>{['Rating','Count','Avg Spread','Avg Clim-Adj Spread','Avg PD%','Spread Premium vs AAA','PD Premium vs AAA'].map(h => <th key={h} style={{ padding: '7px 10px', textAlign: 'left', color: T.muted, fontWeight: 600, borderBottom: `1px solid ${T.border}` }}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {ratingData.map((r, i) => {
                  const aaaRow = ratingData.find(x => x.rating === 'AAA');
                  const spreadPrem = aaaRow ? r.avgSpread - aaaRow.avgSpread : 0;
                  const pdPrem = aaaRow ? r.avgPD - aaaRow.avgPD : 0;
                  return (
                    <tr key={i} style={{ background: i % 2 === 0 ? T.card : T.sub }}>
                      <td style={{ padding: '7px 10px', fontWeight: 700 }}>{r.rating}</td>
                      <td style={{ padding: '7px 10px' }}>{r.count}</td>
                      <td style={{ padding: '7px 10px', fontWeight: 600 }}>{r.avgSpread} bps</td>
                      <td style={{ padding: '7px 10px' }}>{r.avgClimAdj} bps</td>
                      <td style={{ padding: '7px 10px', color: T.red }}>{r.avgPD.toFixed(3)}%</td>
                      <td style={{ padding: '7px 10px', color: spreadPrem > 0 ? T.red : T.green }}>+{spreadPrem.toFixed(0)} bps</td>
                      <td style={{ padding: '7px 10px', color: pdPrem > 0 ? T.red : T.green }}>+{pdPrem.toFixed(3)}%</td>
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
          <div style={{ marginBottom: 12, padding: '10px 16px', background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, fontSize: 13 }}>
            Portfolio: <strong>{portfolioIds.size}</strong> issuers selected · Avg Climate Premium: <strong style={{ color: T.red }}>{portfolioWeightedPremium.toFixed(1)} bps</strong> · Add issuers from the Issuer Database tab.
          </div>
          {portfolioItems.length > 0 ? (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
                <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
                  <div style={{ fontWeight: 600, marginBottom: 12 }}>Portfolio Climate Premium Composition</div>
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={portfolioItems.slice(0, 20).map(x => ({ name: x.name.split(' ')[0], physPremium: +x.physPremium.toFixed(1), transPremium: +x.transPremium.toFixed(1), residual: +x.residualPremium.toFixed(1) }))}>
                      <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                      <XAxis dataKey="name" tick={{ fontSize: 9 }} angle={-30} textAnchor="end" height={45} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip formatter={v => `${Number(v).toFixed(1)} bps`} />
                      <Legend />
                      <Bar dataKey="physPremium" stackId="a" fill={T.orange} name="Physical" />
                      <Bar dataKey="transPremium" stackId="a" fill={T.indigo} name="Transition" />
                      <Bar dataKey="residual" stackId="a" fill={T.muted} name="Residual" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
                  <div style={{ fontWeight: 600, marginBottom: 12 }}>Portfolio Risk Profile — RadarChart</div>
                  <ResponsiveContainer width="100%" height={260}>
                    <RadarChart data={SECTORS.map(s => {
                      const portSub = portfolioItems.filter(x => x.sector === s);
                      const benchSub = ISSUERS.filter(x => x.sector === s);
                      const portAvg = portSub.length ? portSub.reduce((a, x) => a + x.physRiskScore, 0) / portSub.length : 0;
                      const benchAvg = benchSub.length ? benchSub.reduce((a, x) => a + x.physRiskScore, 0) / benchSub.length : 0;
                      return { sector: s.split(' ')[0], portfolio: +portAvg.toFixed(1), benchmark: +benchAvg.toFixed(1) };
                    })}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="sector" tick={{ fontSize: 10 }} />
                      <PolarRadiusAxis tick={{ fontSize: 9 }} />
                      <Radar name="Portfolio" dataKey="portfolio" stroke={T.indigo} fill={T.indigo} fillOpacity={0.3} />
                      <Radar name="Benchmark" dataKey="benchmark" stroke={T.amber} fill={T.amber} fillOpacity={0.15} />
                      <Legend />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
                <div style={{ fontWeight: 600, marginBottom: 12 }}>Portfolio Composition Table ({portfolioItems.length} issuers)</div>
                <div style={{ overflowX: 'auto', maxHeight: 320 }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                    <thead>
                      <tr style={{ background: T.sub }}>{['Issuer','Sector','Rating','Total Spread','Phys Prem','Trans Prem','Residual','Carbon Beta','Green?'].map(h => <th key={h} style={{ padding: '6px 8px', textAlign: 'left', color: T.muted, fontWeight: 600, borderBottom: `1px solid ${T.border}` }}>{h}</th>)}</tr>
                    </thead>
                    <tbody>
                      {portfolioItems.map((x, i) => (
                        <tr key={x.id} style={{ background: i % 2 === 0 ? T.card : T.sub }}>
                          <td style={{ padding: '5px 8px', fontWeight: 500 }}>{x.name}</td>
                          <td style={{ padding: '5px 8px', color: T.muted }}>{x.sector}</td>
                          <td style={{ padding: '5px 8px' }}>{x.rating}</td>
                          <td style={{ padding: '5px 8px', fontWeight: 600 }}>{x.totalSpread.toFixed(0)} bps</td>
                          <td style={{ padding: '5px 8px', color: T.orange }}>{x.physPremium.toFixed(1)}</td>
                          <td style={{ padding: '5px 8px', color: T.indigo }}>{x.transPremium.toFixed(1)}</td>
                          <td style={{ padding: '5px 8px', color: T.muted }}>{x.residualPremium.toFixed(1)}</td>
                          <td style={{ padding: '5px 8px' }}>{x.carbonBeta.toFixed(3)}</td>
                          <td style={{ padding: '5px 8px', color: x.isGreen ? T.green : T.muted }}>{x.isGreen ? `${x.greenBondPremium.toFixed(1)} bps` : '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : <div style={{ padding: 60, textAlign: 'center', color: T.muted }}>Add issuers to your portfolio from the Issuer Database tab using the "+ Add" button.</div>}
        </div>
      )}

      {tab === 6 && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginBottom: 20 }}>
            <KpiCard label="Avg Total Spread" value={`${avgTotalSpread.toFixed(0)} bps`} color={T.indigo} sub={`${filtered.length} issuers`} />
            <KpiCard label="Avg Physical Premium" value={`${avgPhysPremium.toFixed(0)} bps`} color={T.orange} />
            <KpiCard label="Avg Transition Premium" value={`${avgTransPremium.toFixed(0)} bps`} color={T.blue} />
            <KpiCard label="Climate Share" value={`${climateSharePct.toFixed(1)}%`} color={T.red} sub="of total spread" />
            <KpiCard label="Green Issuers" value={`${filtered.filter(x => x.isGreen).length}`} color={T.green} />
            <KpiCard label="Portfolio Size" value={`${portfolioIds.size}`} color={T.teal} sub="issuers selected" />
          </div>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
            <div style={{ fontWeight: 600, marginBottom: 12 }}>Full Issuer KPI Export — {filtered.length} issuers</div>
            <div style={{ overflowX: 'auto', maxHeight: 500 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 10 }}>
                <thead style={{ position: 'sticky', top: 0 }}>
                  <tr style={{ background: T.sub }}>
                    {['Issuer','Sector','Rating','Geo','Type','Mat(yr)','Total(bps)','Phys(bps)','Trans(bps)','Resid(bps)','Clim%','PD%','CarbonBeta','GreenAdj(bps)','Covenant'].map(h => (
                      <th key={h} style={{ padding: '5px 7px', textAlign: 'left', color: T.muted, fontWeight: 600, borderBottom: `1px solid ${T.border}`, whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((x, i) => (
                    <tr key={x.id} style={{ background: i % 2 === 0 ? T.card : T.sub }}>
                      <td style={{ padding: '4px 7px', fontWeight: 500 }}>{x.name}</td>
                      <td style={{ padding: '4px 7px', color: T.muted }}>{x.sector}</td>
                      <td style={{ padding: '4px 7px' }}>{x.rating}</td>
                      <td style={{ padding: '4px 7px' }}>{x.geography}</td>
                      <td style={{ padding: '4px 7px', color: T.muted }}>{x.issuerType.split(' ')[0]}</td>
                      <td style={{ padding: '4px 7px' }}>{x.maturity}</td>
                      <td style={{ padding: '4px 7px', fontWeight: 600 }}>{x.totalSpread.toFixed(0)}</td>
                      <td style={{ padding: '4px 7px', color: T.orange }}>{x.physPremium.toFixed(1)}</td>
                      <td style={{ padding: '4px 7px', color: T.indigo }}>{x.transPremium.toFixed(1)}</td>
                      <td style={{ padding: '4px 7px', color: T.muted }}>{x.residualPremium.toFixed(1)}</td>
                      <td style={{ padding: '4px 7px', color: T.red }}>{x.totalSpread > 0 ? ((x.physPremium + x.transPremium) / x.totalSpread * 100).toFixed(1) : 0}%</td>
                      <td style={{ padding: '4px 7px' }}>{(x.climatePD * 100).toFixed(3)}%</td>
                      <td style={{ padding: '4px 7px' }}>{x.carbonBeta.toFixed(3)}</td>
                      <td style={{ padding: '4px 7px', color: x.isGreen ? T.green : T.muted }}>{x.isGreen ? x.greenBondPremium.toFixed(1) : '0'}</td>
                      <td style={{ padding: '4px 7px', color: x.covenantStrength === 'Strong' ? T.green : x.covenantStrength === 'Weak' ? T.red : T.amber }}>{x.covenantStrength}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div style={{ marginTop: 20, background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
            <div style={{ fontWeight: 600, marginBottom: 12 }}>Climate Premium Analytics — Portfolio & Benchmark Comparison</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 16 }}>
              {[
                ['Total Issuers', `${ISSUERS.length}`, T.navy, 'full universe'],
                ['Green Issuers', `${ISSUERS.filter(x=>x.isGreen).length}`, T.green, 'negative greenium'],
                ['Avg Greenium', `${(ISSUERS.filter(x=>x.isGreen).reduce((s,x)=>s+x.greenBondPremium,0)/(ISSUERS.filter(x=>x.isGreen).length||1)).toFixed(1)} bps`, T.teal, 'for green issuers'],
                ['Avg Carbon Beta', `${(ISSUERS.reduce((s,x)=>s+x.carbonBeta,0)/ISSUERS.length).toFixed(3)}`, T.amber, 'universe average'],
              ].map(([l,v,c,s])=>(
                <div key={l} style={{ padding:'10px 14px',background:T.sub,borderRadius:8 }}>
                  <div style={{ fontSize:10,color:T.muted }}>{l}</div>
                  <div style={{ fontSize:18,fontWeight:700,color:c }}>{v}</div>
                  <div style={{ fontSize:10,color:T.muted }}>{s}</div>
                </div>
              ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <div style={{ fontWeight:600,fontSize:13,marginBottom:8 }}>Climate Premium by Geography</div>
                <table style={{ width:'100%',borderCollapse:'collapse',fontSize:12 }}>
                  <thead><tr style={{ background:T.sub }}>{['Geography','Issuers','Avg Spread','Avg Phys Prem','Avg Trans Prem','Climate Share%'].map(h=><th key={h} style={{ padding:'5px 8px',textAlign:'left',color:T.muted,fontWeight:600,borderBottom:`1px solid ${T.border}` }}>{h}</th>)}</tr></thead>
                  <tbody>
                    {GEOGRAPHIES.map((geo,gi)=>{
                      const sub=filtered.filter(x=>x.geography===geo);
                      if(!sub.length) return null;
                      const avgSprd=sub.reduce((s,x)=>s+x.totalSpread,0)/sub.length;
                      const avgPhys=sub.reduce((s,x)=>s+x.physPremium,0)/sub.length;
                      const avgTrans=sub.reduce((s,x)=>s+x.transPremium,0)/sub.length;
                      const share=avgSprd>0?(avgPhys+avgTrans)/avgSprd*100:0;
                      return (
                        <tr key={gi} style={{ background:gi%2===0?T.card:T.sub }}>
                          <td style={{ padding:'5px 8px',fontWeight:500 }}>{geo}</td>
                          <td style={{ padding:'5px 8px' }}>{sub.length}</td>
                          <td style={{ padding:'5px 8px',fontWeight:600 }}>{avgSprd.toFixed(0)} bps</td>
                          <td style={{ padding:'5px 8px',color:T.orange }}>{avgPhys.toFixed(1)}</td>
                          <td style={{ padding:'5px 8px',color:T.indigo }}>{avgTrans.toFixed(1)}</td>
                          <td style={{ padding:'5px 8px',color:share>40?T.red:T.muted }}>{share.toFixed(1)}%</td>
                        </tr>
                      );
                    }).filter(Boolean)}
                  </tbody>
                </table>
              </div>
              <div>
                <div style={{ fontWeight:600,fontSize:13,marginBottom:8 }}>Climate Premium by Issuer Type</div>
                <table style={{ width:'100%',borderCollapse:'collapse',fontSize:12 }}>
                  <thead><tr style={{ background:T.sub }}>{['Issuer Type','Count','Avg Spread','Avg Climate Prem','Carbon Beta','Green%'].map(h=><th key={h} style={{ padding:'5px 8px',textAlign:'left',color:T.muted,fontWeight:600,borderBottom:`1px solid ${T.border}` }}>{h}</th>)}</tr></thead>
                  <tbody>
                    {ISSUER_TYPES.map((type,ti)=>{
                      const sub=filtered.filter(x=>x.issuerType===type);
                      if(!sub.length) return null;
                      const avgSprd=sub.reduce((s,x)=>s+x.totalSpread,0)/sub.length;
                      const avgClim=sub.reduce((s,x)=>s+x.physPremium+x.transPremium,0)/sub.length;
                      const avgBeta=sub.reduce((s,x)=>s+x.carbonBeta,0)/sub.length;
                      const greenPct=sub.filter(x=>x.isGreen).length/sub.length*100;
                      return (
                        <tr key={ti} style={{ background:ti%2===0?T.card:T.sub }}>
                          <td style={{ padding:'5px 8px',fontWeight:500 }}>{type}</td>
                          <td style={{ padding:'5px 8px' }}>{sub.length}</td>
                          <td style={{ padding:'5px 8px',fontWeight:600 }}>{avgSprd.toFixed(0)} bps</td>
                          <td style={{ padding:'5px 8px',color:T.red }}>{avgClim.toFixed(1)} bps</td>
                          <td style={{ padding:'5px 8px' }}>{avgBeta.toFixed(3)}</td>
                          <td style={{ padding:'5px 8px',color:greenPct>20?T.green:T.muted }}>{greenPct.toFixed(0)}%</td>
                        </tr>
                      );
                    }).filter(Boolean)}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          <div style={{ marginTop: 16, background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
            <div style={{ fontWeight: 600, marginBottom: 12 }}>Maturity Bucket Analysis — Climate Premium Term Structure</div>
            {(() => {
              const buckets = [
                { label:'1-3yr', min:1, max:3 }, { label:'3-5yr', min:3, max:5 },
                { label:'5-7yr', min:5, max:7 }, { label:'7-10yr', min:7, max:10 },
                { label:'10-15yr', min:10, max:15 }, { label:'15yr+', min:15, max:31 },
              ];
              const data = buckets.map(b => {
                const sub = filtered.filter(x=>x.maturity>=b.min&&x.maturity<b.max);
                if (!sub.length) return { bucket:b.label, physPremium:0, transPremium:0, residual:0, total:0 };
                return {
                  bucket:b.label,
                  physPremium:+(sub.reduce((s,x)=>s+x.physPremium,0)/sub.length).toFixed(1),
                  transPremium:+(sub.reduce((s,x)=>s+x.transPremium,0)/sub.length).toFixed(1),
                  residual:+(sub.reduce((s,x)=>s+x.residualPremium,0)/sub.length).toFixed(1),
                  total:+(sub.reduce((s,x)=>s+x.totalSpread,0)/sub.length).toFixed(0),
                  count:sub.length,
                };
              });
              return (
                <ResponsiveContainer width="100%" height={200}>
                  <ComposedChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="bucket" tick={{ fontSize:11 }} />
                    <YAxis tick={{ fontSize:10 }} />
                    <Tooltip formatter={v=>`${Number(v).toFixed(1)} bps`} />
                    <Legend />
                    <Bar dataKey="physPremium" stackId="a" fill={T.orange} name="Physical" />
                    <Bar dataKey="transPremium" stackId="a" fill={T.indigo} name="Transition" />
                    <Bar dataKey="residual" stackId="a" fill={T.muted} name="Residual" />
                    <Line type="monotone" dataKey="total" stroke={T.red} strokeWidth={2} dot={{ r:4 }} name="Total Spread" />
                  </ComposedChart>
                </ResponsiveContainer>
              );
            })()}
          </div>
        </div>
      )}

      {/* ── Additional: Spread Decomposition Deep-Dive ── */}
      {activeTab === 'rating' && (
        <div style={{ display:'flex',flexDirection:'column',gap:16,marginTop:16 }}>
          <div style={{ background:T.card,border:`1px solid ${T.border}`,borderRadius:8,padding:16 }}>
            <div style={{ fontWeight:700,fontSize:14,marginBottom:12 }}>Physical vs Transition Spread Split — By Rating Cohort</div>
            <div style={{ overflowX:'auto' }}>
              <table style={{ width:'100%',borderCollapse:'collapse',fontSize:12 }}>
                <thead>
                  <tr style={{ background:T.sub }}>
                    <th style={{ padding:'6px 10px',textAlign:'left',color:T.muted }}>Rating</th>
                    <th style={{ padding:'6px 8px',textAlign:'right',color:T.muted }}>Count</th>
                    <th style={{ padding:'6px 8px',textAlign:'right',color:T.muted }}>Avg Physical (bps)</th>
                    <th style={{ padding:'6px 8px',textAlign:'right',color:T.muted }}>Avg Transition (bps)</th>
                    <th style={{ padding:'6px 8px',textAlign:'right',color:T.muted }}>Avg Residual (bps)</th>
                    <th style={{ padding:'6px 8px',textAlign:'right',color:T.muted }}>Total Spread (bps)</th>
                    <th style={{ padding:'6px 8px',textAlign:'right',color:T.muted }}>Phys/Trans Ratio</th>
                  </tr>
                </thead>
                <tbody>
                  {RATINGS.map((rating,ri)=>{
                    const sub=filtered.filter(x=>x.rating===rating);
                    if(!sub.length) return null;
                    const avgPhys=sub.length?sub.reduce((s,x)=>s+x.physPremium,0)/sub.length:0;
                    const avgTrans=sub.length?sub.reduce((s,x)=>s+x.transPremium,0)/sub.length:0;
                    const avgResid=sub.length?sub.reduce((s,x)=>s+x.residualPremium,0)/sub.length:0;
                    const avgTotal=avgPhys+avgTrans+avgResid;
                    const ratio=avgTrans>0?avgPhys/avgTrans:0;
                    return (
                      <tr key={rating} style={{ background:ri%2===0?T.card:T.sub }}>
                        <td style={{ padding:'5px 10px',fontWeight:700,color:['AAA','AA','A'].includes(rating)?T.green:['BB','B','CCC'].includes(rating)?T.red:T.amber }}>{rating}</td>
                        <td style={{ padding:'5px 8px',textAlign:'right' }}>{sub.length}</td>
                        <td style={{ padding:'5px 8px',textAlign:'right',color:T.orange }}>{avgPhys.toFixed(1)}</td>
                        <td style={{ padding:'5px 8px',textAlign:'right',color:T.indigo }}>{avgTrans.toFixed(1)}</td>
                        <td style={{ padding:'5px 8px',textAlign:'right',color:T.muted }}>{avgResid.toFixed(1)}</td>
                        <td style={{ padding:'5px 8px',textAlign:'right',fontWeight:700,color:avgTotal>200?T.red:T.text }}>{avgTotal.toFixed(1)}</td>
                        <td style={{ padding:'5px 8px',textAlign:'right' }}>{ratio.toFixed(2)}×</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div style={{ background:T.card,border:`1px solid ${T.border}`,borderRadius:8,padding:16 }}>
            <div style={{ fontWeight:700,fontSize:14,marginBottom:12 }}>Carbon Beta vs Climate PD — Scatter Analysis</div>
            <ResponsiveContainer width="100%" height={200}>
              <ScatterChart margin={{ top:5,right:20,bottom:20,left:10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="carbonBeta" name="Carbon β" tick={{ fontSize:10 }} label={{ value:'Carbon Beta',position:'insideBottom',offset:-10,fontSize:10 }} />
                <YAxis dataKey="climatePD" name="Climate PD (%)" tick={{ fontSize:10 }} tickFormatter={v=>`${(v*100).toFixed(1)}%`} />
                <Tooltip formatter={(v,n)=>[typeof v==='number'?v.toFixed(4):v,n]} />
                <Scatter data={filtered.slice(0,60).map(x=>({ carbonBeta:x.carbonBeta, climatePD:x.climatePD }))} fill={T.indigo} opacity={0.6} r={3} />
              </ScatterChart>
            </ResponsiveContainer>
          </div>

          <div style={{ background:T.card,border:`1px solid ${T.border}`,borderRadius:8,padding:16 }}>
            <div style={{ fontWeight:700,fontSize:14,marginBottom:12 }}>Green Bond Premium Analysis — Sector Distribution of Greenium</div>
            <div style={{ display:'flex',flexDirection:'column',gap:6 }}>
              {SECTORS.map((sector,si)=>{
                const sub=filtered.filter(x=>x.sector===sector&&x.greenBondPremium!==undefined);
                const gbIssuers=sub.filter(x=>x.isGreenBond);
                const avgGreenium=gbIssuers.length?gbIssuers.reduce((s,x)=>s+x.greenBondPremium,0)/gbIssuers.length:0;
                const barW=Math.max(0,Math.min(100,-avgGreenium*2));
                return (
                  <div key={sector} style={{ display:'flex',alignItems:'center',gap:8 }}>
                    <div style={{ width:130,fontSize:10,color:T.muted,textAlign:'right' }}>{sector}</div>
                    <div style={{ flex:1,background:T.sub,borderRadius:4,height:14,position:'relative',overflow:'hidden' }}>
                      <div style={{ width:`${barW}%`,height:'100%',background:T.teal,borderRadius:4 }} />
                    </div>
                    <div style={{ width:70,fontSize:10,fontWeight:600,color:avgGreenium<0?T.teal:T.muted }}>{gbIssuers.length?`${avgGreenium.toFixed(1)} bps`:'—'}</div>
                    <div style={{ width:40,fontSize:10,color:T.muted }}>{gbIssuers.length} GBs</div>
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{ background:T.card,border:`1px solid ${T.border}`,borderRadius:8,padding:16 }}>
            <div style={{ fontWeight:700,fontSize:14,marginBottom:12 }}>Factor Attribution Summary — R² and Factor IC by Sector</div>
            <div style={{ overflowX:'auto' }}>
              <table style={{ width:'100%',borderCollapse:'collapse',fontSize:12 }}>
                <thead>
                  <tr style={{ background:T.sub }}>
                    <th style={{ padding:'6px 10px',textAlign:'left',color:T.muted }}>Sector</th>
                    <th style={{ padding:'6px 8px',textAlign:'right',color:T.muted }}>Count</th>
                    <th style={{ padding:'6px 8px',textAlign:'right',color:T.muted }}>Avg Carbon β</th>
                    <th style={{ padding:'6px 8px',textAlign:'right',color:T.muted }}>Avg Climate PD</th>
                    <th style={{ padding:'6px 8px',textAlign:'right',color:T.muted }}>Phys Premium</th>
                    <th style={{ padding:'6px 8px',textAlign:'right',color:T.muted }}>Trans Premium</th>
                    <th style={{ padding:'6px 8px',textAlign:'right',color:T.muted }}>GB Issuers</th>
                    <th style={{ padding:'6px 8px',textAlign:'right',color:T.muted }}>Avg Greenium</th>
                  </tr>
                </thead>
                <tbody>
                  {SECTORS.map((sector,si)=>{
                    const sub=filtered.filter(x=>x.sector===sector);
                    if(!sub.length) return null;
                    const avgCB=sub.length?sub.reduce((s,x)=>s+x.carbonBeta,0)/sub.length:0;
                    const avgPD=sub.length?sub.reduce((s,x)=>s+x.climatePD,0)/sub.length:0;
                    const avgPhys=sub.length?sub.reduce((s,x)=>s+x.physPremium,0)/sub.length:0;
                    const avgTrans=sub.length?sub.reduce((s,x)=>s+x.transPremium,0)/sub.length:0;
                    const gbSub=sub.filter(x=>x.isGreenBond);
                    const avgGreenium=gbSub.length?gbSub.reduce((s,x)=>s+x.greenBondPremium,0)/gbSub.length:null;
                    return (
                      <tr key={sector} style={{ background:si%2===0?T.card:T.sub }}>
                        <td style={{ padding:'5px 10px',fontWeight:600,fontSize:11 }}>{sector}</td>
                        <td style={{ padding:'5px 8px',textAlign:'right' }}>{sub.length}</td>
                        <td style={{ padding:'5px 8px',textAlign:'right',color:avgCB>0.7?T.red:T.text }}>{avgCB.toFixed(3)}</td>
                        <td style={{ padding:'5px 8px',textAlign:'right',color:avgPD*100>3?T.red:T.text }}>{(avgPD*100).toFixed(2)}%</td>
                        <td style={{ padding:'5px 8px',textAlign:'right',color:T.orange }}>{avgPhys.toFixed(1)} bps</td>
                        <td style={{ padding:'5px 8px',textAlign:'right',color:T.indigo }}>{avgTrans.toFixed(1)} bps</td>
                        <td style={{ padding:'5px 8px',textAlign:'right',color:T.teal }}>{gbSub.length}</td>
                        <td style={{ padding:'5px 8px',textAlign:'right',color:avgGreenium!==null&&avgGreenium<0?T.teal:T.muted }}>{avgGreenium!==null?`${avgGreenium.toFixed(1)} bps`:'—'}</td>
                      </tr>
                    );
                  }).filter(Boolean)}
                </tbody>
              </table>
            </div>
          </div>

          <div style={{ background:T.card,border:`1px solid ${T.border}`,borderRadius:8,padding:16 }}>
            <div style={{ fontWeight:700,fontSize:14,marginBottom:12 }}>Issuer Type × Geography Premium Cross-Tab</div>
            <div style={{ overflowX:'auto' }}>
              <table style={{ width:'100%',borderCollapse:'collapse',fontSize:11 }}>
                <thead>
                  <tr style={{ background:T.sub }}>
                    <th style={{ padding:'5px 8px',textAlign:'left',color:T.muted }}>Issuer Type</th>
                    {GEOGRAPHIES.map(g=>(
                      <th key={g} style={{ padding:'5px 6px',textAlign:'right',color:T.muted,fontSize:10 }}>{g.substring(0,6)}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {ISSUER_TYPES.map((itype,ti)=>{
                    const typeSub=filtered.filter(x=>x.issuerType===itype);
                    return (
                      <tr key={itype} style={{ background:ti%2===0?T.card:T.sub }}>
                        <td style={{ padding:'4px 8px',fontWeight:600,fontSize:10 }}>{itype}</td>
                        {GEOGRAPHIES.map(g=>{
                          const sub=typeSub.filter(x=>x.geography===g);
                          const avg=sub.length?sub.reduce((s,x)=>s+x.physPremium+x.transPremium+x.residualPremium,0)/sub.length:null;
                          return (
                            <td key={g} style={{ padding:'4px 6px',textAlign:'right',color:avg===null?T.muted:avg>150?T.red:avg>80?T.amber:T.text,fontSize:10 }}>
                              {avg===null?'—':`${avg.toFixed(0)}`}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
