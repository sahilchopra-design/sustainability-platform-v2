import React, { useState, useMemo } from 'react';

const T = { bg: '#f8f6f0', card: '#ffffff', border: '#e2ded5', borderL: '#ede9e0', sub: '#f6f4f0', navy: '#1e3a5f', gold: '#b8860b', cream: '#faf8f3', textPri: '#1a1a2e', textSec: '#6b7280', green: '#16a34a', red: '#dc2626', blue: '#0369a1', amber: '#d97706', sage: '#4d7c5f', teal: '#0f766e', indigo: '#4f46e5', purple: '#7c3aed', orange: '#ea580c', surfaceH: '#f1ede4', fontMono: 'JetBrains Mono, monospace' };
const sr = s => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };

const TECHNOLOGIES = ['Solar PV','Wind Onshore','Wind Offshore','Battery Storage','Green Hydrogen','Biomass'];
const STAGES = ['Concept','Scoping','ESIA','Planning Application','Consent Granted','Shovel-Ready','Construction','Operational'];
const GRID_RISKS = ['Low','Medium','High','Critical'];
const REGIONS = ['North America','Europe','Asia Pacific','Middle East','Latin America','Africa'];

const PROJECTS = Array.from({ length: 80 }, (_, i) => {
  const tech = TECHNOLOGIES[Math.floor(sr(i*7+1)*TECHNOLOGIES.length)];
  const stage = STAGES[Math.floor(sr(i*11+2)*STAGES.length)];
  const region = REGIONS[Math.floor(sr(i*13+3)*REGIONS.length)];
  const gridRisk = GRID_RISKS[Math.floor(sr(i*17+4)*GRID_RISKS.length)];
  const capacityMw = Math.round(10 + sr(i*19+5)*990);
  const permitMonths = Math.round(6 + sr(i*23+6)*42);
  const gridConnMonths = Math.round(3 + sr(i*29+7)*36);
  const codYear = 2025 + Math.floor(sr(i*31+8)*6);
  const capex = parseFloat((0.5 + sr(i*37+9)*4.5).toFixed(2));
  const permittingRisk = parseFloat((10 + sr(i*41+1)*85).toFixed(0));
  const gridCapacity = parseFloat((60 + sr(i*43+2)*40).toFixed(0));
  const envScore = parseFloat((40 + sr(i*47+3)*55).toFixed(0));
  const probability = parseFloat((20 + sr(i*53+4)*75).toFixed(0));
  const developerExp = Math.round(1 + sr(i*59+5)*9);
  return { id: i+1, name:`${region.split(' ')[0]} ${tech.split(' ')[0]}-${String.fromCharCode(65+(i%26))}${i+1}`, tech, stage, region, gridRisk, capacityMw, permitMonths, gridConnMonths, codYear, capex, permittingRisk, gridCapacity, envScore, probability, developerExp };
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

const TABS = ['Pipeline Overview','Project Register','Permitting Risk','Grid Connection','COD Timeline','Technology Mix','Regional Analysis','Risk Matrix'];

export default function RenewableProjectPipelinePage() {
  const [tab, setTab] = useState(0);
  const [techFilter, setTechFilter] = useState('All');
  const [stageFilter, setStageFilter] = useState('All');
  const [regionFilter, setRegionFilter] = useState('All');
  const [sortCol, setSortCol] = useState('probability');
  const [sortAsc, setSortAsc] = useState(false);

  const filtered = useMemo(() => PROJECTS.filter(p =>
    (techFilter === 'All' || p.tech === techFilter) &&
    (stageFilter === 'All' || p.stage === stageFilter) &&
    (regionFilter === 'All' || p.region === regionFilter)
  ), [techFilter, stageFilter, regionFilter]);

  const sorted = useMemo(() => [...filtered].sort((a, b) => {
    const av = a[sortCol]; const bv = b[sortCol];
    return sortAsc ? (av > bv ? 1 : -1) : (av < bv ? 1 : -1);
  }), [filtered, sortCol, sortAsc]);

  const n = Math.max(1, filtered.length);
  const totalMw = filtered.reduce((s, p) => s + p.capacityMw, 0);
  const avgPermit = filtered.reduce((s, p) => s + p.permitMonths, 0) / n;
  const avgGrid = filtered.reduce((s, p) => s + p.gridConnMonths, 0) / n;
  const highRiskCount = filtered.filter(p => p.permittingRisk > 70).length;
  const expectedMw = filtered.reduce((s, p) => s + p.capacityMw * p.probability / 100, 0);
  const gridCritical = filtered.filter(p => p.gridRisk === 'Critical').length;

  const byTech = TECHNOLOGIES.map(t => {
    const arr = PROJECTS.filter(p => p.tech === t);
    return { tech: t, count: arr.length, mw: arr.reduce((s, p) => s + p.capacityMw, 0), avgProb: arr.length ? arr.reduce((s, p) => s + p.probability, 0) / arr.length : 0 };
  });

  const stageFlow = STAGES.map(s => ({ stage: s, count: PROJECTS.filter(p => p.stage === s).length, mw: PROJECTS.filter(p => p.stage === s).reduce((ss, p) => ss + p.capacityMw, 0) }));

  const headerStyle = { background: T.sub, padding: '20px 28px 0', borderBottom: `1px solid ${T.border}` };
  const tabStyle = (i) => ({ padding: '8px 16px', marginRight: 4, cursor: 'pointer', borderRadius: '6px 6px 0 0', fontSize: 13, fontWeight: tab === i ? 600 : 400, color: tab === i ? T.navy : T.textSec, background: tab === i ? T.card : 'transparent', border: tab === i ? `1px solid ${T.border}` : '1px solid transparent', borderBottom: tab === i ? `1px solid ${T.card}` : '1px solid transparent', marginBottom: -1 });
  const thStyle = { padding: '8px 12px', fontSize: 11, color: T.textSec, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', cursor: 'pointer', whiteSpace: 'nowrap', background: T.sub };
  const riskColor = r => r === 'Critical' ? T.red : r === 'High' ? T.orange : r === 'Medium' ? T.amber : T.green;

  return (
    <div style={{ fontFamily: "'DM Sans', system-ui, sans-serif", background: T.bg, minHeight: '100vh' }}>
      <div style={{ background: T.navy, padding: '18px 28px', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 11, color: '#94a3b8', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 2 }}>EP-DO3 · Renewable Energy Finance</div>
          <div style={{ fontSize: 20, fontWeight: 700 }}>Renewable Project Pipeline</div>
          <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>Pipeline Tracking · Permitting Risk · Grid Connection · COD Scheduling — 80 Projects · 6 Technologies</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 26, fontWeight: 700, color: T.gold }}>{(totalMw / 1000).toFixed(1)} GW</div>
          <div style={{ fontSize: 11, color: '#94a3b8' }}>Total Pipeline Capacity</div>
        </div>
      </div>

      <div style={{ padding: '16px 28px', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <KpiCard label="Projects" value={`${n}`} sub={`of ${PROJECTS.length} total`} />
        <KpiCard label="Expected MW" value={`${(expectedMw / 1000).toFixed(1)} GW`} sub="Risk-weighted pipeline" color={T.green} />
        <KpiCard label="Avg Permit Time" value={`${avgPermit.toFixed(0)} mo`} sub="Planning to consent" color={T.amber} />
        <KpiCard label="Avg Grid Lead Time" value={`${avgGrid.toFixed(0)} mo`} sub="Connection timeline" color={T.blue} />
        <KpiCard label="High Permit Risk" value={`${highRiskCount}`} sub="Permitting risk > 70%" color={T.red} />
        <KpiCard label="Grid Critical" value={`${gridCritical}`} sub="Critical grid constraints" color={T.orange} />
      </div>

      <div style={{ padding: '0 28px 12px', display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        {[['Technology', TECHNOLOGIES, techFilter, setTechFilter], ['Stage', STAGES, stageFilter, setStageFilter], ['Region', REGIONS, regionFilter, setRegionFilter]].map(([lbl, opts, val, setter]) => (
          <div key={lbl} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 12, color: T.textSec }}>{lbl}:</span>
            <select value={val} onChange={e => setter(e.target.value)} style={{ fontSize: 12, padding: '4px 8px', border: `1px solid ${T.border}`, borderRadius: 6, background: T.card }}>
              <option value="All">All</option>
              {opts.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
        ))}
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
                <div style={{ fontWeight: 700, fontSize: 14, color: T.navy, marginBottom: 14 }}>Pipeline Stage Funnel</div>
                {stageFlow.map(({ stage, count, mw }) => (
                  <div key={stage} style={{ marginBottom: 9 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                      <span style={{ fontSize: 12, color: T.textPri }}>{stage}</span>
                      <span style={{ fontSize: 12, color: T.textSec }}>{count} · {(mw/1000).toFixed(1)} GW</span>
                    </div>
                    <MiniBar value={mw} max={totalMw / STAGES.length * 3} color={T.indigo} />
                  </div>
                ))}
              </div>
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: T.navy, marginBottom: 14 }}>Technology Pipeline (GW)</div>
                {byTech.map(({ tech, count, mw, avgProb }) => (
                  <div key={tech} style={{ marginBottom: 9 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                      <span style={{ fontSize: 12, color: T.textPri }}>{tech}</span>
                      <span style={{ fontSize: 12, color: T.textSec }}>{count} · {(mw/1000).toFixed(1)} GW · {avgProb.toFixed(0)}% prob</span>
                    </div>
                    <MiniBar value={mw} max={Math.max(...byTech.map(b => b.mw))} color={T.sage} />
                  </div>
                ))}
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
              {[['Concept/Scoping',PROJECTS.filter(p=>['Concept','Scoping'].includes(p.stage)).length,T.textSec],['ESIA/Planning',PROJECTS.filter(p=>['ESIA','Planning Application'].includes(p.stage)).length,T.amber],['Consented/Shovel-Ready',PROJECTS.filter(p=>['Consent Granted','Shovel-Ready'].includes(p.stage)).length,T.blue],['Construction/Operational',PROJECTS.filter(p=>['Construction','Operational'].includes(p.stage)).length,T.green]].map(([label, cnt, color]) => (
                <div key={label} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16, textAlign: 'center' }}>
                  <div style={{ fontSize: 28, fontWeight: 700, color }}>{cnt}</div>
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
                  {[['name','Project'],['tech','Technology'],['region','Region'],['stage','Stage'],['capacityMw','MW'],['permitMonths','Permit Mo'],['gridConnMonths','Grid Mo'],['codYear','COD'],['probability','Prob%'],['gridRisk','Grid Risk']].map(([col,lbl]) => (
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
                    <td style={{ padding:'7px 12px',fontSize:11,color:T.textSec }}>{p.tech}</td>
                    <td style={{ padding:'7px 12px',fontSize:11,color:T.textSec }}>{p.region}</td>
                    <td style={{ padding:'7px 12px',fontSize:11 }}>
                      <span style={{ padding:'2px 6px',borderRadius:8,fontSize:10,background:p.stage==='Operational'?'#dcfce7':p.stage==='Construction'?'#dbeafe':p.stage==='Consent Granted'?'#fef9c3':'#f3f4f6',color:p.stage==='Operational'?T.green:p.stage==='Construction'?T.blue:p.stage==='Consent Granted'?T.amber:T.textSec,fontWeight:600 }}>{p.stage}</span>
                    </td>
                    <td style={{ padding:'7px 12px',fontSize:12,fontFamily:T.fontMono,textAlign:'right' }}>{p.capacityMw}</td>
                    <td style={{ padding:'7px 12px',fontSize:12,fontFamily:T.fontMono,textAlign:'right',color:p.permitMonths>30?T.red:T.textSec }}>{p.permitMonths}</td>
                    <td style={{ padding:'7px 12px',fontSize:12,fontFamily:T.fontMono,textAlign:'right',color:p.gridConnMonths>24?T.orange:T.textSec }}>{p.gridConnMonths}</td>
                    <td style={{ padding:'7px 12px',fontSize:12,fontFamily:T.fontMono,textAlign:'right' }}>{p.codYear}</td>
                    <td style={{ padding:'7px 12px',fontSize:12,fontFamily:T.fontMono,textAlign:'right',color:p.probability>=70?T.green:p.probability>=40?T.amber:T.red,fontWeight:700 }}>{p.probability}%</td>
                    <td style={{ padding:'7px 12px',fontSize:11 }}>
                      <span style={{ padding:'2px 8px',borderRadius:10,background:p.gridRisk==='Critical'?'#fee2e2':p.gridRisk==='High'?'#ffedd5':p.gridRisk==='Medium'?'#fef9c3':'#dcfce7',color:riskColor(p.gridRisk),fontWeight:600 }}>{p.gridRisk}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === 2 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20 }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: T.navy, marginBottom: 14 }}>Permitting Risk by Technology</div>
              {TECHNOLOGIES.map(tech => {
                const arr = PROJECTS.filter(p => p.tech === tech);
                const avgPR = arr.length ? arr.reduce((s,p)=>s+p.permittingRisk,0)/arr.length : 0;
                return (
                  <div key={tech} style={{ marginBottom: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                      <span style={{ fontSize: 12, color: T.textPri }}>{tech}</span>
                      <span style={{ fontSize: 12, fontWeight: 700, fontFamily: T.fontMono, color: avgPR > 65 ? T.red : avgPR > 45 ? T.amber : T.green }}>{avgPR.toFixed(0)}/100</span>
                    </div>
                    <MiniBar value={avgPR} max={100} color={avgPR > 65 ? T.red : avgPR > 45 ? T.amber : T.green} />
                  </div>
                );
              })}
              <div style={{ marginTop: 14, padding: 10, background: '#fef2f2', borderRadius: 8, fontSize: 12, color: T.red }}>
                {highRiskCount} projects ({(highRiskCount/PROJECTS.length*100).toFixed(0)}%) carry high permitting risk (score &gt; 70) requiring enhanced engagement strategies.
              </div>
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20 }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: T.navy, marginBottom: 14 }}>Permitting Timeline Analysis</div>
              {TECHNOLOGIES.map(tech => {
                const arr = PROJECTS.filter(p => p.tech === tech);
                const times = [...arr.map(p=>p.permitMonths)].sort((a,b)=>a-b);
                const p50 = times[Math.floor(times.length*0.5)] || 0;
                const p90 = times[Math.floor(times.length*0.9)] || 0;
                return (
                  <div key={tech} style={{ padding: '8px 0', borderBottom: `1px solid ${T.borderL}` }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: T.navy }}>{tech}</div>
                    <div style={{ display: 'flex', gap: 16, fontSize: 12, marginTop: 3 }}>
                      <span>P50: <b style={{ fontFamily: T.fontMono, color: T.blue }}>{p50}mo</b></span>
                      <span>P90: <b style={{ fontFamily: T.fontMono, color: T.orange }}>{p90}mo</b></span>
                      <span>Range: <b style={{ fontFamily: T.fontMono, color: T.textSec }}>{times[0]}–{times[times.length-1]}mo</b></span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {tab === 3 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20 }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: T.navy, marginBottom: 14 }}>Grid Risk Distribution</div>
              {GRID_RISKS.map(risk => {
                const cnt = PROJECTS.filter(p => p.gridRisk === risk).length;
                const mwRisk = PROJECTS.filter(p => p.gridRisk === risk).reduce((s, p) => s + p.capacityMw, 0);
                return (
                  <div key={risk} style={{ marginBottom: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: riskColor(risk) }}>{risk}</span>
                      <span style={{ fontSize: 12, color: T.textSec }}>{cnt} projects · {(mwRisk/1000).toFixed(1)} GW</span>
                    </div>
                    <MiniBar value={cnt} max={30} color={riskColor(risk)} />
                  </div>
                );
              })}
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20 }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: T.navy, marginBottom: 14 }}>Grid Connection Key Metrics</div>
              {[
                { metric: 'Avg Lead Time', value: `${avgGrid.toFixed(0)} months`, color: T.blue },
                { metric: 'Grid-Ready Projects', value: `${PROJECTS.filter(p=>p.gridRisk==='Low').length}`, color: T.green },
                { metric: 'Critical Constraint', value: `${gridCritical}`, color: T.red },
                { metric: 'Avg Grid Capacity %', value: `${(PROJECTS.reduce((s,p)=>s+p.gridCapacity,0)/PROJECTS.length).toFixed(0)}%`, color: T.amber },
                { metric: 'Avg Grid Lead Cost', value: '$0.8–2.4M/MW', color: T.indigo },
                { metric: 'Battery Hybrid Projects', value: `${PROJECTS.filter(p=>p.tech==='Battery Storage').length}`, color: T.purple },
              ].map(({ metric, value, color }) => (
                <div key={metric} style={{ padding: '8px 0', borderBottom: `1px solid ${T.borderL}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 12, color: T.textPri }}>{metric}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color, fontFamily: T.fontMono }}>{value}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 4 && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: 12, marginBottom: 20 }}>
              {Array.from({ length: 6 }, (_, y) => 2025 + y).map(yr => {
                const arr = PROJECTS.filter(p => p.codYear === yr);
                const mw = arr.reduce((s, p) => s + p.capacityMw, 0);
                return (
                  <div key={yr} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16, textAlign: 'center' }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: T.navy }}>{yr}</div>
                    <div style={{ fontSize: 20, fontWeight: 700, color: T.indigo, fontFamily: T.fontMono }}>{(mw/1000).toFixed(1)}</div>
                    <div style={{ fontSize: 10, color: T.textSec }}>GW COD</div>
                    <div style={{ fontSize: 11, color: T.textSec, marginTop: 2 }}>{arr.length} projects</div>
                  </div>
                );
              })}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: T.navy, marginBottom: 14 }}>Cumulative COD by Technology (GW)</div>
                {TECHNOLOGIES.map(tech => {
                  const cumMw = PROJECTS.filter(p => p.tech === tech).reduce((s, p) => s + p.capacityMw, 0) / 1000;
                  return (
                    <div key={tech} style={{ marginBottom: 9 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                        <span style={{ fontSize: 12, color: T.textPri }}>{tech}</span>
                        <span style={{ fontSize: 12, fontWeight: 700, fontFamily: T.fontMono, color: T.navy }}>{cumMw.toFixed(1)} GW</span>
                      </div>
                      <MiniBar value={cumMw} max={15} color={T.teal} />
                    </div>
                  );
                })}
              </div>
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: T.navy, marginBottom: 14 }}>COD Risk Factors</div>
                {[
                  { factor: 'Permitting delays', impact: 'High', pct: '38%' },
                  { factor: 'Grid connection queue', impact: 'High', pct: '29%' },
                  { factor: 'Supply chain constraints', impact: 'Medium', pct: '18%' },
                  { factor: 'Financing not secured', impact: 'Medium', pct: '24%' },
                  { factor: 'Environmental challenges', impact: 'Low', pct: '12%' },
                  { factor: 'Land rights disputes', impact: 'Medium', pct: '15%' },
                ].map(({ factor, impact, pct }) => (
                  <div key={factor} style={{ padding: '7px 0', borderBottom: `1px solid ${T.borderL}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 12, color: T.textPri }}>{factor}</span>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <span style={{ fontSize: 11, padding: '1px 6px', borderRadius: 8, background: impact === 'High' ? '#fee2e2' : impact === 'Medium' ? '#fef9c3' : '#dcfce7', color: impact === 'High' ? T.red : impact === 'Medium' ? T.amber : T.green }}>{impact}</span>
                        <span style={{ fontSize: 12, fontWeight: 700, fontFamily: T.fontMono, color: T.navy }}>{pct}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {tab === 5 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 20 }}>
            {TECHNOLOGIES.map(tech => {
              const arr = PROJECTS.filter(p => p.tech === tech);
              const n2 = Math.max(1, arr.length);
              const avgProb = arr.reduce((s,p)=>s+p.probability,0)/n2;
              const totalMw2 = arr.reduce((s,p)=>s+p.capacityMw,0);
              const expMw = arr.reduce((s,p)=>s+p.capacityMw*p.probability/100,0);
              const stageMap = STAGES.reduce((acc, s) => { acc[s] = arr.filter(p=>p.stage===s).length; return acc; }, {});
              const colors = { 'Solar PV': T.gold, 'Wind Onshore': T.sage, 'Wind Offshore': T.blue, 'Battery Storage': T.purple, 'Green Hydrogen': T.teal, 'Biomass': T.orange };
              return (
                <div key={tech} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: colors[tech] || T.navy, marginBottom: 10 }}>{tech}</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
                    {[['Projects', arr.length],['Pipeline GW',`${(totalMw2/1000).toFixed(1)}`],['Expected GW',`${(expMw/1000).toFixed(1)}`],['Avg Probability',`${avgProb.toFixed(0)}%`]].map(([k,v]) => (
                      <div key={k} style={{ background: T.sub, borderRadius: 6, padding: '8px 10px' }}>
                        <div style={{ fontSize: 10, color: T.textSec }}>{k}</div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: T.navy, fontFamily: T.fontMono }}>{v}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ fontSize: 11, color: T.textSec, marginBottom: 4 }}>Stage distribution:</div>
                  {Object.entries(stageMap).filter(([,c])=>c>0).map(([s,c]) => (
                    <div key={s} style={{ fontSize: 11, color: T.textSec, display: 'flex', justifyContent: 'space-between', padding: '2px 0' }}>
                      <span>{s}</span><span style={{ fontFamily: T.fontMono, fontWeight: 600 }}>{c}</span>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        )}

        {tab === 6 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 16 }}>
            {REGIONS.map(region => {
              const arr = PROJECTS.filter(p => p.region === region);
              const n2 = Math.max(1, arr.length);
              const mw = arr.reduce((s,p)=>s+p.capacityMw,0);
              const avgProb = arr.reduce((s,p)=>s+p.probability,0)/n2;
              const avgPermit2 = arr.reduce((s,p)=>s+p.permitMonths,0)/n2;
              return (
                <div key={region} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 18 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: T.navy, marginBottom: 10 }}>{region}</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
                    {[['Projects', arr.length],['GW',`${(mw/1000).toFixed(1)}`],['Avg Prob',`${avgProb.toFixed(0)}%`],['Permit',`${avgPermit2.toFixed(0)}mo`],['High Risk',arr.filter(p=>p.permittingRisk>70).length],['Grid Crit',arr.filter(p=>p.gridRisk==='Critical').length]].map(([k,v]) => (
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

        {tab === 7 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20 }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: T.navy, marginBottom: 14 }}>Risk Matrix — Top 20 Projects by MW</div>
              {sorted.slice(0,20).map(p => (
                <div key={p.id} style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: 8, padding: '6px 0', borderBottom: `1px solid ${T.borderL}`, alignItems: 'center' }}>
                  <span style={{ fontSize: 11, color: T.navy, fontWeight: 500 }}>{p.name.slice(0, 22)}</span>
                  <span style={{ fontSize: 11, fontFamily: T.fontMono, color: p.permittingRisk > 70 ? T.red : T.amber }}>{p.permittingRisk}</span>
                  <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 8, background: p.gridRisk === 'Critical' ? '#fee2e2' : p.gridRisk === 'High' ? '#ffedd5' : '#fef9c3', color: riskColor(p.gridRisk) }}>{p.gridRisk}</span>
                </div>
              ))}
            </div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20 }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: T.navy, marginBottom: 14 }}>Portfolio Risk Summary</div>
              {[
                { category: 'Permitting Risk > 80', count: PROJECTS.filter(p=>p.permittingRisk>80).length, color: T.red },
                { category: 'Permitting Risk 60–80', count: PROJECTS.filter(p=>p.permittingRisk>=60&&p.permittingRisk<=80).length, color: T.orange },
                { category: 'Permitting Risk < 60', count: PROJECTS.filter(p=>p.permittingRisk<60).length, color: T.green },
                { category: 'Grid Risk: Critical', count: PROJECTS.filter(p=>p.gridRisk==='Critical').length, color: T.red },
                { category: 'Grid Risk: High', count: PROJECTS.filter(p=>p.gridRisk==='High').length, color: T.orange },
                { category: 'Probability < 40%', count: PROJECTS.filter(p=>p.probability<40).length, color: T.amber },
                { category: 'COD 2025–2026', count: PROJECTS.filter(p=>p.codYear<=2026).length, color: T.blue },
              ].map(({ category, count, color }) => (
                <div key={category} style={{ padding: '8px 0', borderBottom: `1px solid ${T.borderL}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 12, color: T.textPri }}>{category}</span>
                    <span style={{ fontSize: 16, fontWeight: 700, color, fontFamily: T.fontMono }}>{count}</span>
                  </div>
                  <div style={{ marginTop: 4 }}><MiniBar value={count} max={30} color={color} /></div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
