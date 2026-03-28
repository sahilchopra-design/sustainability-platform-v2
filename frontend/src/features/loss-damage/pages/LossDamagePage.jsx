import React,{useState,useMemo} from 'react';
import {BarChart,Bar,XAxis,YAxis,CartesianGrid,Tooltip,ResponsiveContainer,AreaChart,Area,Cell,Legend,PieChart,Pie} from 'recharts';

const T={bg:'#f6f4f0',surface:'#ffffff',surfaceH:'#f0ede7',border:'#e5e0d8',borderL:'#d5cfc5',navy:'#1b3a5c',navyL:'#2c5a8c',gold:'#c5a96a',goldL:'#d4be8a',sage:'#5a8a6a',sageL:'#7ba67d',teal:'#5a8a6a',text:'#1b3a5c',textSec:'#5c6b7e',textMut:'#9aa3ae',red:'#dc2626',green:'#16a34a',amber:'#d97706',font:"'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"};
const sr=(s)=>{let x=Math.sin(s+1)*10000;return x-Math.floor(x);};
const TABS=['L&D Fund Tracker','Climate Loss Quantification','Vulnerability Assessment','Financing Gap Analysis'];
const REGIONS=['Africa','South Asia','Southeast Asia','Pacific Islands','Caribbean','Central America','South America','Middle East'];
const HAZARDS=['Tropical Cyclone','Flooding','Drought','Heatwave','Sea Level Rise','Wildfire','Glacial Melt','Coastal Erosion'];
const PIE_C=[T.navy,T.gold,T.sage,T.red,T.amber,'#7c3aed','#0284c7','#db2777'];

const COUNTRIES=Array.from({length:40},(_,i)=>{
  const names=['Pakistan','Bangladesh','Ethiopia','Nigeria','Mozambique','Philippines','Indonesia','Vietnam','India','Nepal','Fiji','Tuvalu','Vanuatu','Maldives','Solomon Islands','Barbados','Jamaica','Honduras','Haiti','Malawi','Zambia','Zimbabwe','Sudan','Somalia','Senegal','Ghana','Tanzania','Kenya','Peru','Bolivia','Myanmar','Cambodia','Laos','Madagascar','Sri Lanka','Afghanistan','Yemen','Chad','Niger','Mali'];
  const region=REGIONS[i%8];
  const ndGain=Math.round(25+sr(i*7)*45);
  const climVulnIdx=Math.round(100-ndGain+sr(i*11)*15);
  const annualLoss=Math.round(100+sr(i*13)*4900);
  const gdpPct=Math.round(sr(i*17)*120)/10;
  const deaths=Math.round(50+sr(i*19)*2000);
  const displaced=Math.round(10+sr(i*23)*500);
  const infraDamage=Math.round(50+sr(i*29)*3000);
  const agriLoss=Math.round(20+sr(i*31)*1500);
  const needsEstimate=Math.round(annualLoss*1.5+sr(i*37)*2000);
  const committed=Math.round(needsEstimate*sr(i*41)*0.4);
  const disbursed=Math.round(committed*sr(i*43)*0.6);
  const adaptationGap=needsEstimate-committed;
  return{id:i,name:names[i],region,ndGain,climVulnIdx,annualLoss,gdpPct,deaths,displaced,infraDamage,agriLoss,needsEstimate,committed,disbursed,adaptationGap,
    primaryHazard:HAZARDS[Math.floor(sr(i*47)*8)],
    lossHistory:Array.from({length:8},(_,y)=>({year:2018+y,loss:Math.round(annualLoss*0.6+sr(i*100+y*7)*annualLoss*0.8),events:Math.round(2+sr(i*100+y*11)*8)})),
    hazardBreakdown:HAZARDS.slice(0,5).map((h,hi)=>({hazard:h,loss:Math.round(annualLoss*0.05+sr(i*60+hi*13)*annualLoss*0.3),frequency:Math.round(1+sr(i*60+hi*17)*6)}))
  };
});

const FUND_COMMITMENTS=[
  {donor:'Germany',pledged:100,disbursed:45,year:2024},{donor:'UAE',pledged:100,disbursed:30,year:2024},{donor:'Japan',pledged:75,disbursed:20,year:2024},
  {donor:'France',pledged:60,disbursed:25,year:2024},{donor:'Italy',pledged:50,disbursed:15,year:2024},{donor:'UK',pledged:80,disbursed:35,year:2024},
  {donor:'EU',pledged:245,disbursed:80,year:2024},{donor:'USA',pledged:17.5,disbursed:5,year:2024},{donor:'Canada',pledged:40,disbursed:12,year:2024},
  {donor:'Denmark',pledged:50,disbursed:30,year:2023},{donor:'Austria',pledged:25,disbursed:10,year:2024},{donor:'Ireland',pledged:30,disbursed:18,year:2024},
  {donor:'Norway',pledged:45,disbursed:22,year:2024},{donor:'Spain',pledged:20,disbursed:5,year:2025},{donor:'Netherlands',pledged:35,disbursed:15,year:2024},
  {donor:'Belgium',pledged:15,disbursed:8,year:2024},{donor:'Sweden',pledged:28,disbursed:14,year:2024},{donor:'Switzerland',pledged:12,disbursed:4,year:2025},
];

const totalPledged=FUND_COMMITMENTS.reduce((a,c)=>a+c.pledged,0);
const totalDisbursed=FUND_COMMITMENTS.reduce((a,c)=>a+c.disbursed,0);

const exportCSV=(rows,fn)=>{if(!rows.length)return;const h=Object.keys(rows[0]);const csv=[h.join(','),...rows.map(r=>h.map(k=>JSON.stringify(r[k]??'')).join(','))].join('\n');const b=new Blob([csv],{type:'text/csv'});const u=URL.createObjectURL(b);const a=document.createElement('a');a.href=u;a.download=fn;a.click();URL.revokeObjectURL(u);};
const Kpi=({label,value,sub,accent=T.navy})=><div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:'14px 18px',borderLeft:`3px solid ${accent}`}}><div style={{fontSize:11,color:T.textSec,fontFamily:T.font,marginBottom:4}}>{label}</div><div style={{fontSize:22,fontWeight:700,color:T.text,fontFamily:T.font}}>{value}</div>{sub&&<div style={{fontSize:11,color:accent,marginTop:3}}>{sub}</div>}</div>;
const Row=({children,cols})=><div style={{display:'grid',gridTemplateColumns:cols||'repeat(auto-fit,minmax(200px,1fr))',gap:12,marginBottom:16}}>{children}</div>;
const Badge=({children,bg,fg})=><span style={{padding:'2px 8px',borderRadius:4,fontSize:11,fontWeight:600,background:bg||T.surfaceH,color:fg||T.text}}>{children}</span>;

export default function LossDamagePage(){
  const [tab,setTab]=useState(0);
  const [regionFilter,setRegionFilter]=useState('All');
  const [hazardFilter,setHazardFilter]=useState('All');
  const [search,setSearch]=useState('');
  const [sortCol,setSortCol]=useState('annualLoss');
  const [sortDir,setSortDir]=useState('desc');
  const [selectedCountry,setSelectedCountry]=useState(0);
  const [vulnMetric,setVulnMetric]=useState('climVulnIdx');
  const [gapView,setGapView]=useState('absolute');
  const [investMin,setInvestMin]=useState(100);

  const th={padding:'8px 10px',fontSize:11,fontWeight:600,color:T.textSec,background:T.surfaceH,border:`1px solid ${T.border}`,textAlign:'left',cursor:'pointer',fontFamily:T.font,whiteSpace:'nowrap',userSelect:'none'};
  const td={padding:'7px 10px',fontSize:12,border:`1px solid ${T.border}`,fontFamily:T.font,color:T.text};

  const filtered=useMemo(()=>{
    let c=[...COUNTRIES];
    if(regionFilter!=='All')c=c.filter(x=>x.region===regionFilter);
    if(hazardFilter!=='All')c=c.filter(x=>x.primaryHazard===hazardFilter);
    if(search)c=c.filter(x=>x.name.toLowerCase().includes(search.toLowerCase()));
    c.sort((a,b)=>sortDir==='asc'?(a[sortCol]>b[sortCol]?1:-1):(a[sortCol]<b[sortCol]?1:-1));
    return c;
  },[regionFilter,hazardFilter,search,sortCol,sortDir]);

  const toggleSort=(col)=>{if(sortCol===col)setSortDir(d=>d==='asc'?'desc':'asc');else{setSortCol(col);setSortDir('desc');}};

  const totalLoss=COUNTRIES.reduce((a,c)=>a+c.annualLoss,0);
  const totalNeeds=COUNTRIES.reduce((a,c)=>a+c.needsEstimate,0);
  const totalCommitted=COUNTRIES.reduce((a,c)=>a+c.committed,0);

  const renderFundTracker=()=>{
    const byYear=[{year:'2023',pledged:FUND_COMMITMENTS.filter(f=>f.year===2023).reduce((a,c)=>a+c.pledged,0),disbursed:FUND_COMMITMENTS.filter(f=>f.year===2023).reduce((a,c)=>a+c.disbursed,0)},{year:'2024',pledged:FUND_COMMITMENTS.filter(f=>f.year===2024).reduce((a,c)=>a+c.pledged,0),disbursed:FUND_COMMITMENTS.filter(f=>f.year===2024).reduce((a,c)=>a+c.disbursed,0)},{year:'2025',pledged:FUND_COMMITMENTS.filter(f=>f.year===2025).reduce((a,c)=>a+c.pledged,0),disbursed:FUND_COMMITMENTS.filter(f=>f.year===2025).reduce((a,c)=>a+c.disbursed,0)}];
    return(<div>
      <Row cols="1fr 1fr 1fr 1fr"><Kpi label="Total Pledged" value={`$${(totalPledged/1000).toFixed(1)}B`} sub="COP28+ commitments" accent={T.navy}/><Kpi label="Total Disbursed" value={`$${(totalDisbursed/1000).toFixed(1)}B`} sub={`${Math.round(totalDisbursed/totalPledged*100)}% disbursement rate`} accent={T.green}/><Kpi label="Disbursement Gap" value={`$${((totalPledged-totalDisbursed)/1000).toFixed(1)}B`} accent={T.red}/><Kpi label="Donor Countries" value={FUND_COMMITMENTS.length} sub="Active contributors" accent={T.gold}/></Row>
      <Row cols="1fr 1fr">
        <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:16}}>
          <div style={{fontWeight:600,fontSize:13,color:T.text,marginBottom:8}}>Donor Commitments (Top 18)</div>
          <ResponsiveContainer width="100%" height={350}><BarChart data={FUND_COMMITMENTS.sort((a,b)=>b.pledged-a.pledged)} layout="vertical" margin={{left:80}}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis type="number" tick={{fontSize:10,fill:T.textSec}} label={{value:'$M',position:'bottom',fontSize:11}}/><YAxis type="category" dataKey="donor" tick={{fontSize:10,fill:T.textSec}} width={75}/><Tooltip contentStyle={{fontSize:12,fontFamily:T.font}}/><Legend/><Bar dataKey="pledged" fill={T.navy} name="Pledged ($M)" radius={[0,3,3,0]}/><Bar dataKey="disbursed" fill={T.green} name="Disbursed ($M)" radius={[0,3,3,0]}/></BarChart></ResponsiveContainer>
        </div>
        <div>
          <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:16,marginBottom:12}}>
            <div style={{fontWeight:600,fontSize:13,color:T.text,marginBottom:8}}>By Year</div>
            <ResponsiveContainer width="100%" height={180}><BarChart data={byYear}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="year" tick={{fontSize:11,fill:T.textSec}}/><YAxis tick={{fontSize:10,fill:T.textSec}}/><Tooltip/><Legend/><Bar dataKey="pledged" fill={T.navy} name="Pledged" radius={[3,3,0,0]}/><Bar dataKey="disbursed" fill={T.green} name="Disbursed" radius={[3,3,0,0]}/></BarChart></ResponsiveContainer>
          </div>
          <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:16}}>
            <div style={{fontWeight:600,fontSize:13,color:T.text,marginBottom:8}}>Disbursement Rate by Donor</div>
            <div style={{maxHeight:200,overflowY:'auto'}}>
              {FUND_COMMITMENTS.sort((a,b)=>(b.disbursed/b.pledged)-(a.disbursed/a.pledged)).map((f,i)=>{const pct=Math.round(f.disbursed/f.pledged*100);return<div key={i} style={{padding:'6px 0',borderBottom:`1px solid ${T.border}`}}>
                <div style={{display:'flex',justifyContent:'space-between',fontSize:12,marginBottom:3}}><span style={{fontWeight:500}}>{f.donor}</span><span style={{fontFamily:T.mono,color:pct>50?T.green:T.red}}>{pct}%</span></div>
                <div style={{width:'100%',height:5,background:T.border,borderRadius:3}}><div style={{width:`${pct}%`,height:5,background:pct>50?T.green:pct>25?T.amber:T.red,borderRadius:3}}/></div>
              </div>;})}
            </div>
          </div>
        </div>
      </Row>
      <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:16}}>
        <div style={{display:'flex',justifyContent:'space-between',marginBottom:8}}><div style={{fontWeight:600,fontSize:13,color:T.text}}>Full Donor Table</div><button onClick={()=>exportCSV(FUND_COMMITMENTS.map(f=>({Donor:f.donor,Pledged:f.pledged,Disbursed:f.disbursed,Year:f.year,Rate:Math.round(f.disbursed/f.pledged*100)})),'ld_fund_commitments.csv')} style={{background:T.navy,color:'#fff',border:'none',borderRadius:6,padding:'5px 12px',fontSize:11,cursor:'pointer',fontFamily:T.font}}>Export</button></div>
        <table style={{width:'100%',borderCollapse:'collapse'}}>
          <thead><tr>{['Donor','Pledged ($M)','Disbursed ($M)','Rate %','Year'].map(h=><th key={h} style={th}>{h}</th>)}</tr></thead>
          <tbody>{FUND_COMMITMENTS.map((f,i)=>{const pct=Math.round(f.disbursed/f.pledged*100);return<tr key={i}><td style={{...td,fontWeight:500}}>{f.donor}</td><td style={{...td,fontFamily:T.mono}}>${f.pledged}M</td><td style={{...td,fontFamily:T.mono}}>${f.disbursed}M</td><td style={{...td,fontWeight:700,color:pct>50?T.green:T.red,fontFamily:T.mono}}>{pct}%</td><td style={td}>{f.year}</td></tr>;})}</tbody>
        </table>
      </div>
    </div>);
  };

  const renderLossQuant=()=>{
    const co=COUNTRIES[selectedCountry];
    const regionLoss=REGIONS.map(r=>({name:r,loss:Math.round(COUNTRIES.filter(c=>c.region===r).reduce((a,c)=>a+c.annualLoss,0)),count:COUNTRIES.filter(c=>c.region===r).length}));
    return(<div>
      <Row cols="1fr 1fr 1fr 1fr"><Kpi label="Total Annual Losses" value={`$${(totalLoss/1000).toFixed(1)}B`} sub="Across 40 countries" accent={T.red}/><Kpi label="Avg GDP Impact" value={`${(COUNTRIES.reduce((a,c)=>a+c.gdpPct,0)/COUNTRIES.length).toFixed(1)}%`} accent={T.amber}/><Kpi label="Annual Deaths" value={COUNTRIES.reduce((a,c)=>a+c.deaths,0).toLocaleString()} accent={T.red}/><Kpi label="Displaced (thousands)" value={COUNTRIES.reduce((a,c)=>a+c.displaced,0).toLocaleString()} accent={T.navy}/></Row>
      <div style={{display:'flex',gap:10,marginBottom:14,flexWrap:'wrap'}}>
        <select value={selectedCountry} onChange={e=>setSelectedCountry(+e.target.value)} style={{border:`1px solid ${T.border}`,borderRadius:6,padding:'7px 10px',fontSize:12,fontFamily:T.font,minWidth:180}}>{COUNTRIES.map((c,i)=><option key={i} value={i}>{c.name}</option>)}</select>
        <select value={regionFilter} onChange={e=>setRegionFilter(e.target.value)} style={{border:`1px solid ${T.border}`,borderRadius:6,padding:'7px 10px',fontSize:12,fontFamily:T.font}}><option value="All">All Regions</option>{REGIONS.map(r=><option key={r}>{r}</option>)}</select>
        <select value={hazardFilter} onChange={e=>setHazardFilter(e.target.value)} style={{border:`1px solid ${T.border}`,borderRadius:6,padding:'7px 10px',fontSize:12,fontFamily:T.font}}><option value="All">All Hazards</option>{HAZARDS.map(h=><option key={h}>{h}</option>)}</select>
        <button onClick={()=>exportCSV(filtered.map(c=>({Country:c.name,Region:c.region,AnnualLoss:c.annualLoss,GDPPct:c.gdpPct,Deaths:c.deaths,Displaced:c.displaced,PrimaryHazard:c.primaryHazard})),'climate_losses.csv')} style={{background:T.navy,color:'#fff',border:'none',borderRadius:6,padding:'7px 14px',fontSize:12,cursor:'pointer',fontFamily:T.font}}>Export</button>
      </div>
      <Row cols="2fr 1fr">
        <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:16}}>
          <div style={{fontWeight:600,fontSize:13,color:T.text,marginBottom:8}}>{co.name} - Loss History (2018-2025)</div>
          <ResponsiveContainer width="100%" height={260}><AreaChart data={co.lossHistory}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="year" tick={{fontSize:10,fill:T.textSec}}/><YAxis tick={{fontSize:10,fill:T.textSec}}/><Tooltip contentStyle={{fontSize:12}}/><Legend/><Area type="monotone" dataKey="loss" fill={T.red+'30'} stroke={T.red} name="Loss ($M)"/><Area type="monotone" dataKey="events" fill={T.amber+'30'} stroke={T.amber} name="Events" yAxisId={0}/></AreaChart></ResponsiveContainer>
        </div>
        <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:16}}>
          <div style={{fontWeight:600,fontSize:13,color:T.text,marginBottom:8}}>{co.name} - Key Metrics</div>
          {[{l:'Annual Loss',v:`$${co.annualLoss}M`,c:T.red},{l:'GDP Impact',v:`${co.gdpPct}%`,c:T.amber},{l:'Deaths/yr',v:co.deaths.toLocaleString(),c:T.red},{l:'Displaced (K)',v:co.displaced,c:T.navy},{l:'Infra Damage',v:`$${co.infraDamage}M`,c:T.gold},{l:'Agri Loss',v:`$${co.agriLoss}M`,c:T.sage},{l:'Primary Hazard',v:co.primaryHazard,c:T.text},{l:'Region',v:co.region,c:T.text}].map((m,i)=><div key={i} style={{display:'flex',justifyContent:'space-between',padding:'6px 0',borderBottom:`1px solid ${T.border}`,fontSize:12}}><span style={{color:T.textSec}}>{m.l}</span><span style={{fontWeight:600,color:m.c,fontFamily:T.mono}}>{m.v}</span></div>)}
        </div>
      </Row>
      <Row cols="1fr 1fr">
        <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:16}}>
          <div style={{fontWeight:600,fontSize:13,color:T.text,marginBottom:8}}>Regional Loss Distribution</div>
          <ResponsiveContainer width="100%" height={250}><BarChart data={regionLoss}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="name" tick={{fontSize:9,fill:T.textSec}} angle={-25} textAnchor="end" height={50}/><YAxis tick={{fontSize:10,fill:T.textSec}}/><Tooltip/><Bar dataKey="loss" fill={T.red} name="Loss ($M)" radius={[3,3,0,0]}/></BarChart></ResponsiveContainer>
        </div>
        <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:16}}>
          <div style={{fontWeight:600,fontSize:13,color:T.text,marginBottom:8}}>{co.name} - Hazard Breakdown</div>
          <ResponsiveContainer width="100%" height={250}><PieChart><Pie data={co.hazardBreakdown} cx="50%" cy="50%" outerRadius={80} dataKey="loss" label={({hazard,loss})=>`${hazard}: $${loss}M`}>{co.hazardBreakdown.map((_,i)=><Cell key={i} fill={PIE_C[i]}/>)}</Pie><Tooltip/></PieChart></ResponsiveContainer>
        </div>
      </Row>
      <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:16}}>
        <div style={{fontWeight:600,fontSize:13,color:T.text,marginBottom:8}}>Country Loss Table</div>
        <div style={{overflowX:'auto',maxHeight:350,overflowY:'auto'}}>
          <table style={{width:'100%',borderCollapse:'collapse'}}>
            <thead style={{position:'sticky',top:0,zIndex:1}}><tr>{[{k:'name',l:'Country'},{k:'region',l:'Region'},{k:'annualLoss',l:'Loss ($M)'},{k:'gdpPct',l:'GDP %'},{k:'deaths',l:'Deaths'},{k:'displaced',l:'Displaced (K)'},{k:'primaryHazard',l:'Primary Hazard'}].map(c=><th key={c.k} style={th} onClick={()=>toggleSort(c.k)}>{c.l}{sortCol===c.k?(sortDir==='asc'?' ↑':' ↓'):''}</th>)}</tr></thead>
            <tbody>{filtered.slice(0,35).map(c=><tr key={c.id} style={{cursor:'pointer',background:selectedCountry===c.id?T.surfaceH:'transparent'}} onClick={()=>setSelectedCountry(c.id)}>
              <td style={{...td,fontWeight:500}}>{c.name}</td><td style={td}>{c.region}</td><td style={{...td,fontWeight:700,color:T.red,fontFamily:T.mono}}>${c.annualLoss}M</td><td style={{...td,fontFamily:T.mono}}>{c.gdpPct}%</td><td style={{...td,fontFamily:T.mono}}>{c.deaths.toLocaleString()}</td><td style={{...td,fontFamily:T.mono}}>{c.displaced}</td><td style={td}>{c.primaryHazard}</td>
            </tr>)}</tbody>
          </table>
        </div>
      </div>
    </div>);
  };

  const renderVulnerability=()=>{
    const sorted=[...COUNTRIES].sort((a,b)=>b[vulnMetric]-a[vulnMetric]);
    const top20=sorted.slice(0,20).map(c=>({name:c.name.slice(0,12),ndGain:c.ndGain,climVulnIdx:c.climVulnIdx}));
    const regionVuln=REGIONS.map(r=>{const cs=COUNTRIES.filter(c=>c.region===r);return{name:r,avgNdGain:Math.round(cs.reduce((a,c)=>a+c.ndGain,0)/(cs.length||1)),avgVuln:Math.round(cs.reduce((a,c)=>a+c.climVulnIdx,0)/(cs.length||1)),count:cs.length};});
    return(<div>
      <Row cols="1fr 1fr 1fr 1fr"><Kpi label="Most Vulnerable" value={sorted[0].name} sub={`CVI: ${sorted[0].climVulnIdx}`} accent={T.red}/><Kpi label="Avg ND-GAIN" value={Math.round(COUNTRIES.reduce((a,c)=>a+c.ndGain,0)/COUNTRIES.length)} sub="Out of 100" accent={T.amber}/><Kpi label="Avg CVI" value={Math.round(COUNTRIES.reduce((a,c)=>a+c.climVulnIdx,0)/COUNTRIES.length)} accent={T.red}/><Kpi label="Countries Tracked" value={40} accent={T.navy}/></Row>
      <div style={{display:'flex',gap:10,marginBottom:14}}>
        <select value={vulnMetric} onChange={e=>setVulnMetric(e.target.value)} style={{border:`1px solid ${T.border}`,borderRadius:6,padding:'7px 10px',fontSize:12,fontFamily:T.font}}><option value="climVulnIdx">Climate Vulnerability Index</option><option value="ndGain">ND-GAIN Score</option></select>
        <select value={regionFilter} onChange={e=>setRegionFilter(e.target.value)} style={{border:`1px solid ${T.border}`,borderRadius:6,padding:'7px 10px',fontSize:12,fontFamily:T.font}}><option value="All">All Regions</option>{REGIONS.map(r=><option key={r}>{r}</option>)}</select>
        <button onClick={()=>exportCSV(sorted.map(c=>({Country:c.name,Region:c.region,NdGain:c.ndGain,CVI:c.climVulnIdx,AnnualLoss:c.annualLoss,GDPPct:c.gdpPct})),'vulnerability_assessment.csv')} style={{background:T.navy,color:'#fff',border:'none',borderRadius:6,padding:'7px 14px',fontSize:12,cursor:'pointer',fontFamily:T.font}}>Export</button>
      </div>
      <Row cols="1fr 1fr">
        <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:16}}>
          <div style={{fontWeight:600,fontSize:13,color:T.text,marginBottom:8}}>Top 20 by {vulnMetric==='climVulnIdx'?'Climate Vulnerability':'ND-GAIN'}</div>
          <ResponsiveContainer width="100%" height={400}><BarChart data={top20} layout="vertical" margin={{left:80}}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis type="number" tick={{fontSize:10,fill:T.textSec}} domain={[0,100]}/><YAxis type="category" dataKey="name" tick={{fontSize:10,fill:T.textSec}} width={75}/><Tooltip contentStyle={{fontSize:12}}/><Legend/><Bar dataKey="ndGain" fill={T.sage} name="ND-GAIN" radius={[0,3,3,0]}/><Bar dataKey="climVulnIdx" fill={T.red} name="CVI" radius={[0,3,3,0]}/></BarChart></ResponsiveContainer>
        </div>
        <div>
          <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:16,marginBottom:12}}>
            <div style={{fontWeight:600,fontSize:13,color:T.text,marginBottom:8}}>Regional Averages</div>
            <ResponsiveContainer width="100%" height={220}><BarChart data={regionVuln}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="name" tick={{fontSize:9,fill:T.textSec}} angle={-25} textAnchor="end" height={50}/><YAxis tick={{fontSize:10,fill:T.textSec}}/><Tooltip/><Legend/><Bar dataKey="avgNdGain" fill={T.sage} name="Avg ND-GAIN" radius={[3,3,0,0]}/><Bar dataKey="avgVuln" fill={T.red} name="Avg CVI" radius={[3,3,0,0]}/></BarChart></ResponsiveContainer>
          </div>
          <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:16}}>
            <div style={{fontWeight:600,fontSize:13,color:T.text,marginBottom:8}}>Vulnerability vs Loss Scatter</div>
            <div style={{maxHeight:200,overflowY:'auto'}}>
              {sorted.slice(0,15).map((c,i)=><div key={i} style={{display:'flex',alignItems:'center',gap:8,padding:'5px 0',borderBottom:`1px solid ${T.border}`}}>
                <span style={{fontSize:11,fontWeight:500,width:80,flexShrink:0}}>{c.name}</span>
                <div style={{flex:1,display:'flex',gap:4,alignItems:'center'}}>
                  <div style={{width:`${c.climVulnIdx}%`,height:12,background:T.red+'60',borderRadius:3,display:'flex',alignItems:'center',justifyContent:'flex-end',paddingRight:4}}><span style={{fontSize:9,color:T.text,fontFamily:T.mono}}>{c.climVulnIdx}</span></div>
                </div>
                <span style={{fontSize:10,fontFamily:T.mono,color:T.red,width:60,textAlign:'right'}}>${c.annualLoss}M</span>
              </div>)}
            </div>
          </div>
        </div>
      </Row>
    </div>);
  };

  const renderFinancingGap=()=>{
    const gapData=filtered.slice(0,20).map(c=>({name:c.name.slice(0,12),needs:Math.round(c.needsEstimate/100),committed:Math.round(c.committed/100),gap:Math.round(c.adaptationGap/100)}));
    const investOpp=COUNTRIES.filter(c=>c.adaptationGap>investMin).sort((a,b)=>b.adaptationGap-a.adaptationGap);
    const totalGap=COUNTRIES.reduce((a,c)=>a+c.adaptationGap,0);
    const regionGap=REGIONS.map(r=>{const cs=COUNTRIES.filter(c=>c.region===r);return{name:r,gap:Math.round(cs.reduce((a,c)=>a+c.adaptationGap,0)),needs:Math.round(cs.reduce((a,c)=>a+c.needsEstimate,0)),committed:Math.round(cs.reduce((a,c)=>a+c.committed,0))};});
    return(<div>
      <Row cols="1fr 1fr 1fr 1fr"><Kpi label="Total Financing Needs" value={`$${(totalNeeds/1000).toFixed(1)}B`} accent={T.navy}/><Kpi label="Total Committed" value={`$${(totalCommitted/1000).toFixed(1)}B`} accent={T.green}/><Kpi label="Financing Gap" value={`$${(totalGap/1000).toFixed(1)}B`} sub={`${Math.round(totalGap/totalNeeds*100)}% unfunded`} accent={T.red}/><Kpi label="Investment Opportunities" value={investOpp.length} sub={`Gap > $${investMin}M`} accent={T.gold}/></Row>
      <div style={{display:'flex',gap:12,marginBottom:14,alignItems:'center',flexWrap:'wrap'}}>
        <div style={{display:'flex',alignItems:'center',gap:8}}><span style={{fontSize:12,color:T.textSec}}>Min Gap ($M):</span><input type="range" min={50} max={1000} step={50} value={investMin} onChange={e=>setInvestMin(+e.target.value)} style={{width:150,accentColor:T.navy}}/><span style={{fontSize:12,fontWeight:700,fontFamily:T.mono,color:T.navy}}>${investMin}M</span></div>
        <select value={gapView} onChange={e=>setGapView(e.target.value)} style={{border:`1px solid ${T.border}`,borderRadius:6,padding:'7px 10px',fontSize:12,fontFamily:T.font}}><option value="absolute">Absolute ($M)</option><option value="pctGDP">% of GDP</option></select>
        <button onClick={()=>exportCSV(investOpp.map(c=>({Country:c.name,Region:c.region,Needs:c.needsEstimate,Committed:c.committed,Gap:c.adaptationGap,GDPPct:c.gdpPct})),'financing_gap.csv')} style={{background:T.navy,color:'#fff',border:'none',borderRadius:6,padding:'7px 14px',fontSize:12,cursor:'pointer',fontFamily:T.font}}>Export</button>
      </div>
      <Row cols="1fr 1fr">
        <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:16}}>
          <div style={{fontWeight:600,fontSize:13,color:T.text,marginBottom:8}}>Needs vs Commitments (Top 20)</div>
          <ResponsiveContainer width="100%" height={400}><BarChart data={gapData} layout="vertical" margin={{left:80}}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis type="number" tick={{fontSize:10,fill:T.textSec}} label={{value:'$100M',position:'bottom',fontSize:11}}/><YAxis type="category" dataKey="name" tick={{fontSize:10,fill:T.textSec}} width={75}/><Tooltip contentStyle={{fontSize:12}}/><Legend/><Bar dataKey="needs" fill={T.navy} name="Needs" radius={[0,3,3,0]}/><Bar dataKey="committed" fill={T.green} name="Committed" radius={[0,3,3,0]}/></BarChart></ResponsiveContainer>
        </div>
        <div>
          <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:16,marginBottom:12}}>
            <div style={{fontWeight:600,fontSize:13,color:T.text,marginBottom:8}}>Regional Gap Distribution</div>
            <ResponsiveContainer width="100%" height={220}><PieChart><Pie data={regionGap} cx="50%" cy="50%" outerRadius={80} dataKey="gap" label={({name,gap})=>`${name}: $${gap}M`}>{regionGap.map((_,i)=><Cell key={i} fill={PIE_C[i]}/>)}</Pie><Tooltip/></PieChart></ResponsiveContainer>
          </div>
          <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:16}}>
            <div style={{fontWeight:600,fontSize:13,color:T.text,marginBottom:8}}>Funding Rate by Region</div>
            {regionGap.map((r,i)=>{const rate=r.needs>0?Math.round(r.committed/r.needs*100):0;return<div key={i} style={{padding:'5px 0',borderBottom:`1px solid ${T.border}`}}>
              <div style={{display:'flex',justifyContent:'space-between',fontSize:12,marginBottom:3}}><span style={{fontWeight:500}}>{r.name}</span><span style={{fontFamily:T.mono,color:rate>30?T.green:T.red}}>{rate}%</span></div>
              <div style={{width:'100%',height:5,background:T.border,borderRadius:3}}><div style={{width:`${rate}%`,height:5,background:rate>30?T.green:T.red,borderRadius:3}}/></div>
            </div>;})}
          </div>
        </div>
      </Row>
      <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:16}}>
        <div style={{fontWeight:600,fontSize:13,color:T.text,marginBottom:8}}>Investment Opportunities (Gap &gt; ${investMin}M)</div>
        <div style={{overflowX:'auto',maxHeight:350,overflowY:'auto'}}>
          <table style={{width:'100%',borderCollapse:'collapse'}}>
            <thead style={{position:'sticky',top:0}}><tr>{['Country','Region','Needs ($M)','Committed ($M)','Gap ($M)','Gap %','GDP Impact','CVI'].map(h=><th key={h} style={th}>{h}</th>)}</tr></thead>
            <tbody>{investOpp.slice(0,25).map(c=>{const gapPct=Math.round(c.adaptationGap/c.needsEstimate*100);return<tr key={c.id} style={{cursor:'pointer'}} onClick={()=>setSelectedCountry(c.id)}>
              <td style={{...td,fontWeight:500}}>{c.name}</td><td style={td}>{c.region}</td><td style={{...td,fontFamily:T.mono}}>${c.needsEstimate}M</td><td style={{...td,fontFamily:T.mono,color:T.green}}>${c.committed}M</td>
              <td style={{...td,fontWeight:700,color:T.red,fontFamily:T.mono}}>${c.adaptationGap}M</td><td style={{...td,fontFamily:T.mono}}>{gapPct}%</td><td style={{...td,fontFamily:T.mono}}>{c.gdpPct}%</td><td style={{...td,fontFamily:T.mono,color:c.climVulnIdx>70?T.red:T.amber}}>{c.climVulnIdx}</td>
            </tr>;})}</tbody>
          </table>
        </div>
      </div>
    </div>);
  };

  return(<div style={{padding:'24px 28px',fontFamily:T.font,background:T.bg,minHeight:'100vh'}}>
    <div style={{marginBottom:20}}><h1 style={{fontSize:22,fontWeight:700,color:T.text,margin:0}}>Climate Loss & Damage</h1><p style={{fontSize:13,color:T.textSec,margin:'4px 0 0'}}>Track COP28 fund commitments, climate losses, and financing gaps across 40 vulnerable countries</p></div>
    <div style={{display:'flex',gap:0,marginBottom:20,borderBottom:`2px solid ${T.border}`}}>
      {TABS.map((t,i)=><button key={t} onClick={()=>setTab(i)} style={{padding:'10px 20px',fontSize:13,fontWeight:tab===i?700:500,color:tab===i?T.navy:T.textSec,background:tab===i?T.surface:'transparent',border:'none',borderBottom:tab===i?`2px solid ${T.navy}`:'2px solid transparent',cursor:'pointer',fontFamily:T.font,marginBottom:-2}}>{t}</button>)}
    </div>
    {tab===0&&renderFundTracker()}
    {tab===1&&renderLossQuant()}
    {tab===2&&renderVulnerability()}
    {tab===3&&renderFinancingGap()}
  </div>);
}