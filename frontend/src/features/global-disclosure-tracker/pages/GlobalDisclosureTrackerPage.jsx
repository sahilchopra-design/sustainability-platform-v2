import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, PieChart, Pie, Cell, LineChart, Line } from 'recharts';

const T = { bg:'#f6f4f0', surface:'#ffffff', border:'#e5e0d8', navy:'#1b3a5c', navyL:'#2c5a8c', gold:'#c5a96a', textSec:'#5c6b7e', textMut:'#9aa3ae', red:'#dc2626', green:'#16a34a', amber:'#d97706', blue:'#2563eb', orange:'#ea580c', purple:'#7c3aed', teal:'#0891b2', sage:'#5a8a6a', font:"'DM Sans','SF Pro Display',system-ui,sans-serif", mono:"'JetBrains Mono','SF Mono','Fira Code',monospace" };
const TABS = ['Jurisdiction Map','Requirement Cross-Walk','Gap Analysis','Timeline & Deadlines','Overlap Efficiency','Compliance Cost Estimator'];

const JURISDICTIONS = [
  { code:'EU', name:'EU (CSRD/ESRS)', requirements:35, mandatory:true, effective:'Jan 2024', scope:'50,000+ companies', overlap:82, uniqueReqs:6, costEstKUsd:450 },
  { code:'UK', name:'UK (TPT/SDR)', requirements:22, mandatory:true, effective:'Apr 2024', scope:'1,300+ companies', overlap:72, uniqueReqs:4, costEstKUsd:280 },
  { code:'US', name:'US (SEC Climate)', requirements:18, mandatory:true, effective:'Jan 2025', scope:'Public companies', overlap:65, uniqueReqs:5, costEstKUsd:350 },
  { code:'HK', name:'Hong Kong (HKEX)', requirements:20, mandatory:true, effective:'Jan 2025', scope:'Listed companies', overlap:68, uniqueReqs:3, costEstKUsd:220 },
  { code:'SG', name:'Singapore (SGX/MAS)', requirements:16, mandatory:true, effective:'Jul 2025', scope:'Listed + banks', overlap:62, uniqueReqs:2, costEstKUsd:180 },
  { code:'AU', name:'Australia (AASB)', requirements:15, mandatory:true, effective:'Jul 2025', scope:'Group 1+2', overlap:70, uniqueReqs:2, costEstKUsd:200 },
  { code:'JP', name:'Japan (SSBJ)', requirements:18, mandatory:true, effective:'Apr 2025', scope:'Prime market', overlap:75, uniqueReqs:2, costEstKUsd:250 },
  { code:'KR', name:'South Korea', requirements:14, mandatory:true, effective:'Jan 2026', scope:'KOSPI listed', overlap:60, uniqueReqs:2, costEstKUsd:160 },
  { code:'BR', name:'Brazil', requirements:12, mandatory:true, effective:'Jan 2026', scope:'CVM regulated', overlap:55, uniqueReqs:3, costEstKUsd:140 },
  { code:'IN', name:'India (BRSR)', requirements:15, mandatory:true, effective:'Active', scope:'Top 1,000 listed', overlap:48, uniqueReqs:5, costEstKUsd:120 },
  { code:'CA', name:'Canada', requirements:14, mandatory:false, effective:'TBD', scope:'Federally regulated', overlap:65, uniqueReqs:2, costEstKUsd:180 },
  { code:'ZA', name:'South Africa', requirements:12, mandatory:true, effective:'Active', scope:'JSE listed', overlap:52, uniqueReqs:3, costEstKUsd:100 },
];

const DEADLINES = [
  { date:'Jan 2024', jurisdiction:'EU (CSRD Wave 1)', type:'Mandatory' },
  { date:'Apr 2024', jurisdiction:'UK (TPT/SDR)', type:'Mandatory' },
  { date:'Jan 2025', jurisdiction:'US (SEC) / HK (HKEX)', type:'Mandatory' },
  { date:'Apr 2025', jurisdiction:'Japan (SSBJ)', type:'Mandatory' },
  { date:'Jul 2025', jurisdiction:'Singapore / Australia', type:'Mandatory' },
  { date:'Jan 2026', jurisdiction:'South Korea / Brazil', type:'Mandatory' },
  { date:'Jan 2025', jurisdiction:'EU (CSRD Wave 2)', type:'Mandatory' },
];

const CROSSWALK = [
  { requirement:'GHG Scope 1+2', eu:true, uk:true, us:true, hk:true, sg:true, au:true, jp:true },
  { requirement:'GHG Scope 3', eu:true, uk:true, us:true, hk:true, sg:false, au:true, jp:true },
  { requirement:'Transition Plan', eu:true, uk:true, us:false, hk:true, sg:true, au:true, jp:false },
  { requirement:'Scenario Analysis', eu:true, uk:true, us:true, hk:true, sg:true, au:true, jp:true },
  { requirement:'Financial Effects', eu:true, uk:true, us:true, hk:false, sg:false, au:true, jp:true },
  { requirement:'Double Materiality', eu:true, uk:false, us:false, hk:false, sg:false, au:false, jp:false },
  { requirement:'Biodiversity', eu:true, uk:false, us:false, hk:false, sg:false, au:false, jp:false },
  { requirement:'Social Metrics', eu:true, uk:true, us:false, hk:false, sg:true, au:false, jp:false },
];

export default function GlobalDisclosureTrackerPage() {
  const [tab, setTab] = useState(0);
  const [watchlist, setWatchlist] = useState(false);

  const card = (title, value, sub, color) => (
    <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:16, flex:1, minWidth:150 }}>
      <div style={{ fontFamily:T.mono, fontSize:11, color:T.textMut, textTransform:'uppercase', letterSpacing:1 }}>{title}</div>
      <div style={{ fontSize:28, fontWeight:700, color:color||T.navy, marginTop:4 }}>{value}</div>
      {sub && <div style={{ fontSize:12, color:T.textSec, marginTop:2 }}>{sub}</div>}
    </div>
  );

  return (
    <div style={{ fontFamily:T.font, background:T.bg, minHeight:'100vh', padding:24 }}>
      <div style={{ background:T.surface, border:`2px solid ${T.gold}`, borderRadius:12, padding:'20px 28px', marginBottom:20 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:12 }}>
          <div>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <span style={{ background:T.navy, color:'#fff', fontFamily:T.mono, fontSize:11, padding:'3px 10px', borderRadius:4 }}>EP-CR2</span>
              <span style={{ fontFamily:T.mono, fontSize:11, color:T.textMut }}>GLOBAL DISCLOSURE TRACKER</span>
            </div>
            <h1 style={{ fontSize:22, fontWeight:700, color:T.navy, margin:'6px 0 2px' }}>Global Climate Disclosure Cross-Jurisdiction Tracker</h1>
            <p style={{ color:T.textSec, fontSize:13, margin:0 }}>12 jurisdictions · Cross-walk matrix · Gap analysis · Compliance cost</p>
          </div>
          <div style={{ display:'flex', gap:8 }}>
            <button onClick={() => setWatchlist(!watchlist)} style={{ padding:'6px 14px', borderRadius:6, border:`1px solid ${watchlist?T.gold:T.border}`, background:watchlist?T.gold+'18':T.surface, color:T.navy, fontFamily:T.font, fontSize:12, cursor:'pointer' }}>{watchlist?'★ Watchlisted':'☆ Watchlist'}</button>
            <button style={{ padding:'6px 14px', borderRadius:6, border:`1px solid ${T.border}`, background:T.surface, color:T.navy, fontFamily:T.font, fontSize:12, cursor:'pointer' }}>⬇ Export</button>
            <button style={{ padding:'6px 14px', borderRadius:6, border:`1px solid ${T.border}`, background:T.surface, color:T.navy, fontFamily:T.font, fontSize:12, cursor:'pointer' }}>🔖 Bookmark</button>
          </div>
        </div>
      </div>

      <div style={{ display:'flex', gap:4, marginBottom:20, flexWrap:'wrap' }}>
        {TABS.map((t, i) => <button key={i} onClick={() => setTab(i)} style={{ padding:'8px 16px', borderRadius:6, border:`1px solid ${tab===i?T.gold:T.border}`, background:tab===i?T.gold+'18':T.surface, color:tab===i?T.navy:T.textSec, fontWeight:tab===i?600:400, fontFamily:T.font, fontSize:13, cursor:'pointer' }}>{t}</button>)}
      </div>

      {tab === 0 && (
        <div>
          <div style={{ display:'flex', gap:16, marginBottom:20, flexWrap:'wrap' }}>
            {card('Jurisdictions', '12', 'Active/upcoming', T.navy)}
            {card('Total Requirements', JURISDICTIONS.reduce((s,j)=>s+j.requirements,0).toString(), 'Across all regimes', T.gold)}
            {card('Mandatory Regimes', JURISDICTIONS.filter(j=>j.mandatory).length.toString(), 'Binding requirements', T.red)}
            {card('Avg Overlap', Math.round(JURISDICTIONS.reduce((s,j)=>s+j.overlap,0)/12)+'%', 'Cross-jurisdiction', T.green)}
          </div>
          <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:16 }}>
            <h3 style={{ fontSize:14, fontWeight:600, color:T.navy, marginBottom:12 }}>Requirements by Jurisdiction</h3>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={JURISDICTIONS} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis type="number" tick={{ fontSize:11, fontFamily:T.mono }}/><YAxis type="category" dataKey="name" width={160} tick={{ fontSize:9, fontFamily:T.mono }}/><Tooltip/><Legend/>
                <Bar dataKey="requirements" fill={T.navy} name="Total Requirements"/>
                <Bar dataKey="uniqueReqs" fill={T.gold} name="Unique Requirements"/>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {tab === 1 && (
        <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:16, overflowX:'auto' }}>
          <h3 style={{ fontSize:14, fontWeight:600, color:T.navy, marginBottom:12 }}>Cross-Walk Matrix</h3>
          <table style={{ width:'100%', borderCollapse:'collapse', minWidth:800 }}>
            <thead><tr><th style={{ padding:'8px 12px', textAlign:'left', borderBottom:`2px solid ${T.border}`, fontFamily:T.mono, fontSize:11, color:T.navy }}>Requirement</th>
              {['EU','UK','US','HK','SG','AU','JP'].map(j=><th key={j} style={{ padding:'8px 12px', textAlign:'center', borderBottom:`2px solid ${T.border}`, fontFamily:T.mono, fontSize:11, color:T.navy }}>{j}</th>)}
            </tr></thead>
            <tbody>{CROSSWALK.map((r,i)=>(
              <tr key={i} style={{ borderBottom:`1px solid ${T.border}` }}>
                <td style={{ padding:'8px 12px', fontSize:13, fontWeight:600 }}>{r.requirement}</td>
                {[r.eu,r.uk,r.us,r.hk,r.sg,r.au,r.jp].map((v,j)=><td key={j} style={{ padding:'8px 12px', textAlign:'center', fontSize:16 }}>{v?<span style={{ color:T.green }}>&#10003;</span>:<span style={{ color:T.textMut }}>&#8212;</span>}</td>)}
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}

      {tab === 2 && (
        <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:16 }}>
          <h3 style={{ fontSize:14, fontWeight:600, color:T.navy, marginBottom:12 }}>Unique Requirements per Jurisdiction (Gap)</h3>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={JURISDICTIONS.sort((a,b)=>b.uniqueReqs-a.uniqueReqs)}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="code" tick={{ fontSize:11, fontFamily:T.mono }}/><YAxis tick={{ fontSize:11, fontFamily:T.mono }}/><Tooltip/>
              <Bar dataKey="uniqueReqs" name="Unique Reqs">{JURISDICTIONS.sort((a,b)=>b.uniqueReqs-a.uniqueReqs).map((j,i)=><Cell key={i} fill={j.uniqueReqs>=5?T.red:j.uniqueReqs>=3?T.amber:T.green}/>)}</Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {tab === 3 && (
        <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:16 }}>
          <h3 style={{ fontSize:14, fontWeight:600, color:T.navy, marginBottom:12 }}>Regulatory Timeline & Effective Dates</h3>
          <div style={{ display:'grid', gap:12 }}>
            {DEADLINES.map((d,i)=>(
              <div key={i} style={{ display:'flex', alignItems:'center', gap:16, padding:12, background:T.bg, borderRadius:8, borderLeft:`4px solid ${T.navy}` }}>
                <div style={{ fontFamily:T.mono, fontSize:13, fontWeight:700, color:T.navy, minWidth:80 }}>{d.date}</div>
                <div style={{ flex:1, fontSize:13, color:T.textSec }}>{d.jurisdiction}</div>
                <span style={{ padding:'2px 8px', borderRadius:4, fontSize:11, fontFamily:T.mono, background:d.type==='Mandatory'?T.red+'18':T.amber+'18', color:d.type==='Mandatory'?T.red:T.amber }}>{d.type}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 4 && (
        <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:16 }}>
          <h3 style={{ fontSize:14, fontWeight:600, color:T.navy, marginBottom:12 }}>Overlap % with Other Jurisdictions</h3>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={JURISDICTIONS.sort((a,b)=>b.overlap-a.overlap)}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="code" tick={{ fontSize:11, fontFamily:T.mono }}/><YAxis tick={{ fontSize:11, fontFamily:T.mono }} domain={[0,100]}/><Tooltip/>
              <Bar dataKey="overlap" name="Overlap %">{JURISDICTIONS.sort((a,b)=>b.overlap-a.overlap).map((j,i)=><Cell key={i} fill={j.overlap>=70?T.green:j.overlap>=55?T.gold:T.amber}/>)}</Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {tab === 5 && (
        <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:16 }}>
          <h3 style={{ fontSize:14, fontWeight:600, color:T.navy, marginBottom:12 }}>Estimated Annual Compliance Cost ($K USD)</h3>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={JURISDICTIONS.sort((a,b)=>b.costEstKUsd-a.costEstKUsd)}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="code" tick={{ fontSize:11, fontFamily:T.mono }}/><YAxis tick={{ fontSize:11, fontFamily:T.mono }}/><Tooltip formatter={v=>'$'+v+'K'}/>
              <Bar dataKey="costEstKUsd" name="Cost ($K)">{JURISDICTIONS.sort((a,b)=>b.costEstKUsd-a.costEstKUsd).map((j,i)=><Cell key={i} fill={j.costEstKUsd>=300?T.red:j.costEstKUsd>=200?T.amber:T.green}/>)}</Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div style={{ marginTop:24, padding:16, background:T.navy+'08', border:`1px solid ${T.navy}20`, borderRadius:8 }}>
        <div style={{ fontFamily:T.mono, fontSize:11, color:T.navy, fontWeight:600, marginBottom:4 }}>REFERENCE DATA</div>
        <div style={{ fontSize:12, color:T.textSec, lineHeight:1.6 }}>
          IFRS/ISSB S1+S2 Standards · EFRAG ESRS · SEC Climate Disclosure Rule · HKEX ESG Guide · MAS Environmental Risk Guidelines · AASB S1+S2 · SSBJ Standards · BRSR India
        </div>
      </div>
    </div>
  );
}
