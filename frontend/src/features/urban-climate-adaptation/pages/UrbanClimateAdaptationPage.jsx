import React, { useState, useMemo } from 'react';
import BuiltEnvironmentAdvancedAnalytics from '../../_shared/BuiltEnvironmentAdvancedAnalytics';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  AreaChart, Area, CartesianGrid, Legend, LineChart, Line, ScatterChart, Scatter,
} from 'recharts';

const T = {
  bg: '#f8f6f0', surface: '#ffffff', surfaceH: '#f1ede4',
  border: '#e2ded5', borderL: '#ede9e0',
  navy: '#1e3a5f', gold: '#b8860b',
  sage: '#4d7c5f', teal: '#0f766e',
  text: '#1a1a2e', textSec: '#6b7280', textMut: '#9ca3af',
  red: '#dc2626', green: '#16a34a', amber: '#d97706',
  font: 'DM Sans, sans-serif', mono: 'JetBrains Mono, monospace',
};

const sr = s => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };

const INCOME_GROUPS = ['High Income','Upper-Middle','Lower-Middle','Low Income'];
const REGIONS       = ['Europe','North America','Asia-Pacific','South Asia','Africa','Latin America','Middle East'];
const BOND_TYPES    = ['Green Bond','Blue Bond','Adaptation Bond','Resilience Bond','Municipal Bond'];

const CITIES = [
  'London','New York','Tokyo','Mumbai','Lagos','São Paulo','Cairo',
  'Jakarta','Dhaka','Shanghai','Mexico City','Istanbul','Nairobi',
  'Manila','Karachi','Buenos Aires','Kinshasa','Lima','Bangkok','Accra',
  'Bogotá','Addis Ababa','Dar es Salaam','Casablanca','Ho Chi Minh City',
  'Cape Town','Kolkata','Guadalajara','Abidjan','Kampala',
  'Lahore','Mombasa','Kumasi','Porto Alegre','Chengdu',
  'Yangon','Antananarivo','Khartoum','Douala','Dakar',
  'Maputo','Lusaka','Harare','Conakry','Bamako',
  'Ouagadougou','Ndjamena','Niamey','Freetown','Monrovia',
].map((city, i) => {
  const income  = INCOME_GROUPS[Math.floor(sr(i*7) * INCOME_GROUPS.length)];
  const region  = REGIONS[Math.floor(sr(i*11) * REGIONS.length)];
  const pop     = parseFloat((0.5 + sr(i*3) * 19.5).toFixed(1));    // M people
  const gdpPcap = Math.round(1000 + sr(i*5) * 79000);               // USD

  // Risk scores 0-100
  const heatIsland  = parseFloat((sr(i*13)*100).toFixed(1));
  const floodRisk   = parseFloat((sr(i*17)*100).toFixed(1));
  const waterStress = parseFloat((sr(i*19)*100).toFixed(1));
  const airQual     = parseFloat((sr(i*23)*100).toFixed(1));  // higher = worse
  const composite   = parseFloat((heatIsland*0.30+floodRisk*0.30+waterStress*0.25+airQual*0.15).toFixed(1));

  // Adaptation finance need ($M per 100k people)
  const adaptNeedPc  = parseFloat((50 + composite*2 + sr(i*29)*200).toFixed(0));
  const adaptTotal   = parseFloat((adaptNeedPc * pop * 10).toFixed(0));       // $M total

  // Green bond issuance capacity ($M)
  const bondCap = parseFloat((gdpPcap * pop * 0.002 + sr(i*31)*50).toFixed(0));
  const bondType = BOND_TYPES[Math.floor(sr(i*37) * BOND_TYPES.length)];

  // Resilience rating
  const resScore = parseFloat((100 - composite + gdpPcap/2000).toFixed(1));
  const rating   = resScore >= 70 ? 'AAA/AA' : resScore >= 50 ? 'A/BBB' : resScore >= 35 ? 'BB/B' : 'CCC/D';

  // Adaptation ROI: damage avoided / adapt cost (simplified)
  const damageAvoided = parseFloat((adaptTotal * (0.3 + sr(i*41)*0.4)).toFixed(0));
  const adaptRoi      = adaptTotal > 0 ? parseFloat(((damageAvoided - adaptTotal) / adaptTotal * 100).toFixed(0)) : 0;

  return {
    id:i+1, city, income, region, pop, gdpPcap, heatIsland, floodRisk,
    waterStress, airQual, composite, adaptNeedPc, adaptTotal, bondCap, bondType,
    resScore: Math.min(100, Math.max(0, resScore)), rating, damageAvoided, adaptRoi,
  };
});

const TABS = ['Overview','City Risk Profile','Heat & Air','Flood & Water','Green Finance','Adaptation Pathways','City Benchmarks','Advanced Analytics'];

const KpiCard = ({ label, value, sub, color }) => (
  <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:'16px 20px', flex:1, minWidth:140 }}>
    <div style={{ fontSize:11, color:T.textSec, fontFamily:T.mono, textTransform:'uppercase', letterSpacing:1, marginBottom:6 }}>{label}</div>
    <div style={{ fontSize:24, fontWeight:700, color:color||T.navy }}>{value}</div>
    {sub && <div style={{ fontSize:11, color:T.textMut, marginTop:4 }}>{sub}</div>}
  </div>
);

const Card = ({ title, children, span }) => (
  <div style={{ background:T.surface, borderRadius:8, padding:20, border:`1px solid ${T.border}`, gridColumn:span?'span 2':undefined }}>
    {title && <div style={{ fontSize:13, fontWeight:600, color:T.navy, marginBottom:14 }}>{title}</div>}
    {children}
  </div>
);

const ratingColor = r => r.startsWith('AAA')||r.startsWith('AA') ? T.green : r.startsWith('A') ? T.teal : r.startsWith('BB') ? T.amber : T.red;

export default function UrbanClimateAdaptationPage() {
  const [tab,     setTab]     = useState('Overview');
  const [fRegion, setFRegion] = useState('All');
  const [fIncome, setFIncome] = useState('All');
  const [fRating, setFRating] = useState('All');

  const filtered = useMemo(() => CITIES.filter(c => {
    if (fRegion !== 'All' && c.region !== fRegion) return false;
    if (fIncome !== 'All' && c.income !== fIncome) return false;
    if (fRating !== 'All' && !c.rating.startsWith(fRating)) return false;
    return true;
  }), [fRegion, fIncome, fRating]);

  const n           = filtered.length;
  const totalPop    = filtered.reduce((s,c)=>s+c.pop,0).toFixed(1);
  const totalAdapt  = filtered.reduce((s,c)=>s+c.adaptTotal,0).toFixed(0);
  const avgComposite= n ? (filtered.reduce((s,c)=>s+c.composite,0)/n).toFixed(1) : '0';
  const totalBondCap= filtered.reduce((s,c)=>s+c.bondCap,0).toFixed(0);
  const highRisk    = filtered.filter(c=>c.composite>=70).length;
  const avgRoi      = n ? Math.round(filtered.reduce((s,c)=>s+c.adaptRoi,0)/n) : 0;

  const regionRisk = useMemo(() => REGIONS.map(r => {
    const a = filtered.filter(c=>c.region===r);
    return { name:r.slice(0,10), Composite: a.length ? parseFloat((a.reduce((s,c)=>s+c.composite,0)/a.length).toFixed(1)):0, Count:a.length };
  }), [filtered]);

  const incomeAdapt = useMemo(() => INCOME_GROUPS.map(g => {
    const a = filtered.filter(c=>c.income===g);
    return { name:g.slice(0,12), 'Adapt Need $M': a.length ? parseFloat((a.reduce((s,c)=>s+c.adaptTotal,0)/a.length).toFixed(0)):0, Count:a.length };
  }), [filtered]);

  const heatData = useMemo(() => REGIONS.map(r => {
    const a = filtered.filter(c=>c.region===r);
    return { name:r.slice(0,10), 'Heat Island': a.length ? parseFloat((a.reduce((s,c)=>s+c.heatIsland,0)/a.length).toFixed(1)):0, 'Air Quality': a.length ? parseFloat((a.reduce((s,c)=>s+c.airQual,0)/a.length).toFixed(1)):0 };
  }), [filtered]);

  const floodData = useMemo(() => REGIONS.map(r => {
    const a = filtered.filter(c=>c.region===r);
    return { name:r.slice(0,10), 'Flood Risk': a.length ? parseFloat((a.reduce((s,c)=>s+c.floodRisk,0)/a.length).toFixed(1)):0, 'Water Stress': a.length ? parseFloat((a.reduce((s,c)=>s+c.waterStress,0)/a.length).toFixed(1)):0 };
  }), [filtered]);

  const bondData = useMemo(() => BOND_TYPES.map(b => {
    const a = filtered.filter(c=>c.bondType===b);
    return { name:b.slice(0,16), '$M Capacity': parseFloat(a.reduce((s,c)=>s+c.bondCap,0).toFixed(0)), Cities:a.length };
  }), [filtered]);

  const pathwayData = useMemo(() => [2025,2028,2031,2034,2037,2040].map((yr,i)=>({
    year:yr,
    'Composite Risk': parseFloat((n ? filtered.reduce((s,c)=>s+c.composite,0)/n*(1-i*0.03):0).toFixed(1)),
    'Adapt Funded %': parseFloat(Math.min(100, 15 + i*14).toFixed(0)),
    'Resilience Score': parseFloat((n ? filtered.reduce((s,c)=>s+c.resScore,0)/n*(1+i*0.04):0).toFixed(1)),
  })), [filtered, n]);

  const scatterData = useMemo(() => filtered.map(c=>({ x:c.gdpPcap/1000, y:c.composite, name:c.city })), [filtered]);

  return (
    <div style={{ background:T.bg, minHeight:'100vh', fontFamily:T.font, color:T.text }}>
      <div style={{ background:T.navy, padding:'20px 32px', borderBottom:`3px solid ${T.gold}` }}>
        <div style={{ fontSize:11, color:T.gold, fontFamily:T.mono, letterSpacing:2, marginBottom:4 }}>EP-DE5 · GREEN REAL ESTATE & BUILT ENVIRONMENT</div>
        <div style={{ fontSize:22, fontWeight:700, color:'#fff' }}>Urban Climate Adaptation Finance</div>
        <div style={{ fontSize:13, color:'#94a3b8', marginTop:4 }}>
          50 cities globally · Heat island / Flood / Water stress / Air quality · Adaptation finance need · Green bond capacity · Resilience ratings
        </div>
      </div>

      <div style={{ background:T.surfaceH, borderBottom:`1px solid ${T.border}`, padding:'12px 32px', display:'flex', gap:16, flexWrap:'wrap', alignItems:'center' }}>
        {[['Region',fRegion,setFRegion,['All',...REGIONS]],['Income Group',fIncome,setFIncome,['All',...INCOME_GROUPS]],['Rating',fRating,setFRating,['All','AAA','A','BB','CCC']]].map(([lbl,val,set,opts])=>(
          <label key={lbl} style={{ fontSize:12, color:T.textSec, display:'flex', alignItems:'center', gap:6 }}>
            {lbl}: <select value={val} onChange={e=>set(e.target.value)} style={{ fontSize:12, padding:'3px 8px', borderRadius:4, border:`1px solid ${T.border}`, background:T.surface }}>
              {opts.map(o=><option key={o}>{o}</option>)}
            </select>
          </label>
        ))}
        <span style={{ fontSize:11, color:T.textMut, fontFamily:T.mono }}>{n}/{CITIES.length} cities</span>
      </div>

      <div style={{ display:'flex', gap:14, padding:'20px 32px', flexWrap:'wrap' }}>
        <KpiCard label="Total Population"      value={`${totalPop}M`}         sub={`${n} cities`}          color={T.navy} />
        <KpiCard label="Adapt Finance Need"    value={`$${Number(totalAdapt).toLocaleString()}M`} sub="total gap" color={T.red} />
        <KpiCard label="Avg Composite Risk"    value={`${avgComposite}/100`}   sub="4-hazard weighted"      color={parseFloat(avgComposite)>=70?T.red:parseFloat(avgComposite)>=40?T.amber:T.green} />
        <KpiCard label="Green Bond Capacity"   value={`$${Number(totalBondCap).toLocaleString()}M`} sub="issuance potential" color={T.green} />
        <KpiCard label="High-Risk Cities"      value={highRisk}                sub="composite ≥70"          color={T.red} />
        <KpiCard label="Avg Adaptation ROI"    value={`${avgRoi}%`}            sub="damage avoided / cost"  color={T.teal} />
      </div>

      <div style={{ display:'flex', gap:0, padding:'0 32px', borderBottom:`1px solid ${T.border}`, overflowX:'auto' }}>
        {TABS.map(t=>(
          <button key={t} onClick={()=>setTab(t)} style={{ padding:'10px 18px', fontSize:13, fontWeight:tab===t?700:400, background:'none', border:'none', borderBottom:tab===t?`3px solid ${T.gold}`:'3px solid transparent', color:tab===t?T.navy:T.textSec, cursor:'pointer', whiteSpace:'nowrap' }}>{t}</button>
        ))}
      </div>

      <div style={{ padding:'24px 32px' }}>

        {tab==='Overview' && (
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:24 }}>
            <Card title="Composite Climate Risk by Region">
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={regionRisk}><CartesianGrid strokeDasharray="3 3" stroke={T.borderL} /><XAxis dataKey="name" tick={{fontSize:10}} /><YAxis domain={[0,100]} tick={{fontSize:11}} /><Tooltip /><Bar dataKey="Composite" fill={T.amber} radius={[4,4,0,0]} /></BarChart>
              </ResponsiveContainer>
            </Card>
            <Card title="Adaptation Finance Need by Income Group ($M avg)">
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={incomeAdapt}><CartesianGrid strokeDasharray="3 3" stroke={T.borderL} /><XAxis dataKey="name" tick={{fontSize:10}} /><YAxis tick={{fontSize:11}} /><Tooltip /><Bar dataKey="Adapt Need $M" fill={T.red} radius={[4,4,0,0]} /></BarChart>
              </ResponsiveContainer>
            </Card>
            <Card title="GDP per Capita vs Climate Risk">
              <ResponsiveContainer width="100%" height={240}>
                <ScatterChart><CartesianGrid strokeDasharray="3 3" stroke={T.borderL} /><XAxis dataKey="x" name="GDP/cap $k" tick={{fontSize:11}} label={{ value:'GDP/cap ($k)', position:'insideBottom', offset:-4, fontSize:10 }} /><YAxis dataKey="y" name="Composite Risk" tick={{fontSize:11}} /><Tooltip cursor={{strokeDasharray:'3 3'}} /><Scatter data={scatterData} fill={T.teal} fillOpacity={0.7} /></ScatterChart>
              </ResponsiveContainer>
            </Card>
            <Card title="Green Bond Capacity by Bond Type ($M)">
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={bondData}><CartesianGrid strokeDasharray="3 3" stroke={T.borderL} /><XAxis dataKey="name" tick={{fontSize:10}} /><YAxis tick={{fontSize:11}} /><Tooltip /><Bar dataKey="$M Capacity" fill={T.green} radius={[4,4,0,0]} /></BarChart>
              </ResponsiveContainer>
            </Card>
          </div>
        )}

        {tab==='City Risk Profile' && (
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:24 }}>
            <Card title="Top 20 Highest Risk Cities">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={[...filtered].sort((a,b)=>b.composite-a.composite).slice(0,12).map(c=>({name:c.city.slice(0,10),Composite:c.composite}))}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} /><XAxis dataKey="name" tick={{fontSize:9}} /><YAxis domain={[0,100]} tick={{fontSize:11}} /><Tooltip /><Bar dataKey="Composite" fill={T.red} radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
            <Card title="Resilience Rating Distribution">
              <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:10 }}>
                {['AAA/AA','A/BBB','BB/B','CCC/D'].map(r=>{
                  const a=filtered.filter(c=>c.rating===r);
                  const pop=a.reduce((s,c)=>s+c.pop,0).toFixed(1);
                  return(
                    <div key={r} style={{ background:T.surfaceH, borderRadius:6, padding:14, border:`2px solid ${ratingColor(r)}30` }}>
                      <div style={{ fontSize:16, fontWeight:700, color:ratingColor(r), fontFamily:T.mono }}>{r}</div>
                      <div style={{ fontSize:22, fontWeight:700, color:T.navy, marginTop:4 }}>{a.length} cities</div>
                      <div style={{ fontSize:11, color:T.textMut, marginTop:2 }}>{pop}M people</div>
                    </div>
                  );
                })}
              </div>
            </Card>
            <Card title="City Risk Detail Table" span>
              <div style={{ overflowX:'auto' }}>
                <table style={{ width:'100%', borderCollapse:'collapse', fontSize:11 }}>
                  <thead><tr style={{ background:T.surfaceH }}>
                    {['City','Region','Income','Pop M','Heat','Flood','Water','Air','Composite','Rating','Adapt $M','Bond Cap $M','ROI%'].map(h=>(
                      <th key={h} style={{ padding:'6px 8px', textAlign:'left', color:T.textSec, fontWeight:600, borderBottom:`1px solid ${T.border}`, whiteSpace:'nowrap' }}>{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {[...filtered].sort((a,b)=>b.composite-a.composite).slice(0,25).map(c=>(
                      <tr key={c.id} style={{ borderBottom:`1px solid ${T.borderL}` }}>
                        <td style={{ padding:'5px 8px', fontWeight:600, color:T.navy }}>{c.city}</td>
                        <td style={{ padding:'5px 8px' }}>{c.region.slice(0,8)}</td>
                        <td style={{ padding:'5px 8px', fontSize:10 }}>{c.income.slice(0,10)}</td>
                        <td style={{ padding:'5px 8px', fontFamily:T.mono }}>{c.pop}</td>
                        {['heatIsland','floodRisk','waterStress','airQual'].map(k=>(
                          <td key={k} style={{ padding:'5px 8px', fontFamily:T.mono, color:c[k]>=70?T.red:c[k]>=40?T.amber:T.green }}>{c[k]}</td>
                        ))}
                        <td style={{ padding:'5px 8px', fontFamily:T.mono, fontWeight:700, color:c.composite>=70?T.red:c.composite>=40?T.amber:T.green }}>{c.composite}</td>
                        <td style={{ padding:'5px 8px' }}><span style={{ background:ratingColor(c.rating), color:'#fff', padding:'2px 6px', borderRadius:8, fontSize:10 }}>{c.rating}</span></td>
                        <td style={{ padding:'5px 8px', fontFamily:T.mono, color:T.red }}>{c.adaptTotal}</td>
                        <td style={{ padding:'5px 8px', fontFamily:T.mono, color:T.green }}>{c.bondCap}</td>
                        <td style={{ padding:'5px 8px', fontFamily:T.mono, color:c.adaptRoi>0?T.green:T.red }}>{c.adaptRoi}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}

        {tab==='Heat & Air' && (
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:24 }}>
            <Card title="Heat Island & Air Quality by Region">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={heatData}><CartesianGrid strokeDasharray="3 3" stroke={T.borderL} /><XAxis dataKey="name" tick={{fontSize:10}} /><YAxis domain={[0,100]} tick={{fontSize:11}} /><Tooltip /><Legend />
                  <Bar dataKey="Heat Island" fill={T.red}   radius={[4,4,0,0]} />
                  <Bar dataKey="Air Quality"  fill={T.amber} radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
            <Card title="Top 10 Heat Stressed Cities">
              <div style={{ overflowX:'auto' }}>
                <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
                  <thead><tr style={{ background:T.surfaceH }}>
                    {['City','Region','Heat Score','Air Quality','Pop M','Adapt Need $M'].map(h=>(
                      <th key={h} style={{ padding:'6px 8px', textAlign:'left', color:T.textSec, fontWeight:600, borderBottom:`1px solid ${T.border}` }}>{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {[...filtered].sort((a,b)=>b.heatIsland-a.heatIsland).slice(0,10).map(c=>(
                      <tr key={c.id} style={{ borderBottom:`1px solid ${T.borderL}` }}>
                        <td style={{ padding:'6px 8px', fontWeight:600, color:T.navy }}>{c.city}</td>
                        <td style={{ padding:'6px 8px' }}>{c.region.slice(0,8)}</td>
                        <td style={{ padding:'6px 8px', fontFamily:T.mono, color:T.red, fontWeight:700 }}>{c.heatIsland}</td>
                        <td style={{ padding:'6px 8px', fontFamily:T.mono, color:c.airQual>=70?T.red:T.amber }}>{c.airQual}</td>
                        <td style={{ padding:'6px 8px', fontFamily:T.mono }}>{c.pop}</td>
                        <td style={{ padding:'6px 8px', fontFamily:T.mono, color:T.amber }}>{c.adaptTotal}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}

        {tab==='Flood & Water' && (
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:24 }}>
            <Card title="Flood Risk & Water Stress by Region">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={floodData}><CartesianGrid strokeDasharray="3 3" stroke={T.borderL} /><XAxis dataKey="name" tick={{fontSize:10}} /><YAxis domain={[0,100]} tick={{fontSize:11}} /><Tooltip /><Legend />
                  <Bar dataKey="Flood Risk"   fill="#3b82f6" radius={[4,4,0,0]} />
                  <Bar dataKey="Water Stress" fill={T.amber}  radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
            <Card title="Top 10 Water-Stressed Cities">
              <div style={{ overflowX:'auto' }}>
                <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
                  <thead><tr style={{ background:T.surfaceH }}>
                    {['City','Flood Risk','Water Stress','Pop M','Income','Adapt $M'].map(h=>(
                      <th key={h} style={{ padding:'6px 8px', textAlign:'left', color:T.textSec, fontWeight:600, borderBottom:`1px solid ${T.border}` }}>{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {[...filtered].sort((a,b)=>b.waterStress-a.waterStress).slice(0,10).map(c=>(
                      <tr key={c.id} style={{ borderBottom:`1px solid ${T.borderL}` }}>
                        <td style={{ padding:'6px 8px', fontWeight:600, color:T.navy }}>{c.city}</td>
                        <td style={{ padding:'6px 8px', fontFamily:T.mono, color:c.floodRisk>=70?T.red:T.amber }}>{c.floodRisk}</td>
                        <td style={{ padding:'6px 8px', fontFamily:T.mono, color:c.waterStress>=70?T.red:T.amber, fontWeight:700 }}>{c.waterStress}</td>
                        <td style={{ padding:'6px 8px', fontFamily:T.mono }}>{c.pop}</td>
                        <td style={{ padding:'6px 8px', fontSize:11 }}>{c.income}</td>
                        <td style={{ padding:'6px 8px', fontFamily:T.mono, color:T.teal }}>{c.adaptTotal}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}

        {tab==='Green Finance' && (
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:24 }}>
            <Card title="Green Bond Capacity by Type ($M)">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={bondData}><CartesianGrid strokeDasharray="3 3" stroke={T.borderL} /><XAxis dataKey="name" tick={{fontSize:10}} /><YAxis tick={{fontSize:11}} /><Tooltip /><Bar dataKey="$M Capacity" fill={T.green} radius={[4,4,0,0]} /></BarChart>
              </ResponsiveContainer>
            </Card>
            <Card title="Finance Gap by Region">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={REGIONS.map(r=>{const a=filtered.filter(c=>c.region===r);return{name:r.slice(0,10),'Adapt Need':parseFloat(a.reduce((s,c)=>s+c.adaptTotal,0).toFixed(0)),'Bond Capacity':parseFloat(a.reduce((s,c)=>s+c.bondCap,0).toFixed(0))};})}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} /><XAxis dataKey="name" tick={{fontSize:10}} /><YAxis tick={{fontSize:11}} /><Tooltip /><Legend />
                  <Bar dataKey="Adapt Need"   fill={T.red}   radius={[4,4,0,0]} />
                  <Bar dataKey="Bond Capacity" fill={T.green} radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
            <Card title="Adaptation Finance Summary" span>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12 }}>
                {[
                  { lbl:'Total Adapt Need', val:`$${Number(totalAdapt).toLocaleString()}M`, c:T.red },
                  { lbl:'Total Bond Capacity', val:`$${Number(totalBondCap).toLocaleString()}M`, c:T.green },
                  { lbl:'Finance Gap', val:`$${(filtered.reduce((s,c)=>s+c.adaptTotal,0)-filtered.reduce((s,c)=>s+c.bondCap,0)).toFixed(0)}M`, c:T.amber },
                  { lbl:'Avg Adaptation ROI', val:`${avgRoi}%`, c:T.teal },
                ].map(k=>(
                  <div key={k.lbl} style={{ background:T.surfaceH, borderRadius:6, padding:14, textAlign:'center' }}>
                    <div style={{ fontSize:10, color:T.textSec, marginBottom:4 }}>{k.lbl}</div>
                    <div style={{ fontSize:20, fontWeight:700, color:k.c, fontFamily:T.mono }}>{k.val}</div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {tab==='Adaptation Pathways' && (
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:24 }}>
            <Card title="Adaptation Pathway 2025–2040" span>
              <ResponsiveContainer width="100%" height={340}>
                <LineChart data={pathwayData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} /><XAxis dataKey="year" tick={{fontSize:12}} /><YAxis tick={{fontSize:11}} /><Tooltip /><Legend />
                  <Line type="monotone" dataKey="Composite Risk"   stroke={T.red}   strokeWidth={2.5} dot={false} />
                  <Line type="monotone" dataKey="Resilience Score"  stroke={T.green} strokeWidth={2.5} dot={false} />
                  <Line type="monotone" dataKey="Adapt Funded %"   stroke={T.teal}  strokeWidth={2} dot={false} strokeDasharray="5 3" />
                </LineChart>
              </ResponsiveContainer>
            </Card>
            <Card title="Adaptation ROI Top Cities">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={[...filtered].sort((a,b)=>b.adaptRoi-a.adaptRoi).slice(0,10).map(c=>({name:c.city.slice(0,10),'ROI%':c.adaptRoi}))}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} /><XAxis dataKey="name" tick={{fontSize:9}} /><YAxis tick={{fontSize:11}} /><Tooltip /><Bar dataKey="ROI%" fill={T.sage} radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </div>
        )}

        {tab==='City Benchmarks' && (
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:24 }}>
            <Card title="Risk vs Resilience Score by Region">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={REGIONS.map(r=>{const a=filtered.filter(c=>c.region===r);return{name:r.slice(0,10),'Avg Risk':a.length?parseFloat((a.reduce((s,c)=>s+c.composite,0)/a.length).toFixed(1)):0,'Avg Resilience':a.length?parseFloat((a.reduce((s,c)=>s+c.resScore,0)/a.length).toFixed(1)):0};})}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} /><XAxis dataKey="name" tick={{fontSize:10}} /><YAxis domain={[0,100]} tick={{fontSize:11}} /><Tooltip /><Legend />
                  <Bar dataKey="Avg Risk"       fill={T.red}   radius={[4,4,0,0]} />
                  <Bar dataKey="Avg Resilience" fill={T.teal}  radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
            <Card title="Per-Capita Finance Need vs GDP">
              <ResponsiveContainer width="100%" height={300}>
                <ScatterChart><CartesianGrid strokeDasharray="3 3" stroke={T.borderL} /><XAxis dataKey="x" name="GDP/cap $" tick={{fontSize:11}} label={{value:'GDP/cap ($k)',position:'insideBottom',offset:-4,fontSize:10}} /><YAxis dataKey="y" name="Adapt Need $/100k" tick={{fontSize:11}} /><Tooltip cursor={{strokeDasharray:'3 3'}} /><Scatter data={filtered.map(c=>({x:c.gdpPcap/1000,y:c.adaptNeedPc,name:c.city}))} fill={T.amber} fillOpacity={0.7} /></ScatterChart>
              </ResponsiveContainer>
            </Card>
          </div>
        )}

        {tab==='Advanced Analytics' && (
          <div style={{ padding:'0 0 24px' }}>
            <BuiltEnvironmentAdvancedAnalytics T={T} moduleId="DE5" moduleName="Urban Climate Adaptation" />
          </div>
        )}

      </div>
    </div>
  );
}
