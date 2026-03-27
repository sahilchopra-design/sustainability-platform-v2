import React, { useState } from 'react';
import {
  AreaChart, Area, BarChart, Bar, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';

const T = {
  bg:'#0f172a', surface:'#1e293b', border:'#334155', navy:'#1e3a5f',
  gold:'#f59e0b', sage:'#10b981', text:'#f1f5f9', textSec:'#94a3b8',
  textMut:'#64748b', red:'#ef4444', green:'#10b981', amber:'#f59e0b',
  teal:'#14b8a6', font:"'Inter',sans-serif"
};
const ACCENT = '#f97316';
const tip = {
  contentStyle:{ background:T.surface, border:'1px solid '+T.border, borderRadius:8, color:T.text },
  labelStyle:{ color:T.textSec }
};

const sr = s => { let x = Math.sin(s+1)*10000; return x - Math.floor(x); };

const TABS = ['Overview','Fund Tracker','Worker & Community','Policy Frameworks','Finance Gap'];

const REGIONS = [
  { region:'European Union', fundSize:55.0, workersRisk:12.4, coalDep:18, ilo:92 },
  { region:'Sub-Saharan Africa', fundSize:8.2, workersRisk:45.0, coalDep:62, ilo:54 },
  { region:'South Asia', fundSize:12.6, workersRisk:210.0, coalDep:71, ilo:48 },
  { region:'East Asia & Pacific', fundSize:22.4, workersRisk:180.0, coalDep:65, ilo:61 },
  { region:'Latin America', fundSize:9.8, workersRisk:38.0, coalDep:24, ilo:72 },
  { region:'Middle East & N. Africa', fundSize:4.1, workersRisk:22.0, coalDep:11, ilo:43 },
  { region:'North America', fundSize:48.0, workersRisk:1.8, coalDep:9, ilo:84 },
  { region:'Central & Eastern Europe', fundSize:18.3, workersRisk:14.6, coalDep:44, ilo:77 },
];

const FLOWS = Array.from({ length:24 }, (_, i) => ({
  month: `M${i+1}`,
  committed: +(4.2 + sr(i*3)*6 + i*0.18).toFixed(2),
  disbursed: +(2.1 + sr(i*3+1)*3.5 + i*0.09).toFixed(2),
}));

const FUNDS = [
  { name:'EU Just Transition Fund', size:55.0, region:'European Union', beneficiaries:12.4, disburse:38, status:'Active' },
  { name:'UK Just Transition', size:3.2, region:'United Kingdom', beneficiaries:0.8, disburse:22, status:'Active' },
  { name:'SA Presidential Climate Commission', size:4.7, region:'South Africa', beneficiaries:4.2, disburse:14, status:'Active' },
  { name:'ILO Transition Fund', size:1.1, region:'Global', beneficiaries:18.0, disburse:61, status:'Active' },
  { name:'GCF JT Window', size:2.8, region:'Global', beneficiaries:25.0, disburse:19, status:'Active' },
  { name:'Asian Development Bank JT', size:8.5, region:'Asia-Pacific', beneficiaries:55.0, disburse:27, status:'Active' },
  { name:'Chile Green Hydrogen Fund', size:1.6, region:'Chile', beneficiaries:0.3, disburse:8, status:'Pilot' },
  { name:'India Coal Worker Fund', size:5.3, region:'India', beneficiaries:62.0, disburse:11, status:'Active' },
  { name:'US IRA Communities', size:48.0, region:'North America', beneficiaries:1.8, disburse:31, status:'Active' },
  { name:'Colombia Energy Transition', size:0.9, region:'Colombia', beneficiaries:0.6, disburse:5, status:'Pilot' },
];

const SECTORS = [
  { sector:'Coal Mining', workers:250.0, retrainCost:22.4, timeline:8, communityFund:18.0, union:78 },
  { sector:'Steel', workers:80.0, retrainCost:14.8, timeline:10, communityFund:6.2, union:82 },
  { sector:'Cement', workers:40.0, retrainCost:11.2, timeline:9, communityFund:3.1, union:65 },
  { sector:'Auto Manufacturing', workers:55.0, retrainCost:18.6, timeline:7, communityFund:4.8, union:88 },
  { sector:'Oil Refining', workers:35.0, retrainCost:24.1, timeline:12, communityFund:5.5, union:74 },
  { sector:'Shipping', workers:28.0, retrainCost:16.3, timeline:8, communityFund:2.4, union:69 },
  { sector:'Agriculture', workers:200.0, retrainCost:8.7, timeline:6, communityFund:14.0, union:41 },
  { sector:'Textiles', workers:112.0, retrainCost:6.4, timeline:5, communityFund:7.8, union:38 },
];

const FRAMEWORKS = [
  { name:'ILO Just Transition Guidelines', jurisdiction:'Global', year:2015, countries:187, workersCov:3200, score:74,
    principles:['Social dialogue as cornerstone','Decent work & labour rights','Green economy linkage'] },
  { name:'EU Green Deal JT Mechanism', jurisdiction:'European Union', year:2020, countries:27, workersCov:12, score:88,
    principles:['Territorial just transition plans','Coal & carbon-intensive regions','Blended finance instruments'] },
  { name:'Paris Agreement Art.2.1c', jurisdiction:'Global', year:2015, countries:196, workersCov:3800, score:61,
    principles:['Climate-consistent finance flows','Adaptation & mitigation balance','Developing nation support'] },
  { name:'African Union JT Framework', jurisdiction:'Africa', year:2022, countries:55, workersCov:420, score:42,
    principles:['Fossil fuel dependency management','Domestic resource mobilisation','Regional solidarity'] },
  { name:'G7 JT Partnership (JETP)', jurisdiction:'G7+', year:2021, countries:38, workersCov:280, score:55,
    principles:['Country-led transition plans','$8.5bn South Africa deal model','Blended public-private finance'] },
  { name:'UN SDG 8 Decent Work', jurisdiction:'Global', year:2015, countries:193, workersCov:3500, score:67,
    principles:['Full productive employment','Labour rights & social protection','Youth employment emphasis'] },
];

const GAP_REGIONS = [
  { region:'EU', required:42, committed:38 },
  { region:'Africa', required:95, committed:12 },
  { region:'Asia-Pacific', required:380, committed:88 },
  { region:'Latin America', required:72, committed:18 },
  { region:'Middle East', required:38, committed:8 },
  { region:'North America', required:55, committed:48 },
];

const INSTRUMENTS = [
  { instrument:'Green Bonds', mobilisation:420, suitability:82 },
  { instrument:'Blended Finance', mobilisation:185, suitability:91 },
  { instrument:'MDB Loans', mobilisation:310, suitability:78 },
  { instrument:'Carbon Revenue', mobilisation:95, suitability:64 },
  { instrument:'Public Grants', mobilisation:230, suitability:88 },
  { instrument:'Insurance', mobilisation:58, suitability:55 },
];

const card = (label, val) => (
  <div key={label} style={{ background:T.surface, border:'1px solid '+T.border, borderRadius:10, padding:'18px 22px', flex:1, minWidth:160 }}>
    <div style={{ color:T.textSec, fontSize:12, marginBottom:6 }}>{label}</div>
    <div style={{ color:ACCENT, fontSize:22, fontWeight:700 }}>{val}</div>
  </div>
);

const badge = (status) => {
  const c = status === 'Active' ? T.green : T.amber;
  return <span style={{ background:c+'22', color:c, borderRadius:4, padding:'2px 8px', fontSize:11, fontWeight:600 }}>{status}</span>;
};

export default function JustTransitionFinancePage() {
  const [tab, setTab] = useState(0);

  return (
    <div style={{ background:T.bg, minHeight:'100vh', fontFamily:T.font, color:T.text, padding:'28px 32px' }}>
      <div style={{ marginBottom:24 }}>
        <h1 style={{ margin:0, fontSize:24, fontWeight:700 }}>Just Transition Finance <span style={{ color:ACCENT }}>EP-AD1</span></h1>
        <p style={{ color:T.textSec, margin:'6px 0 0', fontSize:14 }}>
          Tracking finance flows, worker impacts and policy frameworks for an equitable low-carbon transition.
        </p>
      </div>

      {/* Tab bar */}
      <div style={{ display:'flex', gap:4, borderBottom:'1px solid '+T.border, marginBottom:24 }}>
        {TABS.map((t,i) => (
          <button key={t} onClick={() => setTab(i)} style={{
            background:'none', border:'none', color: i===tab ? T.text : T.textSec,
            fontFamily:T.font, fontSize:13, fontWeight: i===tab ? 700 : 400,
            padding:'10px 16px', cursor:'pointer',
            borderBottom: i===tab ? '2px solid '+ACCENT : '2px solid transparent'
          }}>{t}</button>
        ))}
      </div>

      {/* TAB 0 — Overview */}
      {tab === 0 && (
        <div>
          <div style={{ display:'flex', gap:14, marginBottom:24, flexWrap:'wrap' }}>
            {card('Annual Finance Need','$2.4T')}
            {card('JT Funds Active','45')}
            {card('Workers Affected','800M')}
            {card('ILO Guidelines Since','2015')}
          </div>
          <div style={{ background:T.surface, border:'1px solid '+T.border, borderRadius:10, padding:20, marginBottom:24 }}>
            <div style={{ fontWeight:600, marginBottom:14 }}>Regional Just Transition Overview</div>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
              <thead>
                <tr style={{ color:T.textSec, borderBottom:'1px solid '+T.border }}>
                  {['Region','Fund Size ($bn)','Workers at Risk (M)','Coal Dep. %','ILO Score'].map(h => (
                    <th key={h} style={{ textAlign:'left', padding:'6px 10px', fontWeight:500 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {REGIONS.map((r,i) => (
                  <tr key={r.region} style={{ borderBottom:'1px solid '+T.border+'55', background: i%2===0 ? 'transparent' : T.bg+'88' }}>
                    <td style={{ padding:'8px 10px', fontWeight:500 }}>{r.region}</td>
                    <td style={{ padding:'8px 10px', color:ACCENT }}>{r.fundSize.toFixed(1)}</td>
                    <td style={{ padding:'8px 10px' }}>{r.workersRisk.toFixed(1)}</td>
                    <td style={{ padding:'8px 10px', color: r.coalDep>50 ? T.red : T.amber }}>{r.coalDep}%</td>
                    <td style={{ padding:'8px 10px', color: r.ilo>75 ? T.green : r.ilo>55 ? T.amber : T.red }}>{r.ilo}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ background:T.surface, border:'1px solid '+T.border, borderRadius:10, padding:20 }}>
            <div style={{ fontWeight:600, marginBottom:14 }}>24-Month JT Finance Flows ($bn)</div>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={FLOWS} margin={{ top:5, right:20, left:0, bottom:5 }}>
                <defs>
                  <linearGradient id="gComm" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={ACCENT} stopOpacity={0.3}/>
                    <stop offset="95%" stopColor={ACCENT} stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="gDisb" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={T.green} stopOpacity={0.3}/>
                    <stop offset="95%" stopColor={T.green} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="month" tick={{ fill:T.textMut, fontSize:11 }} />
                <YAxis tick={{ fill:T.textMut, fontSize:11 }} />
                <Tooltip {...tip} />
                <Legend wrapperStyle={{ color:T.textSec, fontSize:12 }} />
                <Area type="monotone" dataKey="committed" stroke={ACCENT} fill="url(#gComm)" name="Committed" strokeWidth={2} />
                <Area type="monotone" dataKey="disbursed" stroke={T.green} fill="url(#gDisb)" name="Disbursed" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* TAB 1 — Fund Tracker */}
      {tab === 1 && (
        <div>
          <div style={{ background:T.surface, border:'1px solid '+T.border, borderRadius:10, padding:20, marginBottom:24 }}>
            <div style={{ fontWeight:600, marginBottom:14 }}>Fund Size by Institution ($bn)</div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={FUNDS} margin={{ top:5, right:20, left:0, bottom:60 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="name" tick={{ fill:T.textMut, fontSize:10 }} angle={-35} textAnchor="end" interval={0} />
                <YAxis tick={{ fill:T.textMut, fontSize:11 }} />
                <Tooltip {...tip} />
                <Bar dataKey="size" name="Fund Size ($bn)" radius={[4,4,0,0]}>
                  {FUNDS.map((f,i) => (
                    <Cell key={i} fill={f.size > 10 ? T.green : f.size > 2 ? T.amber : ACCENT} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ background:T.surface, border:'1px solid '+T.border, borderRadius:10, padding:20 }}>
            <div style={{ fontWeight:600, marginBottom:14 }}>Active Fund Directory</div>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
              <thead>
                <tr style={{ color:T.textSec, borderBottom:'1px solid '+T.border }}>
                  {['Fund','Size ($bn)','Region','Beneficiaries (M)','Disburse %','Status'].map(h => (
                    <th key={h} style={{ textAlign:'left', padding:'6px 10px', fontWeight:500 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {FUNDS.map((f,i) => (
                  <tr key={f.name} style={{ borderBottom:'1px solid '+T.border+'55', background: i%2===0 ? 'transparent' : T.bg+'88' }}>
                    <td style={{ padding:'8px 10px', fontWeight:500 }}>{f.name}</td>
                    <td style={{ padding:'8px 10px', color:ACCENT }}>{f.size.toFixed(1)}</td>
                    <td style={{ padding:'8px 10px', color:T.textSec }}>{f.region}</td>
                    <td style={{ padding:'8px 10px' }}>{f.beneficiaries.toFixed(1)}</td>
                    <td style={{ padding:'8px 10px' }}>{f.disburse}%</td>
                    <td style={{ padding:'8px 10px' }}>{badge(f.status)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2 — Worker & Community */}
      {tab === 2 && (
        <div>
          <div style={{ display:'flex', gap:14, marginBottom:24, flexWrap:'wrap' }}>
            {card('Total Workers at Risk','800M')}
            {card('Avg Retraining Cost','$18k/worker')}
            {card('Successful Transition Rate','34%')}
          </div>
          <div style={{ background:T.surface, border:'1px solid '+T.border, borderRadius:10, padding:20, marginBottom:24 }}>
            <div style={{ fontWeight:600, marginBottom:14 }}>Workers at Risk by Sector (Millions)</div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={SECTORS} margin={{ top:5, right:20, left:0, bottom:5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="sector" tick={{ fill:T.textMut, fontSize:11 }} />
                <YAxis tick={{ fill:T.textMut, fontSize:11 }} />
                <Tooltip {...tip} />
                <Bar dataKey="workers" name="Workers (M)" radius={[4,4,0,0]}>
                  {SECTORS.map((s,i) => (
                    <Cell key={i} fill={s.workers > 150 ? T.red : s.workers > 60 ? T.amber : ACCENT} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ background:T.surface, border:'1px solid '+T.border, borderRadius:10, padding:20 }}>
            <div style={{ fontWeight:600, marginBottom:14 }}>Sector Transition Detail</div>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
              <thead>
                <tr style={{ color:T.textSec, borderBottom:'1px solid '+T.border }}>
                  {['Sector','Workers (M)','Retrain Cost ($bn)','Timeline (yrs)','Community Fund ($bn)','Union Score'].map(h => (
                    <th key={h} style={{ textAlign:'left', padding:'6px 10px', fontWeight:500 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {SECTORS.map((s,i) => (
                  <tr key={s.sector} style={{ borderBottom:'1px solid '+T.border+'55', background: i%2===0 ? 'transparent' : T.bg+'88' }}>
                    <td style={{ padding:'8px 10px', fontWeight:500 }}>{s.sector}</td>
                    <td style={{ padding:'8px 10px', color: s.workers>150?T.red:ACCENT }}>{s.workers.toFixed(1)}</td>
                    <td style={{ padding:'8px 10px' }}>{s.retrainCost.toFixed(1)}</td>
                    <td style={{ padding:'8px 10px', color:T.textSec }}>{s.timeline}</td>
                    <td style={{ padding:'8px 10px' }}>{s.communityFund.toFixed(1)}</td>
                    <td style={{ padding:'8px 10px', color: s.union>70?T.green:T.amber }}>{s.union}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3 — Policy Frameworks */}
      {tab === 3 && (
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          {FRAMEWORKS.map(f => (
            <div key={f.name} style={{ background:T.surface, border:'1px solid '+T.border, borderRadius:10, padding:20 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10 }}>
                <div>
                  <div style={{ fontWeight:700, fontSize:15, marginBottom:4 }}>{f.name}</div>
                  <div style={{ color:T.textSec, fontSize:12 }}>{f.jurisdiction} · Adopted {f.year} · {f.countries} countries · {f.workersCov}M workers</div>
                </div>
                <div style={{ color:ACCENT, fontWeight:700, fontSize:18 }}>{f.score}</div>
              </div>
              <ul style={{ margin:'0 0 12px 0', paddingLeft:20, color:T.textSec, fontSize:13 }}>
                {f.principles.map(p => <li key={p} style={{ marginBottom:3 }}>{p}</li>)}
              </ul>
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                <div style={{ flex:1, background:T.border, borderRadius:4, height:7 }}>
                  <div style={{ width:f.score+'%', background: f.score>75?T.green:f.score>55?T.amber:T.red, height:'100%', borderRadius:4 }} />
                </div>
                <span style={{ color:T.textSec, fontSize:12, minWidth:50 }}>Impl. {f.score}%</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 4 — Finance Gap */}
      {tab === 4 && (
        <div>
          <div style={{ display:'flex', gap:14, marginBottom:24, flexWrap:'wrap' }}>
            {card('Total Annual Gap','$1.6T/yr')}
            {card('Adaptation Share','35%')}
            {card('Community Investment','22%')}
          </div>
          <div style={{ background:T.surface, border:'1px solid '+T.border, borderRadius:10, padding:20, marginBottom:24 }}>
            <div style={{ fontWeight:600, marginBottom:14 }}>Required vs Committed Finance by Region ($bn)</div>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={GAP_REGIONS} margin={{ top:5, right:20, left:0, bottom:5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="region" tick={{ fill:T.textMut, fontSize:12 }} />
                <YAxis tick={{ fill:T.textMut, fontSize:11 }} />
                <Tooltip {...tip} />
                <Legend wrapperStyle={{ color:T.textSec, fontSize:12 }} />
                <Bar dataKey="required" name="Required ($bn)" fill={T.red} radius={[4,4,0,0]} opacity={0.85} />
                <Bar dataKey="committed" name="Committed ($bn)" fill={T.green} radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ background:T.surface, border:'1px solid '+T.border, borderRadius:10, padding:20 }}>
            <div style={{ fontWeight:600, marginBottom:14 }}>Financing Instruments</div>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
              <thead>
                <tr style={{ color:T.textSec, borderBottom:'1px solid '+T.border }}>
                  {['Instrument','Mobilisation Capacity ($bn)','Suitability Score'].map(h => (
                    <th key={h} style={{ textAlign:'left', padding:'6px 10px', fontWeight:500 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {INSTRUMENTS.map((ins,i) => (
                  <tr key={ins.instrument} style={{ borderBottom:'1px solid '+T.border+'55', background: i%2===0 ? 'transparent' : T.bg+'88' }}>
                    <td style={{ padding:'8px 10px', fontWeight:500 }}>{ins.instrument}</td>
                    <td style={{ padding:'8px 10px', color:ACCENT }}>{ins.mobilisation}</td>
                    <td style={{ padding:'8px 10px' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                        <div style={{ flex:1, background:T.border, borderRadius:4, height:6 }}>
                          <div style={{ width:ins.suitability+'%', background: ins.suitability>80?T.green:ins.suitability>60?T.amber:T.red, height:'100%', borderRadius:4 }} />
                        </div>
                        <span style={{ color:T.textSec, fontSize:12, minWidth:30 }}>{ins.suitability}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
