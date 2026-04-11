import React, { useState, useMemo } from 'react';

const T = { bg: '#f8f6f0', card: '#ffffff', border: '#e2ded5', borderL: '#ede9e0', sub: '#f6f4f0', navy: '#1e3a5f', gold: '#b8860b', cream: '#faf8f3', textPri: '#1a1a2e', textSec: '#6b7280', green: '#16a34a', red: '#dc2626', blue: '#0369a1', amber: '#d97706', sage: '#4d7c5f', teal: '#0f766e', indigo: '#4f46e5', purple: '#7c3aed', orange: '#ea580c', surfaceH: '#f1ede4', fontMono: 'JetBrains Mono, monospace' };
const sr = s => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };

const TECHNOLOGIES = ['Solar PV','Wind Onshore','Wind Offshore','Battery Storage','Hybrid Solar+Wind'];
const ASSET_STATUS = ['Operational','Performance Degraded','Under Maintenance','Major Overhaul','Standby'];
const REGIONS = ['Europe','North America','Asia Pacific','Middle East','Latin America','Africa'];
const OM_CONTRACTS = ['Full-Service O&M','Limited O&M','Self-Perform','Hybrid'];

const ASSETS = Array.from({ length: 75 }, (_, i) => {
  const tech = TECHNOLOGIES[Math.floor(sr(i*7+1)*TECHNOLOGIES.length)];
  const status = ASSET_STATUS[Math.floor(sr(i*11+2)*ASSET_STATUS.length)];
  const region = REGIONS[Math.floor(sr(i*13+3)*REGIONS.length)];
  const omContract = OM_CONTRACTS[Math.floor(sr(i*17+4)*OM_CONTRACTS.length)];
  const capacityMw = Math.round(10 + sr(i*19+5)*490);
  const ageYears = parseFloat((0.5 + sr(i*23+6)*19.5).toFixed(1));
  const p50Gwh = parseFloat((capacityMw * 0.25 * 8760 / 1000 * (0.8 + sr(i*29+7)*0.4)).toFixed(1));
  const p90Gwh = parseFloat((p50Gwh * (0.75 + sr(i*31+8)*0.15)).toFixed(1));
  const actualGwh = parseFloat((p50Gwh * (0.85 + sr(i*37+9)*0.3)).toFixed(1));
  const degradationPct = parseFloat((0.3 + ageYears * (0.3 + sr(i*41+1)*0.4)).toFixed(2));
  const availability = parseFloat((90 + sr(i*43+2)*9).toFixed(1));
  const omCostMwh = parseFloat((8 + sr(i*47+3)*22).toFixed(1));
  const revenueM = parseFloat((actualGwh * (45 + sr(i*53+4)*35) / 1000).toFixed(1));
  const ebitdaMargin = parseFloat((55 + sr(i*59+5)*30).toFixed(1));
  const remainingLife = Math.round(25 - ageYears);
  const insuranceValue = parseFloat((capacityMw * (0.6 + sr(i*61+6)*0.6)).toFixed(0));
  const curtailmentPct = parseFloat((sr(i*67+7)*12).toFixed(1));
  const nextMajorService = Math.round(1 + sr(i*71+8)*7);
  return { id: i+1, name:`${region.split(' ')[0]}-${tech.split(' ')[0]}-${String.fromCharCode(65+(i%26))}${i+1}`, tech, status, region, omContract, capacityMw, ageYears, p50Gwh, p90Gwh, actualGwh, degradationPct, availability, omCostMwh, revenueM, ebitdaMargin, remainingLife, insuranceValue, curtailmentPct, nextMajorService };
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

const TABS = ['Asset Overview','Asset Register','P50 / P90 Generation','Degradation Analysis','O&M Optimisation','Availability & Curtailment','Revenue Performance','Asset Life Management'];

export default function RenewableAssetManagementPage() {
  const [tab, setTab] = useState(0);
  const [techFilter, setTechFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [regionFilter, setRegionFilter] = useState('All');
  const [sortCol, setSortCol] = useState('revenueM');
  const [sortAsc, setSortAsc] = useState(false);
  const [degradThreshold, setDegradThreshold] = useState(5);

  const filtered = useMemo(() => ASSETS.filter(a =>
    (techFilter === 'All' || a.tech === techFilter) &&
    (statusFilter === 'All' || a.status === statusFilter) &&
    (regionFilter === 'All' || a.region === regionFilter)
  ), [techFilter, statusFilter, regionFilter]);

  const sorted = useMemo(() => [...filtered].sort((a, b) => {
    const av = a[sortCol]; const bv = b[sortCol];
    return sortAsc ? (av > bv ? 1 : -1) : (av < bv ? 1 : -1);
  }), [filtered, sortCol, sortAsc]);

  const n = Math.max(1, filtered.length);
  const totalRevenue = filtered.reduce((s, a) => s + a.revenueM, 0);
  const totalP50 = filtered.reduce((s, a) => s + a.p50Gwh, 0);
  const totalActual = filtered.reduce((s, a) => s + a.actualGwh, 0);
  const avgAvailability = filtered.reduce((s, a) => s + a.availability, 0) / n;
  const avgDegradation = filtered.reduce((s, a) => s + a.degradationPct, 0) / n;
  const highDegradCount = filtered.filter(a => a.degradationPct > degradThreshold).length;
  const p50Achievement = totalP50 > 0 ? (totalActual / totalP50 * 100) : 0;

  const byTech = TECHNOLOGIES.map(t => {
    const arr = ASSETS.filter(a => a.tech === t);
    const n2 = Math.max(1, arr.length);
    return { tech: t, count: arr.length, totalRev: arr.reduce((s,a)=>s+a.revenueM,0), avgAvail: arr.reduce((s,a)=>s+a.availability,0)/n2, avgDeg: arr.reduce((s,a)=>s+a.degradationPct,0)/n2 };
  });

  const headerStyle = { background: T.sub, padding: '20px 28px 0', borderBottom: `1px solid ${T.border}` };
  const tabStyle = (i) => ({ padding: '8px 16px', marginRight: 4, cursor: 'pointer', borderRadius: '6px 6px 0 0', fontSize: 13, fontWeight: tab === i ? 600 : 400, color: tab === i ? T.navy : T.textSec, background: tab === i ? T.card : 'transparent', border: tab === i ? `1px solid ${T.border}` : '1px solid transparent', borderBottom: tab === i ? `1px solid ${T.card}` : '1px solid transparent', marginBottom: -1 });
  const thStyle = { padding: '8px 12px', fontSize: 11, color: T.textSec, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', cursor: 'pointer', whiteSpace: 'nowrap', background: T.sub };

  return (
    <div style={{ fontFamily: "'DM Sans', system-ui, sans-serif", background: T.bg, minHeight: '100vh' }}>
      <div style={{ background: T.navy, padding: '18px 28px', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 11, color: '#94a3b8', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 2 }}>EP-DO6 · Renewable Energy Finance</div>
          <div style={{ fontSize: 20, fontWeight: 700 }}>Renewable Asset Management</div>
          <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>P50/P90 Generation · Degradation Curves · O&M Optimisation — 75 Assets · 5 Technologies</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 26, fontWeight: 700, color: T.gold }}>{avgAvailability.toFixed(1)}%</div>
          <div style={{ fontSize: 11, color: '#94a3b8' }}>Portfolio Availability</div>
        </div>
      </div>

      <div style={{ padding: '16px 28px', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <KpiCard label="Assets" value={`${n}`} sub={`of ${ASSETS.length} total`} />
        <KpiCard label="Total Revenue" value={`$${totalRevenue.toFixed(0)}M`} sub="Annual portfolio" color={T.green} />
        <KpiCard label="P50 Achievement" value={`${p50Achievement.toFixed(0)}%`} sub="Actual vs P50" color={p50Achievement >= 100 ? T.green : p50Achievement >= 90 ? T.amber : T.red} />
        <KpiCard label="Avg Degradation" value={`${avgDegradation.toFixed(1)}%`} sub="Cumulative capacity loss" color={avgDegradation > 8 ? T.red : T.amber} />
        <KpiCard label="High Degradation" value={`${highDegradCount}`} sub={`> ${degradThreshold}% threshold`} color={T.red} />
        <KpiCard label="Total P50 GWh" value={`${(totalP50/1000).toFixed(1)} TWh`} sub="Annual generation forecast" color={T.indigo} />
      </div>

      <div style={{ padding: '0 28px 12px', display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        {[['Technology', TECHNOLOGIES, techFilter, setTechFilter],['Status', ASSET_STATUS, statusFilter, setStatusFilter],['Region', REGIONS, regionFilter, setRegionFilter]].map(([lbl, opts, val, setter]) => (
          <div key={lbl} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 12, color: T.textSec }}>{lbl}:</span>
            <select value={val} onChange={e => setter(e.target.value)} style={{ fontSize: 12, padding: '4px 8px', border: `1px solid ${T.border}`, borderRadius: 6, background: T.card }}>
              <option value="All">All</option>
              {opts.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
        ))}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 12, color: T.textSec }}>Degrad. Alert:</span>
          <input type="range" min={2} max={15} step={0.5} value={degradThreshold} onChange={e => setDegradThreshold(+e.target.value)} style={{ width: 80 }} />
          <span style={{ fontSize: 12, fontWeight: 700, color: T.red, fontFamily: T.fontMono }}>{degradThreshold}%</span>
        </div>
      </div>

      <div style={headerStyle}>
        <div style={{ display: 'flex', gap: 2 }}>
          {TABS.map((t, i) => <button key={i} style={tabStyle(i)} onClick={() => setTab(i)}>{t}</button>)}
        </div>
      </div>

      <div style={{ padding: '24px 28px' }}>
        {tab === 0 && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 12, marginBottom: 20 }}>
              {byTech.map(({ tech, count, totalRev, avgAvail, avgDeg }) => {
                const colors = { 'Solar PV': T.gold, 'Wind Onshore': T.sage, 'Wind Offshore': T.blue, 'Battery Storage': T.purple, 'Hybrid Solar+Wind': T.teal };
                return (
                  <div key={tech} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16 }}>
                    <div style={{ fontWeight: 700, fontSize: 12, color: colors[tech] || T.navy, marginBottom: 8 }}>{tech}</div>
                    {[['Assets', count],['Rev $M',`${totalRev.toFixed(0)}`],['Avail',`${avgAvail.toFixed(1)}%`],['Degrad',`${avgDeg.toFixed(1)}%`]].map(([k,v]) => (
                      <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0' }}>
                        <span style={{ fontSize: 10, color: T.textSec }}>{k}</span>
                        <span style={{ fontSize: 11, fontWeight: 700, fontFamily: T.fontMono, color: T.navy }}>{v}</span>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: T.navy, marginBottom: 14 }}>Asset Status Distribution</div>
                {ASSET_STATUS.map(s => {
                  const cnt = ASSETS.filter(a => a.status === s).length;
                  const colors = { Operational: T.green, 'Performance Degraded': T.amber, 'Under Maintenance': T.blue, 'Major Overhaul': T.orange, Standby: T.textSec };
                  return (
                    <div key={s} style={{ marginBottom: 9 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                        <span style={{ fontSize: 12, color: T.textPri }}>{s}</span>
                        <span style={{ fontSize: 12, fontWeight: 700, fontFamily: T.fontMono, color: colors[s] }}>{cnt}</span>
                      </div>
                      <MiniBar value={cnt} max={40} color={colors[s]} />
                    </div>
                  );
                })}
              </div>
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: T.navy, marginBottom: 14 }}>Revenue by Region ($M)</div>
                {REGIONS.map(region => {
                  const arr = ASSETS.filter(a => a.region === region);
                  const rev = arr.reduce((s,a)=>s+a.revenueM,0);
                  return (
                    <div key={region} style={{ marginBottom: 9 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                        <span style={{ fontSize: 12, color: T.textPri }}>{region}</span>
                        <span style={{ fontSize: 12, fontWeight: 700, fontFamily: T.fontMono, color: T.navy }}>${rev.toFixed(0)}M</span>
                      </div>
                      <MiniBar value={rev} max={totalRevenue / REGIONS.length * 2} color={T.indigo} />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {tab === 1 && (
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, overflow: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {[['name','Asset'],['tech','Technology'],['region','Region'],['capacityMw','MW'],['ageYears','Age'],['p50Gwh','P50 GWh'],['actualGwh','Actual GWh'],['availability','Avail%'],['degradationPct','Degrad%'],['revenueM','Rev $M']].map(([col,lbl]) => (
                    <th key={col} style={thStyle} onClick={() => { setSortCol(col); setSortAsc(sortCol===col?!sortAsc:false); }}>
                      {lbl}{sortCol===col?(sortAsc?'▲':'▼'):''}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sorted.slice(0,30).map((a,i) => (
                  <tr key={a.id} style={{ background: a.degradationPct > degradThreshold ? '#fef2f2' : i%2===0?T.card:'#fafafa' }}>
                    <td style={{ padding:'7px 12px',fontSize:12,fontWeight:600,color:T.navy }}>{a.name}</td>
                    <td style={{ padding:'7px 12px',fontSize:11,color:T.textSec }}>{a.tech}</td>
                    <td style={{ padding:'7px 12px',fontSize:11,color:T.textSec }}>{a.region}</td>
                    <td style={{ padding:'7px 12px',fontSize:12,fontFamily:T.fontMono,textAlign:'right' }}>{a.capacityMw}</td>
                    <td style={{ padding:'7px 12px',fontSize:12,fontFamily:T.fontMono,textAlign:'right' }}>{a.ageYears.toFixed(1)}</td>
                    <td style={{ padding:'7px 12px',fontSize:12,fontFamily:T.fontMono,textAlign:'right',color:T.blue }}>{a.p50Gwh.toFixed(0)}</td>
                    <td style={{ padding:'7px 12px',fontSize:12,fontFamily:T.fontMono,textAlign:'right',color:a.actualGwh>=a.p50Gwh?T.green:T.amber }}>{a.actualGwh.toFixed(0)}</td>
                    <td style={{ padding:'7px 12px',fontSize:12,fontFamily:T.fontMono,textAlign:'right',color:a.availability>=97?T.green:a.availability>=93?T.amber:T.red,fontWeight:700 }}>{a.availability.toFixed(1)}%</td>
                    <td style={{ padding:'7px 12px',fontSize:12,fontFamily:T.fontMono,textAlign:'right',color:a.degradationPct>degradThreshold?T.red:T.textSec,fontWeight:a.degradationPct>degradThreshold?700:400 }}>{a.degradationPct.toFixed(1)}%</td>
                    <td style={{ padding:'7px 12px',fontSize:12,fontFamily:T.fontMono,textAlign:'right',fontWeight:700,color:T.navy }}>${a.revenueM.toFixed(0)}M</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === 2 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20 }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: T.navy, marginBottom: 14 }}>P50 vs Actual Generation by Technology (GWh)</div>
              {TECHNOLOGIES.map(tech => {
                const arr = ASSETS.filter(a => a.tech === tech);
                const p50 = arr.reduce((s,a)=>s+a.p50Gwh,0);
                const p90 = arr.reduce((s,a)=>s+a.p90Gwh,0);
                const actual = arr.reduce((s,a)=>s+a.actualGwh,0);
                const ach = p50 > 0 ? (actual / p50 * 100) : 0;
                return (
                  <div key={tech} style={{ padding: '10px 0', borderBottom: `1px solid ${T.borderL}` }}>
                    <div style={{ fontWeight: 600, fontSize: 13, color: T.navy, marginBottom: 4 }}>{tech}</div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 4, fontSize: 11 }}>
                      {[['P50',`${(p50/1000).toFixed(1)} TWh`,T.blue],['P90',`${(p90/1000).toFixed(1)} TWh`,T.amber],['Actual',`${(actual/1000).toFixed(1)} TWh`,T.green],['Ach.',`${ach.toFixed(0)}%`,ach>=100?T.green:ach>=90?T.amber:T.red]].map(([k,v,c]) => (
                        <div key={k} style={{ background: T.sub, borderRadius: 4, padding: '4px 6px' }}>
                          <div style={{ color: T.textSec }}>{k}</div>
                          <div style={{ fontWeight: 700, fontFamily: T.fontMono, color: c }}>{v}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20 }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: T.navy, marginBottom: 14 }}>P50–P90 Downside Risk Analysis</div>
              {TECHNOLOGIES.map(tech => {
                const arr = ASSETS.filter(a => a.tech === tech);
                const avgP50 = arr.length ? arr.reduce((s,a)=>s+a.p50Gwh,0)/arr.length : 0;
                const avgP90 = arr.length ? arr.reduce((s,a)=>s+a.p90Gwh,0)/arr.length : 0;
                const downside = avgP50 > 0 ? ((avgP50-avgP90)/avgP50*100) : 0;
                return (
                  <div key={tech} style={{ marginBottom: 9 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                      <span style={{ fontSize: 12, color: T.textPri }}>{tech}</span>
                      <span style={{ fontSize: 12, color: T.textSec }}>P50-P90 delta: <b style={{ color: downside > 20 ? T.red : T.amber }}>{downside.toFixed(1)}%</b></span>
                    </div>
                    <MiniBar value={downside} max={35} color={downside > 20 ? T.red : T.amber} />
                  </div>
                );
              })}
              <div style={{ marginTop: 14, padding: 12, background: '#f0f9ff', borderRadius: 8, fontSize: 12, color: T.blue }}>
                P50/P90 generation forecasts are based on long-term wind resource and solar irradiance assessments. P90 assumes 90% probability of exceedance.
              </div>
            </div>
          </div>
        )}

        {tab === 3 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20 }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: T.navy, marginBottom: 14 }}>Degradation Curve by Technology (%/year)</div>
              {[
                { tech: 'Solar PV', rate: '0.5%', mechanism: 'Module LID, PID, weathering', alert: degradThreshold > 8 ? 'Normal' : 'Monitor', color: T.gold },
                { tech: 'Wind Onshore', rate: '0.3%', mechanism: 'Blade erosion, bearing wear, control ageing', alert: 'Normal', color: T.sage },
                { tech: 'Wind Offshore', rate: '0.4%', mechanism: 'Saltwater corrosion + blade erosion', alert: 'Monitor', color: T.blue },
                { tech: 'Battery Storage', rate: '2.5%', mechanism: 'Cycle degradation (SOH loss), calendar ageing', alert: 'High Risk', color: T.purple },
                { tech: 'Hybrid Solar+Wind', rate: '0.6%', mechanism: 'Combined degradation across both tech', alert: 'Normal', color: T.teal },
              ].map(({ tech, rate, mechanism, alert, color }) => (
                <div key={tech} style={{ padding: '10px 12px', marginBottom: 8, background: T.sub, borderRadius: 8, borderLeft: `4px solid ${color}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontWeight: 600, fontSize: 13, color: T.navy }}>{tech}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color, fontFamily: T.fontMono }}>{rate}/yr</span>
                  </div>
                  <div style={{ fontSize: 11, color: T.textSec, marginTop: 2 }}>{mechanism}</div>
                  <div style={{ fontSize: 11, color: alert === 'High Risk' ? T.red : alert === 'Monitor' ? T.amber : T.green, marginTop: 2 }}>Status: {alert}</div>
                </div>
              ))}
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20 }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: T.navy, marginBottom: 14 }}>High Degradation Alert (> {degradThreshold}%)</div>
              {sorted.filter(a => a.degradationPct > degradThreshold).slice(0,15).map(a => (
                <div key={a.id} style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: 8, padding: '6px 0', borderBottom: `1px solid ${T.borderL}`, alignItems: 'center' }}>
                  <span style={{ fontSize: 11, color: T.navy, fontWeight: 500 }}>{a.name}</span>
                  <span style={{ fontSize: 11, color: T.textSec }}>{a.ageYears.toFixed(0)}yr</span>
                  <span style={{ fontSize: 12, fontWeight: 700, fontFamily: T.fontMono, color: a.degradationPct > degradThreshold * 1.5 ? T.red : T.amber }}>{a.degradationPct.toFixed(1)}%</span>
                </div>
              ))}
              {filtered.filter(a => a.degradationPct > degradThreshold).length === 0 && (
                <div style={{ fontSize: 12, color: T.green, padding: 12, background: '#f0fdf4', borderRadius: 8 }}>No assets exceed the {degradThreshold}% threshold in current filter.</div>
              )}
            </div>
          </div>
        )}

        {tab === 4 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20 }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: T.navy, marginBottom: 14 }}>O&M Cost by Technology ($/MWh)</div>
              {TECHNOLOGIES.map(tech => {
                const arr = ASSETS.filter(a => a.tech === tech);
                const avg = arr.length ? arr.reduce((s,a)=>s+a.omCostMwh,0)/arr.length : 0;
                return (
                  <div key={tech} style={{ marginBottom: 9 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                      <span style={{ fontSize: 12, color: T.textPri }}>{tech}</span>
                      <span style={{ fontSize: 12, fontWeight: 700, fontFamily: T.fontMono, color: avg > 20 ? T.red : avg > 15 ? T.amber : T.green }}>${avg.toFixed(1)}/MWh</span>
                    </div>
                    <MiniBar value={avg} max={35} color={avg > 20 ? T.red : avg > 15 ? T.amber : T.green} />
                  </div>
                );
              })}
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20 }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: T.navy, marginBottom: 14 }}>O&M Contract Structure</div>
              {OM_CONTRACTS.map(omc => {
                const arr = ASSETS.filter(a => a.omContract === omc);
                const avgCost = arr.length ? arr.reduce((s,a)=>s+a.omCostMwh,0)/arr.length : 0;
                const avgAvail2 = arr.length ? arr.reduce((s,a)=>s+a.availability,0)/arr.length : 0;
                return (
                  <div key={omc} style={{ padding: '10px 0', borderBottom: `1px solid ${T.borderL}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: T.navy }}>{omc}</span>
                      <span style={{ fontSize: 12, color: T.textSec }}>{arr.length} assets</span>
                    </div>
                    <div style={{ display: 'flex', gap: 20, fontSize: 12, marginTop: 3 }}>
                      <span>Cost: <b style={{ fontFamily: T.fontMono, color: T.indigo }}>${avgCost.toFixed(1)}/MWh</b></span>
                      <span>Avail: <b style={{ fontFamily: T.fontMono, color: avgAvail2 >= 96 ? T.green : T.amber }}>{avgAvail2.toFixed(1)}%</b></span>
                    </div>
                  </div>
                );
              })}
              <div style={{ marginTop: 14, padding: 10, background: '#f0fdf4', borderRadius: 8, fontSize: 12, color: T.green }}>
                Full-Service O&M contracts average ${(ASSETS.filter(a=>a.omContract==='Full-Service O&M').reduce((s,a)=>s+a.omCostMwh,0)/Math.max(1,ASSETS.filter(a=>a.omContract==='Full-Service O&M').length)).toFixed(1)}/MWh with highest availability (96–99%).
              </div>
            </div>
          </div>
        )}

        {tab === 5 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20 }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: T.navy, marginBottom: 14 }}>Availability Distribution</div>
              {[['< 93% (Poor)',ASSETS.filter(a=>a.availability<93)],['93–95% (Below Target)',ASSETS.filter(a=>a.availability>=93&&a.availability<95)],['95–97% (Good)',ASSETS.filter(a=>a.availability>=95&&a.availability<97)],['97–99% (Excellent)',ASSETS.filter(a=>a.availability>=97&&a.availability<99)],['>99% (Best-in-Class)',ASSETS.filter(a=>a.availability>=99)]].map(([band,arr]) => (
                <div key={band} style={{ marginBottom: 9 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                    <span style={{ fontSize: 12, color: T.textPri }}>{band}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, fontFamily: T.fontMono }}>{arr.length}</span>
                  </div>
                  <MiniBar value={arr.length} max={30} color={band.includes('<93')?T.red:band.includes('93–95')?T.amber:band.includes('95–97')?T.blue:T.green} />
                </div>
              ))}
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20 }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: T.navy, marginBottom: 14 }}>Curtailment Analysis</div>
              {TECHNOLOGIES.map(tech => {
                const arr = ASSETS.filter(a => a.tech === tech);
                const avgCurt = arr.length ? arr.reduce((s,a)=>s+a.curtailmentPct,0)/arr.length : 0;
                const curtLoss = arr.reduce((s,a)=>s+a.p50Gwh*a.curtailmentPct/100,0);
                return (
                  <div key={tech} style={{ marginBottom: 9 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                      <span style={{ fontSize: 12, color: T.textPri }}>{tech}</span>
                      <span style={{ fontSize: 12, color: T.textSec }}>{avgCurt.toFixed(1)}% · {curtLoss.toFixed(0)} GWh lost</span>
                    </div>
                    <MiniBar value={avgCurt} max={15} color={avgCurt > 8 ? T.red : avgCurt > 4 ? T.amber : T.green} />
                  </div>
                );
              })}
              <div style={{ marginTop: 12, padding: 10, background: '#fef2f2', borderRadius: 8, fontSize: 12, color: T.red }}>
                Total estimated curtailment loss: {ASSETS.reduce((s,a)=>s+a.p50Gwh*a.curtailmentPct/100,0).toFixed(0)} GWh/year across portfolio.
              </div>
            </div>
          </div>
        )}

        {tab === 6 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20 }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: T.navy, marginBottom: 14 }}>Revenue Performance by Technology</div>
              {TECHNOLOGIES.map(tech => {
                const arr = ASSETS.filter(a => a.tech === tech);
                const n2 = Math.max(1, arr.length);
                const totalR = arr.reduce((s,a)=>s+a.revenueM,0);
                const avgEbitda = arr.reduce((s,a)=>s+a.ebitdaMargin,0)/n2;
                return (
                  <div key={tech} style={{ padding: '8px 0', borderBottom: `1px solid ${T.borderL}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: T.navy }}>{tech}</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: T.navy, fontFamily: T.fontMono }}>${totalR.toFixed(0)}M</span>
                    </div>
                    <div style={{ fontSize: 11, color: T.textSec, marginTop: 2 }}>EBITDA margin: <b style={{ color: avgEbitda >= 70 ? T.green : avgEbitda >= 60 ? T.amber : T.red }}>{avgEbitda.toFixed(0)}%</b></div>
                  </div>
                );
              })}
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20 }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: T.navy, marginBottom: 14 }}>Top 15 Revenue-Generating Assets</div>
              {[...ASSETS].sort((a,b)=>b.revenueM-a.revenueM).slice(0,15).map((a,i) => (
                <div key={a.id} style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: 8, padding: '5px 0', borderBottom: `1px solid ${T.borderL}`, alignItems: 'center' }}>
                  <span style={{ fontSize: 11, color: T.navy, fontWeight: 500 }}>{a.name}</span>
                  <span style={{ fontSize: 11, color: T.textSec }}>{a.capacityMw}MW</span>
                  <span style={{ fontSize: 12, fontWeight: 700, fontFamily: T.fontMono, color: T.green }}>${a.revenueM.toFixed(0)}M</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 7 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20 }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: T.navy, marginBottom: 14 }}>Asset Life Management — Remaining Life</div>
              {[['< 5yr (End of Life)',ASSETS.filter(a=>a.remainingLife<5)],['5–10yr',ASSETS.filter(a=>a.remainingLife>=5&&a.remainingLife<10)],['10–15yr',ASSETS.filter(a=>a.remainingLife>=10&&a.remainingLife<15)],['15–20yr',ASSETS.filter(a=>a.remainingLife>=15&&a.remainingLife<20)],['>20yr (New)',ASSETS.filter(a=>a.remainingLife>=20)]].map(([band,arr]) => (
                <div key={band} style={{ marginBottom: 9 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                    <span style={{ fontSize: 12, color: T.textPri }}>{band}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, fontFamily: T.fontMono }}>{arr.length} assets</span>
                  </div>
                  <MiniBar value={arr.length} max={25} color={band.includes('<5')?T.red:band.includes('5–10')?T.amber:T.green} />
                </div>
              ))}
              <div style={{ marginTop: 12, padding: 10, background: '#fef2f2', borderRadius: 8, fontSize: 12, color: T.red }}>
                {ASSETS.filter(a=>a.remainingLife<5).length} assets approaching end-of-life (&lt;5yr). Repowering/extension decisions required.
              </div>
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20 }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: T.navy, marginBottom: 14 }}>Major Service Upcoming (Years)</div>
              {sorted.filter(a=>a.nextMajorService<=3).slice(0,15).map(a => (
                <div key={a.id} style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: 8, padding: '6px 0', borderBottom: `1px solid ${T.borderL}` }}>
                  <span style={{ fontSize: 11, color: T.navy }}>{a.name}</span>
                  <span style={{ fontSize: 11, color: T.textSec }}>{a.tech.split(' ')[0]}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: a.nextMajorService <= 1 ? T.red : a.nextMajorService <= 2 ? T.orange : T.amber, fontFamily: T.fontMono }}>{a.nextMajorService}yr</span>
                </div>
              ))}
              {filtered.filter(a=>a.nextMajorService<=3).length === 0 && (
                <div style={{ fontSize: 12, color: T.green, padding: 12, background: '#f0fdf4', borderRadius: 8 }}>No major services due within 3 years for current filter.</div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
