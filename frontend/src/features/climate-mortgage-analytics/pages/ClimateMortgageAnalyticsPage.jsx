import React, { useState, useMemo } from 'react';
import BuiltEnvironmentAdvancedAnalytics from '../../_shared/BuiltEnvironmentAdvancedAnalytics';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  AreaChart, Area, CartesianGrid, Legend, LineChart, Line,
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

const EPC      = ['A','B','C','D','E','F','G'];
const REGIONS  = ['London','South East','North West','Scotland','Midlands','Yorkshire','Wales','South West'];
const PRODUCTS = ['Standard','Green Mortgage','Buy-to-Let','Right-to-Buy','Shared Ownership'];

// Green mortgage discount (bps) by EPC
const GREEN_DISC = { A: 25, B: 15, C: 0, D: 0, E: 0, F: 0, G: 0 };
// Physical risk surcharge (bps)
const FLOOD_SURCH  = 30;
const COASTAL_SURCH = 20;

const MORTGAGES = Array.from({ length: 100 }, (_, i) => {
  const epc      = EPC[Math.floor(sr(i*7) * EPC.length)];
  const epcIdx   = EPC.indexOf(epc);
  const region   = REGIONS[Math.floor(sr(i*11) * REGIONS.length)];
  const product  = PRODUCTS[Math.floor(sr(i*13) * PRODUCTS.length)];
  const propVal  = Math.round(150000 + sr(i*3) * 1350000);          // £
  const ltv      = parseFloat((0.50 + sr(i*17) * 0.35).toFixed(3)); // 50–85%
  const loanAmt  = parseFloat((propVal * ltv / 1000).toFixed(1));   // £k
  const origYear = 2018 + Math.floor(sr(i*19) * 7);
  const tenor    = 20 + Math.floor(sr(i*23) * 10);                  // 20–30yr
  const floodZone  = sr(i*29) > 0.65;
  const coastalZone= sr(i*31) > 0.70;
  // Base rate + spread
  const baseRate  = parseFloat((4.5 + sr(i*37) * 2.0).toFixed(2));  // %
  const greenDisc = GREEN_DISC[epc] / 100;
  const floodSurch= floodZone  ? FLOOD_SURCH  / 100 : 0;
  const coastSurch= coastalZone ? COASTAL_SURCH / 100 : 0;
  const climateRate = parseFloat((baseRate - greenDisc + floodSurch + coastSurch).toFixed(2));
  // Climate-adjusted LTV (stranding haircut for EPC F/G)
  const strandHaircut = epcIdx >= 5 ? 0.12 : epcIdx >= 4 ? 0.06 : 0;
  const adjPropVal = propVal * (1 - strandHaircut);
  const adjLtv    = parseFloat((loanAmt * 1000 / adjPropVal).toFixed(3));
  // PD uplift from climate risk
  const basePd    = parseFloat((0.005 + sr(i*41) * 0.025).toFixed(4));
  const climPdUp  = (floodZone ? 0.003 : 0) + (epcIdx >= 4 ? 0.005 : 0);
  const adjPd     = parseFloat((basePd + climPdUp).toFixed(4));
  // Basel RWA uplift (simplified IRB)
  const lgd       = 0.45;
  const rwaBase   = parseFloat((loanAmt * basePd * lgd * 12.5).toFixed(1));
  const rwaClim   = parseFloat((loanAmt * adjPd  * lgd * 12.5).toFixed(1));
  const eligible  = epcIdx <= 1; // Green mortgage eligible
  const arrRisk   = floodZone && epcIdx >= 4 ? 'High' : epcIdx >= 5 || (floodZone && epcIdx >= 3) ? 'Elevated' : 'Normal';
  return {
    id: i+1, epc, epcIdx, region, product, propVal, ltv, loanAmt, origYear, tenor,
    floodZone, coastalZone, baseRate, climateRate, greenDisc, floodSurch, coastSurch,
    strandHaircut, adjPropVal, adjLtv, basePd, adjPd, rwaBase, rwaClim, eligible, arrRisk,
  };
});

const TABS = ['Overview','Mortgage Portfolio','Green Mortgage','Risk Pricing','Climate Arrears','Valuation Impact','Regulatory Capital','Advanced Analytics'];

const KpiCard = ({ label, value, sub, color }) => (
  <div style={{ background: T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:'16px 20px', flex:1, minWidth:140 }}>
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

export default function ClimateMortgageAnalyticsPage() {
  const [tab,     setTab]     = useState('Overview');
  const [fEpc,    setFEpc]    = useState('All');
  const [fRegion, setFRegion] = useState('All');
  const [fProd,   setFProd]   = useState('All');
  const [carbonPx, setCarbonPx] = useState(75);
  const [rateSens,  setRateSens] = useState(0);

  const filtered = useMemo(() => MORTGAGES.filter(m => {
    if (fEpc    !== 'All' && m.epc     !== fEpc)    return false;
    if (fRegion !== 'All' && m.region  !== fRegion) return false;
    if (fProd   !== 'All' && m.product !== fProd)   return false;
    return true;
  }), [fEpc, fRegion, fProd]);

  const n = filtered.length;
  const totalBook   = (filtered.reduce((s,m)=>s+m.loanAmt,0)/1000).toFixed(1);     // £M
  const greenElig   = filtered.filter(m=>m.eligible).length;
  const floodCount  = filtered.filter(m=>m.floodZone).length;
  const avgClimRate = n ? (filtered.reduce((s,m)=>s+m.climateRate+rateSens/100,0)/n).toFixed(2) : '0';
  const highArr     = filtered.filter(m=>m.arrRisk==='High').length;
  const totalRwaUp  = filtered.reduce((s,m)=>s+m.rwaClim-m.rwaBase,0).toFixed(1);

  const epcDist = useMemo(() => EPC.map(e => {
    const a = filtered.filter(m=>m.epc===e);
    return { name:e, Count:a.length,
      'Avg LTV%': a.length ? parseFloat((a.reduce((s,m)=>s+m.ltv,0)/a.length*100).toFixed(1)):0,
      'Avg Rate%': a.length ? parseFloat((a.reduce((s,m)=>s+m.climateRate+rateSens/100,0)/a.length).toFixed(2)):0 };
  }), [filtered, rateSens]);

  const regionData = useMemo(() => REGIONS.map(r => {
    const a = filtered.filter(m=>m.region===r);
    return { name:r.slice(0,8), '£M Book': parseFloat((a.reduce((s,m)=>s+m.loanAmt,0)/1000).toFixed(1)), 'Green Eligible %': a.length ? parseFloat((a.filter(m=>m.eligible).length/a.length*100).toFixed(0)):0 };
  }), [filtered]);

  const rateComp = useMemo(() => EPC.map(e => {
    const a = filtered.filter(m=>m.epc===e);
    return { name:e,
      'Base Rate': a.length ? parseFloat((a.reduce((s,m)=>s+m.baseRate,0)/a.length).toFixed(2)):0,
      'Climate Rate': a.length ? parseFloat((a.reduce((s,m)=>s+m.climateRate+rateSens/100,0)/a.length).toFixed(2)):0 };
  }), [filtered, rateSens]);

  const arrData = useMemo(() => ['High','Elevated','Normal'].map(risk => {
    const a = filtered.filter(m=>m.arrRisk===risk);
    return { band:risk, Count:a.length, '£M Book': parseFloat((a.reduce((s,m)=>s+m.loanAmt,0)/1000).toFixed(1)) };
  }), [filtered]);

  const valHaircut = useMemo(() => EPC.map(e => {
    const a = filtered.filter(m=>m.epc===e);
    const haircut = e==='F'?12 : e==='G'?18 : e==='E'?6 : 0;
    return { name:e, 'Haircut%': haircut, '£M Impacted': parseFloat((a.reduce((s,m)=>s+m.loanAmt,0)/1000*haircut/100).toFixed(1)) };
  }), [filtered]);

  const rwaData = useMemo(() => PRODUCTS.map(p => {
    const a = filtered.filter(m=>m.product===p);
    return { name:p.slice(0,14), 'Base RWA £k': parseFloat((a.reduce((s,m)=>s+m.rwaBase,0)).toFixed(0)), 'Climate RWA £k': parseFloat((a.reduce((s,m)=>s+m.rwaClim,0)).toFixed(0)) };
  }), [filtered]);

  const greenSavings = useMemo(() => {
    const elig = filtered.filter(m=>m.eligible);
    return EPC.slice(0,2).map(e => {
      const a = elig.filter(m=>m.epc===e);
      const disc = GREEN_DISC[e];
      return { name:`EPC ${e} (−${disc}bps)`, 'Annual Saving £': a.length ? parseFloat((a.reduce((s,m)=>s+m.loanAmt*1000*disc/10000,0)/a.length).toFixed(0)):0, Count:a.length };
    });
  }, [filtered]);

  const pdTimeline = useMemo(() => [2025,2027,2030,2033,2036,2040].map((yr,i)=>({
    year:yr,
    'Base PD (%)':   parseFloat((filtered.reduce((s,m)=>s+m.basePd,0)/Math.max(1,n)*100*(1+i*0.02)).toFixed(3)),
    'Climate PD (%)':parseFloat((filtered.reduce((s,m)=>s+m.adjPd,0)/Math.max(1,n)*100*(1+i*0.05)).toFixed(3)),
  })), [filtered, n]);

  return (
    <div style={{ background:T.bg, minHeight:'100vh', fontFamily:T.font, color:T.text }}>
      <div style={{ background:T.navy, padding:'20px 32px', borderBottom:`3px solid ${T.gold}` }}>
        <div style={{ fontSize:11, color:T.gold, fontFamily:T.mono, letterSpacing:2, marginBottom:4 }}>EP-DE3 · GREEN REAL ESTATE & BUILT ENVIRONMENT</div>
        <div style={{ fontSize:22, fontWeight:700, color:'#fff' }}>Climate Mortgage Analytics</div>
        <div style={{ fontSize:13, color:'#94a3b8', marginTop:4 }}>
          100 mortgages · Green mortgage discount (EPC A/B) · Flood/coastal surcharges · Climate-adjusted LTV · PD uplift · Basel RWA climate overlay
        </div>
      </div>

      <div style={{ background:T.surfaceH, borderBottom:`1px solid ${T.border}`, padding:'12px 32px', display:'flex', gap:16, flexWrap:'wrap', alignItems:'center' }}>
        {[['EPC',fEpc,setFEpc,['All',...EPC]],['Region',fRegion,setFRegion,['All',...REGIONS]],['Product',fProd,setFProd,['All',...PRODUCTS]]].map(([lbl,val,set,opts])=>(
          <label key={lbl} style={{ fontSize:12, color:T.textSec, display:'flex', alignItems:'center', gap:6 }}>
            {lbl}: <select value={val} onChange={e=>set(e.target.value)} style={{ fontSize:12, padding:'3px 8px', borderRadius:4, border:`1px solid ${T.border}`, background:T.surface }}>
              {opts.map(o=><option key={o}>{o}</option>)}
            </select>
          </label>
        ))}
        <label style={{ fontSize:12, color:T.textSec, display:'flex', alignItems:'center', gap:6 }}>
          Rate Stress +{rateSens}bps: <input type="range" min={0} max={200} step={10} value={rateSens} onChange={e=>setRateSens(+e.target.value)} style={{ width:80 }} />
        </label>
        <span style={{ fontSize:11, color:T.textMut, fontFamily:T.mono }}>{n}/{MORTGAGES.length} mortgages</span>
      </div>

      <div style={{ display:'flex', gap:14, padding:'20px 32px', flexWrap:'wrap' }}>
        <KpiCard label="Total Mortgage Book" value={`£${totalBook}M`}   sub={`${n} mortgages`}           color={T.navy} />
        <KpiCard label="Green Eligible"       value={greenElig}          sub="EPC A or B"                  color={T.green} />
        <KpiCard label="Flood Zone Count"     value={floodCount}         sub="+30bps surcharge"            color={T.amber} />
        <KpiCard label="Avg Climate Rate"     value={`${avgClimRate}%`}  sub="incl. green disc / surcharge" color={T.teal} />
        <KpiCard label="High Arrears Risk"    value={highArr}            sub="flood + EPC E-G"             color={T.red} />
        <KpiCard label="RWA Uplift"           value={`£${totalRwaUp}k`} sub="climate vs base"             color={T.amber} />
      </div>

      <div style={{ display:'flex', gap:0, padding:'0 32px', borderBottom:`1px solid ${T.border}`, overflowX:'auto' }}>
        {TABS.map(t=>(
          <button key={t} onClick={()=>setTab(t)} style={{ padding:'10px 18px', fontSize:13, fontWeight:tab===t?700:400, background:'none', border:'none', borderBottom:tab===t?`3px solid ${T.gold}`:'3px solid transparent', color:tab===t?T.navy:T.textSec, cursor:'pointer', whiteSpace:'nowrap' }}>{t}</button>
        ))}
      </div>

      <div style={{ padding:'24px 32px' }}>

        {tab==='Overview' && (
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:24 }}>
            <Card title="Mortgage Book by Region (£M)">
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={regionData}><CartesianGrid strokeDasharray="3 3" stroke={T.borderL} /><XAxis dataKey="name" tick={{fontSize:10}} /><YAxis tick={{fontSize:11}} /><Tooltip /><Bar dataKey="£M Book" fill={T.navy} radius={[4,4,0,0]} /></BarChart>
              </ResponsiveContainer>
            </Card>
            <Card title="EPC Distribution & Avg Climate Rate">
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={epcDist}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} /><XAxis dataKey="name" tick={{fontSize:12}} /><YAxis yAxisId="l" tick={{fontSize:11}} /><YAxis yAxisId="r" orientation="right" tick={{fontSize:11}} /><Tooltip /><Legend />
                  <Bar yAxisId="l" dataKey="Count"      fill={T.navy}  radius={[4,4,0,0]} />
                  <Bar yAxisId="r" dataKey="Avg Rate%"  fill={T.teal}  radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
            <Card title="Arrears Risk Distribution">
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={arrData}><CartesianGrid strokeDasharray="3 3" stroke={T.borderL} /><XAxis dataKey="band" tick={{fontSize:12}} /><YAxis tick={{fontSize:11}} /><Tooltip /><Legend />
                  <Bar dataKey="Count" fill={T.amber} radius={[4,4,0,0]} />
                  <Bar dataKey="£M Book" fill={T.navy} radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
            <Card title="Climate PD Trajectory">
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={pdTimeline}><CartesianGrid strokeDasharray="3 3" stroke={T.borderL} /><XAxis dataKey="year" tick={{fontSize:12}} /><YAxis tick={{fontSize:11}} /><Tooltip /><Legend />
                  <Line type="monotone" dataKey="Base PD (%)"    stroke={T.teal}  strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="Climate PD (%)" stroke={T.red}   strokeWidth={2} dot={false} strokeDasharray="5 3" />
                </LineChart>
              </ResponsiveContainer>
            </Card>
          </div>
        )}

        {tab==='Mortgage Portfolio' && (
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:24 }}>
            <Card title="Book Value by Region & Green Eligibility (%)">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={regionData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} /><XAxis dataKey="name" tick={{fontSize:10}} /><YAxis yAxisId="l" tick={{fontSize:11}} /><YAxis yAxisId="r" orientation="right" tick={{fontSize:11}} /><Tooltip /><Legend />
                  <Bar yAxisId="l" dataKey="£M Book"          fill={T.navy}  radius={[4,4,0,0]} />
                  <Bar yAxisId="r" dataKey="Green Eligible %"  fill={T.green} radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
            <Card title="EPC Breakdown by Loan Count & Avg LTV">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={epcDist}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} /><XAxis dataKey="name" tick={{fontSize:12}} /><YAxis yAxisId="l" tick={{fontSize:11}} /><YAxis yAxisId="r" orientation="right" tick={{fontSize:11}} /><Tooltip /><Legend />
                  <Bar yAxisId="l" dataKey="Count"   fill={T.navy} radius={[4,4,0,0]} />
                  <Bar yAxisId="r" dataKey="Avg LTV%" fill={T.amber} radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
            <Card title="Mortgage Detail — Top 25" span>
              <div style={{ overflowX:'auto' }}>
                <table style={{ width:'100%', borderCollapse:'collapse', fontSize:11 }}>
                  <thead><tr style={{ background:T.surfaceH }}>
                    {['#','EPC','Region','Product','Loan £k','LTV%','Base Rate%','Climate Rate%','Disc bps','Flood Surch','Adj LTV%','Arrears Risk'].map(h=>(
                      <th key={h} style={{ padding:'6px 8px', textAlign:'left', color:T.textSec, fontWeight:600, borderBottom:`1px solid ${T.border}`, whiteSpace:'nowrap' }}>{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {filtered.slice(0,25).map(m=>(
                      <tr key={m.id} style={{ borderBottom:`1px solid ${T.borderL}` }}>
                        <td style={{ padding:'5px 8px', fontFamily:T.mono, color:T.textMut }}>{m.id}</td>
                        <td style={{ padding:'5px 8px' }}><span style={{ background:m.epcIdx<=1?T.green:m.epcIdx<=3?T.amber:T.red, color:'#fff', padding:'2px 6px', borderRadius:8, fontSize:10, fontWeight:700 }}>{m.epc}</span></td>
                        <td style={{ padding:'5px 8px' }}>{m.region.slice(0,8)}</td>
                        <td style={{ padding:'5px 8px' }}>{m.product.slice(0,12)}</td>
                        <td style={{ padding:'5px 8px', fontFamily:T.mono }}>{m.loanAmt}</td>
                        <td style={{ padding:'5px 8px', fontFamily:T.mono, color:m.ltv>0.8?T.red:T.text }}>{(m.ltv*100).toFixed(1)}%</td>
                        <td style={{ padding:'5px 8px', fontFamily:T.mono }}>{m.baseRate}%</td>
                        <td style={{ padding:'5px 8px', fontFamily:T.mono, color:m.climateRate+rateSens/100>m.baseRate?T.red:T.green }}>{(m.climateRate+rateSens/100).toFixed(2)}%</td>
                        <td style={{ padding:'5px 8px', fontFamily:T.mono, color:m.greenDisc>0?T.green:T.textMut }}>{m.greenDisc>0?`−${(m.greenDisc*100).toFixed(0)}`:'—'}</td>
                        <td style={{ padding:'5px 8px', fontFamily:T.mono, color:m.floodZone?T.red:T.textMut }}>{m.floodZone?'+30':'—'}</td>
                        <td style={{ padding:'5px 8px', fontFamily:T.mono, color:m.adjLtv>0.9?T.red:m.adjLtv>0.8?T.amber:T.text }}>{(m.adjLtv*100).toFixed(1)}%</td>
                        <td style={{ padding:'5px 8px' }}><span style={{ background:m.arrRisk==='High'?T.red:m.arrRisk==='Elevated'?T.amber:T.green, color:'#fff', padding:'2px 6px', borderRadius:8, fontSize:10 }}>{m.arrRisk}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}

        {tab==='Green Mortgage' && (
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:24 }}>
            <Card title="Green Mortgage Eligibility by Region">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={REGIONS.map(r=>{const a=filtered.filter(m=>m.region===r);return{name:r.slice(0,8),'Eligible':a.filter(m=>m.eligible).length,'Not Eligible':a.filter(m=>!m.eligible).length};})}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} /><XAxis dataKey="name" tick={{fontSize:10}} /><YAxis tick={{fontSize:11}} /><Tooltip /><Legend />
                  <Bar dataKey="Eligible"     fill={T.green} stackId="a" />
                  <Bar dataKey="Not Eligible" fill={T.borderL} stackId="a" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
            <Card title="Annual Interest Saving — Green Mortgage Discount">
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:16 }}>
                {['A','B'].map(e=>{
                  const a=filtered.filter(m=>m.epc===e);
                  const disc=GREEN_DISC[e];
                  const totalSave=a.reduce((s,m)=>s+m.loanAmt*1000*disc/10000,0).toFixed(0);
                  const avgSave=a.length?(a.reduce((s,m)=>s+m.loanAmt*1000*disc/10000,0)/a.length).toFixed(0):0;
                  return(
                    <div key={e} style={{ background:T.surfaceH, borderRadius:6, padding:16, border:`2px solid ${T.green}30` }}>
                      <div style={{ fontSize:14, fontWeight:700, color:T.green }}>EPC {e} — {disc}bps discount</div>
                      <div style={{ fontSize:12, color:T.textSec, marginTop:8 }}>{a.length} qualifying loans</div>
                      <div style={{ fontSize:20, fontWeight:700, color:T.navy, fontFamily:T.mono, marginTop:6 }}>£{Number(totalSave).toLocaleString()} total/yr</div>
                      <div style={{ fontSize:11, color:T.textMut, marginTop:4 }}>£{Number(avgSave).toLocaleString()} avg per mortgage</div>
                    </div>
                  );
                })}
              </div>
              <div style={{ padding:16, background:T.surfaceH, borderRadius:6 }}>
                <div style={{ fontSize:12, fontWeight:600, color:T.navy, marginBottom:8 }}>Potential upgrade pathway — EPC C→B</div>
                <div style={{ fontSize:11, color:T.textSec, lineHeight:1.6 }}>
                  {filtered.filter(m=>m.epc==='C').length} EPC-C mortgages could qualify for green discount after retrofit. Estimated total annual saving post-upgrade:&nbsp;
                  <strong style={{ color:T.green }}>£{(filtered.filter(m=>m.epc==='C').reduce((s,m)=>s+m.loanAmt*1000*15/10000,0)/1000).toFixed(1)}k/yr across book.</strong>
                </div>
              </div>
            </Card>
            <Card title="Rate Comparison: Base vs Climate-Adjusted by EPC" span>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={rateComp}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} /><XAxis dataKey="name" tick={{fontSize:12}} /><YAxis tick={{fontSize:11}} /><Tooltip /><Legend />
                  <Bar dataKey="Base Rate"    fill={T.navy}  radius={[4,4,0,0]} />
                  <Bar dataKey="Climate Rate" fill={T.teal}  radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </div>
        )}

        {tab==='Risk Pricing' && (
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:24 }}>
            <Card title="Climate Rate vs Base Rate by EPC">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={rateComp}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} /><XAxis dataKey="name" tick={{fontSize:12}} /><YAxis tick={{fontSize:11}} /><Tooltip /><Legend />
                  <Bar dataKey="Base Rate"    fill={T.navy} radius={[4,4,0,0]} />
                  <Bar dataKey="Climate Rate" fill={T.teal} radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
            <Card title="Climate Risk Pricing Components">
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:12 }}>
                {[
                  { comp:'Green Mortgage Disc (EPC A)',  bps:'-25', c:T.green },
                  { comp:'Green Mortgage Disc (EPC B)',  bps:'-15', c:T.green },
                  { comp:'Flood Zone Surcharge',         bps:'+30', c:T.red   },
                  { comp:'Coastal Zone Surcharge',       bps:'+20', c:T.amber },
                  { comp:'EPC F Stranding Surcharge',    bps:'+40', c:T.red   },
                  { comp:'EPC G Stranding Surcharge',    bps:'+60', c:T.red   },
                ].map(r=>(
                  <div key={r.comp} style={{ background:T.surfaceH, borderRadius:6, padding:10, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <span style={{ fontSize:11, color:T.text }}>{r.comp}</span>
                    <span style={{ fontFamily:T.mono, fontSize:16, fontWeight:700, color:r.c }}>{r.bps} bps</span>
                  </div>
                ))}
              </div>
            </Card>
            <Card title="Flood Surcharge Impact by Region" span>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={REGIONS.map(r=>{const a=filtered.filter(m=>m.region===r);return{name:r.slice(0,8),'Flood Zone £k Book':parseFloat((a.filter(m=>m.floodZone).reduce((s,m)=>s+m.loanAmt,0)).toFixed(0)),'Annual Surcharge £':parseFloat((a.filter(m=>m.floodZone).reduce((s,m)=>s+m.loanAmt*1000*0.003,0)).toFixed(0))};})}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} /><XAxis dataKey="name" tick={{fontSize:10}} /><YAxis tick={{fontSize:11}} /><Tooltip /><Legend />
                  <Bar dataKey="Flood Zone £k Book"   fill={T.amber} radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </div>
        )}

        {tab==='Climate Arrears' && (
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:24 }}>
            <Card title="Arrears Risk Band Distribution">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={arrData}><CartesianGrid strokeDasharray="3 3" stroke={T.borderL} /><XAxis dataKey="band" tick={{fontSize:12}} /><YAxis tick={{fontSize:11}} /><Tooltip /><Legend />
                  <Bar dataKey="Count"   fill={T.amber} radius={[4,4,0,0]} />
                  <Bar dataKey="£M Book" fill={T.navy}  radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
            <Card title="PD Trajectory — Base vs Climate-Adjusted">
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={pdTimeline}><CartesianGrid strokeDasharray="3 3" stroke={T.borderL} /><XAxis dataKey="year" tick={{fontSize:12}} /><YAxis tick={{fontSize:11}} /><Tooltip /><Legend />
                  <Line type="monotone" dataKey="Base PD (%)"    stroke={T.teal} strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="Climate PD (%)" stroke={T.red}  strokeWidth={2} dot={false} strokeDasharray="5 3" />
                </LineChart>
              </ResponsiveContainer>
            </Card>
            <Card title="High Arrears Risk Loans" span>
              <div style={{ overflowX:'auto' }}>
                <table style={{ width:'100%', borderCollapse:'collapse', fontSize:11 }}>
                  <thead><tr style={{ background:T.surfaceH }}>
                    {['#','EPC','Region','Loan £k','LTV%','Climate Rate%','Flood Zone','Adj LTV%','Base PD%','Climate PD%','Risk'].map(h=>(
                      <th key={h} style={{ padding:'6px 8px', textAlign:'left', color:T.textSec, fontWeight:600, borderBottom:`1px solid ${T.border}`, whiteSpace:'nowrap' }}>{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {filtered.filter(m=>m.arrRisk==='High'||m.arrRisk==='Elevated').slice(0,20).map(m=>(
                      <tr key={m.id} style={{ borderBottom:`1px solid ${T.borderL}`, background:m.arrRisk==='High'?'#fef2f2':'transparent' }}>
                        <td style={{ padding:'5px 8px', fontFamily:T.mono, color:T.textMut }}>{m.id}</td>
                        <td style={{ padding:'5px 8px' }}><span style={{ background:m.epcIdx<=1?T.green:m.epcIdx<=3?T.amber:T.red, color:'#fff', padding:'2px 6px', borderRadius:8, fontSize:10 }}>{m.epc}</span></td>
                        <td style={{ padding:'5px 8px' }}>{m.region.slice(0,8)}</td>
                        <td style={{ padding:'5px 8px', fontFamily:T.mono }}>{m.loanAmt}</td>
                        <td style={{ padding:'5px 8px', fontFamily:T.mono, color:m.ltv>0.8?T.red:T.text }}>{(m.ltv*100).toFixed(1)}%</td>
                        <td style={{ padding:'5px 8px', fontFamily:T.mono }}>{(m.climateRate+rateSens/100).toFixed(2)}%</td>
                        <td style={{ padding:'5px 8px', color:m.floodZone?T.red:T.textMut, fontWeight:700 }}>{m.floodZone?'Yes':'No'}</td>
                        <td style={{ padding:'5px 8px', fontFamily:T.mono, color:m.adjLtv>0.9?T.red:T.text }}>{(m.adjLtv*100).toFixed(1)}%</td>
                        <td style={{ padding:'5px 8px', fontFamily:T.mono }}>{(m.basePd*100).toFixed(3)}%</td>
                        <td style={{ padding:'5px 8px', fontFamily:T.mono, color:T.red, fontWeight:700 }}>{(m.adjPd*100).toFixed(3)}%</td>
                        <td style={{ padding:'5px 8px' }}><span style={{ background:m.arrRisk==='High'?T.red:T.amber, color:'#fff', padding:'2px 6px', borderRadius:8, fontSize:10 }}>{m.arrRisk}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}

        {tab==='Valuation Impact' && (
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:24 }}>
            <Card title="Stranding Haircut by EPC Rating">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={valHaircut}><CartesianGrid strokeDasharray="3 3" stroke={T.borderL} /><XAxis dataKey="name" tick={{fontSize:12}} /><YAxis tick={{fontSize:11}} /><Tooltip /><Legend />
                  <Bar dataKey="Haircut%"      fill={T.red}  radius={[4,4,0,0]} />
                  <Bar dataKey="£M Impacted"   fill={T.amber} radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
            <Card title="Climate-Adjusted LTV Distribution">
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10 }}>
                {[
                  { lbl:'LTV>90% (climate adj)',  val:filtered.filter(m=>m.adjLtv>0.9).length,  c:T.red   },
                  { lbl:'LTV 80-90%',              val:filtered.filter(m=>m.adjLtv>=0.8&&m.adjLtv<=0.9).length, c:T.amber },
                  { lbl:'LTV<80%',                 val:filtered.filter(m=>m.adjLtv<0.8).length,  c:T.green },
                  { lbl:'Total Neg Equity Risk',   val:`£${filtered.filter(m=>m.adjLtv>1.0).reduce((s,m)=>s+m.loanAmt,0).toFixed(0)}k`, c:T.red },
                  { lbl:'Avg Original LTV',         val:`${n?(filtered.reduce((s,m)=>s+m.ltv,0)/n*100).toFixed(1):0}%`, c:T.navy },
                  { lbl:'Avg Climate LTV',           val:`${n?(filtered.reduce((s,m)=>s+m.adjLtv,0)/n*100).toFixed(1):0}%`, c:T.teal },
                ].map(k=>(
                  <div key={k.lbl} style={{ background:T.surfaceH, borderRadius:6, padding:12, textAlign:'center' }}>
                    <div style={{ fontSize:10, color:T.textSec, marginBottom:4 }}>{k.lbl}</div>
                    <div style={{ fontSize:18, fontWeight:700, color:k.c, fontFamily:T.mono }}>{k.val}</div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {tab==='Regulatory Capital' && (
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:24 }}>
            <Card title="Base vs Climate RWA by Product (£k)">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={rwaData}><CartesianGrid strokeDasharray="3 3" stroke={T.borderL} /><XAxis dataKey="name" tick={{fontSize:10}} /><YAxis tick={{fontSize:11}} /><Tooltip /><Legend />
                  <Bar dataKey="Base RWA £k"    fill={T.navy}  radius={[4,4,0,0]} />
                  <Bar dataKey="Climate RWA £k" fill={T.amber} radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
            <Card title="Capital Requirement Summary">
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                {[
                  { lbl:'Total Base RWA',    val:`£${filtered.reduce((s,m)=>s+m.rwaBase,0).toFixed(0)}k`, c:T.navy  },
                  { lbl:'Total Climate RWA', val:`£${filtered.reduce((s,m)=>s+m.rwaClim,0).toFixed(0)}k`, c:T.amber },
                  { lbl:'RWA Uplift (£k)',   val:`+£${filtered.reduce((s,m)=>s+m.rwaClim-m.rwaBase,0).toFixed(0)}k`, c:T.red },
                  { lbl:'Uplift %',          val:`${filtered.reduce((s,m)=>s+m.rwaBase,0)>0?(filtered.reduce((s,m)=>s+m.rwaClim-m.rwaBase,0)/filtered.reduce((s,m)=>s+m.rwaBase,0)*100).toFixed(1):0}%`, c:T.red },
                  { lbl:'Flood Zone RWA',    val:`£${filtered.filter(m=>m.floodZone).reduce((s,m)=>s+m.rwaClim,0).toFixed(0)}k`, c:T.amber },
                  { lbl:'Avg PD Uplift',     val:`${n?(filtered.reduce((s,m)=>s+m.adjPd-m.basePd,0)/n*10000).toFixed(1):0} bps`, c:T.red   },
                ].map(k=>(
                  <div key={k.lbl} style={{ background:T.surfaceH, borderRadius:6, padding:12, textAlign:'center' }}>
                    <div style={{ fontSize:10, color:T.textSec, marginBottom:4 }}>{k.lbl}</div>
                    <div style={{ fontSize:16, fontWeight:700, color:k.c, fontFamily:T.mono }}>{k.val}</div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {tab==='Advanced Analytics' && (
          <div style={{ padding:'0 0 24px' }}>
            <BuiltEnvironmentAdvancedAnalytics T={T} moduleId="DE3" moduleName="Climate Mortgage Analytics" />
          </div>
        )}

      </div>
    </div>
  );
}
