import React, { useState, useCallback } from 'react';
import axios from 'axios';
import {
  BarChart, Bar, PieChart, Pie, Cell,
  AreaChart, Area, LineChart, Line,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';

const Section = ({title,children})=>(<div style={{marginBottom:24}}><h2 style={{fontSize:17,fontWeight:600,color:'#111827',marginBottom:12,borderBottom:'2px solid #059669',paddingBottom:4}}>{title}</h2>{children}</div>);
const KpiCard = ({label,value,sub})=>(<div style={{background:'#fff',border:'1px solid #e5e7eb',borderRadius:10,padding:16,borderLeft:'3px solid #059669'}}><div style={{fontSize:11,color:'#6b7280',marginBottom:4}}>{label}</div><div style={{fontSize:24,fontWeight:700,color:'#111827'}}>{value}</div>{sub&&<div style={{fontSize:11,color:'#059669',marginTop:4}}>{sub}</div>}</div>);
const Row = ({children})=>(<div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))',gap:12,marginBottom:16}}>{children}</div>);
const Sel = ({label,children,...p})=>(<div style={{display:'flex',flexDirection:'column',gap:4}}><label style={{fontSize:11,color:'#6b7280'}}>{label}</label><select style={{border:'1px solid #d1d5db',borderRadius:6,padding:'7px 12px',fontSize:13,outline:'none',width:'100%',boxSizing:'border-box'}} {...p}>{children}</select></div>);
const Inp = ({label,...p})=>(<div style={{display:'flex',flexDirection:'column',gap:4}}><label style={{fontSize:11,color:'#6b7280'}}>{label}</label><input style={{border:'1px solid #d1d5db',borderRadius:6,padding:'7px 12px',fontSize:13,outline:'none',width:'100%',boxSizing:'border-box'}} {...p}/></div>);
const Btn = ({children,...p})=>(<button style={{background:'#059669',color:'#fff',padding:'8px 16px',borderRadius:6,fontSize:13,fontWeight:500,border:'none',cursor:'pointer'}} {...p}>{children}</button>);
const Badge = ({children,color='green'})=>{ const c={green:{background:'#d1fae5',color:'#065f46'},red:{background:'#fee2e2',color:'#991b1b'},yellow:{background:'#fef3c7',color:'#92400e'},blue:{background:'#dbeafe',color:'#1e40af'},gray:{background:'#f3f4f6',color:'#374151'}}; const s=c[color]||c.green; return(<span style={{padding:'2px 8px',borderRadius:4,fontSize:11,fontWeight:600,...s}}>{children}</span>); };

const tblStyle = {width:'100%',fontSize:13,borderCollapse:'collapse'};
const thStyle = {border:'1px solid #e5e7eb',padding:'6px 8px',fontSize:11,textAlign:'left',fontWeight:500,color:'#6b7280',background:'#f9fafb'};
const tdStyle = {border:'1px solid #e5e7eb',padding:'6px 8px'};
const errStyle = {marginBottom:12,padding:'8px 12px',background:'#fffbeb',border:'1px solid #fde68a',borderRadius:6,fontSize:13,color:'#92400e'};

const seed = 113;
const rng = (i,s=seed) => Math.abs(Math.sin(i*9301+s*49297)*233280)%233280/233280;
const COLORS=['#059669','#f59e0b','#ef4444','#0284c7','#7c3aed'];

const COUNTRIES_30=['Pakistan','Bangladesh','Ethiopia','Nigeria','Mozambique','Philippines','Indonesia','Vietnam','India','Nepal','Fiji','Tuvalu','Vanuatu','Maldives','Solomon Islands','Barbados','Jamaica','Honduras','Haiti','Malawi','Zambia','Zimbabwe','Sudan','Somalia','Senegal','Ghana','Tanzania','Kenya','Peru','Bolivia'];
const EVENT_TYPES=['Tropical Cyclone','Flooding','Drought','Heatwave','Sea Level Rise','Wildfire','Glacial Melt','Coastal Erosion'];
const TABS=['Vulnerability Profile','Loss Accounting','Protection Gap','Fund Eligibility','Parametric Design'];

function Tab1({country,eventType}) {
  const [result,setResult]=useState(null); const [loading,setLoading]=useState(false); const [error,setError]=useState(null);
  const dims=[{dim:'Climate',score:Math.round(50+rng(1)*45)},{dim:'Economic',score:Math.round(30+rng(2)*60)},{dim:'Social',score:Math.round(40+rng(3)*55)},{dim:'Institutional',score:Math.round(25+rng(4)*65)},{dim:'Geographic',score:Math.round(45+rng(5)*50)}];
  const isV20=rng(6)>0.5; const isSIDS=rng(7)>0.6; const isLDC=rng(8)>0.4;
  const overall=Math.round(dims.reduce((s,d)=>s+d.score,0)/dims.length);
  const run=useCallback(async()=>{ setLoading(true); setError(null); try { const r=await axios.post('http://localhost:8001/api/v1/loss-damage/assess',{country,event_type:eventType,economic_loss_usd_bn:5}); setResult(r.data); } catch { setError('API unavailable — demo mode.'); setResult({}); } setLoading(false); },[country,eventType]);
  return (
    <div>
      <Section title="Vulnerability Assessment">
        {error&&<div style={errStyle}>{error}</div>}
        <Btn onClick={run} disabled={loading}>{loading?'Assessing…':'Assess Vulnerability'}</Btn>
      </Section>
      <Row>
        <KpiCard label="Vulnerability Score" value={`${overall}/100`} sub={`${country} composite`} />
        <KpiCard label="V20 Member" value={isV20?'Yes':'No'} sub="Vulnerable 20 Group" />
        <KpiCard label="SIDS" value={isSIDS?'Yes':'No'} sub="Small Island Dev. State" />
        <KpiCard label="LDC" value={isLDC?'Yes':'No'} sub="Least Developed Country (UN)" />
      </Row>
      <div style={{display:'flex',gap:8,marginBottom:16,flexWrap:'wrap'}}>
        {isV20&&<Badge color="red">V20 Member</Badge>}
        {isSIDS&&<Badge color="blue">SIDS</Badge>}
        {isLDC&&<Badge color="yellow">LDC</Badge>}
        <Badge color={overall>65?'red':overall>40?'yellow':'green'}>{overall>65?'High Vulnerability':overall>40?'Moderate':'Low Vulnerability'}</Badge>
      </div>
      <Section title="5-Dimension Vulnerability Radar">
        <ResponsiveContainer width="100%" height={300}>
          <RadarChart data={dims}>
            <PolarGrid stroke="#e5e7eb" />
            <PolarAngleAxis dataKey="dim" tick={{fontSize:12}} />
            <PolarRadiusAxis angle={90} domain={[0,100]} tick={{fontSize:9}} />
            <Radar name="Vulnerability" dataKey="score" stroke="#ef4444" fill="#ef4444" fillOpacity={0.3} />
            <Tooltip />
          </RadarChart>
        </ResponsiveContainer>
      </Section>
    </div>
  );
}

function Tab2({economicLoss}) {
  const loss=parseFloat(economicLoss)||5;
  const econPct=Math.round(45+rng(10)*30); const nonEconPct=100-econPct;
  const pieData=[{name:'Economic Loss',value:econPct},{name:'Non-Economic Loss',value:nonEconPct}];
  const sectorData=[
    {sector:'Infrastructure',loss:Math.round(loss*0.3*10)/10},
    {sector:'Agriculture',loss:Math.round(loss*0.25*10)/10},
    {sector:'Property',loss:Math.round(loss*0.28*10)/10},
    {sector:'Tourism',loss:Math.round(loss*0.17*10)/10},
  ];
  return (
    <div>
      <Row>
        <KpiCard label="Total Economic Loss" value={`$${loss}bn`} sub="Assessed event loss" />
        <KpiCard label="Non-Economic Loss" value={`${nonEconPct}%`} sub="Cultural / ecosystem / loss of life" />
        <KpiCard label="Insured Fraction" value={`${Math.round(5+rng(15)*20)}%`} sub="Covered by insurance" />
        <KpiCard label="Recovery Cost" value={`$${(loss*1.4).toFixed(1)}bn`} sub="Est. 10-yr recovery expenditure" />
      </Row>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(300px,1fr))',gap:24}}>
        <Section title="Economic vs Non-Economic Loss Split">
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={({name,percent})=>`${(percent*100).toFixed(0)}%`}>
                {pieData.map((_,i)=><Cell key={i} fill={COLORS[i]} />)}
              </Pie>
              <Tooltip /><Legend />
            </PieChart>
          </ResponsiveContainer>
        </Section>
        <Section title="Loss by Sector ($bn)">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={sectorData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="sector" tick={{fontSize:11}} />
              <YAxis unit="bn" />
              <Tooltip formatter={v=>`$${v}bn`} />
              <Bar dataKey="loss" fill="#ef4444" name="Loss ($bn)">
                {sectorData.map((_,i)=><Cell key={i} fill={COLORS[i]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Section>
      </div>
    </div>
  );
}

function Tab3() {
  const years=Array.from({length:15},(_,i)=>2010+i);
  const areaData=years.map((y,i)=>({
    year:y,
    total:Math.round(50+i*18+rng(i+20)*80),
    insured:Math.round(8+i*4+rng(i+21)*20),
  }));
  const gap=areaData[areaData.length-1].total-areaData[areaData.length-1].insured;
  return (
    <div>
      <Row>
        <KpiCard label="2024 Total Loss" value={`$${areaData[14].total}bn`} sub="Gross economic + non-economic" />
        <KpiCard label="2024 Insured Loss" value={`$${areaData[14].insured}bn`} sub="Insurance payout" />
        <KpiCard label="Protection Gap" value={`$${gap}bn`} sub="Uninsured loss (${Math.round(gap/areaData[14].total*100)}%)" />
        <KpiCard label="Gap Trend" value={`+${Math.round(8+rng(30)*12)}%`} sub="Annual growth in protection gap" />
      </Row>
      <Section title="Insured vs Total Loss 2010–2024 ($bn)">
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={areaData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="year" />
            <YAxis unit="bn" />
            <Tooltip formatter={v=>`$${v}bn`} />
            <Legend />
            <Area type="monotone" dataKey="total" stroke="#ef4444" fill="#fee2e2" name="Total Loss" />
            <Area type="monotone" dataKey="insured" stroke="#059669" fill="#d1fae5" name="Insured Loss" />
          </AreaChart>
        </ResponsiveContainer>
      </Section>
    </div>
  );
}

function Tab4({country}) {
  const funds=[
    {fund:'Warsaw International Mechanism (WIM)', eligibility: rng(40)>0.3, condition:'LDC / SIDS / V20 membership', amount:'Technical assistance'},
    {fund:'Santiago Network (SNLD)', eligibility: rng(41)>0.25, condition:'Developing country status', amount:'Technical advisory'},
    {fund:'COP28 Fund (L&D Fund — Art. 9)', eligibility: rng(42)>0.2, condition:'Particularly vulnerable countries', amount:'$700M pledged (2024)'},
    {fund:'Green Climate Fund (GCF)', eligibility: rng(43)>0.15, condition:'National designated authority', amount:'$9.3bn 2024–2027'},
    {fund:'Adaptation Fund', eligibility: rng(44)>0.2, condition:'Annex I Non-Party', amount:'$800M 2024'},
    {fund:'CREWS (Climate Risk Early Warning)', eligibility: rng(45)>0.3, condition:'LDC / SIDS', amount:'Technical + financial'},
  ];
  const eligible=funds.filter(f=>f.eligibility).length;
  return (
    <div>
      <Row>
        <KpiCard label="Eligible Funds" value={`${eligible}/${funds.length}`} sub={`${country} access`} />
        <KpiCard label="Max Potential" value={`$${Math.round(50+rng(50)*500)}M`} sub="Estimated accessible funding" />
        <KpiCard label="Key Gateway" value="UNFCCC National Focal Point" sub="Required for most mechanisms" />
        <KpiCard label="Fast-Track Eligible" value={rng(51)>0.4?'Yes':'No'} sub="Expedited access track" />
      </Row>
      <Section title="Fund Eligibility Checklist">
        <ul style={{display:'flex',flexDirection:'column',gap:12,listStyle:'none',margin:0,padding:0}}>
          {funds.map((f,i)=>(<li key={i} style={{display:'flex',alignItems:'flex-start',gap:12,padding:12,borderRadius:6,border:f.eligibility?'1px solid #a7f3d0':'1px solid #fecaca',background:f.eligibility?'#ecfdf5':'#fef2f2'}}>
            <span style={{marginTop:2,width:20,height:20,borderRadius:'50%',flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:700,background:f.eligibility?'#059669':'#ef4444',color:'#fff'}}>{f.eligibility?'✓':'✗'}</span>
            <div>
              <div style={{fontWeight:500,fontSize:14,color:'#111827'}}>{f.fund}</div>
              <div style={{fontSize:12,color:'#6b7280',marginTop:2}}>{f.condition} · {f.amount}</div>
            </div>
          </li>))}
        </ul>
      </Section>
    </div>
  );
}

function Tab5({eventType}) {
  const triggerPct=Math.round(30+rng(60)*40);
  const payoutData=Array.from({length:11},(_,i)=>({
    threshold:`T${i*10}`,
    payout: i<triggerPct/10?0:Math.min(100,Math.round((i-triggerPct/10)*25)),
  }));
  const histLine=Array.from({length:10},(_,i)=>({year:2015+i,value:Math.round(20+rng(i+70)*80)}));
  return (
    <div>
      <Row>
        <KpiCard label="Trigger Threshold" value={`${triggerPct}th pct`} sub={`${eventType} intensity index`} />
        <KpiCard label="Maximum Payout" value={`$${Math.round(50+rng(61)*200)}M`} sub="Cap per event" />
        <KpiCard label="Attachment" value={`$${Math.round(10+rng(62)*40)}M`} sub="Minimum deductible" />
        <KpiCard label="Expected Loss" value={`$${Math.round(5+rng(63)*30)}M/yr`} sub="Actuarial annual average" />
      </Row>
      <Section title={`Parametric Trigger vs Index (${eventType})`}>
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={histLine}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="year" />
            <YAxis unit=" idx" />
            <Tooltip />
            <Line type="monotone" dataKey="value" stroke="#0284c7" strokeWidth={2} name="Index Value" />
          </LineChart>
        </ResponsiveContainer>
      </Section>
      <Section title="Payout Curve vs Trigger (%)">
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={payoutData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="threshold" />
            <YAxis unit="%" />
            <Tooltip formatter={v=>`${v}%`} />
            <Bar dataKey="payout" name="Payout %" fill="#059669">
              {payoutData.map((d,i)=><Cell key={i} fill={d.payout>0?'#059669':'#d1d5db'} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Section>
    </div>
  );
}

export default function LossDamagePage() {
  const [activeTab,setActiveTab]=useState(0);
  const [country,setCountry]=useState('Pakistan');
  const [eventType,setEventType]=useState('Flooding');
  const [economicLoss,setEconomicLoss]=useState('8');
  const panels=[<Tab1 country={country} eventType={eventType}/>,<Tab2 economicLoss={economicLoss}/>,<Tab3/>,<Tab4 country={country}/>,<Tab5 eventType={eventType}/>];
  return (
    <div style={{minHeight:'100vh',background:'#f9fafb',padding:24}}>
      <div style={{maxWidth:1200,margin:'0 auto'}}>
        <div style={{marginBottom:24}}>
          <h1 style={{fontSize:24,fontWeight:700,color:'#111827'}}>Loss & Damage Finance Engine</h1>
          <p style={{fontSize:14,color:'#6b7280',marginTop:4}}>Warsaw Mechanism · Santiago Network · COP28 L&D Fund · Protection Gap · Parametric Design · V20/SIDS/LDC · E113</p>
        </div>
        <div style={{background:'#fff',border:'1px solid #e5e7eb',borderRadius:8,padding:16,marginBottom:24}}>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))',gap:16}}>
            <Sel label="Country" value={country} onChange={e=>setCountry(e.target.value)}>{COUNTRIES_30.map(o=><option key={o}>{o}</option>)}</Sel>
            <Sel label="Event Type" value={eventType} onChange={e=>setEventType(e.target.value)}>{EVENT_TYPES.map(o=><option key={o}>{o}</option>)}</Sel>
            <Inp label="Economic Loss (USD bn)" type="number" value={economicLoss} onChange={e=>setEconomicLoss(e.target.value)} />
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
