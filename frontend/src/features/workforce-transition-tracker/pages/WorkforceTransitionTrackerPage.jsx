import React, { useState, useMemo } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';

const T = { bg:'#f6f4f0', surface:'#ffffff', border:'#e5e0d8', navy:'#1b3a5c', navyL:'#2c5a8c', gold:'#c5a96a', textSec:'#5c6b7e', textMut:'#9aa3ae', red:'#dc2626', green:'#16a34a', amber:'#d97706', blue:'#2563eb', orange:'#ea580c', purple:'#7c3aed', teal:'#0891b2', sage:'#5a8a6a', font:"'DM Sans','SF Pro Display',system-ui,sans-serif", mono:"'JetBrains Mono','SF Mono','Fira Code',monospace" };

const TABS = ['Programme Dashboard','Transition Success Rates','Skills Gap Analysis','Training ROI','Regional Employment Impact','Case Studies'];

const REGIONS = [
  { region:'Appalachia US', workers:4200, enrolled:3150, completion:78, placement:65, oldWage:52000, newWage:48500, timeToEmploy:8.2, pathway:'Coal→Solar' },
  { region:'Ruhr Valley DE', workers:3800, enrolled:3420, completion:88, placement:82, oldWage:48000, newWage:51200, timeToEmploy:5.1, pathway:'Coal→Wind' },
  { region:'Silesia PL', workers:5100, enrolled:2805, completion:62, placement:48, oldWage:28000, newWage:26500, timeToEmploy:11.4, pathway:'Coal→EV Mfg' },
  { region:'Queensland AU', workers:2900, enrolled:2320, completion:81, placement:71, oldWage:72000, newWage:68000, timeToEmploy:6.8, pathway:'Coal→Solar' },
  { region:'Alberta CA', workers:3400, enrolled:2720, completion:74, placement:59, oldWage:78000, newWage:65000, timeToEmploy:9.3, pathway:'Oil→Wind' },
  { region:'Mpumalanga ZA', workers:6200, enrolled:3100, completion:55, placement:38, oldWage:18000, newWage:16500, timeToEmploy:14.2, pathway:'Coal→Solar' },
  { region:'Shanxi CN', workers:8500, enrolled:5950, completion:71, placement:62, oldWage:32000, newWage:34500, timeToEmploy:7.6, pathway:'Coal→EV Mfg' },
  { region:'Jharkhand IN', workers:7200, enrolled:3600, completion:52, placement:35, oldWage:12000, newWage:11200, timeToEmploy:15.8, pathway:'Coal→Solar' },
  { region:'Kuznetsk RU', workers:4800, enrolled:2400, completion:58, placement:42, oldWage:24000, newWage:22800, timeToEmploy:12.1, pathway:'Coal→Wind' },
  { region:'Yorkshire UK', workers:2100, enrolled:1890, completion:91, placement:85, oldWage:36000, newWage:38500, timeToEmploy:4.3, pathway:'Coal→Wind' },
];

const YEARLY_TREND = [
  { year:2020, enrolled:12400, completed:7800, placed:5200 },
  { year:2021, enrolled:18600, completed:12900, placed:9100 },
  { year:2022, enrolled:26200, completed:19700, placed:14800 },
  { year:2023, enrolled:34800, completed:27100, placed:21600 },
  { year:2024, enrolled:42100, completed:33700, placed:28200 },
  { year:2025, enrolled:48200, completed:39800, placed:34500 },
];

const SKILLS_GAP = [
  { skill:'Electrical Systems', demand:92, supply:54 },
  { skill:'PV Installation', demand:88, supply:41 },
  { skill:'Wind Turbine Maint.', demand:79, supply:32 },
  { skill:'Battery Technology', demand:85, supply:28 },
  { skill:'Digital Controls', demand:76, supply:45 },
  { skill:'Project Management', demand:70, supply:62 },
  { skill:'Safety Certification', demand:95, supply:71 },
  { skill:'Data Analytics', demand:68, supply:38 },
];

const ROI_DATA = [
  { programme:'Solar Install Cert', cost:8500, avgWageGain:4200, payback:2.0, roi:148 },
  { programme:'Wind Tech Diploma', cost:14200, avgWageGain:6800, payback:2.1, roi:143 },
  { programme:'EV Manufacturing', cost:11800, avgWageGain:5100, payback:2.3, roi:130 },
  { programme:'Battery Assembly', cost:9200, avgWageGain:4800, payback:1.9, roi:157 },
  { programme:'Green H₂ Tech', cost:16500, avgWageGain:8200, payback:2.0, roi:149 },
  { programme:'Building Retrofit', cost:7200, avgWageGain:3600, payback:2.0, roi:150 },
];

const CASES = [
  { title:'Appalachia Solar Transition', region:'Appalachia US', workers:850, outcome:'65% placed in solar jobs within 12 months', highlight:'Partnership with First Solar created dedicated pipeline' },
  { title:'Ruhr Valley Wind Academy', region:'Ruhr Valley DE', workers:1200, outcome:'88% completion rate, highest in programme', highlight:'German dual-education model adapted for reskilling' },
  { title:'Yorkshire Green Skills Hub', region:'Yorkshire UK', workers:620, outcome:'85% placement rate, wages 7% above prior', highlight:'Union-led programme with guaranteed apprenticeship slots' },
];

const PALETTE = [T.navy, T.gold, T.green, T.blue, T.orange, T.purple, T.teal, T.red, T.sage, T.amber];

export default function WorkforceTransitionTrackerPage() {
  const [tab, setTab] = useState(0);
  const [sortCol, setSortCol] = useState('region');
  const [sortDir, setSortDir] = useState('asc');
  const [selectedRegion, setSelectedRegion] = useState('All');
  const [watchlist, setWatchlist] = useState(false);
  const [alertSub, setAlertSub] = useState(false);

  const sorted = useMemo(() => {
    const d = selectedRegion === 'All' ? [...REGIONS] : REGIONS.filter(r => r.region === selectedRegion);
    return d.sort((a, b) => {
      const av = a[sortCol], bv = b[sortCol];
      if (typeof av === 'number') return sortDir === 'asc' ? av - bv : bv - av;
      return sortDir === 'asc' ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av));
    });
  }, [sortCol, sortDir, selectedRegion]);

  const hdr = (col, label) => (
    <th style={{ padding:'8px 12px', textAlign:'left', cursor:'pointer', borderBottom:`2px solid ${T.border}`, fontFamily:T.mono, fontSize:12, color:T.navy, whiteSpace:'nowrap' }}
      onClick={() => { setSortCol(col); setSortDir(sortCol === col && sortDir === 'asc' ? 'desc' : 'asc'); }}>
      {label} {sortCol === col ? (sortDir === 'asc' ? '▲' : '▼') : ''}
    </th>
  );

  const card = (title, value, sub, color) => (
    <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:16, flex:1, minWidth:160 }}>
      <div style={{ fontFamily:T.mono, fontSize:11, color:T.textMut, textTransform:'uppercase', letterSpacing:1 }}>{title}</div>
      <div style={{ fontSize:28, fontWeight:700, color: color || T.navy, marginTop:4 }}>{value}</div>
      {sub && <div style={{ fontSize:12, color:T.textSec, marginTop:2 }}>{sub}</div>}
    </div>
  );

  const totalEnrolled = REGIONS.reduce((s, r) => s + r.enrolled, 0);
  const avgCompletion = Math.round(REGIONS.reduce((s, r) => s + r.completion, 0) / REGIONS.length);
  const avgPlacement = Math.round(REGIONS.reduce((s, r) => s + r.placement, 0) / REGIONS.length);

  return (
    <div style={{ fontFamily:T.font, background:T.bg, minHeight:'100vh', padding:24 }}>
      {/* Header */}
      <div style={{ background:T.surface, border:`2px solid ${T.gold}`, borderRadius:12, padding:'20px 28px', marginBottom:20 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:12 }}>
          <div>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <span style={{ background:T.navy, color:'#fff', fontFamily:T.mono, fontSize:11, padding:'3px 10px', borderRadius:4 }}>EP-CO1</span>
              <span style={{ fontFamily:T.mono, fontSize:11, color:T.textMut }}>WORKFORCE TRANSITION TRACKER</span>
            </div>
            <h1 style={{ fontSize:22, fontWeight:700, color:T.navy, margin:'6px 0 2px' }}>Workforce Transition Tracker</h1>
            <p style={{ color:T.textSec, fontSize:13, margin:0 }}>Reskilling outcome tracking across 10 fossil-dependent regions</p>
          </div>
          <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
            <button onClick={() => setWatchlist(!watchlist)} style={{ padding:'6px 14px', borderRadius:6, border:`1px solid ${watchlist ? T.gold : T.border}`, background:watchlist ? T.gold+'18' : T.surface, color:T.navy, fontFamily:T.font, fontSize:12, cursor:'pointer' }}>{watchlist ? '★ Watchlisted' : '☆ Watchlist'}</button>
            <button onClick={() => setAlertSub(!alertSub)} style={{ padding:'6px 14px', borderRadius:6, border:`1px solid ${alertSub ? T.green : T.border}`, background:alertSub ? T.green+'18' : T.surface, color:T.navy, fontFamily:T.font, fontSize:12, cursor:'pointer' }}>{alertSub ? '🔔 Subscribed' : '🔕 Alerts'}</button>
            <button style={{ padding:'6px 14px', borderRadius:6, border:`1px solid ${T.border}`, background:T.surface, color:T.navy, fontFamily:T.font, fontSize:12, cursor:'pointer' }}>⬇ Export</button>
            <button style={{ padding:'6px 14px', borderRadius:6, border:`1px solid ${T.border}`, background:T.surface, color:T.navy, fontFamily:T.font, fontSize:12, cursor:'pointer' }}>🔖 Bookmark</button>
            <span style={{ padding:'6px 14px', borderRadius:6, background:T.teal+'15', color:T.teal, fontFamily:T.mono, fontSize:11 }}>👥 3 viewing</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', gap:4, marginBottom:20, flexWrap:'wrap' }}>
        {TABS.map((t, i) => (
          <button key={i} onClick={() => setTab(i)} style={{ padding:'8px 16px', borderRadius:6, border:`1px solid ${tab === i ? T.gold : T.border}`, background:tab === i ? T.gold+'18' : T.surface, color:tab === i ? T.navy : T.textSec, fontWeight:tab === i ? 600 : 400, fontFamily:T.font, fontSize:13, cursor:'pointer' }}>{t}</button>
        ))}
      </div>

      {/* Tab 0: Programme Dashboard */}
      {tab === 0 && (
        <div>
          <div style={{ display:'flex', gap:16, marginBottom:20, flexWrap:'wrap' }}>
            {card('Total Workers Enrolled', totalEnrolled.toLocaleString(), 'Across 10 regions', T.navy)}
            {card('Avg Completion Rate', avgCompletion + '%', 'Programme completion', T.green)}
            {card('Avg Placement Rate', avgPlacement + '%', 'Post-training employment', T.blue)}
            {card('Active Programmes', '10', 'Regions with reskilling', T.gold)}
          </div>
          <div style={{ display:'flex', gap:16, flexWrap:'wrap' }}>
            <div style={{ flex:2, background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:16, minWidth:400 }}>
              <h3 style={{ fontSize:14, fontWeight:600, color:T.navy, marginBottom:12 }}>Enrolment, Completion & Placement by Year</h3>
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={YEARLY_TREND}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="year" tick={{ fontSize:11, fontFamily:T.mono }} />
                  <YAxis tick={{ fontSize:11, fontFamily:T.mono }} />
                  <Tooltip />
                  <Legend />
                  <Area type="monotone" dataKey="enrolled" fill={T.navy+'30'} stroke={T.navy} name="Enrolled" />
                  <Area type="monotone" dataKey="completed" fill={T.green+'30'} stroke={T.green} name="Completed" />
                  <Area type="monotone" dataKey="placed" fill={T.gold+'30'} stroke={T.gold} name="Placed" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div style={{ flex:1, background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:16, minWidth:280 }}>
              <h3 style={{ fontSize:14, fontWeight:600, color:T.navy, marginBottom:12 }}>Pathways Distribution</h3>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={[{ name:'Coal→Solar', value:4 },{ name:'Coal→Wind', value:3 },{ name:'Coal→EV Mfg', value:2 },{ name:'Oil→Wind', value:1 }]} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>
                    {[T.gold, T.navy, T.green, T.blue].map((c, i) => <Cell key={i} fill={c} />)}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Tab 1: Transition Success Rates */}
      {tab === 1 && (
        <div>
          <div style={{ marginBottom:12, display:'flex', gap:12, alignItems:'center' }}>
            <label style={{ fontSize:12, color:T.textSec }}>Filter Region:</label>
            <select value={selectedRegion} onChange={e => setSelectedRegion(e.target.value)} style={{ padding:'6px 12px', borderRadius:6, border:`1px solid ${T.border}`, fontFamily:T.font, fontSize:13 }}>
              <option value="All">All Regions</option>
              {REGIONS.map(r => <option key={r.region} value={r.region}>{r.region}</option>)}
            </select>
          </div>
          <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:16, marginBottom:16 }}>
            <h3 style={{ fontSize:14, fontWeight:600, color:T.navy, marginBottom:12 }}>Completion vs Placement Rate by Region</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={sorted} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize:11, fontFamily:T.mono }} />
                <YAxis type="category" dataKey="region" width={120} tick={{ fontSize:10, fontFamily:T.mono }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="completion" fill={T.navy} name="Completion %" />
                <Bar dataKey="placement" fill={T.green} name="Placement %" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:16 }}>
            <h3 style={{ fontSize:14, fontWeight:600, color:T.navy, marginBottom:12 }}>Wage Comparison: Old vs New</h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={sorted}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="region" tick={{ fontSize:9, fontFamily:T.mono, angle:-30, textAnchor:'end' }} height={60} />
                <YAxis tick={{ fontSize:11, fontFamily:T.mono }} />
                <Tooltip formatter={v => '$' + v.toLocaleString()} />
                <Legend />
                <Bar dataKey="oldWage" fill={T.amber} name="Old Wage ($)" />
                <Bar dataKey="newWage" fill={T.green} name="New Wage ($)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Tab 2: Skills Gap Analysis */}
      {tab === 2 && (
        <div>
          <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:16, marginBottom:16 }}>
            <h3 style={{ fontSize:14, fontWeight:600, color:T.navy, marginBottom:12 }}>Green Skills: Demand vs Supply</h3>
            <ResponsiveContainer width="100%" height={320}>
              <RadarChart data={SKILLS_GAP}>
                <PolarGrid stroke={T.border} />
                <PolarAngleAxis dataKey="skill" tick={{ fontSize:10, fontFamily:T.mono }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize:9 }} />
                <Radar name="Demand" dataKey="demand" stroke={T.red} fill={T.red} fillOpacity={0.2} />
                <Radar name="Supply" dataKey="supply" stroke={T.green} fill={T.green} fillOpacity={0.2} />
                <Legend />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:16 }}>
            <h3 style={{ fontSize:14, fontWeight:600, color:T.navy, marginBottom:12 }}>Skills Gap Table</h3>
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead><tr>{['Skill','Demand %','Supply %','Gap'].map(h => <th key={h} style={{ padding:'8px 12px', textAlign:'left', borderBottom:`2px solid ${T.border}`, fontFamily:T.mono, fontSize:11, color:T.navy }}>{h}</th>)}</tr></thead>
              <tbody>{SKILLS_GAP.map((s, i) => (
                <tr key={i} style={{ borderBottom:`1px solid ${T.border}` }}>
                  <td style={{ padding:'8px 12px', fontSize:13 }}>{s.skill}</td>
                  <td style={{ padding:'8px 12px', fontSize:13, fontFamily:T.mono }}>{s.demand}</td>
                  <td style={{ padding:'8px 12px', fontSize:13, fontFamily:T.mono }}>{s.supply}</td>
                  <td style={{ padding:'8px 12px', fontSize:13, fontFamily:T.mono, color:T.red, fontWeight:600 }}>{s.demand - s.supply}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Training ROI */}
      {tab === 3 && (
        <div>
          <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:16, marginBottom:16 }}>
            <h3 style={{ fontSize:14, fontWeight:600, color:T.navy, marginBottom:12 }}>Training Programme ROI</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={ROI_DATA}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="programme" tick={{ fontSize:10, fontFamily:T.mono, angle:-20, textAnchor:'end' }} height={60} />
                <YAxis tick={{ fontSize:11, fontFamily:T.mono }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="cost" fill={T.red} name="Cost ($)" />
                <Bar dataKey="avgWageGain" fill={T.green} name="Annual Wage Gain ($)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:16 }}>
            <h3 style={{ fontSize:14, fontWeight:600, color:T.navy, marginBottom:12 }}>ROI & Payback Period</h3>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={ROI_DATA}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="programme" tick={{ fontSize:10, fontFamily:T.mono, angle:-20, textAnchor:'end' }} height={60} />
                <YAxis yAxisId="left" tick={{ fontSize:11, fontFamily:T.mono }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize:11, fontFamily:T.mono }} />
                <Tooltip />
                <Legend />
                <Line yAxisId="left" dataKey="roi" stroke={T.gold} strokeWidth={2} name="ROI %" dot={{ r:4 }} />
                <Line yAxisId="right" dataKey="payback" stroke={T.navy} strokeWidth={2} name="Payback (yrs)" dot={{ r:4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Tab 4: Regional Employment Impact */}
      {tab === 4 && (
        <div>
          <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:16, overflowX:'auto', marginBottom:16 }}>
            <h3 style={{ fontSize:14, fontWeight:600, color:T.navy, marginBottom:12 }}>Regional Overview</h3>
            <table style={{ width:'100%', borderCollapse:'collapse', minWidth:900 }}>
              <thead><tr>
                {hdr('region','Region')}{hdr('workers','Workers')}{hdr('enrolled','Enrolled')}{hdr('completion','Compl%')}{hdr('placement','Place%')}{hdr('timeToEmploy','Time(mo)')}{hdr('pathway','Pathway')}
              </tr></thead>
              <tbody>{sorted.map((r, i) => (
                <tr key={i} style={{ borderBottom:`1px solid ${T.border}`, background:i%2===0?'transparent':T.bg }}>
                  <td style={{ padding:'8px 12px', fontSize:13, fontWeight:600 }}>{r.region}</td>
                  <td style={{ padding:'8px 12px', fontSize:13, fontFamily:T.mono }}>{r.workers.toLocaleString()}</td>
                  <td style={{ padding:'8px 12px', fontSize:13, fontFamily:T.mono }}>{r.enrolled.toLocaleString()}</td>
                  <td style={{ padding:'8px 12px', fontSize:13, fontFamily:T.mono, color:r.completion>=75?T.green:r.completion>=60?T.amber:T.red }}>{r.completion}%</td>
                  <td style={{ padding:'8px 12px', fontSize:13, fontFamily:T.mono, color:r.placement>=70?T.green:r.placement>=50?T.amber:T.red }}>{r.placement}%</td>
                  <td style={{ padding:'8px 12px', fontSize:13, fontFamily:T.mono }}>{r.timeToEmploy}</td>
                  <td style={{ padding:'8px 12px', fontSize:13 }}>{r.pathway}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
          <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:16 }}>
            <h3 style={{ fontSize:14, fontWeight:600, color:T.navy, marginBottom:12 }}>Time to Employment by Region</h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={sorted}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="region" tick={{ fontSize:9, fontFamily:T.mono, angle:-30, textAnchor:'end' }} height={60} />
                <YAxis tick={{ fontSize:11, fontFamily:T.mono }} label={{ value:'Months', angle:-90, position:'insideLeft', style:{ fontSize:11 } }} />
                <Tooltip />
                <Bar dataKey="timeToEmploy" name="Months to Employment">{sorted.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}</Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Tab 5: Case Studies */}
      {tab === 5 && (
        <div>
          {CASES.map((c, i) => (
            <div key={i} style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:20, marginBottom:16 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:12, flexWrap:'wrap' }}>
                <div>
                  <h3 style={{ fontSize:16, fontWeight:700, color:T.navy, margin:0 }}>{c.title}</h3>
                  <span style={{ fontFamily:T.mono, fontSize:11, color:T.textMut }}>{c.region} · {c.workers} workers</span>
                </div>
                <span style={{ padding:'4px 10px', borderRadius:4, background:T.green+'15', color:T.green, fontFamily:T.mono, fontSize:11 }}>Completed</span>
              </div>
              <div style={{ marginTop:12, padding:12, background:T.bg, borderRadius:6 }}>
                <div style={{ fontSize:13, color:T.textSec, marginBottom:4 }}><strong>Outcome:</strong> {c.outcome}</div>
                <div style={{ fontSize:13, color:T.textSec }}><strong>Key Highlight:</strong> {c.highlight}</div>
              </div>
            </div>
          ))}
          <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:16 }}>
            <h3 style={{ fontSize:14, fontWeight:600, color:T.navy, marginBottom:12 }}>Comparative Case Outcomes</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={CASES}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="title" tick={{ fontSize:10, fontFamily:T.mono }} />
                <YAxis tick={{ fontSize:11, fontFamily:T.mono }} />
                <Tooltip />
                <Bar dataKey="workers" fill={T.navy} name="Workers in Programme" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Reference Callout */}
      <div style={{ marginTop:24, padding:16, background:T.navy+'08', border:`1px solid ${T.navy}20`, borderRadius:8 }}>
        <div style={{ fontFamily:T.mono, fontSize:11, color:T.navy, fontWeight:600, marginBottom:4 }}>REFERENCE DATA</div>
        <div style={{ fontSize:12, color:T.textSec, lineHeight:1.6 }}>
          ILO World Employment and Social Outlook 2024 · ILO Just Transition Centre Guidelines · IRENA Renewable Energy and Jobs Annual Review 2024 · World Bank Just Transition Support Facility · European Commission Just Transition Mechanism reports
        </div>
      </div>
    </div>
  );
}
