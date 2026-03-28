import React, { useState } from 'react';
import { AreaChart, Area, BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const T = {
  bg:'#f6f4f0', surface:'#ffffff', surfaceH:'#f0ede7',
  border:'#e5e0d8', borderL:'#d5cfc5',
  navy:'#1b3a5c', navyL:'#2c5a8c',
  gold:'#c5a96a', goldL:'#d4be8a',
  sage:'#5a8a6a', sageL:'#7ba67d', teal:'#5a8a6a',
  text:'#1b3a5c', textSec:'#5c6b7e', textMut:'#9aa3ae',
  red:'#dc2626', green:'#16a34a', amber:'#d97706',
  card:'0 1px 4px rgba(27,58,92,0.06)',
  cardH:'0 4px 16px rgba(27,58,92,0.1)',
  font:"'Inter','SF Pro Display',system-ui,-apple-system,sans-serif",
};
const tip = { contentStyle:{ background:T.surface, border:'1px solid '+T.border, borderRadius:8, color:T.text }, labelStyle:{ color:T.textSec } };
const sr = s => { let x = Math.sin(s+1)*10000; return x - Math.floor(x); };

const materialLoops = [
  { name:'Plastics',       circ:9.4,  recovVal:180, waste:380, euTarget:55 },
  { name:'Metals',         circ:38.2, recovVal:520, waste:210, euTarget:70 },
  { name:'Electronics',    circ:17.4, recovVal:310, waste:54,  euTarget:65 },
  { name:'Textiles',       circ:12.6, recovVal:95,  waste:92,  euTarget:50 },
  { name:'Construction',   circ:42.1, recovVal:440, waste:850, euTarget:70 },
  { name:'Food/Organics',  circ:6.8,  recovVal:70,  waste:930, euTarget:55 },
  { name:'Packaging',      circ:28.3, recovVal:260, waste:170, euTarget:75 },
];

const circTrend = Array.from({ length:24 }, (_, i) => ({
  month: `M${i+1}`,
  rate: +(7 + sr(i*3) * 5).toFixed(2),
}));

const materialFlows = [
  { mat:'Steel',     virgin:1870, recycled:65, eol:82, premium:12 },
  { mat:'Aluminium', virgin:65,   recycled:73, eol:76, premium:28 },
  { mat:'Copper',    virgin:20,   recycled:42, eol:68, premium:35 },
  { mat:'Plastic',   virgin:370,  recycled:9,  eol:19, premium:8  },
  { mat:'Glass',     virgin:130,  recycled:35, eol:46, premium:5  },
  { mat:'Paper',     virgin:420,  recycled:58, eol:72, premium:3  },
  { mat:'Cobalt',    virgin:0.17, recycled:32, eol:55, premium:88 },
  { mat:'Lithium',   virgin:0.10, recycled:11, eol:38, premium:62 },
];

const companies = [
  { co:'Renault',       circRev:31, takeBack:'Y', recycIn:48, landfill:4,  score:78 },
  { co:'Unilever',      circRev:24, takeBack:'Y', recycIn:55, landfill:2,  score:82 },
  { co:'Apple',         circRev:18, takeBack:'Y', recycIn:22, landfill:1,  score:69 },
  { co:'IKEA',          circRev:42, takeBack:'Y', recycIn:60, landfill:3,  score:88 },
  { co:'H&M',           circRev:12, takeBack:'Y', recycIn:18, landfill:9,  score:54 },
  { co:'LafargeHolcim', circRev:26, takeBack:'N', recycIn:36, landfill:15, score:61 },
  { co:'Philips',       circRev:38, takeBack:'Y', recycIn:44, landfill:2,  score:85 },
  { co:'Nestlé',        circRev:16, takeBack:'N', recycIn:29, landfill:7,  score:58 },
];

const ceapChecklist = [
  { item:'Circular product design requirements',       met:true  },
  { item:'EPR scheme participation',                   met:true  },
  { item:'Recycled content disclosure',                met:true  },
  { item:'Waste-to-landfill targets set',              met:true  },
  { item:'Take-back scheme operational',               met:false },
  { item:'Circular economy transition plan published', met:false },
];

const plasticTypes = [
  { type:'PET',  prod:70,  recScore:8, oceanRisk:22, eprCov:68 },
  { type:'HDPE', prod:52,  recScore:7, oceanRisk:18, eprCov:55 },
  { type:'PVC',  prod:43,  recScore:3, oceanRisk:35, eprCov:30 },
  { type:'LDPE', prod:38,  recScore:4, oceanRisk:42, eprCov:28 },
  { type:'PP',   prod:68,  recScore:6, oceanRisk:28, eprCov:48 },
  { type:'PS',   prod:25,  recScore:2, oceanRisk:55, eprCov:20 },
];

const plasticTrend = Array.from({ length:24 }, (_, i) => ({
  month: `M${i+1}`,
  waste: +(310 + sr(i*7+2) * 80).toFixed(1),
}));

const regulations = [
  { name:'EU CSRD Circular KPIs',              status:'In Force',    jur:'European Union', scope:'Large companies >500 emp', obligation:'Report 6 circular KPIs annually', phase:'2024 (FY2024)' },
  { name:'EU Ecodesign Regulation',            status:'Adopted',     jur:'European Union', scope:'Product manufacturers & importers', obligation:'Design for repairability & recyclability', phase:'2025–2030 phased' },
  { name:'UN Global Plastics Treaty',          status:'Negotiating', jur:'Global (INC-5)', scope:'Plastics value chain', obligation:'Binding cuts in plastic production & EPR', phase:'TBD (2025 target)' },
  { name:'Extended Producer Responsibility',   status:'In Force',    jur:'EU + 60 states', scope:'Packaging & electronics producers', obligation:'Finance waste collection & recycling', phase:'2024 onwards' },
  { name:'Basel Convention Plastics Amendment',status:'In Force',    jur:'Global (187)',   scope:'Trans-boundary plastic waste trade', obligation:'Prior informed consent for exports', phase:'Since Jan 2021' },
  { name:'US Break Free From Plastic Act',     status:'Proposed',    jur:'United States',  scope:'Plastic producers & brand owners', obligation:'EPR fund + production caps on PS/PVC', phase:'Pending Congress' },
];

const statusColor = s => s === 'In Force' ? T.sage : s === 'Adopted' ? T.teal : s === 'Proposed' ? T.amber : T.textSec;

const TABS = ['Overview','Material Flow','Corporate','Waste & Plastics','Regulatory'];

export default function CircularEconomyTrackerPage() {
  const [tab, setTab] = useState(0);

  return (
    <div style={{ background:T.bg, minHeight:'100vh', color:T.text, fontFamily:T.font, padding:24 }}>
      <div style={{ marginBottom:20 }}>
        <h1 style={{ fontSize:22, fontWeight:700, margin:0 }}>Circular Economy &amp; Waste Intelligence</h1>
        <p style={{ color:T.textSec, margin:'4px 0 0', fontSize:13 }}>EP-AC5 · Material loops, corporate circularity &amp; plastics treaty tracker</p>
      </div>

      {/* Tab bar */}
      <div style={{ display:'flex', gap:4, borderBottom:'1px solid '+T.border, marginBottom:24 }}>
        {TABS.map((t,i) => (
          <button key={t} onClick={() => setTab(i)} style={{ background:'none', border:'none', cursor:'pointer', padding:'10px 18px', fontSize:13, fontWeight:600, color: tab===i ? T.sage : T.textSec, borderBottom: tab===i ? '2px solid '+T.sage : '2px solid transparent' }}>{t}</button>
        ))}
      </div>

      {/* TAB 0 — Overview */}
      {tab === 0 && (
        <div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:24 }}>
            {[['9.7%','Global Circularity','only 9.7% of materials re-enter economy'],['$4.5T','Circular Opportunity','annual economic value by 2030'],['2.1 Gt','Plastic Waste','generated globally per year'],['6','EU CSRD Circular KPIs','mandatory disclosure metrics']].map(([v,l,s])=>(
              <div key={l} style={{ background:T.surface, border:'1px solid '+T.border, borderRadius:10, padding:16 }}>
                <div style={{ fontSize:26, fontWeight:700, color:T.sage }}>{v}</div>
                <div style={{ fontSize:13, fontWeight:600, marginTop:4 }}>{l}</div>
                <div style={{ fontSize:11, color:T.textMut, marginTop:3 }}>{s}</div>
              </div>
            ))}
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:18 }}>
            <div style={{ background:T.surface, border:'1px solid '+T.border, borderRadius:10, padding:16 }}>
              <h3 style={{ fontSize:13, fontWeight:700, margin:'0 0 12px', color:T.textSec }}>MATERIAL LOOPS</h3>
              <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
                <thead>
                  <tr>{['Material','Circularity %','Recovery $bn','Waste Mt','EU Target'].map(h=><th key={h} style={{ textAlign:'left', color:T.textMut, padding:'4px 6px', borderBottom:'1px solid '+T.border }}>{h}</th>)}</tr>
                </thead>
                <tbody>
                  {materialLoops.map(r=>(
                    <tr key={r.name}>
                      <td style={{ padding:'5px 6px', fontWeight:600 }}>{r.name}</td>
                      <td style={{ padding:'5px 6px', color: r.circ>=30?T.sage:r.circ>=15?T.amber:T.red }}>{r.circ}%</td>
                      <td style={{ padding:'5px 6px', color:T.textSec }}>${r.recovVal}bn</td>
                      <td style={{ padding:'5px 6px', color:T.textSec }}>{r.waste} Mt</td>
                      <td style={{ padding:'5px 6px', color:T.teal }}>{r.euTarget}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ background:T.surface, border:'1px solid '+T.border, borderRadius:10, padding:16 }}>
              <h3 style={{ fontSize:13, fontWeight:700, margin:'0 0 12px', color:T.textSec }}>GLOBAL CIRCULARITY RATE TREND (24M)</h3>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={circTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="month" stroke={T.textMut} tick={{ fontSize:10 }} interval={5} />
                  <YAxis stroke={T.textMut} tick={{ fontSize:10 }} domain={[5,14]} unit="%" />
                  <Tooltip {...tip} />
                  <Area type="monotone" dataKey="rate" stroke={T.sage} fill={T.sage} fillOpacity={0.15} name="Circularity %" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* TAB 1 — Material Flow */}
      {tab === 1 && (
        <div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14, marginBottom:20 }}>
            {[['14','Critical Raw Materials at Risk','EU CRM Act designations'],['87%','EU Strategic Stockpile Coverage','of critical minerals covered'],['$340bn','Recycling Value Gap','vs. virgin material extraction']].map(([v,l,s])=>(
              <div key={l} style={{ background:T.surface, border:'1px solid '+T.border, borderRadius:10, padding:16 }}>
                <div style={{ fontSize:24, fontWeight:700, color:T.sage }}>{v}</div>
                <div style={{ fontSize:13, fontWeight:600, marginTop:4 }}>{l}</div>
                <div style={{ fontSize:11, color:T.textMut, marginTop:3 }}>{s}</div>
              </div>
            ))}
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:18 }}>
            <div style={{ background:T.surface, border:'1px solid '+T.border, borderRadius:10, padding:16 }}>
              <h3 style={{ fontSize:13, fontWeight:700, margin:'0 0 12px', color:T.textSec }}>MATERIAL FLOWS — KEY METRICS</h3>
              <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
                <thead>
                  <tr>{['Material','Virgin Mt','Recycled %','EoL Recovery %','Premium $/t'].map(h=><th key={h} style={{ textAlign:'left', color:T.textMut, padding:'4px 6px', borderBottom:'1px solid '+T.border }}>{h}</th>)}</tr>
                </thead>
                <tbody>
                  {materialFlows.map(r=>(
                    <tr key={r.mat}>
                      <td style={{ padding:'5px 6px', fontWeight:600 }}>{r.mat}</td>
                      <td style={{ padding:'5px 6px', color:T.textSec }}>{r.virgin}</td>
                      <td style={{ padding:'5px 6px', color: r.recycled>=50?T.sage:r.recycled>=25?T.amber:T.red }}>{r.recycled}%</td>
                      <td style={{ padding:'5px 6px', color:T.textSec }}>{r.eol}%</td>
                      <td style={{ padding:'5px 6px', color:T.teal }}>${r.premium}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ background:T.surface, border:'1px solid '+T.border, borderRadius:10, padding:16 }}>
              <h3 style={{ fontSize:13, fontWeight:700, margin:'0 0 12px', color:T.textSec }}>RECYCLED CONTENT % BY MATERIAL</h3>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={materialFlows} margin={{ top:4, right:8, bottom:4, left:0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="mat" stroke={T.textMut} tick={{ fontSize:10 }} />
                  <YAxis stroke={T.textMut} tick={{ fontSize:10 }} unit="%" />
                  <Tooltip {...tip} />
                  <Bar dataKey="recycled" name="Recycled Content %">
                    {materialFlows.map((r,i) => (
                      <Cell key={i} fill={r.recycled>=50?T.green:r.recycled>=25?T.amber:T.red} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2 — Corporate Circularity */}
      {tab === 2 && (
        <div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:18, marginBottom:18 }}>
            <div style={{ background:T.surface, border:'1px solid '+T.border, borderRadius:10, padding:16 }}>
              <h3 style={{ fontSize:13, fontWeight:700, margin:'0 0 12px', color:T.textSec }}>CORPORATE CIRCULARITY SCORES</h3>
              {companies.map(c=>(
                <div key={c.co} style={{ marginBottom:10 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, marginBottom:3 }}>
                    <span style={{ fontWeight:600 }}>{c.co}</span>
                    <span style={{ color:T.sage }}>{c.score}/100</span>
                  </div>
                  <div style={{ background:T.border, borderRadius:4, height:6 }}>
                    <div style={{ width:`${c.score}%`, background: c.score>=75?T.sage:c.score>=55?T.amber:T.red, borderRadius:4, height:'100%' }} />
                  </div>
                  <div style={{ display:'flex', gap:12, fontSize:10, color:T.textMut, marginTop:2 }}>
                    <span>Circ Rev: {c.circRev}%</span>
                    <span>Recycled In: {c.recycIn}%</span>
                    <span>Take-back: {c.takeBack}</span>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ background:T.surface, border:'1px solid '+T.border, borderRadius:10, padding:16 }}>
              <h3 style={{ fontSize:13, fontWeight:700, margin:'0 0 12px', color:T.textSec }}>WASTE-TO-LANDFILL % BY COMPANY</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={companies} margin={{ top:4, right:8, bottom:4, left:0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="co" stroke={T.textMut} tick={{ fontSize:9 }} />
                  <YAxis stroke={T.textMut} tick={{ fontSize:10 }} unit="%" />
                  <Tooltip {...tip} />
                  <Bar dataKey="landfill" name="Waste to Landfill %">
                    {companies.map((c,i) => (
                      <Cell key={i} fill={c.landfill<=3?T.green:c.landfill<=8?T.amber:T.red} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>

              <h3 style={{ fontSize:13, fontWeight:700, margin:'16px 0 10px', color:T.textSec }}>EU CEAP COMPLIANCE CHECKLIST</h3>
              {ceapChecklist.map(item=>(
                <div key={item.item} style={{ display:'flex', alignItems:'center', gap:8, fontSize:12, marginBottom:6 }}>
                  <span style={{ color: item.met?T.sage:T.red, fontWeight:700 }}>{item.met?'✓':'✗'}</span>
                  <span style={{ color: item.met?T.text:T.textSec }}>{item.item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3 — Waste & Plastics */}
      {tab === 3 && (
        <div>
          <div style={{ background:T.navy, border:'1px solid '+T.border, borderRadius:10, padding:16, marginBottom:18 }}>
            <h3 style={{ fontSize:13, fontWeight:700, margin:'0 0 8px' }}>UN GLOBAL PLASTICS TREATY — INC-5 STATUS</h3>
            <p style={{ fontSize:12, color:T.textSec, margin:0 }}>INC-5 negotiations concluded in Busan (Nov 2024) without consensus. A resumed session (INC-5.2) is planned. Key divides remain on binding production caps vs. waste-management-only approaches. 175 nations engaged; treaty text remains under negotiation.</p>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:18 }}>
            <div style={{ background:T.surface, border:'1px solid '+T.border, borderRadius:10, padding:16 }}>
              <h3 style={{ fontSize:13, fontWeight:700, margin:'0 0 12px', color:T.textSec }}>PLASTIC TYPES — TREATY EXPOSURE</h3>
              <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
                <thead>
                  <tr>{['Type','Prod Mt','Rec Score','Ocean Risk','EPR Cov %'].map(h=><th key={h} style={{ textAlign:'left', color:T.textMut, padding:'4px 6px', borderBottom:'1px solid '+T.border }}>{h}</th>)}</tr>
                </thead>
                <tbody>
                  {plasticTypes.map(r=>(
                    <tr key={r.type}>
                      <td style={{ padding:'5px 6px', fontWeight:600 }}>{r.type}</td>
                      <td style={{ padding:'5px 6px', color:T.textSec }}>{r.prod}</td>
                      <td style={{ padding:'5px 6px', color: r.recScore>=7?T.sage:r.recScore>=4?T.amber:T.red }}>{r.recScore}/10</td>
                      <td style={{ padding:'5px 6px', color: r.oceanRisk>=40?T.red:r.oceanRisk>=25?T.amber:T.sage }}>{r.oceanRisk}%</td>
                      <td style={{ padding:'5px 6px', color:T.teal }}>{r.eprCov}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <h3 style={{ fontSize:13, fontWeight:700, margin:'16px 0 10px', color:T.textSec }}>OCEAN LEAKAGE RISK BY PLASTIC TYPE</h3>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={plasticTypes} margin={{ top:4, right:8, bottom:4, left:0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="type" stroke={T.textMut} tick={{ fontSize:11 }} />
                  <YAxis stroke={T.textMut} tick={{ fontSize:10 }} unit="%" />
                  <Tooltip {...tip} />
                  <Bar dataKey="oceanRisk" name="Ocean Leakage Risk %">
                    {plasticTypes.map((r,i) => (
                      <Cell key={i} fill={r.oceanRisk>=40?T.red:r.oceanRisk>=25?T.amber:T.sage} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div style={{ background:T.surface, border:'1px solid '+T.border, borderRadius:10, padding:16 }}>
              <h3 style={{ fontSize:13, fontWeight:700, margin:'0 0 12px', color:T.textSec }}>GLOBAL PLASTIC WASTE TREND (24M, Mt)</h3>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={plasticTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="month" stroke={T.textMut} tick={{ fontSize:10 }} interval={5} />
                  <YAxis stroke={T.textMut} tick={{ fontSize:10 }} domain={[280,420]} unit=" Mt" />
                  <Tooltip {...tip} />
                  <Area type="monotone" dataKey="waste" stroke={T.red} fill={T.red} fillOpacity={0.12} name="Plastic Waste Mt" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4 — Regulatory Pipeline */}
      {tab === 4 && (
        <div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14, marginBottom:20 }}>
            {[['60+','Mandatory EPR Jurisdictions','nations with active EPR laws'],['175','Global Plastics Treaty Signatories','INC-5 participating nations'],['$890bn','Est. Compliance Investment','10-year horizon, all regimes']].map(([v,l,s])=>(
              <div key={l} style={{ background:T.surface, border:'1px solid '+T.border, borderRadius:10, padding:16 }}>
                <div style={{ fontSize:24, fontWeight:700, color:T.sage }}>{v}</div>
                <div style={{ fontSize:13, fontWeight:600, marginTop:4 }}>{l}</div>
                <div style={{ fontSize:11, color:T.textMut, marginTop:3 }}>{s}</div>
              </div>
            ))}
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
            {regulations.map(r=>(
              <div key={r.name} style={{ background:T.surface, border:'1px solid '+T.border, borderRadius:10, padding:16 }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:8 }}>
                  <h3 style={{ fontSize:13, fontWeight:700, margin:0, flex:1 }}>{r.name}</h3>
                  <span style={{ fontSize:10, fontWeight:700, color:statusColor(r.status), background:'rgba(0,0,0,0.2)', borderRadius:4, padding:'2px 7px', marginLeft:8, whiteSpace:'nowrap' }}>{r.status}</span>
                </div>
                <div style={{ fontSize:11, color:T.textSec, marginBottom:4 }}>
                  <span style={{ color:T.teal, fontWeight:600 }}>{r.jur}</span> · {r.scope}
                </div>
                <div style={{ fontSize:12, color:T.text, marginBottom:6 }}>{r.obligation}</div>
                <div style={{ fontSize:11, color:T.textMut }}>Phase-in: <span style={{ color:T.amber }}>{r.phase}</span></div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
