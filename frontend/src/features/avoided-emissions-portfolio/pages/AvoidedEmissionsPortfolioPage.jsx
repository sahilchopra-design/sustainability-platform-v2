import React, { useState, useMemo, useCallback } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, AreaChart, Area, Cell, Legend, PieChart, Pie,
  ScatterChart, Scatter
} from 'recharts';

const T={bg:'#f6f4f0',surface:'#ffffff',surfaceH:'#f0ede7',border:'#e5e0d8',borderL:'#d5cfc5',navy:'#1b3a5c',navyL:'#2c5a8c',gold:'#c5a96a',goldL:'#d4be8a',sage:'#5a8a6a',sageL:'#7ba67d',teal:'#5a8a6a',text:'#1b3a5c',textSec:'#5c6b7e',textMut:'#9aa3ae',red:'#dc2626',green:'#16a34a',amber:'#d97706',font:"'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"};

const sr=(s)=>{let x=Math.sin(s+1)*10000;return x-Math.floor(x);};

const TABS=['Portfolio Climate Impact','Climate Solution Exposure','Impact Attribution','Investment Impact Report'];

const SECTORS=['Clean Energy','Energy Efficiency','Electric Transport','Sustainable Agriculture','Waste Management','Water Solutions','Nature-Based Solutions','Digital Climate Tech','Industrial Decarbonisation','Green Buildings','Hydrogen Economy','Carbon Capture','Circular Economy','Climate Finance','Sustainable Materials'];

const SOLUTION_CATS=['Clean Energy','Efficiency','Transport','Agriculture','Waste','Water','Nature','Digital'];

const CREDIBILITY_TIERS=['High','Medium-High','Medium','Medium-Low','Low'];

const QUARTERS=['Q1 2024','Q2 2024','Q3 2024','Q4 2024','Q1 2025','Q2 2025','Q3 2025','Q4 2025','Q1 2026','Q2 2026','Q3 2026','Q4 2026'];

const COMPANY_PREFIXES=['Solaris','Verdant','EcoVolt','GreenTech','AquaPure','TerraFlow','WindPower','BioSync','CleanAir','HydroGen','CircuLoop','NatureCore','SunGrid','LeafBridge','OceanWind','AgriSmart','WasteZero','CarbonLock','EcoMotion','PureStream','GridShift','RenewCo','FusionGreen','ClimaShield','EarthPulse','NetZero','PlanetWise','GreenCore','SkyPower','AeroClean'];

const COMPANY_SUFFIXES=['Energy','Solutions','Technologies','Power','Systems','Corp','Holdings','Group','Global','Inc','Partners','Dynamics','Labs','Ventures','Capital'];

const SDG_MAP = {7:'Affordable & Clean Energy',9:'Industry Innovation',11:'Sustainable Cities',12:'Responsible Consumption',13:'Climate Action',14:'Life Below Water',15:'Life on Land'};

const fmt=n=>{if(Math.abs(n)>=1e9) return (n/1e9).toFixed(1)+'B';if(Math.abs(n)>=1e6) return (n/1e6).toFixed(1)+'M';if(Math.abs(n)>=1e3) return (n/1e3).toFixed(1)+'K';return n.toFixed(1);};
const fmtPct=n=>(n*100).toFixed(1)+'%';
const fmtInt=n=>Math.round(n).toLocaleString();

const SECTOR_COLORS = {
  'Clean Energy':'#1b3a5c','Energy Efficiency':'#2c5a8c','Electric Transport':'#5a8a6a',
  'Sustainable Agriculture':'#c5a96a','Waste Management':'#7ba67d','Water Solutions':'#4a90a4',
  'Nature-Based Solutions':'#6b8e5a','Digital Climate Tech':'#8b6aaa','Industrial Decarbonisation':'#a0785a',
  'Green Buildings':'#5a7a8a','Hydrogen Economy':'#3a8a7a','Carbon Capture':'#8a5a6a',
  'Circular Economy':'#6a8a5a','Climate Finance':'#5a6a8a','Sustainable Materials':'#8a7a5a'
};

const CAT_COLORS = {
  'Clean Energy':'#1b3a5c','Efficiency':'#2c5a8c','Transport':'#5a8a6a','Agriculture':'#c5a96a',
  'Waste':'#7ba67d','Water':'#4a90a4','Nature':'#6b8e5a','Digital':'#8b6aaa'
};

/* ─── 150 Holdings Generator ─── */
const genHoldings = () => {
  const h = [];
  for (let i = 0; i < 150; i++) {
    const s = sr(i * 7 + 3);
    const s2 = sr(i * 13 + 17);
    const s3 = sr(i * 19 + 29);
    const s4 = sr(i * 23 + 37);
    const s5 = sr(i * 31 + 43);
    const s6 = sr(i * 37 + 53);
    const s7 = sr(i * 41 + 61);
    const sector = SECTORS[Math.floor(s * SECTORS.length)];
    const prefix = COMPANY_PREFIXES[Math.floor(s2 * COMPANY_PREFIXES.length)];
    const suffix = COMPANY_SUFFIXES[Math.floor(s3 * COMPANY_SUFFIXES.length)];
    const company = `${prefix} ${suffix}`;
    const aumWeight = 0.2 + s4 * 2.8;
    const emitted = 800 + s5 * 24000;
    const solutionRevPct = s6 * 0.85;
    const avoidedRatio = 0.05 + solutionRevPct * 1.8 + s7 * 0.3;
    const avoided = emitted * avoidedRatio;
    const net = emitted - avoided;
    const tier = CREDIBILITY_TIERS[Math.floor(sr(i * 47 + 71) * CREDIBILITY_TIERS.length)];
    const evic = 500 + sr(i * 53 + 83) * 9500;
    const outstanding = evic * (0.01 + sr(i * 59 + 89) * 0.08);
    const attrFactor = outstanding / evic;
    const solutionCat = SOLUTION_CATS[Math.floor(sr(i * 61 + 97) * SOLUTION_CATS.length)];
    const qTrend = QUARTERS.map((q, qi) => {
      const base = emitted * (0.85 + sr(i * 67 + qi * 11) * 0.3);
      const avBase = avoided * (0.7 + sr(i * 71 + qi * 13) * 0.6);
      return { quarter: q, emitted: base, avoided: avBase, net: base - avBase, solutionRev: solutionRevPct * (0.9 + sr(i * 73 + qi * 7) * 0.2) };
    });
    h.push({
      id: i + 1, company, sector, aumWeight, emitted, avoided, net,
      solutionRevPct, tier, evic, outstanding, attrFactor,
      solutionCat, qTrend,
      sdgs: [7, 13, ...(sr(i * 79 + 101) > 0.5 ? [9] : []), ...(sr(i * 83 + 107) > 0.6 ? [11] : []), ...(sr(i * 89 + 113) > 0.7 ? [15] : [])]
    });
  }
  return h;
};

const HOLDINGS = genHoldings();

/* ─── Styles ─── */
const S = {
  page: { fontFamily: T.font, background: T.bg, minHeight: '100vh', padding: '24px 32px', color: T.text },
  header: { marginBottom: 24 },
  title: { fontSize: 26, fontWeight: 700, color: T.navy, margin: 0 },
  subtitle: { fontSize: 14, color: T.textSec, marginTop: 4 },
  tabBar: { display: 'flex', gap: 0, borderBottom: `2px solid ${T.border}`, marginBottom: 24 },
  tab: (active) => ({
    padding: '10px 22px', cursor: 'pointer', fontWeight: active ? 700 : 500,
    color: active ? T.navy : T.textMut, fontSize: 13, letterSpacing: 0.2,
    borderBottom: active ? `3px solid ${T.sage}` : '3px solid transparent',
    transition: 'all 0.15s', background: 'none', border: 'none', fontFamily: T.font
  }),
  card: { background: T.surface, borderRadius: 10, border: `1px solid ${T.border}`, padding: 20, marginBottom: 18, boxShadow: '0 1px 4px rgba(27,58,92,0.06)' },
  cardTitle: { fontSize: 15, fontWeight: 700, color: T.navy, marginBottom: 12 },
  kpiStrip: { display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 20 },
  kpi: { flex: '1 1 160px', background: T.surface, borderRadius: 8, border: `1px solid ${T.border}`, padding: '14px 18px', minWidth: 150 },
  kpiLabel: { fontSize: 11, fontWeight: 600, color: T.textMut, textTransform: 'uppercase', letterSpacing: 0.8 },
  kpiVal: { fontSize: 22, fontWeight: 700, color: T.navy, marginTop: 4 },
  kpiSub: { fontSize: 11, color: T.textSec, marginTop: 2 },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 12 },
  th: { textAlign: 'left', padding: '8px 10px', borderBottom: `2px solid ${T.borderL}`, color: T.textMut, fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.6, cursor: 'pointer', userSelect: 'none' },
  td: { padding: '7px 10px', borderBottom: `1px solid ${T.border}`, color: T.text, fontSize: 12 },
  input: { padding: '7px 12px', borderRadius: 6, border: `1px solid ${T.border}`, fontSize: 12, fontFamily: T.font, outline: 'none', width: 220 },
  select: { padding: '7px 12px', borderRadius: 6, border: `1px solid ${T.border}`, fontSize: 12, fontFamily: T.font, background: T.surface, cursor: 'pointer' },
  btn: (active) => ({
    padding: '6px 16px', borderRadius: 6, border: `1px solid ${active ? T.sage : T.border}`,
    background: active ? T.sage : T.surface, color: active ? '#fff' : T.text,
    fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: T.font, transition: 'all 0.15s'
  }),
  badge: (color) => ({
    display: 'inline-block', padding: '2px 8px', borderRadius: 10, fontSize: 10, fontWeight: 700,
    color: '#fff', background: color
  }),
  pagination: { display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center', marginTop: 14 },
  slider: { width: '100%', accentColor: T.sage },
  grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 },
  grid3: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 18 },
  modal: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 },
  modalContent: { background: T.surface, borderRadius: 12, padding: 28, maxWidth: 780, width: '90%', maxHeight: '85vh', overflowY: 'auto', border: `1px solid ${T.border}` },
  closeBtn: { float: 'right', background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: T.textMut },
};

const tierColor = t => ({ 'High': T.green, 'Medium-High': T.sage, 'Medium': T.gold, 'Medium-Low': T.amber, 'Low': T.red }[t] || T.textMut);

/* ─── Custom Tooltip ─── */
const CTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: '10px 14px', fontSize: 12 }}>
      <div style={{ fontWeight: 700, marginBottom: 4 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color || T.text, marginBottom: 2 }}>
          {p.name}: {typeof p.value === 'number' ? fmtInt(p.value) : p.value}
        </div>
      ))}
    </div>
  );
};

/* ════════════════════════════════════════════ */
/* TAB 1: Portfolio Climate Impact             */
/* ════════════════════════════════════════════ */
function Tab1PortfolioClimateImpact() {
  const [search, setSearch] = useState('');
  const [sectorFilter, setSectorFilter] = useState('All');
  const [tierFilter, setTierFilter] = useState('All');
  const [sortKey, setSortKey] = useState('avoided');
  const [sortAsc, setSortAsc] = useState(false);
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(null);
  const perPage = 25;

  const filtered = useMemo(() => {
    let d = [...HOLDINGS];
    if (search) d = d.filter(h => h.company.toLowerCase().includes(search.toLowerCase()));
    if (sectorFilter !== 'All') d = d.filter(h => h.sector === sectorFilter);
    if (tierFilter !== 'All') d = d.filter(h => h.tier === tierFilter);
    d.sort((a, b) => {
      const va = a[sortKey], vb = b[sortKey];
      if (typeof va === 'string') return sortAsc ? va.localeCompare(vb) : vb.localeCompare(va);
      return sortAsc ? va - vb : vb - va;
    });
    return d;
  }, [search, sectorFilter, tierFilter, sortKey, sortAsc]);

  const pageData = useMemo(() => filtered.slice((page - 1) * perPage, page * perPage), [filtered, page]);
  const totalPages = Math.ceil(filtered.length / perPage);

  const kpis = useMemo(() => {
    const tot = filtered.reduce((a, h) => ({
      emitted: a.emitted + h.emitted, avoided: a.avoided + h.avoided,
      net: a.net + h.net, solRev: a.solRev + h.solutionRevPct * h.aumWeight,
      weight: a.weight + h.aumWeight
    }), { emitted: 0, avoided: 0, net: 0, solRev: 0, weight: 0 });
    return {
      emitted: tot.emitted, avoided: tot.avoided, net: tot.net,
      ratio: tot.emitted > 0 ? tot.avoided / tot.emitted : 0,
      solRevAvg: tot.weight > 0 ? tot.solRev / tot.weight : 0
    };
  }, [filtered]);

  const sectorChart = useMemo(() => {
    const map = {};
    SECTORS.forEach(s => { map[s] = { sector: s, emitted: 0, avoided: 0 }; });
    filtered.forEach(h => { map[h.sector].emitted += h.emitted; map[h.sector].avoided += h.avoided; });
    return Object.values(map).filter(s => s.emitted > 0 || s.avoided > 0).sort((a, b) => (b.emitted + b.avoided) - (a.emitted + a.avoided));
  }, [filtered]);

  const handleSort = (key) => {
    if (sortKey === key) setSortAsc(!sortAsc);
    else { setSortKey(key); setSortAsc(false); }
    setPage(1);
  };

  const sortIcon = (key) => sortKey === key ? (sortAsc ? ' \u25B2' : ' \u25BC') : '';

  return (
    <div>
      {/* KPI Strip */}
      <div style={S.kpiStrip}>
        <div style={S.kpi}>
          <div style={S.kpiLabel}>Total Emitted</div>
          <div style={{ ...S.kpiVal, color: T.red }}>{fmt(kpis.emitted)} tCO2e</div>
          <div style={S.kpiSub}>{filtered.length} holdings</div>
        </div>
        <div style={S.kpi}>
          <div style={S.kpiLabel}>Total Avoided</div>
          <div style={{ ...S.kpiVal, color: T.green }}>{fmt(kpis.avoided)} tCO2e</div>
          <div style={S.kpiSub}>portfolio aggregate</div>
        </div>
        <div style={S.kpi}>
          <div style={S.kpiLabel}>Net Impact</div>
          <div style={{ ...S.kpiVal, color: kpis.net > 0 ? T.red : T.green }}>{fmt(kpis.net)} tCO2e</div>
          <div style={S.kpiSub}>{kpis.net > 0 ? 'net emitter' : 'net avoider'}</div>
        </div>
        <div style={S.kpi}>
          <div style={S.kpiLabel}>Avoided / Emitted</div>
          <div style={{ ...S.kpiVal, color: T.sage }}>{(kpis.ratio * 100).toFixed(1)}%</div>
          <div style={S.kpiSub}>impact ratio</div>
        </div>
        <div style={S.kpi}>
          <div style={S.kpiLabel}>Avg Solution Revenue</div>
          <div style={{ ...S.kpiVal, color: T.gold }}>{(kpis.solRevAvg * 100).toFixed(1)}%</div>
          <div style={S.kpiSub}>weighted average</div>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <input style={S.input} placeholder="Search company..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
        <select style={S.select} value={sectorFilter} onChange={e => { setSectorFilter(e.target.value); setPage(1); }}>
          <option value="All">All Sectors ({SECTORS.length})</option>
          {SECTORS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select style={S.select} value={tierFilter} onChange={e => { setTierFilter(e.target.value); setPage(1); }}>
          <option value="All">All Tiers</option>
          {CREDIBILITY_TIERS.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <span style={{ fontSize: 12, color: T.textMut }}>{filtered.length} of 150 holdings</span>
      </div>

      {/* Holdings Table */}
      <div style={{ ...S.card, padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={S.table}>
            <thead>
              <tr style={{ background: T.surfaceH }}>
                <th style={S.th} onClick={() => handleSort('company')}>Company{sortIcon('company')}</th>
                <th style={S.th} onClick={() => handleSort('sector')}>Sector{sortIcon('sector')}</th>
                <th style={{ ...S.th, textAlign: 'right' }} onClick={() => handleSort('aumWeight')}>AUM Wt%{sortIcon('aumWeight')}</th>
                <th style={{ ...S.th, textAlign: 'right' }} onClick={() => handleSort('emitted')}>Emitted tCO2e{sortIcon('emitted')}</th>
                <th style={{ ...S.th, textAlign: 'right' }} onClick={() => handleSort('avoided')}>Avoided tCO2e{sortIcon('avoided')}</th>
                <th style={{ ...S.th, textAlign: 'right' }} onClick={() => handleSort('net')}>Net Impact{sortIcon('net')}</th>
                <th style={{ ...S.th, textAlign: 'right' }} onClick={() => handleSort('solutionRevPct')}>Solution Rev%{sortIcon('solutionRevPct')}</th>
                <th style={S.th} onClick={() => handleSort('tier')}>Credibility{sortIcon('tier')}</th>
              </tr>
            </thead>
            <tbody>
              {pageData.map(h => (
                <tr key={h.id} style={{ cursor: 'pointer', transition: 'background 0.1s' }}
                  onClick={() => setSelected(h)}
                  onMouseEnter={e => e.currentTarget.style.background = T.surfaceH}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <td style={{ ...S.td, fontWeight: 600 }}>{h.company}</td>
                  <td style={S.td}><span style={{ ...S.badge(SECTOR_COLORS[h.sector] || T.navy), fontSize: 9 }}>{h.sector}</span></td>
                  <td style={{ ...S.td, textAlign: 'right', fontFamily: T.mono }}>{h.aumWeight.toFixed(2)}%</td>
                  <td style={{ ...S.td, textAlign: 'right', fontFamily: T.mono, color: T.red }}>{fmtInt(h.emitted)}</td>
                  <td style={{ ...S.td, textAlign: 'right', fontFamily: T.mono, color: T.green }}>{fmtInt(h.avoided)}</td>
                  <td style={{ ...S.td, textAlign: 'right', fontFamily: T.mono, color: h.net > 0 ? T.red : T.green }}>{fmtInt(h.net)}</td>
                  <td style={{ ...S.td, textAlign: 'right', fontFamily: T.mono }}>{(h.solutionRevPct * 100).toFixed(1)}%</td>
                  <td style={S.td}><span style={S.badge(tierColor(h.tier))}>{h.tier}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Pagination */}
        <div style={S.pagination}>
          <button style={S.btn(false)} disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Prev</button>
          {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
            let pg;
            if (totalPages <= 7) pg = i + 1;
            else if (page <= 4) pg = i + 1;
            else if (page >= totalPages - 3) pg = totalPages - 6 + i;
            else pg = page - 3 + i;
            return (
              <button key={pg} style={S.btn(pg === page)} onClick={() => setPage(pg)}>{pg}</button>
            );
          })}
          <button style={S.btn(false)} disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Next</button>
          <span style={{ fontSize: 11, color: T.textMut, marginLeft: 8 }}>Page {page} of {totalPages}</span>
        </div>
      </div>

      {/* Sector Chart */}
      <div style={S.card}>
        <div style={S.cardTitle}>Emitted vs Avoided Emissions by Sector</div>
        <ResponsiveContainer width="100%" height={360}>
          <BarChart data={sectorChart} layout="vertical" margin={{ left: 150, right: 20, top: 10, bottom: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis type="number" tick={{ fontSize: 11, fill: T.textSec }} tickFormatter={fmt} />
            <YAxis type="category" dataKey="sector" tick={{ fontSize: 10, fill: T.textSec }} width={140} />
            <Tooltip content={<CTooltip />} />
            <Legend />
            <Bar dataKey="emitted" name="Emitted tCO2e" fill={T.red} radius={[0, 4, 4, 0]} opacity={0.8} />
            <Bar dataKey="avoided" name="Avoided tCO2e" fill={T.green} radius={[0, 4, 4, 0]} opacity={0.8} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Top 10 Avoiders & Top 10 Emitters */}
      <div style={S.grid2}>
        <div style={S.card}>
          <div style={S.cardTitle}>Top 10 Avoided Emissions Contributors</div>
          <table style={S.table}>
            <thead>
              <tr style={{ background: T.surfaceH }}>
                <th style={S.th}>#</th>
                <th style={S.th}>Company</th>
                <th style={{ ...S.th, textAlign: 'right' }}>Avoided tCO2e</th>
                <th style={{ ...S.th, textAlign: 'right' }}>% of Total</th>
              </tr>
            </thead>
            <tbody>
              {[...filtered].sort((a, b) => b.avoided - a.avoided).slice(0, 10).map((h, i) => (
                <tr key={h.id} style={{ cursor: 'pointer' }} onClick={() => setSelected(h)}
                  onMouseEnter={e => e.currentTarget.style.background = T.surfaceH}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <td style={{ ...S.td, fontWeight: 700, color: T.sage }}>{i + 1}</td>
                  <td style={{ ...S.td, fontWeight: 600 }}>{h.company}</td>
                  <td style={{ ...S.td, textAlign: 'right', fontFamily: T.mono, color: T.green }}>{fmtInt(h.avoided)}</td>
                  <td style={{ ...S.td, textAlign: 'right', fontFamily: T.mono }}>{kpis.avoided > 0 ? ((h.avoided / kpis.avoided) * 100).toFixed(1) : 0}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={S.card}>
          <div style={S.cardTitle}>Top 10 Net Emitters (Highest Net Impact)</div>
          <table style={S.table}>
            <thead>
              <tr style={{ background: T.surfaceH }}>
                <th style={S.th}>#</th>
                <th style={S.th}>Company</th>
                <th style={{ ...S.th, textAlign: 'right' }}>Net Impact tCO2e</th>
                <th style={{ ...S.th, textAlign: 'right' }}>Avoided/Emitted</th>
              </tr>
            </thead>
            <tbody>
              {[...filtered].sort((a, b) => b.net - a.net).slice(0, 10).map((h, i) => (
                <tr key={h.id} style={{ cursor: 'pointer' }} onClick={() => setSelected(h)}
                  onMouseEnter={e => e.currentTarget.style.background = T.surfaceH}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <td style={{ ...S.td, fontWeight: 700, color: T.red }}>{i + 1}</td>
                  <td style={{ ...S.td, fontWeight: 600 }}>{h.company}</td>
                  <td style={{ ...S.td, textAlign: 'right', fontFamily: T.mono, color: T.red }}>{fmtInt(h.net)}</td>
                  <td style={{ ...S.td, textAlign: 'right', fontFamily: T.mono }}>{h.emitted > 0 ? ((h.avoided / h.emitted) * 100).toFixed(1) : 0}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Sector Summary Heat Map */}
      <div style={S.card}>
        <div style={S.cardTitle}>Sector Impact Summary</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 10 }}>
          {(() => {
            const sMap = {};
            filtered.forEach(h => {
              if (!sMap[h.sector]) sMap[h.sector] = { count: 0, emitted: 0, avoided: 0, solRev: 0, weight: 0 };
              sMap[h.sector].count++;
              sMap[h.sector].emitted += h.emitted;
              sMap[h.sector].avoided += h.avoided;
              sMap[h.sector].solRev += h.solutionRevPct * h.aumWeight;
              sMap[h.sector].weight += h.aumWeight;
            });
            return Object.entries(sMap).sort((a, b) => b[1].avoided - a[1].avoided).map(([sec, d]) => {
              const ratio = d.emitted > 0 ? d.avoided / d.emitted : 0;
              const bgColor = ratio > 0.8 ? `${T.green}18` : ratio > 0.4 ? `${T.gold}18` : `${T.red}18`;
              return (
                <div key={sec} style={{ background: bgColor, borderRadius: 8, padding: '10px 14px', border: `1px solid ${T.border}` }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: T.navy, marginBottom: 6 }}>{sec}</div>
                  <div style={{ fontSize: 10, color: T.textSec }}>
                    <div>{d.count} companies | Wt: {d.weight.toFixed(1)}%</div>
                    <div style={{ color: T.red }}>Em: {fmt(d.emitted)}</div>
                    <div style={{ color: T.green }}>Av: {fmt(d.avoided)}</div>
                    <div style={{ fontWeight: 600 }}>Ratio: {(ratio * 100).toFixed(0)}%</div>
                    <div>Sol Rev: {d.weight > 0 ? ((d.solRev / d.weight) * 100).toFixed(1) : 0}%</div>
                  </div>
                </div>
              );
            });
          })()}
        </div>
      </div>

      {/* Credibility Tier Distribution */}
      <div style={S.card}>
        <div style={S.cardTitle}>Credibility Tier Distribution</div>
        <div style={{ display: 'flex', gap: 16, alignItems: 'flex-end', height: 120 }}>
          {CREDIBILITY_TIERS.map(tier => {
            const count = filtered.filter(h => h.tier === tier).length;
            const pct = filtered.length > 0 ? count / filtered.length : 0;
            return (
              <div key={tier} style={{ flex: 1, textAlign: 'center' }}>
                <div style={{ background: tierColor(tier), borderRadius: '4px 4px 0 0', height: Math.max(8, pct * 100), transition: 'height 0.3s' }} />
                <div style={{ fontSize: 10, fontWeight: 700, marginTop: 4, color: tierColor(tier) }}>{count}</div>
                <div style={{ fontSize: 9, color: T.textMut }}>{tier}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Company Detail Modal */}
      {selected && (
        <div style={S.modal} onClick={() => setSelected(null)}>
          <div style={S.modalContent} onClick={e => e.stopPropagation()}>
            <button style={S.closeBtn} onClick={() => setSelected(null)}>x</button>
            <h3 style={{ margin: '0 0 4px', color: T.navy }}>{selected.company}</h3>
            <div style={{ fontSize: 12, color: T.textSec, marginBottom: 16 }}>
              {selected.sector} | Credibility: <span style={{ color: tierColor(selected.tier), fontWeight: 700 }}>{selected.tier}</span> | Solution Category: {selected.solutionCat}
            </div>
            <div style={S.kpiStrip}>
              <div style={S.kpi}><div style={S.kpiLabel}>Emitted</div><div style={{ ...S.kpiVal, fontSize: 18, color: T.red }}>{fmtInt(selected.emitted)}</div></div>
              <div style={S.kpi}><div style={S.kpiLabel}>Avoided</div><div style={{ ...S.kpiVal, fontSize: 18, color: T.green }}>{fmtInt(selected.avoided)}</div></div>
              <div style={S.kpi}><div style={S.kpiLabel}>Net</div><div style={{ ...S.kpiVal, fontSize: 18, color: selected.net > 0 ? T.red : T.green }}>{fmtInt(selected.net)}</div></div>
              <div style={S.kpi}><div style={S.kpiLabel}>Solution Rev</div><div style={{ ...S.kpiVal, fontSize: 18, color: T.gold }}>{(selected.solutionRevPct * 100).toFixed(1)}%</div></div>
              <div style={S.kpi}><div style={S.kpiLabel}>EVIC ($M)</div><div style={{ ...S.kpiVal, fontSize: 18 }}>{selected.evic.toFixed(0)}</div></div>
            </div>
            {/* 12Q Trend */}
            <div style={{ ...S.card, marginTop: 16 }}>
              <div style={S.cardTitle}>12-Quarter Emissions Trend</div>
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={selected.qTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="quarter" tick={{ fontSize: 10, fill: T.textSec }} />
                  <YAxis tick={{ fontSize: 10, fill: T.textSec }} tickFormatter={fmt} />
                  <Tooltip content={<CTooltip />} />
                  <Legend />
                  <Area type="monotone" dataKey="emitted" name="Emitted" stroke={T.red} fill={T.red} fillOpacity={0.15} />
                  <Area type="monotone" dataKey="avoided" name="Avoided" stroke={T.green} fill={T.green} fillOpacity={0.15} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            {/* Solution Breakdown */}
            <div style={{ ...S.card, marginTop: 12 }}>
              <div style={S.cardTitle}>Solution Revenue Breakdown</div>
              <div style={{ display: 'flex', gap: 20 }}>
                <div style={{ flex: 1 }}>
                  {SOLUTION_CATS.map((cat, ci) => {
                    const pct = sr(selected.id * 97 + ci * 11) * (cat === selected.solutionCat ? 0.5 : 0.12);
                    return (
                      <div key={cat} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: `1px solid ${T.border}`, fontSize: 12 }}>
                        <span>{cat}</span>
                        <span style={{ fontFamily: T.mono, fontWeight: 600 }}>{(pct * 100).toFixed(1)}%</span>
                      </div>
                    );
                  })}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8 }}>Attribution Methodology</div>
                  <div style={{ fontSize: 11, color: T.textSec, lineHeight: 1.6 }}>
                    Attribution Factor = Outstanding Amount / EVIC<br />
                    Factor: {(selected.attrFactor * 100).toFixed(2)}%<br />
                    Outstanding: ${selected.outstanding.toFixed(1)}M<br />
                    EVIC: ${selected.evic.toFixed(0)}M<br />
                    Attributable Avoided: {fmtInt(selected.avoided * selected.attrFactor)} tCO2e<br />
                    SDGs: {selected.sdgs.map(s => `SDG ${s}`).join(', ')}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════ */
/* TAB 2: Climate Solution Exposure            */
/* ════════════════════════════════════════════ */
function Tab2ClimateSolutionExposure() {
  const [minSolRev, setMinSolRev] = useState(0);
  const [benchView, setBenchView] = useState('portfolio');

  const exposureByCategory = useMemo(() => {
    const map = {};
    SOLUTION_CATS.forEach(c => { map[c] = 0; });
    HOLDINGS.forEach(h => {
      const w = h.aumWeight / 100;
      SOLUTION_CATS.forEach((cat, ci) => {
        const contrib = sr(h.id * 97 + ci * 11) * (cat === h.solutionCat ? 0.5 : 0.12) * w;
        map[cat] += contrib;
      });
    });
    const total = Object.values(map).reduce((a, b) => a + b, 0);
    return SOLUTION_CATS.map(c => ({ name: c, value: map[c], pct: total > 0 ? map[c] / total : 0 }));
  }, []);

  const donutData = exposureByCategory.filter(d => d.value > 0);

  const quarterTrend = useMemo(() => {
    return QUARTERS.map((q, qi) => {
      const row = { quarter: q };
      SOLUTION_CATS.forEach((cat, ci) => {
        let sum = 0;
        HOLDINGS.forEach(h => {
          sum += sr(h.id * 97 + ci * 11 + qi * 3) * (cat === h.solutionCat ? 0.5 : 0.12) * h.aumWeight * 0.01;
        });
        row[cat] = sum * (0.85 + qi * 0.03);
      });
      return row;
    });
  }, []);

  const benchmarkData = useMemo(() => {
    return SOLUTION_CATS.map((cat, ci) => {
      const portVal = exposureByCategory[ci].value;
      return {
        category: cat,
        portfolio: portVal * 100,
        index: portVal * 100 * (0.4 + sr(ci * 41 + 7) * 0.5),
        peer: portVal * 100 * (0.6 + sr(ci * 47 + 11) * 0.6)
      };
    });
  }, [exposureByCategory]);

  const screened = useMemo(() => {
    return HOLDINGS.filter(h => h.solutionRevPct >= minSolRev / 100)
      .sort((a, b) => b.solutionRevPct - a.solutionRevPct);
  }, [minSolRev]);

  const top20PurePlay = useMemo(() => {
    return [...HOLDINGS].sort((a, b) => b.solutionRevPct - a.solutionRevPct).slice(0, 20);
  }, []);

  const totalExposure = useMemo(() => {
    const totalW = HOLDINGS.reduce((a, h) => a + h.aumWeight, 0);
    const solW = HOLDINGS.reduce((a, h) => a + h.aumWeight * h.solutionRevPct, 0);
    return totalW > 0 ? solW / totalW : 0;
  }, []);

  return (
    <div>
      {/* KPIs */}
      <div style={S.kpiStrip}>
        <div style={S.kpi}>
          <div style={S.kpiLabel}>Portfolio Solution Exposure</div>
          <div style={{ ...S.kpiVal, color: T.sage }}>{(totalExposure * 100).toFixed(1)}%</div>
          <div style={S.kpiSub}>weighted by AUM</div>
        </div>
        <div style={S.kpi}>
          <div style={S.kpiLabel}>Pure-Play Count</div>
          <div style={S.kpiVal}>{HOLDINGS.filter(h => h.solutionRevPct > 0.5).length}</div>
          <div style={S.kpiSub}>&gt;50% solution revenue</div>
        </div>
        <div style={S.kpi}>
          <div style={S.kpiLabel}>Top Category</div>
          <div style={{ ...S.kpiVal, fontSize: 16 }}>{donutData.sort((a, b) => b.value - a.value)[0]?.name}</div>
          <div style={S.kpiSub}>largest exposure</div>
        </div>
        <div style={S.kpi}>
          <div style={S.kpiLabel}>Categories Covered</div>
          <div style={S.kpiVal}>{SOLUTION_CATS.length}</div>
          <div style={S.kpiSub}>of 8 solution categories</div>
        </div>
      </div>

      <div style={S.grid2}>
        {/* Donut */}
        <div style={S.card}>
          <div style={S.cardTitle}>Exposure by Solution Category</div>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={donutData} cx="50%" cy="50%" innerRadius={70} outerRadius={120} dataKey="value" nameKey="name" paddingAngle={2}>
                {donutData.map((d, i) => <Cell key={i} fill={CAT_COLORS[d.name] || T.navy} />)}
              </Pie>
              <Tooltip formatter={(v, n) => [`${(v * 100).toFixed(1)}%`, n]} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Benchmark Comparison */}
        <div style={S.card}>
          <div style={S.cardTitle}>Benchmark Comparison</div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            {['portfolio', 'index', 'peer'].map(v => (
              <button key={v} style={S.btn(benchView === v)} onClick={() => setBenchView(v)}>
                {v === 'portfolio' ? 'Portfolio' : v === 'index' ? 'Climate Index' : 'Peer Avg'}
              </button>
            ))}
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={benchmarkData}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="category" tick={{ fontSize: 9, fill: T.textSec }} angle={-30} textAnchor="end" height={60} />
              <YAxis tick={{ fontSize: 10, fill: T.textSec }} />
              <Tooltip content={<CTooltip />} />
              <Legend />
              <Bar dataKey="portfolio" name="Portfolio" fill={T.sage} opacity={benchView === 'portfolio' ? 1 : 0.3} />
              <Bar dataKey="index" name="Climate Index" fill={T.navyL} opacity={benchView === 'index' ? 1 : 0.3} />
              <Bar dataKey="peer" name="Peer Average" fill={T.gold} opacity={benchView === 'peer' ? 1 : 0.3} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Trend Over 12Q */}
      <div style={S.card}>
        <div style={S.cardTitle}>Solution Exposure Trend (12 Quarters)</div>
        <ResponsiveContainer width="100%" height={340}>
          <AreaChart data={quarterTrend}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="quarter" tick={{ fontSize: 10, fill: T.textSec }} />
            <YAxis tick={{ fontSize: 10, fill: T.textSec }} />
            <Tooltip content={<CTooltip />} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            {SOLUTION_CATS.map((cat, i) => (
              <Area key={cat} type="monotone" dataKey={cat} stackId="1" stroke={CAT_COLORS[cat]} fill={CAT_COLORS[cat]} fillOpacity={0.6} />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Solution Revenue Screener */}
      <div style={S.card}>
        <div style={S.cardTitle}>Solution Revenue Screener</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 14 }}>
          <span style={{ fontSize: 12, fontWeight: 600 }}>Min Solution Revenue:</span>
          <input type="range" min={0} max={80} value={minSolRev} onChange={e => setMinSolRev(Number(e.target.value))} style={S.slider} />
          <span style={{ fontFamily: T.mono, fontSize: 13, fontWeight: 700, minWidth: 50 }}>{minSolRev}%</span>
          <span style={{ fontSize: 12, color: T.textMut }}>{screened.length} companies match</span>
        </div>
        <div style={{ maxHeight: 300, overflowY: 'auto' }}>
          <table style={S.table}>
            <thead>
              <tr style={{ background: T.surfaceH }}>
                <th style={S.th}>Company</th>
                <th style={S.th}>Sector</th>
                <th style={S.th}>Solution Category</th>
                <th style={{ ...S.th, textAlign: 'right' }}>Solution Rev %</th>
                <th style={{ ...S.th, textAlign: 'right' }}>AUM Weight</th>
                <th style={{ ...S.th, textAlign: 'right' }}>Avoided tCO2e</th>
              </tr>
            </thead>
            <tbody>
              {screened.slice(0, 30).map(h => (
                <tr key={h.id}>
                  <td style={{ ...S.td, fontWeight: 600 }}>{h.company}</td>
                  <td style={S.td}>{h.sector}</td>
                  <td style={S.td}><span style={S.badge(CAT_COLORS[h.solutionCat] || T.navy)}>{h.solutionCat}</span></td>
                  <td style={{ ...S.td, textAlign: 'right', fontFamily: T.mono, fontWeight: 700, color: T.sage }}>{(h.solutionRevPct * 100).toFixed(1)}%</td>
                  <td style={{ ...S.td, textAlign: 'right', fontFamily: T.mono }}>{h.aumWeight.toFixed(2)}%</td>
                  <td style={{ ...S.td, textAlign: 'right', fontFamily: T.mono, color: T.green }}>{fmtInt(h.avoided)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Top 20 Pure-Play */}
      <div style={S.card}>
        <div style={S.cardTitle}>Top 20 Pure-Play Climate Solution Companies</div>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={top20PurePlay} layout="vertical" margin={{ left: 160, right: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis type="number" tick={{ fontSize: 10, fill: T.textSec }} domain={[0, 100]} tickFormatter={v => `${v}%`} />
            <YAxis type="category" dataKey="company" tick={{ fontSize: 10, fill: T.textSec }} width={150} />
            <Tooltip formatter={(v) => [`${(v).toFixed(1)}%`, 'Solution Revenue']} />
            <Bar dataKey={(d) => d.solutionRevPct * 100} name="Solution Revenue %" fill={T.sage} radius={[0, 4, 4, 0]}>
              {top20PurePlay.map((d, i) => <Cell key={i} fill={CAT_COLORS[d.solutionCat] || T.sage} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════ */
/* TAB 3: Impact Attribution                   */
/* ════════════════════════════════════════════ */
function Tab3ImpactAttribution() {
  const [attrFactors, setAttrFactors] = useState(() => {
    const m = {};
    HOLDINGS.forEach(h => { m[h.id] = h.attrFactor; });
    return m;
  });
  const [methodology, setMethodology] = useState('PCAF');
  const [sensitivity, setSensitivity] = useState(0);
  const [expandedSector, setExpandedSector] = useState(null);

  const updateFactor = useCallback((id, val) => {
    setAttrFactors(prev => ({ ...prev, [id]: val }));
  }, []);

  const attribution = useMemo(() => {
    const sensMultiplier = 1 + sensitivity / 100;
    let grossAvoided = 0, totalAttributable = 0, doubleCounting = 0;
    const sectorMap = {};

    HOLDINGS.forEach(h => {
      const factor = (attrFactors[h.id] || h.attrFactor) * sensMultiplier;
      const methodFactor = methodology === 'PCAF' ? factor : factor * (0.85 + sr(h.id * 101) * 0.3);
      const attributable = h.avoided * methodFactor;
      const dblCount = attributable * (0.05 + sr(h.id * 103) * 0.1);
      grossAvoided += h.avoided;
      totalAttributable += attributable;
      doubleCounting += dblCount;

      if (!sectorMap[h.sector]) sectorMap[h.sector] = { sector: h.sector, gross: 0, attributable: 0, doubleCounting: 0, companies: [] };
      sectorMap[h.sector].gross += h.avoided;
      sectorMap[h.sector].attributable += attributable;
      sectorMap[h.sector].doubleCounting += dblCount;
      sectorMap[h.sector].companies.push({ ...h, attrFactor: factor, attributable, dblCount });
    });

    const netAttributable = totalAttributable - doubleCounting;
    return { grossAvoided, totalAttributable, doubleCounting, netAttributable, sectors: Object.values(sectorMap).sort((a, b) => b.attributable - a.attributable) };
  }, [attrFactors, methodology, sensitivity]);

  const waterfallData = [
    { name: 'Gross Avoided', value: attribution.grossAvoided, fill: T.green },
    { name: 'Attribution Factor', value: -(attribution.grossAvoided - attribution.totalAttributable), fill: T.amber },
    { name: 'Double-Count Adj', value: -attribution.doubleCounting, fill: T.red },
    { name: 'Net Attributable', value: attribution.netAttributable, fill: T.sage }
  ];

  const methodComparison = useMemo(() => {
    return HOLDINGS.slice(0, 30).map(h => {
      const pcaf = h.avoided * h.attrFactor;
      const prop = h.avoided * h.attrFactor * (0.85 + sr(h.id * 101) * 0.3);
      return { company: h.company, pcaf, proprietary: prop, delta: prop - pcaf };
    }).sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));
  }, []);

  const sensitivityData = useMemo(() => {
    return [-20, -15, -10, -5, 0, 5, 10, 15, 20].map(adj => {
      const mult = 1 + adj / 100;
      let total = 0;
      HOLDINGS.forEach(h => { total += h.avoided * h.attrFactor * mult; });
      return { adjustment: `${adj >= 0 ? '+' : ''}${adj}%`, value: total };
    });
  }, []);

  return (
    <div>
      {/* KPIs */}
      <div style={S.kpiStrip}>
        <div style={S.kpi}>
          <div style={S.kpiLabel}>Gross Avoided</div>
          <div style={{ ...S.kpiVal, color: T.green }}>{fmt(attribution.grossAvoided)}</div>
          <div style={S.kpiSub}>portfolio total tCO2e</div>
        </div>
        <div style={S.kpi}>
          <div style={S.kpiLabel}>Total Attributable</div>
          <div style={{ ...S.kpiVal, color: T.sage }}>{fmt(attribution.totalAttributable)}</div>
          <div style={S.kpiSub}>after attribution</div>
        </div>
        <div style={S.kpi}>
          <div style={S.kpiLabel}>Double-Count Adj</div>
          <div style={{ ...S.kpiVal, color: T.red }}>-{fmt(attribution.doubleCounting)}</div>
          <div style={S.kpiSub}>overlap reduction</div>
        </div>
        <div style={S.kpi}>
          <div style={S.kpiLabel}>Net Attributable</div>
          <div style={{ ...S.kpiVal, color: T.navy }}>{fmt(attribution.netAttributable)}</div>
          <div style={S.kpiSub}>claimable impact</div>
        </div>
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 18, alignItems: 'center', flexWrap: 'wrap' }}>
        <div>
          <span style={{ fontSize: 12, fontWeight: 600, marginRight: 8 }}>Methodology:</span>
          <button style={S.btn(methodology === 'PCAF')} onClick={() => setMethodology('PCAF')}>PCAF Standard</button>
          <button style={{ ...S.btn(methodology === 'proprietary'), marginLeft: 6 }} onClick={() => setMethodology('proprietary')}>Proprietary Model</button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
          <span style={{ fontSize: 12, fontWeight: 600 }}>Sensitivity:</span>
          <input type="range" min={-20} max={20} value={sensitivity} onChange={e => setSensitivity(Number(e.target.value))} style={{ ...S.slider, maxWidth: 200 }} />
          <span style={{ fontFamily: T.mono, fontSize: 12, fontWeight: 700 }}>{sensitivity >= 0 ? '+' : ''}{sensitivity}%</span>
        </div>
      </div>

      <div style={S.grid2}>
        {/* Waterfall */}
        <div style={S.card}>
          <div style={S.cardTitle}>Attribution Waterfall</div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={waterfallData}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: T.textSec }} />
              <YAxis tick={{ fontSize: 10, fill: T.textSec }} tickFormatter={fmt} />
              <Tooltip content={<CTooltip />} />
              <Bar dataKey="value" name="tCO2e" radius={[4, 4, 0, 0]}>
                {waterfallData.map((d, i) => <Cell key={i} fill={d.fill} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Sensitivity */}
        <div style={S.card}>
          <div style={S.cardTitle}>Sensitivity Analysis (Attribution Factor +/-20%)</div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={sensitivityData}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="adjustment" tick={{ fontSize: 10, fill: T.textSec }} />
              <YAxis tick={{ fontSize: 10, fill: T.textSec }} tickFormatter={fmt} />
              <Tooltip content={<CTooltip />} />
              <Line type="monotone" dataKey="value" name="Net Attributable" stroke={T.sage} strokeWidth={2} dot={{ fill: T.sage, r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Sector Attribution Breakdown */}
      <div style={S.card}>
        <div style={S.cardTitle}>Sector-Level Attribution Breakdown</div>
        <table style={S.table}>
          <thead>
            <tr style={{ background: T.surfaceH }}>
              <th style={S.th}>Sector</th>
              <th style={{ ...S.th, textAlign: 'right' }}>Gross Avoided</th>
              <th style={{ ...S.th, textAlign: 'right' }}>Attributable</th>
              <th style={{ ...S.th, textAlign: 'right' }}>Double-Count Adj</th>
              <th style={{ ...S.th, textAlign: 'right' }}>Net Attributable</th>
              <th style={{ ...S.th, textAlign: 'right' }}>Attr. Rate</th>
              <th style={{ ...S.th, textAlign: 'right' }}>Companies</th>
            </tr>
          </thead>
          <tbody>
            {attribution.sectors.map(sec => (
              <React.Fragment key={sec.sector}>
                <tr style={{ cursor: 'pointer' }}
                  onClick={() => setExpandedSector(expandedSector === sec.sector ? null : sec.sector)}
                  onMouseEnter={e => e.currentTarget.style.background = T.surfaceH}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <td style={{ ...S.td, fontWeight: 600 }}>{expandedSector === sec.sector ? '\u25BC' : '\u25B6'} {sec.sector}</td>
                  <td style={{ ...S.td, textAlign: 'right', fontFamily: T.mono }}>{fmtInt(sec.gross)}</td>
                  <td style={{ ...S.td, textAlign: 'right', fontFamily: T.mono, color: T.sage }}>{fmtInt(sec.attributable)}</td>
                  <td style={{ ...S.td, textAlign: 'right', fontFamily: T.mono, color: T.red }}>-{fmtInt(sec.doubleCounting)}</td>
                  <td style={{ ...S.td, textAlign: 'right', fontFamily: T.mono, fontWeight: 700 }}>{fmtInt(sec.attributable - sec.doubleCounting)}</td>
                  <td style={{ ...S.td, textAlign: 'right', fontFamily: T.mono }}>{sec.gross > 0 ? ((sec.attributable / sec.gross) * 100).toFixed(1) : 0}%</td>
                  <td style={{ ...S.td, textAlign: 'right' }}>{sec.companies.length}</td>
                </tr>
                {expandedSector === sec.sector && sec.companies.slice(0, 15).map(c => (
                  <tr key={c.id} style={{ background: T.surfaceH }}>
                    <td style={{ ...S.td, paddingLeft: 32, fontSize: 11 }}>{c.company}</td>
                    <td style={{ ...S.td, textAlign: 'right', fontFamily: T.mono, fontSize: 11 }}>{fmtInt(c.avoided)}</td>
                    <td style={{ ...S.td, textAlign: 'right', fontFamily: T.mono, fontSize: 11, color: T.sage }}>{fmtInt(c.attributable)}</td>
                    <td style={{ ...S.td, textAlign: 'right', fontFamily: T.mono, fontSize: 11, color: T.red }}>-{fmtInt(c.dblCount)}</td>
                    <td style={{ ...S.td, textAlign: 'right', fontFamily: T.mono, fontSize: 11, fontWeight: 600 }}>{fmtInt(c.attributable - c.dblCount)}</td>
                    <td style={{ ...S.td, textAlign: 'right', fontFamily: T.mono, fontSize: 11 }}>{(c.attrFactor * 100).toFixed(2)}%</td>
                    <td style={{ ...S.td, textAlign: 'right', fontSize: 11 }}>
                      <input type="range" min={0} max={100} value={Math.round((attrFactors[c.id] || c.attrFactor) * 1000)}
                        onChange={e => updateFactor(c.id, Number(e.target.value) / 1000)}
                        style={{ width: 60, accentColor: T.sage }} />
                    </td>
                  </tr>
                ))}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {/* Attribution Factor Distribution */}
      <div style={S.card}>
        <div style={S.cardTitle}>Attribution Factor Distribution</div>
        <div style={{ marginBottom: 12, fontSize: 12, color: T.textSec }}>
          Distribution of portfolio attribution factors (Outstanding / EVIC). Higher factors indicate greater ownership share.
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={(() => {
            const buckets = [
              { range: '0-1%', min: 0, max: 0.01, count: 0 },
              { range: '1-2%', min: 0.01, max: 0.02, count: 0 },
              { range: '2-3%', min: 0.02, max: 0.03, count: 0 },
              { range: '3-4%', min: 0.03, max: 0.04, count: 0 },
              { range: '4-5%', min: 0.04, max: 0.05, count: 0 },
              { range: '5-6%', min: 0.05, max: 0.06, count: 0 },
              { range: '6-8%', min: 0.06, max: 0.08, count: 0 },
              { range: '8%+', min: 0.08, max: 1, count: 0 }
            ];
            HOLDINGS.forEach(h => {
              const f = attrFactors[h.id] || h.attrFactor;
              const b = buckets.find(bu => f >= bu.min && f < bu.max);
              if (b) b.count++;
            });
            return buckets;
          })()}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="range" tick={{ fontSize: 10, fill: T.textSec }} />
            <YAxis tick={{ fontSize: 10, fill: T.textSec }} />
            <Tooltip content={<CTooltip />} />
            <Bar dataKey="count" name="Companies" fill={T.navyL} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
        <div style={{ display: 'flex', gap: 20, marginTop: 12, fontSize: 11, color: T.textSec }}>
          <span>Mean: {(HOLDINGS.reduce((a, h) => a + (attrFactors[h.id] || h.attrFactor), 0) / HOLDINGS.length * 100).toFixed(2)}%</span>
          <span>Median: {(HOLDINGS.map(h => attrFactors[h.id] || h.attrFactor).sort((a, b) => a - b)[75] * 100).toFixed(2)}%</span>
          <span>Max: {(Math.max(...HOLDINGS.map(h => attrFactors[h.id] || h.attrFactor)) * 100).toFixed(2)}%</span>
        </div>
      </div>

      {/* Double-Counting Analysis */}
      <div style={S.card}>
        <div style={S.cardTitle}>Double-Counting Risk Analysis by Sector</div>
        <div style={{ fontSize: 12, color: T.textSec, marginBottom: 12 }}>
          Estimates overlap where multiple investors may claim the same avoided emissions. Sectors with high co-investment density show elevated double-counting risk.
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10 }}>
          {attribution.sectors.slice(0, 12).map(sec => {
            const dblRate = sec.attributable > 0 ? sec.doubleCounting / sec.attributable : 0;
            const riskColor = dblRate > 0.12 ? T.red : dblRate > 0.08 ? T.amber : T.green;
            return (
              <div key={sec.sector} style={{ padding: '10px 14px', borderRadius: 8, border: `1px solid ${T.border}`, background: `${riskColor}08` }}>
                <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 4 }}>{sec.sector}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10 }}>
                  <span style={{ color: T.textSec }}>Overlap Rate</span>
                  <span style={{ fontWeight: 700, color: riskColor }}>{(dblRate * 100).toFixed(1)}%</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10 }}>
                  <span style={{ color: T.textSec }}>Adjustment</span>
                  <span style={{ fontFamily: T.mono, color: T.red }}>-{fmtInt(sec.doubleCounting)}</span>
                </div>
                <div style={{ marginTop: 4, height: 4, background: T.border, borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${Math.min(dblRate * 500, 100)}%`, background: riskColor, borderRadius: 2 }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Methodology Comparison */}
      <div style={S.card}>
        <div style={S.cardTitle}>Methodology Comparison: PCAF vs Proprietary (Top 30 by Delta)</div>
        <ResponsiveContainer width="100%" height={360}>
          <BarChart data={methodComparison.slice(0, 20)} layout="vertical" margin={{ left: 160, right: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis type="number" tick={{ fontSize: 10, fill: T.textSec }} tickFormatter={fmt} />
            <YAxis type="category" dataKey="company" tick={{ fontSize: 9, fill: T.textSec }} width={150} />
            <Tooltip content={<CTooltip />} />
            <Legend />
            <Bar dataKey="pcaf" name="PCAF" fill={T.navyL} opacity={0.8} />
            <Bar dataKey="proprietary" name="Proprietary" fill={T.gold} opacity={0.8} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════ */
/* TAB 4: Investment Impact Report             */
/* ════════════════════════════════════════════ */
function Tab4InvestmentImpactReport() {
  const [dateRange, setDateRange] = useState('12Q');
  const [showPrint, setShowPrint] = useState(false);

  const PEERS = ['Climate Alpha Fund','Green Horizon Partners','Sustainable Growth ETF','Net-Zero Capital Fund','Impact Transition Fund'];

  const totalAUM = useMemo(() => HOLDINGS.reduce((a, h) => a + h.aumWeight, 0) * 10, []);
  const totalAvoided = useMemo(() => HOLDINGS.reduce((a, h) => a + h.avoided, 0), []);
  const totalEmitted = useMemo(() => HOLDINGS.reduce((a, h) => a + h.emitted, 0), []);
  const dollarPerAvoid = totalAUM > 0 ? (totalAUM * 1e6) / totalAvoided : 0;
  const avoidedPerMAUM = totalAUM > 0 ? totalAvoided / (totalAUM) : 0;

  const trajectoryData = useMemo(() => {
    const quarters = dateRange === '4Q' ? QUARTERS.slice(-4) : dateRange === '8Q' ? QUARTERS.slice(-8) : QUARTERS;
    return quarters.map((q, qi) => {
      let emSum = 0, avSum = 0, solSum = 0, wSum = 0;
      HOLDINGS.forEach(h => {
        const t = h.qTrend[dateRange === '4Q' ? qi + 8 : dateRange === '8Q' ? qi + 4 : qi];
        if (t) { emSum += t.emitted; avSum += t.avoided; solSum += t.solutionRev * h.aumWeight; wSum += h.aumWeight; }
      });
      return { quarter: q, emitted: emSum, avoided: avSum, net: emSum - avSum, solutionExposure: wSum > 0 ? (solSum / wSum) * 100 : 0 };
    });
  }, [dateRange]);

  const peerComparison = useMemo(() => {
    return PEERS.map((peer, pi) => ({
      peer,
      avoidedPerM: avoidedPerMAUM * (0.4 + sr(pi * 53 + 7) * 1.0),
      solutionExposure: 15 + sr(pi * 59 + 13) * 35,
      netImpactRatio: (totalAvoided / totalEmitted) * (0.5 + sr(pi * 61 + 17) * 0.8),
      dollarEfficiency: dollarPerAvoid * (0.6 + sr(pi * 67 + 19) * 1.2)
    }));
  }, [avoidedPerMAUM, dollarPerAvoid, totalAvoided, totalEmitted]);

  const sdgAlignment = useMemo(() => {
    const map = {};
    Object.keys(SDG_MAP).forEach(k => { map[k] = { sdg: `SDG ${k}`, name: SDG_MAP[k], avoided: 0, companies: 0 }; });
    HOLDINGS.forEach(h => {
      h.sdgs.forEach(s => {
        if (map[s]) { map[s].avoided += h.avoided / h.sdgs.length; map[s].companies += 1; }
      });
    });
    return Object.values(map).sort((a, b) => b.avoided - a.avoided);
  }, []);

  const handleExportCSV = useCallback(() => {
    const headers = ['Company','Sector','AUM Weight %','Emitted tCO2e','Avoided tCO2e','Net Impact','Solution Rev %','Credibility Tier','EVIC $M','Attribution Factor','Solution Category','SDGs'];
    const rows = HOLDINGS.map(h => [h.company, h.sector, h.aumWeight.toFixed(2), Math.round(h.emitted), Math.round(h.avoided), Math.round(h.net), (h.solutionRevPct * 100).toFixed(1), h.tier, h.evic.toFixed(0), (h.attrFactor * 100).toFixed(2), h.solutionCat, h.sdgs.join(';')]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'avoided_emissions_impact_report.csv';
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  return (
    <div>
      {/* Controls */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 18, alignItems: 'center', flexWrap: 'wrap' }}>
        <span style={{ fontSize: 12, fontWeight: 600 }}>Date Range:</span>
        {['4Q', '8Q', '12Q'].map(r => (
          <button key={r} style={S.btn(dateRange === r)} onClick={() => setDateRange(r)}>{r}</button>
        ))}
        <div style={{ flex: 1 }} />
        <button style={S.btn(false)} onClick={handleExportCSV}>Export CSV</button>
        <button style={S.btn(showPrint)} onClick={() => setShowPrint(!showPrint)}>
          {showPrint ? 'Exit Print Preview' : 'Print Preview'}
        </button>
      </div>

      {/* KPIs */}
      <div style={S.kpiStrip}>
        <div style={S.kpi}>
          <div style={S.kpiLabel}>$ Invested per tCO2e Avoided</div>
          <div style={S.kpiVal}>${fmtInt(dollarPerAvoid)}</div>
          <div style={S.kpiSub}>efficiency metric</div>
        </div>
        <div style={S.kpi}>
          <div style={S.kpiLabel}>Avoided per $M AUM</div>
          <div style={{ ...S.kpiVal, color: T.green }}>{fmtInt(avoidedPerMAUM)} tCO2e</div>
          <div style={S.kpiSub}>intensity metric</div>
        </div>
        <div style={S.kpi}>
          <div style={S.kpiLabel}>Solution Exposure Trend</div>
          <div style={{ ...S.kpiVal, color: T.sage }}>
            {trajectoryData.length >= 2 ? (trajectoryData[trajectoryData.length - 1].solutionExposure > trajectoryData[0].solutionExposure ? '\u2191' : '\u2193') : '-'}
            {trajectoryData.length > 0 ? ` ${trajectoryData[trajectoryData.length - 1].solutionExposure.toFixed(1)}%` : '-'}
          </div>
          <div style={S.kpiSub}>latest quarter</div>
        </div>
        <div style={S.kpi}>
          <div style={S.kpiLabel}>Net Climate Impact</div>
          <div style={{ ...S.kpiVal, color: (totalEmitted - totalAvoided) > 0 ? T.red : T.green }}>{fmt(totalEmitted - totalAvoided)} tCO2e</div>
          <div style={S.kpiSub}>{(totalEmitted - totalAvoided) > 0 ? 'net emitter' : 'net avoider'}</div>
        </div>
        <div style={S.kpi}>
          <div style={S.kpiLabel}>Total AUM</div>
          <div style={S.kpiVal}>${fmt(totalAUM * 1e6)}</div>
          <div style={S.kpiSub}>under management</div>
        </div>
      </div>

      {showPrint && (
        <div style={{ ...S.card, border: `2px solid ${T.sage}`, padding: 32 }}>
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <h2 style={{ color: T.navy, margin: 0 }}>Avoided Emissions Impact Report</h2>
            <div style={{ fontSize: 12, color: T.textSec, marginTop: 4 }}>Generated: {new Date().toLocaleDateString()} | Period: {dateRange} | 150 Holdings</div>
          </div>
          <div style={{ borderTop: `2px solid ${T.border}`, paddingTop: 16 }}>
            <div style={S.grid3}>
              <div><span style={{ fontSize: 11, color: T.textMut }}>Avoided / $M AUM</span><div style={{ fontSize: 18, fontWeight: 700 }}>{fmtInt(avoidedPerMAUM)} tCO2e</div></div>
              <div><span style={{ fontSize: 11, color: T.textMut }}>$ / tCO2e Avoided</span><div style={{ fontSize: 18, fontWeight: 700 }}>${fmtInt(dollarPerAvoid)}</div></div>
              <div><span style={{ fontSize: 11, color: T.textMut }}>Impact Ratio</span><div style={{ fontSize: 18, fontWeight: 700 }}>{((totalAvoided / totalEmitted) * 100).toFixed(1)}%</div></div>
            </div>
          </div>
        </div>
      )}

      {/* Net Climate Impact Trajectory */}
      <div style={S.card}>
        <div style={S.cardTitle}>Net Climate Impact Trajectory</div>
        <ResponsiveContainer width="100%" height={320}>
          <AreaChart data={trajectoryData}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="quarter" tick={{ fontSize: 10, fill: T.textSec }} />
            <YAxis tick={{ fontSize: 10, fill: T.textSec }} tickFormatter={fmt} />
            <Tooltip content={<CTooltip />} />
            <Legend />
            <Area type="monotone" dataKey="emitted" name="Emitted" stroke={T.red} fill={T.red} fillOpacity={0.1} />
            <Area type="monotone" dataKey="avoided" name="Avoided" stroke={T.green} fill={T.green} fillOpacity={0.1} />
            <Line type="monotone" dataKey="net" name="Net Impact" stroke={T.navy} strokeWidth={2} dot={{ fill: T.navy, r: 3 }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div style={S.grid2}>
        {/* Peer Comparison */}
        <div style={S.card}>
          <div style={S.cardTitle}>Peer Comparison</div>
          <table style={S.table}>
            <thead>
              <tr style={{ background: T.surfaceH }}>
                <th style={S.th}>Fund</th>
                <th style={{ ...S.th, textAlign: 'right' }}>Avoided/M</th>
                <th style={{ ...S.th, textAlign: 'right' }}>Sol. Exp%</th>
                <th style={{ ...S.th, textAlign: 'right' }}>Impact Ratio</th>
                <th style={{ ...S.th, textAlign: 'right' }}>$/tCO2e</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ background: `${T.sage}11`, fontWeight: 700 }}>
                <td style={S.td}>This Portfolio</td>
                <td style={{ ...S.td, textAlign: 'right', fontFamily: T.mono }}>{fmtInt(avoidedPerMAUM)}</td>
                <td style={{ ...S.td, textAlign: 'right', fontFamily: T.mono }}>
                  {(HOLDINGS.reduce((a, h) => a + h.solutionRevPct * h.aumWeight, 0) / HOLDINGS.reduce((a, h) => a + h.aumWeight, 0) * 100).toFixed(1)}%
                </td>
                <td style={{ ...S.td, textAlign: 'right', fontFamily: T.mono }}>{((totalAvoided / totalEmitted) * 100).toFixed(1)}%</td>
                <td style={{ ...S.td, textAlign: 'right', fontFamily: T.mono }}>${fmtInt(dollarPerAvoid)}</td>
              </tr>
              {peerComparison.map(p => (
                <tr key={p.peer}>
                  <td style={S.td}>{p.peer}</td>
                  <td style={{ ...S.td, textAlign: 'right', fontFamily: T.mono }}>{fmtInt(p.avoidedPerM)}</td>
                  <td style={{ ...S.td, textAlign: 'right', fontFamily: T.mono }}>{p.solutionExposure.toFixed(1)}%</td>
                  <td style={{ ...S.td, textAlign: 'right', fontFamily: T.mono }}>{(p.netImpactRatio * 100).toFixed(1)}%</td>
                  <td style={{ ...S.td, textAlign: 'right', fontFamily: T.mono }}>${fmtInt(p.dollarEfficiency)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* SDG Alignment */}
        <div style={S.card}>
          <div style={S.cardTitle}>SDG Alignment Mapping</div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={sdgAlignment}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="sdg" tick={{ fontSize: 10, fill: T.textSec }} />
              <YAxis tick={{ fontSize: 10, fill: T.textSec }} tickFormatter={fmt} />
              <Tooltip content={<CTooltip />} />
              <Bar dataKey="avoided" name="Avoided tCO2e" fill={T.sage} radius={[4, 4, 0, 0]}>
                {sdgAlignment.map((d, i) => <Cell key={i} fill={[T.gold, T.navyL, T.sage, T.sageL, T.navy, T.amber, T.green][i % 7]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div style={{ marginTop: 12 }}>
            {sdgAlignment.map(s => (
              <div key={s.sdg} style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', borderBottom: `1px solid ${T.border}`, fontSize: 11 }}>
                <span style={{ fontWeight: 600 }}>{s.sdg}</span>
                <span style={{ color: T.textSec }}>{s.name}</span>
                <span style={{ fontFamily: T.mono }}>{s.companies} companies</span>
                <span style={{ fontFamily: T.mono, color: T.green }}>{fmtInt(s.avoided)} tCO2e</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Solution Exposure Trend */}
      <div style={S.card}>
        <div style={S.cardTitle}>Climate Solution Exposure Trend</div>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={trajectoryData}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="quarter" tick={{ fontSize: 10, fill: T.textSec }} />
            <YAxis tick={{ fontSize: 10, fill: T.textSec }} tickFormatter={v => `${v.toFixed(0)}%`} />
            <Tooltip content={<CTooltip />} />
            <Line type="monotone" dataKey="solutionExposure" name="Solution Exposure %" stroke={T.sage} strokeWidth={2} dot={{ fill: T.sage, r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Quarterly Metrics Table */}
      <div style={S.card}>
        <div style={S.cardTitle}>Quarterly Impact Metrics Summary</div>
        <div style={{ overflowX: 'auto' }}>
          <table style={S.table}>
            <thead>
              <tr style={{ background: T.surfaceH }}>
                <th style={S.th}>Quarter</th>
                <th style={{ ...S.th, textAlign: 'right' }}>Emitted tCO2e</th>
                <th style={{ ...S.th, textAlign: 'right' }}>Avoided tCO2e</th>
                <th style={{ ...S.th, textAlign: 'right' }}>Net Impact</th>
                <th style={{ ...S.th, textAlign: 'right' }}>Solution Exp %</th>
                <th style={{ ...S.th, textAlign: 'right' }}>Impact Ratio</th>
                <th style={{ ...S.th, textAlign: 'right' }}>QoQ Change</th>
              </tr>
            </thead>
            <tbody>
              {trajectoryData.map((q, qi) => {
                const prev = qi > 0 ? trajectoryData[qi - 1] : null;
                const qoq = prev && prev.avoided > 0 ? ((q.avoided - prev.avoided) / prev.avoided) * 100 : 0;
                const ratio = q.emitted > 0 ? (q.avoided / q.emitted) * 100 : 0;
                return (
                  <tr key={q.quarter}>
                    <td style={{ ...S.td, fontWeight: 600 }}>{q.quarter}</td>
                    <td style={{ ...S.td, textAlign: 'right', fontFamily: T.mono, color: T.red }}>{fmtInt(q.emitted)}</td>
                    <td style={{ ...S.td, textAlign: 'right', fontFamily: T.mono, color: T.green }}>{fmtInt(q.avoided)}</td>
                    <td style={{ ...S.td, textAlign: 'right', fontFamily: T.mono, color: q.net > 0 ? T.red : T.green }}>{fmtInt(q.net)}</td>
                    <td style={{ ...S.td, textAlign: 'right', fontFamily: T.mono }}>{q.solutionExposure.toFixed(1)}%</td>
                    <td style={{ ...S.td, textAlign: 'right', fontFamily: T.mono }}>{ratio.toFixed(1)}%</td>
                    <td style={{ ...S.td, textAlign: 'right', fontFamily: T.mono, color: qoq >= 0 ? T.green : T.red }}>
                      {qi > 0 ? `${qoq >= 0 ? '+' : ''}${qoq.toFixed(1)}%` : '-'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Peer Ranking Chart */}
      <div style={S.card}>
        <div style={S.cardTitle}>Peer Ranking: Avoided Emissions per $M AUM</div>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={[
            { name: 'This Portfolio', value: avoidedPerMAUM, fill: T.sage },
            ...peerComparison.map(p => ({ name: p.peer, value: p.avoidedPerM, fill: T.navyL }))
          ].sort((a, b) => b.value - a.value)}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="name" tick={{ fontSize: 9, fill: T.textSec }} angle={-20} textAnchor="end" height={60} />
            <YAxis tick={{ fontSize: 10, fill: T.textSec }} tickFormatter={fmtInt} />
            <Tooltip content={<CTooltip />} />
            <Bar dataKey="value" name="Avoided/M AUM" radius={[4, 4, 0, 0]}>
              {[
                { name: 'This Portfolio', value: avoidedPerMAUM, fill: T.sage },
                ...peerComparison.map(p => ({ name: p.peer, value: p.avoidedPerM, fill: T.navyL }))
              ].sort((a, b) => b.value - a.value).map((d, i) => (
                <Cell key={i} fill={d.name === 'This Portfolio' ? T.sage : T.navyL} opacity={d.name === 'This Portfolio' ? 1 : 0.6} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Avoided Efficiency Scatter */}
      <div style={S.card}>
        <div style={S.cardTitle}>Portfolio Holdings: AUM Weight vs Avoided Emissions Intensity</div>
        <ResponsiveContainer width="100%" height={340}>
          <ScatterChart margin={{ left: 20, right: 20, top: 10, bottom: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis type="number" dataKey="aumWeight" name="AUM Weight" tick={{ fontSize: 10, fill: T.textSec }} label={{ value: 'AUM Weight %', position: 'bottom', fontSize: 11 }} />
            <YAxis type="number" dataKey="avoided" name="Avoided tCO2e" tick={{ fontSize: 10, fill: T.textSec }} tickFormatter={fmt} label={{ value: 'Avoided tCO2e', angle: -90, position: 'insideLeft', fontSize: 11 }} />
            <Tooltip cursor={{ strokeDasharray: '3 3' }} formatter={(v, n) => [typeof v === 'number' ? fmtInt(v) : v, n]} />
            <Scatter name="Holdings" data={HOLDINGS} fill={T.sage}>
              {HOLDINGS.map((h, i) => <Cell key={i} fill={SECTOR_COLORS[h.sector] || T.sage} opacity={0.7} />)}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════ */
/* MAIN EXPORT                                 */
/* ════════════════════════════════════════════ */
export default function AvoidedEmissionsPortfolioPage() {
  const [tab, setTab] = useState(0);

  return (
    <div style={S.page}>
      <div style={S.header}>
        <h1 style={S.title}>Avoided Emissions Portfolio Analytics</h1>
        <div style={S.subtitle}>
          EP-AO4 | Portfolio-level avoided emissions tracking, climate solution exposure analysis, and investment impact attribution | 150 holdings across 15 sectors
        </div>
      </div>

      <div style={S.tabBar}>
        {TABS.map((t, i) => (
          <button key={i} style={S.tab(tab === i)} onClick={() => setTab(i)}>{t}</button>
        ))}
      </div>

      {tab === 0 && <Tab1PortfolioClimateImpact />}
      {tab === 1 && <Tab2ClimateSolutionExposure />}
      {tab === 2 && <Tab3ImpactAttribution />}
      {tab === 3 && <Tab4InvestmentImpactReport />}
    </div>
  );
}
