import React, { useState, useCallback } from 'react';
import axios from 'axios';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';

const Section = ({title,children})=>(<div style={{marginBottom:24}}><h2 style={{fontSize:17,fontWeight:600,color:'#111827',marginBottom:12,borderBottom:'2px solid #059669',paddingBottom:4}}>{title}</h2>{children}</div>);
const KpiCard = ({label,value,sub})=>(<div style={{background:'#fff',border:'1px solid #e5e7eb',borderRadius:10,padding:16,borderLeft:'3px solid #059669'}}><div style={{fontSize:11,color:'#6b7280',marginBottom:4}}>{label}</div><div style={{fontSize:24,fontWeight:700,color:'#111827'}}>{value}</div>{sub&&<div style={{fontSize:11,color:'#059669',marginTop:4}}>{sub}</div>}</div>);
const Row = ({children})=>(<div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))',gap:12,marginBottom:16}}>{children}</div>);
const Inp = ({label,...p})=>(<div style={{display:'flex',flexDirection:'column',gap:4}}><label style={{fontSize:11,color:'#6b7280'}}>{label}</label><input style={{border:'1px solid #d1d5db',borderRadius:6,padding:'7px 12px',fontSize:13,outline:'none',width:'100%',boxSizing:'border-box'}} {...p}/></div>);
const Sel = ({label,children,...p})=>(<div style={{display:'flex',flexDirection:'column',gap:4}}><label style={{fontSize:11,color:'#6b7280'}}>{label}</label><select style={{border:'1px solid #d1d5db',borderRadius:6,padding:'7px 12px',fontSize:13,outline:'none',width:'100%',boxSizing:'border-box'}} {...p}>{children}</select></div>);
const Btn = ({children,...p})=>(<button style={{background:'#059669',color:'#fff',padding:'8px 16px',borderRadius:6,fontSize:13,fontWeight:500,border:'none',cursor:'pointer'}} {...p}>{children}</button>);
const Badge = ({children,color='green'})=>{ const c={green:{background:'#d1fae5',color:'#065f46'},red:{background:'#fee2e2',color:'#991b1b'},yellow:{background:'#fef3c7',color:'#92400e'},blue:{background:'#dbeafe',color:'#1e40af'},gray:{background:'#f3f4f6',color:'#374151'}}; const s=c[color]||c.green; return(<span style={{padding:'2px 8px',borderRadius:4,fontSize:11,fontWeight:600,...s}}>{children}</span>); };

const thStyle={border:'1px solid #e5e7eb',padding:'4px 12px',fontSize:11,textAlign:'left',fontWeight:500,color:'#6b7280'};
const tdStyle={border:'1px solid #e5e7eb',padding:'4px 12px'};
const tdMono={...tdStyle,fontFamily:'monospace',fontWeight:700};
const errStyle={marginBottom:12,padding:'8px 12px',background:'#fffbeb',border:'1px solid #fde68a',borderRadius:6,fontSize:13,color:'#92400e'};

const seed = 115;
const rng = (i,s=seed) => Math.abs(Math.sin(i*9301+s*49297)*233280)%233280/233280;
const COLORS = ['#059669','#10b981','#34d399','#6ee7b7','#f59e0b','#0284c7'];
const SECTORS = ['Energy','Materials','Industrials','Consumer','Healthcare','Financials','Technology','Real Estate','Utilities','Agriculture'];
const TABS = ['Quality Assessment','SPT Calibration','Margin Mechanics','Greenwashing Screen','Market Context'];

function Tab1({instrumentType,issuerName,sector,notional,kpiName}) {
  const [result,setResult]=useState(null); const [loading,setLoading]=useState(false); const [error,setError]=useState(null);
  const icmaScore=Math.round(55+rng(1)*40);
  const kpiMat=Math.round(50+rng(2)*45);
  const sptAmbition=Math.round(45+rng(3)*50);
  const overall=Math.round((icmaScore+kpiMat+sptAmbition)/3);
  const grade=overall>=80?'A':overall>=65?'B':overall>=50?'C':'D';
  const gradeColor=g=>g==='A'?'green':g==='B'?'blue':g==='C'?'yellow':'red';
  const run=useCallback(async()=>{ setLoading(true); setError(null); try { const r=await axios.post('http://localhost:8001/api/v1/sll-slb-v2/assess',{instrument_type:instrumentType,issuer_name:issuerName,sector,notional_usd:parseFloat(notional),kpi_name:kpiName}); setResult(r.data); } catch { setError('API unavailable — demo mode.'); setResult({}); } setLoading(false); },[instrumentType,issuerName,sector,notional,kpiName]);
  const scores=[
    {criterion:'KPI Relevance & Materiality', score:kpiMat},
    {criterion:'SPT Ambition (vs SDA)', score:sptAmbition},
    {criterion:'Baseline Credibility', score:Math.round(50+rng(4)*45)},
    {criterion:'External Verification', score:Math.round(55+rng(5)*40)},
    {criterion:'Reporting Frequency', score:Math.round(60+rng(6)*35)},
    {criterion:'ICMA/LMA Alignment', score:icmaScore},
  ];
  return (
    <div>
      <Section title="Quality Assessment">
        {error&&<div style={errStyle}>{error}</div>}
        <Btn onClick={run} disabled={loading}>{loading?'Assessing…':'Assess Instrument Quality'}</Btn>
      </Section>
      <Row>
        <KpiCard label="ICMA Alignment" value={`${icmaScore}%`} sub={`${instrumentType==='SLL'?'LMA SLLP 2023':'ICMA SLB Principles 2023'}`} />
        <KpiCard label="KPI Materiality" value={`${kpiMat}%`} sub={`${kpiName} — sector materiality`} />
        <KpiCard label="SPT Ambition" value={`${sptAmbition}%`} sub="vs SDA trajectory (SBTi)" />
        <KpiCard label="Overall Grade" value={grade} sub={`${overall}/100 composite score`} />
      </Row>
      <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:16}}>
        <span style={{fontSize:13,color:'#6b7280'}}>Grade:</span>
        <Badge color={gradeColor(grade)}>Grade {grade}</Badge>
      </div>
      <Section title="6-Criterion Scoring Breakdown">
        <table style={{width:'100%',fontSize:13,borderCollapse:'collapse'}}>
          <thead><tr style={{background:'#f9fafb'}}>{['Criterion','Score','Status'].map(h=><th key={h} style={thStyle}>{h}</th>)}</tr></thead>
          <tbody>{scores.map((s,i)=>(<tr key={i}>
            <td style={{...tdStyle,fontWeight:500,fontSize:11}}>{s.criterion}</td>
            <td style={tdMono}>{s.score}%</td>
            <td style={tdStyle}><Badge color={s.score>=75?'green':s.score>=50?'yellow':'red'}>{s.score>=75?'Strong':s.score>=50?'Adequate':'Weak'}</Badge></td>
          </tr>))}</tbody>
        </table>
      </Section>
    </div>
  );
}

function Tab2({kpiName}) {
  const years=Array.from({length:27},(_,i)=>2024+i);
  const baseline=Math.round(100+rng(10)*200);
  const lineData=years.map((y,i)=>({
    year:y,
    baseline_trajectory: Math.round(baseline - i*2),
    spt: Math.round(baseline - i*(8+rng(11)*4)),
    sda: Math.round(baseline - i*(10+rng(12)*5)),
  }));
  const ambitionTier=rng(13)>0.6?'Ambitious (1.5°C aligned)':rng(13)>0.3?'Credible (2°C aligned)':'Below market ambition';
  const tierColor=t=>t.startsWith('Ambitious')?'green':t.startsWith('Credible')?'blue':'red';
  return (
    <div>
      <Row>
        <KpiCard label="Baseline (2023)" value={baseline} sub={`${kpiName} — baseline year value`} />
        <KpiCard label="SPT Target (2030)" value={Math.round(baseline*0.55)} sub="-45% reduction target" />
        <KpiCard label="Ambition vs SDA" value={`${Math.round(80+rng(14)*18)}%`} sub="SPT vs SDA trajectory alignment" />
        <KpiCard label="Ambition Tier" value={ambitionTier.split(' ')[0]} sub={ambitionTier} />
      </Row>
      <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:16}}>
        <Badge color={tierColor(ambitionTier)}>{ambitionTier}</Badge>
      </div>
      <Section title={`SPT vs SDA Trajectory 2024–2050 — ${kpiName}`}>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={lineData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="year" tick={{fontSize:10}} />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="baseline_trajectory" stroke="#6b7280" strokeDasharray="4 4" strokeWidth={1.5} name="Baseline (BAU)" />
            <Line type="monotone" dataKey="spt" stroke="#059669" strokeWidth={2.5} name="SPT Target" />
            <Line type="monotone" dataKey="sda" stroke="#0284c7" strokeDasharray="6 3" strokeWidth={2} name="SDA Pathway" />
          </LineChart>
        </ResponsiveContainer>
      </Section>
    </div>
  );
}

function Tab3({instrumentType,notional}) {
  const notNum=parseFloat(notional)||100;
  const baseRate=+(4.5+rng(20)*2).toFixed(2);
  const stepUp=+(0.1+rng(21)*0.3).toFixed(2);
  const years=Array.from({length:7},(_,i)=>2024+i);
  const lineData=years.map((y,i)=>({
    year:y,
    hit:+( baseRate - stepUp*(i>2?1:0) ).toFixed(2),
    miss:+( baseRate + stepUp*(i>2?1:0) ).toFixed(2),
    partial:+( baseRate ).toFixed(2),
  }));
  const npvHit=+(notNum*(stepUp/100)*3.2).toFixed(1);
  const npvMiss=-(notNum*(stepUp/100)*3.2).toFixed(1);
  return (
    <div>
      <Row>
        <KpiCard label="Base Coupon / Margin" value={`${baseRate}%`} sub={`${instrumentType} initial rate`} />
        <KpiCard label="Step-Up / Step-Down" value={`±${stepUp}%`} sub={instrumentType==='SLB'?'Coupon step-up on miss':'Margin ratchet' } />
        <KpiCard label="NPV (KPI Hit)" value={`+$${npvHit}M`} sub="Issuer benefit vs conventional" />
        <KpiCard label="NPV (KPI Miss)" value={`$${npvMiss}M`} sub="Issuer penalty cost" />
      </Row>
      <Section title="Coupon / Margin 2024–2030 — Hit / Miss / Partial Scenarios">
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={lineData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="year" />
            <YAxis domain={[baseRate-0.5, baseRate+0.5]} unit="%" tickFormatter={v=>v.toFixed(2)} />
            <Tooltip formatter={v=>`${v}%`} />
            <Legend />
            <Line type="stepAfter" dataKey="hit" stroke="#059669" strokeWidth={2.5} name="SPT Hit" />
            <Line type="stepAfter" dataKey="partial" stroke="#f59e0b" strokeWidth={2} strokeDasharray="5 5" name="Partial" />
            <Line type="stepAfter" dataKey="miss" stroke="#ef4444" strokeWidth={2.5} name="SPT Miss" />
          </LineChart>
        </ResponsiveContainer>
      </Section>
      <Section title="NPV Summary Table">
        <table style={{width:'100%',fontSize:13,borderCollapse:'collapse'}}>
          <thead><tr style={{background:'#f9fafb'}}>{['Scenario','Coupon/Margin','NPV vs Conv.','Probability'].map(h=><th key={h} style={thStyle}>{h}</th>)}</tr></thead>
          <tbody>
            <tr><td style={tdStyle}>KPI Target Hit</td><td style={tdMono}>{(baseRate-stepUp).toFixed(2)}%</td><td style={{...tdStyle,color:'#047857',fontFamily:'monospace'}}>+${npvHit}M</td><td style={{...tdStyle,color:'#6b7280'}}>{Math.round(40+rng(22)*30)}%</td></tr>
            <tr><td style={tdStyle}>Partial Achievement</td><td style={tdMono}>{baseRate.toFixed(2)}%</td><td style={{...tdStyle,fontFamily:'monospace',color:'#6b7280'}}>$0M</td><td style={{...tdStyle,color:'#6b7280'}}>{Math.round(20+rng(23)*20)}%</td></tr>
            <tr><td style={tdStyle}>KPI Miss</td><td style={tdMono}>{(baseRate+stepUp).toFixed(2)}%</td><td style={{...tdStyle,color:'#b91c1c',fontFamily:'monospace'}}>${npvMiss}M</td><td style={{...tdStyle,color:'#6b7280'}}>{Math.round(15+rng(24)*20)}%</td></tr>
          </tbody>
        </table>
      </Section>
    </div>
  );
}

function Tab4() {
  const flags=[
    {flag:'SPT set retroactively after performance trend clear', severity:'Major', present: rng(30)<0.3},
    {flag:'KPI not material to issuer core business model', severity:'Major', present: rng(31)<0.25},
    {flag:'No third-party SPT verification clause', severity:'Moderate', present: rng(32)<0.4},
    {flag:'SPT observation date beyond bond maturity', severity:'Major', present: rng(33)<0.15},
    {flag:'Proceeds earmarked for non-green purpose post-miss', severity:'Moderate', present: rng(34)<0.3},
    {flag:'No public disclosure of KPI baseline methodology', severity:'Moderate', present: rng(35)<0.35},
    {flag:'Step-up so small it lacks financial materiality (<5bps)', severity:'Minor', present: rng(36)<0.5},
    {flag:'Scope 3 excluded from GHG KPI without justification', severity:'Minor', present: rng(37)<0.45},
    {flag:'No transition plan linked to SLL covenants', severity:'Minor', present: rng(38)<0.4},
  ];
  const active=flags.filter(f=>f.present);
  const sevColor=s=>s==='Major'?'red':s==='Moderate'?'yellow':'gray';
  return (
    <div>
      <Row>
        <KpiCard label="Red Flags Detected" value={active.length} sub={`Out of ${flags.length} checks`} />
        <KpiCard label="Major Flags" value={active.filter(f=>f.severity==='Major').length} sub="Potential greenwashing risk" />
        <KpiCard label="Greenwashing Risk" value={active.filter(f=>f.severity==='Major').length>=2?'High':active.length>=3?'Medium':'Low'} sub="Overall assessment" />
        <KpiCard label="SPO Recommended" value="Yes" sub="Second Party Opinion — always required" />
      </Row>
      <Section title="Greenwashing Red Flag Checklist">
        <ul style={{display:'flex',flexDirection:'column',gap:8,listStyle:'none',margin:0,padding:0}}>
          {flags.map((f,i)=>(<li key={i} style={{display:'flex',alignItems:'flex-start',gap:12,padding:8,borderRadius:6,border:f.present?'1px solid #fecaca':'1px solid #bbf7d0',background:f.present?'#fef2f2':'#f0fdf4'}}>
            <span style={{marginTop:2,width:20,height:20,borderRadius:'50%',flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:700,background:f.present?'#ef4444':'#059669',color:'#fff'}}>{f.present?'!':'✓'}</span>
            <div style={{display:'flex',alignItems:'center',gap:8,flex:1,flexWrap:'wrap'}}>
              <span style={{fontSize:13,color:'#1f2937'}}>{f.flag}</span>
              <Badge color={f.present?sevColor(f.severity):'gray'}>{f.severity}</Badge>
            </div>
          </li>))}
        </ul>
      </Section>
    </div>
  );
}

function Tab5({sector}) {
  const issuanceData=['2020','2021','2022','2023','2024'].map((y,i)=>({
    year:y,
    SLL:Math.round(100+i*150+rng(i+40)*200),
    SLB:Math.round(80+i*130+rng(i+41)*180),
  }));
  const spoShare=[{name:'ISS ESG',value:35},{name:'Sustainalytics',value:28},{name:'V.E / Moody\'s',value:20},{name:'CICERO',value:12},{name:'Other',value:5}];
  return (
    <div>
      <Row>
        <KpiCard label="Global SLL/SLB Market" value="$3.1T" sub="Outstanding (2024 estimate)" />
        <KpiCard label="YoY Growth" value={`+${Math.round(15+rng(50)*25)}%`} sub="2023 to 2024" />
        <KpiCard label="Avg Step-Up" value={`${(0.10+rng(51)*0.20).toFixed(2)}%`} sub="Market median coupon adjustment" />
        <KpiCard label={`${sector} Share`} value={`${Math.round(5+rng(52)*25)}%`} sub="Sector % of global issuance" />
      </Row>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:24}}>
        <Section title="SLL / SLB Issuance 2020–2024 ($bn)">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={issuanceData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="year" />
              <YAxis unit="bn" />
              <Tooltip formatter={v=>`$${v}bn`} />
              <Legend />
              <Bar dataKey="SLL" fill="#059669" name="SLL" />
              <Bar dataKey="SLB" fill="#0284c7" name="SLB" />
            </BarChart>
          </ResponsiveContainer>
        </Section>
        <Section title="SPO Market Share">
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={spoShare} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={95} label={({name,percent})=>`${(percent*100).toFixed(0)}%`}>
                {spoShare.map((_,i)=><Cell key={i} fill={COLORS[i%COLORS.length]} />)}
              </Pie>
              <Tooltip /><Legend />
            </PieChart>
          </ResponsiveContainer>
        </Section>
      </div>
    </div>
  );
}

export default function SLLSLBv2Page() {
  const [activeTab,setActiveTab]=useState(0);
  const [instrumentType,setInstrumentType]=useState('SLL');
  const [issuerName,setIssuerName]=useState('European Industrial Holdings');
  const [sector,setSector]=useState('Industrials');
  const [notional,setNotional]=useState('500');
  const [kpiName,setKpiName]=useState('Scope 1+2 GHG Emissions');
  const panels=[<Tab1 instrumentType={instrumentType} issuerName={issuerName} sector={sector} notional={notional} kpiName={kpiName}/>,<Tab2 kpiName={kpiName}/>,<Tab3 instrumentType={instrumentType} notional={notional}/>,<Tab4/>,<Tab5 sector={sector}/>];
  return (
    <div style={{minHeight:'100vh',background:'#f9fafb',padding:24}}>
      <div style={{maxWidth:1200,margin:'0 auto'}}>
        <div style={{marginBottom:24}}>
          <h1 style={{fontSize:24,fontWeight:700,color:'#111827'}}>SLL / SLB Quality Engine v2</h1>
          <p style={{fontSize:13,color:'#6b7280',marginTop:4}}>LMA SLLP 2023 · ICMA SLB Principles 2023 · SPT Calibration · Margin Mechanics · Greenwashing Screen · E115</p>
        </div>
        <div style={{background:'white',border:'1px solid #e5e7eb',borderRadius:8,padding:16,marginBottom:24}}>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))',gap:16}}>
            <Sel label="Instrument Type" value={instrumentType} onChange={e=>setInstrumentType(e.target.value)}><option value="SLL">SLL</option><option value="SLB">SLB</option></Sel>
            <Inp label="Issuer Name" value={issuerName} onChange={e=>setIssuerName(e.target.value)} />
            <Sel label="Sector" value={sector} onChange={e=>setSector(e.target.value)}>{SECTORS.map(o=><option key={o}>{o}</option>)}</Sel>
            <Inp label="Notional (USD M)" type="number" value={notional} onChange={e=>setNotional(e.target.value)} />
            <Inp label="KPI Name" value={kpiName} onChange={e=>setKpiName(e.target.value)} />
          </div>
        </div>
        <div style={{display:'flex',gap:8,marginBottom:24,borderBottom:'1px solid #e5e7eb',overflowX:'auto'}}>
          {TABS.map((t,i)=>(<button key={i} onClick={()=>setActiveTab(i)} style={{padding:'8px 16px',fontSize:13,fontWeight:500,whiteSpace:'nowrap',background:'none',border:'none',cursor:'pointer',borderBottom:activeTab===i?'2px solid #059669':'2px solid transparent',color:activeTab===i?'#059669':'#6b7280'}}>{t}</button>))}
        </div>
        <div style={{background:'white',borderRadius:12,border:'1px solid #e5e7eb',padding:24}}>{panels[activeTab]}</div>
      </div>
    </div>
  );
}
