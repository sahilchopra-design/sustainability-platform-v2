import React, { useState, useMemo } from 'react';

const T = { bg: '#f8f6f0', card: '#ffffff', border: '#e2ded5', borderL: '#ede9e0', sub: '#f6f4f0', navy: '#1e3a5f', gold: '#b8860b', cream: '#faf8f3', textPri: '#1a1a2e', textSec: '#6b7280', green: '#16a34a', red: '#dc2626', blue: '#0369a1', amber: '#d97706', sage: '#4d7c5f', teal: '#0f766e', indigo: '#4f46e5', purple: '#7c3aed', orange: '#ea580c', surfaceH: '#f1ede4', fontMono: 'JetBrains Mono, monospace' };
const sr = s => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };

const PPA_STRUCTURES = ['Physical PPA','Virtual/Financial PPA','Sleeved PPA','Proxy Revenue Swap','Green Tariff','Corporate CfD'];
const OFFTAKER_SECTORS = ['Technology','Manufacturing','Financial Services','Retail','Healthcare','Public Sector'];
const CREDIT_RATINGS = ['AAA','AA','A','BBB+','BBB','BBB-'];
const TECH_TYPES = ['Solar PV','Wind Onshore','Wind Offshore','Hybrid Solar+Storage'];
const GEOGRAPHIES = ['USA','UK','Germany','Spain','Australia','Netherlands','France','Sweden'];

const CONTRACTS = Array.from({ length: 65 }, (_, i) => {
  const structure = PPA_STRUCTURES[Math.floor(sr(i*7+1)*PPA_STRUCTURES.length)];
  const sector = OFFTAKER_SECTORS[Math.floor(sr(i*11+2)*OFFTAKER_SECTORS.length)];
  const rating = CREDIT_RATINGS[Math.floor(sr(i*13+3)*CREDIT_RATINGS.length)];
  const tech = TECH_TYPES[Math.floor(sr(i*17+4)*TECH_TYPES.length)];
  const geo = GEOGRAPHIES[Math.floor(sr(i*19+5)*GEOGRAPHIES.length)];
  const volumeMwh = Math.round(10000 + sr(i*23+6)*490000);
  const priceFloor = parseFloat((25 + sr(i*29+7)*55).toFixed(1));
  const contractPrice = parseFloat((priceFloor + 5 + sr(i*31+8)*45).toFixed(1));
  const termYears = Math.round(5 + sr(i*37+9)*20);
  const startYear = 2022 + Math.floor(sr(i*41+1)*5);
  const offtakerRisk = parseFloat((10 + sr(i*43+2)*75).toFixed(0));
  const volumeRisk = parseFloat((5 + sr(i*47+3)*50).toFixed(0));
  const priceRisk = parseFloat((10 + sr(i*53+4)*60).toFixed(0));
  const pvRatio = parseFloat((0.8 + sr(i*59+5)*0.6).toFixed(2));
  const markToMarket = parseFloat(((sr(i*61+6)-0.5)*20).toFixed(1));
  const creditExposure = parseFloat((0.5 + sr(i*67+7)*49.5).toFixed(1));
  const greenAdditionality = sr(i*71+8) > 0.5;
  return { id: i+1, name: `${sector.split(' ')[0]}-${geo}-${String.fromCharCode(65+(i%26))}${i+1}`, structure, sector, rating, tech, geo, volumeMwh, priceFloor, contractPrice, termYears, startYear, offtakerRisk, volumeRisk, priceRisk, pvRatio, markToMarket, creditExposure, greenAdditionality };
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

const TABS = ['Portfolio Overview','Contract Register','Offtake Risk','Price Floor Analysis','Corporate PPA','Virtual PPA','Credit Exposure','Mark-to-Market'];

export default function PPAAnalyticsPage() {
  const [tab, setTab] = useState(0);
  const [structFilter, setStructFilter] = useState('All');
  const [sectorFilter, setSectorFilter] = useState('All');
  const [geoFilter, setGeoFilter] = useState('All');
  const [sortCol, setSortCol] = useState('creditExposure');
  const [sortAsc, setSortAsc] = useState(false);
  const [priceScenario, setPriceScenario] = useState(60);

  const filtered = useMemo(() => CONTRACTS.filter(c =>
    (structFilter === 'All' || c.structure === structFilter) &&
    (sectorFilter === 'All' || c.sector === sectorFilter) &&
    (geoFilter === 'All' || c.geo === geoFilter)
  ), [structFilter, sectorFilter, geoFilter]);

  const sorted = useMemo(() => [...filtered].sort((a, b) => {
    const av = a[sortCol]; const bv = b[sortCol];
    return sortAsc ? (av > bv ? 1 : -1) : (av < bv ? 1 : -1);
  }), [filtered, sortCol, sortAsc]);

  const n = Math.max(1, filtered.length);
  const avgPrice = filtered.reduce((s, c) => s + c.contractPrice, 0) / n;
  const avgFloor = filtered.reduce((s, c) => s + c.priceFloor, 0) / n;
  const totalCredit = filtered.reduce((s, c) => s + c.creditExposure, 0);
  const avgMtM = filtered.reduce((s, c) => s + c.markToMarket, 0) / n;
  const atRiskContracts = filtered.filter(c => priceScenario < c.priceFloor).length;
  const additionalityCount = filtered.filter(c => c.greenAdditionality).length;

  const byStructure = PPA_STRUCTURES.map(s => {
    const arr = CONTRACTS.filter(c => c.structure === s);
    return { structure: s, count: arr.length, avgPrice: arr.length ? arr.reduce((ss,c)=>ss+c.contractPrice,0)/arr.length : 0, totalCredit: arr.reduce((ss,c)=>ss+c.creditExposure,0) };
  });

  const headerStyle = { background: T.sub, padding: '20px 28px 0', borderBottom: `1px solid ${T.border}` };
  const tabStyle = (i) => ({ padding: '8px 16px', marginRight: 4, cursor: 'pointer', borderRadius: '6px 6px 0 0', fontSize: 13, fontWeight: tab === i ? 600 : 400, color: tab === i ? T.navy : T.textSec, background: tab === i ? T.card : 'transparent', border: tab === i ? `1px solid ${T.border}` : '1px solid transparent', borderBottom: tab === i ? `1px solid ${T.card}` : '1px solid transparent', marginBottom: -1 });
  const thStyle = { padding: '8px 12px', fontSize: 11, color: T.textSec, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', cursor: 'pointer', whiteSpace: 'nowrap', background: T.sub };

  return (
    <div style={{ fontFamily: "'DM Sans', system-ui, sans-serif", background: T.bg, minHeight: '100vh' }}>
      <div style={{ background: T.navy, padding: '18px 28px', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 11, color: '#94a3b8', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 2 }}>EP-DO5 · Renewable Energy Finance</div>
          <div style={{ fontSize: 20, fontWeight: 700 }}>PPA Analytics</div>
          <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>Offtake Risk · Price Floors · Corporate PPA · Virtual PPA — 65 Contracts · 5 Structures</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 26, fontWeight: 700, color: T.gold }}>${avgPrice.toFixed(0)}/MWh</div>
          <div style={{ fontSize: 11, color: '#94a3b8' }}>Avg Portfolio PPA Price</div>
        </div>
      </div>

      <div style={{ padding: '16px 28px', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <KpiCard label="Contracts" value={`${n}`} sub={`of ${CONTRACTS.length} total`} />
        <KpiCard label="Avg Price Floor" value={`$${avgFloor.toFixed(0)}/MWh`} sub="Floor protection level" color={T.green} />
        <KpiCard label="Total Credit Exp." value={`$${totalCredit.toFixed(0)}M`} sub="Counterparty exposure" color={T.red} />
        <KpiCard label="Avg Mark-to-Market" value={`${avgMtM >= 0 ? '+' : ''}$${avgMtM.toFixed(1)}/MWh`} sub="vs current market" color={avgMtM >= 0 ? T.green : T.red} />
        <KpiCard label="Price Scenario Risk" value={`${atRiskContracts}`} sub={`contracts at risk @ $${priceScenario}`} color={atRiskContracts > 10 ? T.red : T.amber} />
        <KpiCard label="Additionality" value={`${additionalityCount}`} sub="Green additionality certified" color={T.sage} />
      </div>

      <div style={{ padding: '0 28px 12px', display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        {[['Structure', PPA_STRUCTURES, structFilter, setStructFilter],['Sector', OFFTAKER_SECTORS, sectorFilter, setSectorFilter],['Geography', GEOGRAPHIES, geoFilter, setGeoFilter]].map(([lbl, opts, val, setter]) => (
          <div key={lbl} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 12, color: T.textSec }}>{lbl}:</span>
            <select value={val} onChange={e => setter(e.target.value)} style={{ fontSize: 12, padding: '4px 8px', border: `1px solid ${T.border}`, borderRadius: 6, background: T.card }}>
              <option value="All">All</option>
              {opts.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
        ))}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 12, color: T.textSec }}>Price Scenario:</span>
          <input type="range" min={20} max={100} step={5} value={priceScenario} onChange={e => setPriceScenario(+e.target.value)} style={{ width: 80 }} />
          <span style={{ fontSize: 12, fontWeight: 700, color: T.navy, fontFamily: T.fontMono }}>${priceScenario}/MWh</span>
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
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: T.navy, marginBottom: 14 }}>Contract Volume by Structure</div>
                {byStructure.map(({ structure, count, avgPrice: ap, totalCredit: tc }) => (
                  <div key={structure} style={{ marginBottom: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                      <span style={{ fontSize: 12, color: T.textPri }}>{structure}</span>
                      <span style={{ fontSize: 12, color: T.textSec }}>{count} · ${ap.toFixed(0)}/MWh · ${tc.toFixed(0)}M exp</span>
                    </div>
                    <MiniBar value={count} max={15} color={T.indigo} />
                  </div>
                ))}
              </div>
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: T.navy, marginBottom: 14 }}>Offtaker Sector Distribution</div>
                {OFFTAKER_SECTORS.map(s => {
                  const arr = CONTRACTS.filter(c => c.sector === s);
                  const avgCP = arr.length ? arr.reduce((ss, c) => ss + c.contractPrice, 0) / arr.length : 0;
                  return (
                    <div key={s} style={{ marginBottom: 9 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                        <span style={{ fontSize: 12, color: T.textPri }}>{s}</span>
                        <span style={{ fontSize: 12, color: T.textSec }}>{arr.length} · avg ${avgCP.toFixed(0)}/MWh</span>
                      </div>
                      <MiniBar value={arr.length} max={20} color={T.gold} />
                    </div>
                  );
                })}
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
              {[['Physical PPA', CONTRACTS.filter(c=>c.structure==='Physical PPA').length, T.blue],['Virtual PPA', CONTRACTS.filter(c=>c.structure==='Virtual/Financial PPA').length, T.purple],['CfD/Green Tariff', CONTRACTS.filter(c=>['Corporate CfD','Green Tariff'].includes(c.structure)).length, T.sage],['High Credit Risk', CONTRACTS.filter(c=>c.offtakerRisk>60).length, T.red]].map(([label, cnt, color]) => (
                <div key={label} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16, textAlign: 'center' }}>
                  <div style={{ fontSize: 24, fontWeight: 700, color }}>{cnt}</div>
                  <div style={{ fontSize: 11, color: T.textSec }}>{label}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 1 && (
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, overflow: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {[['name','Contract'],['structure','Structure'],['sector','Sector'],['rating','Rating'],['contractPrice','Price'],['priceFloor','Floor'],['termYears','Term'],['markToMarket','MtM'],['creditExposure','Credit $M'],['greenAdditionality','Add.']].map(([col,lbl]) => (
                    <th key={col} style={thStyle} onClick={() => { setSortCol(col); setSortAsc(sortCol===col?!sortAsc:false); }}>
                      {lbl}{sortCol===col?(sortAsc?'▲':'▼'):''}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sorted.slice(0,30).map((c,i) => (
                  <tr key={c.id} style={{ background: i%2===0?T.card:'#fafafa' }}>
                    <td style={{ padding:'7px 12px',fontSize:12,fontWeight:600,color:T.navy }}>{c.name}</td>
                    <td style={{ padding:'7px 12px',fontSize:11,color:T.textSec }}>{c.structure}</td>
                    <td style={{ padding:'7px 12px',fontSize:11,color:T.textSec }}>{c.sector}</td>
                    <td style={{ padding:'7px 12px',fontSize:12,fontFamily:T.fontMono,fontWeight:700,color:['AAA','AA','A'].includes(c.rating)?T.green:T.amber }}>{c.rating}</td>
                    <td style={{ padding:'7px 12px',fontSize:12,fontFamily:T.fontMono,textAlign:'right' }}>${c.contractPrice.toFixed(0)}</td>
                    <td style={{ padding:'7px 12px',fontSize:12,fontFamily:T.fontMono,textAlign:'right',color:T.green }}>${c.priceFloor.toFixed(0)}</td>
                    <td style={{ padding:'7px 12px',fontSize:12,fontFamily:T.fontMono,textAlign:'right' }}>{c.termYears}yr</td>
                    <td style={{ padding:'7px 12px',fontSize:12,fontFamily:T.fontMono,textAlign:'right',color:c.markToMarket>=0?T.green:T.red,fontWeight:700 }}>{c.markToMarket>=0?'+':''}${c.markToMarket.toFixed(1)}</td>
                    <td style={{ padding:'7px 12px',fontSize:12,fontFamily:T.fontMono,textAlign:'right',color:c.creditExposure>30?T.red:T.textSec }}>${c.creditExposure.toFixed(0)}</td>
                    <td style={{ padding:'7px 12px',fontSize:12,textAlign:'center' }}>{c.greenAdditionality ? '✓' : '–'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === 2 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20 }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: T.navy, marginBottom: 14 }}>Offtake Risk by Sector</div>
              {OFFTAKER_SECTORS.map(s => {
                const arr = CONTRACTS.filter(c => c.sector === s);
                const avgOR = arr.length ? arr.reduce((ss,c)=>ss+c.offtakerRisk,0)/arr.length : 0;
                return (
                  <div key={s} style={{ marginBottom: 9 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                      <span style={{ fontSize: 12, color: T.textPri }}>{s}</span>
                      <span style={{ fontSize: 12, fontWeight: 700, fontFamily: T.fontMono, color: avgOR > 55 ? T.red : avgOR > 35 ? T.amber : T.green }}>{avgOR.toFixed(0)}/100</span>
                    </div>
                    <MiniBar value={avgOR} max={100} color={avgOR > 55 ? T.red : avgOR > 35 ? T.amber : T.green} />
                  </div>
                );
              })}
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20 }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: T.navy, marginBottom: 14 }}>Offtake Risk Components</div>
              {[
                { risk: 'Credit risk', description: 'Offtaker default on payment obligation', mitigation: 'Credit wrap, parent guarantee, LC' },
                { risk: 'Volume risk', description: 'Actual load less than contracted volume', mitigation: 'Shaped PPA, settlement mechanism' },
                { risk: 'Basis risk', description: 'Location mismatch (generation vs load)', mitigation: 'Virtual PPA removes physical basis risk' },
                { risk: 'Regulatory risk', description: 'Policy change affecting PPA obligation', mitigation: 'Change in law clauses, step-in rights' },
                { risk: 'Curtailment risk', description: 'Grid operator curtails generation output', mitigation: 'Curtailment sharing mechanism, floor' },
              ].map(({ risk, description, mitigation }) => (
                <div key={risk} style={{ padding: '8px 0', borderBottom: `1px solid ${T.borderL}` }}>
                  <div style={{ fontWeight: 600, fontSize: 12, color: T.navy }}>{risk}</div>
                  <div style={{ fontSize: 11, color: T.textSec, marginTop: 1 }}>{description}</div>
                  <div style={{ fontSize: 11, color: T.green, marginTop: 1 }}>↳ {mitigation}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 3 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20 }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: T.navy, marginBottom: 14 }}>Price Floor Analysis — Scenario: ${priceScenario}/MWh Market</div>
              {['< $30/MWh','$30–$45/MWh','$45–$60/MWh','$60–$75/MWh','> $75/MWh'].map((band, bi) => {
                const ranges = [[0,30],[30,45],[45,60],[60,75],[75,999]];
                const [lo,hi] = ranges[bi];
                const arr = CONTRACTS.filter(c => c.priceFloor >= lo && c.priceFloor < hi);
                const atRisk = arr.filter(c => priceScenario < c.priceFloor).length;
                return (
                  <div key={band} style={{ marginBottom: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                      <span style={{ fontSize: 12, color: T.textPri }}>Floor {band}</span>
                      <span style={{ fontSize: 12, color: T.textSec }}>{arr.length} contracts · <span style={{ color: atRisk > 0 ? T.red : T.green }}>{atRisk} at risk</span></span>
                    </div>
                    <MiniBar value={arr.length} max={20} color={atRisk > 0 ? T.red : T.green} />
                  </div>
                );
              })}
              <div style={{ marginTop: 12, padding: 10, background: atRiskContracts > 5 ? '#fef2f2' : '#f0fdf4', borderRadius: 8, fontSize: 12, color: atRiskContracts > 5 ? T.red : T.green }}>
                At ${priceScenario}/MWh market price: {atRiskContracts} contracts ({(atRiskContracts/CONTRACTS.length*100).toFixed(0)}%) would trigger price floor provisions.
              </div>
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20 }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: T.navy, marginBottom: 14 }}>Price Floor Structures</div>
              {[
                { type: 'Hard Floor', desc: 'Seller receives floor regardless of market price', pros: 'Full downside protection', cons: 'Higher premium', color: T.green },
                { type: 'Soft Floor', desc: 'Floor applies only with curtailment events', pros: 'Lower premium', cons: 'Partial downside', color: T.amber },
                { type: 'Synthetic Floor (Virtual)', desc: 'Financial settlement — floor paid if market < floor', pros: 'No physical delivery needed', cons: 'Counterparty credit exposure', color: T.blue },
                { type: 'Proxy Revenue Swap', desc: 'Swap P50 revenue for fixed amount per MWh', pros: 'Volume + price risk hedged', cons: 'Complexity in settlements', color: T.purple },
              ].map(({ type, desc, pros, cons, color }) => (
                <div key={type} style={{ padding: '10px 12px', marginBottom: 8, background: T.sub, borderRadius: 8, borderLeft: `4px solid ${color}` }}>
                  <div style={{ fontWeight: 600, fontSize: 13, color: T.navy }}>{type}</div>
                  <div style={{ fontSize: 11, color: T.textSec, marginTop: 2 }}>{desc}</div>
                  <div style={{ display: 'flex', gap: 12, marginTop: 4, fontSize: 11 }}>
                    <span style={{ color: T.green }}>+ {pros}</span>
                    <span style={{ color: T.red }}>- {cons}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 4 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20 }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: T.navy, marginBottom: 14 }}>Corporate PPA Market Statistics</div>
              {[
                { stat: 'Global Corporate PPA Volume (2024)', value: '43.7 GW', color: T.green },
                { stat: 'USA Market Share', value: '48%', color: T.blue },
                { stat: 'Europe Market Share', value: '31%', color: T.indigo },
                { stat: 'APAC Market Share', value: '15%', color: T.teal },
                { stat: 'Avg Contract Length', value: '15 years', color: T.navy },
                { stat: 'RE100 Signatories', value: '420+ companies', color: T.sage },
                { stat: 'Avg Deal Size', value: '87 MW', color: T.amber },
                { stat: 'Tech Sector Share', value: '38%', color: T.purple },
              ].map(({ stat, value, color }) => (
                <div key={stat} style={{ padding: '7px 0', borderBottom: `1px solid ${T.borderL}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 12, color: T.textPri }}>{stat}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color, fontFamily: T.fontMono }}>{value}</span>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20 }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: T.navy, marginBottom: 14 }}>Portfolio Corporate PPA by Sector</div>
              {OFFTAKER_SECTORS.map(s => {
                const arr = CONTRACTS.filter(c => c.sector === s && ['Physical PPA','Corporate CfD'].includes(c.structure));
                const avgCr = arr.length ? arr.reduce((ss,c)=>ss+c.creditExposure,0)/arr.length : 0;
                const avgRating = arr.length ? arr[Math.floor(arr.length/2)]?.rating || 'N/A' : 'N/A';
                return (
                  <div key={s} style={{ padding: '8px 0', borderBottom: `1px solid ${T.borderL}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: T.navy }}>{s}</span>
                      <div style={{ display: 'flex', gap: 10, fontSize: 12 }}>
                        <span style={{ color: T.textSec }}>{arr.length} contracts</span>
                        <span style={{ fontFamily: T.fontMono, color: T.indigo }}>${avgCr.toFixed(0)}M avg exp</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {tab === 5 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20 }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: T.navy, marginBottom: 14 }}>Virtual PPA Structure Analysis</div>
              <div style={{ padding: 14, background: '#ede9fe', borderRadius: 8, marginBottom: 14, fontSize: 12, color: T.purple }}>
                Virtual PPAs (VPPAs) are financial contracts — no physical power delivery. Seller generates at one location; buyer purchases from grid separately. Settlement = (contract price − market price) × volume.
              </div>
              {[
                { metric: 'VPPA Count in Portfolio', value: CONTRACTS.filter(c=>c.structure==='Virtual/Financial PPA').length },
                { metric: 'Avg VPPA Price', value: `$${CONTRACTS.filter(c=>c.structure==='Virtual/Financial PPA').reduce((s,c)=>s+c.contractPrice,0)/Math.max(1,CONTRACTS.filter(c=>c.structure==='Virtual/Financial PPA').length)}` },
                { metric: 'VPPA MtM Positive', value: CONTRACTS.filter(c=>c.structure==='Virtual/Financial PPA'&&c.markToMarket>=0).length },
                { metric: 'VPPA Credit Exposure', value: `$${CONTRACTS.filter(c=>c.structure==='Virtual/Financial PPA').reduce((s,c)=>s+c.creditExposure,0).toFixed(0)}M` },
                { metric: 'Additionality Certified', value: `${CONTRACTS.filter(c=>c.structure==='Virtual/Financial PPA'&&c.greenAdditionality).length}` },
              ].map(({ metric, value }) => (
                <div key={metric} style={{ padding: '7px 0', borderBottom: `1px solid ${T.borderL}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 12, color: T.textPri }}>{metric}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: T.purple, fontFamily: T.fontMono }}>{value}</span>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20 }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: T.navy, marginBottom: 14 }}>VPPA vs Physical PPA Comparison</div>
              {[
                ['Feature','Physical PPA','Virtual PPA'],
                ['Physical delivery','Yes — actual power','No — financial only'],
                ['Location flexibility','Limited','High'],
                ['Basis risk','Low','Higher'],
                ['Accounting (IFRS)','Power purchase','Derivative'],
                ['RECs/GOs','Bundled','Separate purchase'],
                ['Additionality','Direct','Indirect'],
                ['Credit risk','Seller credit risk','Settlement risk'],
              ].map(([f, phys, virt], idx) => (
                <div key={f} style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 2fr', gap: 4, padding: '5px 0', borderBottom: `1px solid ${T.borderL}`, background: idx === 0 ? T.sub : 'transparent' }}>
                  <span style={{ fontSize: idx===0?11:12, fontWeight: idx===0?700:500, color: idx===0?T.textSec:T.navy }}>{f}</span>
                  <span style={{ fontSize: 11, color: T.blue }}>{phys}</span>
                  <span style={{ fontSize: 11, color: T.purple }}>{virt}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 6 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20 }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: T.navy, marginBottom: 14 }}>Credit Exposure by Rating</div>
              {CREDIT_RATINGS.map(r => {
                const arr = CONTRACTS.filter(c => c.rating === r);
                const total = arr.reduce((s,c)=>s+c.creditExposure,0);
                return (
                  <div key={r} style={{ marginBottom: 9 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                      <span style={{ fontSize: 12, fontFamily: T.fontMono, fontWeight: 700, color: ['AAA','AA','A'].includes(r)?T.green:T.amber }}>{r}</span>
                      <span style={{ fontSize: 12, color: T.textSec }}>{arr.length} contracts · ${total.toFixed(0)}M</span>
                    </div>
                    <MiniBar value={total} max={800} color={['AAA','AA','A'].includes(r)?T.green:T.amber} />
                  </div>
                );
              })}
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20 }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: T.navy, marginBottom: 14 }}>Credit Risk Management Tools</div>
              {[
                { tool: 'Parent Company Guarantee', usage: '68%', desc: 'Parent guarantees subsidiary obligations', color: T.green },
                { tool: 'Letter of Credit (LC)', usage: '45%', desc: '6–12 month LC from investment-grade bank', color: T.blue },
                { tool: 'Credit Wrap / Insurance', usage: '22%', desc: 'Third-party insurance on offtaker credit', color: T.indigo },
                { tool: 'Netting Agreement', usage: '38%', desc: 'ISDA master agreement for settlement netting', color: T.teal },
                { tool: 'Termination Provisions', usage: '92%', desc: 'Cross-default, material adverse change clauses', color: T.sage },
                { tool: 'Reserve Account', usage: '31%', desc: 'Cash reserve for first-loss protection', color: T.amber },
              ].map(({ tool, usage, desc, color }) => (
                <div key={tool} style={{ padding: '8px 0', borderBottom: `1px solid ${T.borderL}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: T.navy }}>{tool}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color, fontFamily: T.fontMono }}>{usage}</span>
                  </div>
                  <div style={{ fontSize: 11, color: T.textSec, marginTop: 1 }}>{desc}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 7 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20 }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: T.navy, marginBottom: 14 }}>Mark-to-Market Distribution</div>
              {[['> +$10/MWh', CONTRACTS.filter(c=>c.markToMarket>10)],['+$5–$10/MWh', CONTRACTS.filter(c=>c.markToMarket>=5&&c.markToMarket<=10)],['$0–$5/MWh', CONTRACTS.filter(c=>c.markToMarket>=0&&c.markToMarket<5)],['-$5–$0/MWh', CONTRACTS.filter(c=>c.markToMarket>=-5&&c.markToMarket<0)],['< -$5/MWh', CONTRACTS.filter(c=>c.markToMarket<-5)]].map(([band, arr]) => (
                <div key={band} style={{ marginBottom: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                    <span style={{ fontSize: 12, color: T.textPri }}>{band}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: band.includes('–') && band.startsWith('+') || band.startsWith('> +') ? T.green : band.includes('-') ? T.red : T.amber }}>{arr.length} contracts</span>
                  </div>
                  <MiniBar value={arr.length} max={20} color={band.startsWith('> +') || (band.startsWith('+') && !band.includes('–$')) ? T.green : band.includes('-') ? T.red : T.amber} />
                </div>
              ))}
              <div style={{ marginTop: 12, padding: 10, background: avgMtM >= 0 ? '#f0fdf4' : '#fef2f2', borderRadius: 8, fontSize: 12, color: avgMtM >= 0 ? T.green : T.red }}>
                Portfolio avg MtM: {avgMtM >= 0 ? '+' : ''}${avgMtM.toFixed(2)}/MWh vs current market
              </div>
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20 }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: T.navy, marginBottom: 14 }}>Top 15 Contracts by Credit Exposure</div>
              {sorted.slice(0,15).map(c => (
                <div key={c.id} style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: 8, padding: '5px 0', borderBottom: `1px solid ${T.borderL}`, alignItems: 'center' }}>
                  <span style={{ fontSize: 11, color: T.navy, fontWeight: 500 }}>{c.name.slice(0,22)}</span>
                  <span style={{ fontSize: 11, fontFamily: T.fontMono, color: c.creditExposure > 30 ? T.red : T.amber }}>${c.creditExposure.toFixed(0)}M</span>
                  <span style={{ fontSize: 11, fontFamily: T.fontMono, color: c.markToMarket >= 0 ? T.green : T.red }}>{c.markToMarket >= 0 ? '+' : ''}${c.markToMarket.toFixed(1)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
