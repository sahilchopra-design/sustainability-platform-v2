import React, { useState, useMemo, useCallback } from 'react';
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

const MARKET_NAMES = [
  'EU ETS (Power)', 'EU ETS (Industry)', 'EU ETS (Aviation)', 'EU ETS (Shipping)',
  'UK ETS', 'California CCA', 'RGGI', 'Washington CCA', 'Oregon CCA',
  'Nova Scotia', 'Quebec QC', 'New Zealand NZU', 'Australia ERF',
  'South Korea K-ETS', 'Japan J-Credit', 'Tokyo Cap-Trade', 'Saitama ETS',
  'China ETS (Power)', 'China ETS (Steel)', 'China ETS (Cement)',
  'China ETS (Aluminium)', 'China ETS (Petrochemical)', 'China ETS (Chemical)',
  'China ETS (Paper)', 'China ETS (Aviation)',
  'Singapore CCS', 'Switzerland ETS', 'CORSIA Tier 1', 'Mexico ETS',
  'Brazil SBCE', 'India PAT Scheme', 'India CCTS', 'Israel ETS',
  'Kazakhstan ETS', 'Colombia CTax', 'Chile CTax', 'Peru CTax',
  'Thailand ETS Pilot', 'Vietnam VETS', 'Taiwan ETS',
];
const REGIONS = ['EU', 'Americas', 'Asia', 'Pacific', 'Africa', 'Global'];
const REGION_MAP = [
  'EU','EU','EU','EU','EU','Americas','Americas','Americas','Americas',
  'Americas','Americas','Pacific','Pacific','Asia','Asia','Asia','Asia',
  'Asia','Asia','Asia','Asia','Asia','Asia','Asia','Asia',
  'Asia','EU','Global','Americas','Americas','Asia','Asia','Asia',
  'Asia','Americas','Americas','Americas','Asia','Asia','Asia',
];
const CURRENCIES = ['EUR','EUR','EUR','EUR','GBP','USD','USD','USD','USD',
  'CAD','CAD','NZD','AUD','KRW','JPY','JPY','JPY',
  'CNY','CNY','CNY','CNY','CNY','CNY','CNY','CNY',
  'SGD','CHF','USD','MXN','BRL','INR','INR','ILS',
  'KZT','COP','CLP','PEN','THB','VND','TWD',
];
const PHASES = ['Phase 4','Phase 4','Phase 4','Phase 4','Phase 1','Compliance Period 2026',
  'CP3','Phase 2','Phase 1','Phase 2','Compliance 2024','CP4','ERF 2024',
  'Phase 3','FY2024','Phase 2','Phase 2','Phase 3','Phase 3','Phase 3',
  'Phase 3','Phase 3','Phase 3','Phase 3','Phase 3',
  'Phase 1','Phase 2','CORSIA 2024','Pilot','Phase 1','PAT-7','Pilot',
  'Phase 3','Phase 3','Phase 1','Phase 1','Phase 1','Pilot','Pilot','Phase 1',
];

const MARKETS = MARKET_NAMES.map((name, i) => {
  const basePrice = 5 + sr(i * 7) * 130;
  const change24h = (sr(i * 13 + 2) - 0.5) * 6;
  const changeYTD = (sr(i * 11 + 3) - 0.4) * 40;
  const volume = Math.round(50000 + sr(i * 17 + 4) * 2000000);
  const openInterest = Math.round(volume * (1 + sr(i * 19 + 5)));
  const hasFloor = sr(i * 23 + 6) > 0.4;
  const hasCeiling = sr(i * 29 + 7) > 0.6;
  return {
    id: i, name, region: REGION_MAP[i], currency: CURRENCIES[i],
    price: parseFloat(basePrice.toFixed(2)),
    change24h: parseFloat(change24h.toFixed(2)),
    changeYTD: parseFloat(changeYTD.toFixed(2)),
    volume, openInterest,
    policyPhase: PHASES[i],
    capTrajectory: parseFloat((-2 - sr(i * 31 + 8) * 6).toFixed(1)),
    linkage: sr(i * 37 + 9) > 0.7 ? 'Linked' : sr(i * 37 + 9) > 0.4 ? 'Considering' : 'Standalone',
    sectorCoverage: Math.round(20 + sr(i * 41 + 10) * 70),
    priceFloor: hasFloor ? parseFloat((basePrice * 0.3).toFixed(2)) : null,
    priceCeiling: hasCeiling ? parseFloat((basePrice * 2.5).toFixed(2)) : null,
    bankingAllowed: sr(i * 43 + 11) > 0.3,
    offsetRatio: parseFloat((sr(i * 47 + 12) * 0.15).toFixed(3)),
    currencyCode: CURRENCIES[i],
    regulatorName: ['ECHA','ECHA','ECHA','ECHA','DESNZ','CARB','RGGI Inc','Ecology','DEQ',
      'NS Env','MELCCFP','EPA NZ','CER','MOE Korea','MOE Japan','TMG','Saitama Gov',
      'MEE','MEE','MEE','MEE','MEE','MEE','MEE','MEE',
      'NEA','FOEN','ICAO','SEMARNAT','MCTI','BEE','BIS','Ministry',
      'MOE KZ','MADS','MMA','MINAM','ONEP','MONRE','EPA Taiwan'][i] || 'Regulator',
    ndcPrice: parseFloat((20 + sr(i * 53 + 13) * 180).toFixed(2)),
    usdRate: parseFloat((0.5 + sr(i * 59 + 14) * 3).toFixed(4)),
  };
});

const POLICY_EVENTS = Array.from({ length: 30 }, (_, i) => ({
  id: i,
  market: MARKET_NAMES[Math.floor(sr(i * 7) * MARKET_NAMES.length)],
  event: ['Cap reduction announced', 'New sector inclusion', 'Price floor revision',
    'Linking agreement signed', 'ETS review published', 'Offset limit change',
    'Free allocation update', 'Auction schedule released', 'Phase boundary'][Math.floor(sr(i * 11) * 9)],
  date: `2025-${String(Math.floor(1 + sr(i * 13) * 11)).padStart(2,'0')}-${String(Math.floor(1 + sr(i * 17) * 27)).padStart(2,'0')}`,
  impact: (sr(i * 19) - 0.5) * 20,
  status: ['Confirmed','Proposed','Implemented','Under Review'][Math.floor(sr(i * 23) * 4)],
}));

export default function LiveCarbonPriceMonitorPage() {
  const [activeTab, setActiveTab] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [regionFilter, setRegionFilter] = useState('All');
  const [phaseFilter, setPhaseFilter] = useState('All');
  const [currencyMode, setCurrencyMode] = useState('local');
  const [timeframe, setTimeframe] = useState('1M');
  const [sortCol, setSortCol] = useState('price');
  const [sortDir, setSortDir] = useState('desc');
  const [selectedMarket, setSelectedMarket] = useState(0);
  const [compareMarketA, setCompareMarketA] = useState(0);
  const [compareMarketB, setCompareMarketB] = useState(1);
  const [positionTonnes, setPositionTonnes] = useState(10000);
  const [detailMarket, setDetailMarket] = useState(null);

  const tabs = [
    'Market Overview', 'Price Dashboard', 'Regional Analysis',
    'Forward Curves', 'Portfolio P&L', 'Policy Intelligence', 'Summary & Export',
  ];

  const filteredMarkets = useMemo(() => {
    let out = [...MARKETS];
    if (searchTerm) out = out.filter(m => m.name.toLowerCase().includes(searchTerm.toLowerCase()));
    if (regionFilter !== 'All') out = out.filter(m => m.region === regionFilter);
    if (phaseFilter !== 'All') out = out.filter(m => m.policyPhase.includes(phaseFilter));
    out = out.sort((a, b) => {
      const v = sortDir === 'asc' ? 1 : -1;
      return (a[sortCol] > b[sortCol] ? 1 : -1) * v;
    });
    return out;
  }, [searchTerm, regionFilter, phaseFilter, sortCol, sortDir]);

  const displayPrice = useCallback((m) => {
    if (currencyMode === 'USD') return (m.price * m.usdRate).toFixed(2);
    return m.price.toFixed(2);
  }, [currencyMode]);

  const priceHistory = useMemo(() => {
    const periods = timeframe === '1D' ? 24 : timeframe === '1W' ? 7 : timeframe === '1M' ? 30
      : timeframe === '3M' ? 90 : timeframe === '1Y' ? 52 : 260;
    const base = MARKETS[selectedMarket].price;
    return Array.from({ length: Math.min(periods, 60) }, (_, i) => {
      const label = timeframe === '1D' ? `${i}h` : timeframe === '1Y' ? `W${i+1}` : `D${i+1}`;
      return {
        label,
        price: parseFloat((base * (0.8 + sr(selectedMarket * 100 + i) * 0.4)).toFixed(2)),
        volume: Math.round(50000 + sr(selectedMarket * 200 + i) * 1000000),
      };
    });
  }, [selectedMarket, timeframe]);

  const forwardCurve = useMemo(() => {
    const base = MARKETS[selectedMarket].price;
    return Array.from({ length: 7 }, (_, i) => ({
      year: 2025 + i,
      forward: parseFloat((base * (1 + (i + 1) * 0.04 + sr(selectedMarket * 300 + i) * 0.03)).toFixed(2)),
      implied: parseFloat((base * (1 + (i + 1) * 0.035 + sr(selectedMarket * 400 + i) * 0.025)).toFixed(2)),
    }));
  }, [selectedMarket]);

  const arbitrageSpread = useMemo(() => {
    const a = MARKETS[compareMarketA];
    const b = MARKETS[compareMarketB];
    const priceA = currencyMode === 'USD' ? a.price * a.usdRate : a.price;
    const priceB = currencyMode === 'USD' ? b.price * b.usdRate : b.price;
    return {
      spread: parseFloat((priceA - priceB).toFixed(2)),
      basis: parseFloat(((priceA - priceB) / (priceA || 1) * 100).toFixed(2)),
      marketA: a.name, marketB: b.name, priceA, priceB,
    };
  }, [compareMarketA, compareMarketB, currencyMode]);

  const portfolioPnL = useMemo(() => {
    return MARKETS.map(m => {
      const pnl = positionTonnes * (m.change24h || 0);
      const usdPnl = pnl * m.usdRate;
      return { ...m, pnl: parseFloat(pnl.toFixed(0)), usdPnl: parseFloat(usdPnl.toFixed(0)) };
    });
  }, [positionTonnes]);

  const regionStats = useMemo(() => {
    const groups = {};
    MARKETS.forEach(m => {
      if (!groups[m.region]) groups[m.region] = [];
      groups[m.region].push(m);
    });
    return Object.entries(groups).map(([region, markets]) => ({
      region,
      count: markets.length,
      avgPrice: parseFloat((markets.reduce((s, m) => s + m.price, 0) / markets.length).toFixed(2)),
      avgChangeYTD: parseFloat((markets.reduce((s, m) => s + m.changeYTD, 0) / markets.length).toFixed(2)),
      totalVolume: markets.reduce((s, m) => s + m.volume, 0),
    }));
  }, []);

  const budgetAdequacy = useMemo(() => {
    return MARKETS.map(m => ({
      name: m.name.length > 18 ? m.name.slice(0, 18) + '…' : m.name,
      price: m.price,
      ndcRequired: m.ndcPrice,
      adequacy: parseFloat((m.price / m.ndcPrice * 100).toFixed(1)),
    }));
  }, []);

  const kpis = useMemo(() => {
    const total = MARKETS.length;
    const avgPrice = MARKETS.reduce((s, m) => s + m.price, 0) / total;
    const risers = MARKETS.filter(m => m.change24h > 0).length;
    const totalVol = MARKETS.reduce((s, m) => s + m.volume, 0);
    const linked = MARKETS.filter(m => m.linkage === 'Linked').length;
    return { total, avgPrice: avgPrice.toFixed(2), risers, totalVol, linked };
  }, []);

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
        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
            <div style={{ width: 4, height: 32, background: T.indigo, borderRadius: 2 }} />
            <h1 style={{ fontSize: 24, fontWeight: 700, color: T.text, margin: 0 }}>Live Carbon Price Monitor</h1>
            <span style={{ background: T.indigo, color: '#fff', fontSize: 11, padding: '2px 8px', borderRadius: 4 }}>EP-CY1</span>
          </div>
          <p style={{ color: T.muted, margin: 0, marginLeft: 16, fontSize: 13 }}>
            40 global carbon markets · Real-time pricing · Forward curves · Portfolio P&L
          </p>
        </div>

        {/* KPI Row */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
          <KpiCard label="Markets Tracked" value={kpis.total} sub="40 jurisdictions" />
          <KpiCard label="Avg Price (Local)" value={`~${kpis.avgPrice}`} sub="across all ETS" color={T.indigo} />
          <KpiCard label="24h Risers" value={`${kpis.risers}/${kpis.total}`} sub="advancing markets" color={T.green} />
          <KpiCard label="Total Volume" value={`${(kpis.totalVol/1e6).toFixed(1)}M`} sub="allowances 24h" color={T.blue} />
          <KpiCard label="Linked Markets" value={kpis.linked} sub="cross-jurisdiction" color={T.teal} />
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: `1px solid ${T.border}`, paddingBottom: 0 }}>
          {tabs.map((t, i) => (
            <button key={i} onClick={() => setActiveTab(i)} style={{
              padding: '8px 16px', border: 'none', background: activeTab === i ? T.indigo : 'transparent',
              color: activeTab === i ? '#fff' : T.muted, borderRadius: '6px 6px 0 0', cursor: 'pointer',
              fontWeight: activeTab === i ? 600 : 400, fontSize: 13,
            }}>{t}</button>
          ))}
        </div>

        {/* Controls Row */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
          <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Search markets…"
            style={{ padding: '6px 12px', border: `1px solid ${T.border}`, borderRadius: 6, fontSize: 13, width: 180 }} />
          <select value={regionFilter} onChange={e => setRegionFilter(e.target.value)}
            style={{ padding: '6px 10px', border: `1px solid ${T.border}`, borderRadius: 6, fontSize: 13 }}>
            <option value="All">All Regions</option>
            {REGIONS.map(r => <option key={r}>{r}</option>)}
          </select>
          <select value={timeframe} onChange={e => setTimeframe(e.target.value)}
            style={{ padding: '6px 10px', border: `1px solid ${T.border}`, borderRadius: 6, fontSize: 13 }}>
            {['1D','1W','1M','3M','1Y','5Y'].map(t => <option key={t}>{t}</option>)}
          </select>
          <button onClick={() => setCurrencyMode(m => m === 'local' ? 'USD' : 'local')}
            style={{ padding: '6px 12px', background: currencyMode === 'USD' ? T.gold : T.card,
              border: `1px solid ${T.border}`, borderRadius: 6, fontSize: 13, cursor: 'pointer', fontWeight: 600 }}>
            {currencyMode === 'USD' ? '$ USD' : '⚡ Local Currency'}
          </button>
        </div>

        {/* TAB 0 — Market Overview */}
        {activeTab === 0 && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
                <h3 style={{ margin: '0 0 12px', fontSize: 14, color: T.text }}>Top 20 Carbon Prices ({currencyMode === 'USD' ? 'USD' : 'Local CCY'})</h3>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={[...MARKETS].sort((a,b) => b.price - a.price).slice(0,20).map(m => ({
                    name: m.name.split(' ').slice(0,2).join(' '),
                    price: currencyMode === 'USD' ? parseFloat((m.price * m.usdRate).toFixed(2)) : m.price,
                  }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="name" tick={{ fontSize: 9 }} angle={-35} textAnchor="end" height={55} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Bar dataKey="price" fill={T.indigo} radius={[2,2,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
                <h3 style={{ margin: '0 0 12px', fontSize: 14, color: T.text }}>NDC Budget Adequacy (Price vs Required)</h3>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={budgetAdequacy.slice(0,20)}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="name" tick={{ fontSize: 9 }} angle={-35} textAnchor="end" height={55} />
                    <YAxis tick={{ fontSize: 10 }} unit="%" />
                    <Tooltip formatter={v => `${v}%`} />
                    <ReferenceLine y={100} stroke={T.red} strokeDasharray="4 2" label={{ value: 'NDC aligned', fontSize: 10 }} />
                    <Bar dataKey="adequacy" fill={T.teal} radius={[2,2,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, overflow: 'hidden' }}>
              <div style={{ padding: '10px 16px', background: T.sub, borderBottom: `1px solid ${T.border}` }}>
                <span style={{ fontWeight: 600, fontSize: 13 }}>40 Carbon Markets — Sortable Table</span>
              </div>
              <div style={{ overflowX: 'auto', maxHeight: 380, overflowY: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead>
                    <tr style={{ background: T.sub }}>
                      {['name','region','price','change24h','changeYTD','volume','sectorCoverage','linkage','bankingAllowed'].map(col => (
                        <th key={col} onClick={() => handleSort(col)} style={{
                          padding: '8px 10px', textAlign: 'left', cursor: 'pointer', whiteSpace: 'nowrap',
                          color: sortCol === col ? T.indigo : T.text, fontWeight: 600, fontSize: 11,
                        }}>{col} {sortCol === col ? (sortDir === 'asc' ? '↑' : '↓') : ''}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredMarkets.map((m, idx) => (
                      <tr key={m.id} onClick={() => setDetailMarket(m)}
                        style={{ background: idx % 2 === 0 ? '#fff' : T.sub, cursor: 'pointer',
                          borderBottom: `1px solid ${T.border}` }}>
                        <td style={{ padding: '7px 10px', fontWeight: 600 }}>{m.name}</td>
                        <td style={{ padding: '7px 10px' }}><span style={{ background: T.sub, padding: '2px 6px', borderRadius: 4, fontSize: 11 }}>{m.region}</span></td>
                        <td style={{ padding: '7px 10px', fontWeight: 600, color: T.indigo }}>{displayPrice(m)} {currencyMode === 'USD' ? 'USD' : m.currency}</td>
                        <td style={{ padding: '7px 10px', color: m.change24h >= 0 ? T.green : T.red, fontWeight: 600 }}>{m.change24h >= 0 ? '+' : ''}{m.change24h}%</td>
                        <td style={{ padding: '7px 10px', color: m.changeYTD >= 0 ? T.green : T.red }}>{m.changeYTD >= 0 ? '+' : ''}{m.changeYTD}%</td>
                        <td style={{ padding: '7px 10px' }}>{(m.volume/1000).toFixed(0)}K</td>
                        <td style={{ padding: '7px 10px' }}>{m.sectorCoverage}%</td>
                        <td style={{ padding: '7px 10px' }}><span style={{ background: m.linkage === 'Linked' ? '#dcfce7' : m.linkage === 'Considering' ? '#fef3c7' : '#f3f4f6', color: m.linkage === 'Linked' ? T.green : m.linkage === 'Considering' ? T.amber : T.muted, padding: '2px 6px', borderRadius: 4, fontSize: 11 }}>{m.linkage}</span></td>
                        <td style={{ padding: '7px 10px', color: m.bankingAllowed ? T.green : T.red }}>{m.bankingAllowed ? '✓' : '✗'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            {detailMarket && (
              <div style={{ background: T.card, border: `1px solid ${T.indigo}`, borderRadius: 8, padding: 16, marginTop: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <h3 style={{ margin: 0, fontSize: 15, color: T.indigo }}>{detailMarket.name} — Detail</h3>
                  <button onClick={() => setDetailMarket(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: T.muted }}>×</button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
                  {[
                    ['Price', `${displayPrice(detailMarket)} ${currencyMode === 'USD' ? 'USD' : detailMarket.currency}`],
                    ['Policy Phase', detailMarket.policyPhase],
                    ['Cap Trajectory', `${detailMarket.capTrajectory}% p.a.`],
                    ['Price Floor', detailMarket.priceFloor ? `${detailMarket.priceFloor} ${detailMarket.currency}` : 'None'],
                    ['Price Ceiling', detailMarket.priceCeiling ? `${detailMarket.priceCeiling} ${detailMarket.currency}` : 'None'],
                    ['Offset Ratio', `${(detailMarket.offsetRatio * 100).toFixed(1)}%`],
                    ['Sector Coverage', `${detailMarket.sectorCoverage}%`],
                    ['Regulator', detailMarket.regulatorName],
                    ['NDC Required Price', `${detailMarket.ndcPrice} ${detailMarket.currency}`],
                    ['Budget Adequacy', `${(detailMarket.price / detailMarket.ndcPrice * 100).toFixed(1)}%`],
                    ['Open Interest', `${(detailMarket.openInterest/1000).toFixed(0)}K`],
                    ['Banking Allowed', detailMarket.bankingAllowed ? 'Yes' : 'No'],
                  ].map(([k, v]) => (
                    <div key={k} style={{ background: T.sub, borderRadius: 6, padding: '8px 12px' }}>
                      <div style={{ fontSize: 10, color: T.muted, textTransform: 'uppercase' }}>{k}</div>
                      <div style={{ fontSize: 13, fontWeight: 600, marginTop: 2 }}>{v}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 1 — Price Dashboard */}
        {activeTab === 1 && (
          <div>
            <div style={{ marginBottom: 12, display: 'flex', gap: 10, alignItems: 'center' }}>
              <label style={{ fontSize: 13, color: T.text, fontWeight: 600 }}>Market:</label>
              <select value={selectedMarket} onChange={e => setSelectedMarket(Number(e.target.value))}
                style={{ padding: '6px 10px', border: `1px solid ${T.border}`, borderRadius: 6, fontSize: 13 }}>
                {MARKETS.map((m, i) => <option key={i} value={i}>{m.name}</option>)}
              </select>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
                <h3 style={{ margin: '0 0 12px', fontSize: 14 }}>{MARKETS[selectedMarket].name} — Price History ({timeframe})</h3>
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={priceHistory}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Line type="monotone" dataKey="price" stroke={T.indigo} dot={false} strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
                <h3 style={{ margin: '0 0 12px', fontSize: 14 }}>Volume ({timeframe})</h3>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={priceHistory}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Bar dataKey="volume" fill={T.teal} radius={[2,2,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16, gridColumn: 'span 2' }}>
                <h3 style={{ margin: '0 0 12px', fontSize: 14 }}>24h Change — All Markets</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={[...MARKETS].sort((a,b) => b.change24h - a.change24h).slice(0,25).map(m => ({
                    name: m.name.split(' ').slice(0,2).join(' '),
                    change: m.change24h,
                  }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="name" tick={{ fontSize: 9 }} angle={-30} textAnchor="end" height={50} />
                    <YAxis tick={{ fontSize: 10 }} unit="%" />
                    <ReferenceLine y={0} stroke={T.border} />
                    <Tooltip />
                    <Bar dataKey="change" fill={T.green} radius={[2,2,0,0]}
                      label={false}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2 — Regional Analysis */}
        {activeTab === 2 && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
                <h3 style={{ margin: '0 0 12px', fontSize: 14 }}>Average Price by Region</h3>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={regionStats}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="region" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Bar dataKey="avgPrice" fill={T.indigo} radius={[3,3,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
                <h3 style={{ margin: '0 0 12px', fontSize: 14 }}>YTD Change by Region</h3>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={regionStats}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="region" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 10 }} unit="%" />
                    <ReferenceLine y={0} stroke={T.border} />
                    <Tooltip />
                    <Bar dataKey="avgChangeYTD" fill={T.teal} radius={[3,3,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: T.sub }}>
                    {['Region','Markets','Avg Price','YTD Change','Total Volume'].map(h => (
                      <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600, fontSize: 12 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {regionStats.map((r, i) => (
                    <tr key={r.region} style={{ background: i % 2 === 0 ? '#fff' : T.sub, borderBottom: `1px solid ${T.border}` }}>
                      <td style={{ padding: '9px 14px', fontWeight: 600 }}>{r.region}</td>
                      <td style={{ padding: '9px 14px' }}>{r.count}</td>
                      <td style={{ padding: '9px 14px', color: T.indigo, fontWeight: 600 }}>{r.avgPrice.toFixed(2)}</td>
                      <td style={{ padding: '9px 14px', color: r.avgChangeYTD >= 0 ? T.green : T.red, fontWeight: 600 }}>{r.avgChangeYTD >= 0 ? '+' : ''}{r.avgChangeYTD.toFixed(2)}%</td>
                      <td style={{ padding: '9px 14px' }}>{(r.totalVolume/1e6).toFixed(2)}M</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3 — Forward Curves */}
        {activeTab === 3 && (
          <div>
            <div style={{ marginBottom: 12, display: 'flex', gap: 10, alignItems: 'center' }}>
              <label style={{ fontSize: 13, fontWeight: 600 }}>Select Market:</label>
              <select value={selectedMarket} onChange={e => setSelectedMarket(Number(e.target.value))}
                style={{ padding: '6px 10px', border: `1px solid ${T.border}`, borderRadius: 6, fontSize: 13 }}>
                {MARKETS.map((m, i) => <option key={i} value={i}>{m.name}</option>)}
              </select>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
                <h3 style={{ margin: '0 0 12px', fontSize: 14 }}>Forward Curve — {MARKETS[selectedMarket].name} (7-Year)</h3>
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={forwardCurve}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="forward" stroke={T.indigo} strokeWidth={2} dot={{ r: 4 }} name="Forward Price" />
                    <Line type="monotone" dataKey="implied" stroke={T.gold} strokeWidth={2} dot={{ r: 4 }} name="Implied Fwd" strokeDasharray="5 3" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
                <h3 style={{ margin: '0 0 12px', fontSize: 14 }}>Term Structure Table</h3>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead>
                    <tr style={{ background: T.sub }}>
                      <th style={{ padding: '7px 10px', textAlign: 'left' }}>Year</th>
                      <th style={{ padding: '7px 10px', textAlign: 'right' }}>Forward</th>
                      <th style={{ padding: '7px 10px', textAlign: 'right' }}>Implied</th>
                    </tr>
                  </thead>
                  <tbody>
                    {forwardCurve.map((f, i) => (
                      <tr key={i} style={{ borderBottom: `1px solid ${T.border}`, background: i % 2 === 0 ? '#fff' : T.sub }}>
                        <td style={{ padding: '7px 10px', fontWeight: 600 }}>{f.year}</td>
                        <td style={{ padding: '7px 10px', textAlign: 'right', color: T.indigo }}>{f.forward.toFixed(2)}</td>
                        <td style={{ padding: '7px 10px', textAlign: 'right', color: T.gold }}>{f.implied.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div style={{ marginTop: 16, background: T.sub, borderRadius: 6, padding: 12 }}>
                  <div style={{ fontSize: 11, color: T.muted, marginBottom: 6 }}>ARBITRAGE CALCULATOR</div>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                    <select value={compareMarketA} onChange={e => setCompareMarketA(Number(e.target.value))}
                      style={{ flex: 1, padding: '5px 8px', border: `1px solid ${T.border}`, borderRadius: 5, fontSize: 11 }}>
                      {MARKETS.map((m, i) => <option key={i} value={i}>{m.name}</option>)}
                    </select>
                    <select value={compareMarketB} onChange={e => setCompareMarketB(Number(e.target.value))}
                      style={{ flex: 1, padding: '5px 8px', border: `1px solid ${T.border}`, borderRadius: 5, fontSize: 11 }}>
                      {MARKETS.map((m, i) => <option key={i} value={i}>{m.name}</option>)}
                    </select>
                  </div>
                  <div style={{ fontSize: 12 }}>Spread: <strong style={{ color: arbitrageSpread.spread > 0 ? T.green : T.red }}>{arbitrageSpread.spread > 0 ? '+' : ''}{arbitrageSpread.spread.toFixed(2)}</strong></div>
                  <div style={{ fontSize: 12 }}>Basis: <strong>{arbitrageSpread.basis.toFixed(2)}%</strong></div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4 — Portfolio P&L */}
        {activeTab === 4 && (
          <div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16, marginBottom: 16 }}>
              <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 16 }}>
                <label style={{ fontSize: 13, fontWeight: 600 }}>Carbon Position (tonnes):</label>
                <input type="number" value={positionTonnes} onChange={e => setPositionTonnes(Number(e.target.value))}
                  style={{ padding: '6px 10px', border: `1px solid ${T.border}`, borderRadius: 6, fontSize: 13, width: 140 }} />
                <span style={{ fontSize: 12, color: T.muted }}>P&L = position × 24h price change per market</span>
              </div>
              <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
                <div style={{ flex: 1, background: T.sub, borderRadius: 8, padding: '12px 16px' }}>
                  <div style={{ fontSize: 11, color: T.muted }}>BEST MARKET P&L</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: T.green, marginTop: 4 }}>
                    +{Math.max(...portfolioPnL.map(m => m.pnl)).toLocaleString()} units
                  </div>
                  <div style={{ fontSize: 11, color: T.muted }}>{portfolioPnL.sort((a,b)=>b.pnl-a.pnl)[0]?.name}</div>
                </div>
                <div style={{ flex: 1, background: T.sub, borderRadius: 8, padding: '12px 16px' }}>
                  <div style={{ fontSize: 11, color: T.muted }}>WORST MARKET P&L</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: T.red, marginTop: 4 }}>
                    {Math.min(...portfolioPnL.map(m => m.pnl)).toLocaleString()} units
                  </div>
                  <div style={{ fontSize: 11, color: T.muted }}>{[...portfolioPnL].sort((a,b)=>a.pnl-b.pnl)[0]?.name}</div>
                </div>
                <div style={{ flex: 1, background: T.sub, borderRadius: 8, padding: '12px 16px' }}>
                  <div style={{ fontSize: 11, color: T.muted }}>AVG 24H P&L</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: T.indigo, marginTop: 4 }}>
                    {(portfolioPnL.reduce((s, m) => s + m.pnl, 0) / portfolioPnL.length).toFixed(0)}
                  </div>
                </div>
              </div>
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
              <h3 style={{ margin: '0 0 12px', fontSize: 14 }}>P&L by Market ({positionTonnes.toLocaleString()} tonnes)</h3>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={[...portfolioPnL].sort((a,b) => b.pnl - a.pnl).slice(0,25).map(m => ({
                  name: m.name.split(' ').slice(0,2).join(' '), pnl: m.pnl
                }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="name" tick={{ fontSize: 9 }} angle={-30} textAnchor="end" height={50} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <ReferenceLine y={0} stroke={T.border} />
                  <Tooltip />
                  <Bar dataKey="pnl" fill={T.indigo} radius={[2,2,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* TAB 5 — Policy Intelligence */}
        {activeTab === 5 && (
          <div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, overflow: 'hidden', marginBottom: 16 }}>
              <div style={{ padding: '10px 16px', background: T.sub, borderBottom: `1px solid ${T.border}` }}>
                <span style={{ fontWeight: 600, fontSize: 13 }}>Regulatory Events & ETS Policy Changes (30 events)</span>
              </div>
              <div style={{ overflowX: 'auto', maxHeight: 400, overflowY: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead>
                    <tr style={{ background: T.sub }}>
                      {['Market','Event','Date','Price Impact','Status'].map(h => (
                        <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600, fontSize: 11 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {POLICY_EVENTS.map((e, idx) => (
                      <tr key={e.id} style={{ background: idx % 2 === 0 ? '#fff' : T.sub, borderBottom: `1px solid ${T.border}` }}>
                        <td style={{ padding: '7px 12px', fontWeight: 600 }}>{e.market}</td>
                        <td style={{ padding: '7px 12px' }}>{e.event}</td>
                        <td style={{ padding: '7px 12px', color: T.muted }}>{e.date}</td>
                        <td style={{ padding: '7px 12px', color: e.impact >= 0 ? T.green : T.red, fontWeight: 600 }}>{e.impact >= 0 ? '+' : ''}{e.impact.toFixed(1)}%</td>
                        <td style={{ padding: '7px 12px' }}>
                          <span style={{ background: e.status === 'Implemented' ? '#dcfce7' : e.status === 'Confirmed' ? '#dbeafe' : e.status === 'Proposed' ? '#fef3c7' : '#f3f4f6',
                            color: e.status === 'Implemented' ? T.green : e.status === 'Confirmed' ? T.blue : e.status === 'Proposed' ? T.amber : T.muted,
                            padding: '2px 8px', borderRadius: 4, fontSize: 11 }}>{e.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
              {MARKETS.filter(m => m.linkage === 'Linked').map(m => (
                <div key={m.id} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 12 }}>
                  <div style={{ fontWeight: 600, fontSize: 12, color: T.indigo, marginBottom: 4 }}>{m.name}</div>
                  <div style={{ fontSize: 11, color: T.muted }}>Linked · {m.policyPhase} · {m.regulatorName}</div>
                  <div style={{ fontSize: 12, marginTop: 4 }}>Cap Trajectory: <strong>{m.capTrajectory}% p.a.</strong></div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 6 — Summary & Export */}
        {activeTab === 6 && (
          <div>
            {/* Carbon Budget Adequacy Analysis */}
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16, marginBottom: 16 }}>
              <h3 style={{ margin: '0 0 12px', fontSize: 14 }}>Carbon Price Sensitivity Analysis — Portfolio P&L by Scenario</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 10, marginBottom: 14 }}>
                {[-20,-10,0,10,20].map(shock => {
                  const totalPnL = MARKETS.reduce((s, m) => s + positionTonnes * (m.price * shock / 100), 0);
                  return (
                    <div key={shock} style={{ background: T.sub, borderRadius: 8, padding: '10px 14px', borderTop: `3px solid ${shock < 0 ? T.red : shock === 0 ? T.muted : T.green}` }}>
                      <div style={{ fontSize: 11, color: T.muted }}>Price Shock: {shock > 0 ? '+' : ''}{shock}%</div>
                      <div style={{ fontSize: 18, fontWeight: 700, color: shock < 0 ? T.red : shock === 0 ? T.muted : T.green, marginTop: 4 }}>
                        {totalPnL >= 0 ? '+' : ''}{(totalPnL / 1e6).toFixed(2)}M
                      </div>
                      <div style={{ fontSize: 10, color: T.muted }}>across all 40 markets</div>
                    </div>
                  );
                })}
              </div>
              <div style={{ background: T.sub, borderRadius: 8, padding: 12 }}>
                <h4 style={{ margin: '0 0 8px', fontSize: 12, color: T.text }}>Market Sensitivity Ranking (P&L per 1% price move, {positionTonnes.toLocaleString()} tonnes)</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 6 }}>
                  {[...MARKETS].sort((a,b) => b.price - a.price).slice(0,8).map(m => (
                    <div key={m.id} style={{ background: T.card, borderRadius: 5, padding: '6px 8px' }}>
                      <div style={{ fontSize: 10, color: T.muted }}>{m.name.split(' ').slice(0,3).join(' ')}</div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: T.indigo }}>{(positionTonnes * m.price * 0.01).toFixed(0)}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            {/* Forward Curve Summary */}
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16, marginBottom: 16 }}>
              <h3 style={{ margin: '0 0 12px', fontSize: 14 }}>Top 10 Markets — Forward Curve Projections (2025–2031)</h3>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                  <thead>
                    <tr style={{ background: T.sub }}>
                      <th style={{ padding: '6px 10px', textAlign: 'left', fontWeight: 600 }}>Market</th>
                      {[2025,2026,2027,2028,2029,2030,2031].map(yr => (
                        <th key={yr} style={{ padding: '6px 10px', textAlign: 'right', fontWeight: 600 }}>{yr}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[...MARKETS].sort((a,b)=>b.price-a.price).slice(0,10).map((m, idx) => (
                      <tr key={m.id} style={{ background: idx%2===0?'#fff':T.sub, borderBottom:`1px solid ${T.border}` }}>
                        <td style={{ padding: '5px 10px', fontWeight: 600 }}>{m.name}</td>
                        {Array.from({length:7},(_,i)=>(
                          <td key={i} style={{ padding: '5px 10px', textAlign: 'right', color: T.indigo }}>
                            {(m.price*(1+(i+1)*0.04+sr(m.id*300+i)*0.03)).toFixed(1)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16, marginBottom: 16 }}>
              <h3 style={{ margin: '0 0 16px', fontSize: 15, color: T.text }}>Live Carbon Price Monitor — Full KPI Summary</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 16 }}>
                {[
                  ['Total Markets', '40'],
                  ['Avg Price (all markets)', `~${kpis.avgPrice} local CCY`],
                  ['Markets with Price Floor', MARKETS.filter(m => m.priceFloor !== null).length],
                  ['Markets with Price Ceiling', MARKETS.filter(m => m.priceCeiling !== null).length],
                  ['Banking Allowed', MARKETS.filter(m => m.bankingAllowed).length],
                  ['Linked ETS', MARKETS.filter(m => m.linkage === 'Linked').length],
                  ['Considering Linkage', MARKETS.filter(m => m.linkage === 'Considering').length],
                  ['NDC Adequate (>50%)', MARKETS.filter(m => m.price / m.ndcPrice > 0.5).length],
                  ['24h Risers', kpis.risers],
                  ['24h Fallers', MARKETS.length - kpis.risers],
                  ['Total Volume (24h)', `${(kpis.totalVol/1e6).toFixed(1)}M allowances`],
                  ['Highest Price Market', [...MARKETS].sort((a,b)=>b.price-a.price)[0].name],
                ].map(([k, v]) => (
                  <div key={k} style={{ background: T.sub, borderRadius: 6, padding: '10px 14px' }}>
                    <div style={{ fontSize: 11, color: T.muted, textTransform: 'uppercase' }}>{k}</div>
                    <div style={{ fontSize: 14, fontWeight: 700, marginTop: 3, color: T.text }}>{v}</div>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, overflow: 'hidden' }}>
              <div style={{ padding: '10px 16px', background: T.sub, borderBottom: `1px solid ${T.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 600, fontSize: 13 }}>Full Market Export Table</span>
                <span style={{ fontSize: 12, color: T.muted }}>40 markets · all fields</span>
              </div>
              <div style={{ overflowX: 'auto', maxHeight: 420, overflowY: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                  <thead>
                    <tr style={{ background: T.sub }}>
                      {['Market','Region','Price','CCY','Change 24h','YTD','Volume','Cap Traj','Linkage','Phase','NDC Price','Adequacy %'].map(h => (
                        <th key={h} style={{ padding: '7px 10px', textAlign: 'left', fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {MARKETS.map((m, idx) => (
                      <tr key={m.id} style={{ background: idx % 2 === 0 ? '#fff' : T.sub, borderBottom: `1px solid ${T.border}` }}>
                        <td style={{ padding: '6px 10px', fontWeight: 600, whiteSpace: 'nowrap' }}>{m.name}</td>
                        <td style={{ padding: '6px 10px' }}>{m.region}</td>
                        <td style={{ padding: '6px 10px', color: T.indigo, fontWeight: 600 }}>{m.price.toFixed(2)}</td>
                        <td style={{ padding: '6px 10px' }}>{m.currency}</td>
                        <td style={{ padding: '6px 10px', color: m.change24h >= 0 ? T.green : T.red }}>{m.change24h >= 0 ? '+' : ''}{m.change24h}%</td>
                        <td style={{ padding: '6px 10px', color: m.changeYTD >= 0 ? T.green : T.red }}>{m.changeYTD >= 0 ? '+' : ''}{m.changeYTD}%</td>
                        <td style={{ padding: '6px 10px' }}>{(m.volume/1000).toFixed(0)}K</td>
                        <td style={{ padding: '6px 10px' }}>{m.capTrajectory}%</td>
                        <td style={{ padding: '6px 10px' }}>{m.linkage}</td>
                        <td style={{ padding: '6px 10px', whiteSpace: 'nowrap' }}>{m.policyPhase}</td>
                        <td style={{ padding: '6px 10px' }}>{m.ndcPrice.toFixed(2)}</td>
                        <td style={{ padding: '6px 10px', color: m.price/m.ndcPrice > 0.5 ? T.green : T.red, fontWeight: 600 }}>{(m.price/m.ndcPrice*100).toFixed(1)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            {/* Linked Markets Analysis */}
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16, marginBottom: 16 }}>
              <h3 style={{ margin: '0 0 12px', fontSize: 14 }}>ETS Linkage & Banking Analysis</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
                <div style={{ background: T.sub, borderRadius: 8, padding: '10px 14px' }}>
                  <div style={{ fontSize: 11, color: T.muted, marginBottom: 6 }}>BANKING ALLOWED STATS</div>
                  <div style={{ fontSize: 24, fontWeight: 700, color: T.teal }}>{MARKETS.filter(m=>m.bankingAllowed).length}/40</div>
                  <div style={{ fontSize: 11, color: T.muted }}>markets allow banking</div>
                  <div style={{ marginTop: 6, fontSize: 12 }}>Avg Price (banking): <strong style={{color:T.teal}}>{(MARKETS.filter(m=>m.bankingAllowed).reduce((s,m)=>s+m.price,0) / (MARKETS.filter(m=>m.bankingAllowed).length||1)).toFixed(2)}</strong></div>
                  <div style={{ fontSize: 12 }}>Avg Price (no banking): <strong style={{color:T.amber}}>{(MARKETS.filter(m=>!m.bankingAllowed).reduce((s,m)=>s+m.price,0) / (MARKETS.filter(m=>!m.bankingAllowed).length||1)).toFixed(2)}</strong></div>
                </div>
                <div style={{ background: T.sub, borderRadius: 8, padding: '10px 14px' }}>
                  <div style={{ fontSize: 11, color: T.muted, marginBottom: 6 }}>PRICE FLOOR MARKETS</div>
                  <div style={{ fontSize: 24, fontWeight: 700, color: T.indigo }}>{MARKETS.filter(m=>m.priceFloor!==null).length}/40</div>
                  <div style={{ fontSize: 11, color: T.muted }}>markets have price floors</div>
                  <div style={{ marginTop: 6, fontSize: 12 }}>Avg Floor: <strong>{(MARKETS.filter(m=>m.priceFloor!==null).reduce((s,m)=>s+(m.priceFloor||0),0)/(MARKETS.filter(m=>m.priceFloor!==null).length||1)).toFixed(2)}</strong></div>
                  <div style={{ fontSize: 12 }}>Price Ceiling Markets: <strong>{MARKETS.filter(m=>m.priceCeiling!==null).length}</strong></div>
                </div>
                <div style={{ background: T.sub, borderRadius: 8, padding: '10px 14px' }}>
                  <div style={{ fontSize: 11, color: T.muted, marginBottom: 6 }}>CAP TRAJECTORY STATS</div>
                  <div style={{ fontSize: 24, fontWeight: 700, color: T.orange }}>{(MARKETS.reduce((s,m)=>s+m.capTrajectory,0)/MARKETS.length).toFixed(2)}% p.a.</div>
                  <div style={{ fontSize: 11, color: T.muted }}>avg annual cap reduction</div>
                  <div style={{ marginTop: 6, fontSize: 12 }}>Steepest: <strong>{[...MARKETS].sort((a,b)=>a.capTrajectory-b.capTrajectory)[0]?.capTrajectory}%</strong></div>
                  <div style={{ fontSize: 12 }}>Shallowest: <strong>{[...MARKETS].sort((a,b)=>b.capTrajectory-a.capTrajectory)[0]?.capTrajectory}%</strong></div>
                </div>
              </div>
            </div>
            {/* Offset ratios */}
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16, marginBottom: 16 }}>
              <h3 style={{ margin: '0 0 12px', fontSize: 14 }}>Offset Ratio & Sector Coverage — All 40 Markets</h3>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                  <thead>
                    <tr style={{ background: T.sub }}>
                      {['Market','Offset Ratio','Sector Coverage','Price Floor','Price Ceiling','Regulator'].map(h=>(
                        <th key={h} style={{ padding:'5px 8px', textAlign:'left', fontWeight:600 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {MARKETS.map((m,idx)=>(
                      <tr key={m.id} style={{ background:idx%2===0?'#fff':T.sub, borderBottom:`1px solid ${T.border}` }}>
                        <td style={{ padding:'4px 8px', fontWeight:600, fontSize:11 }}>{m.name}</td>
                        <td style={{ padding:'4px 8px' }}>{(m.offsetRatio*100).toFixed(1)}%</td>
                        <td style={{ padding:'4px 8px' }}>{m.sectorCoverage}%</td>
                        <td style={{ padding:'4px 8px', color: m.priceFloor ? T.teal : T.muted }}>{m.priceFloor ? `${m.priceFloor} ${m.currency}` : 'None'}</td>
                        <td style={{ padding:'4px 8px', color: m.priceCeiling ? T.purple : T.muted }}>{m.priceCeiling ? `${m.priceCeiling} ${m.currency}` : 'None'}</td>
                        <td style={{ padding:'4px 8px', fontSize:10 }}>{m.regulatorName}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Market Intelligence Footer — always visible */}
        <div style={{ marginTop: 20, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 14 }}>
            <h4 style={{ margin: '0 0 8px', fontSize: 13, color: T.text }}>Highest 24h Gainers (Top 5)</h4>
            {[...MARKETS].sort((a,b)=>b.change24h-a.change24h).slice(0,5).map((m,i)=>(
              <div key={m.id} style={{ display:'flex', justifyContent:'space-between', padding:'4px 0', borderBottom:`1px solid ${T.border}`, fontSize:12 }}>
                <span style={{ fontWeight:600 }}>{m.name.split(' ').slice(0,3).join(' ')}</span>
                <span style={{ color:T.green, fontWeight:700 }}>+{m.change24h}%</span>
              </div>
            ))}
          </div>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 14 }}>
            <h4 style={{ margin: '0 0 8px', fontSize: 13, color: T.text }}>Largest 24h Decliners (Top 5)</h4>
            {[...MARKETS].sort((a,b)=>a.change24h-b.change24h).slice(0,5).map((m,i)=>(
              <div key={m.id} style={{ display:'flex', justifyContent:'space-between', padding:'4px 0', borderBottom:`1px solid ${T.border}`, fontSize:12 }}>
                <span style={{ fontWeight:600 }}>{m.name.split(' ').slice(0,3).join(' ')}</span>
                <span style={{ color:T.red, fontWeight:700 }}>{m.change24h}%</span>
              </div>
            ))}
          </div>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 14 }}>
            <h4 style={{ margin: '0 0 8px', fontSize: 13, color: T.text }}>Highest Volume Markets (Top 5)</h4>
            {[...MARKETS].sort((a,b)=>b.volume-a.volume).slice(0,5).map((m,i)=>(
              <div key={m.id} style={{ display:'flex', justifyContent:'space-between', padding:'4px 0', borderBottom:`1px solid ${T.border}`, fontSize:12 }}>
                <span style={{ fontWeight:600 }}>{m.name.split(' ').slice(0,3).join(' ')}</span>
                <span style={{ color:T.blue, fontWeight:700 }}>{(m.volume/1e6).toFixed(2)}M</span>
              </div>
            ))}
          </div>
        </div>
        {/* Regulatory Phase Summary */}
        <div style={{ marginTop: 14, background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 14 }}>
          <h4 style={{ margin: '0 0 10px', fontSize: 13, color: T.text }}>ETS Phase Distribution — Market Count by Phase</h4>
          <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
            {Array.from(new Set(MARKETS.map(m=>m.policyPhase))).map(phase=>{
              const markets = MARKETS.filter(m=>m.policyPhase===phase);
              const avgPrice = markets.reduce((s,m)=>s+m.price,0)/markets.length;
              return (
                <div key={phase} style={{ background:T.sub, borderRadius:6, padding:'6px 10px', minWidth:120 }}>
                  <div style={{ fontSize:10, color:T.muted }}>{phase}</div>
                  <div style={{ fontSize:13, fontWeight:700, color:T.indigo }}>{markets.length} markets</div>
                  <div style={{ fontSize:11 }}>Avg: {avgPrice.toFixed(1)}</div>
                </div>
              );
            })}
          </div>
        </div>
        {/* Open Interest Leaders */}
        <div style={{ marginTop:14, background:T.card, border:`1px solid ${T.border}`, borderRadius:8, padding:14 }}>
          <h4 style={{ margin:'0 0 10px', fontSize:13 }}>Open Interest Leaders (Top 10)</h4>
          <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
            {[...MARKETS].sort((a,b)=>b.openInterest-a.openInterest).slice(0,10).map(m=>(
              <div key={m.id} style={{ background:T.sub, borderRadius:6, padding:'6px 10px', minWidth:120 }}>
                <div style={{ fontSize:10, color:T.muted }}>{m.name.split(' ').slice(0,3).join(' ')}</div>
                <div style={{ fontSize:14, fontWeight:700, color:T.navy, marginTop:2 }}>{(m.openInterest/1e6).toFixed(2)}M</div>
                <div style={{ fontSize:10, color:T.muted }}>OI · {m.region}</div>
              </div>
            ))}
          </div>
        </div>
        {/* Currency Exposure Summary */}
        <div style={{ marginTop: 14, background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 14 }}>
          <h4 style={{ margin: '0 0 10px', fontSize: 13, color: T.text }}>Currency Exposure — Markets by Currency</h4>
          <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
            {Array.from(new Set(MARKETS.map(m=>m.currency))).map(ccy=>{
              const markets = MARKETS.filter(m=>m.currency===ccy);
              const totalVol = markets.reduce((s,m)=>s+m.volume,0);
              const avgPrice = markets.reduce((s,m)=>s+m.price,0)/markets.length;
              return (
                <div key={ccy} style={{ background:T.sub, borderRadius:6, padding:'6px 10px', minWidth:80 }}>
                  <div style={{ fontSize:13, fontWeight:800, color:T.gold }}>{ccy}</div>
                  <div style={{ fontSize:11 }}>{markets.length} markets</div>
                  <div style={{ fontSize:11 }}>Avg: {avgPrice.toFixed(1)}</div>
                  <div style={{ fontSize:10, color:T.muted }}>Vol: {(totalVol/1e6).toFixed(1)}M</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
