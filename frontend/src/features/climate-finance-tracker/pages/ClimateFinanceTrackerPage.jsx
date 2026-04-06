import React,{useState,useMemo} from 'react';
import {BarChart,Bar,XAxis,YAxis,CartesianGrid,Tooltip,ResponsiveContainer,AreaChart,Area,PieChart,Pie,Cell,Legend} from 'recharts';

const T={bg:'#f6f4f0',surface:'#ffffff',surfaceH:'#f0ede7',border:'#e5e0d8',borderL:'#d5cfc5',navy:'#1b3a5c',navyL:'#2c5a8c',gold:'#c5a96a',goldL:'#d4be8a',sage:'#5a8a6a',sageL:'#7ba67d',teal:'#5a8a6a',text:'#1b3a5c',textSec:'#5c6b7e',textMut:'#9aa3ae',red:'#dc2626',green:'#16a34a',amber:'#d97706',font:"'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"};
const sr=(s)=>{let x=Math.sin(s+1)*10000;return x-Math.floor(x);};

const TABS=['Global Climate Finance Dashboard','Fund-Level Analytics','Country-Level Flows','Investment Opportunity Pipeline'];
const COLORS=[T.navy,T.sage,T.gold,'#7c3aed',T.red,T.green,T.amber,'#0ea5e9','#be185d','#78350f'];

const flows=Array.from({length:50},(_,i)=>{const s=sr(i*7);const s2=sr(i*13);
  const types=['Bilateral ODA','MDB Concessional','MDB Non-Concessional','Private Mobilised','Blended Finance','Green Bond','Climate Fund Grant','DFI Loan','Export Credit','Domestic Budget'];
  const channels=['GCF','AF','GEF','CIF','LDCF','SCCF','Bilateral','MDB','DFI','Private'];
  const sectors=['Energy','Transport','Agriculture','Forestry','Water','Waste','Buildings','Industry','Health','Ecosystems'];
  return {id:i+1,type:types[Math.floor(s*types.length)],channel:channels[Math.floor(s2*channels.length)],
    sector:sectors[Math.floor(sr(i*19)*sectors.length)],amountMn:Math.round(20+s*980),
    purpose:sr(i*23)<0.4?'Mitigation':sr(i*23)<0.7?'Adaptation':'Cross-cutting',
    donor:['USA','Japan','Germany','France','UK','Canada','Netherlands','Sweden','Norway','Australia','Denmark','Switzerland','Italy','Spain','South Korea'][Math.floor(sr(i*29)*15)],
    recipient:['Bangladesh','Indonesia','India','Vietnam','Ethiopia','Kenya','Philippines','Colombia','Peru','Brazil','Pakistan','Cambodia','Mozambique','Nigeria','Egypt','Morocco','Tanzania','Ghana','Zambia','Myanmar'][Math.floor(sr(i*31)*20)],
    year:2018+Math.floor(sr(i*37)*8),status:['Committed','Disbursed','Pipeline','Approved'][Math.floor(sr(i*41)*4)],
    instrument:['Grant','Concessional Loan','Commercial Loan','Equity','Guarantee','Technical Assistance'][Math.floor(sr(i*43)*6)],
    grantElement:Math.round(20+sr(i*47)*70),additionality:sr(i*51)<0.3?'High':sr(i*51)<0.65?'Medium':'Low',
    coFinancingRatio:+(1+sr(i*53)*9).toFixed(1)};
});

const FUNDS=[
  {name:'Green Climate Fund (GCF)',totalPledgedBn:12.8,disbursedBn:4.2,approvedProjects:228,countries:127,adaptation:42,mitigation:38,cross:20,replenishment:'GCF-2 (2024-27)'},
  {name:'Adaptation Fund (AF)',totalPledgedBn:1.2,disbursedBn:0.95,approvedProjects:142,countries:108,adaptation:100,mitigation:0,cross:0,replenishment:'Annual'},
  {name:'Global Environment Facility (GEF)',totalPledgedBn:5.3,disbursedBn:3.8,approvedProjects:412,countries:145,adaptation:25,mitigation:55,cross:20,replenishment:'GEF-8 (2022-26)'},
  {name:'Climate Investment Funds (CIF)',totalPledgedBn:11.0,disbursedBn:7.2,approvedProjects:350,countries:72,adaptation:30,mitigation:60,cross:10,replenishment:'CTF/SCF'},
  {name:'LDCF',totalPledgedBn:2.1,disbursedBn:1.5,approvedProjects:310,countries:51,adaptation:95,mitigation:0,cross:5,replenishment:'Voluntary'},
  {name:'Loss & Damage Fund',totalPledgedBn:0.72,disbursedBn:0.0,approvedProjects:0,countries:0,adaptation:0,mitigation:0,cross:100,replenishment:'COP28 pledges'},
];

const DONOR_FLOWS=[
  {country:'USA',publicBn:11.4,privateBn:18.2,adaptBn:1.8,mitigBn:27.8,totalBn:29.6,ncqgPledge:14.0},
  {country:'Japan',publicBn:17.2,privateBn:8.4,adaptBn:3.2,mitigBn:22.4,totalBn:25.6,ncqgPledge:20.0},
  {country:'Germany',publicBn:9.8,privateBn:12.1,adaptBn:2.9,mitigBn:19.0,totalBn:21.9,ncqgPledge:12.0},
  {country:'France',publicBn:7.6,privateBn:9.8,adaptBn:2.1,mitigBn:15.3,totalBn:17.4,ncqgPledge:8.0},
  {country:'UK',publicBn:6.2,privateBn:7.4,adaptBn:1.8,mitigBn:11.8,totalBn:13.6,ncqgPledge:7.0},
  {country:'Canada',publicBn:4.4,privateBn:3.8,adaptBn:0.9,mitigBn:7.3,totalBn:8.2,ncqgPledge:5.5},
  {country:'Netherlands',publicBn:3.1,privateBn:5.2,adaptBn:1.2,mitigBn:7.1,totalBn:8.3,ncqgPledge:3.5},
  {country:'Sweden',publicBn:2.8,privateBn:2.1,adaptBn:0.8,mitigBn:4.1,totalBn:4.9,ncqgPledge:3.0},
  {country:'Norway',publicBn:3.2,privateBn:1.8,adaptBn:1.1,mitigBn:3.9,totalBn:5.0,ncqgPledge:3.5},
  {country:'Australia',publicBn:2.1,privateBn:3.4,adaptBn:0.6,mitigBn:4.9,totalBn:5.5,ncqgPledge:2.5},
  {country:'Denmark',publicBn:1.8,privateBn:1.2,adaptBn:0.5,mitigBn:2.5,totalBn:3.0,ncqgPledge:2.0},
  {country:'Switzerland',publicBn:1.5,privateBn:2.8,adaptBn:0.4,mitigBn:3.9,totalBn:4.3,ncqgPledge:1.8},
];

const PIPELINE=[
  {project:'Sahel Solar Mega-Park',country:'Mali',sector:'Energy',valueMn:450,blendedPct:35,returnPct:8.2,riskRating:'Medium',stage:'Feasibility'},
  {project:'Mekong Flood Resilience',country:'Vietnam',sector:'Infrastructure',valueMn:280,blendedPct:50,returnPct:5.1,riskRating:'Low',stage:'Due Diligence'},
  {project:'Amazon REDD+ Phase III',country:'Brazil',sector:'Forestry',valueMn:180,blendedPct:60,returnPct:4.5,riskRating:'High',stage:'Pipeline'},
  {project:'East Africa Geothermal',country:'Kenya',sector:'Energy',valueMn:520,blendedPct:25,returnPct:9.8,riskRating:'Medium',stage:'Approved'},
  {project:'Caribbean Resilience Bond',country:'Jamaica',sector:'Insurance',valueMn:150,blendedPct:40,returnPct:6.5,riskRating:'Medium',stage:'Due Diligence'},
  {project:'Bangladesh Climate Housing',country:'Bangladesh',sector:'Buildings',valueMn:320,blendedPct:45,returnPct:5.8,riskRating:'Medium',stage:'Feasibility'},
  {project:'Andes Water Security',country:'Peru',sector:'Water',valueMn:210,blendedPct:55,returnPct:4.2,riskRating:'Low',stage:'Pipeline'},
  {project:'West Africa Mini-Grid',country:'Nigeria',sector:'Energy',valueMn:380,blendedPct:30,returnPct:11.5,riskRating:'High',stage:'Approved'},
  {project:'SE Asia Mangrove Blue Carbon',country:'Indonesia',sector:'Ecosystems',valueMn:120,blendedPct:65,returnPct:3.8,riskRating:'Medium',stage:'Pipeline'},
  {project:'Central Asia Wind',country:'Kazakhstan',sector:'Energy',valueMn:290,blendedPct:20,returnPct:10.2,riskRating:'Low',stage:'Due Diligence'},
  {project:'Pacific Island Resilience',country:'Fiji',sector:'Adaptation',valueMn:95,blendedPct:70,returnPct:2.5,riskRating:'High',stage:'Feasibility'},
  {project:'India Green Hydrogen Hub',country:'India',sector:'Energy',valueMn:680,blendedPct:15,returnPct:12.8,riskRating:'Medium',stage:'Approved'},
  {project:'DRC Forest Carbon Credits',country:'DRC',sector:'Forestry',valueMn:160,blendedPct:55,returnPct:5.5,riskRating:'High',stage:'Pipeline'},
  {project:'Morocco Solar Noor IV',country:'Morocco',sector:'Energy',valueMn:540,blendedPct:22,returnPct:9.4,riskRating:'Low',stage:'Approved'},
  {project:'Colombia Nature-Based',country:'Colombia',sector:'Ecosystems',valueMn:175,blendedPct:48,returnPct:4.8,riskRating:'Medium',stage:'Due Diligence'},
];

const annualTrend=Array.from({length:8},(_,i)=>({year:2018+i,public:Math.round(55+sr(i*3)*15+i*5),private:Math.round(30+sr(i*7)*20+i*8),adaptation:Math.round(12+sr(i*11)*5+i*2),total:Math.round(85+sr(i*13)*20+i*13)}));

const tipS={contentStyle:{background:T.surface,border:`1px solid ${T.border}`,borderRadius:8,fontSize:11,fontFamily:T.font,color:T.text}};
const Stat=({label,value,sub,color})=>(<div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:12,padding:'18px 20px',borderTop:`3px solid ${color||T.sage}`}}>
  <div style={{fontSize:10,color:T.textMut,textTransform:'uppercase',letterSpacing:'0.1em',fontWeight:600,marginBottom:6,fontFamily:T.font}}>{label}</div>
  <div style={{fontSize:26,fontWeight:800,color:T.navy,fontFamily:T.font}}>{value}</div>{sub&&<div style={{fontSize:11,color:T.textSec,marginTop:3}}>{sub}</div>}</div>);
const Badge=({children,color})=>{const m={green:{bg:'#dcfce7',fg:T.green},red:{bg:'#fee2e2',fg:T.red},amber:{bg:'#fef3c7',fg:T.amber},navy:{bg:'#dbeafe',fg:T.navy},sage:{bg:'#d1fae5',fg:T.sage}};const c=m[color]||m.sage;return <span style={{padding:'2px 8px',borderRadius:4,fontSize:10,fontWeight:700,background:c.bg,color:c.fg}}>{children}</span>;};
const exportCSV=(rows,name)=>{if(!rows.length)return;const keys=Object.keys(rows[0]);const csv=[keys.join(','),...rows.map(r=>keys.map(k=>`"${r[k]}"`).join(','))].join('\n');const b=new Blob([csv],{type:'text/csv'});const u=URL.createObjectURL(b);const a=document.createElement('a');a.href=u;a.download=`${name}.csv`;a.click();URL.revokeObjectURL(u);};
const thS={padding:'8px 12px',fontSize:11,fontWeight:600,color:T.textSec,textAlign:'left',borderBottom:`2px solid ${T.border}`,cursor:'pointer',fontFamily:T.font,background:T.surfaceH,position:'sticky',top:0};
const tdS={padding:'8px 12px',fontSize:12,color:T.text,borderBottom:`1px solid ${T.border}`,fontFamily:T.font};
const tdM={...tdS,fontFamily:T.mono,fontWeight:600};

export default function ClimateFinanceTrackerPage(){
  const [tab,setTab]=useState(0);
  const [flowSearch,setFlowSearch]=useState('');
  const [flowSort,setFlowSort]=useState('amountMn');
  const [flowSortDir,setFlowSortDir]=useState('desc');
  const [purposeFilter,setPurposeFilter]=useState('All');
  const [channelFilter,setChannelFilter]=useState('All');
  const [expanded,setExpanded]=useState(null);
  const [selectedFund,setSelectedFund]=useState(0);
  const [donorSort,setDonorSort]=useState('totalBn');
  const [donorSortDir,setDonorSortDir]=useState('desc');
  const [donorSearch,setDonorSearch]=useState('');
  const [showPanel,setShowPanel]=useState(false);
  const [panelData,setPanelData]=useState(null);
  const [pipeSort,setPipeSort]=useState('valueMn');
  const [pipeSortDir,setPipeSortDir]=useState('desc');
  const [stageFilter,setStageFilter]=useState('All');
  const [targetSlider,setTargetSlider]=useState(100);

  const toggleFlowSort=col=>{if(flowSort===col)setFlowSortDir(d=>d==='asc'?'desc':'asc');else{setFlowSort(col);setFlowSortDir('desc');}};
  const toggleDonorSort=col=>{if(donorSort===col)setDonorSortDir(d=>d==='asc'?'desc':'asc');else{setDonorSort(col);setDonorSortDir('desc');}};
  const togglePipeSort=col=>{if(pipeSort===col)setPipeSortDir(d=>d==='asc'?'desc':'asc');else{setPipeSort(col);setPipeSortDir('desc');}};

  const filteredFlows=useMemo(()=>{let d=[...flows];if(flowSearch)d=d.filter(r=>r.donor.toLowerCase().includes(flowSearch.toLowerCase())||r.recipient.toLowerCase().includes(flowSearch.toLowerCase()));if(purposeFilter!=='All')d=d.filter(r=>r.purpose===purposeFilter);if(channelFilter!=='All')d=d.filter(r=>r.channel===channelFilter);d.sort((a,b)=>flowSortDir==='asc'?(a[flowSort]>b[flowSort]?1:-1):(a[flowSort]<b[flowSort]?1:-1));return d;},[flowSearch,purposeFilter,channelFilter,flowSort,flowSortDir]);

  const filteredDonors=useMemo(()=>{let d=[...DONOR_FLOWS];if(donorSearch)d=d.filter(r=>r.country.toLowerCase().includes(donorSearch.toLowerCase()));d.sort((a,b)=>donorSortDir==='asc'?(a[donorSort]>b[donorSort]?1:-1):(a[donorSort]<b[donorSort]?1:-1));return d;},[donorSearch,donorSort,donorSortDir]);

  const filteredPipeline=useMemo(()=>{let d=[...PIPELINE];if(stageFilter!=='All')d=d.filter(r=>r.stage===stageFilter);d.sort((a,b)=>pipeSortDir==='asc'?(a[pipeSort]>b[pipeSort]?1:-1):(a[pipeSort]<b[pipeSort]?1:-1));return d;},[stageFilter,pipeSort,pipeSortDir]);

  const totalFlows=flows.reduce((s,f)=>s+f.amountMn,0);
  const adaptPct=totalFlows?Math.round(flows.filter(f=>f.purpose==='Adaptation').reduce((s,f)=>s+f.amountMn,0)/totalFlows*100):0;
  const channels=[...new Set(flows.map(f=>f.channel))];
  const currentTotal=annualTrend[annualTrend.length-1].total;
  const targetGap=targetSlider-currentTotal;

  const purposeAgg=useMemo(()=>['Mitigation','Adaptation','Cross-cutting'].map(p=>({purpose:p,total:flows.filter(f=>f.purpose===p).reduce((s,f)=>s+f.amountMn,0)})),[]);

  return (<div style={{minHeight:'100vh',background:T.bg,fontFamily:T.font,color:T.text}}>
    <div style={{maxWidth:1400,margin:'0 auto',padding:'24px 32px'}}>
      <div style={{marginBottom:24}}>
        <h1 style={{fontSize:28,fontWeight:800,color:T.navy,margin:0}}>Climate Finance Tracker</h1>
        <p style={{fontSize:13,color:T.textSec,margin:'4px 0 0'}}>50 climate finance flows -- GCF, NCQG, bilateral, multilateral & private</p>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:12,marginBottom:24}}>
        <Stat label="Total Tracked" value={`$${(totalFlows/1000).toFixed(1)}B`} sub="50 flows" color={T.navy}/>
        <Stat label="Latest Annual" value={`$${currentTotal}B`} sub={`vs $${targetSlider}B target`} color={targetGap>0?T.red:T.green}/>
        <Stat label="Adaptation %" value={`${adaptPct}%`} sub="Of total finance" color={T.sage}/>
        <Stat label="Active Funds" value="6" sub="Multilateral" color={T.gold}/>
        <Stat label="Pipeline" value={`$${(PIPELINE.reduce((s,p)=>s+p.valueMn,0)/1000).toFixed(1)}B`} sub={`${PIPELINE.length} projects`} color={T.amber}/>
      </div>

      <div style={{display:'flex',gap:0,marginBottom:24,borderBottom:`2px solid ${T.border}`}}>
        {TABS.map((t,i)=><button key={t} onClick={()=>setTab(i)} style={{padding:'12px 24px',fontSize:13,fontWeight:tab===i?700:500,color:tab===i?T.navy:T.textMut,background:'none',border:'none',borderBottom:tab===i?`3px solid ${T.navy}`:'3px solid transparent',cursor:'pointer',fontFamily:T.font}}>{t}</button>)}
      </div>

      {tab===0&&(<div>
        <div style={{display:'flex',gap:12,marginBottom:16,alignItems:'center'}}>
          <span style={{fontSize:12,color:T.textSec}}>NCQG Target ($B):</span>
          <input type="range" min={100} max={300} value={targetSlider} onChange={e=>setTargetSlider(+e.target.value)} style={{width:200}}/>
          <span style={{fontFamily:T.mono,fontWeight:700,color:T.navy}}>${targetSlider}B</span>
          <span style={{fontSize:11,color:targetGap>0?T.red:T.green,fontWeight:700,marginLeft:8}}>{targetGap>0?`Gap: $${targetGap}B`:'Target Met'}</span>
        </div>

        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:20,marginBottom:20}}>
          <div style={{background:T.surface,borderRadius:12,border:`1px solid ${T.border}`,padding:20}}>
            <div style={{fontSize:14,fontWeight:700,color:T.navy,marginBottom:12}}>Annual Climate Finance ($B)</div>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={annualTrend}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="year" tick={{fontSize:10,fill:T.textSec}}/><YAxis tick={{fontSize:10,fill:T.textSec}}/><Tooltip {...tipS}/>
                <Area type="monotone" dataKey="public" stackId="1" stroke={T.navy} fill={T.navy} fillOpacity={0.3} name="Public"/>
                <Area type="monotone" dataKey="private" stackId="1" stroke={T.sage} fill={T.sage} fillOpacity={0.3} name="Private"/>
                <Legend/>
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div style={{background:T.surface,borderRadius:12,border:`1px solid ${T.border}`,padding:20}}>
            <div style={{fontSize:14,fontWeight:700,color:T.navy,marginBottom:12}}>Mitigation vs Adaptation Split</div>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart><Pie data={purposeAgg} dataKey="total" nameKey="purpose" cx="50%" cy="50%" outerRadius={100} label={({name,percent})=>`${name} ${(percent*100).toFixed(0)}%`} style={{fontSize:10}}>
                {purposeAgg.map((e,i)=><Cell key={i} fill={COLORS[i]}/>)}</Pie><Tooltip {...tipS}/><Legend/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div style={{display:'flex',gap:12,marginBottom:16,alignItems:'center'}}>
          <input value={flowSearch} onChange={e=>setFlowSearch(e.target.value)} placeholder="Search donor or recipient..." style={{padding:'8px 14px',border:`1px solid ${T.border}`,borderRadius:8,fontSize:13,fontFamily:T.font,width:260,outline:'none',background:T.surface}}/>
          <select value={purposeFilter} onChange={e=>setPurposeFilter(e.target.value)} style={{padding:'8px 14px',border:`1px solid ${T.border}`,borderRadius:8,fontSize:13,fontFamily:T.font,background:T.surface}}>
            <option value="All">All Purposes</option><option>Mitigation</option><option>Adaptation</option><option>Cross-cutting</option>
          </select>
          <select value={channelFilter} onChange={e=>setChannelFilter(e.target.value)} style={{padding:'8px 14px',border:`1px solid ${T.border}`,borderRadius:8,fontSize:13,fontFamily:T.font,background:T.surface}}>
            <option value="All">All Channels</option>{channels.map(c=><option key={c}>{c}</option>)}
          </select>
          <button onClick={()=>exportCSV(filteredFlows,'climate_finance_flows')} style={{padding:'8px 16px',background:T.navy,color:'#fff',border:'none',borderRadius:8,fontSize:12,fontWeight:600,cursor:'pointer'}}>Export CSV</button>
        </div>
        <div style={{background:T.surface,borderRadius:12,border:`1px solid ${T.border}`,overflow:'hidden'}}>
          <div style={{maxHeight:360,overflowY:'auto'}}>
            <table style={{width:'100%',borderCollapse:'collapse'}}>
              <thead><tr>{[{k:'id',l:'#'},{k:'donor',l:'Donor'},{k:'recipient',l:'Recipient'},{k:'amountMn',l:'Amount ($M)'},{k:'purpose',l:'Purpose'},{k:'channel',l:'Channel'},{k:'instrument',l:'Instrument'},{k:'status',l:'Status'}].map(c=>
                <th key={c.k} onClick={()=>toggleFlowSort(c.k)} style={{...thS,color:flowSort===c.k?T.navy:T.textSec}}>{c.l}</th>
              )}</tr></thead>
              <tbody>{filteredFlows.slice(0,25).map(f=><tr key={f.id}><td style={tdM}>{f.id}</td><td style={tdS}>{f.donor}</td><td style={tdS}>{f.recipient}</td><td style={tdM}>{f.amountMn}</td>
                <td style={tdS}><Badge color={f.purpose==='Mitigation'?'navy':f.purpose==='Adaptation'?'sage':'amber'}>{f.purpose}</Badge></td>
                <td style={tdS}>{f.channel}</td><td style={{...tdS,fontSize:11}}>{f.instrument}</td>
                <td style={tdS}><Badge color={f.status==='Disbursed'?'green':f.status==='Approved'?'sage':'amber'}>{f.status}</Badge></td>
              </tr>)}</tbody>
            </table>
          </div>
        </div>
      </div>)}

      {tab===1&&(<div>
        <div style={{display:'flex',gap:8,marginBottom:16}}>
          {FUNDS.map((f,i)=><button key={i} onClick={()=>setSelectedFund(i)} style={{padding:'8px 16px',background:selectedFund===i?T.navy:T.surface,color:selectedFund===i?'#fff':T.text,border:`1px solid ${T.border}`,borderRadius:8,fontSize:11,fontWeight:600,cursor:'pointer',fontFamily:T.font}}>{f.name.split('(')[0].trim()}</button>)}
        </div>
        {(()=>{const f=FUNDS[selectedFund];return <div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12,marginBottom:20}}>
            <Stat label="Total Pledged" value={`$${f.totalPledgedBn}B`} sub={f.replenishment} color={T.navy}/>
            <Stat label="Disbursed" value={`$${f.disbursedBn}B`} sub={`${Math.round(f.disbursedBn/f.totalPledgedBn*100)}% of pledged`} color={T.sage}/>
            <Stat label="Approved Projects" value={f.approvedProjects} sub={`${f.countries} countries`} color={T.gold}/>
            <Stat label="Disbursement Rate" value={`${Math.round(f.disbursedBn/f.totalPledgedBn*100)}%`} sub="Pledged to disbursed" color={f.disbursedBn/f.totalPledgedBn>0.5?T.green:T.amber}/>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:20}}>
            <div style={{background:T.surface,borderRadius:12,border:`1px solid ${T.border}`,padding:20}}>
              <div style={{fontSize:14,fontWeight:700,color:T.navy,marginBottom:12}}>Purpose Split</div>
              <ResponsiveContainer width="100%" height={240}>
                <PieChart><Pie data={[{name:'Adaptation',value:f.adaptation},{name:'Mitigation',value:f.mitigation},{name:'Cross-cutting',value:f.cross}].filter(d=>d.value>0)} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>
                  {[T.sage,T.navy,T.gold].map((c,i)=><Cell key={i} fill={c}/>)}</Pie><Tooltip {...tipS}/><Legend/>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div style={{background:T.surface,borderRadius:12,border:`1px solid ${T.border}`,padding:20}}>
              <div style={{fontSize:14,fontWeight:700,color:T.navy,marginBottom:12}}>All Funds Comparison</div>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={FUNDS.map(fd=>({name:fd.name.split('(')[0].trim().split(' ').slice(0,2).join(' '),pledged:fd.totalPledgedBn,disbursed:fd.disbursedBn}))}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="name" tick={{fontSize:9,fill:T.textSec}}/><YAxis tick={{fontSize:10,fill:T.textSec}}/><Tooltip {...tipS}/>
                  <Bar dataKey="pledged" fill={T.navy} name="Pledged ($B)" opacity={0.4}/><Bar dataKey="disbursed" fill={T.sage} name="Disbursed ($B)"/><Legend/>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>;})()}
      </div>)}

      {tab===2&&(<div>
        <div style={{display:'flex',gap:12,marginBottom:16,alignItems:'center'}}>
          <input value={donorSearch} onChange={e=>setDonorSearch(e.target.value)} placeholder="Search country..." style={{padding:'8px 14px',border:`1px solid ${T.border}`,borderRadius:8,fontSize:13,fontFamily:T.font,width:220,outline:'none',background:T.surface}}/>
          <button onClick={()=>exportCSV(filteredDonors,'country_flows')} style={{padding:'8px 16px',background:T.navy,color:'#fff',border:'none',borderRadius:8,fontSize:12,fontWeight:600,cursor:'pointer'}}>Export CSV</button>
        </div>
        <div style={{background:T.surface,borderRadius:12,border:`1px solid ${T.border}`,overflow:'hidden',marginBottom:20}}>
          <table style={{width:'100%',borderCollapse:'collapse'}}>
            <thead><tr>{[{k:'country',l:'Country'},{k:'publicBn',l:'Public ($B)'},{k:'privateBn',l:'Private ($B)'},{k:'totalBn',l:'Total ($B)'},{k:'adaptBn',l:'Adaptation ($B)'},{k:'mitigBn',l:'Mitigation ($B)'},{k:'ncqgPledge',l:'NCQG Pledge ($B)'}].map(c=>
              <th key={c.k} onClick={()=>toggleDonorSort(c.k)} style={{...thS,color:donorSort===c.k?T.navy:T.textSec}}>{c.l}{donorSort===c.k?(donorSortDir==='asc'?' ^':' v'):''}</th>
            )}</tr></thead>
            <tbody>{filteredDonors.map(d=><tr key={d.country}>
              <td style={{...tdS,fontWeight:700}}>{d.country}</td><td style={tdM}>{d.publicBn}</td><td style={tdM}>{d.privateBn}</td><td style={{...tdM,color:T.navy}}>{d.totalBn}</td>
              <td style={tdM}>{d.adaptBn}</td><td style={tdM}>{d.mitigBn}</td><td style={{...tdM,color:d.totalBn>=d.ncqgPledge?T.green:T.red}}>{d.ncqgPledge}</td>
            </tr>)}</tbody>
          </table>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:20}}>
          <div style={{background:T.surface,borderRadius:12,border:`1px solid ${T.border}`,padding:20}}>
            <div style={{fontSize:14,fontWeight:700,color:T.navy,marginBottom:12}}>Donor Contributions ($B)</div>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={filteredDonors} layout="vertical"><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis type="number" tick={{fontSize:10,fill:T.textSec}}/><YAxis dataKey="country" type="category" tick={{fontSize:10,fill:T.textSec}} width={80}/><Tooltip {...tipS}/>
                <Bar dataKey="publicBn" stackId="a" fill={T.navy} name="Public"/><Bar dataKey="privateBn" stackId="a" fill={T.sage} name="Private"/><Legend/>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{background:T.surface,borderRadius:12,border:`1px solid ${T.border}`,padding:20}}>
            <div style={{fontSize:14,fontWeight:700,color:T.navy,marginBottom:12}}>Adaptation vs Mitigation by Donor</div>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={filteredDonors} layout="vertical"><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis type="number" tick={{fontSize:10,fill:T.textSec}}/><YAxis dataKey="country" type="category" tick={{fontSize:10,fill:T.textSec}} width={80}/><Tooltip {...tipS}/>
                <Bar dataKey="adaptBn" stackId="a" fill={T.gold} name="Adaptation"/><Bar dataKey="mitigBn" stackId="a" fill={T.navy} name="Mitigation"/><Legend/>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>)}

      {tab===3&&(<div>
        <div style={{display:'flex',gap:12,marginBottom:16,alignItems:'center'}}>
          <select value={stageFilter} onChange={e=>setStageFilter(e.target.value)} style={{padding:'8px 14px',border:`1px solid ${T.border}`,borderRadius:8,fontSize:13,fontFamily:T.font,background:T.surface}}>
            <option value="All">All Stages</option><option>Pipeline</option><option>Feasibility</option><option>Due Diligence</option><option>Approved</option>
          </select>
          <button onClick={()=>exportCSV(filteredPipeline,'investment_pipeline')} style={{padding:'8px 16px',background:T.navy,color:'#fff',border:'none',borderRadius:8,fontSize:12,fontWeight:600,cursor:'pointer'}}>Export CSV</button>
          <span style={{fontSize:11,color:T.textMut,marginLeft:'auto'}}>{filteredPipeline.length} projects | ${(filteredPipeline.reduce((s,p)=>s+p.valueMn,0)/1000).toFixed(1)}B total</span>
        </div>
        <div style={{background:T.surface,borderRadius:12,border:`1px solid ${T.border}`,overflow:'hidden',marginBottom:20}}>
          <div style={{maxHeight:420,overflowY:'auto'}}>
            <table style={{width:'100%',borderCollapse:'collapse'}}>
              <thead><tr>{[{k:'project',l:'Project'},{k:'country',l:'Country'},{k:'sector',l:'Sector'},{k:'valueMn',l:'Value ($M)'},{k:'blendedPct',l:'Blended %'},{k:'returnPct',l:'Return %'},{k:'riskRating',l:'Risk'},{k:'stage',l:'Stage'}].map(c=>
                <th key={c.k} onClick={()=>togglePipeSort(c.k)} style={{...thS,color:pipeSort===c.k?T.navy:T.textSec}}>{c.l}{pipeSort===c.k?(pipeSortDir==='asc'?' ^':' v'):''}</th>
              )}</tr></thead>
              <tbody>{filteredPipeline.map((p,i)=><tr key={i} onClick={()=>{setPanelData(p);setShowPanel(true);}} style={{cursor:'pointer'}}>
                <td style={{...tdS,fontWeight:600}}>{p.project}</td><td style={tdS}>{p.country}</td><td style={tdS}>{p.sector}</td><td style={tdM}>{p.valueMn}</td>
                <td style={tdM}>{p.blendedPct}%</td><td style={tdM}>{p.returnPct}%</td>
                <td style={tdS}><Badge color={p.riskRating==='Low'?'green':p.riskRating==='Medium'?'amber':'red'}>{p.riskRating}</Badge></td>
                <td style={tdS}><Badge color={p.stage==='Approved'?'green':p.stage==='Due Diligence'?'sage':'amber'}>{p.stage}</Badge></td>
              </tr>)}</tbody>
            </table>
          </div>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:20}}>
          <div style={{background:T.surface,borderRadius:12,border:`1px solid ${T.border}`,padding:20}}>
            <div style={{fontSize:14,fontWeight:700,color:T.navy,marginBottom:12}}>Pipeline by Stage ($M)</div>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={['Pipeline','Feasibility','Due Diligence','Approved'].map(s=>({stage:s,value:PIPELINE.filter(p=>p.stage===s).reduce((a,p)=>a+p.valueMn,0)}))}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="stage" tick={{fontSize:10,fill:T.textSec}}/><YAxis tick={{fontSize:10,fill:T.textSec}}/><Tooltip {...tipS}/>
                <Bar dataKey="value" fill={T.sage} radius={[4,4,0,0]}>{[T.amber,T.gold,T.navy,T.green].map((c,i)=><Cell key={i} fill={c}/>)}</Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{background:T.surface,borderRadius:12,border:`1px solid ${T.border}`,padding:20}}>
            <div style={{fontSize:14,fontWeight:700,color:T.navy,marginBottom:12}}>Risk-Return Profile</div>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={PIPELINE.sort((a,b)=>b.returnPct-a.returnPct).slice(0,10)}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="project" tick={{fontSize:8,fill:T.textSec}} angle={-25} textAnchor="end" height={70}/><YAxis tick={{fontSize:10,fill:T.textSec}}/><Tooltip {...tipS}/>
                <Bar dataKey="returnPct" fill={T.navy} name="Return %" radius={[4,4,0,0]}>{PIPELINE.slice(0,10).map((p,i)=><Cell key={i} fill={p.riskRating==='Low'?T.green:p.riskRating==='Medium'?T.amber:T.red}/>)}</Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>)}

      {showPanel&&panelData&&<div style={{position:'fixed',top:0,right:0,width:460,height:'100vh',background:T.surface,borderLeft:`2px solid ${T.border}`,boxShadow:'-4px 0 24px rgba(0,0,0,0.08)',zIndex:1000,overflowY:'auto',padding:24}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
          <h2 style={{fontSize:18,fontWeight:800,color:T.navy,margin:0}}>{panelData.project}</h2>
          <button onClick={()=>setShowPanel(false)} style={{background:'none',border:'none',fontSize:20,cursor:'pointer',color:T.textMut}}>x</button>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
          {[{l:'Country',v:panelData.country},{l:'Sector',v:panelData.sector},{l:'Value',v:`$${panelData.valueMn}M`},{l:'Blended Finance',v:`${panelData.blendedPct}%`},{l:'Expected Return',v:`${panelData.returnPct}%`},{l:'Risk',v:panelData.riskRating},{l:'Stage',v:panelData.stage},{l:'Concessional Share',v:`$${Math.round(panelData.valueMn*panelData.blendedPct/100)}M`}].map((d,i)=><div key={i}><div style={{fontSize:10,color:T.textMut}}>{d.l}</div><div style={{fontWeight:700}}>{d.v}</div></div>)}
        </div>
      </div>}
    </div>
  </div>);
}
