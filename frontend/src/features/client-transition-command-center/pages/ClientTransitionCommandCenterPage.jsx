import React, { useState, useMemo } from 'react';
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area, ScatterChart, Scatter,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend,
  ReferenceLine, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ZAxis
} from 'recharts';

const T = {
  bg:'#f6f4f0', surface:'#ffffff', border:'#e5e0d8', navy:'#1b3a5c',
  gold:'#c5a96a', textSec:'#5c6b7e', textMut:'#9aa3ae', red:'#dc2626',
  green:'#16a34a', amber:'#d97706', blue:'#2563eb', orange:'#ea580c',
  purple:'#7c3aed', teal:'#0891b2',
  font:"'DM Sans','SF Pro Display',system-ui,sans-serif",
  mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"
};

function sr(seed){let x=Math.sin(seed + 1) * 10000;return x-Math.floor(x);}

const SECTORS = ['Energy','Utilities','Materials','Industrials','Financials','Technology','Healthcare','Consumer','Real Estate','Transport'];
const CLIENTS = Array.from({length:50},(_,i)=>{
  const sec = SECTORS[Math.floor(sr(i+100)*SECTORS.length)];
  const exposure = Math.round(50+sr(i+110)*950);
  const transScore = Math.round(10+sr(i+120)*85);
  const quadrant = exposure>400&&transScore<40?'CRITICAL':exposure>400&&transScore>=40?'WATCH':exposure<=400&&transScore<40?'ENGAGE':'MONITOR';
  return {
    id:`CL-${String(i+1).padStart(3,'0')}`, name:`${sec} Client ${String.fromCharCode(65+i%26)}${i>=26?String(Math.floor(i/26)):''}`,
    sector:sec, exposure, transScore,
    physScore:Math.round(15+sr(i+130)*60), itr:(1.3+sr(i+140)*2.0).toFixed(1),
    waci:Math.round(30+sr(i+150)*700), quadrant,
    tcfdDisclosure:sr(i+160)>0.4, issbDisclosure:sr(i+170)>0.55, csrdDisclosure:sr(i+180)>0.6,
    sbtiCommitted:sr(i+190)>0.45, netZeroTarget:sr(i+200)>0.5?`20${30+Math.floor(sr(i+205)*20)}`:null,
    bonds:Math.round(sr(i+210)*400), loans:Math.round(sr(i+220)*300), derivatives:Math.round(sr(i+230)*150),
    bondTag:['Green','Transition','Brown','Unlabelled'][Math.floor(sr(i+240)*4)],
    loanTag:['Green','SLL','Brown','Unlabelled'][Math.floor(sr(i+250)*4)],
    derivTag:['Hedged','Exposed','N/A'][Math.floor(sr(i+260)*3)],
    region:['EMEA','APAC','Americas','Global'][Math.floor(sr(i+270)*4)],
    creditRating:['AAA','AA','A','BBB','BB','B'][Math.floor(sr(i+280)*6)]
  };
});

const ENGAGEMENTS = Array.from({length:20},(_,i)=>{
  const cl = CLIENTS[Math.floor(sr(i+400)*50)];
  const statuses = ['Initiated','In Progress','Escalated','Resolved'];
  return {
    id:`ENG-${String(i+1).padStart(3,'0')}`, client:cl.name, clientId:cl.id,
    action:['Request Transition Plan','TCFD Disclosure Gap','Emissions Target Setting','Scope 3 Engagement','Board Climate Resolution','Divestment Warning','SBTi Commitment','Capital Reallocation','Green Bond Issuance','Net Zero Pledge'][i%10],
    status:statuses[Math.floor(sr(i+410)*4)],
    priority:['CRITICAL','HIGH','MEDIUM','LOW'][Math.floor(sr(i+420)*4)],
    due:`2026-${String(4+Math.floor(sr(i+430)*6)).padStart(2,'0')}-${String(1+Math.floor(sr(i+440)*28)).padStart(2,'0')}`,
    assignee:['J. Thompson','A. Rodriguez','M. Yamamoto','S. O\'Brien','K. Patel','L. Chen','R. Mueller','N. Dubois'][Math.floor(sr(i+450)*8)],
    milestone:['Initial Contact','Data Requested','Plan Reviewed','Targets Set','Monitoring'][Math.floor(sr(i+460)*5)]
  };
});

const quadColor = q => q==='CRITICAL'?T.red:q==='WATCH'?T.orange:q==='ENGAGE'?T.amber:T.green;
const engStatColor = s => s==='Resolved'?T.green:s==='Escalated'?T.red:s==='In Progress'?T.blue:T.amber;
const tagColor = t => t==='Green'?T.green:t==='Transition'||t==='SLL'?T.teal:t==='Brown'?T.red:t==='Hedged'?T.green:t==='Exposed'?T.red:T.textMut;
const priColor = p => p==='CRITICAL'?T.red:p==='HIGH'?T.orange:p==='MEDIUM'?T.amber:T.green;

const TABS = ['Command Dashboard','Client Risk Matrix','Engagement Pipeline','Capital Markets Overlay','Regulatory Readiness','Board Report'];

export default function ClientTransitionCommandCenterPage(){
  const [tab,setTab]=useState(0);
  const [selClient,setSelClient]=useState(null);
  const [sectorFilter,setSectorFilter]=useState('ALL');
  const [quadFilter,setQuadFilter]=useState('ALL');
  const [sortCol,setSortCol]=useState('exposure');
  const [sortDir,setSortDir]=useState('desc');

  const filtered = useMemo(()=>CLIENTS.filter(c=>
    (sectorFilter==='ALL'||c.sector===sectorFilter)&&
    (quadFilter==='ALL'||c.quadrant===quadFilter)
  ),[sectorFilter,quadFilter]);

  const sorted = useMemo(()=>[...filtered].sort((a,b)=>{
    const av=typeof a[sortCol]==='string'?0:a[sortCol], bv=typeof b[sortCol]==='string'?0:b[sortCol];
    return sortDir==='desc'?bv-av:av-bv;
  }),[filtered,sortCol,sortDir]);

  const kpis = useMemo(()=>{
    const critical = CLIENTS.filter(c=>c.quadrant==='CRITICAL').length;
    const avgTrans = Math.round(CLIENTS.reduce((a,c)=>a+c.transScore,0)/50);
    const activeEng = ENGAGEMENTS.filter(e=>e.status!=='Resolved').length;
    const regCov = Math.round(CLIENTS.filter(c=>c.tcfdDisclosure||c.issbDisclosure||c.csrdDisclosure).length/50*100);
    return {critical,avgTrans,activeEng,regCov};
  },[]);

  const selData = selClient?CLIENTS.find(c=>c.id===selClient):null;

  const badge = {display:'inline-block',padding:'2px 10px',borderRadius:12,fontSize:11,fontWeight:700,fontFamily:T.mono,color:'#fff'};
  const card = {background:T.surface,borderRadius:14,border:`1px solid ${T.border}`,padding:20,marginBottom:16};
  const kpiBox = {background:T.surface,borderRadius:12,border:`1px solid ${T.border}`,padding:'16px 20px',textAlign:'center',flex:1,minWidth:140};
  const th = {padding:'8px 12px',textAlign:'left',fontSize:12,fontFamily:T.mono,color:T.textSec,borderBottom:`2px solid ${T.border}`,cursor:'pointer',userSelect:'none'};
  const td = {padding:'8px 12px',fontSize:12,borderBottom:`1px solid ${T.border}`};

  const filterBar = () => (
    <div style={{display:'flex',gap:8,marginBottom:16,flexWrap:'wrap'}}>
      <select value={sectorFilter} onChange={e=>setSectorFilter(e.target.value)} style={{padding:'6px 12px',borderRadius:8,border:`1px solid ${T.border}`,fontSize:12,fontFamily:T.mono}}>
        <option value="ALL">All Sectors</option>
        {SECTORS.map(s=><option key={s} value={s}>{s}</option>)}
      </select>
      <select value={quadFilter} onChange={e=>setQuadFilter(e.target.value)} style={{padding:'6px 12px',borderRadius:8,border:`1px solid ${T.border}`,fontSize:12,fontFamily:T.mono}}>
        <option value="ALL">All Quadrants</option>
        {['CRITICAL','WATCH','ENGAGE','MONITOR'].map(q=><option key={q} value={q}>{q}</option>)}
      </select>
      <div style={{marginLeft:'auto',fontSize:11,color:T.textMut,fontFamily:T.mono}}>{filtered.length} clients</div>
    </div>
  );

  const renderDashboard = () => (
    <div>
      <div style={{display:'flex',gap:16,flexWrap:'wrap',marginBottom:20}}>
        {[{l:'Clients at CRITICAL',v:kpis.critical,c:kpis.critical>8?T.red:T.amber},{l:'Avg Transition Score',v:kpis.avgTrans,c:kpis.avgTrans<40?T.red:T.amber},{l:'Active Engagements',v:kpis.activeEng,c:T.blue},{l:'Regulatory Coverage',v:`${kpis.regCov}%`,c:kpis.regCov>=80?T.green:T.amber},{l:'Total Exposure',v:`$${(CLIENTS.reduce((a,c)=>a+c.exposure,0)/1000).toFixed(1)}B`,c:T.navy}].map((k,i)=>(
          <div key={i} style={kpiBox}><div style={{fontSize:10,color:T.textMut,fontFamily:T.mono}}>{k.l}</div><div style={{fontSize:24,fontWeight:700,color:k.c,fontFamily:T.mono}}>{k.v}</div></div>
        ))}
      </div>
      {filterBar()}
      <div style={{display:'flex',gap:16,flexWrap:'wrap'}}>
        <div style={{...card,flex:2,minWidth:400}}>
          <div style={{fontSize:14,fontWeight:700,color:T.navy,marginBottom:12}}>Exposure x Transition Score (Quadrant View)</div>
          <ResponsiveContainer width="100%" height={300}>
            <ScatterChart>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
              <XAxis dataKey="transScore" name="Transition Score" domain={[0,100]} label={{value:'Transition Score',position:'insideBottom',offset:-5}}/>
              <YAxis dataKey="exposure" name="Exposure $M" label={{value:'Exposure ($M)',angle:-90,position:'insideLeft'}}/>
              <ZAxis dataKey="waci" range={[40,300]} name="WACI"/>
              <Tooltip cursor={{strokeDasharray:'3 3'}} content={({active,payload})=>{
                if(!active||!payload?.length) return null;
                const d=payload[0]?.payload;
                return d?<div style={{background:T.surface,padding:10,border:`1px solid ${T.border}`,borderRadius:8,fontSize:11,fontFamily:T.font}}>
                  <div style={{fontWeight:700}}>{d.name}</div>
                  <div>Score: {d.transScore} | Exposure: ${d.exposure}M</div>
                  <div>Quadrant: {d.quadrant}</div>
                </div>:null;
              }}/>
              <ReferenceLine x={40} stroke={T.red} strokeDasharray="4 4"/>
              <ReferenceLine y={400} stroke={T.red} strokeDasharray="4 4"/>
              <Scatter data={filtered} fill={T.blue}>
                {filtered.map((c,i)=><Cell key={i} fill={quadColor(c.quadrant)} cursor="pointer" onClick={()=>setSelClient(c.id)}/>)}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </div>
        <div style={{...card,flex:1,minWidth:280}}>
          <div style={{fontSize:14,fontWeight:700,color:T.navy,marginBottom:12}}>Quadrant Distribution</div>
          {['CRITICAL','WATCH','ENGAGE','MONITOR'].map((q,i)=>{const cnt=CLIENTS.filter(c=>c.quadrant===q).length;return(
            <div key={i} style={{padding:'10px 14px',marginBottom:8,borderRadius:10,border:`1px solid ${quadColor(q)}30`,background:quadColor(q)+'08',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <div><span style={{...badge,background:quadColor(q)}}>{q}</span></div>
              <div style={{fontSize:22,fontWeight:700,color:quadColor(q),fontFamily:T.mono}}>{cnt}</div>
            </div>
          );})}
          {selData&&(
            <div style={{marginTop:16,padding:14,borderRadius:10,border:`1px solid ${T.gold}`,background:T.gold+'08'}}>
              <div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:8}}>Selected: {selData.name}</div>
              <div style={{fontSize:11,lineHeight:1.8,fontFamily:T.mono}}>
                <div>Sector: {selData.sector} | Region: {selData.region}</div>
                <div>Exposure: ${selData.exposure}M | Score: {selData.transScore}</div>
                <div>ITR: {selData.itr} C | WACI: {selData.waci}</div>
                <div>Rating: {selData.creditRating} | SBTi: {selData.sbtiCommitted?'Yes':'No'}</div>
                <div>Net Zero: {selData.netZeroTarget||'None'}</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderMatrix = () => (
    <div style={card}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
        <div style={{fontSize:14,fontWeight:700,color:T.navy}}>Client Risk Matrix (50 Clients)</div>
        <div style={{display:'flex',gap:6}}>
          {['exposure','transScore','waci','itr'].map(c=>(
            <button key={c} onClick={()=>{if(sortCol===c)setSortDir(d=>d==='desc'?'asc':'desc');else{setSortCol(c);setSortDir('desc');}}}
              style={{padding:'4px 10px',borderRadius:8,border:`1px solid ${sortCol===c?T.gold:T.border}`,background:sortCol===c?T.gold+'20':T.surface,fontSize:11,fontFamily:T.mono,cursor:'pointer',color:T.navy}}>
              {c.replace('Score','')}{sortCol===c?(sortDir==='desc'?' \u25BC':' \u25B2'):''}
            </button>
          ))}
        </div>
      </div>
      {filterBar()}
      <div style={{overflowX:'auto',maxHeight:500,overflowY:'auto'}}>
        <table style={{borderCollapse:'collapse',width:'100%',fontSize:11}}>
          <thead><tr>{['Client','Sector','Region','Exposure $M','Trans Score','Phys Score','ITR','WACI','Rating','Quadrant'].map(h=><th key={h} style={{...th,position:'sticky',top:0,background:T.surface}}>{h}</th>)}</tr></thead>
          <tbody>{sorted.map((c,i)=>(
            <tr key={i} style={{cursor:'pointer',background:selClient===c.id?'#f0f4ff':i%2===0?'transparent':T.bg+'80'}} onClick={()=>setSelClient(c.id)}>
              <td style={{...td,fontWeight:600}}>{c.name}</td><td style={td}>{c.sector}</td><td style={td}>{c.region}</td>
              <td style={{...td,fontFamily:T.mono}}>${c.exposure}M</td>
              <td style={{...td,color:c.transScore<30?T.red:c.transScore<60?T.amber:T.green,fontWeight:700,fontFamily:T.mono}}>{c.transScore}</td>
              <td style={{...td,fontFamily:T.mono}}>{c.physScore}</td>
              <td style={{...td,fontFamily:T.mono,color:parseFloat(c.itr)>2?T.red:T.amber}}>{c.itr}</td>
              <td style={{...td,fontFamily:T.mono}}>{c.waci}</td>
              <td style={{...td,fontFamily:T.mono}}>{c.creditRating}</td>
              <td style={td}><span style={{...badge,background:quadColor(c.quadrant)}}>{c.quadrant}</span></td>
            </tr>))}</tbody>
        </table>
      </div>
    </div>
  );

  const renderEngagement = () => (
    <div style={card}>
      <div style={{fontSize:14,fontWeight:700,color:T.navy,marginBottom:16}}>Engagement Pipeline (20 Active)</div>
      <table style={{borderCollapse:'collapse',width:'100%',fontSize:12}}>
        <thead><tr>{['ID','Client','Action','Status','Priority','Milestone','Due','Assignee'].map(h=><th key={h} style={th}>{h}</th>)}</tr></thead>
        <tbody>{ENGAGEMENTS.map((e,i)=>(
          <tr key={i}>
            <td style={{...td,fontFamily:T.mono,color:T.textMut}}>{e.id}</td>
            <td style={{...td,fontWeight:600}}>{e.client}</td>
            <td style={td}>{e.action}</td>
            <td style={td}><span style={{...badge,background:engStatColor(e.status)}}>{e.status}</span></td>
            <td style={td}><span style={{...badge,background:priColor(e.priority)}}>{e.priority}</span></td>
            <td style={{...td,fontSize:10,color:T.textSec}}>{e.milestone}</td>
            <td style={{...td,fontFamily:T.mono}}>{e.due}</td>
            <td style={td}>{e.assignee}</td>
          </tr>))}</tbody>
      </table>
      <div style={{marginTop:16,display:'flex',gap:16,flexWrap:'wrap'}}>
        {['Initiated','In Progress','Escalated','Resolved'].map(s=>(
          <div key={s} style={{padding:'10px 16px',borderRadius:10,border:`1px solid ${engStatColor(s)}30`,background:engStatColor(s)+'08'}}>
            <div style={{fontSize:10,color:T.textMut,fontFamily:T.mono}}>{s}</div>
            <div style={{fontSize:20,fontWeight:700,color:engStatColor(s),fontFamily:T.mono}}>{ENGAGEMENTS.filter(e=>e.status===s).length}</div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderCapitalMarkets = () => (
    <div>
      <div style={card}>
        <div style={{fontSize:14,fontWeight:700,color:T.navy,marginBottom:12}}>Capital Markets Overlay — Outstanding Instruments</div>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={sorted.slice(0,15).map(c=>({name:c.id,bonds:c.bonds,loans:c.loans,derivatives:c.derivatives}))}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
            <XAxis dataKey="name" tick={{fontSize:9,fontFamily:T.mono}}/><YAxis label={{value:'$M',angle:-90,position:'insideLeft'}}/>
            <Tooltip/><Legend/>
            <Bar dataKey="bonds" stackId="a" fill={T.blue} name="Bonds"/>
            <Bar dataKey="loans" stackId="a" fill={T.teal} name="Loans"/>
            <Bar dataKey="derivatives" stackId="a" fill={T.purple} name="Derivatives"/>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div style={card}>
        <div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:12}}>Instrument Transition Tags</div>
        <table style={{borderCollapse:'collapse',width:'100%',fontSize:11}}>
          <thead><tr>{['Client','Bonds $M','Bond Tag','Loans $M','Loan Tag','Deriv $M','Deriv Tag','Total $M'].map(h=><th key={h} style={th}>{h}</th>)}</tr></thead>
          <tbody>{sorted.slice(0,20).map((c,i)=>(
            <tr key={i}>
              <td style={{...td,fontWeight:600}}>{c.name}</td>
              <td style={{...td,fontFamily:T.mono}}>{c.bonds}</td>
              <td style={td}><span style={{...badge,background:tagColor(c.bondTag)}}>{c.bondTag}</span></td>
              <td style={{...td,fontFamily:T.mono}}>{c.loans}</td>
              <td style={td}><span style={{...badge,background:tagColor(c.loanTag)}}>{c.loanTag}</span></td>
              <td style={{...td,fontFamily:T.mono}}>{c.derivatives}</td>
              <td style={td}><span style={{...badge,background:tagColor(c.derivTag)}}>{c.derivTag}</span></td>
              <td style={{...td,fontFamily:T.mono,fontWeight:700}}>${c.bonds+c.loans+c.derivatives}M</td>
            </tr>))}</tbody>
        </table>
      </div>
    </div>
  );

  const renderRegReadiness = () => (
    <div style={card}>
      <div style={{fontSize:14,fontWeight:700,color:T.navy,marginBottom:16}}>Regulatory Readiness per Client</div>
      <table style={{borderCollapse:'collapse',width:'100%',fontSize:11}}>
        <thead><tr>{['Client','Sector','TCFD','ISSB S2','CSRD ESRS','SBTi','Net Zero Target','Score'].map(h=><th key={h} style={{...th,textAlign:'center'}}>{h}</th>)}</tr></thead>
        <tbody>{sorted.slice(0,30).map((c,i)=>{const score=[c.tcfdDisclosure,c.issbDisclosure,c.csrdDisclosure,c.sbtiCommitted,!!c.netZeroTarget].filter(Boolean).length;return(
          <tr key={i}>
            <td style={{...td,fontWeight:600}}>{c.name}</td><td style={td}>{c.sector}</td>
            {[c.tcfdDisclosure,c.issbDisclosure,c.csrdDisclosure,c.sbtiCommitted].map((v,vi)=>(
              <td key={vi} style={{...td,textAlign:'center',color:v?T.green:T.red,fontWeight:700,fontSize:14}}>{v?'\u2713':'\u2717'}</td>
            ))}
            <td style={{...td,textAlign:'center',fontFamily:T.mono}}>{c.netZeroTarget||'--'}</td>
            <td style={{...td,textAlign:'center'}}><span style={{...badge,background:score>=4?T.green:score>=2?T.amber:T.red}}>{score}/5</span></td>
          </tr>);})}</tbody>
      </table>
      <div style={{marginTop:16}}>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={[{metric:'TCFD',pct:Math.round(CLIENTS.filter(c=>c.tcfdDisclosure).length/50*100)},{metric:'ISSB',pct:Math.round(CLIENTS.filter(c=>c.issbDisclosure).length/50*100)},{metric:'CSRD',pct:Math.round(CLIENTS.filter(c=>c.csrdDisclosure).length/50*100)},{metric:'SBTi',pct:Math.round(CLIENTS.filter(c=>c.sbtiCommitted).length/50*100)},{metric:'Net Zero',pct:Math.round(CLIENTS.filter(c=>c.netZeroTarget).length/50*100)}]}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="metric"/><YAxis domain={[0,100]} label={{value:'%',angle:-90,position:'insideLeft'}}/>
            <Tooltip/><Bar dataKey="pct" name="Coverage %" radius={[6,6,0,0]}>{[T.blue,T.teal,T.purple,T.green,T.navy].map((c,i)=><Cell key={i} fill={c}/>)}</Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );

  const top5 = useMemo(()=>CLIENTS.filter(c=>c.quadrant==='CRITICAL').sort((a,b)=>b.exposure-a.exposure).slice(0,5),[]);
  const renderBoardReport = () => (
    <div>
      <div style={{...card,background:T.navy+'05',borderColor:T.navy+'30'}}>
        <div style={{fontSize:16,fontWeight:800,color:T.navy,marginBottom:4}}>Board Report: Client Transition Risk Executive Summary</div>
        <div style={{fontSize:11,color:T.textMut,fontFamily:T.mono,marginBottom:16}}>Generated: {new Date().toISOString().slice(0,10)} | Classification: CONFIDENTIAL</div>
        <div style={{fontSize:13,color:T.textSec,lineHeight:1.8,marginBottom:20}}>
          This report summarizes the transition risk profile of the institution's top 50 client relationships. {kpis.critical} clients are classified as CRITICAL (high exposure + low transition readiness). Average transition score across the portfolio is {kpis.avgTrans}/100. Regulatory disclosure coverage stands at {kpis.regCov}%. {kpis.activeEng} engagement actions are currently active.
        </div>
        <div style={{fontSize:14,fontWeight:700,color:T.navy,marginBottom:12}}>Top 5 Client Risks</div>
        {top5.map((c,i)=>(
          <div key={i} style={{padding:14,marginBottom:10,borderRadius:10,border:`1px solid ${T.red}30`,background:T.red+'05'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:6}}>
              <div style={{fontSize:13,fontWeight:700,color:T.navy}}>{i+1}. {c.name}</div>
              <span style={{...badge,background:T.red}}>CRITICAL</span>
            </div>
            <div style={{fontSize:11,color:T.textSec,fontFamily:T.mono,lineHeight:1.8}}>
              Sector: {c.sector} | Region: {c.region} | Exposure: ${c.exposure}M | Trans Score: {c.transScore}/100 | ITR: {c.itr} C | WACI: {c.waci} tCO2/$M | Credit: {c.creditRating} | SBTi: {c.sbtiCommitted?'Committed':'No'} | Net Zero: {c.netZeroTarget||'None'}
            </div>
          </div>
        ))}
        <div style={{marginTop:20,padding:14,borderRadius:10,background:T.blue+'08',border:`1px solid ${T.blue}30`}}>
          <div style={{fontSize:13,fontWeight:700,color:T.blue,marginBottom:8}}>Recommended Board Actions</div>
          <ol style={{fontSize:12,color:T.textSec,lineHeight:2,margin:0,paddingLeft:20}}>
            <li>Escalate engagement with {top5[0]?.name} - highest exposure at CRITICAL status</li>
            <li>Request transition plans from all CRITICAL-quadrant clients within 90 days</li>
            <li>Review credit limits for clients with transition score below 30</li>
            <li>Mandate TCFD/ISSB disclosure as condition for facility renewal</li>
            <li>Establish quarterly CRO reporting on client transition risk metrics</li>
          </ol>
        </div>
      </div>
      <div style={card}>
        <div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:12}}>Risk Radar: Top 5 Clients</div>
        <ResponsiveContainer width="100%" height={280}>
          <RadarChart data={['Transition','Physical','WACI','Exposure','Regulatory'].map((dim,di)=>({dim,...top5.reduce((a,c,ci)=>{a[`c${ci}`]=dim==='Transition'?c.transScore:dim==='Physical'?c.physScore:dim==='WACI'?Math.min(100,c.waci/7):dim==='Exposure'?Math.min(100,c.exposure/10):([c.tcfdDisclosure,c.issbDisclosure,c.csrdDisclosure].filter(Boolean).length/3*100);return a;},{})}))}>
            <PolarGrid stroke={T.border}/><PolarAngleAxis dataKey="dim" tick={{fontSize:10}}/>
            <PolarRadiusAxis domain={[0,100]} tick={{fontSize:9}}/>
            {top5.map((c,ci)=><Radar key={ci} name={c.name.slice(0,15)} dataKey={`c${ci}`} stroke={[T.red,T.orange,T.amber,T.purple,T.blue][ci]} fill={[T.red,T.orange,T.amber,T.purple,T.blue][ci]} fillOpacity={0.1}/>)}
            <Legend wrapperStyle={{fontSize:10}}/>
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );

  return (
    <div style={{fontFamily:T.font,background:T.bg,minHeight:'100vh',padding:'24px 32px'}}>
      <div style={{display:'flex',alignItems:'center',gap:16,marginBottom:8}}>
        <div style={{background:T.navy,color:'#fff',padding:'6px 16px',borderRadius:10,fontFamily:T.mono,fontSize:13,fontWeight:700,border:`2px solid ${T.gold}`}}>EP-CY6</div>
        <div>
          <h1 style={{margin:0,fontSize:26,fontWeight:800,color:T.navy}}>Client Transition Command Center</h1>
          <p style={{margin:0,fontSize:13,color:T.textSec}}>Client/Counterparty transition risk command center | 50 clients | 20 engagements</p>
        </div>
      </div>
      <div style={{display:'flex',gap:4,marginBottom:20,borderBottom:`2px solid ${T.border}`,paddingBottom:0}}>
        {TABS.map((t,i)=>(
          <button key={i} onClick={()=>setTab(i)} style={{padding:'10px 16px',border:'none',borderBottom:tab===i?`3px solid ${T.gold}`:'3px solid transparent',background:'transparent',cursor:'pointer',fontSize:13,fontWeight:tab===i?700:500,color:tab===i?T.navy:T.textSec,fontFamily:T.font}}>{t}</button>
        ))}
      </div>
      {tab===0&&renderDashboard()}
      {tab===1&&renderMatrix()}
      {tab===2&&renderEngagement()}
      {tab===3&&renderCapitalMarkets()}
      {tab===4&&renderRegReadiness()}
      {tab===5&&renderBoardReport()}
      <div style={{marginTop:24,padding:14,borderRadius:10,background:T.navy+'08',border:`1px solid ${T.navy}20`,fontSize:11,color:T.textSec}}>
        <strong>Methodology:</strong> Quadrant classification: CRITICAL = Exposure &gt;$400M + Score &lt;40. WATCH = Exposure &gt;$400M + Score &ge;40. ENGAGE = Exposure &le;$400M + Score &lt;40. MONITOR = Exposure &le;$400M + Score &ge;40. Transition score: carbon trajectory (30%), policy readiness (25%), technology adoption (25%), disclosure quality (20%). Capital markets tags per ICMA Green Bond Principles / Loan Market Association SLL framework. Regulatory readiness scored across TCFD, ISSB S2, CSRD ESRS E1, SBTi, Net Zero target.
      </div>
    </div>
  );
}
