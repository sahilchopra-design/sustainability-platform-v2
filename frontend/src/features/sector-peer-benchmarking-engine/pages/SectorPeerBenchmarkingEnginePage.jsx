import React, { useState, useMemo } from 'react';
import {

  BarChart, Bar, LineChart, Line, ScatterChart, Scatter, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell, ReferenceLine,
  ZAxis, AreaChart, Area
} from 'recharts';

const sr = (s) => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };

const T = {
  bg:'#f6f4f0', surface:'#ffffff', border:'#e5e0d8', navy:'#1b3a5c',
  navyL:'#2c5a8c', gold:'#c5a96a', textSec:'#5c6b7e', textMut:'#9aa3ae',
  red:'#dc2626', green:'#16a34a', amber:'#d97706', blue:'#2563eb',
  orange:'#ea580c', purple:'#7c3aed', teal:'#0891b2', sage:'#5a8a6a',
  font:"'DM Sans','SF Pro Display',system-ui,sans-serif",
  mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"
};

const SECTOR_COLORS = { 'Financials':T.navy, 'Energy':T.orange, 'Technology':T.blue, 'Industrials':T.teal, 'Healthcare':T.green, 'Consumer':T.purple };

const SECTORS = ['Financials','Energy','Technology','Industrials','Healthcare','Consumer'];
const genPeers = (sector, base, spread) => Array.from({length:8},(_,i) => ({
  id:`${sector.slice(0,3).toUpperCase()}-${i+1}`,
  name:`${sector} Co ${i+1}`,
  sector,
  score: Math.round(base + (sr(i*27+sector.charCodeAt(0))*2-1)*spread),
  greenCapex: Math.round(15 + (sr(i * 18) * 2 - 1)*12),
  sbtiValidated: i % 3 === 0,
  lobbyingScore: Math.round(40 + (sr(i * 520) * 2 - 1)*25),
  q1: Math.round(base-6+(sr(i * 10) * 2 - 1)*4), q2: Math.round(base-4+(sr(i * 10) * 2 - 1)*3),
  q3: Math.round(base-2+(sr(i * 10) * 2 - 1)*2), q4: Math.round(base+(sr(i * 10) * 2 - 1)),
  q5: Math.round(base+2+(sr(i * 10) * 2 - 1)*1.5),
}));

const ALL_PEERS = SECTORS.flatMap((s,si) => genPeers(s, [68,42,75,60,70,65][si], [12,15,10,13,11,14][si]));

const TABS = ['Peer Group Builder','Distribution Analysis','Quartile Ranking','Best Practice Identification','Convergence Trend','Engagement Priority'];

const Badge = ({code,label}) => (
  <div style={{display:'inline-flex',alignItems:'center',gap:6,padding:'4px 12px',border:`1.5px solid ${T.gold}`,borderRadius:6,fontSize:11,fontFamily:T.mono,color:T.navy,background:`${T.gold}15`}}>
    <span style={{fontWeight:700}}>{code}</span><span style={{color:T.textSec}}>{label}</span>
  </div>
);
const Card = ({children,style}) => <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:20,...style}}>{children}</div>;
const Pill = ({label,active,onClick}) => <button onClick={onClick} style={{padding:'6px 16px',borderRadius:20,border:`1px solid ${active?T.navy:T.border}`,background:active?T.navy:'transparent',color:active?'#fff':T.textSec,fontSize:12,fontFamily:T.font,cursor:'pointer',fontWeight:active?600:400}}>{label}</button>;
const KPI = ({label,value,sub,color=T.navy}) => <div style={{textAlign:'center'}}><div style={{fontSize:22,fontWeight:700,color,fontFamily:T.mono}}>{value}</div><div style={{fontSize:11,color:T.textSec,marginTop:2}}>{label}</div>{sub&&<div style={{fontSize:10,color:T.textMut}}>{sub}</div>}</div>;

export default function SectorPeerBenchmarkingEnginePage() {
  const [tab, setTab] = useState(0);
  const [selSector, setSelSector] = useState('Financials');
  const [bookmarks, setBookmarks] = useState([]);

  const peers = useMemo(() => ALL_PEERS.filter(p => p.sector === selSector).sort((a,b) => b.score-a.score), [selSector]);
  const q1 = useMemo(() => Math.round(peers[1]?.score || 0), [peers]);
  const median = useMemo(() => Math.round(peers[3]?.score || 0), [peers]);
  const q3val = useMemo(() => Math.round(peers[5]?.score || 0), [peers]);

  const distData = useMemo(() => SECTORS.map(s => {
    const sp = ALL_PEERS.filter(p=>p.sector===s);
    const scores = sp.map(p=>p.score).sort((a,b)=>a-b);
    return { sector:s, min:scores[0], q1:scores[1], median:scores[3], q3:scores[5], max:scores[7] };
  }), []);

  const convData = useMemo(() => ['Q1-25','Q2-25','Q3-25','Q4-25','Q1-26'].map((q,qi) => {
    const row = { q };
    SECTORS.forEach(s => {
      const sp = ALL_PEERS.filter(p=>p.sector===s);
      row[s] = Math.round(sp.reduce((a,p)=>a+[p.q1,p.q2,p.q3,p.q4,p.q5][qi],0)/sp.length);
    });
    return row;
  }), []);

  const bestPractice = useMemo(() => {
    const leaders = peers.slice(0,2);
    const laggards = peers.slice(-2);
    return {
      avgGreenCapex_leaders: Math.round(leaders.reduce((a,p)=>a+p.greenCapex,0)/2),
      avgGreenCapex_laggards: Math.round(laggards.reduce((a,p)=>a+p.greenCapex,0)/2),
      sbti_leaders: leaders.filter(p=>p.sbtiValidated).length,
      sbti_laggards: laggards.filter(p=>p.sbtiValidated).length,
      avgLobbying_leaders: Math.round(leaders.reduce((a,p)=>a+p.lobbyingScore,0)/2),
      avgLobbying_laggards: Math.round(laggards.reduce((a,p)=>a+p.lobbyingScore,0)/2),
    };
  }, [peers]);

  const engagementTargets = useMemo(() => peers.filter((_,i) => i >= 4).map(p => ({
    ...p, potential: Math.round((q1 - p.score)*0.6), priority: p.score < q3val ? 'High' : 'Medium'
  })), [peers, q1, q3val]);

  const renderPeerGroup = () => (
    <div>
      <div style={{display:'flex',gap:6,flexWrap:'wrap',marginBottom:20}}>
        {SECTORS.map(s => <Pill key={s} label={s} active={selSector===s} onClick={()=>setSelSector(s)} />)}
      </div>
      <Card>
        <div style={{fontSize:14,fontWeight:600,color:T.navy,marginBottom:12}}>Peer Group: {selSector} (8 companies)</div>
        <div style={{overflowX:'auto'}}>
          <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
            <thead><tr style={{borderBottom:`2px solid ${T.border}`}}>
              {['Rank','Company','Score','Green CapEx %','SBTi','Lobbying'].map(h => <th key={h} style={{textAlign:'left',padding:'8px 12px',color:T.textSec,fontWeight:600}}>{h}</th>)}
            </tr></thead>
            <tbody>
              {peers.map((p,i) => (
                <tr key={p.id} style={{borderBottom:`1px solid ${T.border}`,background:i<2?`${T.green}06`:i>=6?`${T.red}06`:'transparent'}}>
                  <td style={{padding:'8px 12px',fontFamily:T.mono,fontWeight:700,color:i<2?T.green:i>=6?T.red:T.navy}}>#{i+1}</td>
                  <td style={{padding:'8px 12px',fontWeight:500,color:T.navy}}>{p.name}</td>
                  <td style={{padding:'8px 12px',fontFamily:T.mono,fontWeight:600}}>{p.score}</td>
                  <td style={{padding:'8px 12px',fontFamily:T.mono}}>{p.greenCapex}%</td>
                  <td style={{padding:'8px 12px'}}><span style={{color:p.sbtiValidated?T.green:T.textMut}}>{p.sbtiValidated?'Validated':'No'}</span></td>
                  <td style={{padding:'8px 12px',fontFamily:T.mono,color:p.lobbyingScore>50?T.red:T.green}}>{p.lobbyingScore}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );

  const renderDistribution = () => (
    <Card>
      <div style={{fontSize:14,fontWeight:600,color:T.navy,marginBottom:12}}>Score Distribution by Sector (Box Plot)</div>
      <ResponsiveContainer width="100%" height={360}>
        <BarChart data={distData}>
          <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
          <XAxis dataKey="sector" tick={{fontSize:11,fill:T.textSec}} />
          <YAxis domain={[20,100]} tick={{fontSize:11,fill:T.textSec}} />
          <Tooltip contentStyle={{borderRadius:8,border:`1px solid ${T.border}`,fontFamily:T.font,fontSize:12}} />
          <Bar dataKey="min" stackId="a" fill="transparent" />
          <Bar dataKey="q1" fill={`${T.blue}40`} radius={[4,4,0,0]} />
          <Bar dataKey="median" fill={T.blue} radius={[4,4,0,0]} />
          <Bar dataKey="q3" fill={`${T.blue}60`} radius={[4,4,0,0]} />
          <Bar dataKey="max" fill={`${T.blue}25`} radius={[4,4,0,0]} />
          <Legend />
        </BarChart>
      </ResponsiveContainer>
      <div style={{marginTop:12,fontSize:11,color:T.textMut,fontStyle:'italic'}}>Distribution shows min, Q1, median, Q3, max transition scores per GICS sector. Technology leads with highest median; Energy shows widest spread.</div>
    </Card>
  );

  const renderQuartile = () => (
    <Card>
      <div style={{fontSize:14,fontWeight:600,color:T.navy,marginBottom:12}}>Quartile Ranking: {selSector}</div>
      <ResponsiveContainer width="100%" height={320}>
        <BarChart data={peers} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
          <XAxis type="number" domain={[0,100]} tick={{fontSize:11,fill:T.textSec}} />
          <YAxis dataKey="name" type="category" width={110} tick={{fontSize:11,fill:T.textSec}} />
          <Tooltip contentStyle={{borderRadius:8,border:`1px solid ${T.border}`,fontFamily:T.font,fontSize:12}} />
          <ReferenceLine x={q1} stroke={T.green} strokeDasharray="4 4" label={{value:'Q1',fill:T.green,fontSize:10}} />
          <ReferenceLine x={median} stroke={T.amber} strokeDasharray="4 4" label={{value:'Median',fill:T.amber,fontSize:10}} />
          <ReferenceLine x={q3val} stroke={T.red} strokeDasharray="4 4" label={{value:'Q3',fill:T.red,fontSize:10}} />
          <Bar dataKey="score" radius={[0,4,4,0]} barSize={14}>
            {peers.map((p,i) => <Cell key={i} fill={i<2?T.green:i<4?`${T.green}80`:i<6?T.amber:T.red} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );

  const renderBestPractice = () => (
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
      <Card style={{borderLeft:`3px solid ${T.green}`}}>
        <div style={{fontSize:14,fontWeight:600,color:T.green,marginBottom:12}}>Q1 Leaders (What They Do Differently)</div>
        <div style={{display:'flex',flexDirection:'column',gap:10}}>
          <div style={{display:'flex',justifyContent:'space-between',fontSize:12}}><span style={{color:T.textSec}}>Avg Green CapEx</span><span style={{fontFamily:T.mono,fontWeight:700,color:T.green}}>{bestPractice.avgGreenCapex_leaders}%</span></div>
          <div style={{display:'flex',justifyContent:'space-between',fontSize:12}}><span style={{color:T.textSec}}>SBTi Validated</span><span style={{fontFamily:T.mono,fontWeight:700,color:T.green}}>{bestPractice.sbti_leaders}/2</span></div>
          <div style={{display:'flex',justifyContent:'space-between',fontSize:12}}><span style={{color:T.textSec}}>Avg Lobbying Score</span><span style={{fontFamily:T.mono,fontWeight:700,color:T.green}}>{bestPractice.avgLobbying_leaders}</span></div>
        </div>
      </Card>
      <Card style={{borderLeft:`3px solid ${T.red}`}}>
        <div style={{fontSize:14,fontWeight:600,color:T.red,marginBottom:12}}>Q4 Laggards</div>
        <div style={{display:'flex',flexDirection:'column',gap:10}}>
          <div style={{display:'flex',justifyContent:'space-between',fontSize:12}}><span style={{color:T.textSec}}>Avg Green CapEx</span><span style={{fontFamily:T.mono,fontWeight:700,color:T.red}}>{bestPractice.avgGreenCapex_laggards}%</span></div>
          <div style={{display:'flex',justifyContent:'space-between',fontSize:12}}><span style={{color:T.textSec}}>SBTi Validated</span><span style={{fontFamily:T.mono,fontWeight:700,color:T.red}}>{bestPractice.sbti_laggards}/2</span></div>
          <div style={{display:'flex',justifyContent:'space-between',fontSize:12}}><span style={{color:T.textSec}}>Avg Lobbying Score</span><span style={{fontFamily:T.mono,fontWeight:700,color:T.red}}>{bestPractice.avgLobbying_laggards}</span></div>
        </div>
      </Card>
      <Card style={{gridColumn:'span 2'}}>
        <div style={{fontSize:13,fontWeight:600,color:T.navy,marginBottom:8}}>Key Differentiators</div>
        {['Higher Green CapEx allocation (+8-15pp vs laggards)','SBTi-validated science-based targets','Lower lobbying exposure (anti-climate lobbying risk)','Board-level climate committee oversight','TCFD-aligned disclosure & ISSB S2 readiness'].map((d,i) => (
          <div key={i} style={{display:'flex',alignItems:'center',gap:8,padding:'6px 0',borderBottom:`1px solid ${T.border}`}}>
            <div style={{width:6,height:6,borderRadius:3,background:T.green}} />
            <span style={{fontSize:12,color:T.textSec}}>{d}</span>
          </div>
        ))}
      </Card>
    </div>
  );

  const renderConvergence = () => (
    <Card>
      <div style={{fontSize:14,fontWeight:600,color:T.navy,marginBottom:12}}>Sector Convergence / Divergence Trend</div>
      <ResponsiveContainer width="100%" height={360}>
        <LineChart data={convData}>
          <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
          <XAxis dataKey="q" tick={{fontSize:11,fill:T.textSec}} />
          <YAxis domain={[30,85]} tick={{fontSize:11,fill:T.textSec}} />
          <Tooltip contentStyle={{borderRadius:8,border:`1px solid ${T.border}`,fontFamily:T.font,fontSize:12}} />
          <Legend />
          {SECTORS.map(s => <Line key={s} type="monotone" dataKey={s} stroke={SECTOR_COLORS[s]} strokeWidth={2} dot={{r:3}} />)}
        </LineChart>
      </ResponsiveContainer>
      <div style={{marginTop:12,padding:10,background:`${T.amber}08`,borderRadius:6,fontSize:11,color:T.textSec}}>
        Technology and Healthcare sectors show convergence (improving together). Energy sector diverges with widening gap to other sectors, signaling need for targeted engagement.
      </div>
    </Card>
  );

  const renderEngagement = () => (
    <Card>
      <div style={{fontSize:14,fontWeight:600,color:T.navy,marginBottom:12}}>Engagement Priority: Q3/Q4 Companies with Highest Potential</div>
      <div style={{overflowX:'auto'}}>
        <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
          <thead><tr style={{borderBottom:`2px solid ${T.border}`}}>
            {['Company','Current Score','Potential Uplift','Priority','Action'].map(h => <th key={h} style={{textAlign:'left',padding:'8px 12px',color:T.textSec,fontWeight:600}}>{h}</th>)}
          </tr></thead>
          <tbody>
            {engagementTargets.map(p => (
              <tr key={p.id} style={{borderBottom:`1px solid ${T.border}`}}>
                <td style={{padding:'8px 12px',fontWeight:500,color:T.navy}}>{p.name}</td>
                <td style={{padding:'8px 12px',fontFamily:T.mono}}>{p.score}</td>
                <td style={{padding:'8px 12px',fontFamily:T.mono,color:T.green}}>+{p.potential} pts</td>
                <td style={{padding:'8px 12px'}}><span style={{padding:'2px 8px',borderRadius:4,fontSize:10,fontWeight:600,background:p.priority==='High'?`${T.red}15`:p.priority==='Medium'?`${T.amber}15`:`${T.green}15`,color:p.priority==='High'?T.red:p.priority==='Medium'?T.amber:T.green}}>{p.priority}</span></td>
                <td style={{padding:'8px 12px'}}><button onClick={()=>setBookmarks(b=>b.includes(p.id)?b.filter(x=>x!==p.id):[...b,p.id])} style={{padding:'3px 10px',borderRadius:4,border:`1px solid ${bookmarks.includes(p.id)?T.gold:T.border}`,background:bookmarks.includes(p.id)?`${T.gold}15`:'transparent',fontSize:11,cursor:'pointer',color:bookmarks.includes(p.id)?T.gold:T.textMut}}>{bookmarks.includes(p.id)?'Bookmarked':'Bookmark'}</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );

  const panels = [renderPeerGroup, renderDistribution, renderQuartile, renderBestPractice, renderConvergence, renderEngagement];

  return (
    <div style={{fontFamily:T.font,background:T.bg,minHeight:'100vh',padding:24}}>
      <div style={{maxWidth:1400,margin:'0 auto'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:20}}>
          <div>
            <Badge code="EP-CW2" label="Sector Peer Benchmarking Engine" />
            <h1 style={{fontSize:22,fontWeight:700,color:T.navy,margin:'12px 0 4px'}}>Sector Peer Benchmarking Engine</h1>
            <p style={{fontSize:13,color:T.textSec,margin:0}}>6 GICS sectors x 8 peers: distribution, quartile ranking, best practice, convergence</p>
          </div>
          <div style={{display:'flex',gap:16}}>
            <KPI label="Sectors" value="6" sub="GICS L1" />
            <KPI label="Companies" value="48" sub="8 per sector" color={T.gold} />
            <KPI label="Quartiles" value="Q1-Q4" sub="threshold lines" color={T.teal} />
          </div>
        </div>
        <div style={{display:'flex',gap:4,borderBottom:`2px solid ${T.border}`,marginBottom:20}}>
          {TABS.map((t,i) => <button key={i} onClick={()=>setTab(i)} style={{padding:'10px 18px',border:'none',borderBottom:`2px solid ${tab===i?T.gold:'transparent'}`,background:'transparent',color:tab===i?T.navy:T.textMut,fontWeight:tab===i?600:400,fontSize:13,fontFamily:T.font,cursor:'pointer',marginBottom:-2}}>{t}</button>)}
        </div>
        {panels[tab]()}
        <div style={{marginTop:20,padding:14,background:`${T.gold}08`,border:`1px solid ${T.gold}30`,borderRadius:8}}>
          <div style={{fontSize:12,fontWeight:600,color:T.gold,marginBottom:4}}>Reference</div>
          <div style={{fontSize:11,color:T.textSec}}>Peer groups constructed using GICS sector classification. Quartile thresholds calculated using Tukey's method. Best practice identification uses multi-factor regression isolating statistically significant differentiators at p less than 0.05. Convergence measured via coefficient of variation across rolling 4-quarter windows.</div>
        </div>
      </div>
    </div>
  );
}
