import React,{useState,useMemo} from 'react';
import {BarChart,Bar,XAxis,YAxis,CartesianGrid,Tooltip,ResponsiveContainer,PieChart,Pie,Cell,Legend,RadarChart,Radar,PolarGrid,PolarAngleAxis,PolarRadiusAxis,LineChart,Line} from 'recharts';

const T={bg:'#f6f4f0',surface:'#ffffff',surfaceH:'#f0ede7',border:'#e5e0d8',borderL:'#d5cfc5',navy:'#1b3a5c',navyL:'#2c5a8c',gold:'#c5a96a',goldL:'#d4be8a',sage:'#5a8a6a',sageL:'#7ba67d',teal:'#5a8a6a',text:'#1b3a5c',textSec:'#5c6b7e',textMut:'#9aa3ae',red:'#dc2626',green:'#16a34a',amber:'#d97706',font:"'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"};
const sr=(s)=>{let x=Math.sin(s+1)*10000;return x-Math.floor(x);};

const TABS=['DEI Scorecard','Pay Equity Analysis','Board & Leadership','Regulatory Compliance'];
const COLORS=[T.navy,T.sage,T.gold,'#7c3aed',T.red,T.green,T.amber,'#0ea5e9','#be185d','#78350f'];
const SECTORS=['Energy','Finance','Technology','Healthcare','Retail','Industrials','Materials','Utilities','Consumer','Media'];
const COMPANY_NAMES=['Accenture PLC','Adobe Inc','AIG','Airbus SE','Allianz SE','Amazon','Apple Inc','AstraZeneca','AT&T Inc','Axa SA','BAE Systems','Bank of America','Barclays PLC','BASF SE','Bayer AG','BHP Group','BlackRock','BMW AG','BNP Paribas','Boeing Co','BP PLC','Broadcom Inc','Citigroup','Coca-Cola','Colgate-Palmolive','Comcast Corp','ConocoPhillips','CVS Health','Daimler AG','Danone SA','Dell Tech','Deutsche Bank','Diageo PLC','Disney Co','Enel SpA','Ericsson','ExxonMobil','Ford Motor','General Electric','GlaxoSmithKline','Goldman Sachs','Google/Alphabet','HSBC Holdings','IBM Corp','Intel Corp','J&J','JPMorgan Chase','L\'Oreal SA','Linde PLC','Lockheed Martin','LVMH','Mastercard','McDonald\'s','Merck & Co','Meta Platforms','Microsoft','Morgan Stanley','Nestle SA','Nike Inc','Novartis AG','NVIDIA Corp','Oracle Corp','PepsiCo','Pfizer Inc','Procter & Gamble','Qualcomm','Rio Tinto','Roche Holding','Salesforce','Samsung Elec','SAP SE','Shell PLC','Siemens AG','Sony Group','Starbucks','Tesla Inc','TotalEnergies','Toyota Motor','UBS Group','Unilever PLC'];

const companies=Array.from({length:80},(_,i)=>{const s=sr(i*7);const s2=sr(i*13);const s3=sr(i*19);const s4=sr(i*23);
  return {id:i+1,name:COMPANY_NAMES[i],sector:SECTORS[Math.floor(s*SECTORS.length)],
    country:['US','GB','DE','FR','CH','JP','AU','NL','SE','IT'][Math.floor(s2*10)],employees:Math.round(5000+s*195000),
    femaleTotal:Math.round(25+s*30),femaleSenior:Math.round(15+s2*30),femaleBoard:Math.round(10+s3*40),
    ethnicMinority:Math.round(8+s*35),lgbtq:+(2+s2*6).toFixed(1),disability:+(1+s3*5).toFixed(1),
    genderPayGap:+(5+s*20).toFixed(1),ceoPayRatio:Math.round(80+s2*250),livingWage:sr(i*29)>0.3?'Yes':'No',
    medianPayF:Math.round(45000+s*55000),medianPayM:Math.round(50000+s2*60000),
    bonusGap:+(8+s3*25).toFixed(1),partTimeF:Math.round(10+s*30),partTimeM:Math.round(3+s2*12),
    boardSize:Math.round(8+s*7),boardFemale:Math.round(1+s3*5),boardEthnic:Math.round(0+s2*4),boardIndependent:Math.round(3+s*6),
    boardAvgAge:Math.round(52+s2*12),boardAvgTenure:+(3+s3*8).toFixed(1),
    successionPlan:sr(i*31)>0.4?'Yes':'No',deiCommittee:sr(i*37)>0.35?'Yes':'No',
    deiScore:Math.round(30+s*60),deiTrend:sr(i*41)<0.6?'Improving':'Stable',
    euPayTransparency:sr(i*43)<0.4?'Compliant':sr(i*43)<0.7?'Partial':'Gap',
    parkerReview:sr(i*47)<0.5?'Met':sr(i*47)<0.75?'Partial':'Not Met',
    hamptonAlexander:sr(i*51)<0.45?'Met':sr(i*51)<0.7?'Partial':'Not Met',
    snp500Inclusion:sr(i*53)>0.6?'Yes':'No',
    deiReporting:sr(i*57)<0.5?'Full':sr(i*57)<0.8?'Partial':'Minimal'};
});

const trendData=Array.from({length:24},(_,i)=>({month:`M${i+1}`,avgFemaleBoard:+(22+i*0.4+sr(i*3)*2).toFixed(1),avgPayGap:+(18-i*0.25+sr(i*5)*1.5).toFixed(1),avgDeiScore:+(42+i*0.6+sr(i*7)*3).toFixed(1)}));

const tipS={contentStyle:{background:T.surface,border:`1px solid ${T.border}`,borderRadius:8,fontSize:11,fontFamily:T.font,color:T.text}};
const Stat=({label,value,sub,color})=>(<div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:12,padding:'18px 20px',borderTop:`3px solid ${color||T.sage}`}}>
  <div style={{fontSize:10,color:T.textMut,textTransform:'uppercase',letterSpacing:'0.1em',fontWeight:600,marginBottom:6,fontFamily:T.font}}>{label}</div>
  <div style={{fontSize:26,fontWeight:800,color:T.navy,fontFamily:T.font}}>{value}</div>{sub&&<div style={{fontSize:11,color:T.textSec,marginTop:3}}>{sub}</div>}</div>);
const Badge=({children,color})=>{const m={green:{bg:'#dcfce7',fg:T.green},red:{bg:'#fee2e2',fg:T.red},amber:{bg:'#fef3c7',fg:T.amber},navy:{bg:'#dbeafe',fg:T.navy},sage:{bg:'#d1fae5',fg:T.sage}};const c=m[color]||m.sage;return <span style={{padding:'2px 8px',borderRadius:4,fontSize:10,fontWeight:700,background:c.bg,color:c.fg}}>{children}</span>;};
const exportCSV=(rows,name)=>{if(!rows.length)return;const keys=Object.keys(rows[0]);const csv=[keys.join(','),...rows.map(r=>keys.map(k=>`"${r[k]}"`).join(','))].join('\n');const b=new Blob([csv],{type:'text/csv'});const u=URL.createObjectURL(b);const a=document.createElement('a');a.href=u;a.download=`${name}.csv`;a.click();URL.revokeObjectURL(u);};
const thS={padding:'8px 12px',fontSize:11,fontWeight:600,color:T.textSec,textAlign:'left',borderBottom:`2px solid ${T.border}`,cursor:'pointer',fontFamily:T.font,background:T.surfaceH,position:'sticky',top:0};
const tdS={padding:'8px 12px',fontSize:12,color:T.text,borderBottom:`1px solid ${T.border}`,fontFamily:T.font};
const tdM={...tdS,fontFamily:T.mono,fontWeight:600};

export default function DiversityEquityInclusionPage(){
  const [tab,setTab]=useState(0);
  const [search,setSearch]=useState('');
  const [sortCol,setSortCol]=useState('deiScore');
  const [sortDir,setSortDir]=useState('desc');
  const [sectorFilter,setSectorFilter]=useState('All');
  const [expanded,setExpanded]=useState(null);
  const [showPanel,setShowPanel]=useState(false);
  const [panelData,setPanelData]=useState(null);
  const [paySearch,setPaySearch]=useState('');
  const [paySort,setPaySort]=useState('genderPayGap');
  const [paySortDir,setPaySortDir]=useState('desc');
  const [boardSearch,setBoardSearch]=useState('');
  const [boardSort,setBoardSort]=useState('femaleBoard');
  const [boardSortDir,setBoardSortDir]=useState('desc');
  const [regFilter,setRegFilter]=useState('All');
  const [regSort,setRegSort]=useState('euPayTransparency');
  const [regSortDir,setRegSortDir]=useState('asc');
  const [minDeiScore,setMinDeiScore]=useState(0);

  const toggleSort=col=>{if(sortCol===col)setSortDir(d=>d==='asc'?'desc':'asc');else{setSortCol(col);setSortDir('desc');}};
  const togglePaySort=col=>{if(paySort===col)setPaySortDir(d=>d==='asc'?'desc':'asc');else{setPaySort(col);setPaySortDir('desc');}};
  const toggleBoardSort=col=>{if(boardSort===col)setBoardSortDir(d=>d==='asc'?'desc':'asc');else{setBoardSort(col);setBoardSortDir('desc');}};
  const toggleRegSort=col=>{if(regSort===col)setRegSortDir(d=>d==='asc'?'desc':'asc');else{setRegSort(col);setRegSortDir('desc');}};

  const filtered=useMemo(()=>{let d=[...companies];if(search)d=d.filter(r=>r.name.toLowerCase().includes(search.toLowerCase()));if(sectorFilter!=='All')d=d.filter(r=>r.sector===sectorFilter);d=d.filter(r=>r.deiScore>=minDeiScore);d.sort((a,b)=>sortDir==='asc'?(a[sortCol]>b[sortCol]?1:-1):(a[sortCol]<b[sortCol]?1:-1));return d;},[search,sectorFilter,sortCol,sortDir,minDeiScore]);

  const payFiltered=useMemo(()=>{let d=[...companies];if(paySearch)d=d.filter(r=>r.name.toLowerCase().includes(paySearch.toLowerCase()));d.sort((a,b)=>paySortDir==='asc'?(a[paySort]>b[paySort]?1:-1):(a[paySort]<b[paySort]?1:-1));return d;},[paySearch,paySort,paySortDir]);

  const boardFiltered=useMemo(()=>{let d=[...companies];if(boardSearch)d=d.filter(r=>r.name.toLowerCase().includes(boardSearch.toLowerCase()));d.sort((a,b)=>boardSortDir==='asc'?(a[boardSort]>b[boardSort]?1:-1):(a[boardSort]<b[boardSort]?1:-1));return d;},[boardSearch,boardSort,boardSortDir]);

  const regFiltered=useMemo(()=>{let d=[...companies];if(regFilter!=='All'){if(regFilter==='EU')d=d.filter(r=>r.euPayTransparency!=='Gap');if(regFilter==='Parker')d=d.filter(r=>r.parkerReview==='Met');if(regFilter==='Hampton')d=d.filter(r=>r.hamptonAlexander==='Met');}d.sort((a,b)=>regSortDir==='asc'?(a[regSort]>b[regSort]?1:-1):(a[regSort]<b[regSort]?1:-1));return d;},[regFilter,regSort,regSortDir]);

  const avgPayGap=+(companies.reduce((s,c)=>s+parseFloat(c.genderPayGap),0)/80).toFixed(1);
  const avgFemaleBoard=Math.round(companies.reduce((s,c)=>s+c.femaleBoard,0)/80);
  const avgDeiScore=Math.round(companies.reduce((s,c)=>s+c.deiScore,0)/80);

  const sectorDei=useMemo(()=>SECTORS.map(s=>{const cs=companies.filter(c=>c.sector===s);return {sector:s,avgDei:Math.round(cs.reduce((a,c)=>a+c.deiScore,0)/ Math.max(1, cs.length)),avgFemale:Math.round(cs.reduce((a,c)=>a+c.femaleTotal,0)/ Math.max(1, cs.length)),avgPayGap:+(cs.reduce((a,c)=>a+parseFloat(c.genderPayGap),0)/ Math.max(1, cs.length)).toFixed(1)};}),[]);

  const radarDims=['Female %','Ethnic Min %','Board Diversity','Pay Equity','DEI Score','Reporting'];

  return (<div style={{minHeight:'100vh',background:T.bg,fontFamily:T.font,color:T.text}}>
    <div style={{maxWidth:1400,margin:'0 auto',padding:'24px 32px'}}>
      <div style={{marginBottom:24}}>
        <h1 style={{fontSize:28,fontWeight:800,color:T.navy,margin:0}}>Diversity, Equity & Inclusion</h1>
        <p style={{fontSize:13,color:T.textSec,margin:'4px 0 0'}}>80 companies -- gender pay gap, board diversity, ethnicity, regulatory compliance</p>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:12,marginBottom:24}}>
        <Stat label="Companies" value="80" sub="Tracked" color={T.navy}/>
        <Stat label="Avg DEI Score" value={avgDeiScore} sub="/100" color={T.sage}/>
        <Stat label="Avg Gender Pay Gap" value={`${avgPayGap}%`} sub="Median hourly" color={T.red}/>
        <Stat label="Avg Female Board" value={`${avgFemaleBoard}%`} sub="Board seats" color={T.gold}/>
        <Stat label="EU Compliant" value={companies.filter(c=>c.euPayTransparency==='Compliant').length} sub="Pay Transparency 2026" color={T.green}/>
      </div>

      <div style={{display:'flex',gap:0,marginBottom:24,borderBottom:`2px solid ${T.border}`}}>
        {TABS.map((t,i)=><button key={t} onClick={()=>setTab(i)} style={{padding:'12px 24px',fontSize:13,fontWeight:tab===i?700:500,color:tab===i?T.navy:T.textMut,background:'none',border:'none',borderBottom:tab===i?`3px solid ${T.navy}`:'3px solid transparent',cursor:'pointer',fontFamily:T.font}}>{t}</button>)}
      </div>

      {tab===0&&(<div>
        <div style={{display:'flex',gap:12,marginBottom:16,alignItems:'center',flexWrap:'wrap'}}>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search company..." style={{padding:'8px 14px',border:`1px solid ${T.border}`,borderRadius:8,fontSize:13,fontFamily:T.font,width:240,outline:'none',background:T.surface}}/>
          <select value={sectorFilter} onChange={e=>setSectorFilter(e.target.value)} style={{padding:'8px 14px',border:`1px solid ${T.border}`,borderRadius:8,fontSize:13,fontFamily:T.font,background:T.surface}}>
            <option value="All">All Sectors</option>{SECTORS.map(s=><option key={s} value={s}>{s}</option>)}
          </select>
          <label style={{display:'flex',alignItems:'center',gap:6,fontSize:11,color:T.textSec}}>
            Min DEI: <input type="range" min={0} max={80} value={minDeiScore} onChange={e=>setMinDeiScore(+e.target.value)} style={{width:100}}/> <span style={{fontFamily:T.mono,fontWeight:700}}>{minDeiScore}</span>
          </label>
          <button onClick={()=>exportCSV(filtered,'dei_scorecard')} style={{padding:'8px 16px',background:T.navy,color:'#fff',border:'none',borderRadius:8,fontSize:12,fontWeight:600,cursor:'pointer'}}>Export CSV</button>
          <span style={{fontSize:11,color:T.textMut,marginLeft:'auto'}}>{filtered.length} companies</span>
        </div>
        <div style={{background:T.surface,borderRadius:12,border:`1px solid ${T.border}`,overflow:'hidden',marginBottom:20}}>
          <div style={{maxHeight:460,overflowY:'auto'}}>
            <table style={{width:'100%',borderCollapse:'collapse'}}>
              <thead><tr>{[{k:'id',l:'#'},{k:'name',l:'Company'},{k:'sector',l:'Sector'},{k:'femaleTotal',l:'Female %'},{k:'femaleSenior',l:'Senior F %'},{k:'femaleBoard',l:'Board F %'},{k:'ethnicMinority',l:'Ethnic Min %'},{k:'genderPayGap',l:'Pay Gap %'},{k:'deiScore',l:'DEI Score'},{k:'deiTrend',l:'Trend'}].map(c=>
                <th key={c.k} onClick={()=>toggleSort(c.k)} style={{...thS,color:sortCol===c.k?T.navy:T.textSec}}>{c.l}{sortCol===c.k?(sortDir==='asc'?' ^':' v'):''}</th>
              )}</tr></thead>
              <tbody>{filtered.slice(0,40).map(c=><React.Fragment key={c.id}>
                <tr onClick={()=>setExpanded(expanded===c.id?null:c.id)} style={{cursor:'pointer',background:expanded===c.id?T.surfaceH:'transparent'}}>
                  <td style={tdM}>{c.id}</td><td style={{...tdS,fontWeight:600}}>{c.name}</td><td style={tdS}>{c.sector}</td>
                  <td style={tdM}>{c.femaleTotal}%</td><td style={tdM}>{c.femaleSenior}%</td><td style={tdM}>{c.femaleBoard}%</td>
                  <td style={tdM}>{c.ethnicMinority}%</td><td style={{...tdM,color:parseFloat(c.genderPayGap)>15?T.red:T.green}}>{c.genderPayGap}%</td>
                  <td style={tdM}><Badge color={c.deiScore>=70?'green':c.deiScore>=50?'amber':'red'}>{c.deiScore}</Badge></td>
                  <td style={tdS}><Badge color={c.deiTrend==='Improving'?'green':'amber'}>{c.deiTrend}</Badge></td>
                </tr>
                {expanded===c.id&&<tr><td colSpan={10} style={{padding:16,background:T.surfaceH}}>
                  <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:12}}>
                    <div><span style={{fontSize:10,color:T.textMut}}>LGBTQ+</span><div style={{fontWeight:700}}>{c.lgbtq}%</div></div>
                    <div><span style={{fontSize:10,color:T.textMut}}>Disability</span><div style={{fontWeight:700}}>{c.disability}%</div></div>
                    <div><span style={{fontSize:10,color:T.textMut}}>Living Wage</span><div><Badge color={c.livingWage==='Yes'?'green':'red'}>{c.livingWage}</Badge></div></div>
                    <div><span style={{fontSize:10,color:T.textMut}}>CEO Pay Ratio</span><div style={{fontWeight:700}}>{c.ceoPayRatio}:1</div></div>
                    <div><span style={{fontSize:10,color:T.textMut}}>Employees</span><div style={{fontWeight:700}}>{c.employees.toLocaleString()}</div></div>
                    <div><span style={{fontSize:10,color:T.textMut}}>DEI Committee</span><div><Badge color={c.deiCommittee==='Yes'?'green':'red'}>{c.deiCommittee}</Badge></div></div>
                    <div><span style={{fontSize:10,color:T.textMut}}>Reporting</span><div><Badge color={c.deiReporting==='Full'?'green':c.deiReporting==='Partial'?'amber':'red'}>{c.deiReporting}</Badge></div></div>
                    <div><span style={{fontSize:10,color:T.textMut}}>Country</span><div style={{fontWeight:700}}>{c.country}</div></div>
                    <div><span style={{fontSize:10,color:T.textMut}}>Bonus Gap</span><div style={{fontWeight:700}}>{c.bonusGap}%</div></div>
                    <div><span style={{fontSize:10,color:T.textMut}}>S&P 500 DEI</span><div><Badge color={c.snp500Inclusion==='Yes'?'green':'red'}>{c.snp500Inclusion}</Badge></div></div>
                  </div>
                  <button onClick={e=>{e.stopPropagation();setPanelData(c);setShowPanel(true);}} style={{marginTop:8,padding:'6px 14px',background:T.navy,color:'#fff',border:'none',borderRadius:6,fontSize:11,cursor:'pointer'}}>Full Profile</button>
                </td></tr>}
              </React.Fragment>)}</tbody>
            </table>
          </div>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:20}}>
          <div style={{background:T.surface,borderRadius:12,border:`1px solid ${T.border}`,padding:20}}>
            <div style={{fontSize:14,fontWeight:700,color:T.navy,marginBottom:12}}>DEI Score by Sector</div>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={sectorDei}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="sector" tick={{fontSize:9,fill:T.textSec}} angle={-25} textAnchor="end" height={50}/><YAxis domain={[0,100]} tick={{fontSize:10,fill:T.textSec}}/><Tooltip {...tipS}/><Bar dataKey="avgDei" fill={T.sage} radius={[4,4,0,0]}>{sectorDei.map((e,i)=><Cell key={i} fill={COLORS[i%COLORS.length]}/>)}</Bar></BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{background:T.surface,borderRadius:12,border:`1px solid ${T.border}`,padding:20}}>
            <div style={{fontSize:14,fontWeight:700,color:T.navy,marginBottom:12}}>DEI Score Trend (24M)</div>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={trendData}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="month" tick={{fontSize:10,fill:T.textSec}}/><YAxis tick={{fontSize:10,fill:T.textSec}}/><Tooltip {...tipS}/>
                <Line type="monotone" dataKey="avgDeiScore" stroke={T.sage} strokeWidth={2} dot={false} name="DEI Score"/><Line type="monotone" dataKey="avgFemaleBoard" stroke={T.gold} strokeWidth={2} dot={false} name="Female Board %"/><Legend/>
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>)}

      {tab===1&&(<div>
        <div style={{display:'flex',gap:12,marginBottom:16,alignItems:'center'}}>
          <input value={paySearch} onChange={e=>setPaySearch(e.target.value)} placeholder="Search company..." style={{padding:'8px 14px',border:`1px solid ${T.border}`,borderRadius:8,fontSize:13,fontFamily:T.font,width:240,outline:'none',background:T.surface}}/>
          <button onClick={()=>exportCSV(payFiltered,'pay_equity')} style={{padding:'8px 16px',background:T.navy,color:'#fff',border:'none',borderRadius:8,fontSize:12,fontWeight:600,cursor:'pointer'}}>Export CSV</button>
        </div>
        <div style={{background:T.surface,borderRadius:12,border:`1px solid ${T.border}`,overflow:'hidden',marginBottom:20}}>
          <div style={{maxHeight:400,overflowY:'auto'}}>
            <table style={{width:'100%',borderCollapse:'collapse'}}>
              <thead><tr>{[{k:'name',l:'Company'},{k:'genderPayGap',l:'Gender Pay Gap %'},{k:'bonusGap',l:'Bonus Gap %'},{k:'ceoPayRatio',l:'CEO Ratio'},{k:'medianPayF',l:'Median F ($)'},{k:'medianPayM',l:'Median M ($)'},{k:'livingWage',l:'Living Wage'},{k:'partTimeF',l:'PT Female %'},{k:'partTimeM',l:'PT Male %'}].map(c=>
                <th key={c.k} onClick={()=>togglePaySort(c.k)} style={{...thS,color:paySort===c.k?T.navy:T.textSec}}>{c.l}{paySort===c.k?(paySortDir==='asc'?' ^':' v'):''}</th>
              )}</tr></thead>
              <tbody>{payFiltered.slice(0,40).map(c=><tr key={c.id}>
                <td style={{...tdS,fontWeight:600}}>{c.name}</td>
                <td style={{...tdM,color:parseFloat(c.genderPayGap)>15?T.red:T.green}}>{c.genderPayGap}%</td>
                <td style={{...tdM,color:parseFloat(c.bonusGap)>15?T.red:T.green}}>{c.bonusGap}%</td>
                <td style={tdM}>{c.ceoPayRatio}:1</td><td style={tdM}>${c.medianPayF.toLocaleString()}</td><td style={tdM}>${c.medianPayM.toLocaleString()}</td>
                <td style={tdS}><Badge color={c.livingWage==='Yes'?'green':'red'}>{c.livingWage}</Badge></td>
                <td style={tdM}>{c.partTimeF}%</td><td style={tdM}>{c.partTimeM}%</td>
              </tr>)}</tbody>
            </table>
          </div>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:20}}>
          <div style={{background:T.surface,borderRadius:12,border:`1px solid ${T.border}`,padding:20}}>
            <div style={{fontSize:14,fontWeight:700,color:T.navy,marginBottom:12}}>Gender Pay Gap by Sector</div>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={sectorDei}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="sector" tick={{fontSize:9,fill:T.textSec}} angle={-25} textAnchor="end" height={50}/><YAxis tick={{fontSize:10,fill:T.textSec}}/><Tooltip {...tipS}/><Bar dataKey="avgPayGap" fill={T.red} radius={[4,4,0,0]} name="Avg Pay Gap %"/></BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{background:T.surface,borderRadius:12,border:`1px solid ${T.border}`,padding:20}}>
            <div style={{fontSize:14,fontWeight:700,color:T.navy,marginBottom:12}}>Pay Gap Trend (24M)</div>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={trendData}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="month" tick={{fontSize:10,fill:T.textSec}}/><YAxis tick={{fontSize:10,fill:T.textSec}}/><Tooltip {...tipS}/>
                <Line type="monotone" dataKey="avgPayGap" stroke={T.red} strokeWidth={2} dot={false} name="Avg Pay Gap %"/><Legend/>
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>)}

      {tab===2&&(<div>
        <div style={{display:'flex',gap:12,marginBottom:16,alignItems:'center'}}>
          <input value={boardSearch} onChange={e=>setBoardSearch(e.target.value)} placeholder="Search company..." style={{padding:'8px 14px',border:`1px solid ${T.border}`,borderRadius:8,fontSize:13,fontFamily:T.font,width:240,outline:'none',background:T.surface}}/>
          <button onClick={()=>exportCSV(boardFiltered,'board_diversity')} style={{padding:'8px 16px',background:T.navy,color:'#fff',border:'none',borderRadius:8,fontSize:12,fontWeight:600,cursor:'pointer'}}>Export CSV</button>
        </div>
        <div style={{background:T.surface,borderRadius:12,border:`1px solid ${T.border}`,overflow:'hidden',marginBottom:20}}>
          <div style={{maxHeight:400,overflowY:'auto'}}>
            <table style={{width:'100%',borderCollapse:'collapse'}}>
              <thead><tr>{[{k:'name',l:'Company'},{k:'boardSize',l:'Board Size'},{k:'femaleBoard',l:'Female Board %'},{k:'boardFemale',l:'Female #'},{k:'boardEthnic',l:'Ethnic #'},{k:'boardIndependent',l:'Independent #'},{k:'boardAvgAge',l:'Avg Age'},{k:'boardAvgTenure',l:'Avg Tenure'},{k:'successionPlan',l:'Succession'},{k:'deiCommittee',l:'DEI Comm'}].map(c=>
                <th key={c.k} onClick={()=>toggleBoardSort(c.k)} style={{...thS,color:boardSort===c.k?T.navy:T.textSec}}>{c.l}{boardSort===c.k?(boardSortDir==='asc'?' ^':' v'):''}</th>
              )}</tr></thead>
              <tbody>{boardFiltered.slice(0,40).map(c=><tr key={c.id}>
                <td style={{...tdS,fontWeight:600}}>{c.name}</td><td style={tdM}>{c.boardSize}</td>
                <td style={{...tdM,color:c.femaleBoard>=33?T.green:c.femaleBoard>=25?T.amber:T.red}}>{c.femaleBoard}%</td>
                <td style={tdM}>{c.boardFemale}</td><td style={tdM}>{c.boardEthnic}</td><td style={tdM}>{c.boardIndependent}</td>
                <td style={tdM}>{c.boardAvgAge}</td><td style={tdM}>{c.boardAvgTenure}y</td>
                <td style={tdS}><Badge color={c.successionPlan==='Yes'?'green':'red'}>{c.successionPlan}</Badge></td>
                <td style={tdS}><Badge color={c.deiCommittee==='Yes'?'green':'red'}>{c.deiCommittee}</Badge></td>
              </tr>)}</tbody>
            </table>
          </div>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:20}}>
          <div style={{background:T.surface,borderRadius:12,border:`1px solid ${T.border}`,padding:20}}>
            <div style={{fontSize:14,fontWeight:700,color:T.navy,marginBottom:12}}>Female Board Representation by Sector</div>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={sectorDei}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="sector" tick={{fontSize:9,fill:T.textSec}} angle={-25} textAnchor="end" height={50}/><YAxis domain={[0,50]} tick={{fontSize:10,fill:T.textSec}}/><Tooltip {...tipS}/><Bar dataKey="avgFemale" fill={T.gold} radius={[4,4,0,0]} name="Avg Female %"/></BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{background:T.surface,borderRadius:12,border:`1px solid ${T.border}`,padding:20}}>
            <div style={{fontSize:14,fontWeight:700,color:T.navy,marginBottom:12}}>Board Diversity Radar (Top 5 vs Bottom 5)</div>
            <ResponsiveContainer width="100%" height={260}>
              <RadarChart data={radarDims.map((d,i)=>({dim:d,top5:Math.round(60+sr(i*7)*30),bottom5:Math.round(15+sr(i*11)*25)}))}>
                <PolarGrid stroke={T.border}/><PolarAngleAxis dataKey="dim" tick={{fontSize:9,fill:T.textSec}}/><PolarRadiusAxis domain={[0,100]} tick={{fontSize:9}}/>
                <Radar dataKey="top5" stroke={T.green} fill={T.green} fillOpacity={0.2} name="Top 5"/><Radar dataKey="bottom5" stroke={T.red} fill={T.red} fillOpacity={0.2} name="Bottom 5"/><Legend/>
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>)}

      {tab===3&&(<div>
        <div style={{display:'flex',gap:12,marginBottom:16,alignItems:'center'}}>
          <select value={regFilter} onChange={e=>setRegFilter(e.target.value)} style={{padding:'8px 14px',border:`1px solid ${T.border}`,borderRadius:8,fontSize:13,fontFamily:T.font,background:T.surface}}>
            <option value="All">All Regulations</option><option value="EU">EU Pay Transparency Compliant</option><option value="Parker">Parker Review Met</option><option value="Hampton">Hampton-Alexander Met</option>
          </select>
          <button onClick={()=>exportCSV(regFiltered,'regulatory_compliance')} style={{padding:'8px 16px',background:T.navy,color:'#fff',border:'none',borderRadius:8,fontSize:12,fontWeight:600,cursor:'pointer'}}>Export CSV</button>
          <span style={{fontSize:11,color:T.textMut,marginLeft:'auto'}}>{regFiltered.length} companies</span>
        </div>
        <div style={{background:T.surface,borderRadius:12,border:`1px solid ${T.border}`,overflow:'hidden',marginBottom:20}}>
          <div style={{maxHeight:420,overflowY:'auto'}}>
            <table style={{width:'100%',borderCollapse:'collapse'}}>
              <thead><tr>{[{k:'name',l:'Company'},{k:'sector',l:'Sector'},{k:'country',l:'Country'},{k:'euPayTransparency',l:'EU Pay Trans 2026'},{k:'parkerReview',l:'Parker Review'},{k:'hamptonAlexander',l:'Hampton-Alexander'},{k:'deiReporting',l:'DEI Reporting'},{k:'deiScore',l:'DEI Score'}].map(c=>
                <th key={c.k} onClick={()=>toggleRegSort(c.k)} style={{...thS,color:regSort===c.k?T.navy:T.textSec}}>{c.l}{regSort===c.k?(regSortDir==='asc'?' ^':' v'):''}</th>
              )}</tr></thead>
              <tbody>{regFiltered.slice(0,50).map(c=><tr key={c.id}>
                <td style={{...tdS,fontWeight:600}}>{c.name}</td><td style={tdS}>{c.sector}</td><td style={tdS}>{c.country}</td>
                <td style={tdS}><Badge color={c.euPayTransparency==='Compliant'?'green':c.euPayTransparency==='Partial'?'amber':'red'}>{c.euPayTransparency}</Badge></td>
                <td style={tdS}><Badge color={c.parkerReview==='Met'?'green':c.parkerReview==='Partial'?'amber':'red'}>{c.parkerReview}</Badge></td>
                <td style={tdS}><Badge color={c.hamptonAlexander==='Met'?'green':c.hamptonAlexander==='Partial'?'amber':'red'}>{c.hamptonAlexander}</Badge></td>
                <td style={tdS}><Badge color={c.deiReporting==='Full'?'green':c.deiReporting==='Partial'?'amber':'red'}>{c.deiReporting}</Badge></td>
                <td style={tdM}>{c.deiScore}</td>
              </tr>)}</tbody>
            </table>
          </div>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:20}}>
          <div style={{background:T.surface,borderRadius:12,border:`1px solid ${T.border}`,padding:20}}>
            <div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:12}}>EU Pay Transparency</div>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart><Pie data={[{s:'Compliant',c:companies.filter(c=>c.euPayTransparency==='Compliant').length},{s:'Partial',c:companies.filter(c=>c.euPayTransparency==='Partial').length},{s:'Gap',c:companies.filter(c=>c.euPayTransparency==='Gap').length}]} dataKey="c" nameKey="s" cx="50%" cy="50%" outerRadius={70} label>
                {[T.green,T.amber,T.red].map((c,i)=><Cell key={i} fill={c}/>)}</Pie><Tooltip {...tipS}/></PieChart>
            </ResponsiveContainer>
          </div>
          <div style={{background:T.surface,borderRadius:12,border:`1px solid ${T.border}`,padding:20}}>
            <div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:12}}>Parker Review</div>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart><Pie data={[{s:'Met',c:companies.filter(c=>c.parkerReview==='Met').length},{s:'Partial',c:companies.filter(c=>c.parkerReview==='Partial').length},{s:'Not Met',c:companies.filter(c=>c.parkerReview==='Not Met').length}]} dataKey="c" nameKey="s" cx="50%" cy="50%" outerRadius={70} label>
                {[T.green,T.amber,T.red].map((c,i)=><Cell key={i} fill={c}/>)}</Pie><Tooltip {...tipS}/></PieChart>
            </ResponsiveContainer>
          </div>
          <div style={{background:T.surface,borderRadius:12,border:`1px solid ${T.border}`,padding:20}}>
            <div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:12}}>Hampton-Alexander</div>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart><Pie data={[{s:'Met',c:companies.filter(c=>c.hamptonAlexander==='Met').length},{s:'Partial',c:companies.filter(c=>c.hamptonAlexander==='Partial').length},{s:'Not Met',c:companies.filter(c=>c.hamptonAlexander==='Not Met').length}]} dataKey="c" nameKey="s" cx="50%" cy="50%" outerRadius={70} label>
                {[T.green,T.amber,T.red].map((c,i)=><Cell key={i} fill={c}/>)}</Pie><Tooltip {...tipS}/></PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>)}

      {showPanel&&panelData&&<div style={{position:'fixed',top:0,right:0,width:500,height:'100vh',background:T.surface,borderLeft:`2px solid ${T.border}`,boxShadow:'-4px 0 24px rgba(0,0,0,0.08)',zIndex:1000,overflowY:'auto',padding:24}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
          <h2 style={{fontSize:18,fontWeight:800,color:T.navy,margin:0}}>{panelData.name}</h2>
          <button onClick={()=>setShowPanel(false)} style={{background:'none',border:'none',fontSize:20,cursor:'pointer',color:T.textMut}}>x</button>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:16}}>
          {[{l:'Sector',v:panelData.sector},{l:'Country',v:panelData.country},{l:'Employees',v:panelData.employees.toLocaleString()},{l:'DEI Score',v:`${panelData.deiScore}/100`},{l:'Female Total',v:`${panelData.femaleTotal}%`},{l:'Female Senior',v:`${panelData.femaleSenior}%`},{l:'Female Board',v:`${panelData.femaleBoard}%`},{l:'Ethnic Minority',v:`${panelData.ethnicMinority}%`},{l:'LGBTQ+',v:`${panelData.lgbtq}%`},{l:'Disability',v:`${panelData.disability}%`},{l:'Gender Pay Gap',v:`${panelData.genderPayGap}%`},{l:'Bonus Gap',v:`${panelData.bonusGap}%`},{l:'CEO Pay Ratio',v:`${panelData.ceoPayRatio}:1`},{l:'Living Wage',v:panelData.livingWage},{l:'Board Size',v:panelData.boardSize},{l:'Succession Plan',v:panelData.successionPlan}].map((d,i)=><div key={i}><div style={{fontSize:10,color:T.textMut}}>{d.l}</div><div style={{fontWeight:700}}>{d.v}</div></div>)}
        </div>
        <div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:8}}>Regulatory Status</div>
        <div style={{display:'grid',gap:8}}>
          {[{l:'EU Pay Transparency 2026',v:panelData.euPayTransparency},{l:'Parker Review',v:panelData.parkerReview},{l:'Hampton-Alexander',v:panelData.hamptonAlexander},{l:'DEI Reporting',v:panelData.deiReporting}].map((r,i)=><div key={i} style={{display:'flex',justifyContent:'space-between',padding:'6px 0',borderBottom:`1px solid ${T.border}`,fontSize:12}}>
            <span>{r.l}</span><Badge color={r.v==='Compliant'||r.v==='Met'||r.v==='Full'?'green':r.v==='Partial'?'amber':'red'}>{r.v}</Badge>
          </div>)}
        </div>
        <div style={{marginTop:16,fontSize:13,fontWeight:700,color:T.navy,marginBottom:8}}>DEI Radar</div>
        <ResponsiveContainer width="100%" height={220}>
          <RadarChart data={[{dim:'Female %',v:panelData.femaleTotal},{dim:'Senior F %',v:panelData.femaleSenior},{dim:'Board F %',v:panelData.femaleBoard},{dim:'Ethnic %',v:panelData.ethnicMinority},{dim:'Pay Equity',v:Math.round(100-parseFloat(panelData.genderPayGap))},{dim:'DEI Score',v:panelData.deiScore}]}>
            <PolarGrid stroke={T.border}/><PolarAngleAxis dataKey="dim" tick={{fontSize:9}}/><PolarRadiusAxis domain={[0,100]} tick={{fontSize:8}}/>
            <Radar dataKey="v" stroke={T.sage} fill={T.sage} fillOpacity={0.3}/>
          </RadarChart>
        </ResponsiveContainer>
      </div>}
    </div>
  </div>);
}
