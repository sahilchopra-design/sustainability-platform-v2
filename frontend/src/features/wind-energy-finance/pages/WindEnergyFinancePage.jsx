import React, { useState, useMemo } from 'react';

const T = { bg: '#f8f6f0', card: '#ffffff', border: '#e2ded5', borderL: '#ede9e0', sub: '#f6f4f0', navy: '#1e3a5f', gold: '#b8860b', cream: '#faf8f3', textPri: '#1a1a2e', textSec: '#6b7280', green: '#16a34a', red: '#dc2626', blue: '#0369a1', amber: '#d97706', sage: '#4d7c5f', teal: '#0f766e', indigo: '#4f46e5', purple: '#7c3aed', orange: '#ea580c', surfaceH: '#f1ede4', fontMono: 'JetBrains Mono, monospace' };
const sr = s => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };

const WIND_TYPES = ['Onshore','Offshore Fixed','Offshore Floating'];
const MARKETS = ['UK','Germany','Denmark','USA','Australia','Netherlands','France','Norway','Spain','Ireland'];
const CFD_TECHS = ['AR6 CfD UK','RESS Ireland','SDE Netherlands','Tender Germany','MoU Australia','Merchant'];

const PROJECTS = Array.from({ length: 60 }, (_, i) => {
  const type = WIND_TYPES[Math.floor(sr(i * 7 + 1) * WIND_TYPES.length)];
  const market = MARKETS[Math.floor(sr(i * 11 + 2) * MARKETS.length)];
  const cfd = CFD_TECHS[Math.floor(sr(i * 13 + 3) * CFD_TECHS.length)];
  const capacityMw = type === 'Offshore Fixed' ? Math.round(100 + sr(i*3+1)*900) : type === 'Offshore Floating' ? Math.round(50+sr(i*5+2)*350) : Math.round(30+sr(i*7+3)*270);
  const cf = type === 'Offshore Fixed' ? parseFloat((0.38 + sr(i*19+4)*0.18).toFixed(3)) : type === 'Offshore Floating' ? parseFloat((0.42 + sr(i*23+5)*0.14).toFixed(3)) : parseFloat((0.25 + sr(i*29+6)*0.18).toFixed(3));
  const lcoe = type === 'Offshore Fixed' ? parseFloat((55 + sr(i*31+7)*45).toFixed(1)) : type === 'Offshore Floating' ? parseFloat((80 + sr(i*37+8)*60).toFixed(1)) : parseFloat((25 + sr(i*41+9)*30).toFixed(1));
  const irr = parseFloat((7 + sr(i*43+1)*12).toFixed(2));
  const cfdStrike = parseFloat((60 + sr(i*47+2)*80).toFixed(1));
  const merchantPct = parseFloat((sr(i*53+3)*35).toFixed(1));
  const capex = type === 'Offshore Fixed' ? parseFloat((2.8+sr(i*59+4)*2.2).toFixed(2)) : type === 'Offshore Floating' ? parseFloat((4.5+sr(i*61+5)*3.5).toFixed(2)) : parseFloat((1.1+sr(i*67+6)*0.8).toFixed(2));
  const dscr = parseFloat((1.1+sr(i*71+7)*1.5).toFixed(2));
  const wake = parseFloat((3+sr(i*73+8)*10).toFixed(1));
  const status = ['Operational','Construction','Consent Granted','Planning','Development'][Math.floor(sr(i*79+9)*5)];
  return { id: i+1, name:`${market} ${type.split(' ')[0]}-${String.fromCharCode(65+(i%26))}${i+1}`, type, market, cfd, capacityMw, cf, lcoe, irr, cfdStrike, merchantPct, capex, dscr, wake, status };
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

const TABS = ['Overview','Project Table','Capacity Factors','CfD Pricing','Revenue Stacking','Merchant Risk','Offshore Analysis','Financial Model'];

export default function WindEnergyFinancePage() {
  const [tab, setTab] = useState(0);
  const [typeFilter, setTypeFilter] = useState('All');
  const [mktFilter, setMktFilter] = useState('All');
  const [sortCol, setSortCol] = useState('irr');
  const [sortAsc, setSortAsc] = useState(false);
  const [cfdAdjust, setCfdAdjust] = useState(0);

  const filtered = useMemo(() => PROJECTS.filter(p =>
    (typeFilter === 'All' || p.type === typeFilter) &&
    (mktFilter === 'All' || p.market === mktFilter)
  ), [typeFilter, mktFilter]);

  const sorted = useMemo(() => [...filtered].sort((a, b) => {
    const av = a[sortCol]; const bv = b[sortCol];
    return sortAsc ? (av > bv ? 1 : -1) : (av < bv ? 1 : -1);
  }), [filtered, sortCol, sortAsc]);

  const n = Math.max(1, filtered.length);
  const avgIrr = filtered.reduce((s, p) => s + p.irr, 0) / n;
  const avgCf = filtered.reduce((s, p) => s + p.cf, 0) / n;
  const totalGw = filtered.reduce((s, p) => s + p.capacityMw, 0) / 1000;
  const avgLcoe = filtered.reduce((s, p) => s + p.lcoe, 0) / n;
  const avgCfdStrike = filtered.reduce((s, p) => s + p.cfdStrike, 0) / n;
  const avgMerchant = filtered.reduce((s, p) => s + p.merchantPct, 0) / n;

  const byType = WIND_TYPES.map(t => {
    const arr = PROJECTS.filter(p => p.type === t);
    return { type: t, count: arr.length, avgIrr: arr.length ? arr.reduce((s,p)=>s+p.irr,0)/arr.length : 0, avgCf: arr.length ? arr.reduce((s,p)=>s+p.cf,0)/arr.length : 0, avgLcoe: arr.length ? arr.reduce((s,p)=>s+p.lcoe,0)/arr.length : 0 };
  });

  const headerStyle = { background: T.sub, padding: '20px 28px 0', borderBottom: `1px solid ${T.border}` };
  const tabStyle = (i) => ({ padding: '8px 16px', marginRight: 4, cursor: 'pointer', borderRadius: '6px 6px 0 0', fontSize: 13, fontWeight: tab === i ? 600 : 400, color: tab === i ? T.navy : T.textSec, background: tab === i ? T.card : 'transparent', border: tab === i ? `1px solid ${T.border}` : '1px solid transparent', borderBottom: tab === i ? `1px solid ${T.card}` : '1px solid transparent', marginBottom: -1 });
  const thStyle = { padding: '8px 12px', fontSize: 11, color: T.textSec, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', cursor: 'pointer', whiteSpace: 'nowrap', background: T.sub };

  return (
    <div style={{ fontFamily: "'DM Sans', system-ui, sans-serif", background: T.bg, minHeight: '100vh' }}>
      <div style={{ background: T.navy, padding: '18px 28px', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 11, color: '#94a3b8', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 2 }}>EP-DO2 · Renewable Energy Finance</div>
          <div style={{ fontSize: 20, fontWeight: 700 }}>Wind Energy Finance</div>
          <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>Capacity Factors · Revenue Stacking · CfD Pricing · Merchant Risk — 60 Projects · Onshore + Offshore</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 26, fontWeight: 700, color: T.gold }}>{(avgCf * 100).toFixed(1)}%</div>
          <div style={{ fontSize: 11, color: '#94a3b8' }}>Avg Capacity Factor</div>
        </div>
      </div>

      <div style={{ padding: '16px 28px', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <KpiCard label="Total Capacity" value={`${totalGw.toFixed(1)} GW`} sub={`${n} projects`} />
        <KpiCard label="Avg IRR" value={`${avgIrr.toFixed(1)}%`} sub="Portfolio average" color={avgIrr >= 10 ? T.green : T.amber} />
        <KpiCard label="Avg LCOE" value={`$${avgLcoe.toFixed(0)}/MWh`} sub="Weighted average" color={T.indigo} />
        <KpiCard label="Avg CfD Strike" value={`£${avgCfdStrike.toFixed(0)}/MWh`} sub="Contract for Difference" color={T.blue} />
        <KpiCard label="Merchant Exposure" value={`${avgMerchant.toFixed(1)}%`} sub="Avg revenue at merchant" color={avgMerchant > 25 ? T.red : T.amber} />
        <KpiCard label="Offshore Share" value={`${PROJECTS.filter(p=>p.type!=='Onshore').length}`} sub={`of ${PROJECTS.length} fixed + floating`} color={T.teal} />
      </div>

      <div style={{ padding: '0 28px 12px', display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        {[['Type', WIND_TYPES, typeFilter, setTypeFilter],['Market', MARKETS, mktFilter, setMktFilter]].map(([lbl, opts, val, setter]) => (
          <div key={lbl} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 12, color: T.textSec }}>{lbl}:</span>
            <select value={val} onChange={e => setter(e.target.value)} style={{ fontSize: 12, padding: '4px 8px', border: `1px solid ${T.border}`, borderRadius: 6, background: T.card }}>
              <option value="All">All</option>
              {opts.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
        ))}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 12, color: T.textSec }}>CfD Strike Adj:</span>
          <input type="range" min={-20} max={20} step={1} value={cfdAdjust} onChange={e => setCfdAdjust(+e.target.value)} style={{ width: 80 }} />
          <span style={{ fontSize: 12, fontWeight: 700, color: cfdAdjust >= 0 ? T.green : T.red, fontFamily: T.fontMono }}>{cfdAdjust >= 0 ? '+' : ''}{cfdAdjust} £/MWh</span>
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
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginBottom: 20 }}>
              {byType.map(({ type, count, avgIrr: aIrr, avgCf: aCf, avgLcoe: aLcoe }) => (
                <div key={type} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: T.navy, marginBottom: 10 }}>{type}</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    {[['Projects', count],['Avg IRR',`${aIrr.toFixed(1)}%`],['Avg CF',`${(aCf*100).toFixed(1)}%`],['Avg LCOE',`$${aLcoe.toFixed(0)}`]].map(([k,v]) => (
                      <div key={k} style={{ background: T.sub, borderRadius: 6, padding: '8px 10px' }}>
                        <div style={{ fontSize: 10, color: T.textSec }}>{k}</div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: T.navy, fontFamily: T.fontMono }}>{v}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: T.navy, marginBottom: 14 }}>IRR by Market</div>
                {MARKETS.map(mkt => {
                  const arr = PROJECTS.filter(p => p.market === mkt);
                  const ai = arr.length ? arr.reduce((s,p)=>s+p.irr,0)/arr.length : 0;
                  return (
                    <div key={mkt} style={{ marginBottom: 9 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                        <span style={{ fontSize: 12, color: T.textPri }}>{mkt}</span>
                        <span style={{ fontSize: 12, fontWeight: 700, fontFamily: T.fontMono, color: ai >= 12 ? T.green : ai >= 9 ? T.amber : T.red }}>{ai.toFixed(1)}%</span>
                      </div>
                      <MiniBar value={ai} max={20} color={ai >= 12 ? T.green : ai >= 9 ? T.amber : T.red} />
                    </div>
                  );
                })}
              </div>
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: T.navy, marginBottom: 14 }}>CfD Mechanism Breakdown</div>
                {CFD_TECHS.map(cfd => {
                  const cnt = PROJECTS.filter(p => p.cfd === cfd).length;
                  const avgS = PROJECTS.filter(p=>p.cfd===cfd).reduce((s,p)=>s+p.cfdStrike,0) / Math.max(1, cnt);
                  return (
                    <div key={cfd} style={{ padding: '8px 0', borderBottom: `1px solid ${T.borderL}` }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: 12, color: T.textPri }}>{cfd}</span>
                        <span style={{ fontSize: 12, fontWeight: 700, color: T.navy, fontFamily: T.fontMono }}>{cnt} · £{avgS.toFixed(0)}/MWh</span>
                      </div>
                      <div style={{ marginTop: 4 }}><MiniBar value={cnt} max={15} color={T.blue} /></div>
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
                  {[['name','Project'],['type','Type'],['market','Market'],['capacityMw','MW'],['cf','CF%'],['lcoe','LCOE'],['irr','IRR%'],['cfdStrike','CfD Strike'],['merchantPct','Merchant%'],['dscr','DSCR']].map(([col,lbl]) => (
                    <th key={col} style={thStyle} onClick={() => { setSortCol(col); setSortAsc(sortCol===col?!sortAsc:false); }}>
                      {lbl}{sortCol===col?(sortAsc?'▲':'▼'):''}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sorted.slice(0,30).map((p,i) => (
                  <tr key={p.id} style={{ background: i%2===0?T.card:'#fafafa' }}>
                    <td style={{ padding:'7px 12px',fontSize:12,fontWeight:600,color:T.navy }}>{p.name}</td>
                    <td style={{ padding:'7px 12px',fontSize:11 }}><span style={{ padding:'2px 6px',borderRadius:8,background:p.type==='Offshore Fixed'?'#dbeafe':p.type==='Offshore Floating'?'#ede9fe':'#dcfce7',color:p.type==='Offshore Fixed'?T.blue:p.type==='Offshore Floating'?T.purple:T.green,fontWeight:600 }}>{p.type}</span></td>
                    <td style={{ padding:'7px 12px',fontSize:12,color:T.textSec }}>{p.market}</td>
                    <td style={{ padding:'7px 12px',fontSize:12,fontFamily:T.fontMono,textAlign:'right' }}>{p.capacityMw}</td>
                    <td style={{ padding:'7px 12px',fontSize:12,fontFamily:T.fontMono,textAlign:'right',color:p.cf>=0.40?T.green:T.amber }}>{(p.cf*100).toFixed(1)}%</td>
                    <td style={{ padding:'7px 12px',fontSize:12,fontFamily:T.fontMono,textAlign:'right' }}>${p.lcoe.toFixed(0)}</td>
                    <td style={{ padding:'7px 12px',fontSize:12,fontFamily:T.fontMono,textAlign:'right',color:p.irr>=12?T.green:T.amber,fontWeight:700 }}>{p.irr.toFixed(2)}%</td>
                    <td style={{ padding:'7px 12px',fontSize:12,fontFamily:T.fontMono,textAlign:'right' }}>£{(p.cfdStrike+cfdAdjust).toFixed(0)}</td>
                    <td style={{ padding:'7px 12px',fontSize:12,fontFamily:T.fontMono,textAlign:'right',color:p.merchantPct>25?T.red:T.amber }}>{p.merchantPct.toFixed(1)}%</td>
                    <td style={{ padding:'7px 12px',fontSize:12,fontFamily:T.fontMono,textAlign:'right',color:p.dscr>=1.3?T.green:T.red }}>{p.dscr.toFixed(2)}x</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === 2 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20 }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: T.navy, marginBottom: 14 }}>Capacity Factor Distribution</div>
              {[['< 25%',PROJECTS.filter(p=>p.cf<0.25)],['25–30%',PROJECTS.filter(p=>p.cf>=0.25&&p.cf<0.30)],['30–35%',PROJECTS.filter(p=>p.cf>=0.30&&p.cf<0.35)],['35–40%',PROJECTS.filter(p=>p.cf>=0.35&&p.cf<0.40)],['40–45%',PROJECTS.filter(p=>p.cf>=0.40&&p.cf<0.45)],['>45%',PROJECTS.filter(p=>p.cf>=0.45)]].map(([band,arr]) => {
                const n2 = Math.max(1,arr.length); const avgI = arr.reduce((s,p)=>s+p.irr,0)/n2;
                return (
                  <div key={band} style={{ marginBottom: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                      <span style={{ fontSize: 12, color: T.textPri }}>{band} — {arr.length} projects</span>
                      <span style={{ fontSize: 12, color: T.textSec }}>avg IRR {avgI.toFixed(1)}%</span>
                    </div>
                    <MiniBar value={arr.length} max={15} color={T.teal} />
                  </div>
                );
              })}
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20 }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: T.navy, marginBottom: 14 }}>CF by Type — P50 / P90 Analysis</div>
              {WIND_TYPES.map(t => {
                const arr = PROJECTS.filter(p=>p.type===t);
                const vals = [...arr.map(p=>p.cf)].sort((a,b)=>a-b);
                const p50 = vals[Math.floor(vals.length*0.5)] || 0;
                const p90 = vals[Math.floor(vals.length*0.1)] || 0;
                const colors = { Onshore: T.sage, 'Offshore Fixed': T.blue, 'Offshore Floating': T.purple };
                return (
                  <div key={t} style={{ padding: '10px 0', borderBottom: `1px solid ${T.borderL}` }}>
                    <div style={{ fontWeight: 600, fontSize: 13, color: T.navy, marginBottom: 4 }}>{t}</div>
                    <div style={{ display: 'flex', gap: 20, fontSize: 12 }}>
                      <span>P50: <b style={{ fontFamily: T.fontMono, color: colors[t] }}>{(p50*100).toFixed(1)}%</b></span>
                      <span>P90: <b style={{ fontFamily: T.fontMono, color: T.amber }}>{(p90*100).toFixed(1)}%</b></span>
                      <span>P50-P90 delta: <b style={{ fontFamily: T.fontMono, color: T.red }}>{((p50-p90)*100).toFixed(1)}pp</b></span>
                    </div>
                  </div>
                );
              })}
              <div style={{ marginTop: 14, padding: 12, background: '#f0f9ff', borderRadius: 8, fontSize: 12, color: T.blue }}>
                Offshore floating projects achieve the highest capacity factors (42–56%) but carry higher capex ($4.5–8/W) and installation risk premiums.
              </div>
            </div>
          </div>
        )}

        {tab === 3 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20 }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: T.navy, marginBottom: 14 }}>CfD Strike Price Analytics ({cfdAdjust >= 0 ? '+' : ''}{cfdAdjust} £/MWh adj.)</div>
              {CFD_TECHS.filter(c=>c!=='Merchant').map(cfd => {
                const arr = PROJECTS.filter(p=>p.cfd===cfd);
                const avgS = arr.length ? arr.reduce((s,p)=>s+p.cfdStrike,0)/arr.length + cfdAdjust : 0;
                const avgI = arr.length ? arr.reduce((s,p)=>s+p.irr,0)/arr.length : 0;
                return (
                  <div key={cfd} style={{ padding: '10px 0', borderBottom: `1px solid ${T.borderL}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: T.navy }}>{cfd}</span>
                      <span style={{ fontSize: 14, fontWeight: 700, fontFamily: T.fontMono, color: T.blue }}>£{avgS.toFixed(0)}/MWh</span>
                    </div>
                    <div style={{ fontSize: 11, color: T.textSec, marginTop: 2 }}>{arr.length} projects · Avg project IRR: {avgI.toFixed(1)}%</div>
                    <div style={{ marginTop: 6 }}><MiniBar value={avgS} max={200} color={T.indigo} /></div>
                  </div>
                );
              })}
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20 }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: T.navy, marginBottom: 14 }}>CfD IRR Uplift vs Merchant</div>
              {[
                { scenario: 'CfD Floor (£65/MWh)', uplift: '+2.8%', desc: 'Base case with CfD floor vs 100% merchant', color: T.green },
                { scenario: 'CfD Strike £80/MWh', uplift: '+1.4%', desc: 'AR6 UK offshore wind average strike price', color: T.blue },
                { scenario: 'Revenue Certainty Premium', uplift: '+150bps', desc: 'Financing cost reduction from CfD certainty', color: T.indigo },
                { scenario: 'Merchant Cap (20%)', uplift: '-0.3%', desc: 'Upside from 20% uncontracted revenue', color: T.amber },
                { scenario: 'Negative Price Hours', uplift: '-0.5%', desc: 'CfD clawback when power price < 0', color: T.orange },
              ].map(({ scenario, uplift, desc, color }) => (
                <div key={scenario} style={{ padding: '10px 0', borderBottom: `1px solid ${T.borderL}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: T.textPri }}>{scenario}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color, fontFamily: T.fontMono }}>{uplift}</span>
                  </div>
                  <div style={{ fontSize: 11, color: T.textSec, marginTop: 2 }}>{desc}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 4 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20 }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: T.navy, marginBottom: 14 }}>Revenue Stack by Project Type</div>
              {WIND_TYPES.map(t => {
                const arr = PROJECTS.filter(p=>p.type===t);
                const n2 = Math.max(1,arr.length);
                const avgCfd = arr.reduce((s,p)=>s+p.cfdStrike,0)/n2;
                const avgMerc = arr.reduce((s,p)=>s+p.merchantPct,0)/n2;
                const rocShare = t==='Onshore' ? 8 : t==='Offshore Fixed' ? 12 : 15;
                return (
                  <div key={t} style={{ marginBottom: 16 }}>
                    <div style={{ fontWeight: 600, fontSize: 13, color: T.navy, marginBottom: 8 }}>{t}</div>
                    <div style={{ display: 'flex', height: 28, borderRadius: 6, overflow: 'hidden' }}>
                      <div style={{ flex: 100 - avgMerc - rocShare, background: T.blue, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: '#fff' }}>CfD {(100-avgMerc-rocShare).toFixed(0)}%</div>
                      <div style={{ flex: rocShare, background: T.indigo, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: '#fff' }}>ROC {rocShare}%</div>
                      <div style={{ flex: avgMerc, background: T.amber, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: '#fff' }}>Merch {avgMerc.toFixed(0)}%</div>
                    </div>
                    <div style={{ fontSize: 11, color: T.textSec, marginTop: 4 }}>Base CfD strike: £{avgCfd.toFixed(0)}/MWh</div>
                  </div>
                );
              })}
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20 }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: T.navy, marginBottom: 14 }}>Revenue Stacking Components</div>
              {[
                { source: 'Energy Revenue (MWh)', share: '70%', desc: 'Power price × net generation', color: T.blue },
                { source: 'Capacity Market', share: '8%', desc: 'T-4 auctions UK · €/kW/year', color: T.indigo },
                { source: 'Balancing Services', share: '5%', desc: 'FFR, DC, DR grid services', color: T.teal },
                { source: 'Green Certificates (ROC/REGO)', share: '12%', desc: 'Renewable Obligation Certificates', color: T.green },
                { source: 'Ancillary Services', share: '3%', desc: 'Reactive power, black start', color: T.sage },
                { source: 'Carbon Credits', share: '2%', desc: 'Voluntary carbon offset revenue', color: T.purple },
              ].map(({ source, share, desc, color }) => (
                <div key={source} style={{ padding: '8px 0', borderBottom: `1px solid ${T.borderL}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: T.textPri }}>{source}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color, fontFamily: T.fontMono }}>{share}</span>
                  </div>
                  <div style={{ fontSize: 11, color: T.textSec }}>{desc}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 5 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20 }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: T.navy, marginBottom: 14 }}>Merchant Risk Exposure</div>
              {filtered.sort((a,b)=>b.merchantPct-a.merchantPct).slice(0,15).map(p => (
                <div key={p.id} style={{ marginBottom: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                    <span style={{ fontSize: 11, color: T.textPri }}>{p.name}</span>
                    <span style={{ fontSize: 11, fontWeight: 700, fontFamily: T.fontMono, color: p.merchantPct > 25 ? T.red : T.amber }}>{p.merchantPct.toFixed(1)}%</span>
                  </div>
                  <MiniBar value={p.merchantPct} max={40} color={p.merchantPct > 25 ? T.red : T.amber} />
                </div>
              ))}
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20 }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: T.navy, marginBottom: 14 }}>Merchant Risk Scenarios</div>
              {[
                { scenario: 'Base (£60/MWh)', irrImpact: '±0%', desc: 'Forward curve merchant assumption', color: T.blue },
                { scenario: 'Bull (£80/MWh)', irrImpact: '+1.8%', desc: 'High demand / low wind scenario', color: T.green },
                { scenario: 'Bear (£40/MWh)', irrImpact: '-2.1%', desc: 'High renewable penetration scenario', color: T.red },
                { scenario: 'Negative Prices (10% hrs)', irrImpact: '-0.9%', desc: 'Cannibalization risk at high RE share', color: T.orange },
                { scenario: 'Price Floor (£30/MWh)', irrImpact: '-1.5%', desc: 'Long-run marginal cost floor', color: T.amber },
              ].map(({ scenario, irrImpact, desc, color }) => (
                <div key={scenario} style={{ padding: '10px 12px', marginBottom: 8, background: T.sub, borderRadius: 8, borderLeft: `4px solid ${color}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: T.navy }}>{scenario}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color, fontFamily: T.fontMono }}>{irrImpact}</span>
                  </div>
                  <div style={{ fontSize: 11, color: T.textSec, marginTop: 2 }}>{desc}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 6 && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginBottom: 20 }}>
              {WIND_TYPES.map(t => {
                const arr = PROJECTS.filter(p=>p.type===t);
                const n2 = Math.max(1,arr.length);
                const avgCap = arr.reduce((s,p)=>s+p.capex,0)/n2;
                const avgWake = arr.reduce((s,p)=>s+p.wake,0)/n2;
                const avgDscr2 = arr.reduce((s,p)=>s+p.dscr,0)/n2;
                const colors = { Onshore: T.sage, 'Offshore Fixed': T.blue, 'Offshore Floating': T.purple };
                return (
                  <div key={t} style={{ background: T.card, border: `2px solid ${colors[t]}20`, borderRadius: 10, padding: 18 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: colors[t], marginBottom: 12 }}>{t}</div>
                    {[['CapEx Range',`$${arr.length?Math.min(...arr.map(p=>p.capex)).toFixed(1):0}–${arr.length?Math.max(...arr.map(p=>p.capex)).toFixed(1):0}/W`],['Avg CapEx',`$${avgCap.toFixed(2)}/W`],['Wake Loss',`${avgWake.toFixed(1)}%`],['Avg DSCR',`${avgDscr2.toFixed(2)}x`],['Count',`${arr.length} projects`]].map(([k,v]) => (
                      <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: `1px solid ${T.borderL}` }}>
                        <span style={{ fontSize: 12, color: T.textSec }}>{k}</span>
                        <span style={{ fontSize: 12, fontWeight: 700, fontFamily: T.fontMono, color: T.navy }}>{v}</span>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20 }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: T.navy, marginBottom: 14 }}>Offshore vs Onshore — Key Financial Comparisons</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
                {[
                  { metric: 'Avg CapEx', onshore: '$1.4/W', offFixed: '$4.2/W', offFloat: '$6.1/W' },
                  { metric: 'Avg CF', onshore: '33%', offFixed: '44%', offFloat: '48%' },
                  { metric: 'Avg LCOE', onshore: '$38/MWh', offFixed: '$78/MWh', offFloat: '$115/MWh' },
                  { metric: 'Avg IRR', onshore: '12.1%', offFixed: '10.8%', offFloat: '13.4%' },
                ].map(({ metric, onshore, offFixed, offFloat }) => (
                  <div key={metric} style={{ background: T.sub, borderRadius: 8, padding: 14 }}>
                    <div style={{ fontSize: 11, color: T.textSec, marginBottom: 8, fontWeight: 600 }}>{metric}</div>
                    <div style={{ fontSize: 11, color: T.sage }}>Onshore: <b>{onshore}</b></div>
                    <div style={{ fontSize: 11, color: T.blue, marginTop: 2 }}>Off Fixed: <b>{offFixed}</b></div>
                    <div style={{ fontSize: 11, color: T.purple, marginTop: 2 }}>Off Float: <b>{offFloat}</b></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {tab === 7 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20 }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: T.navy, marginBottom: 14 }}>Financial Model Inputs — Offshore Fixed</div>
              {[
                { param: 'CapEx', value: '$3.8–5.2/W', note: 'Foundation + turbine + installation' },
                { param: 'OpEx (fixed)', value: '$35–55/kW/yr', note: 'O&M, insurance, rates' },
                { param: 'Project Life', value: '25–30 years', note: 'Design life with mid-life refurbishment' },
                { param: 'Debt Tenor', value: '18–22 years', note: 'Non-recourse project finance' },
                { param: 'Debt Margin', value: 'SOFR+200–280bps', note: 'Investment-grade project' },
                { param: 'DSRA', value: '6 months', note: 'Debt service reserve account' },
                { param: 'Sponsor Equity', value: '25–35%', note: 'At financial close' },
                { param: 'Min LLCR', value: '1.25x', note: 'Loan life cover ratio covenant' },
              ].map(({ param, value, note }) => (
                <div key={param} style={{ padding: '7px 0', borderBottom: `1px solid ${T.borderL}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 12, color: T.textPri }}>{param}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: T.navy, fontFamily: T.fontMono }}>{value}</span>
                  </div>
                  <div style={{ fontSize: 11, color: T.textSec }}>{note}</div>
                </div>
              ))}
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20 }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: T.navy, marginBottom: 14 }}>IRR Sensitivity Analysis</div>
              {[
                { param: 'CF +2pp', delta: '+1.2%', color: T.green },
                { param: 'CF -2pp', delta: '-1.3%', color: T.red },
                { param: 'CapEx +10%', delta: '-1.5%', color: T.red },
                { param: 'Opex +15%', delta: '-0.7%', color: T.orange },
                { param: 'CfD Strike +£10/MWh', delta: '+0.9%', color: T.green },
                { param: 'Debt Margin +50bps', delta: '-0.4%', color: T.amber },
                { param: 'Inflation +1%', delta: '+0.3%', color: T.sage },
                { param: 'Wake Loss +3%', delta: '-0.5%', color: T.orange },
              ].map(({ param, delta, color }) => (
                <div key={param} style={{ padding: '7px 0', borderBottom: `1px solid ${T.borderL}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 12, color: T.textPri }}>{param}</span>
                    <span style={{ fontSize: 14, fontWeight: 700, color, fontFamily: T.fontMono }}>{delta}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
