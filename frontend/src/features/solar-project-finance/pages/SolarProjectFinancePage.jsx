import React, { useState, useMemo } from 'react';

const T = { bg: '#f8f6f0', card: '#ffffff', border: '#e2ded5', borderL: '#ede9e0', sub: '#f6f4f0', navy: '#1e3a5f', gold: '#b8860b', cream: '#faf8f3', textPri: '#1a1a2e', textSec: '#6b7280', green: '#16a34a', red: '#dc2626', blue: '#0369a1', amber: '#d97706', sage: '#4d7c5f', teal: '#0f766e', indigo: '#4f46e5', purple: '#7c3aed', orange: '#ea580c', surfaceH: '#f1ede4', fontMono: 'JetBrains Mono, monospace' };
const sr = s => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };

const MARKETS = ['USA','Germany','Spain','India','Australia','UK','Japan','Brazil'];
const TECH_TYPES = ['Fixed-Tilt Utility','Tracking Utility','Rooftop C&I','Floating Solar','Agri-PV','BESS+Solar'];
const PPA_STRUCTS = ['Corporate PPA','Utility PPA','Merchant','Feed-in Tariff','CfD','Hybrid'];

const PROJECTS = Array.from({ length: 70 }, (_, i) => {
  const market = MARKETS[Math.floor(sr(i * 7) * MARKETS.length)];
  const tech = TECH_TYPES[Math.floor(sr(i * 13 + 2) * TECH_TYPES.length)];
  const ppa = PPA_STRUCTS[Math.floor(sr(i * 11 + 4) * PPA_STRUCTS.length)];
  const capacityMw = Math.round(20 + sr(i * 3 + 1) * 480);
  const lcoe = parseFloat((18 + sr(i * 5 + 2) * 42).toFixed(1));
  const irr = parseFloat((6 + sr(i * 9 + 3) * 14).toFixed(2));
  const npv = parseFloat((5 + sr(i * 17 + 1) * 95).toFixed(1));
  const capex = parseFloat((0.4 + sr(i * 23 + 2) * 1.1).toFixed(2));
  const cf = parseFloat((0.14 + sr(i * 31 + 3) * 0.22).toFixed(3));
  const dscr = parseFloat((1.1 + sr(i * 7 + 5) * 1.4).toFixed(2));
  const debtPct = parseFloat((55 + sr(i * 19 + 6) * 30).toFixed(1));
  const ppaTenor = Math.round(10 + sr(i * 41 + 7) * 15);
  const status = ['Operational','Construction','Development','Late-Stage Dev','Shovel-Ready'][Math.floor(sr(i * 29 + 8) * 5)];
  return { id: i + 1, name: `${market} Solar ${String.fromCharCode(65 + (i % 26))}-${i + 1}`, market, tech, ppa, capacityMw, lcoe, irr, npv, capex, cf, dscr, debtPct, ppaTenor, status };
});

const KpiCard = ({ label, value, sub, color }) => (
  <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: '16px 20px', flex: '1 1 160px' }}>
    <div style={{ fontSize: 11, color: T.textSec, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>{label}</div>
    <div style={{ fontSize: 22, fontWeight: 700, color: color || T.navy }}>{value}</div>
    {sub && <div style={{ fontSize: 11, color: T.textSec, marginTop: 2 }}>{sub}</div>}
  </div>
);

const MiniBar = ({ value, max, color }) => (
  <div style={{ background: T.sub, borderRadius: 4, height: 6, width: '100%', overflow: 'hidden' }}>
    <div style={{ width: `${Math.min(100, (value / max) * 100)}%`, background: color || T.indigo, height: '100%', borderRadius: 4 }} />
  </div>
);

const TABS = ['Overview','IRR / NPV Analysis','LCOE Curves','PPA Structuring','Grid Parity','Debt & DSCR','Market Breakdown','Scenario Analysis'];

export default function SolarProjectFinancePage() {
  const [tab, setTab] = useState(0);
  const [mktFilter, setMktFilter] = useState('All');
  const [techFilter, setTechFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [sortCol, setSortCol] = useState('irr');
  const [sortAsc, setSortAsc] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [targetIrr, setTargetIrr] = useState(10);

  const filtered = useMemo(() => PROJECTS.filter(p =>
    (mktFilter === 'All' || p.market === mktFilter) &&
    (techFilter === 'All' || p.tech === techFilter) &&
    (statusFilter === 'All' || p.status === statusFilter)
  ), [mktFilter, techFilter, statusFilter]);

  const sorted = useMemo(() => [...filtered].sort((a, b) => {
    const aVal = a[sortCol]; const bVal = b[sortCol];
    return sortAsc ? (aVal > bVal ? 1 : -1) : (aVal < bVal ? 1 : -1);
  }), [filtered, sortCol, sortAsc]);

  const n = Math.max(1, filtered.length);
  const avgIrr = filtered.reduce((s, p) => s + p.irr, 0) / n;
  const avgLcoe = filtered.reduce((s, p) => s + p.lcoe, 0) / n;
  const totalMw = filtered.reduce((s, p) => s + p.capacityMw, 0);
  const avgNpv = filtered.reduce((s, p) => s + p.npv, 0) / n;
  const avgDscr = filtered.reduce((s, p) => s + p.dscr, 0) / n;
  const gridParityCount = filtered.filter(p => p.lcoe < 40).length;
  const irrAboveTarget = filtered.filter(p => p.irr >= targetIrr).length;

  const selected = selectedId ? PROJECTS.find(p => p.id === selectedId) : null;

  const lcoeByTech = TECH_TYPES.map(t => {
    const arr = PROJECTS.filter(p => p.tech === t);
    return { tech: t, lcoe: arr.length ? arr.reduce((s, p) => s + p.lcoe, 0) / arr.length : 0 };
  });
  const irrByMarket = MARKETS.map(m => {
    const arr = PROJECTS.filter(p => p.market === m);
    return { market: m, irr: arr.length ? arr.reduce((s, p) => s + p.irr, 0) / arr.length : 0 };
  });
  const ppaBreakdown = PPA_STRUCTS.map(s => ({ struct: s, count: PROJECTS.filter(p => p.ppa === s).length }));
  const debtBands = [
    { band: '55–65%', count: PROJECTS.filter(p => p.debtPct < 65).length },
    { band: '65–75%', count: PROJECTS.filter(p => p.debtPct >= 65 && p.debtPct < 75).length },
    { band: '75–85%', count: PROJECTS.filter(p => p.debtPct >= 75).length },
  ];

  const headerStyle = { background: T.sub, padding: '20px 28px 0', borderBottom: `1px solid ${T.border}` };
  const tabStyle = (i) => ({ padding: '8px 16px', marginRight: 4, cursor: 'pointer', borderRadius: '6px 6px 0 0', fontSize: 13, fontWeight: tab === i ? 600 : 400, color: tab === i ? T.navy : T.textSec, background: tab === i ? T.card : 'transparent', border: tab === i ? `1px solid ${T.border}` : '1px solid transparent', borderBottom: tab === i ? `1px solid ${T.card}` : '1px solid transparent', marginBottom: -1 });
  const thStyle = { padding: '8px 12px', fontSize: 11, color: T.textSec, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', cursor: 'pointer', whiteSpace: 'nowrap', background: T.sub };

  return (
    <div style={{ fontFamily: "'DM Sans', system-ui, sans-serif", background: T.bg, minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ background: T.navy, padding: '18px 28px', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 11, color: '#94a3b8', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 2 }}>EP-DO1 · Renewable Energy Finance</div>
          <div style={{ fontSize: 20, fontWeight: 700 }}>Solar Project Finance</div>
          <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>IRR / NPV · LCOE Curves · PPA Structuring · Grid Parity — 70 Projects · 8 Markets</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 26, fontWeight: 700, color: T.gold }}>{avgIrr.toFixed(1)}%</div>
          <div style={{ fontSize: 11, color: '#94a3b8' }}>Avg Portfolio IRR</div>
        </div>
      </div>

      {/* KPI Row */}
      <div style={{ padding: '16px 28px', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <KpiCard label="Total Capacity" value={`${(totalMw / 1000).toFixed(1)} GW`} sub={`${n} projects`} />
        <KpiCard label="Avg LCOE" value={`$${avgLcoe.toFixed(1)}/MWh`} sub="Portfolio average" color={T.green} />
        <KpiCard label="Avg NPV" value={`$${avgNpv.toFixed(0)}M`} sub="Project average" color={T.indigo} />
        <KpiCard label="Avg DSCR" value={avgDscr.toFixed(2)} sub="Debt service coverage" color={avgDscr >= 1.3 ? T.green : T.amber} />
        <KpiCard label="Grid Parity" value={`${gridParityCount}/${n}`} sub="LCOE < $40/MWh" color={T.teal} />
        <KpiCard label="IRR ≥ Target" value={`${irrAboveTarget}`} sub={`of ${n} @ ${targetIrr}% target`} color={T.green} />
      </div>

      {/* Filters */}
      <div style={{ padding: '0 28px 12px', display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        {[['Market', MARKETS, mktFilter, setMktFilter], ['Technology', TECH_TYPES, techFilter, setTechFilter], ['Status', ['Operational','Construction','Development','Late-Stage Dev','Shovel-Ready'], statusFilter, setStatusFilter]].map(([lbl, opts, val, setter]) => (
          <div key={lbl} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 12, color: T.textSec }}>{lbl}:</span>
            <select value={val} onChange={e => setter(e.target.value)} style={{ fontSize: 12, padding: '4px 8px', border: `1px solid ${T.border}`, borderRadius: 6, background: T.card }}>
              <option value="All">All</option>
              {opts.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
        ))}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 12, color: T.textSec }}>Target IRR:</span>
          <input type="range" min={6} max={18} step={0.5} value={targetIrr} onChange={e => setTargetIrr(+e.target.value)} style={{ width: 80 }} />
          <span style={{ fontSize: 12, fontWeight: 700, color: T.navy, fontFamily: T.fontMono }}>{targetIrr}%</span>
        </div>
      </div>

      {/* Tabs */}
      <div style={headerStyle}>
        <div style={{ display: 'flex', gap: 2 }}>
          {TABS.map((t, i) => <button key={i} style={tabStyle(i)} onClick={() => setTab(i)}>{t}</button>)}
        </div>
      </div>

      <div style={{ padding: '24px 28px' }}>
        {/* Tab 0: Overview */}
        {tab === 0 && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: T.navy, marginBottom: 14 }}>Average LCOE by Technology ($/ MWh)</div>
                {lcoeByTech.map(({ tech, lcoe }) => (
                  <div key={tech} style={{ marginBottom: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                      <span style={{ fontSize: 12, color: T.textPri }}>{tech}</span>
                      <span style={{ fontSize: 12, fontWeight: 700, fontFamily: T.fontMono, color: T.navy }}>${lcoe.toFixed(1)}</span>
                    </div>
                    <MiniBar value={lcoe} max={70} color={T.sage} />
                  </div>
                ))}
              </div>
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: T.navy, marginBottom: 14 }}>Average IRR by Market (%)</div>
                {irrByMarket.map(({ market, irr }) => (
                  <div key={market} style={{ marginBottom: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                      <span style={{ fontSize: 12, color: T.textPri }}>{market}</span>
                      <span style={{ fontSize: 12, fontWeight: 700, fontFamily: T.fontMono, color: T.navy }}>{irr.toFixed(2)}%</span>
                    </div>
                    <MiniBar value={irr} max={20} color={T.indigo} />
                  </div>
                ))}
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: T.navy, marginBottom: 14 }}>PPA Structure Mix</div>
                {ppaBreakdown.map(({ struct, count }) => (
                  <div key={struct} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: `1px solid ${T.borderL}` }}>
                    <span style={{ fontSize: 12, color: T.textPri }}>{struct}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 80 }}><MiniBar value={count} max={15} color={T.gold} /></div>
                      <span style={{ fontSize: 12, fontWeight: 700, fontFamily: T.fontMono, width: 24, textAlign: 'right' }}>{count}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: T.navy, marginBottom: 14 }}>Project Status Distribution</div>
                {['Operational','Construction','Development','Late-Stage Dev','Shovel-Ready'].map(s => {
                  const cnt = PROJECTS.filter(p => p.status === s).length;
                  const colors = { Operational: T.green, Construction: T.blue, Development: T.amber, 'Late-Stage Dev': T.orange, 'Shovel-Ready': T.purple };
                  return (
                    <div key={s} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: `1px solid ${T.borderL}` }}>
                      <span style={{ fontSize: 12, color: T.textPri }}>{s}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 80 }}><MiniBar value={cnt} max={20} color={colors[s]} /></div>
                        <span style={{ fontSize: 12, fontWeight: 700, fontFamily: T.fontMono, width: 24, textAlign: 'right' }}>{cnt}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Tab 1: IRR / NPV Analysis */}
        {tab === 1 && (
          <div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, overflow: 'hidden', marginBottom: 20 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    {[['name','Project'],['market','Market'],['tech','Technology'],['capacityMw','MW'],['irr','IRR%'],['npv','NPV $M'],['capex','CapEx $/W'],['cf','CF'],['status','Status']].map(([col, lbl]) => (
                      <th key={col} style={thStyle} onClick={() => { setSortCol(col); setSortAsc(sortCol === col ? !sortAsc : false); }}>
                        {lbl} {sortCol === col ? (sortAsc ? '▲' : '▼') : ''}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sorted.slice(0, 25).map((p, i) => (
                    <tr key={p.id} onClick={() => setSelectedId(selectedId === p.id ? null : p.id)}
                      style={{ background: selectedId === p.id ? T.sub : i % 2 === 0 ? T.card : '#fafafa', cursor: 'pointer' }}>
                      <td style={{ padding: '7px 12px', fontSize: 12, fontWeight: 600, color: T.navy }}>{p.name}</td>
                      <td style={{ padding: '7px 12px', fontSize: 12, color: T.textSec }}>{p.market}</td>
                      <td style={{ padding: '7px 12px', fontSize: 12, color: T.textSec }}>{p.tech}</td>
                      <td style={{ padding: '7px 12px', fontSize: 12, fontFamily: T.fontMono, textAlign: 'right' }}>{p.capacityMw}</td>
                      <td style={{ padding: '7px 12px', fontSize: 12, fontFamily: T.fontMono, textAlign: 'right', color: p.irr >= targetIrr ? T.green : T.amber, fontWeight: 700 }}>{p.irr.toFixed(2)}%</td>
                      <td style={{ padding: '7px 12px', fontSize: 12, fontFamily: T.fontMono, textAlign: 'right', color: T.indigo }}>${p.npv.toFixed(0)}M</td>
                      <td style={{ padding: '7px 12px', fontSize: 12, fontFamily: T.fontMono, textAlign: 'right' }}>${p.capex.toFixed(2)}</td>
                      <td style={{ padding: '7px 12px', fontSize: 12, fontFamily: T.fontMono, textAlign: 'right' }}>{(p.cf * 100).toFixed(1)}%</td>
                      <td style={{ padding: '7px 12px', fontSize: 11 }}>
                        <span style={{ padding: '2px 8px', borderRadius: 10, background: p.status === 'Operational' ? '#dcfce7' : p.status === 'Construction' ? '#dbeafe' : '#fef9c3', color: p.status === 'Operational' ? T.green : p.status === 'Construction' ? T.blue : T.amber, fontWeight: 600 }}>{p.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {selected && (
              <div style={{ background: T.card, border: `1px solid ${T.indigo}`, borderRadius: 10, padding: 20 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: T.navy, marginBottom: 12 }}>{selected.name} — Detail</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
                  {[['Capacity',`${selected.capacityMw} MW`],['IRR',`${selected.irr.toFixed(2)}%`],['NPV',`$${selected.npv.toFixed(0)}M`],['CapEx',`$${selected.capex.toFixed(2)}/W`],['LCOE',`$${selected.lcoe.toFixed(1)}/MWh`],['Cap Factor',`${(selected.cf*100).toFixed(1)}%`],['PPA Structure',selected.ppa],['PPA Tenor',`${selected.ppaTenor} years`]].map(([k, v]) => (
                    <div key={k} style={{ background: T.sub, borderRadius: 6, padding: '10px 14px' }}>
                      <div style={{ fontSize: 11, color: T.textSec }}>{k}</div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: T.navy, fontFamily: T.fontMono }}>{v}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: LCOE Curves */}
        {tab === 2 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20 }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: T.navy, marginBottom: 14 }}>LCOE Distribution by Technology ($/ MWh)</div>
              {TECH_TYPES.map((tech, ti) => {
                const arr = PROJECTS.filter(p => p.tech === tech);
                const min = arr.length ? Math.min(...arr.map(p => p.lcoe)) : 0;
                const max = arr.length ? Math.max(...arr.map(p => p.lcoe)) : 0;
                const avg = arr.length ? arr.reduce((s, p) => s + p.lcoe, 0) / arr.length : 0;
                const colors = [T.sage, T.indigo, T.teal, T.orange, T.green, T.purple];
                return (
                  <div key={tech} style={{ marginBottom: 14 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: T.textPri }}>{tech}</span>
                      <span style={{ fontSize: 12, color: T.textSec }}>${min.toFixed(0)}–${max.toFixed(0)} · avg ${avg.toFixed(1)}</span>
                    </div>
                    <div style={{ position: 'relative', height: 12, background: T.sub, borderRadius: 6 }}>
                      <div style={{ position: 'absolute', left: `${((min - 18) / 60) * 100}%`, width: `${((max - min) / 60) * 100}%`, top: 0, height: '100%', background: colors[ti] + '40', borderRadius: 6 }} />
                      <div style={{ position: 'absolute', left: `${((avg - 18) / 60) * 100}%`, width: 3, top: 0, height: '100%', background: colors[ti], borderRadius: 2 }} />
                    </div>
                  </div>
                );
              })}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 11, color: T.textSec }}>
                <span>$18/MWh</span><span>$40/MWh (grid parity)</span><span>$78/MWh</span>
              </div>
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20 }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: T.navy, marginBottom: 14 }}>LCOE vs Capacity Factor — Scatter Summary</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {[['< $25/MWh', PROJECTS.filter(p => p.lcoe < 25)],['$25–$35/MWh', PROJECTS.filter(p => p.lcoe >= 25 && p.lcoe < 35)],['$35–$45/MWh', PROJECTS.filter(p => p.lcoe >= 35 && p.lcoe < 45)],['>$45/MWh', PROJECTS.filter(p => p.lcoe >= 45)]].map(([band, arr]) => {
                  const n2 = Math.max(1, arr.length);
                  const avgCf = arr.reduce((s, p) => s + p.cf, 0) / n2 * 100;
                  return (
                    <div key={band} style={{ background: T.sub, borderRadius: 8, padding: 14 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: T.navy }}>{band}</div>
                      <div style={{ fontSize: 11, color: T.textSec }}>{arr.length} projects</div>
                      <div style={{ fontSize: 18, fontWeight: 700, color: T.teal, marginTop: 4 }}>{avgCf.toFixed(1)}%</div>
                      <div style={{ fontSize: 10, color: T.textSec }}>avg capacity factor</div>
                    </div>
                  );
                })}
              </div>
              <div style={{ marginTop: 16, padding: 12, background: '#f0fdf4', borderRadius: 8, border: `1px solid #bbf7d0` }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: T.green }}>Grid Parity Analysis</div>
                <div style={{ fontSize: 12, color: T.textSec, marginTop: 4 }}>{gridParityCount} of {PROJECTS.length} projects ({(gridParityCount / PROJECTS.length * 100).toFixed(0)}%) achieve LCOE below $40/MWh grid parity threshold</div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: PPA Structuring */}
        {tab === 3 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20 }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: T.navy, marginBottom: 14 }}>PPA Tenor Distribution by Structure</div>
              {PPA_STRUCTS.map(struct => {
                const arr = PROJECTS.filter(p => p.ppa === struct);
                const avgTenor = arr.length ? arr.reduce((s, p) => s + p.ppaTenor, 0) / arr.length : 0;
                const avgIrr2 = arr.length ? arr.reduce((s, p) => s + p.irr, 0) / arr.length : 0;
                return (
                  <div key={struct} style={{ padding: '10px 0', borderBottom: `1px solid ${T.borderL}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: T.navy }}>{struct}</span>
                      <span style={{ fontSize: 12, color: T.textSec }}>{arr.length} projects</span>
                    </div>
                    <div style={{ display: 'flex', gap: 16, fontSize: 12, color: T.textSec }}>
                      <span>Avg Tenor: <b style={{ color: T.navy, fontFamily: T.fontMono }}>{avgTenor.toFixed(0)} yrs</b></span>
                      <span>Avg IRR: <b style={{ color: avgIrr2 >= 10 ? T.green : T.amber, fontFamily: T.fontMono }}>{avgIrr2.toFixed(1)}%</b></span>
                    </div>
                    <div style={{ marginTop: 6 }}><MiniBar value={arr.length} max={15} color={T.gold} /></div>
                  </div>
                );
              })}
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20 }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: T.navy, marginBottom: 14 }}>PPA Structuring Insights</div>
              {[
                { title: 'Corporate PPA Premium', value: '+0.8–1.2%', desc: 'IRR uplift vs merchant for investment-grade offtakers', color: T.green },
                { title: 'CfD Floor Protection', value: '£45–65/MWh', desc: 'UK AR5 CfD strike range for utility-scale solar', color: T.indigo },
                { title: 'FiT Regime Markets', value: '3/8 markets', desc: 'Germany, Japan, Spain still offer feed-in tariff support', color: T.blue },
                { title: 'Optimal Tenor Range', value: '15–20 years', desc: 'Peak IRR achieved with 15–20 yr bankable offtake', color: T.teal },
                { title: 'Virtual PPA Structures', value: '12 projects', desc: 'Financial/virtual PPA structures in USA portfolio', color: T.purple },
                { title: 'Merchant Revenue Risk', value: '18–25% cap', desc: 'Typical merchant cap on bankable financing structures', color: T.amber },
              ].map(({ title, value, desc, color }) => (
                <div key={title} style={{ padding: '10px 0', borderBottom: `1px solid ${T.borderL}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: T.textPri }}>{title}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color, fontFamily: T.fontMono }}>{value}</span>
                  </div>
                  <div style={{ fontSize: 11, color: T.textSec, marginTop: 2 }}>{desc}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 4: Grid Parity */}
        {tab === 4 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20 }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: T.navy, marginBottom: 14 }}>Grid Parity by Market</div>
              {MARKETS.map(mkt => {
                const arr = PROJECTS.filter(p => p.market === mkt);
                const parity = arr.filter(p => p.lcoe < 40).length;
                const pct = arr.length ? (parity / arr.length * 100) : 0;
                return (
                  <div key={mkt} style={{ marginBottom: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                      <span style={{ fontSize: 12, color: T.textPri }}>{mkt}</span>
                      <span style={{ fontSize: 12, fontWeight: 700, fontFamily: T.fontMono, color: pct >= 70 ? T.green : pct >= 40 ? T.amber : T.red }}>{pct.toFixed(0)}%</span>
                    </div>
                    <MiniBar value={pct} max={100} color={pct >= 70 ? T.green : pct >= 40 ? T.amber : T.red} />
                  </div>
                );
              })}
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20 }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: T.navy, marginBottom: 14 }}>LCOE Trend & Forecast ($/ MWh)</div>
              {[{ year: '2020', lcoe: 52, color: T.red }, { year: '2022', lcoe: 41, color: T.amber }, { year: '2024', lcoe: 32, color: T.sage }, { year: '2026E', lcoe: 26, color: T.green }, { year: '2030E', lcoe: 20, color: T.teal }, { year: '2035E', lcoe: 16, color: T.indigo }].map(({ year, lcoe, color }) => (
                <div key={year} style={{ marginBottom: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                    <span style={{ fontSize: 12, color: T.textPri }}>{year}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, fontFamily: T.fontMono, color }}>${lcoe}/MWh</span>
                  </div>
                  <MiniBar value={lcoe} max={60} color={color} />
                </div>
              ))}
              <div style={{ marginTop: 12, padding: 10, background: '#f0fdf4', borderRadius: 6, fontSize: 12, color: T.green }}>
                Solar LCOE has declined ~70% since 2010. Tracking utility-scale projects now achieve $18–28/MWh in high-irradiance markets.
              </div>
            </div>
          </div>
        )}

        {/* Tab 5: Debt & DSCR */}
        {tab === 5 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20 }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: T.navy, marginBottom: 14 }}>Debt Structure Analysis</div>
              <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
                {debtBands.map(({ band, count }) => (
                  <div key={band} style={{ background: T.sub, borderRadius: 8, padding: '10px 16px', flex: 1 }}>
                    <div style={{ fontSize: 11, color: T.textSec }}>{band} Gearing</div>
                    <div style={{ fontSize: 20, fontWeight: 700, color: T.navy, fontFamily: T.fontMono }}>{count}</div>
                    <div style={{ fontSize: 11, color: T.textSec }}>projects</div>
                  </div>
                ))}
              </div>
              <div style={{ fontWeight: 600, fontSize: 13, color: T.navy, marginBottom: 10 }}>DSCR Distribution</div>
              {[['< 1.15 (Tight)',PROJECTS.filter(p=>p.dscr<1.15).length,T.red],['1.15–1.30 (Adequate)',PROJECTS.filter(p=>p.dscr>=1.15&&p.dscr<1.30).length,T.amber],['1.30–1.50 (Comfortable)',PROJECTS.filter(p=>p.dscr>=1.30&&p.dscr<1.50).length,T.sage],['> 1.50 (Strong)',PROJECTS.filter(p=>p.dscr>=1.50).length,T.green]].map(([band,cnt,color]) => (
                <div key={band} style={{ marginBottom: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                    <span style={{ fontSize: 12, color: T.textPri }}>{band}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color, fontFamily: T.fontMono }}>{cnt}</span>
                  </div>
                  <MiniBar value={cnt} max={30} color={color} />
                </div>
              ))}
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20 }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: T.navy, marginBottom: 14 }}>Financing Structure Benchmarks</div>
              {[
                { metric: 'Avg Gearing', value: `${(PROJECTS.reduce((s,p)=>s+p.debtPct,0)/PROJECTS.length).toFixed(1)}%`, desc: 'Debt / total capitalisation' },
                { metric: 'Min DSCR (p90)', value: '1.18x', desc: 'Lender covenant minimum' },
                { metric: 'Target DSCR', value: '1.35x', desc: 'Bank underwriting target' },
                { metric: 'Avg Debt Tenor', value: '18 years', desc: 'Weighted portfolio average' },
                { metric: 'All-in Debt Cost', value: '5.2–6.8%', desc: 'Term loan pricing range' },
                { metric: 'Refinancing Risk', value: '23 projects', desc: 'Balloon payment within 5 years' },
                { metric: 'Avg Gearing (Offshore)', value: '72%', desc: 'Offshore projects higher gearing' },
              ].map(({ metric, value, desc }) => (
                <div key={metric} style={{ padding: '8px 0', borderBottom: `1px solid ${T.borderL}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 12, color: T.textPri }}>{metric}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: T.navy, fontFamily: T.fontMono }}>{value}</span>
                  </div>
                  <div style={{ fontSize: 11, color: T.textSec }}>{desc}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 6: Market Breakdown */}
        {tab === 6 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
            {MARKETS.map(mkt => {
              const arr = PROJECTS.filter(p => p.market === mkt);
              const n2 = Math.max(1, arr.length);
              const mktIrr = arr.reduce((s, p) => s + p.irr, 0) / n2;
              const mktLcoe = arr.reduce((s, p) => s + p.lcoe, 0) / n2;
              const mktMw = arr.reduce((s, p) => s + p.capacityMw, 0);
              return (
                <div key={mkt} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: T.navy, marginBottom: 10 }}>{mkt}</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    {[['Projects', arr.length], ['Total MW', mktMw], ['Avg IRR', `${mktIrr.toFixed(1)}%`], ['Avg LCOE', `$${mktLcoe.toFixed(0)}/MWh`]].map(([k, v]) => (
                      <div key={k} style={{ background: T.sub, borderRadius: 6, padding: '8px 10px' }}>
                        <div style={{ fontSize: 10, color: T.textSec }}>{k}</div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: T.navy, fontFamily: T.fontMono }}>{v}</div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Tab 7: Scenario Analysis */}
        {tab === 7 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20 }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: T.navy, marginBottom: 14 }}>IRR Sensitivity — Key Assumptions</div>
              {[
                { param: 'LCOE +10%', irrDelta: -1.4, base: avgIrr },
                { param: 'LCOE -10%', irrDelta: +1.6, base: avgIrr },
                { param: 'Capacity Factor +5%', irrDelta: +1.1, base: avgIrr },
                { param: 'CapEx +15%', irrDelta: -1.8, base: avgIrr },
                { param: 'Debt Cost +100bps', irrDelta: -0.9, base: avgIrr },
                { param: 'PPA Price +$5/MWh', irrDelta: +1.3, base: avgIrr },
                { param: 'O&M +20%', irrDelta: -0.6, base: avgIrr },
              ].map(({ param, irrDelta }) => (
                <div key={param} style={{ padding: '8px 0', borderBottom: `1px solid ${T.borderL}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 12, color: T.textPri }}>{param}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: irrDelta > 0 ? T.green : T.red, fontFamily: T.fontMono }}>{irrDelta > 0 ? '+' : ''}{irrDelta.toFixed(1)}%</span>
                  </div>
                  <div style={{ fontSize: 11, color: T.textSec }}>New Avg IRR: {(avgIrr + irrDelta).toFixed(1)}%</div>
                </div>
              ))}
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20 }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: T.navy, marginBottom: 14 }}>NGFS Scenario Impact on Solar Returns</div>
              {[
                { scenario: 'Net Zero 2050', irrImpact: '+0.8%', desc: 'High carbon price accelerates solar demand; LCOE improvement continues', color: T.green },
                { scenario: 'Delayed Transition', irrImpact: '+0.3%', desc: 'Lower near-term carbon price, modest demand growth', color: T.amber },
                { scenario: 'Disorderly', irrImpact: '-0.4%', desc: 'Policy uncertainty creates off-take risk; merchant exposure', color: T.orange },
                { scenario: 'Hot House World', irrImpact: '-1.2%', desc: 'Physical risk to assets (heatwave + dust) reduces CF 3–8%', color: T.red },
              ].map(({ scenario, irrImpact, desc, color }) => (
                <div key={scenario} style={{ padding: '10px 12px', marginBottom: 8, background: T.sub, borderRadius: 8, borderLeft: `4px solid ${color}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: T.navy }}>{scenario}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color, fontFamily: T.fontMono }}>{irrImpact}</span>
                  </div>
                  <div style={{ fontSize: 11, color: T.textSec, marginTop: 3 }}>{desc}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
