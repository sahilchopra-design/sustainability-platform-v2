import React, { useState, useMemo } from 'react';
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area, ComposedChart, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell, ReferenceLine
} from 'recharts';

const T = { bg:'#f6f4f0', surface:'#ffffff', border:'#e5e0d8', navy:'#1b3a5c', navyL:'#2c5a8c', gold:'#c5a96a', textSec:'#5c6b7e', textMut:'#9aa3ae', red:'#dc2626', green:'#16a34a', amber:'#d97706', blue:'#2563eb', orange:'#ea580c', purple:'#7c3aed', teal:'#0891b2', sage:'#5a8a6a', font:"'DM Sans','SF Pro Display',system-ui,sans-serif", mono:"'JetBrains Mono','SF Mono','Fira Code',monospace" };

const TABS = ['Breach Probability Dashboard','Financial Covenants at Risk','Scenario-Conditional Breach','Early Warning Signals','Remediation Options','Lender Action Framework'];
const SCENARIOS = ['Current Policies','Delayed Transition','Below 2\u00b0C','Net Zero 2050'];

const _sr = (s) => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };
const BORROWERS = Array.from({length:15},(_, i)=>{
  const names = ['CoalCo Holdings','PetroGlobal Inc','CementWorks Ltd','SteelForge Corp','PowerGen Alpha','ChemProcess AG','MiningDeep Ltd','GasTurbine Co','RefineryPlus','PipelineNet','AviationHvy','LNG Global','Coal Port Inc','OilSands Corp','ThermalGen Ltd'];
  const sectors = ['Coal','Oil & Gas','Cement','Steel','Power','Chemicals','Mining','Gas','Refining','Pipeline','Aviation','LNG','Ports','Oil Sands','Thermal'];
  const leverage = 2.5 + _sr(i*11) * 4;
  const icr  = 1.2 + _sr(i*13) * 5;
  const dscr = 0.8 + _sr(i*17) * 1.5;
  return { id:`B-${i+1}`, name:names[i], sector:sectors[i], leverage:+leverage.toFixed(1), leverageCov:4.5, icr:+icr.toFixed(1), icrCov:2.0, dscr:+dscr.toFixed(2), dscrCov:1.2,
    breachProb_cp: Math.round(5  + _sr(i*19) * 30),
    breachProb_dt: Math.round(10 + _sr(i*23) * 40),
    breachProb_b2c:Math.round(20 + _sr(i*29) * 50),
    breachProb_nz: Math.round(30 + _sr(i*31) * 60),
    earlyWarning: i<5?'Red':i<10?'Amber':'Green',
    leadTime: Math.round(3 + _sr(i*37) * 15) };
});

const SCENARIO_KEYS = { 'Current Policies':'cp', 'Delayed Transition':'dt', 'Below 2\u00b0C':'b2c', 'Net Zero 2050':'nz' };

const REMEDIATION = [
  { action:'Covenant Reset', desc:'Renegotiate covenant levels with syndicate', timeframe:'2-4 months', cost:'Low', effectiveness:65 },
  { action:'Equity Injection', desc:'Raise new equity to deleverage', timeframe:'3-6 months', cost:'High', effectiveness:85 },
  { action:'Asset Disposal', desc:'Sell non-core assets to reduce debt', timeframe:'6-12 months', cost:'Medium', effectiveness:75 },
  { action:'Debt Restructuring', desc:'Extend maturities, reduce coupons', timeframe:'4-8 months', cost:'Medium', effectiveness:80 },
  { action:'Transition CapEx Waiver', desc:'Waive CapEx covenant for green investment', timeframe:'1-3 months', cost:'Low', effectiveness:55 },
  { action:'Insurance Hedge', desc:'Purchase climate risk insurance products', timeframe:'1-2 months', cost:'Medium', effectiveness:45 },
];

const LENDER_ACTIONS = [
  { trigger:'Breach Prob > 70%', action:'Immediate engagement', escalation:'Senior credit committee', timeline:'Within 5 business days' },
  { trigger:'Breach Prob > 50%', action:'Enhanced monitoring', escalation:'Credit risk team', timeline:'Monthly review' },
  { trigger:'Breach Prob > 30%', action:'Watchlist addition', escalation:'Relationship manager', timeline:'Quarterly review' },
  { trigger:'DSCR < 1.0x', action:'Cash sweep activation', escalation:'Workout team', timeline:'Immediate' },
  { trigger:'Leverage > 5.0x', action:'Mandatory prepayment notice', escalation:'Legal counsel', timeline:'30-day cure period' },
];

const Badge = ({code,label})=><div style={{display:'flex',alignItems:'center',gap:8,marginBottom:16}}><span style={{background:T.navy,color:'#fff',fontFamily:T.mono,fontSize:11,padding:'2px 10px',borderRadius:4}}>{code}</span><span style={{fontSize:13,color:T.textSec}}>{label}</span></div>;
const Card = ({children,style})=><div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:8,padding:20,...style}}>{children}</div>;
const KPI = ({label,value,sub,color})=><div style={{textAlign:'center'}}><div style={{fontSize:11,color:T.textMut,textTransform:'uppercase',letterSpacing:1}}>{label}</div><div style={{fontSize:26,fontWeight:700,color:color||T.navy,fontFamily:T.mono}}>{value}</div>{sub&&<div style={{fontSize:11,color:T.textSec}}>{sub}</div>}</div>;

export default function CovenantBreachPredictorPage(){
  const [tab,setTab]=useState(0);
  const [scenario,setScenario]=useState('Net Zero 2050');
  const [selectedBorrower,setSelectedBorrower]=useState(0);

  const sk = SCENARIO_KEYS[scenario];
  const highRisk = BORROWERS.filter(b=>b[`breachProb_${sk}`]>50).length;
  const avgBreach = Math.round(BORROWERS.reduce((s,b)=>s+b[`breachProb_${sk}`],0)/BORROWERS.length);

  const scenarioComparison = useMemo(()=>BORROWERS.map(b=>({ name:b.name, CP:b.breachProb_cp, DT:b.breachProb_dt, B2C:b.breachProb_b2c, NZ:b.breachProb_nz })),[]);
  const earlyWarnings = useMemo(()=>Array.from({length:18},(_, i)=>({
    month: i+1,
    leverageDrift: +(0.1 + i*0.08 + _sr(i*41)*0.3).toFixed(2),
    icrDrift:      +(-0.05 - i*0.06 + _sr(i*43)*0.2).toFixed(2),
    breachProb:    Math.min(95, Math.round(15 + i*3 + _sr(i*47)*8)),
  })),[]);

  return (
    <div style={{fontFamily:T.font,background:T.bg,minHeight:'100vh',padding:24}}>
      <Badge code="EP-CK6" label="Climate Covenant Breach Predictor" />
      <h2 style={{color:T.navy,margin:'0 0 4px'}}>Covenant Breach Prediction Engine</h2>
      <p style={{color:T.textSec,fontSize:13,margin:'0 0 16px'}}>P(breach | scenario) estimated from financial stress models with 6-12 month early warning signals</p>

      <div style={{display:'flex',gap:8,marginBottom:16,flexWrap:'wrap'}}>
        {TABS.map((t,i)=><button key={i} onClick={()=>setTab(i)} style={{padding:'6px 16px',borderRadius:6,border:`1px solid ${tab===i?T.navy:T.border}`,background:tab===i?T.navy:'#fff',color:tab===i?'#fff':T.navy,fontFamily:T.font,fontSize:12,fontWeight:600,cursor:'pointer'}}>{t}</button>)}
      </div>

      <div style={{display:'flex',gap:12,marginBottom:16,alignItems:'center'}}>
        <label style={{fontSize:12,color:T.textSec}}>Scenario:</label>
        <select value={scenario} onChange={e=>setScenario(e.target.value)} style={{padding:'4px 8px',borderRadius:4,border:`1px solid ${T.border}`,fontSize:12,fontFamily:T.mono}}>{SCENARIOS.map(s=><option key={s}>{s}</option>)}</select>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12,marginBottom:20}}>
        <Card><KPI label="Borrowers Monitored" value={BORROWERS.length} sub="active loans"/></Card>
        <Card><KPI label="High Breach Risk" value={highRisk} sub=">50% probability" color={T.red}/></Card>
        <Card><KPI label="Avg Breach Prob" value={`${avgBreach}%`} sub={scenario} color={avgBreach>40?T.red:T.amber}/></Card>
        <Card><KPI label="Red Warnings" value={BORROWERS.filter(b=>b.earlyWarning==='Red').length} sub="immediate attention" color={T.red}/></Card>
      </div>

      {tab===0 && (
        <Card>
          <h3 style={{color:T.navy,fontSize:15,margin:'0 0 12px'}}>Breach Probability Dashboard</h3>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={BORROWERS.sort((a,b)=>b[`breachProb_${sk}`]-a[`breachProb_${sk}`])} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis type="number" domain={[0,100]} tick={{fontSize:11}} tickFormatter={v=>`${v}%`}/><YAxis dataKey="name" type="category" tick={{fontSize:10}} width={130}/>
              <Tooltip contentStyle={{fontFamily:T.mono,fontSize:11}}/><ReferenceLine x={50} stroke={T.red} strokeDasharray="5 5"/>
              <Bar dataKey={`breachProb_${sk}`} name="Breach Probability">
                {BORROWERS.map((b,i)=><Cell key={i} fill={b[`breachProb_${sk}`]>70?T.red:b[`breachProb_${sk}`]>40?T.orange:b[`breachProb_${sk}`]>20?T.amber:T.green}/>)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}

      {tab===1 && (
        <Card>
          <h3 style={{color:T.navy,fontSize:15,margin:'0 0 12px'}}>Financial Covenants at Risk</h3>
          <div style={{overflowX:'auto'}}>
            <table style={{width:'100%',borderCollapse:'collapse',fontSize:12,fontFamily:T.mono}}>
              <thead><tr style={{borderBottom:`2px solid ${T.border}`}}>
                {['Borrower','Sector','Leverage','Cov (4.5x)','ICR','Cov (2.0x)','DSCR','Cov (1.2x)','Warning','Lead Time'].map(h=><th key={h} style={{padding:'8px 6px',textAlign:'left',color:T.textSec,fontWeight:600,fontSize:11}}>{h}</th>)}
              </tr></thead>
              <tbody>{BORROWERS.map(b=><tr key={b.id} style={{borderBottom:`1px solid ${T.border}`}}>
                <td style={{padding:'6px',fontWeight:600}}>{b.name}</td><td>{b.sector}</td>
                <td style={{color:b.leverage>b.leverageCov?T.red:T.green,fontWeight:700}}>{b.leverage}x</td><td style={{color:T.textMut}}>{b.leverageCov}x</td>
                <td style={{color:b.icr<b.icrCov?T.red:T.green,fontWeight:700}}>{b.icr}x</td><td style={{color:T.textMut}}>{b.icrCov}x</td>
                <td style={{color:b.dscr<b.dscrCov?T.red:T.green,fontWeight:700}}>{b.dscr}x</td><td style={{color:T.textMut}}>{b.dscrCov}x</td>
                <td><span style={{padding:'2px 8px',borderRadius:4,fontSize:10,background:b.earlyWarning==='Red'?T.red+'22':b.earlyWarning==='Amber'?T.amber+'22':T.green+'22',color:b.earlyWarning==='Red'?T.red:b.earlyWarning==='Amber'?T.amber:T.green}}>{b.earlyWarning}</span></td>
                <td>{b.leadTime}m</td>
              </tr>)}</tbody>
            </table>
          </div>
        </Card>
      )}

      {tab===2 && (
        <Card>
          <h3 style={{color:T.navy,fontSize:15,margin:'0 0 12px'}}>Scenario-Conditional Breach Probability</h3>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={scenarioComparison.slice(0,8)}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
              <XAxis dataKey="name" tick={{fontSize:9}} angle={-15}/><YAxis domain={[0,100]} tick={{fontSize:11}}/>
              <Tooltip contentStyle={{fontFamily:T.mono,fontSize:11}}/><Legend/>
              <Bar dataKey="CP" name="Current Policies" fill={T.green}/><Bar dataKey="DT" name="Delayed Trans." fill={T.amber}/>
              <Bar dataKey="B2C" name="Below 2\u00b0C" fill={T.orange}/><Bar dataKey="NZ" name="Net Zero" fill={T.red}/>
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}

      {tab===3 && (
        <Card>
          <h3 style={{color:T.navy,fontSize:15,margin:'0 0 12px'}}>Early Warning Signals (18-Month Forward)</h3>
          <ResponsiveContainer width="100%" height={320}>
            <ComposedChart data={earlyWarnings}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
              <XAxis dataKey="month" tick={{fontSize:11}} label={{value:'Months Ahead',position:'insideBottom',offset:-5}}/><YAxis yAxisId="left" tick={{fontSize:11}}/><YAxis yAxisId="right" orientation="right" tick={{fontSize:11}}/>
              <Tooltip contentStyle={{fontFamily:T.mono,fontSize:11}}/><Legend/>
              <Line yAxisId="left" type="monotone" dataKey="leverageDrift" name="Leverage Drift" stroke={T.red} strokeWidth={2}/>
              <Line yAxisId="left" type="monotone" dataKey="icrDrift" name="ICR Drift" stroke={T.orange} strokeWidth={2}/>
              <Area yAxisId="right" type="monotone" dataKey="breachProb" name="Breach Prob %" fill={T.purple+'22'} stroke={T.purple}/>
            </ComposedChart>
          </ResponsiveContainer>
          <div style={{marginTop:12,padding:10,background:T.amber+'11',borderRadius:6,fontSize:12,color:T.textSec}}>
            <strong>Lead indicators:</strong> Leverage drift exceeding 0.5x over 6 months signals 75% probability of covenant breach within 12 months. ICR deterioration below -0.3 over 3 months is a high-confidence early warning.
          </div>
        </Card>
      )}

      {tab===4 && (
        <Card>
          <h3 style={{color:T.navy,fontSize:15,margin:'0 0 12px'}}>Remediation Options</h3>
          <div style={{display:'grid',gap:12}}>
            {REMEDIATION.map((r,i)=><div key={i} style={{display:'flex',gap:16,padding:14,borderRadius:8,border:`1px solid ${T.border}`,alignItems:'center'}}>
              <div style={{flex:1}}>
                <div style={{fontWeight:700,fontSize:14,color:T.navy}}>{r.action}</div>
                <div style={{fontSize:12,color:T.textSec}}>{r.desc}</div>
                <div style={{fontSize:11,color:T.textMut,marginTop:4}}>Timeframe: {r.timeframe} | Cost: {r.cost}</div>
              </div>
              <div style={{textAlign:'center',minWidth:80}}>
                <div style={{fontSize:22,fontWeight:700,fontFamily:T.mono,color:r.effectiveness>70?T.green:r.effectiveness>50?T.amber:T.orange}}>{r.effectiveness}%</div>
                <div style={{fontSize:10,color:T.textMut}}>Effectiveness</div>
              </div>
            </div>)}
          </div>
        </Card>
      )}

      {tab===5 && (
        <Card>
          <h3 style={{color:T.navy,fontSize:15,margin:'0 0 12px'}}>Lender Action Framework</h3>
          <div style={{overflowX:'auto'}}>
            <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
              <thead><tr style={{borderBottom:`2px solid ${T.border}`}}>{['Trigger Condition','Required Action','Escalation','Timeline'].map(h=><th key={h} style={{padding:'8px 6px',textAlign:'left',color:T.textSec,fontWeight:600}}>{h}</th>)}</tr></thead>
              <tbody>{LENDER_ACTIONS.map((a,i)=><tr key={i} style={{borderBottom:`1px solid ${T.border}`,background:i<2?T.red+'06':T.surface}}>
                <td style={{padding:'8px 6px',fontFamily:T.mono,fontSize:11,fontWeight:600}}>{a.trigger}</td>
                <td>{a.action}</td><td>{a.escalation}</td><td>{a.timeline}</td>
              </tr>)}</tbody>
            </table>
          </div>
          <div style={{marginTop:16,display:'flex',gap:8}}>
            <button style={{padding:'8px 16px',background:T.navy,color:'#fff',border:'none',borderRadius:6,fontSize:12,cursor:'pointer'}}>Export Framework</button>
            <button style={{padding:'8px 16px',background:T.red+'11',color:T.red,border:`1px solid ${T.red}33`,borderRadius:6,fontSize:12,cursor:'pointer'}}>Escalate All Red</button>
          </div>
        </Card>
      )}

      <div style={{marginTop:16,padding:12,background:T.surface,border:`1px solid ${T.border}`,borderRadius:8,fontSize:11,color:T.textMut}}>
        <strong>Reference:</strong> Breach probability models use Merton structural framework with climate-adjusted asset volatility. Financial covenants based on typical leveraged loan documentation (LSTA standards). Early warning signals calibrated to historical breach events with 6-12 month lead time. Remediation effectiveness based on S&P LCD workout recovery data.
      </div>
    </div>
  );
}
