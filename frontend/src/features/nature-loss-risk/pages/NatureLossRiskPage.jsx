import React, { useState } from 'react';
import { BarChart, Bar, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, AreaChart, Area } from 'recharts';

const T = { bg:'#0f172a', surface:'#1e293b', border:'#334155', navy:'#1e3a5f', gold:'#f59e0b', sage:'#10b981', text:'#f1f5f9', textSec:'#94a3b8', textMut:'#64748b', red:'#ef4444', green:'#10b981', amber:'#f59e0b', teal:'#14b8a6', font:"'Inter',sans-serif" };
const GREEN = '#16a34a';
const tip = { contentStyle:{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, color:T.text }, labelStyle:{ color:T.textSec } };
const sr = s => { let x = Math.sin(s+1)*10000; return x - Math.floor(x); };

const TABS = ['Overview','TNFD LEAP','Dependency Mapping','Portfolio Exposure','Regulatory Horizon'];

const STAT_CARDS = [
  { label:'Species at Risk', value:'847', sub:'globally tracked' },
  { label:'GDP Exposed', value:'$44T', sub:'nature-dependent' },
  { label:'Ecosystems Degraded', value:'68%', sub:'of assessed biomes' },
  { label:'TNFD Reporters', value:'312', sub:'companies disclosing' },
];

const BIOMES = [
  { biome:'Tropical Rainforest', area:'1,900', degradation:72, exposure:9.4, leap:'Assess' },
  { biome:'Temperate Forest', area:'1,040', degradation:58, exposure:6.1, leap:'Evaluate' },
  { biome:'Grasslands & Savanna', area:'3,500', degradation:64, exposure:5.8, leap:'Locate' },
  { biome:'Wetlands', area:'890', degradation:81, exposure:7.2, leap:'Prepare' },
  { biome:'Coral Reefs', area:'285', degradation:88, exposure:3.6, leap:'Assess' },
  { biome:'Boreal Forest', area:'1,200', degradation:41, exposure:4.3, leap:'Evaluate' },
];

const BII_DATA = Array.from({ length: 24 }, (_, i) => ({
  month: `M${i+1}`,
  bii: Math.round((60 + sr(i*7)*25) * 10) / 10,
}));

const LEAP_PHASES = [
  {
    phase:'Locate',
    desc:'Identify where your business intersects with nature across operations and value chains.',
    questions:['Where are our assets and operations located relative to biodiversity hotspots?','Which suppliers operate in nature-sensitive areas?','What is our geographic footprint across biomes?'],
    completion:78,
  },
  {
    phase:'Evaluate',
    desc:'Assess dependencies and impacts on nature for each identified location.',
    questions:['What ecosystem services does our business depend on?','What are our direct and indirect impacts on biodiversity?','How material are these dependencies to our financial performance?'],
    completion:61,
  },
  {
    phase:'Assess',
    desc:'Evaluate nature-related risks and opportunities arising from dependencies and impacts.',
    questions:['What transition risks arise from nature-related policy changes?','What physical risks emerge from ecosystem degradation?','What opportunities exist in nature-positive markets?'],
    completion:44,
  },
  {
    phase:'Prepare',
    desc:'Develop strategy, targets and disclosure aligned with TNFD recommendations.',
    questions:['What nature-positive targets should we set?','How do we integrate nature risk into enterprise risk management?','What metrics best communicate our nature performance?'],
    completion:29,
  },
];

const LEAP_SECTORS = [
  { sector:'Financial Services', adoption:54, disclosure:38, dependencies:'Timber, Agriculture, Water' },
  { sector:'Agriculture & Food', adoption:71, disclosure:52, dependencies:'Soil, Pollination, Water' },
  { sector:'Mining & Materials', adoption:48, disclosure:31, dependencies:'Water, Soil, Ecosystem' },
  { sector:'Pharma & Health', adoption:39, disclosure:22, dependencies:'Genetic Resources, Plants' },
  { sector:'Real Estate', adoption:33, disclosure:19, dependencies:'Water, Coastal, Land' },
  { sector:'Energy & Utilities', adoption:42, disclosure:28, dependencies:'Water, Land, Ecosystem' },
  { sector:'Construction', adoption:36, disclosure:24, dependencies:'Timber, Soil, Water' },
  { sector:'Tourism & Leisure', adoption:61, disclosure:44, dependencies:'Coastal, Forest, Wildlife' },
];

const ECOSYSTEM_SERVICES = [
  { service:'Pollination', score:82, value:577, exposure:'High — Agriculture, Food' },
  { service:'Water Purification', score:76, value:472, exposure:'High — Beverage, Pharma' },
  { service:'Carbon Sequestration', score:68, value:318, exposure:'Med — Energy, Real Estate' },
  { service:'Soil Formation', score:71, value:241, exposure:'High — Agriculture, Mining' },
  { service:'Coastal Protection', score:55, value:163, exposure:'Med — Insurance, Tourism' },
  { service:'Timber & Fibre', score:47, value:198, exposure:'Med — Construction, Paper' },
];

const INDUSTRY_MATRIX = [
  { industry:'Agriculture', critical:'Pollination, Soil Formation', dependency:'Very High', revenue:'$4.2T at risk' },
  { industry:'Pharma', critical:'Genetic Resources, Plants', dependency:'High', revenue:'$1.1T at risk' },
  { industry:'Construction', critical:'Timber, Water', dependency:'Medium', revenue:'$0.8T at risk' },
  { industry:'Tourism', critical:'Coastal, Wildlife, Forest', dependency:'High', revenue:'$1.7T at risk' },
  { industry:'Insurance', critical:'Coastal Protection, Floods', dependency:'Very High', revenue:'$2.3T at risk' },
];

const PORTFOLIO_DATA = [
  { name:'Unilever', depScore:74, transRisk:'High', physRisk:'High', tnfdAlign:62, strandedRisk:'Medium' },
  { name:'Rio Tinto', depScore:88, transRisk:'Very High', physRisk:'High', tnfdAlign:41, strandedRisk:'High' },
  { name:'Nestlé', depScore:79, transRisk:'High', physRisk:'Med', tnfdAlign:55, strandedRisk:'Medium' },
  { name:'BHP Group', depScore:85, transRisk:'Very High', physRisk:'High', tnfdAlign:38, strandedRisk:'High' },
  { name:'Diageo', depScore:61, transRisk:'Med', physRisk:'Med', tnfdAlign:71, strandedRisk:'Low' },
  { name:'Syngenta', depScore:91, transRisk:'Very High', physRisk:'Very High', tnfdAlign:33, strandedRisk:'High' },
  { name:'Weyerhaeuser', depScore:83, transRisk:'High', physRisk:'High', tnfdAlign:48, strandedRisk:'Medium' },
  { name:'Marriott Intl', depScore:52, transRisk:'Med', physRisk:'Med', tnfdAlign:67, strandedRisk:'Low' },
];

const REGULATIONS = [
  { name:'EU Nature Restoration Law', status:'Enacted', jurisdiction:'European Union', effective:'2024–2030 phased', req:'Restore 20% degraded land & sea by 2030; mandatory recovery targets', cost:'€1.2–3.4B est.' },
  { name:'TNFD v1.0 Framework', status:'Voluntary', jurisdiction:'Global', effective:'FY2024 reporting', req:'Disclose nature-related dependencies, impacts, risks, and opportunities', cost:'$0.5–2.0M per firm' },
  { name:'CBD Kunming-Montreal', status:'Treaty', jurisdiction:'196 Parties', effective:'2022–2030', req:'30x30 goal: protect 30% land and ocean by 2030', cost:'$700B/yr mobilisation' },
  { name:'CSRD Biodiversity', status:'Mandatory', jurisdiction:'EU / EEA', effective:'FY2024–2026', req:'ESRS E4 biodiversity disclosure for 50,000+ companies in scope', cost:'€0.8–1.6M per firm' },
  { name:'SEC Nature Disclosure', status:'Proposed', jurisdiction:'United States', effective:'TBD 2025–26', req:'Mandatory nature risk disclosure linked to financial materiality', cost:'$0.3–1.2M per firm' },
  { name:'UK TNFD Pilot', status:'Pilot', jurisdiction:'United Kingdom', effective:'2024–2025', req:'Voluntary pilot with 30 firms; inform mandatory UK framework by 2026', cost:'£200–600K per firm' },
];

const statusColor = s => ({ Enacted:T.green, Mandatory:T.red, Treaty:T.teal, Voluntary:T.amber, Proposed:T.textSec, Pilot:T.gold }[s] || T.textSec);
const riskColor = r => ({ 'Very High':T.red, High:T.amber, Med:T.teal, Low:T.green }[r] || T.textSec);

export default function NatureLossRiskPage() {
  const [tab, setTab] = useState(0);

  const totalAUM = '$14.2B';
  const highRiskCount = PORTFOLIO_DATA.filter(c => c.depScore >= 75).length;
  const avgTNFD = Math.round(PORTFOLIO_DATA.reduce((a,c) => a + c.tnfdAlign, 0) / PORTFOLIO_DATA.length);
  const mandatoryCount = REGULATIONS.filter(r => ['Enacted','Mandatory'].includes(r.status)).length;
  const voluntaryCount = REGULATIONS.filter(r => r.status === 'Voluntary').length;

  return (
    <div style={{ background:T.bg, minHeight:'100vh', fontFamily:T.font, color:T.text, padding:'24px' }}>
      <div style={{ marginBottom:20 }}>
        <h1 style={{ fontSize:22, fontWeight:700, margin:0 }}>Nature &amp; Biodiversity Risk Engine</h1>
        <p style={{ color:T.textSec, fontSize:13, margin:'4px 0 0' }}>EP-AC1 · TNFD-aligned nature risk analytics and portfolio exposure assessment</p>
      </div>

      {/* Tab bar */}
      <div style={{ display:'flex', gap:4, borderBottom:`1px solid ${T.border}`, marginBottom:24 }}>
        {TABS.map((t,i) => (
          <button key={t} onClick={() => setTab(i)} style={{ background:'none', border:'none', cursor:'pointer', padding:'8px 16px', fontSize:13, fontWeight:600, color: tab===i ? T.text : T.textSec, borderBottom: tab===i ? `2px solid ${GREEN}` : '2px solid transparent', transition:'all .15s' }}>{t}</button>
        ))}
      </div>

      {/* Tab 1: Overview */}
      {tab === 0 && (
        <div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:24 }}>
            {STAT_CARDS.map(c => (
              <div key={c.label} style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:10, padding:'16px' }}>
                <div style={{ fontSize:11, color:T.textSec, textTransform:'uppercase', letterSpacing:.5 }}>{c.label}</div>
                <div style={{ fontSize:26, fontWeight:700, color:GREEN, margin:'6px 0 2px' }}>{c.value}</div>
                <div style={{ fontSize:12, color:T.textMut }}>{c.sub}</div>
              </div>
            ))}
          </div>

          <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:10, padding:16, marginBottom:24 }}>
            <div style={{ fontSize:13, fontWeight:600, marginBottom:12 }}>Top Biomes by Degradation &amp; Financial Exposure</div>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
              <thead>
                <tr style={{ color:T.textSec }}>
                  {['Biome','Area (Mha)','Degradation %','Financial Exposure ($T)','LEAP Stage'].map(h => (
                    <th key={h} style={{ textAlign:'left', padding:'6px 8px', borderBottom:`1px solid ${T.border}`, fontWeight:600 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {BIOMES.map((b,i) => (
                  <tr key={b.biome} style={{ background: i%2===0 ? 'transparent' : 'rgba(255,255,255,.02)' }}>
                    <td style={{ padding:'7px 8px', fontWeight:500 }}>{b.biome}</td>
                    <td style={{ padding:'7px 8px', color:T.textSec }}>{b.area}</td>
                    <td style={{ padding:'7px 8px', color: b.degradation>=75 ? T.red : b.degradation>=55 ? T.amber : T.green }}>{b.degradation}%</td>
                    <td style={{ padding:'7px 8px' }}>${b.exposure}T</td>
                    <td style={{ padding:'7px 8px' }}><span style={{ background:T.navy, borderRadius:4, padding:'2px 8px', fontSize:11 }}>{b.leap}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:10, padding:16 }}>
            <div style={{ fontSize:13, fontWeight:600, marginBottom:12 }}>Biodiversity Intactness Index — 24-Month Trend</div>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={BII_DATA} margin={{ top:4, right:16, left:0, bottom:0 }}>
                <CartesianGrid stroke={T.border} strokeDasharray="3 3" />
                <XAxis dataKey="month" tick={{ fill:T.textSec, fontSize:10 }} interval={3} />
                <YAxis domain={[55,90]} tick={{ fill:T.textSec, fontSize:10 }} />
                <Tooltip {...tip} />
                <Area type="monotone" dataKey="bii" stroke={GREEN} fill={GREEN} fillOpacity={0.15} strokeWidth={2} name="BII Score" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Tab 2: TNFD LEAP */}
      {tab === 1 && (
        <div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:16, marginBottom:24 }}>
            {LEAP_PHASES.map(p => (
              <div key={p.phase} style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:10, padding:16 }}>
                <div style={{ fontSize:15, fontWeight:700, color:GREEN, marginBottom:6 }}>{p.phase}</div>
                <div style={{ fontSize:12, color:T.textSec, marginBottom:10 }}>{p.desc}</div>
                <ul style={{ margin:'0 0 12px', paddingLeft:16, fontSize:12, color:T.text }}>
                  {p.questions.map(q => <li key={q} style={{ marginBottom:4 }}>{q}</li>)}
                </ul>
                <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                  <div style={{ flex:1, height:6, background:T.border, borderRadius:3, overflow:'hidden' }}>
                    <div style={{ width:`${p.completion}%`, height:'100%', background:GREEN, borderRadius:3 }} />
                  </div>
                  <span style={{ fontSize:12, color:T.textSec, whiteSpace:'nowrap' }}>{p.completion}% complete</span>
                </div>
              </div>
            ))}
          </div>

          <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:10, padding:16 }}>
            <div style={{ fontSize:13, fontWeight:600, marginBottom:12 }}>LEAP Adoption by Sector</div>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
              <thead>
                <tr style={{ color:T.textSec }}>
                  {['Sector','LEAP Adoption %','Disclosure Rate','Material Dependencies'].map(h => (
                    <th key={h} style={{ textAlign:'left', padding:'6px 8px', borderBottom:`1px solid ${T.border}`, fontWeight:600 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {LEAP_SECTORS.map((s,i) => (
                  <tr key={s.sector} style={{ background: i%2===0 ? 'transparent' : 'rgba(255,255,255,.02)' }}>
                    <td style={{ padding:'7px 8px', fontWeight:500 }}>{s.sector}</td>
                    <td style={{ padding:'7px 8px', color: s.adoption>=60 ? T.green : s.adoption>=40 ? T.amber : T.red }}>{s.adoption}%</td>
                    <td style={{ padding:'7px 8px' }}>{s.disclosure}%</td>
                    <td style={{ padding:'7px 8px', color:T.textSec }}>{s.dependencies}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Dependency Mapping */}
      {tab === 2 && (
        <div>
          <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:10, padding:16, marginBottom:24 }}>
            <div style={{ fontSize:13, fontWeight:600, marginBottom:16 }}>Ecosystem Service Dependency Scores</div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={ECOSYSTEM_SERVICES} layout="vertical" margin={{ top:0, right:16, left:120, bottom:0 }}>
                <CartesianGrid stroke={T.border} strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" domain={[0,100]} tick={{ fill:T.textSec, fontSize:10 }} />
                <YAxis type="category" dataKey="service" tick={{ fill:T.text, fontSize:11 }} width={115} />
                <Tooltip {...tip} />
                <Bar dataKey="score" name="Dependency Score" radius={[0,4,4,0]}>
                  {ECOSYSTEM_SERVICES.map((e,i) => (
                    <Cell key={i} fill={e.score>70 ? T.red : e.score>40 ? T.amber : T.green} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:10, padding:16, marginBottom:24 }}>
            <div style={{ fontSize:13, fontWeight:600, marginBottom:12 }}>Ecosystem Services — Value &amp; Exposure</div>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
              <thead>
                <tr style={{ color:T.textSec }}>
                  {['Service','Dependency Score','Financial Value ($bn)','Corporate Exposure'].map(h => (
                    <th key={h} style={{ textAlign:'left', padding:'6px 8px', borderBottom:`1px solid ${T.border}`, fontWeight:600 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ECOSYSTEM_SERVICES.map((e,i) => (
                  <tr key={e.service} style={{ background: i%2===0 ? 'transparent' : 'rgba(255,255,255,.02)' }}>
                    <td style={{ padding:'7px 8px', fontWeight:500 }}>{e.service}</td>
                    <td style={{ padding:'7px 8px', color: e.score>70 ? T.red : e.score>40 ? T.amber : T.green }}>{e.score}</td>
                    <td style={{ padding:'7px 8px' }}>${e.value}bn</td>
                    <td style={{ padding:'7px 8px', color:T.textSec }}>{e.exposure}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:12 }}>
            {INDUSTRY_MATRIX.map(ind => (
              <div key={ind.industry} style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:10, padding:14 }}>
                <div style={{ fontSize:13, fontWeight:700, marginBottom:6 }}>{ind.industry}</div>
                <div style={{ fontSize:11, color:T.textSec, marginBottom:4 }}>Critical: <span style={{ color:T.text }}>{ind.critical}</span></div>
                <div style={{ fontSize:11, marginBottom:4 }}>Dependency: <span style={{ color: ind.dependency==='Very High'?T.red:ind.dependency==='High'?T.amber:T.teal, fontWeight:600 }}>{ind.dependency}</span></div>
                <div style={{ fontSize:11, color:T.gold, fontWeight:600 }}>{ind.revenue}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: Portfolio Exposure */}
      {tab === 3 && (
        <div>
          <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:10, padding:16, marginBottom:24 }}>
            <div style={{ fontSize:13, fontWeight:600, marginBottom:16 }}>Nature Dependency Scores by Company</div>
            <ResponsiveContainer width="100%" height={210}>
              <BarChart data={PORTFOLIO_DATA} margin={{ top:4, right:16, left:0, bottom:20 }}>
                <CartesianGrid stroke={T.border} strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fill:T.text, fontSize:10 }} angle={-20} textAnchor="end" />
                <YAxis domain={[0,100]} tick={{ fill:T.textSec, fontSize:10 }} />
                <Tooltip {...tip} />
                <Bar dataKey="depScore" name="Dependency Score" radius={[4,4,0,0]}>
                  {PORTFOLIO_DATA.map((c,i) => (
                    <Cell key={i} fill={c.depScore>=80 ? T.red : c.depScore>=65 ? T.amber : T.green} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:10, padding:16, marginBottom:24 }}>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
              <thead>
                <tr style={{ color:T.textSec }}>
                  {['Company','Dep. Score','Transition Risk','Physical Risk','TNFD Align %','Stranded Risk'].map(h => (
                    <th key={h} style={{ textAlign:'left', padding:'6px 8px', borderBottom:`1px solid ${T.border}`, fontWeight:600 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {PORTFOLIO_DATA.map((c,i) => (
                  <tr key={c.name} style={{ background: i%2===0 ? 'transparent' : 'rgba(255,255,255,.02)' }}>
                    <td style={{ padding:'7px 8px', fontWeight:500 }}>{c.name}</td>
                    <td style={{ padding:'7px 8px', color: c.depScore>=80?T.red:c.depScore>=65?T.amber:T.green, fontWeight:600 }}>{c.depScore}</td>
                    <td style={{ padding:'7px 8px', color:riskColor(c.transRisk) }}>{c.transRisk}</td>
                    <td style={{ padding:'7px 8px', color:riskColor(c.physRisk) }}>{c.physRisk}</td>
                    <td style={{ padding:'7px 8px' }}>{c.tnfdAlign}%</td>
                    <td style={{ padding:'7px 8px', color:riskColor(c.strandedRisk) }}>{c.strandedRisk}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12 }}>
            {[
              { label:'Total AUM Exposed', value:totalAUM, color:T.gold },
              { label:'High-Risk Holdings', value:`${highRiskCount} companies`, color:T.red },
              { label:'Avg TNFD Alignment', value:`${avgTNFD}%`, color:GREEN },
            ].map(s => (
              <div key={s.label} style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:10, padding:16, textAlign:'center' }}>
                <div style={{ fontSize:11, color:T.textSec, textTransform:'uppercase', letterSpacing:.5 }}>{s.label}</div>
                <div style={{ fontSize:26, fontWeight:700, color:s.color, margin:'8px 0 0' }}>{s.value}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 5: Regulatory Horizon */}
      {tab === 4 && (
        <div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:16, marginBottom:24 }}>
            {REGULATIONS.map(r => (
              <div key={r.name} style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:10, padding:16 }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:8 }}>
                  <div style={{ fontSize:13, fontWeight:700, flex:1, marginRight:8 }}>{r.name}</div>
                  <span style={{ background:statusColor(r.status)+'22', color:statusColor(r.status), borderRadius:4, padding:'2px 8px', fontSize:11, fontWeight:600, whiteSpace:'nowrap' }}>{r.status}</span>
                </div>
                <div style={{ fontSize:11, color:T.textSec, marginBottom:4 }}>Jurisdiction: <span style={{ color:T.text }}>{r.jurisdiction}</span></div>
                <div style={{ fontSize:11, color:T.textSec, marginBottom:6 }}>Effective: <span style={{ color:T.teal }}>{r.effective}</span></div>
                <div style={{ fontSize:12, color:T.text, marginBottom:8 }}>{r.req}</div>
                <div style={{ fontSize:11, color:T.gold, fontWeight:600 }}>Est. compliance cost: {r.cost}</div>
              </div>
            ))}
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12 }}>
            {[
              { label:'Mandatory by 2026', value:mandatoryCount, color:T.red, sub:'enacted or mandatory frameworks' },
              { label:'Voluntary Now', value:voluntaryCount, color:T.amber, sub:'voluntary disclosure frameworks' },
              { label:'Est. Compliance Cost', value:'$2–8M', color:GREEN, sub:'per firm across all frameworks' },
            ].map(s => (
              <div key={s.label} style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:10, padding:16, textAlign:'center' }}>
                <div style={{ fontSize:11, color:T.textSec, textTransform:'uppercase', letterSpacing:.5 }}>{s.label}</div>
                <div style={{ fontSize:32, fontWeight:700, color:s.color, margin:'8px 0 4px' }}>{s.value}</div>
                <div style={{ fontSize:11, color:T.textMut }}>{s.sub}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
