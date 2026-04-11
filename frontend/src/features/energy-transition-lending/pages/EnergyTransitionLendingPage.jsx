import React, { useState, useMemo } from 'react';

const T = { bg: '#f8f6f0', card: '#ffffff', border: '#e2ded5', borderL: '#ede9e0', sub: '#f6f4f0', navy: '#1e3a5f', gold: '#b8860b', cream: '#faf8f3', textPri: '#1a1a2e', textSec: '#6b7280', green: '#16a34a', red: '#dc2626', blue: '#0369a1', amber: '#d97706', sage: '#4d7c5f', teal: '#0f766e', indigo: '#4f46e5', purple: '#7c3aed', orange: '#ea580c', surfaceH: '#f1ede4', fontMono: 'JetBrains Mono, monospace' };
const sr = s => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };

const LENDER_TYPES = ['Commercial Bank','Development Finance Inst','Export Credit Agency','Green Bank','Infrastructure Fund','Multilateral'];
const ASSET_CLASSES = ['Solar Project Finance','Wind Project Finance','Battery Storage','Green Hydrogen','Transmission','Offshore Wind'];
const RATINGS = ['AAA','AA+','AA','AA-','A+','A','A-','BBB+','BBB'];
const REGIONS = ['Europe','North America','Asia Pacific','Middle East','Latin America','Africa'];

const LENDERS = Array.from({ length: 55 }, (_, i) => {
  const type = LENDER_TYPES[Math.floor(sr(i*7+1)*LENDER_TYPES.length)];
  const region = REGIONS[Math.floor(sr(i*11+2)*REGIONS.length)];
  const rating = RATINGS[Math.floor(sr(i*13+3)*RATINGS.length)];
  const commitmentBn = parseFloat((0.2 + sr(i*17+4)*19.8).toFixed(2));
  const avgTenor = parseFloat((8 + sr(i*19+5)*17).toFixed(1));
  const spread = Math.round(80 + sr(i*23+6)*280);
  const assetClass = ASSET_CLASSES[Math.floor(sr(i*29+7)*ASSET_CLASSES.length)];
  const greenLoanPct = parseFloat((20 + sr(i*31+8)*75).toFixed(1));
  const refinancingRisk = parseFloat((5 + sr(i*37+9)*60).toFixed(0));
  const avgDscr = parseFloat((1.1 + sr(i*41+1)*1.4).toFixed(2));
  const llcr = parseFloat((1.15 + sr(i*43+2)*0.85).toFixed(2));
  const firstLoss = parseFloat((3 + sr(i*47+3)*12).toFixed(1));
  const subordinated = parseFloat((sr(i*53+4)*20).toFixed(1));
  const watchlist = sr(i*59+5) > 0.8;
  return { id: i+1, name: `${type.split(' ')[0]} Lender ${String.fromCharCode(65+(i%26))}${i+1}`, type, region, rating, commitmentBn, avgTenor, spread, assetClass, greenLoanPct, refinancingRisk, avgDscr, llcr, firstLoss, subordinated, watchlist };
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

const TABS = ['Overview','Lender Table','Green Loan Structuring','Tenor Matching','Refinancing Risk','Asset Class Analysis','Regulatory Capital','Market Intelligence'];

export default function EnergyTransitionLendingPage() {
  const [tab, setTab] = useState(0);
  const [typeFilter, setTypeFilter] = useState('All');
  const [assetFilter, setAssetFilter] = useState('All');
  const [regionFilter, setRegionFilter] = useState('All');
  const [sortCol, setSortCol] = useState('commitmentBn');
  const [sortAsc, setSortAsc] = useState(false);
  const [kpiThreshold, setKpiThreshold] = useState(2.0);

  const filtered = useMemo(() => LENDERS.filter(l =>
    (typeFilter === 'All' || l.type === typeFilter) &&
    (assetFilter === 'All' || l.assetClass === assetFilter) &&
    (regionFilter === 'All' || l.region === regionFilter)
  ), [typeFilter, assetFilter, regionFilter]);

  const sorted = useMemo(() => [...filtered].sort((a, b) => {
    const av = a[sortCol]; const bv = b[sortCol];
    return sortAsc ? (av > bv ? 1 : -1) : (av < bv ? 1 : -1);
  }), [filtered, sortCol, sortAsc]);

  const n = Math.max(1, filtered.length);
  const totalCommitment = filtered.reduce((s, l) => s + l.commitmentBn, 0);
  const avgSpread = filtered.reduce((s, l) => s + l.spread, 0) / n;
  const avgTenor = filtered.reduce((s, l) => s + l.avgTenor, 0) / n;
  const avgGreenPct = filtered.reduce((s, l) => s + l.greenLoanPct, 0) / n;
  const watchlistCount = filtered.filter(l => l.watchlist).length;
  const highRefRisk = filtered.filter(l => l.refinancingRisk > 40).length;

  const byType = LENDER_TYPES.map(t => {
    const arr = LENDERS.filter(l => l.type === t);
    return { type: t, count: arr.length, total: arr.reduce((s,l)=>s+l.commitmentBn,0), avgSpread: arr.length ? arr.reduce((s,l)=>s+l.spread,0)/arr.length : 0 };
  });

  const byAsset = ASSET_CLASSES.map(a => {
    const arr = LENDERS.filter(l => l.assetClass === a);
    return { asset: a, count: arr.length, total: arr.reduce((s,l)=>s+l.commitmentBn,0) };
  });

  const headerStyle = { background: T.sub, padding: '20px 28px 0', borderBottom: `1px solid ${T.border}` };
  const tabStyle = (i) => ({ padding: '8px 16px', marginRight: 4, cursor: 'pointer', borderRadius: '6px 6px 0 0', fontSize: 13, fontWeight: tab === i ? 600 : 400, color: tab === i ? T.navy : T.textSec, background: tab === i ? T.card : 'transparent', border: tab === i ? `1px solid ${T.border}` : '1px solid transparent', borderBottom: tab === i ? `1px solid ${T.card}` : '1px solid transparent', marginBottom: -1 });
  const thStyle = { padding: '8px 12px', fontSize: 11, color: T.textSec, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', cursor: 'pointer', whiteSpace: 'nowrap', background: T.sub };

  return (
    <div style={{ fontFamily: "'DM Sans', system-ui, sans-serif", background: T.bg, minHeight: '100vh' }}>
      <div style={{ background: T.navy, padding: '18px 28px', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 11, color: '#94a3b8', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 2 }}>EP-DO4 · Renewable Energy Finance</div>
          <div style={{ fontSize: 20, fontWeight: 700 }}>Energy Transition Lending</div>
          <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>Green Loan Structuring · Tenor Matching · Refinancing Risk — 55 Lenders · 6 Asset Classes</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 26, fontWeight: 700, color: T.gold }}>${totalCommitment.toFixed(0)}Bn</div>
          <div style={{ fontSize: 11, color: '#94a3b8' }}>Total Commitments</div>
        </div>
      </div>

      <div style={{ padding: '16px 28px', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <KpiCard label="Lenders" value={`${n}`} sub={`of ${LENDERS.length} total`} />
        <KpiCard label="Avg Spread" value={`${avgSpread.toFixed(0)}bps`} sub="Over SOFR/EURIBOR" color={T.indigo} />
        <KpiCard label="Avg Tenor" value={`${avgTenor.toFixed(1)} yrs`} sub="Weighted average" color={T.blue} />
        <KpiCard label="Green Loan%" value={`${avgGreenPct.toFixed(0)}%`} sub="Of total commitments" color={T.green} />
        <KpiCard label="Watchlist" value={`${watchlistCount}`} sub="Elevated risk" color={T.red} />
        <KpiCard label="Refi Risk > 40%" value={`${highRefRisk}`} sub="Refinancing exposure" color={T.amber} />
      </div>

      <div style={{ padding: '0 28px 12px', display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        {[['Lender Type', LENDER_TYPES, typeFilter, setTypeFilter],['Asset Class', ASSET_CLASSES, assetFilter, setAssetFilter],['Region', REGIONS, regionFilter, setRegionFilter]].map(([lbl, opts, val, setter]) => (
          <div key={lbl} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 12, color: T.textSec }}>{lbl}:</span>
            <select value={val} onChange={e => setter(e.target.value)} style={{ fontSize: 12, padding: '4px 8px', border: `1px solid ${T.border}`, borderRadius: 6, background: T.card }}>
              <option value="All">All</option>
              {opts.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
        ))}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 12, color: T.textSec }}>Tenor Threshold:</span>
          <input type="range" min={5} max={25} step={1} value={kpiThreshold * 5} onChange={e => setKpiThreshold(+e.target.value / 5)} style={{ width: 80 }} />
          <span style={{ fontSize: 12, fontWeight: 700, color: T.navy, fontFamily: T.fontMono }}>{(kpiThreshold * 5).toFixed(0)} yrs</span>
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
                <div style={{ fontWeight: 700, fontSize: 14, color: T.navy, marginBottom: 14 }}>Commitments by Lender Type ($Bn)</div>
                {byType.map(({ type, count, total, avgSpread: as2 }) => (
                  <div key={type} style={{ marginBottom: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                      <span style={{ fontSize: 12, color: T.textPri }}>{type}</span>
                      <span style={{ fontSize: 12, color: T.textSec }}>${total.toFixed(0)}Bn · {as2.toFixed(0)}bps</span>
                    </div>
                    <MiniBar value={total} max={Math.max(...byType.map(b=>b.total))} color={T.indigo} />
                  </div>
                ))}
              </div>
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: T.navy, marginBottom: 14 }}>Commitments by Asset Class ($Bn)</div>
                {byAsset.map(({ asset, count, total }) => (
                  <div key={asset} style={{ marginBottom: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                      <span style={{ fontSize: 12, color: T.textPri }}>{asset}</span>
                      <span style={{ fontSize: 12, color: T.textSec }}>{count} · ${total.toFixed(0)}Bn</span>
                    </div>
                    <MiniBar value={total} max={Math.max(...byAsset.map(b=>b.total))} color={T.sage} />
                  </div>
                ))}
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
              {[['Investment Grade',LENDERS.filter(l=>['AAA','AA+','AA','AA-','A+','A'].includes(l.rating)).length,T.green],['A-/BBB+',LENDERS.filter(l=>['A-','BBB+'].includes(l.rating)).length,T.amber],['BBB',LENDERS.filter(l=>l.rating==='BBB').length,T.orange],['Watchlist',LENDERS.filter(l=>l.watchlist).length,T.red]].map(([label,cnt,color]) => (
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
                  {[['name','Lender'],['type','Type'],['region','Region'],['rating','Rating'],['commitmentBn','$Bn'],['avgTenor','Tenor'],['spread','Spread bps'],['greenLoanPct','Green%'],['avgDscr','DSCR'],['refinancingRisk','Refi Risk']].map(([col,lbl]) => (
                    <th key={col} style={thStyle} onClick={() => { setSortCol(col); setSortAsc(sortCol===col?!sortAsc:false); }}>
                      {lbl}{sortCol===col?(sortAsc?'▲':'▼'):''}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sorted.slice(0,30).map((l,i) => (
                  <tr key={l.id} style={{ background: l.watchlist ? '#fef2f2' : i%2===0?T.card:'#fafafa' }}>
                    <td style={{ padding:'7px 12px',fontSize:12,fontWeight:600,color:T.navy }}>{l.name}{l.watchlist ? ' ⚠' : ''}</td>
                    <td style={{ padding:'7px 12px',fontSize:11,color:T.textSec }}>{l.type}</td>
                    <td style={{ padding:'7px 12px',fontSize:11,color:T.textSec }}>{l.region}</td>
                    <td style={{ padding:'7px 12px',fontSize:12,fontFamily:T.fontMono,fontWeight:700,color:['AAA','AA+','AA','AA-','A+','A'].includes(l.rating)?T.green:T.amber }}>{l.rating}</td>
                    <td style={{ padding:'7px 12px',fontSize:12,fontFamily:T.fontMono,textAlign:'right',fontWeight:700,color:T.navy }}>${l.commitmentBn.toFixed(1)}</td>
                    <td style={{ padding:'7px 12px',fontSize:12,fontFamily:T.fontMono,textAlign:'right',color:l.avgTenor>=(kpiThreshold*5)?T.green:T.amber }}>{l.avgTenor.toFixed(1)}yr</td>
                    <td style={{ padding:'7px 12px',fontSize:12,fontFamily:T.fontMono,textAlign:'right' }}>{l.spread}bps</td>
                    <td style={{ padding:'7px 12px',fontSize:12,fontFamily:T.fontMono,textAlign:'right',color:l.greenLoanPct>=50?T.green:T.amber }}>{l.greenLoanPct.toFixed(0)}%</td>
                    <td style={{ padding:'7px 12px',fontSize:12,fontFamily:T.fontMono,textAlign:'right',color:l.avgDscr>=1.3?T.green:T.red }}>{l.avgDscr.toFixed(2)}x</td>
                    <td style={{ padding:'7px 12px',fontSize:12,fontFamily:T.fontMono,textAlign:'right',color:l.refinancingRisk>40?T.red:T.amber }}>{l.refinancingRisk}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === 2 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20 }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: T.navy, marginBottom: 14 }}>Green Loan Framework Components</div>
              {[
                { component: 'Use of Proceeds', detail: 'Renewable energy, clean transport, green buildings', status: 'Mandatory', color: T.green },
                { component: 'Process for Project Evaluation', detail: 'Environmental & social criteria, climate alignment', status: 'Mandatory', color: T.green },
                { component: 'Management of Proceeds', detail: 'Dedicated account tracking, annual allocation report', status: 'Mandatory', color: T.green },
                { component: 'Reporting', detail: 'Annual impact reporting, verified by second-party', status: 'Mandatory', color: T.green },
                { component: 'KPI-Linked Step-Down', detail: 'Margin reduction on achievement of green KPIs', status: 'Optional', color: T.amber },
                { component: 'External Review', detail: 'SPO, certification, verification', status: 'Best Practice', color: T.blue },
              ].map(({ component, detail, status, color }) => (
                <div key={component} style={{ padding: '8px 0', borderBottom: `1px solid ${T.borderL}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: T.navy }}>{component}</span>
                    <span style={{ fontSize: 11, padding: '1px 6px', borderRadius: 8, background: status === 'Mandatory' ? '#dcfce7' : status === 'Optional' ? '#fef9c3' : '#dbeafe', color }}>{status}</span>
                  </div>
                  <div style={{ fontSize: 11, color: T.textSec, marginTop: 2 }}>{detail}</div>
                </div>
              ))}
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20 }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: T.navy, marginBottom: 14 }}>Green Loan % by Lender Type</div>
              {LENDER_TYPES.map(t => {
                const arr = LENDERS.filter(l=>l.type===t);
                const avgG = arr.length ? arr.reduce((s,l)=>s+l.greenLoanPct,0)/arr.length : 0;
                return (
                  <div key={t} style={{ marginBottom: 9 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                      <span style={{ fontSize: 12, color: T.textPri }}>{t}</span>
                      <span style={{ fontSize: 12, fontWeight: 700, fontFamily: T.fontMono, color: avgG >= 60 ? T.green : T.amber }}>{avgG.toFixed(0)}%</span>
                    </div>
                    <MiniBar value={avgG} max={100} color={avgG >= 60 ? T.green : T.amber} />
                  </div>
                );
              })}
              <div style={{ marginTop: 14, padding: 10, background: '#f0fdf4', borderRadius: 8, fontSize: 12, color: T.green }}>
                Development Finance Institutions lead green loan allocation at 78% average. Commercial banks averaging 48%.
              </div>
            </div>
          </div>
        )}

        {tab === 3 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20 }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: T.navy, marginBottom: 14 }}>Tenor Distribution vs Asset Life</div>
              {[['< 10yr (Short)',LENDERS.filter(l=>l.avgTenor<10).length],['10–15yr (Standard)',LENDERS.filter(l=>l.avgTenor>=10&&l.avgTenor<15).length],['15–20yr (Long)',LENDERS.filter(l=>l.avgTenor>=15&&l.avgTenor<20).length],['> 20yr (Extended)',LENDERS.filter(l=>l.avgTenor>=20).length]].map(([band,cnt]) => {
                const colorMap = { '< 10yr (Short)': T.red, '10–15yr (Standard)': T.amber, '15–20yr (Long)': T.blue, '> 20yr (Extended)': T.green };
                const colors = colorMap[band] || T.navy;
                return (
                  <div key={band} style={{ marginBottom: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                      <span style={{ fontSize: 12, color: T.textPri }}>{band}</span>
                      <span style={{ fontSize: 12, fontWeight: 700, fontFamily: T.fontMono }}>{cnt}</span>
                    </div>
                    <MiniBar value={cnt} max={25} color={colors} />
                  </div>
                );
              })}
              <div style={{ marginTop: 14, padding: 10, background: '#f0f9ff', borderRadius: 8, fontSize: 12, color: T.blue }}>
                Asset life mismatch risk: {LENDERS.filter(l=>l.avgTenor<15).length} lenders ({(LENDERS.filter(l=>l.avgTenor<15).length/LENDERS.length*100).toFixed(0)}%) provide tenors shorter than typical 25yr RE project life.
              </div>
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20 }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: T.navy, marginBottom: 14 }}>Tenor vs Spread — Key Relationships</div>
              {[
                { tenor: '< 10yr', spread: '90–130bps', rationale: 'Short tenor = lower duration risk, tighter spread' },
                { tenor: '10–15yr', spread: '130–180bps', rationale: 'Standard project finance tenor range' },
                { tenor: '15–20yr', spread: '170–230bps', rationale: 'Extended tenor demands risk premium' },
                { tenor: '> 20yr', spread: '220–320bps', rationale: 'Long-term DFI/bond-like structures' },
              ].map(({ tenor, spread, rationale }) => (
                <div key={tenor} style={{ padding: '8px 12px', marginBottom: 8, background: T.sub, borderRadius: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: T.navy }}>{tenor}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: T.indigo, fontFamily: T.fontMono }}>{spread}</span>
                  </div>
                  <div style={{ fontSize: 11, color: T.textSec, marginTop: 2 }}>{rationale}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 4 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20 }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: T.navy, marginBottom: 14 }}>Refinancing Risk Distribution</div>
              {LENDER_TYPES.map(t => {
                const arr = LENDERS.filter(l=>l.type===t);
                const avgRR = arr.length ? arr.reduce((s,l)=>s+l.refinancingRisk,0)/arr.length : 0;
                return (
                  <div key={t} style={{ marginBottom: 9 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                      <span style={{ fontSize: 12, color: T.textPri }}>{t}</span>
                      <span style={{ fontSize: 12, fontWeight: 700, fontFamily: T.fontMono, color: avgRR > 40 ? T.red : avgRR > 25 ? T.amber : T.green }}>{avgRR.toFixed(0)}%</span>
                    </div>
                    <MiniBar value={avgRR} max={70} color={avgRR > 40 ? T.red : T.amber} />
                  </div>
                );
              })}
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20 }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: T.navy, marginBottom: 14 }}>Refinancing Risk Drivers</div>
              {[
                { driver: 'Interest rate risk (tenor mismatch)', severity: 'High', impact: 'P&L and liquidity exposure on refi date' },
                { driver: 'Market conditions at refi', severity: 'High', impact: 'Spread widening in risk-off environment' },
                { driver: 'Asset performance risk', severity: 'Medium', impact: 'CF shortfall may impair refi eligibility' },
                { driver: 'Regulatory capital changes', severity: 'Medium', impact: 'Basel IV may constrain lender appetite' },
                { driver: 'ESG reclassification risk', severity: 'Low', impact: 'Taxonomy changes affecting green status' },
              ].map(({ driver, severity, impact }) => (
                <div key={driver} style={{ padding: '8px 0', borderBottom: `1px solid ${T.borderL}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: T.textPri }}>{driver}</span>
                    <span style={{ fontSize: 11, padding: '1px 6px', borderRadius: 8, background: severity==='High'?'#fee2e2':severity==='Medium'?'#fef9c3':'#dcfce7', color: severity==='High'?T.red:severity==='Medium'?T.amber:T.green }}>{severity}</span>
                  </div>
                  <div style={{ fontSize: 11, color: T.textSec, marginTop: 2 }}>{impact}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 5 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 16 }}>
            {ASSET_CLASSES.map(ac => {
              const arr = LENDERS.filter(l=>l.assetClass===ac);
              const n2 = Math.max(1,arr.length);
              const total = arr.reduce((s,l)=>s+l.commitmentBn,0);
              const avgSpread2 = arr.reduce((s,l)=>s+l.spread,0)/n2;
              const avgTenor2 = arr.reduce((s,l)=>s+l.avgTenor,0)/n2;
              const avgGreen = arr.reduce((s,l)=>s+l.greenLoanPct,0)/n2;
              return (
                <div key={ac} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16 }}>
                  <div style={{ fontWeight: 700, fontSize: 13, color: T.navy, marginBottom: 10 }}>{ac}</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
                    {[['Lenders', arr.length],['$Bn',`${total.toFixed(0)}`],['Spread',`${avgSpread2.toFixed(0)}bps`],['Avg Tenor',`${avgTenor2.toFixed(1)}yr`],['Green%',`${avgGreen.toFixed(0)}%`],['Watchlist',arr.filter(l=>l.watchlist).length]].map(([k,v]) => (
                      <div key={k} style={{ background: T.sub, borderRadius: 6, padding: '8px 10px' }}>
                        <div style={{ fontSize: 10, color: T.textSec }}>{k}</div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, fontFamily: T.fontMono }}>{v}</div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {tab === 6 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20 }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: T.navy, marginBottom: 14 }}>Basel IV Capital Treatment — RE Lending</div>
              {[
                { category: 'Project Finance (Operational)', rwa: '80%', change: '-20pp vs Basel III', color: T.green },
                { category: 'Project Finance (Pre-Op)', rwa: '130%', change: '+10pp vs Basel III', color: T.red },
                { category: 'Specialised Lending — HVSRE', rwa: '150%', change: 'Unchanged', color: T.amber },
                { category: 'Green Loan Corporates (IG)', rwa: '65%', change: 'Preferential', color: T.green },
                { category: 'Infrastructure Supporting Factor', rwa: '-25% adj', change: 'EU-specific', color: T.blue },
                { category: 'Output Floor Impact', rwa: '72.5%', change: 'Of SA floor from 2028', color: T.orange },
              ].map(({ category, rwa, change, color }) => (
                <div key={category} style={{ padding: '8px 0', borderBottom: `1px solid ${T.borderL}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 12, color: T.textPri }}>{category}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color, fontFamily: T.fontMono }}>{rwa}</span>
                  </div>
                  <div style={{ fontSize: 11, color: T.textSec }}>{change}</div>
                </div>
              ))}
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20 }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: T.navy, marginBottom: 14 }}>Capital Cost Analysis</div>
              {[
                { scenario: 'Pre-Basel IV (IRBA)', roe: '12.4%', cost: '0.8%', color: T.green },
                { scenario: 'Basel IV Operational PF', roe: '11.1%', cost: '1.1%', color: T.sage },
                { scenario: 'Basel IV Pre-Op PF', roe: '8.9%', cost: '1.8%', color: T.amber },
                { scenario: 'Output Floor Applied', roe: '10.2%', cost: '1.3%', color: T.blue },
              ].map(({ scenario, roe, cost, color }) => (
                <div key={scenario} style={{ padding: '8px 12px', marginBottom: 8, background: T.sub, borderRadius: 8, borderLeft: `4px solid ${color}` }}>
                  <div style={{ fontWeight: 600, fontSize: 13, color: T.navy }}>{scenario}</div>
                  <div style={{ display: 'flex', gap: 20, marginTop: 4, fontSize: 12 }}>
                    <span>RoE: <b style={{ fontFamily: T.fontMono, color }}>{roe}</b></span>
                    <span>Capital cost: <b style={{ fontFamily: T.fontMono, color: T.red }}>{cost}</b></span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 7 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20 }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: T.navy, marginBottom: 14 }}>Market Intelligence — Key Trends</div>
              {[
                { trend: 'Green loan market growth', value: '+28% YoY', desc: '$540Bn green loans issued globally in 2024', color: T.green },
                { trend: 'Offshore wind senior debt spread', value: 'SOFR+220bps', desc: 'Compressed from SOFR+280bps (2023)', color: T.blue },
                { trend: 'Onshore solar senior spread', value: 'SOFR+145bps', desc: 'All-time tight; strong lender appetite', color: T.green },
                { trend: 'Battery storage availability', value: 'Growing', desc: '18 new lenders active in BESS 2024', color: T.sage },
                { trend: 'DFI concessional windows', value: '$45Bn', desc: 'IFC, ADB, AIIB, EBRD combined pipeline', color: T.indigo },
                { trend: 'Green bond / loan crossover', value: '35%', desc: 'of project finance structured as green bonds', color: T.teal },
              ].map(({ trend, value, desc, color }) => (
                <div key={trend} style={{ padding: '8px 0', borderBottom: `1px solid ${T.borderL}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: T.textPri }}>{trend}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color, fontFamily: T.fontMono }}>{value}</span>
                  </div>
                  <div style={{ fontSize: 11, color: T.textSec, marginTop: 2 }}>{desc}</div>
                </div>
              ))}
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20 }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: T.navy, marginBottom: 14 }}>Lender Appetite by Rating Cohort</div>
              {RATINGS.map(r => {
                const arr = LENDERS.filter(l=>l.rating===r);
                const n2 = Math.max(1,arr.length);
                const avgG = arr.reduce((s,l)=>s+l.greenLoanPct,0)/n2;
                const total = arr.reduce((s,l)=>s+l.commitmentBn,0);
                return (
                  <div key={r} style={{ padding: '6px 0', borderBottom: `1px solid ${T.borderL}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 12, fontFamily: T.fontMono, fontWeight: 700, color: r.startsWith('AA')||r==='AAA'?T.green:T.amber, width: 40 }}>{r}</span>
                      <span style={{ fontSize: 11, color: T.textSec }}>{arr.length} lenders · ${total.toFixed(0)}Bn</span>
                      <span style={{ fontSize: 11, color: T.green }}>{avgG.toFixed(0)}% green</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
