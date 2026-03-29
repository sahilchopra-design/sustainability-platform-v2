import React,{useState,useMemo} from 'react';
import {BarChart,Bar,LineChart,Line,AreaChart,Area,ScatterChart,Scatter,PieChart,Pie,Cell,XAxis,YAxis,CartesianGrid,Tooltip,ResponsiveContainer,Legend,RadarChart,Radar,PolarGrid,PolarAngleAxis,PolarRadiusAxis} from 'recharts';

const T={bg:'#f6f4f0',surface:'#ffffff',surfaceH:'#f0ede7',border:'#e5e0d8',borderL:'#d5cfc5',navy:'#1b3a5c',navyL:'#2c5a8c',gold:'#c5a96a',goldL:'#d4be8a',sage:'#5a8a6a',sageL:'#7ba67d',teal:'#5a8a6a',text:'#1b3a5c',textSec:'#5c6b7e',textMut:'#9aa3ae',red:'#dc2626',green:'#16a34a',amber:'#d97706',font:"'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"};
const sr=(s)=>{let x=Math.sin(s+1)*10000;return x-Math.floor(x);};
const tip={contentStyle:{background:T.surface,border:`1px solid ${T.border}`,borderRadius:8,color:T.text,fontFamily:T.font},labelStyle:{color:T.textSec}};
const COLORS=[T.navy,T.gold,T.sage,T.red,T.amber,T.green,T.navyL,T.goldL,'#8b5cf6','#ec4899'];
const fmt=v=>typeof v==='number'?v>=1e6?(v/1e6).toFixed(1)+'M':v>=1e3?(v/1e3).toFixed(1)+'K':v.toFixed(1):v;
const TABS=['Board Overview','Diversity Analytics','Skills & Independence','Governance Scores'];
const PAGE_SIZE=12;
const SECTORS=['All','Technology','Financial Services','Healthcare','Energy','Consumer','Industrial','Telecom','Materials','Real Estate','Utilities'];

const COMPANIES=Array.from({length:80},(_,i)=>{
  const names=['Apple','Microsoft','Amazon','Alphabet','Meta','Tesla','NVIDIA','JPMorgan','Berkshire','UnitedHealth','Johnson & Johnson','Visa','Procter & Gamble','Mastercard','Chevron','Eli Lilly','AbbVie','Pfizer','Merck','Costco','PepsiCo','Coca-Cola','Broadcom','Cisco','Netflix','AMD','Intel','Qualcomm','Honeywell','Goldman Sachs','Morgan Stanley','Citigroup','Wells Fargo','Bank of America','Caterpillar','3M','IBM','Salesforce','Oracle','Adobe','Accenture','PayPal','Intuit','ServiceNow','Snowflake','Palantir','Uber','Airbnb','DoorDash','Coinbase','Block','Rivian','Lucid','Zoom','Shopify','Spotify','Roblox','Unity','Datadog','CrowdStrike','Fortinet','Palo Alto','Zscaler','Okta','MongoDB','Confluent','Elastic','HashiCorp','Twilio','HubSpot','Atlassian','Workday','Veeva','Splunk','Dynatrace','New Relic','Fastly','Cloudflare','Akamai','F5 Networks'];
  const sects=['Technology','Technology','Technology','Technology','Technology','Technology','Technology','Financial Services','Financial Services','Healthcare','Healthcare','Financial Services','Consumer','Financial Services','Energy','Healthcare','Healthcare','Healthcare','Healthcare','Consumer','Consumer','Consumer','Technology','Technology','Technology','Technology','Technology','Technology','Industrial','Financial Services','Financial Services','Financial Services','Financial Services','Financial Services','Industrial','Industrial','Technology','Technology','Technology','Technology','Technology','Financial Services','Technology','Technology','Technology','Technology','Technology','Technology','Technology','Financial Services','Financial Services','Technology','Technology','Technology','Technology','Technology','Technology','Technology','Technology','Technology','Technology','Technology','Technology','Technology','Technology','Technology','Technology','Technology','Technology','Technology','Technology','Technology','Technology','Technology','Technology','Technology','Technology','Technology','Technology','Technology'];
  return{
    id:i+1,company:names[i],sector:sects[i],
    boardSize:Math.round(sr(i*7)*6+7),
    womenPct:+(sr(i*11)*35+15).toFixed(1),
    independentPct:+(sr(i*13)*30+55).toFixed(1),
    avgTenure:+(sr(i*17)*8+2).toFixed(1),
    avgAge:+(sr(i*19)*15+52).toFixed(0),
    ethnicDiversityPct:+(sr(i*23)*25+10).toFixed(1),
    skillsCoverage:+(sr(i*29)*25+70).toFixed(0),
    esgExpertise:sr(i*31)>0.4?'Yes':'No',
    cyberExpertise:sr(i*37)>0.6?'Yes':'No',
    ceoChairSplit:sr(i*41)>0.5?'Yes':'No',
    leadIndependent:sr(i*43)>0.4?'Yes':'No',
    boardRefreshRate:+(sr(i*47)*15+5).toFixed(1),
    overboardingRisk:sr(i*53)>0.7?'High':sr(i*53)>0.4?'Medium':'Low',
    govScore:+(sr(i*59)*30+60).toFixed(0),
    issRating:['1','2','3','4','5'][Math.floor(sr(i*61)*5)],
    meetingsPerYear:Math.round(sr(i*67)*8+6),
    attendanceRate:+(sr(i*71)*8+90).toFixed(1),
    committeesCount:Math.round(sr(i*73)*3+3),
    executiveSessionsPerYear:Math.round(sr(i*79)*6+2),
  };
});

const TRENDS=Array.from({length:10},(_,i)=>({year:2015+i,womenPct:+(22+i*2.8+sr(i*83)*3).toFixed(1),independentPct:+(62+i*1.5+sr(i*89)*2).toFixed(1),avgTenure:+(8.5-i*0.3+sr(i*97)*1).toFixed(1),avgAge:+(63-i*0.4+sr(i*101)*1).toFixed(1),ethnicPct:+(12+i*2.2+sr(i*103)*2).toFixed(1)}));

const SKILLS_MATRIX=[
  {skill:'Finance/Accounting',coverage:92,trend:'Stable'},
  {skill:'Industry Expertise',coverage:88,trend:'Stable'},
  {skill:'Risk Management',coverage:85,trend:'Improving'},
  {skill:'Technology/Digital',coverage:72,trend:'Improving'},
  {skill:'ESG/Sustainability',coverage:58,trend:'Improving'},
  {skill:'Cybersecurity',coverage:42,trend:'Improving'},
  {skill:'AI/Machine Learning',coverage:28,trend:'Improving'},
  {skill:'International',coverage:78,trend:'Stable'},
  {skill:'Legal/Regulatory',coverage:82,trend:'Stable'},
  {skill:'HR/Talent',coverage:65,trend:'Improving'},
  {skill:'Marketing/Brand',coverage:55,trend:'Stable'},
  {skill:'Operations',coverage:75,trend:'Stable'},
];

export default function BoardCompositionPage(){
  const[tab,setTab]=useState(0);
  const[search,setSearch]=useState('');
  const[sortCol,setSortCol]=useState('govScore');
  const[sortDir,setSortDir]=useState('desc');
  const[page,setPage]=useState(0);
  const[selected,setSelected]=useState(null);
  const[sectorFilter,setSectorFilter]=useState('All');
  const[minWomen,setMinWomen]=useState(0);
  const[splitOnly,setSplitOnly]=useState(false);

  const doSort=(d,c,dir)=>[...d].sort((a,b)=>dir==='asc'?(a[c]>b[c]?1:-1):(a[c]<b[c]?1:-1));
  const toggle=(col,cur,setC,dir,setD)=>{if(cur===col)setD(dir==='asc'?'desc':'asc');else{setC(col);setD('desc');}};
  const SH=({label,col,cc,dir,onClick})=>(<th onClick={()=>onClick(col)} style={{padding:'10px 12px',textAlign:'left',cursor:'pointer',fontSize:11,fontFamily:T.mono,color:T.textSec,textTransform:'uppercase',letterSpacing:0.5,borderBottom:`2px solid ${T.border}`,whiteSpace:'nowrap',userSelect:'none',background:T.surfaceH}}>{label}{cc===col?(dir==='asc'?' \u25B2':' \u25BC'):''}</th>);
  const kpi=(l,v,s)=>(<div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:'16px 20px',flex:1,minWidth:170}}><div style={{fontSize:11,color:T.textMut,fontFamily:T.mono,textTransform:'uppercase',letterSpacing:1}}>{l}</div><div style={{fontSize:26,fontWeight:700,color:T.navy,marginTop:4}}>{v}</div>{s&&<div style={{fontSize:12,color:T.textSec,marginTop:2}}>{s}</div>}</div>);
  const csv=(data,fn)=>{const h=Object.keys(data[0]);const c=[h.join(','),...data.map(r=>h.map(k=>JSON.stringify(r[k]??'')).join(','))].join('\n');const b=new Blob([c],{type:'text/csv'});const u=URL.createObjectURL(b);const a=document.createElement('a');a.href=u;a.download=fn;a.click();URL.revokeObjectURL(u);};

  const filtered=useMemo(()=>{
    let d=COMPANIES.filter(c=>c.company.toLowerCase().includes(search.toLowerCase()));
    if(sectorFilter!=='All')d=d.filter(c=>c.sector===sectorFilter);
    d=d.filter(c=>c.womenPct>=minWomen);
    if(splitOnly)d=d.filter(c=>c.ceoChairSplit==='Yes');
    return doSort(d,sortCol,sortDir);
  },[search,sectorFilter,minWomen,splitOnly,sortCol,sortDir]);
  const paged=filtered.slice(page*PAGE_SIZE,(page+1)*PAGE_SIZE);
  const tp=Math.ceil(filtered.length/PAGE_SIZE);

  const sectorDiv=useMemo(()=>{
    const m={};COMPANIES.forEach(c=>{if(!m[c.sector])m[c.sector]={sector:c.sector,women:0,indep:0,n:0};m[c.sector].women+=c.womenPct;m[c.sector].indep+=c.independentPct;m[c.sector].n++;});
    return Object.values(m).map(s=>({sector:s.sector,women:+(s.women/s.n).toFixed(1),independent:+(s.indep/s.n).toFixed(1)}));
  },[]);

  const renderOverview=()=>(
    <div>
      <div style={{display:'flex',gap:12,marginBottom:20,flexWrap:'wrap'}}>
        {kpi('Companies',filtered.length)}
        {kpi('Avg Women %',(filtered.reduce((a,c)=>a+c.womenPct,0)/filtered.length||0).toFixed(1)+'%')}
        {kpi('Avg Independence',(filtered.reduce((a,c)=>a+c.independentPct,0)/filtered.length||0).toFixed(1)+'%')}
        {kpi('Avg Gov Score',(filtered.reduce((a,c)=>a+parseFloat(c.govScore),0)/filtered.length||0).toFixed(0)+'/100')}
        {kpi('CEO/Chair Split',filtered.filter(c=>c.ceoChairSplit==='Yes').length+'/'+filtered.length)}
      </div>
      <div style={{display:'flex',gap:12,marginBottom:16,flexWrap:'wrap',alignItems:'center'}}>
        <input value={search} onChange={e=>{setSearch(e.target.value);setPage(0);}} placeholder="Search companies..." style={{padding:'8px 14px',border:`1px solid ${T.border}`,borderRadius:8,fontFamily:T.font,fontSize:13,background:T.surface,color:T.text,width:220}}/>
        <select value={sectorFilter} onChange={e=>{setSectorFilter(e.target.value);setPage(0);}} style={{padding:'8px 12px',border:`1px solid ${T.border}`,borderRadius:8,fontFamily:T.font,fontSize:13,background:T.surface}}>{SECTORS.map(s=><option key={s}>{s}</option>)}</select>
        <label style={{fontSize:13,color:T.textSec,display:'flex',alignItems:'center',gap:6}}><input type="checkbox" checked={splitOnly} onChange={e=>setSplitOnly(e.target.checked)}/>CEO/Chair split only</label>
        <div style={{fontSize:12,color:T.textSec,display:'flex',alignItems:'center',gap:8}}>Min women: {minWomen}%<input type="range" min={0} max={50} value={minWomen} onChange={e=>setMinWomen(+e.target.value)} style={{width:100}}/></div>
        <button onClick={()=>csv(filtered,'board_composition.csv')} style={{marginLeft:'auto',padding:'8px 16px',background:T.navy,color:'#fff',border:'none',borderRadius:8,fontFamily:T.mono,fontSize:12,cursor:'pointer'}}>Export CSV</button>
      </div>
      <div style={{overflowX:'auto',border:`1px solid ${T.border}`,borderRadius:10,background:T.surface}}>
        <table style={{width:'100%',borderCollapse:'collapse',fontFamily:T.font,fontSize:13}}>
          <thead><tr>
            {[['Company','company'],['Sector','sector'],['Size','boardSize'],['Women %','womenPct'],['Indep %','independentPct'],['Tenure','avgTenure'],['Gov Score','govScore'],['ISS','issRating'],['Split','ceoChairSplit']].map(([l,c])=><SH key={c} label={l} col={c} cc={sortCol} dir={sortDir} onClick={c2=>toggle(c2,sortCol,setSortCol,sortDir,setSortDir)}/>)}
          </tr></thead>
          <tbody>
            {paged.map((c,i)=>(
              <React.Fragment key={c.id}>
                <tr onClick={()=>setSelected(selected===c.id?null:c.id)} style={{cursor:'pointer',background:selected===c.id?T.surfaceH:i%2===0?T.surface:'#fafaf8'}}>
                  <td style={{padding:'10px 12px',fontWeight:600,color:T.navy}}>{c.company}</td>
                  <td style={{padding:'10px 12px',color:T.textSec,fontSize:12}}>{c.sector}</td>
                  <td style={{padding:'10px 12px',fontFamily:T.mono}}>{c.boardSize}</td>
                  <td style={{padding:'10px 12px',fontFamily:T.mono,color:c.womenPct>=30?T.green:c.womenPct>=20?T.amber:T.red}}>{c.womenPct}%</td>
                  <td style={{padding:'10px 12px',fontFamily:T.mono}}>{c.independentPct}%</td>
                  <td style={{padding:'10px 12px',fontFamily:T.mono}}>{c.avgTenure}y</td>
                  <td style={{padding:'10px 12px',fontFamily:T.mono,fontWeight:600}}>{c.govScore}</td>
                  <td style={{padding:'10px 12px',fontFamily:T.mono}}>{c.issRating}</td>
                  <td style={{padding:'10px 12px'}}><span style={{color:c.ceoChairSplit==='Yes'?T.green:T.red}}>{c.ceoChairSplit}</span></td>
                </tr>
                {selected===c.id&&(
                  <tr><td colSpan={9} style={{padding:20,background:T.surfaceH,borderTop:`1px solid ${T.border}`}}>
                    <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:12}}>
                      <div><span style={{fontSize:11,color:T.textMut,fontFamily:T.mono}}>Avg Age</span><div style={{fontSize:16,fontWeight:700,color:T.navy}}>{c.avgAge}</div></div>
                      <div><span style={{fontSize:11,color:T.textMut,fontFamily:T.mono}}>Ethnic Div %</span><div style={{fontSize:16,fontWeight:700,color:T.navy}}>{c.ethnicDiversityPct}%</div></div>
                      <div><span style={{fontSize:11,color:T.textMut,fontFamily:T.mono}}>Skills Coverage</span><div style={{fontSize:16,fontWeight:700,color:T.navy}}>{c.skillsCoverage}%</div></div>
                      <div><span style={{fontSize:11,color:T.textMut,fontFamily:T.mono}}>ESG Expert</span><div style={{fontSize:16,fontWeight:700,color:c.esgExpertise==='Yes'?T.green:T.red}}>{c.esgExpertise}</div></div>
                      <div><span style={{fontSize:11,color:T.textMut,fontFamily:T.mono}}>Cyber Expert</span><div style={{fontSize:16,fontWeight:700,color:c.cyberExpertise==='Yes'?T.green:T.red}}>{c.cyberExpertise}</div></div>
                      <div><span style={{fontSize:11,color:T.textMut,fontFamily:T.mono}}>Lead Indep</span><div style={{fontSize:16,fontWeight:700}}>{c.leadIndependent}</div></div>
                      <div><span style={{fontSize:11,color:T.textMut,fontFamily:T.mono}}>Refresh Rate</span><div style={{fontSize:16,fontWeight:700,color:T.navy}}>{c.boardRefreshRate}%</div></div>
                      <div><span style={{fontSize:11,color:T.textMut,fontFamily:T.mono}}>Overboarding</span><div style={{fontSize:16,fontWeight:700,color:c.overboardingRisk==='High'?T.red:c.overboardingRisk==='Medium'?T.amber:T.green}}>{c.overboardingRisk}</div></div>
                      <div><span style={{fontSize:11,color:T.textMut,fontFamily:T.mono}}>Meetings/yr</span><div style={{fontSize:16,fontWeight:700,color:T.navy}}>{c.meetingsPerYear}</div></div>
                      <div><span style={{fontSize:11,color:T.textMut,fontFamily:T.mono}}>Attendance</span><div style={{fontSize:16,fontWeight:700,color:T.navy}}>{c.attendanceRate}%</div></div>
                    </div>
                  </td></tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{display:'flex',justifyContent:'space-between',marginTop:12}}>
        <span style={{fontSize:12,color:T.textMut}}>{filtered.length} companies</span>
        <div style={{display:'flex',gap:6}}>
          <button disabled={page===0} onClick={()=>setPage(page-1)} style={{padding:'6px 12px',border:`1px solid ${T.border}`,borderRadius:6,background:T.surface,fontFamily:T.mono,fontSize:12,cursor:page===0?'default':'pointer',opacity:page===0?0.4:1}}>Prev</button>
          <span style={{padding:'6px 12px',fontSize:12,color:T.textSec}}>{page+1}/{tp||1}</span>
          <button disabled={page>=tp-1} onClick={()=>setPage(page+1)} style={{padding:'6px 12px',border:`1px solid ${T.border}`,borderRadius:6,background:T.surface,fontFamily:T.mono,fontSize:12,cursor:page>=tp-1?'default':'pointer',opacity:page>=tp-1?0.4:1}}>Next</button>
        </div>
      </div>
    </div>
  );

  const renderDiversity=()=>(
    <div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:20}}>
        <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:16}}>
          <div style={{fontSize:13,fontWeight:600,color:T.navy,marginBottom:12}}>Women on Boards Trend (S&P 500 Avg)</div>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={TRENDS}><CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/><XAxis dataKey="year" tick={{fontSize:10,fill:T.textSec}}/><YAxis tick={{fontSize:10,fill:T.textSec}}/><Tooltip {...tip}/><Area type="monotone" dataKey="womenPct" stroke={T.navy} fill={T.navy} fillOpacity={0.15} name="Women %"/><Area type="monotone" dataKey="ethnicPct" stroke={T.gold} fill={T.gold} fillOpacity={0.15} name="Ethnic %"/><Legend/></AreaChart>
          </ResponsiveContainer>
        </div>
        <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:16}}>
          <div style={{fontSize:13,fontWeight:600,color:T.navy,marginBottom:12}}>Diversity by Sector</div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={sectorDiv}><CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/><XAxis dataKey="sector" tick={{fontSize:9,fill:T.textSec}} angle={-45} textAnchor="end" height={100}/><YAxis tick={{fontSize:10,fill:T.textSec}}/><Tooltip {...tip}/><Bar dataKey="women" fill={T.navy} name="Women %"/><Bar dataKey="independent" fill={T.gold} name="Independent %"/><Legend/></BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
        <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:16}}>
          <div style={{fontSize:13,fontWeight:600,color:T.navy,marginBottom:12}}>Women % vs Gov Score</div>
          <ResponsiveContainer width="100%" height={280}>
            <ScatterChart><CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/><XAxis dataKey="womenPct" name="Women %" tick={{fontSize:10,fill:T.textSec}}/><YAxis dataKey="govScore" name="Gov Score" tick={{fontSize:10,fill:T.textSec}}/><Tooltip {...tip}/><Scatter data={filtered} fill={T.sage} fillOpacity={0.6}/></ScatterChart>
          </ResponsiveContainer>
        </div>
        <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:16}}>
          <div style={{fontSize:13,fontWeight:600,color:T.navy,marginBottom:12}}>Gender Distribution</div>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart><Pie data={[{name:'Women',value:+(filtered.reduce((a,c)=>a+c.womenPct,0)/filtered.length).toFixed(1)},{name:'Men',value:+(100-filtered.reduce((a,c)=>a+c.womenPct,0)/filtered.length).toFixed(1)}]} cx="50%" cy="50%" outerRadius={100} dataKey="value" label={({name,value})=>`${name}: ${value}%`}><Cell fill={T.navy}/><Cell fill={T.gold}/></Pie><Tooltip {...tip}/></PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );

  const renderSkills=()=>(
    <div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:20}}>
        <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:16}}>
          <div style={{fontSize:13,fontWeight:600,color:T.navy,marginBottom:12}}>Board Skills Radar</div>
          <ResponsiveContainer width="100%" height={350}>
            <RadarChart data={SKILLS_MATRIX}><PolarGrid stroke={T.borderL}/><PolarAngleAxis dataKey="skill" tick={{fontSize:9,fill:T.textSec}}/><PolarRadiusAxis tick={{fontSize:9,fill:T.textMut}}/><Radar dataKey="coverage" stroke={T.navy} fill={T.navy} fillOpacity={0.2}/></RadarChart>
          </ResponsiveContainer>
        </div>
        <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:16}}>
          <div style={{fontSize:13,fontWeight:600,color:T.navy,marginBottom:12}}>Skills Coverage by Area</div>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={SKILLS_MATRIX} layout="vertical" margin={{left:120}}><CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/><XAxis type="number" domain={[0,100]} tick={{fontSize:10,fill:T.textSec}}/><YAxis type="category" dataKey="skill" tick={{fontSize:10,fill:T.textSec}}/><Tooltip {...tip}/><Bar dataKey="coverage">{SKILLS_MATRIX.map((s,i)=><Cell key={i} fill={s.coverage>=80?T.green:s.coverage>=60?T.amber:T.red}/>)}</Bar></BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div style={{overflowX:'auto',border:`1px solid ${T.border}`,borderRadius:10,background:T.surface}}>
        <table style={{width:'100%',borderCollapse:'collapse',fontFamily:T.font,fontSize:13}}>
          <thead><tr>{['Skill Area','Coverage %','Trend','Status'].map(h=><th key={h} style={{padding:'10px 12px',textAlign:'left',fontSize:11,fontFamily:T.mono,color:T.textSec,textTransform:'uppercase',borderBottom:`2px solid ${T.border}`,background:T.surfaceH}}>{h}</th>)}</tr></thead>
          <tbody>{SKILLS_MATRIX.map((s,i)=>(
            <tr key={s.skill} style={{background:i%2===0?T.surface:'#fafaf8'}}>
              <td style={{padding:'10px 12px',fontWeight:600,color:T.navy}}>{s.skill}</td>
              <td style={{padding:'10px 12px',fontFamily:T.mono}}><div style={{display:'flex',alignItems:'center',gap:8}}><div style={{width:100,height:8,background:T.surfaceH,borderRadius:4}}><div style={{width:`${s.coverage}%`,height:8,background:s.coverage>=80?T.green:s.coverage>=60?T.gold:T.red,borderRadius:4}}/></div>{s.coverage}%</div></td>
              <td style={{padding:'10px 12px',color:s.trend==='Improving'?T.green:T.textSec}}>{s.trend}</td>
              <td style={{padding:'10px 12px'}}><span style={{padding:'2px 8px',borderRadius:10,fontSize:11,fontWeight:600,background:s.coverage>=80?'#dcfce7':s.coverage>=60?'#fef9c3':'#fef2f2',color:s.coverage>=80?T.green:s.coverage>=60?T.amber:T.red}}>{s.coverage>=80?'Strong':s.coverage>=60?'Adequate':'Gap'}</span></td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </div>
  );

  const renderGovScores=()=>(
    <div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:20}}>
        <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:16}}>
          <div style={{fontSize:13,fontWeight:600,color:T.navy,marginBottom:12}}>Governance Score Distribution</div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={[{range:'90-100',count:filtered.filter(c=>c.govScore>=90).length},{range:'80-89',count:filtered.filter(c=>c.govScore>=80&&c.govScore<90).length},{range:'70-79',count:filtered.filter(c=>c.govScore>=70&&c.govScore<80).length},{range:'60-69',count:filtered.filter(c=>c.govScore>=60&&c.govScore<70).length},{range:'<60',count:filtered.filter(c=>c.govScore<60).length}]}><CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/><XAxis dataKey="range" tick={{fontSize:10,fill:T.textSec}}/><YAxis tick={{fontSize:10,fill:T.textSec}}/><Tooltip {...tip}/><Bar dataKey="count" fill={T.navy} name="Companies"/></BarChart>
          </ResponsiveContainer>
        </div>
        <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:16}}>
          <div style={{fontSize:13,fontWeight:600,color:T.navy,marginBottom:12}}>Independence vs Tenure Trend</div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={TRENDS}><CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/><XAxis dataKey="year" tick={{fontSize:10,fill:T.textSec}}/><YAxis tick={{fontSize:10,fill:T.textSec}}/><Tooltip {...tip}/><Line type="monotone" dataKey="independentPct" stroke={T.navy} strokeWidth={2} name="Independent %"/><Line type="monotone" dataKey="avgTenure" stroke={T.gold} strokeWidth={2} name="Avg Tenure"/><Legend/></LineChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:16}}>
        <div style={{fontSize:13,fontWeight:600,color:T.navy,marginBottom:12}}>ISS Rating Distribution</div>
        <ResponsiveContainer width="100%" height={250}>
          <PieChart><Pie data={['1','2','3','4','5'].map(r=>({name:`ISS ${r}`,value:filtered.filter(c=>c.issRating===r).length}))} cx="50%" cy="50%" outerRadius={90} dataKey="value" label={({name,value})=>`${name}: ${value}`} style={{fontSize:10}}>{['1','2','3','4','5'].map((_,i)=><Cell key={i} fill={COLORS[i]}/>)}</Pie><Tooltip {...tip}/></PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );

  return(
    <div style={{fontFamily:T.font,background:T.bg,minHeight:'100vh',padding:'24px 32px',color:T.text}}>
      <div style={{marginBottom:24}}>
        <div style={{fontSize:11,fontFamily:T.mono,color:T.textMut,letterSpacing:1,textTransform:'uppercase'}}>Corporate Governance Intelligence</div>
        <h1 style={{fontSize:28,fontWeight:700,color:T.navy,margin:'4px 0 0'}}>Board Composition & Governance</h1>
      </div>
      <div style={{display:'flex',gap:4,marginBottom:24,borderBottom:`2px solid ${T.border}`}}>
        {TABS.map((t,i)=><button key={t} onClick={()=>setTab(i)} style={{padding:'10px 20px',border:'none',borderBottom:tab===i?`2px solid ${T.gold}`:'2px solid transparent',background:tab===i?T.surface:'transparent',color:tab===i?T.navy:T.textSec,fontFamily:T.font,fontSize:13,fontWeight:tab===i?600:400,cursor:'pointer',marginBottom:-2}}>{t}</button>)}
      </div>
      {tab===0&&renderOverview()}
      {tab===1&&renderDiversity()}
      {tab===2&&renderSkills()}
      {tab===3&&renderGovScores()}
    </div>
  );
}