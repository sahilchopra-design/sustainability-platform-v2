import React, { useState } from 'react';
import { BarChart, Bar, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LineChart, Line, AreaChart, Area } from 'recharts';

const T={bg:'#f6f4f0',surface:'#ffffff',surfaceH:'#f0ede7',border:'#e5e0d8',borderL:'#d5cfc5',navy:'#1b3a5c',navyL:'#2c5a8c',gold:'#c5a96a',goldL:'#d4be8a',sage:'#5a8a6a',sageL:'#7ba67d',teal:'#5a8a6a',text:'#1b3a5c',textSec:'#5c6b7e',textMut:'#9aa3ae',red:'#dc2626',green:'#16a34a',amber:'#d97706',font:"'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"};
const BLUE = '#0ea5e9';
const tip = { contentStyle:{ background:T.surface, border:'1px solid '+T.border, borderRadius:8, color:T.text }, labelStyle:{ color:T.textSec } };
const sr = s => { let x = Math.sin(s+1)*10000; return x - Math.floor(x); };

const stressIndexData = Array.from({length:24}, (_,i) => ({ month:`M${i+1}`, index: +(55 + sr(i*3)*30).toFixed(1) }));

const basinOverviewData = [
  { basin:'Colorado',        score:4.8, pop:35,  gdp:820,  trend:'▲' },
  { basin:'Indus',           score:4.6, pop:300, gdp:1200, trend:'▲' },
  { basin:'Yellow River',    score:4.3, pop:420, gdp:950,  trend:'▼' },
  { basin:'Ganges',          score:4.1, pop:500, gdp:780,  trend:'▲' },
  { basin:'Nile',            score:3.9, pop:280, gdp:430,  trend:'▲' },
  { basin:'Murray-Darling',  score:3.5, pop:12,  gdp:340,  trend:'▼' },
  { basin:'Tigris-Euphrates',score:4.5, pop:95,  gdp:610,  trend:'▲' },
  { basin:'Rhine',           score:2.8, pop:58,  gdp:1100, trend:'▼' },
];

const basinDetailData = [
  { name:'Colorado',         stress:'Extreme', withdrawal:92, recharge:48, deficit:18.2, sectors:'Agri, Urban, Power'   },
  { name:'Indus',            stress:'Extreme', withdrawal:95, recharge:50, deficit:62.4, sectors:'Agri, Textile, Food'  },
  { name:'Yellow River',     stress:'Extreme', withdrawal:88, recharge:55, deficit:24.1, sectors:'Agri, Industry'       },
  { name:'Ganges',           stress:'High',    withdrawal:82, recharge:60, deficit:40.6, sectors:'Agri, Municipal'      },
  { name:'Nile',             stress:'High',    withdrawal:80, recharge:52, deficit:33.5, sectors:'Agri, Hydro'          },
  { name:'Murray-Darling',   stress:'High',    withdrawal:75, recharge:58, deficit:8.9,  sectors:'Agri, Mining'         },
  { name:'Tigris-Euphrates', stress:'Extreme', withdrawal:90, recharge:46, deficit:29.7, sectors:'Agri, Oil & Gas'      },
  { name:'Rhine',            stress:'Medium',  withdrawal:62, recharge:70, deficit:3.1,  sectors:'Industry, Municipal'  },
  { name:'Mekong',           stress:'Medium',  withdrawal:58, recharge:72, deficit:5.4,  sectors:'Agri, Fisheries'      },
  { name:'São Francisco',    stress:'Low',     withdrawal:44, recharge:80, deficit:1.2,  sectors:'Agri, Hydro'          },
];

const basinChartData = basinDetailData.map(b => ({ name: b.name.replace(' ','\n'), score: b.withdrawal - b.recharge + (b.stress==='Extreme'?50:b.stress==='High'?35:b.stress==='Medium'?20:5) }));

const sectorData = [
  { sector:'Semiconductors', intensity:12400, basins:18, highStress:72, waterCost:3.2, cdp:'A' },
  { sector:'Food & Beverage',intensity:8900,  basins:24, highStress:65, waterCost:2.8, cdp:'A-'},
  { sector:'Textiles',       intensity:7200,  basins:20, highStress:78, waterCost:4.1, cdp:'B' },
  { sector:'Chemicals',      intensity:5600,  basins:15, highStress:55, waterCost:2.1, cdp:'B' },
  { sector:'Mining',         intensity:4800,  basins:22, highStress:60, waterCost:1.9, cdp:'B-'},
  { sector:'Paper & Pulp',   intensity:4200,  basins:12, highStress:48, waterCost:1.6, cdp:'C' },
  { sector:'Oil & Gas',      intensity:3100,  basins:19, highStress:52, waterCost:1.2, cdp:'C' },
  { sector:'Utilities',      intensity:2800,  basins:10, highStress:40, waterCost:0.9, cdp:'B+'},
];

const physicalRisksData = [
  { type:'Drought',                prob:'Very High', impact:1840, regions:'SW USA, MENA, Sub-Saharan Africa'   },
  { type:'Flooding',               prob:'High',      impact:980,  regions:'S & SE Asia, W Africa, Coastal EU' },
  { type:'Glacial Retreat',        prob:'Certain',   impact:620,  regions:'Himalayas, Andes, Alps'             },
  { type:'Groundwater Depletion',  prob:'Very High', impact:1200, regions:'India, N China, Central US'         },
  { type:'Saltwater Intrusion',    prob:'High',      impact:540,  regions:'Low-lying deltas, SIDS, Coastal'    },
  { type:'Extreme Precipitation',  prob:'High',      impact:760,  regions:'Monsoon Asia, C America, S Europe'  },
];

const transitionRisks = [
  { risk:'Water Pricing Reform',   timeline:'2025–2028', exposure:'High',   detail:'Cost of water could rise 3–5× in stressed basins, raising OPEX materially for water-intensive sectors.' },
  { risk:'Discharge Regulations',  timeline:'2026–2030', exposure:'Medium', detail:'Stricter effluent standards in EU, India, and China will require capex upgrades for treatment infrastructure.' },
  { risk:'Efficiency Mandates',    timeline:'2024–2027', exposure:'Medium', detail:'Mandatory water-use efficiency targets for industry in 40+ jurisdictions; non-compliance risks operational permits.' },
  { risk:'Riparian Rights',        timeline:'2027–2035', exposure:'High',   detail:'Cross-border water treaties under revision; operations in contested basins face supply curtailment risk.' },
];

const droughtIndexData = Array.from({length:24}, (_,i) => ({ month:`M${i+1}`, drought: +(30 + sr(i*7+5)*50).toFixed(1) }));

const frameworksData = [
  { name:'CDP Water Security',      adoption:68, mandatory:false, metric:'Water withdrawal & risk disclosure', year:2010, desc:'Voluntary global disclosure system; 4,900+ companies respond annually.' },
  { name:'TCFD Water Addendum',     adoption:42, mandatory:false, metric:'Climate-related water scenario analysis', year:2022, desc:'Extension of TCFD recommendations to cover physical and transition water risk.' },
  { name:'EU Water Framework Dir.', adoption:85, mandatory:true,  metric:'Good ecological status by 2027', year:2000, desc:'Mandatory for all EU member states; sets binding water quality and quantity standards.' },
  { name:'UN SDG 6',                adoption:100,mandatory:false, metric:'Universal access to clean water & sanitation', year:2015, desc:'Global development goal; 193 nations committed; progress tracked via UN-Water.' },
  { name:'GRI 303: Water',          adoption:55, mandatory:false, metric:'Water withdrawal, discharge, consumption', year:2018, desc:'Global Reporting Initiative standard for water-related disclosures in sustainability reports.' },
  { name:'SASB Water Standards',    adoption:38, mandatory:false, metric:'Industry-specific water metrics (77 sectors)', year:2018, desc:'Sector-specific metrics covering water intensity, recycled water and stress-area exposure.' },
];

const TABS = ['Overview','Basin Risk Map','Corporate Exposure','Physical & Transition Risk','Regulatory & Reporting'];

function StatCard({ label, value }) {
  return (
    <div style={{ background:T.navy, border:`1px solid ${T.border}`, borderRadius:10, padding:'18px 20px', flex:1, minWidth:160 }}>
      <div style={{ color:BLUE, fontSize:22, fontWeight:700 }}>{value}</div>
      <div style={{ color:T.textSec, fontSize:12, marginTop:4 }}>{label}</div>
    </div>
  );
}

function stressColor(score) { return score >= 4 ? T.red : score >= 2.5 ? T.amber : T.green; }
function probBadge(p) { const c = p==='Certain'||p==='Very High' ? T.red : p==='High' ? T.amber : T.green; return <span style={{ background:c+'22', color:c, borderRadius:4, padding:'2px 8px', fontSize:11, fontWeight:600 }}>{p}</span>; }
function expBadge(e) { const c = e==='High' ? T.red : e==='Medium' ? T.amber : T.green; return <span style={{ background:c+'22', color:c, borderRadius:4, padding:'2px 8px', fontSize:11, fontWeight:600 }}>{e}</span>; }

export default function WaterRiskAnalyticsPage() {
  const [tab, setTab] = useState(0);

  return (
    <div style={{ background:T.bg, minHeight:'100vh', fontFamily:T.font, color:T.text, padding:24 }}>
      <div style={{ marginBottom:20 }}>
        <div style={{ fontSize:22, fontWeight:700, color:T.text }}>Water Risk & Scarcity Analytics</div>
        <div style={{ color:T.textSec, fontSize:13, marginTop:4 }}>EP-AC2 · Aqueduct-aligned basin stress, corporate exposure, physical & regulatory risk</div>
      </div>

      {/* Tab bar */}
      <div style={{ display:'flex', gap:4, borderBottom:`1px solid ${T.border}`, marginBottom:24 }}>
        {TABS.map((t,i) => (
          <button key={t} onClick={() => setTab(i)} style={{ background:'none', border:'none', cursor:'pointer', padding:'10px 16px', fontSize:13, fontWeight:600, color: tab===i ? T.text : T.textSec, borderBottom: tab===i ? `2px solid ${BLUE}` : '2px solid transparent' }}>{t}</button>
        ))}
      </div>

      {/* Tab 1 — Overview */}
      {tab===0 && (
        <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
          <div style={{ display:'flex', gap:14, flexWrap:'wrap' }}>
            <StatCard label="People Water Stressed" value="3.6B" />
            <StatCard label="GDP at Risk" value="$58T" />
            <StatCard label="Supply-Demand Gap 2030" value="40%" />
            <StatCard label="AQUEDUCT Score" value="3.8 / 5" />
          </div>
          <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:10, padding:20 }}>
            <div style={{ fontSize:14, fontWeight:600, marginBottom:14 }}>Key River Basin Risk Snapshot</div>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
              <thead>
                <tr style={{ color:T.textSec }}>
                  {['Basin','Stress Score','Pop. Affected (M)','GDP Exposed ($bn)','Trend'].map(h => (
                    <th key={h} style={{ textAlign:'left', padding:'6px 10px', borderBottom:`1px solid ${T.border}` }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {basinOverviewData.map(r => (
                  <tr key={r.basin} style={{ borderBottom:`1px solid ${T.border}22` }}>
                    <td style={{ padding:'7px 10px', fontWeight:500 }}>{r.basin}</td>
                    <td style={{ padding:'7px 10px', color:stressColor(r.score), fontWeight:600 }}>{r.score}</td>
                    <td style={{ padding:'7px 10px' }}>{r.pop}</td>
                    <td style={{ padding:'7px 10px' }}>{r.gdp.toLocaleString()}</td>
                    <td style={{ padding:'7px 10px', color: r.trend==='▲' ? T.red : T.green }}>{r.trend}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:10, padding:20 }}>
            <div style={{ fontSize:14, fontWeight:600, marginBottom:14 }}>Global Water Stress Index — 24-Month Trend</div>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={stressIndexData} margin={{ top:4, right:16, bottom:0, left:0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="month" tick={{ fill:T.textMut, fontSize:11 }} />
                <YAxis domain={[50,90]} tick={{ fill:T.textMut, fontSize:11 }} />
                <Tooltip {...tip} />
                <Line type="monotone" dataKey="index" stroke={BLUE} strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Tab 2 — Basin Risk Map */}
      {tab===1 && (
        <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
          <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:10, padding:20 }}>
            <div style={{ fontSize:14, fontWeight:600, marginBottom:14 }}>Basin Water Stress Score (Withdrawal vs Recharge)</div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={basinChartData} margin={{ top:4, right:16, bottom:20, left:0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="name" tick={{ fill:T.textMut, fontSize:10 }} interval={0} />
                <YAxis tick={{ fill:T.textMut, fontSize:11 }} />
                <Tooltip {...tip} />
                <Bar dataKey="score" radius={[4,4,0,0]}>
                  {basinChartData.map((d,i) => (
                    <Cell key={i} fill={d.score > 60 ? T.red : d.score > 40 ? T.amber : T.green} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div style={{ display:'flex', gap:16, marginTop:10, fontSize:12 }}>
              <span><span style={{ color:T.red }}>■</span> Extreme (&gt;60)</span>
              <span><span style={{ color:T.amber }}>■</span> High (40–60)</span>
              <span><span style={{ color:T.green }}>■</span> Medium/Low (&lt;40)</span>
            </div>
          </div>
          <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:10, padding:20 }}>
            <div style={{ fontSize:14, fontWeight:600, marginBottom:14 }}>Basin Detail — 10 Major Systems</div>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
              <thead>
                <tr style={{ color:T.textSec }}>
                  {['Basin','Stress Level','Withdrawal %','Recharge %','Deficit (km³/yr)','Key Sectors'].map(h => (
                    <th key={h} style={{ textAlign:'left', padding:'6px 8px', borderBottom:`1px solid ${T.border}` }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {basinDetailData.map(b => {
                  const sc = b.stress==='Extreme' ? T.red : b.stress==='High' ? T.amber : b.stress==='Medium' ? BLUE : T.green;
                  return (
                    <tr key={b.name} style={{ borderBottom:`1px solid ${T.border}22` }}>
                      <td style={{ padding:'7px 8px', fontWeight:500 }}>{b.name}</td>
                      <td style={{ padding:'7px 8px' }}><span style={{ background:sc+'22', color:sc, borderRadius:4, padding:'2px 7px', fontSize:11, fontWeight:600 }}>{b.stress}</span></td>
                      <td style={{ padding:'7px 8px' }}>{b.withdrawal}%</td>
                      <td style={{ padding:'7px 8px' }}>{b.recharge}%</td>
                      <td style={{ padding:'7px 8px', color: b.deficit>20 ? T.red : b.deficit>10 ? T.amber : T.green, fontWeight:600 }}>{b.deficit}</td>
                      <td style={{ padding:'7px 8px', color:T.textSec }}>{b.sectors}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3 — Corporate Exposure */}
      {tab===2 && (
        <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
          <div style={{ display:'flex', gap:14 }}>
            {[['Total Industrial Withdrawal','3,800 km³/yr'],['Agriculture Share','70%'],['Municipal Share','10%']].map(([l,v]) => (
              <div key={l} style={{ background:T.navy, border:`1px solid ${T.border}`, borderRadius:10, padding:'16px 20px', flex:1 }}>
                <div style={{ color:BLUE, fontSize:20, fontWeight:700 }}>{v}</div>
                <div style={{ color:T.textSec, fontSize:12, marginTop:4 }}>{l}</div>
              </div>
            ))}
          </div>
          <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:10, padding:20 }}>
            <div style={{ fontSize:14, fontWeight:600, marginBottom:14 }}>Water Intensity by Sector (m³ / $M Revenue)</div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={sectorData} margin={{ top:4, right:16, bottom:30, left:0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="sector" tick={{ fill:T.textMut, fontSize:10 }} angle={-20} textAnchor="end" interval={0} />
                <YAxis tick={{ fill:T.textMut, fontSize:11 }} />
                <Tooltip {...tip} />
                <Bar dataKey="intensity" radius={[4,4,0,0]}>
                  {sectorData.map((d,i) => (
                    <Cell key={i} fill={d.intensity > 8000 ? T.red : d.intensity > 5000 ? T.amber : BLUE} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:10, padding:20 }}>
            <div style={{ fontSize:14, fontWeight:600, marginBottom:14 }}>Sector Exposure Detail</div>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
              <thead>
                <tr style={{ color:T.textSec }}>
                  {['Sector','Water Intensity (m³/$M)','Basin Exposure','High-Stress %','Water Cost % OPEX','CDP Score'].map(h => (
                    <th key={h} style={{ textAlign:'left', padding:'6px 8px', borderBottom:`1px solid ${T.border}` }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sectorData.map(s => (
                  <tr key={s.sector} style={{ borderBottom:`1px solid ${T.border}22` }}>
                    <td style={{ padding:'7px 8px', fontWeight:500 }}>{s.sector}</td>
                    <td style={{ padding:'7px 8px' }}>{s.intensity.toLocaleString()}</td>
                    <td style={{ padding:'7px 8px' }}>{s.basins}</td>
                    <td style={{ padding:'7px 8px', color: s.highStress>65 ? T.red : s.highStress>50 ? T.amber : T.green }}>{s.highStress}%</td>
                    <td style={{ padding:'7px 8px' }}>{s.waterCost}%</td>
                    <td style={{ padding:'7px 8px', color: s.cdp.startsWith('A') ? T.green : s.cdp.startsWith('B') ? BLUE : T.amber, fontWeight:600 }}>{s.cdp}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4 — Physical & Transition Risk */}
      {tab===3 && (
        <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
          <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:10, padding:20 }}>
            <div style={{ fontSize:14, fontWeight:600, marginBottom:14 }}>Physical Risk Types</div>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
              <thead>
                <tr style={{ color:T.textSec }}>
                  {['Risk Type','Probability','Financial Impact ($bn)','Affected Regions'].map(h => (
                    <th key={h} style={{ textAlign:'left', padding:'6px 10px', borderBottom:`1px solid ${T.border}` }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {physicalRisksData.map(r => (
                  <tr key={r.type} style={{ borderBottom:`1px solid ${T.border}22` }}>
                    <td style={{ padding:'7px 10px', fontWeight:500 }}>{r.type}</td>
                    <td style={{ padding:'7px 10px' }}>{probBadge(r.prob)}</td>
                    <td style={{ padding:'7px 10px', color: r.impact>1000 ? T.red : r.impact>700 ? T.amber : T.text, fontWeight:600 }}>{r.impact.toLocaleString()}</td>
                    <td style={{ padding:'7px 10px', color:T.textSec }}>{r.regions}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:10, padding:20 }}>
            <div style={{ fontSize:14, fontWeight:600, marginBottom:14 }}>Transition Risk Register</div>
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {transitionRisks.map(r => (
                <div key={r.risk} style={{ background:T.bg, border:`1px solid ${T.border}`, borderRadius:8, padding:'12px 16px', display:'flex', gap:16, alignItems:'flex-start' }}>
                  <div style={{ flex:1 }}>
                    <div style={{ fontWeight:600, fontSize:13 }}>{r.risk}</div>
                    <div style={{ color:T.textSec, fontSize:12, marginTop:4 }}>{r.detail}</div>
                  </div>
                  <div style={{ textAlign:'right', minWidth:110 }}>
                    <div style={{ marginBottom:4 }}>{expBadge(r.exposure)}</div>
                    <div style={{ color:T.textMut, fontSize:11 }}>{r.timeline}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:10, padding:20 }}>
            <div style={{ fontSize:14, fontWeight:600, marginBottom:14 }}>Drought Index — 24-Month Trend</div>
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={droughtIndexData} margin={{ top:4, right:16, bottom:0, left:0 }}>
                <defs>
                  <linearGradient id="droughtGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={T.amber} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={T.amber} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="month" tick={{ fill:T.textMut, fontSize:11 }} />
                <YAxis domain={[0,90]} tick={{ fill:T.textMut, fontSize:11 }} />
                <Tooltip {...tip} />
                <Area type="monotone" dataKey="drought" stroke={T.amber} strokeWidth={2} fill="url(#droughtGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Tab 5 — Regulatory & Reporting */}
      {tab===4 && (
        <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
          <div style={{ display:'flex', gap:14 }}>
            {[['Mandatory Reporters','2,847'],['Voluntary Reporters','12,400+'],['Avg Disclosure Score','62 / 100']].map(([l,v]) => (
              <div key={l} style={{ background:T.navy, border:`1px solid ${T.border}`, borderRadius:10, padding:'16px 20px', flex:1 }}>
                <div style={{ color:BLUE, fontSize:20, fontWeight:700 }}>{v}</div>
                <div style={{ color:T.textSec, fontSize:12, marginTop:4 }}>{l}</div>
              </div>
            ))}
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
            {frameworksData.map(f => (
              <div key={f.name} style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:10, padding:18 }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:8 }}>
                  <div style={{ fontWeight:700, fontSize:14, color:T.text }}>{f.name}</div>
                  <span style={{ background: f.mandatory ? T.red+'22' : T.green+'22', color: f.mandatory ? T.red : T.green, borderRadius:4, padding:'2px 8px', fontSize:11, fontWeight:600 }}>
                    {f.mandatory ? 'Mandatory' : 'Voluntary'}
                  </span>
                </div>
                <div style={{ color:T.textSec, fontSize:12, marginBottom:10 }}>{f.desc}</div>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', fontSize:12 }}>
                  <div>
                    <span style={{ color:T.textMut }}>Key metric: </span>
                    <span style={{ color:T.text }}>{f.metric}</span>
                  </div>
                </div>
                <div style={{ marginTop:10 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                    <span style={{ color:T.textSec, fontSize:11 }}>Adoption Rate</span>
                    <span style={{ color:BLUE, fontWeight:600, fontSize:11 }}>{f.adoption}%</span>
                  </div>
                  <div style={{ background:T.border, borderRadius:4, height:5 }}>
                    <div style={{ background:BLUE, borderRadius:4, height:5, width:`${f.adoption}%` }} />
                  </div>
                </div>
                <div style={{ color:T.textMut, fontSize:11, marginTop:8 }}>Est. {f.year}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
