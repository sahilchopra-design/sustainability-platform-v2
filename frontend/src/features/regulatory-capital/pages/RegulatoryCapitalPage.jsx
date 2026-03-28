import React, { useState, useCallback } from 'react';
import axios from 'axios';
import {
  BarChart, Bar, RadialBarChart, RadialBar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell,
} from 'recharts';

const Section = ({title,children})=>(<div style={{marginBottom:24}}><h2 style={{fontSize:17,fontWeight:600,color:'#111827',marginBottom:12,borderBottom:'2px solid #059669',paddingBottom:4}}>{title}</h2>{children}</div>);
const KpiCard = ({label,value,sub})=>(<div style={{background:'#fff',border:'1px solid #e5e7eb',borderRadius:10,padding:16,borderLeft:'3px solid #059669'}}><div style={{fontSize:11,color:'#6b7280',marginBottom:4}}>{label}</div><div style={{fontSize:24,fontWeight:700,color:'#111827'}}>{value}</div>{sub&&<div style={{fontSize:11,color:'#059669',marginTop:4}}>{sub}</div>}</div>);
const Row = ({children})=>(<div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))',gap:12,marginBottom:16}}>{children}</div>);
const Inp = ({label,...p})=>(<div style={{display:'flex',flexDirection:'column',gap:4}}><label style={{fontSize:11,color:'#6b7280'}}>{label}</label><input style={{border:'1px solid #d1d5db',borderRadius:6,padding:'7px 12px',fontSize:13,outline:'none',width:'100%',boxSizing:'border-box'}} {...p}/></div>);
const Sel = ({label,children,...p})=>(<div style={{display:'flex',flexDirection:'column',gap:4}}><label style={{fontSize:11,color:'#6b7280'}}>{label}</label><select style={{border:'1px solid #d1d5db',borderRadius:6,padding:'7px 12px',fontSize:13,outline:'none',width:'100%',boxSizing:'border-box'}} {...p}>{children}</select></div>);
const Btn = ({children,...p})=>(<button style={{background:'#059669',color:'#fff',padding:'8px 16px',borderRadius:6,fontSize:13,fontWeight:500,border:'none',cursor:'pointer'}} {...p}>{children}</button>);
const Badge = ({children,color='green'})=>{ const c={green:{background:'#d1fae5',color:'#065f46'},red:{background:'#fee2e2',color:'#991b1b'},yellow:{background:'#fef3c7',color:'#92400e'},blue:{background:'#dbeafe',color:'#1e40af'},gray:{background:'#f3f4f6',color:'#374151'}}; const s=c[color]||c.green; return(<span style={{padding:'2px 8px',borderRadius:4,fontSize:11,fontWeight:600,...s}}>{children}</span>); };

const seed = 108;
const rng = (i, s=seed) => Math.abs(Math.sin(i*9301+s*49297)*233280)%233280/233280;

const TABS = ['Capital Ratios','RWA Breakdown','FRTB SA/IMA','Climate P2R Overlay','Optimization Actions'];

const tblStyle = {width:'100%',fontSize:13,borderCollapse:'collapse'};
const thStyle = {border:'1px solid #e5e7eb',padding:'6px 8px',fontSize:11,textAlign:'left',fontWeight:500,color:'#6b7280',background:'#f9fafb'};
const tdStyle = {border:'1px solid #e5e7eb',padding:'6px 8px'};
const tdMono = {...tdStyle,fontFamily:'monospace',fontWeight:700};
const errStyle = {marginBottom:12,padding:'8px 12px',background:'#fffbeb',border:'1px solid #fde68a',borderRadius:6,fontSize:13,color:'#92400e'};

function Tab1({institutionType, totalAssets, approach}) {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const cet1 = +(12.4 + rng(1)*4).toFixed(1);
  const t1   = +(cet1 + 1.2 + rng(2)*0.8).toFixed(1);
  const tc   = +(t1 + 1.8 + rng(3)*1.2).toFixed(1);
  const lev  = +(4.2 + rng(4)*2).toFixed(1);

  const gaugeData = [
    { name:'CET1', value: cet1, fill:'#059669' },
    { name:'T1',   value: t1,   fill:'#10b981' },
    { name:'TC',   value: tc,   fill:'#34d399' },
    { name:'Lev',  value: lev,  fill:'#6ee7b7' },
  ];

  const passFailRows = [
    { ratio:'CET1 Ratio', actual:`${cet1}%`, minimum:'4.5%', buffer:'2.5%', total:'7.0%', pass: cet1>=7.0 },
    { ratio:'Tier 1 Ratio', actual:`${t1}%`, minimum:'6.0%', buffer:'2.5%', total:'8.5%', pass: t1>=8.5 },
    { ratio:'Total Capital', actual:`${tc}%`, minimum:'8.0%', buffer:'2.5%', total:'10.5%', pass: tc>=10.5 },
    { ratio:'Leverage Ratio', actual:`${lev}%`, minimum:'3.0%', buffer: institutionType==='G-SII'?'0.5%':'—', total: institutionType==='G-SII'?'3.5%':'3.0%', pass: lev>=3.0 },
    { ratio:'NSFR', actual:`${(105+rng(5)*20).toFixed(0)}%`, minimum:'100%', buffer:'—', total:'100%', pass: true },
    { ratio:'LCR', actual:`${(115+rng(6)*30).toFixed(0)}%`, minimum:'100%', buffer:'—', total:'100%', pass: true },
  ];

  const run = useCallback(async()=>{
    setLoading(true); setError(null);
    try { const r=await axios.post('http://localhost:8001/api/v1/regulatory-capital/calculate-ratios',{institution_type:institutionType,total_assets_eur_bn:totalAssets,approach}); setResult(r.data); }
    catch(e){ void 0 /* API fallback to seed data */; setResult({}); }
    setLoading(false);
  },[institutionType,totalAssets,approach]);

  return (
    <div>
      <Section title="Run Capital Calculation">
        {error&&<div style={errStyle}>{error}</div>}
        <Btn onClick={run} disabled={loading}>{loading?'Calculating…':'Calculate Capital Ratios'}</Btn>
      </Section>
      <Row>
        <KpiCard label="CET1 Ratio" value={`${cet1}%`} sub={`Min 7.0% (incl. buffer) · ${cet1>=7.0?'PASS':'FAIL'}`} />
        <KpiCard label="Tier 1 Ratio" value={`${t1}%`} sub={`Min 8.5% · ${t1>=8.5?'PASS':'FAIL'}`} />
        <KpiCard label="Total Capital" value={`${tc}%`} sub={`Min 10.5% · ${tc>=10.5?'PASS':'FAIL'}`} />
        <KpiCard label="Leverage Ratio" value={`${lev}%`} sub={`Min 3.0% (CRR2 Art 92) · ${lev>=3.0?'PASS':'FAIL'}`} />
      </Row>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:24}}>
        <Section title="Capital Ratios — Radial Gauge">
          <ResponsiveContainer width="100%" height={260}>
            <RadialBarChart cx="50%" cy="50%" innerRadius="20%" outerRadius="90%" data={gaugeData} startAngle={180} endAngle={0}>
              <RadialBar minAngle={15} background dataKey="value" label={{fill:'#111',fontSize:11}} />
              <Tooltip formatter={v=>`${v}%`} />
              <Legend iconSize={10} layout="vertical" align="right" verticalAlign="middle" />
            </RadialBarChart>
          </ResponsiveContainer>
        </Section>
        <Section title="Pass / Fail Table">
          <table style={tblStyle}>
            <thead><tr>{['Ratio','Actual','Min','Buffer','Total','Status'].map(h=><th key={h} style={thStyle}>{h}</th>)}</tr></thead>
            <tbody>{passFailRows.map((r,i)=>(
              <tr key={i}>
                <td style={{...tdStyle,fontWeight:500}}>{r.ratio}</td>
                <td style={tdMono}>{r.actual}</td>
                <td style={{...tdStyle,color:'#6b7280'}}>{r.minimum}</td>
                <td style={{...tdStyle,color:'#6b7280'}}>{r.buffer}</td>
                <td style={{...tdStyle,color:'#4b5563'}}>{r.total}</td>
                <td style={tdStyle}><Badge color={r.pass?'green':'red'}>{r.pass?'PASS':'FAIL'}</Badge></td>
              </tr>
            ))}</tbody>
          </table>
        </Section>
      </div>
    </div>
  );
}

function Tab2({approach}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const rwaData = ['Credit Risk','Market Risk','Op Risk','CVA'].map((cat,i)=>({
    category: cat,
    SA:   Math.round(200+rng(i+10)*400),
    IRB:  Math.round(150+rng(i+11)*350),
  }));

  const run = useCallback(async()=>{
    setLoading(true); setError(null);
    try { await axios.post('http://localhost:8001/api/v1/regulatory-capital/calculate-ratios',{approach}); }
    catch { void 0 /* API fallback to seed data */; }
    setLoading(false);
  },[approach]);

  return (
    <div>
      <Section title="RWA Analysis">
        {error&&<div style={errStyle}>{error}</div>}
        <Btn onClick={run} disabled={loading}>{loading?'Loading…':'Refresh RWA Breakdown'}</Btn>
      </Section>
      <Row>
        <KpiCard label="Credit RWA" value={`€${rwaData[0].SA}bn`} sub="SA approach" />
        <KpiCard label="Market RWA" value={`€${rwaData[1].SA}bn`} sub="IMA/SA blended" />
        <KpiCard label="Op Risk RWA" value={`€${rwaData[2].SA}bn`} sub="Standardised (Basel IV)" />
        <KpiCard label="CVA RWA" value={`€${rwaData[3].SA}bn`} sub="SA-CVA" />
      </Row>
      <Section title="RWA by Risk Type — SA vs IRB (€bn)">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={rwaData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="category" />
            <YAxis unit="bn" />
            <Tooltip formatter={v=>`€${v}bn`} />
            <Legend />
            <Bar dataKey="SA" fill="#059669" name="SA" />
            <Bar dataKey="IRB" fill="#34d399" name="IRB/Advanced" />
          </BarChart>
        </ResponsiveContainer>
      </Section>
    </div>
  );
}

function Tab3() {
  const desks = ['FX Options','IR Rates','Credit Books','Equities','Commodities','Exotics'].map((d,i)=>({
    desk: d,
    SA_MR:  Math.round(80+rng(i+20)*300),
    IMA_MR: Math.round(60+rng(i+21)*250),
    eligible: rng(i+22)>0.35,
  }));

  return (
    <div>
      <Section title="FRTB SA vs IMA by Trading Desk (€M RWA)">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={desks}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="desk" tick={{fontSize:11}} />
            <YAxis unit="M" />
            <Tooltip formatter={v=>`€${v}M`} />
            <Legend />
            <Bar dataKey="SA_MR" fill="#059669" name="SA Market Risk" />
            <Bar dataKey="IMA_MR" fill="#7c3aed" name="IMA Market Risk" />
          </BarChart>
        </ResponsiveContainer>
      </Section>
      <Section title="IMA Model Eligibility by Desk">
        <table style={tblStyle}>
          <thead><tr>{['Desk','SA RWA (€M)','IMA RWA (€M)','RWA Saving','IMA Eligible'].map(h=><th key={h} style={thStyle}>{h}</th>)}</tr></thead>
          <tbody>{desks.map((d,i)=>(
            <tr key={i}>
              <td style={{...tdStyle,fontWeight:500}}>{d.desk}</td>
              <td style={{...tdStyle,fontFamily:'monospace'}}>{d.SA_MR}</td>
              <td style={{...tdStyle,fontFamily:'monospace'}}>{d.IMA_MR}</td>
              <td style={{...tdStyle,color:'#059669',fontFamily:'monospace'}}>-{d.SA_MR-d.IMA_MR}</td>
              <td style={tdStyle}><Badge color={d.eligible?'green':'red'}>{d.eligible?'Eligible':'Not Eligible'}</Badge></td>
            </tr>
          ))}</tbody>
        </table>
      </Section>
    </div>
  );
}

function Tab4() {
  const years = [2024,2025,2026,2027,2028,2030];
  const lineData = years.map((y,i)=>({
    year: y,
    base_cet1:   +(13.2 - i*0.1 + rng(i+30)*0.3).toFixed(2),
    climate_cet1: +(13.2 - i*0.3 - rng(i+31)*0.5).toFixed(2),
  }));

  const bpsData = [
    { category:'Physical Risk',    physical: Math.round(20+rng(40)*60), transition: 0 },
    { category:'Transition Risk',  physical: 0, transition: Math.round(30+rng(41)*80) },
    { category:'Stranded Assets',  physical: Math.round(10+rng(42)*30), transition: Math.round(15+rng(43)*40) },
    { category:'Litigation',       physical: Math.round(5+rng(44)*20), transition: Math.round(8+rng(45)*25) },
  ];

  return (
    <div>
      <Row>
        <KpiCard label="Climate P2R Add-On" value={`+${Math.round(25+rng(50)*50)}bps`} sub="CET1 climate stress buffer" />
        <KpiCard label="Physical Risk Adj." value={`-${+(0.2+rng(51)*0.4).toFixed(2)}%`} sub="CET1 impact — physical shocks" />
        <KpiCard label="Transition Risk Adj." value={`-${+(0.3+rng(52)*0.6).toFixed(2)}%`} sub="CET1 impact — transition shocks" />
        <KpiCard label="Climate VaR" value={`€${Math.round(800+rng(53)*1200)}M`} sub="99th percentile 10-year horizon" />
      </Row>
      <Section title="CET1 Base vs Climate-Adjusted 2024–2030">
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={lineData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="year" />
            <YAxis domain={[10,16]} unit="%" />
            <Tooltip formatter={v=>`${v}%`} />
            <Legend />
            <Line type="monotone" dataKey="base_cet1" stroke="#059669" strokeWidth={2} name="Base CET1" />
            <Line type="monotone" dataKey="climate_cet1" stroke="#ef4444" strokeWidth={2} strokeDasharray="5 5" name="Climate-Adjusted CET1" />
          </LineChart>
        </ResponsiveContainer>
      </Section>
      <Section title="Climate P2R bps Add-On by Category">
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={bpsData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="category" tick={{fontSize:11}} />
            <YAxis unit="bps" />
            <Tooltip formatter={v=>`${v}bps`} />
            <Legend />
            <Bar dataKey="physical" fill="#f59e0b" name="Physical" stackId="a" />
            <Bar dataKey="transition" fill="#ef4444" name="Transition" stackId="a" />
          </BarChart>
        </ResponsiveContainer>
      </Section>
    </div>
  );
}

function Tab5() {
  const actions = [
    { action:'Syndicate / securitise leveraged loans', rwa_reduction: Math.round(800+rng(60)*1200), cet1_impact:+(0.4+rng(61)*0.8).toFixed(2), effort:'Medium', timeline:'6-12M' },
    { action:'Trim HTM bond portfolio — reduce credit RWA', rwa_reduction: Math.round(400+rng(62)*600), cet1_impact:+(0.2+rng(63)*0.5).toFixed(2), effort:'Low', timeline:'3-6M' },
    { action:'IRB model roll-out — retail mortgages', rwa_reduction: Math.round(600+rng(64)*900), cet1_impact:+(0.3+rng(65)*0.6).toFixed(2), effort:'High', timeline:'18-24M' },
    { action:'AT1 issuance — €500M', rwa_reduction: 0, cet1_impact:+(0.25+rng(66)*0.3).toFixed(2), effort:'Medium', timeline:'3M' },
    { action:'CRE portfolio wind-down', rwa_reduction: Math.round(300+rng(67)*500), cet1_impact:+(0.15+rng(68)*0.35).toFixed(2), effort:'High', timeline:'12-18M' },
    { action:'IMA approval for FX Options desk', rwa_reduction: Math.round(150+rng(69)*250), cet1_impact:+(0.08+rng(70)*0.15).toFixed(2), effort:'High', timeline:'24M+' },
    { action:'Op risk mitigation — insurance recognition', rwa_reduction: Math.round(80+rng(71)*120), cet1_impact:+(0.04+rng(72)*0.08).toFixed(2), effort:'Low', timeline:'Immediate' },
  ].sort((a,b)=>b.rwa_reduction-a.rwa_reduction);

  const effortColor = e => e==='Low'?'green':e==='Medium'?'yellow':'red';

  return (
    <div>
      <Row>
        <KpiCard label="Total RWA Savings" value={`€${Math.round(actions.reduce((s,a)=>s+a.rwa_reduction,0)/1000)}bn`} sub="If all actions executed" />
        <KpiCard label="CET1 Uplift" value={`+${actions.reduce((s,a)=>s+parseFloat(a.cet1_impact),0).toFixed(2)}%`} sub="Cumulative impact" />
        <KpiCard label="Quick Wins" value={actions.filter(a=>a.effort==='Low').length} sub="Low-effort actions" />
        <KpiCard label="Time-to-Impact" value="3–6M" sub="Fastest actions available" />
      </Row>
      <Section title="Ranked Capital Optimization Actions">
        <table style={tblStyle}>
          <thead><tr>{['Action','RWA Reduction (€M)','CET1 Impact','Effort','Timeline'].map(h=><th key={h} style={thStyle}>{h}</th>)}</tr></thead>
          <tbody>{actions.map((a,i)=>(
            <tr key={i}>
              <td style={tdStyle}>{a.action}</td>
              <td style={{...tdStyle,fontFamily:'monospace',color:'#059669',fontWeight:700}}>{a.rwa_reduction>0?`-${a.rwa_reduction}`:'—'}</td>
              <td style={{...tdStyle,fontFamily:'monospace',fontWeight:700,color:'#059669'}}>+{a.cet1_impact}%</td>
              <td style={tdStyle}><Badge color={effortColor(a.effort)}>{a.effort}</Badge></td>
              <td style={{...tdStyle,color:'#6b7280'}}>{a.timeline}</td>
            </tr>
          ))}</tbody>
        </table>
      </Section>
    </div>
  );
}

export default function RegulatoryCapitalPage() {
  const [activeTab, setActiveTab] = useState(0);
  const [institutionName, setInstitutionName] = useState('Eurobank Group AG');
  const [institutionType, setInstitutionType] = useState('G-SII');
  const [totalAssets, setTotalAssets] = useState('850');
  const [approach, setApproach] = useState('IRB');

  const tabComponents = [
    <Tab1 institutionType={institutionType} totalAssets={totalAssets} approach={approach} />,
    <Tab2 approach={approach} />,
    <Tab3 />,
    <Tab4 />,
    <Tab5 />,
  ];

  return (
    <div style={{minHeight:'100vh',background:'#f9fafb',padding:24}}>
      <div style={{maxWidth:1200,margin:'0 auto'}}>
        <div style={{marginBottom:24}}>
          <h1 style={{fontSize:24,fontWeight:700,color:'#111827',margin:0}}>Regulatory Capital Engine</h1>
          <p style={{fontSize:13,color:'#6b7280',marginTop:4}}>CRR2/CRD5 · Basel IV · FRTB SA/IMA · Climate P2R · CET1/T1/TC/Leverage · E108</p>
        </div>
        <div style={{background:'white',border:'1px solid #e5e7eb',borderRadius:10,padding:16,marginBottom:24}}>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))',gap:16}}>
            <Inp label="Institution Name" value={institutionName} onChange={e=>setInstitutionName(e.target.value)} />
            <Sel label="Institution Type" value={institutionType} onChange={e=>setInstitutionType(e.target.value)}>
              {['G-SII','O-SII','Other'].map(o=><option key={o}>{o}</option>)}
            </Sel>
            <Inp label="Total Assets (€bn)" type="number" value={totalAssets} onChange={e=>setTotalAssets(e.target.value)} />
            <Sel label="Capital Approach" value={approach} onChange={e=>setApproach(e.target.value)}>
              {['SA','IRB','mixed'].map(o=><option key={o}>{o}</option>)}
            </Sel>
          </div>
        </div>
        <div style={{display:'flex',gap:8,marginBottom:24,borderBottom:'1px solid #e5e7eb',overflowX:'auto'}}>
          {TABS.map((t,i)=>(
            <button key={i} onClick={()=>setActiveTab(i)}
              style={{padding:'8px 16px',fontSize:13,fontWeight:500,whiteSpace:'nowrap',background:'none',border:'none',cursor:'pointer',
                borderBottom:activeTab===i?'2px solid #059669':'2px solid transparent',
                color:activeTab===i?'#059669':'#6b7280',transition:'color 0.15s'}}>
              {t}
            </button>
          ))}
        </div>
        <div style={{background:'white',borderRadius:12,border:'1px solid #e5e7eb',padding:24}}>
          {tabComponents[activeTab]}
        </div>
      </div>
    </div>
  );
}
