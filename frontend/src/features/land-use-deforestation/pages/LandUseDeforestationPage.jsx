import React, { useState } from 'react';
import { AreaChart, Area, BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const T={bg:'#f6f4f0',surface:'#ffffff',surfaceH:'#f0ede7',border:'#e5e0d8',borderL:'#d5cfc5',navy:'#1b3a5c',navyL:'#2c5a8c',gold:'#c5a96a',goldL:'#d4be8a',sage:'#5a8a6a',sageL:'#7ba67d',teal:'#5a8a6a',text:'#1b3a5c',textSec:'#5c6b7e',textMut:'#9aa3ae',red:'#dc2626',green:'#16a34a',amber:'#d97706',font:"'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"};
const BROWN = '#92400e';
const tip = { contentStyle:{ background:T.surface, border:'1px solid '+T.border, borderRadius:8, color:T.text }, labelStyle:{ color:T.textSec } };
const sr = s => { let x = Math.sin(s+1)*10000; return x - Math.floor(x); };

const TABS = ['Overview','EUDR Compliance','Supply Chain','Carbon & Biodiversity','Regulatory Horizon'];

const HOTSPOTS = [
  { region:'Amazon',       lost:2140, carbon:4.2, driver:'Cattle ranching',   risk:'Critical' },
  { region:'Congo Basin',  lost: 820, carbon:2.1, driver:'Subsistence farming',risk:'High' },
  { region:'Southeast Asia',lost:630, carbon:1.4, driver:'Palm oil expansion', risk:'High' },
  { region:'Gran Chaco',   lost: 410, carbon:0.9, driver:'Soy agriculture',    risk:'High' },
  { region:'Cerrado',      lost: 390, carbon:0.8, driver:'Agribusiness',       risk:'Medium' },
  { region:'Mekong Delta', lost: 210, carbon:0.5, driver:'Rubber/agriculture', risk:'Medium' },
  { region:'Borneo',       lost: 180, carbon:0.4, driver:'Palm oil/logging',   risk:'High' },
];

const FOREST_LOSS = Array.from({length:24}, (_,i) => ({
  month: `M${i+1}`,
  loss: +(280 + sr(i*3)*120 - (i*1.5)).toFixed(1),
}));

const COMMODITIES = [
  { name:'Cattle',   defLink:78, complexity:5, compliance:32, burden:'Very High' },
  { name:'Soy',      defLink:65, complexity:4, compliance:48, burden:'High' },
  { name:'Palm Oil', defLink:72, complexity:4, compliance:55, burden:'High' },
  { name:'Wood',     defLink:45, complexity:3, compliance:71, burden:'Medium' },
  { name:'Cocoa',    defLink:58, complexity:3, compliance:62, burden:'Medium' },
  { name:'Coffee',   defLink:38, complexity:2, compliance:83, burden:'Low' },
  { name:'Rubber',   defLink:42, complexity:3, compliance:44, burden:'Medium' },
];

const COMPANIES = [
  { id:'A', commodity:'Palm Oil',  srcRisk:'High',    trace:38, verified:'No',  eudr:'Not Ready' },
  { id:'B', commodity:'Soy',       srcRisk:'High',    trace:51, verified:'Yes', eudr:'Partial' },
  { id:'C', commodity:'Cocoa',     srcRisk:'Medium',  trace:67, verified:'Yes', eudr:'Partial' },
  { id:'D', commodity:'Cattle',    srcRisk:'Critical',trace:22, verified:'No',  eudr:'Not Ready' },
  { id:'E', commodity:'Wood',      srcRisk:'Medium',  trace:74, verified:'Yes', eudr:'Ready' },
  { id:'F', commodity:'Coffee',    srcRisk:'Low',     trace:88, verified:'Yes', eudr:'Ready' },
  { id:'G', commodity:'Rubber',    srcRisk:'Medium',  trace:45, verified:'No',  eudr:'Partial' },
  { id:'H', commodity:'Palm Oil',  srcRisk:'High',    trace:59, verified:'Yes', eudr:'Partial' },
];

const LAND_TYPES = [
  { type:'Tropical Forest', carbonDensity:280, bioIndex:9.4, areaRisk:210, lossRate:1.8 },
  { type:'Temperate Forest',carbonDensity:140, bioIndex:6.1, areaRisk: 85, lossRate:0.9 },
  { type:'Peatland',        carbonDensity:520, bioIndex:5.8, areaRisk: 42, lossRate:2.3 },
  { type:'Wetland',         carbonDensity:190, bioIndex:8.2, areaRisk: 67, lossRate:1.5 },
  { type:'Savanna',         carbonDensity: 60, bioIndex:7.3, areaRisk:120, lossRate:1.1 },
  { type:'Mangrove',        carbonDensity:310, bioIndex:9.1, areaRisk: 18, lossRate:3.4 },
];

const PEATLAND = Array.from({length:24}, (_,i) => ({
  month:`M${i+1}`,
  drainage: +(1.2 + sr(i*7)*0.8 + i*0.04).toFixed(2),
}));

const REGULATIONS = [
  { name:'EUDR',                   status:'Active',    jurisdiction:'EU',          scope:'7 commodities + derivatives', penalty:'4% EU turnover',    effective:'Dec 2024 / Jun 2025' },
  { name:'UK Forest Risk Commodities', status:'Active', jurisdiction:'UK',         scope:'Forest-risk commodities',     penalty:'£250k+ fines',      effective:'Sep 2024' },
  { name:'US FOREST Act',          status:'Proposed',  jurisdiction:'USA',         scope:'High-risk commodities',       penalty:'Civil liability',   effective:'TBD' },
  { name:'Norway Due Diligence',   status:'Active',    jurisdiction:'Norway',      scope:'Palm oil, soy, cocoa',        penalty:'Regulatory sanction',effective:'2023' },
  { name:'Brazil REDD+',           status:'Active',    jurisdiction:'Brazil',      scope:'Forest carbon credits',       penalty:'Project cancellation',effective:'2022' },
  { name:'OECD Due Diligence',     status:'Guidance',  jurisdiction:'OECD Nations',scope:'Agricultural supply chains',  penalty:'Reputational',      effective:'Ongoing' },
];

const riskColor = r => ({ Critical:T.red, High:T.amber, Medium:T.teal, Low:T.green }[r] || T.textSec);
const eudrColor = e => ({ Ready:T.green, Partial:T.amber, 'Not Ready':T.red }[e] || T.textSec);
const statusColor = s => ({ Active:T.green, Proposed:T.amber, Guidance:T.teal }[s] || T.textSec);

const card = (label, value, sub) => (
  <div key={label} style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:10, padding:'18px 22px', flex:1, minWidth:160 }}>
    <div style={{ color:T.textSec, fontSize:12, marginBottom:6 }}>{label}</div>
    <div style={{ color:T.amber, fontSize:22, fontWeight:700 }}>{value}</div>
    {sub && <div style={{ color:T.textMut, fontSize:11, marginTop:4 }}>{sub}</div>}
  </div>
);

export default function LandUseDeforestationPage() {
  const [tab, setTab] = useState(0);

  return (
    <div style={{ background:T.bg, minHeight:'100vh', color:T.text, fontFamily:T.font, padding:24 }}>
      <div style={{ marginBottom:20 }}>
        <h1 style={{ fontSize:22, fontWeight:700, color:T.text, margin:0 }}>Land Use &amp; Deforestation Intelligence</h1>
        <div style={{ color:T.textSec, fontSize:13, marginTop:4 }}>EP-AC3 — Global forest risk, EUDR compliance and supply chain traceability</div>
      </div>

      {/* Tab bar */}
      <div style={{ display:'flex', gap:4, borderBottom:`1px solid ${T.border}`, marginBottom:24 }}>
        {TABS.map((t,i) => (
          <button key={t} onClick={()=>setTab(i)} style={{ background:'none', border:'none', cursor:'pointer', padding:'10px 16px', fontSize:13, fontWeight:600, color: tab===i ? T.text : T.textSec, borderBottom: tab===i ? `2px solid ${T.amber}` : '2px solid transparent', transition:'all 0.2s' }}>{t}</button>
        ))}
      </div>

      {/* Tab 1 — Overview */}
      {tab===0 && (
        <div>
          <div style={{ display:'flex', gap:14, marginBottom:24, flexWrap:'wrap' }}>
            {card('Forest Lost 2023','4.7M Ha','Global tropical coverage')}
            {card('Annual CO₂ Release','10 Gt','From land-use change')}
            {card('EUDR SME Deadline','Jun 2025','Large operators: Dec 2024')}
            {card('High-Risk Commodities','7','Under EUDR scope')}
          </div>
          <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:10, padding:20, marginBottom:24 }}>
            <div style={{ fontWeight:600, marginBottom:14, color:T.amber }}>Deforestation Hotspots</div>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
              <thead>
                <tr style={{ color:T.textSec, borderBottom:`1px solid ${T.border}` }}>
                  {['Region','Area Lost (kha/yr)','Carbon Impact (MtCO₂)','Primary Driver','Risk Rating'].map(h=>(
                    <th key={h} style={{ textAlign:'left', padding:'6px 10px', fontWeight:600 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {HOTSPOTS.map(r=>(
                  <tr key={r.region} style={{ borderBottom:`1px solid ${T.border}` }}>
                    <td style={{ padding:'8px 10px', fontWeight:600 }}>{r.region}</td>
                    <td style={{ padding:'8px 10px', color:T.amber }}>{r.lost.toLocaleString()}</td>
                    <td style={{ padding:'8px 10px' }}>{r.carbon}</td>
                    <td style={{ padding:'8px 10px', color:T.textSec }}>{r.driver}</td>
                    <td style={{ padding:'8px 10px' }}><span style={{ background:riskColor(r.risk)+'22', color:riskColor(r.risk), borderRadius:4, padding:'2px 8px', fontSize:11, fontWeight:700 }}>{r.risk}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:10, padding:20 }}>
            <div style={{ fontWeight:600, marginBottom:12, color:T.textSec }}>24-Month Global Forest Loss Rate (kha/month)</div>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={FOREST_LOSS}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="month" stroke={T.textMut} tick={{ fontSize:10 }} interval={3} />
                <YAxis stroke={T.textMut} tick={{ fontSize:10 }} />
                <Tooltip {...tip} />
                <Area type="monotone" dataKey="loss" stroke={T.amber} fill={T.amber+'33'} strokeWidth={2} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Tab 2 — EUDR Compliance */}
      {tab===1 && (
        <div>
          <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:10, padding:20, marginBottom:20 }}>
            <div style={{ fontWeight:600, color:T.amber, marginBottom:4 }}>EU Deforestation Regulation (2023/1115)</div>
            <div style={{ color:T.textSec, fontSize:13, marginBottom:16 }}>Effective Dec 2024 (large operators) / Jun 2025 (SMEs). Penalty: up to 4% of EU annual turnover.</div>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
              <thead>
                <tr style={{ color:T.textSec, borderBottom:`1px solid ${T.border}` }}>
                  {['Commodity','Deforestation Link %','Supply Chain Complexity','EUDR Compliance %','Due Diligence Burden'].map(h=>(
                    <th key={h} style={{ textAlign:'left', padding:'6px 10px', fontWeight:600 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {COMMODITIES.map(c=>(
                  <tr key={c.name} style={{ borderBottom:`1px solid ${T.border}` }}>
                    <td style={{ padding:'8px 10px', fontWeight:600 }}>{c.name}</td>
                    <td style={{ padding:'8px 10px', color:T.red }}>{c.defLink}%</td>
                    <td style={{ padding:'8px 10px' }}>{'★'.repeat(c.complexity)}<span style={{ color:T.textMut }}>{'★'.repeat(5-c.complexity)}</span></td>
                    <td style={{ padding:'8px 10px', color: c.compliance>80?T.green:c.compliance>50?T.amber:T.red, fontWeight:700 }}>{c.compliance}%</td>
                    <td style={{ padding:'8px 10px', color:T.textSec }}>{c.burden}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:10, padding:20 }}>
            <div style={{ fontWeight:600, marginBottom:12, color:T.textSec }}>EUDR Compliance % by Commodity</div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={COMMODITIES} margin={{ top:4, right:16, left:0, bottom:4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="name" stroke={T.textMut} tick={{ fontSize:11 }} />
                <YAxis stroke={T.textMut} tick={{ fontSize:11 }} domain={[0,100]} />
                <Tooltip {...tip} />
                <Bar dataKey="compliance" name="Compliance %" radius={[4,4,0,0]}>
                  {COMMODITIES.map((c,i) => (
                    <Cell key={i} fill={c.compliance>80?T.green:c.compliance>50?T.amber:T.red} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Tab 3 — Supply Chain Traceability */}
      {tab===2 && (
        <div>
          <div style={{ display:'flex', gap:14, marginBottom:20, flexWrap:'wrap' }}>
            {card('Avg Traceability','54%','Across monitored companies')}
            {card('Verified Suppliers','38%','Third-party certified')}
            {card('Satellite Coverage','71%','Active monitoring areas')}
          </div>
          <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:10, padding:20 }}>
            <div style={{ fontWeight:600, color:T.amber, marginBottom:14 }}>Company Supply Chain Traceability</div>
            {COMPANIES.map(c => (
              <div key={c.id} style={{ borderBottom:`1px solid ${T.border}`, padding:'12px 0', display:'flex', alignItems:'center', gap:16, flexWrap:'wrap' }}>
                <div style={{ width:80, fontWeight:700, color:T.text }}>Company {c.id}</div>
                <div style={{ width:90, color:T.textSec, fontSize:12 }}>{c.commodity}</div>
                <div style={{ width:80 }}><span style={{ background:riskColor(c.srcRisk)+'22', color:riskColor(c.srcRisk), borderRadius:4, padding:'2px 8px', fontSize:11, fontWeight:700 }}>{c.srcRisk}</span></div>
                <div style={{ flex:1, minWidth:120 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, marginBottom:3 }}>
                    <span style={{ color:T.textSec }}>Traceability</span>
                    <span style={{ color: c.trace>=70?T.green:c.trace>=50?T.amber:T.red, fontWeight:700 }}>{c.trace}%</span>
                  </div>
                  <div style={{ background:T.border, borderRadius:4, height:6 }}>
                    <div style={{ width:`${c.trace}%`, background: c.trace>=70?T.green:c.trace>=50?T.amber:T.red, borderRadius:4, height:'100%', transition:'width 0.4s' }} />
                  </div>
                </div>
                <div style={{ width:60, fontSize:12, color: c.verified==='Yes'?T.green:T.red, fontWeight:700 }}>{c.verified==='Yes'?'Verified':'Unverified'}</div>
                <div style={{ width:90 }}><span style={{ background:eudrColor(c.eudr)+'22', color:eudrColor(c.eudr), borderRadius:4, padding:'2px 8px', fontSize:11, fontWeight:700 }}>{c.eudr}</span></div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4 — Carbon & Biodiversity Impact */}
      {tab===3 && (
        <div>
          <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:10, padding:20, marginBottom:20 }}>
            <div style={{ fontWeight:600, color:T.amber, marginBottom:14 }}>Land-Use Carbon &amp; Biodiversity Metrics</div>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
              <thead>
                <tr style={{ color:T.textSec, borderBottom:`1px solid ${T.border}` }}>
                  {['Land-Use Type','Carbon Density (tC/ha)','Biodiversity Index','Area at Risk (Mha)','Annual Loss Rate %'].map(h=>(
                    <th key={h} style={{ textAlign:'left', padding:'6px 10px', fontWeight:600 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {LAND_TYPES.map(l=>(
                  <tr key={l.type} style={{ borderBottom:`1px solid ${T.border}` }}>
                    <td style={{ padding:'8px 10px', fontWeight:600 }}>{l.type}</td>
                    <td style={{ padding:'8px 10px', color:T.amber, fontWeight:700 }}>{l.carbonDensity}</td>
                    <td style={{ padding:'8px 10px', color:T.teal }}>{l.bioIndex}</td>
                    <td style={{ padding:'8px 10px' }}>{l.areaRisk}</td>
                    <td style={{ padding:'8px 10px', color: l.lossRate>2?T.red:l.lossRate>1?T.amber:T.green, fontWeight:700 }}>{l.lossRate}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ display:'flex', gap:16, flexWrap:'wrap' }}>
            <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:10, padding:20, flex:1, minWidth:300 }}>
              <div style={{ fontWeight:600, marginBottom:12, color:T.textSec }}>Carbon Density by Land-Use Type (tC/ha)</div>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={LAND_TYPES} margin={{ top:4, right:8, left:0, bottom:4 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="type" stroke={T.textMut} tick={{ fontSize:9 }} />
                  <YAxis stroke={T.textMut} tick={{ fontSize:10 }} />
                  <Tooltip {...tip} />
                  <Bar dataKey="carbonDensity" name="tC/ha" radius={[4,4,0,0]}>
                    {LAND_TYPES.map((_,i) => (
                      <Cell key={i} fill={[T.green,T.teal,T.amber,T.teal,T.sage,T.green][i]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:10, padding:20, flex:1, minWidth:300 }}>
              <div style={{ fontWeight:600, marginBottom:12, color:T.textSec }}>24-Month Peatland Drainage Trend (Mha/yr)</div>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={PEATLAND}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="month" stroke={T.textMut} tick={{ fontSize:10 }} interval={4} />
                  <YAxis stroke={T.textMut} tick={{ fontSize:10 }} />
                  <Tooltip {...tip} />
                  <Area type="monotone" dataKey="drainage" stroke={T.red} fill={T.red+'33'} strokeWidth={2} dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Tab 5 — Regulatory Horizon */}
      {tab===4 && (
        <div>
          <div style={{ display:'flex', gap:14, marginBottom:20, flexWrap:'wrap' }}>
            {card('Active Jurisdictions','12+','G20 + EU implementing')}
            {card('Commodities Covered','7+','Under major regulations')}
            {card('Trade Value Affected','$1.2T','Estimated annual scope')}
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(320px,1fr))', gap:16 }}>
            {REGULATIONS.map(r => (
              <div key={r.name} style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:10, padding:20 }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10 }}>
                  <div style={{ fontWeight:700, fontSize:15 }}>{r.name}</div>
                  <span style={{ background:statusColor(r.status)+'22', color:statusColor(r.status), borderRadius:4, padding:'2px 8px', fontSize:11, fontWeight:700 }}>{r.status}</span>
                </div>
                <div style={{ fontSize:12, color:T.textSec, marginBottom:6 }}>
                  <span style={{ color:T.amber, fontWeight:600 }}>Jurisdiction: </span>{r.jurisdiction}
                </div>
                <div style={{ fontSize:12, color:T.textSec, marginBottom:6 }}>
                  <span style={{ color:T.text, fontWeight:600 }}>Scope: </span>{r.scope}
                </div>
                <div style={{ fontSize:12, color:T.textSec, marginBottom:6 }}>
                  <span style={{ color:T.red, fontWeight:600 }}>Penalty: </span>{r.penalty}
                </div>
                <div style={{ fontSize:12, color:T.textMut }}>
                  <span style={{ color:T.teal, fontWeight:600 }}>Effective: </span>{r.effective}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
