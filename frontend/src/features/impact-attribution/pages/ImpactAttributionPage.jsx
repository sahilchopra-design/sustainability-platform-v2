import React,{useState,useMemo,useCallback} from 'react';
import {BarChart,Bar,XAxis,YAxis,CartesianGrid,Tooltip,ResponsiveContainer,AreaChart,Area,Cell,Legend,ScatterChart,Scatter} from 'recharts';

const T={bg:'#f6f4f0',surface:'#ffffff',surfaceH:'#f0ede7',border:'#e5e0d8',borderL:'#d5cfc5',navy:'#1b3a5c',navyL:'#2c5a8c',gold:'#c5a96a',goldL:'#d4be8a',sage:'#5a8a6a',sageL:'#7ba67d',teal:'#5a8a6a',text:'#1b3a5c',textSec:'#5c6b7e',textMut:'#9aa3ae',red:'#dc2626',green:'#16a34a',amber:'#d97706',font:"'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"};
const sr=(s)=>{let x=Math.sin(s+1)*10000;return x-Math.floor(x);};

const SECTORS=['Technology','Healthcare','Financial Services','Energy','Consumer Goods','Industrials','Materials','Utilities','Real Estate','Telecom'];
const COMPANY_PREFIXES=['Apex','Nova','Global','Prime','Stellar','Vertex','Zenith','Cascade','Meridian','Horizon','Summit','Pacific','Atlas','Quantum','Vanguard','Pinnacle','Nexus','Frontier','Crest','Forge'];
const COMPANY_SUFFIXES=['Corp','Industries','Holdings','Group','Partners','Capital','Solutions','Technologies','Systems','Dynamics'];
const IMPACT_CATEGORIES=['Jobs Created','Lives Improved','CO2 Avoided (tCO2e)','Clean Energy (MWh)','Water Saved (ML)'];
const IRIS_METRICS=['PI4060 - Jobs Created','PI2822 - Patients Served','OI1120 - GHG Reduced','OI8839 - Energy Generated','OI4389 - Water Conserved','PI6330 - Students Educated','PI3468 - Housing Units','OI5765 - Waste Diverted','PI9382 - Farmers Supported','OI2176 - Land Restored'];
const QUARTERS=['Q1-23','Q2-23','Q3-23','Q4-23','Q1-24','Q2-24','Q3-24','Q4-24','Q1-25','Q2-25','Q3-25','Q4-25'];

const genHoldings=(count)=>{
  const out=[];
  for(let i=0;i<count;i++){
    const s1=sr(i*73+5),s2=sr(i*41+13),s3=sr(i*59+7);
    const pIdx=Math.floor(s1*COMPANY_PREFIXES.length);
    const sIdx=Math.floor(s2*COMPANY_SUFFIXES.length);
    const secIdx=Math.floor(s3*SECTORS.length);
    const outstanding=Math.round((sr(i*31+17)*80+5)*10)/10;
    const evic=Math.round((sr(i*47+19)*500+100)*10)/10;
    const attrFactor=Math.round((outstanding/evic)*1000)/1000;
    const jobs=Math.round(sr(i*67+21)*5000+100);
    const lives=Math.round(sr(i*29+23)*20000+500);
    const co2=Math.round(sr(i*53+25)*50000+1000);
    const energy=Math.round(sr(i*37+27)*100000+5000);
    const water=Math.round(sr(i*43+29)*5000+100);
    const attrJobs=Math.round(jobs*attrFactor);
    const attrLives=Math.round(lives*attrFactor);
    const attrCo2=Math.round(co2*attrFactor);
    const attrEnergy=Math.round(energy*attrFactor);
    const attrWater=Math.round(water*attrFactor);
    const investedM=Math.round((sr(i*61+31)*50+2)*10)/10;
    const impactPerM=Math.round((attrJobs+attrCo2*0.01+attrLives*0.1)/investedM*10)/10;
    const trends=[];
    for(let q=0;q<12;q++){
      const base=sr(i*12+q*17+500);
      trends.push({quarter:QUARTERS[q],jobs:Math.round(attrJobs*(0.7+base*0.6)/12),co2:Math.round(attrCo2*(0.7+base*0.6)/12),lives:Math.round(attrLives*(0.7+base*0.6)/12),energy:Math.round(attrEnergy*(0.7+base*0.6)/12),water:Math.round(attrWater*(0.7+base*0.6)/12)});
    }
    out.push({id:i+1,name:`${COMPANY_PREFIXES[pIdx]} ${COMPANY_SUFFIXES[sIdx]}`,sector:SECTORS[secIdx],country:['US','GB','DE','JP','FR','CH','AU','CA','SG','NL'][Math.floor(sr(i*19+33)*10)],outstanding,evic,attrFactor,jobs,lives,co2,energy,water,attrJobs,attrLives,attrCo2,attrEnergy,attrWater,investedM,impactPerM,trends,irisMetrics:IRIS_METRICS.slice(0,Math.floor(sr(i*71+35)*5)+3).map((m,mi)=>({metric:m,value:Math.round(sr(i*17+mi*31+600)*10000+100),unit:m.includes('GHG')?'tCO2e':m.includes('Energy')?'MWh':'count',verified:sr(i*23+mi*37+610)>0.4})),impactRating:['A+','A','A-','B+','B','B-','C+','C'][Math.floor(sr(i*83+37)*8)],methodology:['PCAF-Impact','GIIN IRIS+','IMP 5D','Custom'][Math.floor(sr(i*91+39)*4)]});
  }
  return out;
};

const REPORT_SECTIONS=['Executive Summary','Portfolio Impact Overview','Environmental Impact','Social Impact','SDG Alignment','Impact Attribution Methodology','Holding-Level Detail','Appendix: IRIS+ Metrics'];

export default function ImpactAttributionPage(){
  const [tab,setTab]=useState(0);
  const [search,setSearch]=useState('');
  const [sortKey,setSortKey]=useState('impactPerM');
  const [sortDir,setSortDir]=useState('desc');
  const [selectedHolding,setSelectedHolding]=useState(null);
  const [impactMetric,setImpactMetric]=useState('co2');
  const [reportSections,setReportSections]=useState(REPORT_SECTIONS.map(s=>({name:s,enabled:true})));
  const [reportAudience,setReportAudience]=useState('investors');

  const holdings=useMemo(()=>genHoldings(100),[]);

  const filtered=useMemo(()=>{
    let f=holdings.filter(c=>c.name.toLowerCase().includes(search.toLowerCase())||c.sector.toLowerCase().includes(search.toLowerCase()));
    f.sort((a,b)=>sortDir==='desc'?(b[sortKey]||0)-(a[sortKey]||0):(a[sortKey]||0)-(b[sortKey]||0));
    return f;
  },[holdings,search,sortKey,sortDir]);

  const toggleSort=(key)=>{if(sortKey===key)setSortDir(d=>d==='desc'?'asc':'desc');else{setSortKey(key);setSortDir('desc');}};

  const exportCSV=(data,filename)=>{
    if(!data||!data.length)return;
    const keys=Object.keys(data[0]).filter(k=>typeof data[0][k]!=='object');
    const csv=[keys.join(','),...data.map(r=>keys.map(k=>JSON.stringify(r[k]??'')).join(','))].join('\n');
    const blob=new Blob([csv],{type:'text/csv'});
    const url=URL.createObjectURL(blob);
    const a=document.createElement('a');a.href=url;a.download=filename;a.click();URL.revokeObjectURL(url);
  };

  const aggKPIs=useMemo(()=>{
    const totJobs=holdings.reduce((a,h)=>a+h.attrJobs,0);
    const totLives=holdings.reduce((a,h)=>a+h.attrLives,0);
    const totCo2=holdings.reduce((a,h)=>a+h.attrCo2,0);
    const totEnergy=holdings.reduce((a,h)=>a+h.attrEnergy,0);
    const totWater=holdings.reduce((a,h)=>a+h.attrWater,0);
    const totInvested=holdings.reduce((a,h)=>a+h.investedM,0);
    return [{label:'Jobs Created',value:totJobs.toLocaleString(),trend:'+12%'},{label:'Lives Improved',value:totLives.toLocaleString(),trend:'+8%'},{label:'CO2 Avoided (tCO2e)',value:totCo2.toLocaleString(),trend:'+15%'},{label:'Clean Energy (MWh)',value:totEnergy.toLocaleString(),trend:'+22%'},{label:'Water Saved (ML)',value:totWater.toLocaleString(),trend:'+6%'},{label:'Total Invested',value:`$${Math.round(totInvested)}M`,trend:''}];
  },[holdings]);

  const trendData=useMemo(()=>{
    return QUARTERS.map((q,qi)=>{
      const qData={quarter:q};
      qData.jobs=holdings.reduce((a,h)=>a+(h.trends[qi]?.jobs||0),0);
      qData.co2=holdings.reduce((a,h)=>a+(h.trends[qi]?.co2||0),0);
      qData.lives=holdings.reduce((a,h)=>a+(h.trends[qi]?.lives||0),0);
      qData.energy=holdings.reduce((a,h)=>a+(h.trends[qi]?.energy||0),0);
      qData.water=holdings.reduce((a,h)=>a+(h.trends[qi]?.water||0),0);
      return qData;
    });
  },[holdings]);

  const tabs=['Impact Dashboard','Attribution Model','Impact Efficiency','Impact Report'];
  const st={page:{fontFamily:T.font,background:T.bg,minHeight:'100vh',padding:'24px',color:T.text},header:{marginBottom:'24px'},title:{fontSize:'28px',fontWeight:700,color:T.navy,margin:0},subtitle:{fontSize:'14px',color:T.textSec,marginTop:'4px',fontFamily:T.mono},kpiRow:{display:'grid',gridTemplateColumns:'repeat(6,1fr)',gap:'12px',marginBottom:'20px'},kpiCard:{background:T.surface,border:`1px solid ${T.border}`,borderRadius:'8px',padding:'16px',textAlign:'center'},kpiVal:{fontSize:'22px',fontWeight:700,color:T.navy},kpiLabel:{fontSize:'11px',color:T.textMut,fontFamily:T.mono,marginTop:'4px'},tabBar:{display:'flex',gap:'4px',marginBottom:'20px',borderBottom:`2px solid ${T.border}`},tabBtn:(a)=>({padding:'10px 20px',background:a?T.navy:'transparent',color:a?'#fff':T.textSec,border:'none',borderRadius:'6px 6px 0 0',cursor:'pointer',fontFamily:T.font,fontSize:'13px',fontWeight:a?600:400}),card:{background:T.surface,border:`1px solid ${T.border}`,borderRadius:'8px',padding:'20px',marginBottom:'16px'},searchBar:{padding:'10px 16px',border:`1px solid ${T.border}`,borderRadius:'6px',width:'320px',fontFamily:T.font,fontSize:'13px',background:T.surface,outline:'none'},table:{width:'100%',borderCollapse:'collapse',fontSize:'12px',fontFamily:T.mono},th:{padding:'10px 12px',textAlign:'left',borderBottom:`2px solid ${T.border}`,color:T.textSec,cursor:'pointer',fontSize:'11px',fontWeight:600,textTransform:'uppercase',letterSpacing:'0.5px'},td:{padding:'10px 12px',borderBottom:`1px solid ${T.border}`},badge:(c)=>({display:'inline-block',padding:'2px 8px',borderRadius:'4px',fontSize:'10px',fontWeight:600,background:c+'20',color:c}),panel:{position:'fixed',top:0,right:0,width:'560px',height:'100vh',background:T.surface,borderLeft:`2px solid ${T.border}`,padding:'24px',overflowY:'auto',zIndex:1000,boxShadow:'-4px 0 20px rgba(0,0,0,0.1)'},overlay:{position:'fixed',top:0,left:0,width:'100vw',height:'100vh',background:'rgba(0,0,0,0.3)',zIndex:999},btn:(v)=>({padding:'8px 16px',borderRadius:'6px',border:v==='outline'?`1px solid ${T.border}`:'none',background:v==='primary'?T.navy:v==='outline'?'transparent':T.surfaceH,color:v==='primary'?'#fff':T.text,cursor:'pointer',fontFamily:T.font,fontSize:'12px',fontWeight:500})};

  const renderTab0=()=>(
    <div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'16px',marginBottom:'20px'}}>
        {aggKPIs.slice(0,3).map((k,i)=>(
          <div key={i} style={{...st.card,textAlign:'center'}}>
            <div style={{fontSize:'32px',fontWeight:700,color:T.navy}}>{k.value}</div>
            <div style={{fontSize:'12px',color:T.textMut,fontFamily:T.mono,marginTop:'4px'}}>{k.label}</div>
            {k.trend&&<div style={{fontSize:'12px',color:T.green,marginTop:'4px'}}>{k.trend} QoQ</div>}
          </div>
        ))}
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'16px',marginBottom:'20px'}}>
        {aggKPIs.slice(3).map((k,i)=>(
          <div key={i} style={{...st.card,textAlign:'center'}}>
            <div style={{fontSize:'32px',fontWeight:700,color:T.navy}}>{k.value}</div>
            <div style={{fontSize:'12px',color:T.textMut,fontFamily:T.mono,marginTop:'4px'}}>{k.label}</div>
            {k.trend&&<div style={{fontSize:'12px',color:T.green,marginTop:'4px'}}>{k.trend} QoQ</div>}
          </div>
        ))}
      </div>
      <div style={st.card}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'12px'}}>
          <h4 style={{margin:0,fontSize:'14px',color:T.navy}}>Impact Trends (12Q)</h4>
          <select style={{...st.searchBar,width:'180px'}} value={impactMetric} onChange={e=>setImpactMetric(e.target.value)}>
            <option value="jobs">Jobs Created</option><option value="lives">Lives Improved</option><option value="co2">CO2 Avoided</option><option value="energy">Clean Energy</option><option value="water">Water Saved</option>
          </select>
        </div>
        <ResponsiveContainer width="100%" height={320}>
          <AreaChart data={trendData} margin={{top:10,right:30,left:10,bottom:10}}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
            <XAxis dataKey="quarter" tick={{fontSize:11,fill:T.textSec}}/>
            <YAxis tick={{fontSize:11,fill:T.textSec}}/>
            <Tooltip contentStyle={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:'6px',fontSize:'12px'}}/>
            <Area type="monotone" dataKey={impactMetric} stroke={T.navy} fill={T.navy} fillOpacity={0.15} strokeWidth={2}/>
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div style={st.card}>
        <h4 style={{margin:'0 0 12px',fontSize:'14px',color:T.navy}}>Impact by Sector</h4>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={SECTORS.map((s,i)=>({sector:s,impact:holdings.filter(h=>h.sector===s).reduce((a,h)=>a+h.attrCo2,0)}))} margin={{top:10,right:30,left:10,bottom:40}}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
            <XAxis dataKey="sector" tick={{fontSize:10,fill:T.textSec,angle:-25,textAnchor:'end'}}/>
            <YAxis tick={{fontSize:11,fill:T.textSec}}/>
            <Tooltip contentStyle={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:'6px',fontSize:'12px'}}/>
            <Bar dataKey="impact" name="CO2 Avoided (tCO2e)" fill={T.sage} radius={[4,4,0,0]}/>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );

  const renderTab1=()=>(
    <div>
      <div style={{...st.card,marginBottom:'16px',padding:'16px',background:T.surfaceH}}>
        <h4 style={{margin:'0 0 8px',fontSize:'14px',color:T.navy}}>Attribution Methodology</h4>
        <div style={{fontSize:'12px',color:T.textSec,lineHeight:'1.6'}}>
          <strong>Attributed Impact = (Outstanding / EVIC) x Company Total Impact</strong><br/>
          Based on PCAF methodology adapted for impact measurement. Outstanding represents investor exposure; EVIC is Enterprise Value Including Cash.
        </div>
      </div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'16px'}}>
        <input style={st.searchBar} placeholder="Search holdings..." value={search} onChange={e=>setSearch(e.target.value)}/>
        <div style={{display:'flex',gap:'8px'}}>
          <select style={{...st.searchBar,width:'180px'}} value={sortKey} onChange={e=>setSortKey(e.target.value)}>
            <option value="attrCo2">Attributed CO2</option><option value="attrJobs">Attributed Jobs</option><option value="attrLives">Attributed Lives</option><option value="outstanding">Outstanding</option><option value="attrFactor">Attribution Factor</option>
          </select>
          <button style={st.btn('outline')} onClick={()=>setSortDir(d=>d==='desc'?'asc':'desc')}>{sortDir==='desc'?'Desc':'Asc'}</button>
          <button style={st.btn('outline')} onClick={()=>exportCSV(filtered.map(h=>({Name:h.name,Sector:h.sector,Outstanding:h.outstanding,EVIC:h.evic,AttrFactor:h.attrFactor,Jobs:h.attrJobs,Lives:h.attrLives,CO2:h.attrCo2,Energy:h.attrEnergy,Water:h.attrWater,Rating:h.impactRating})),'impact_attribution.csv')}>Export CSV</button>
        </div>
      </div>
      <div style={{fontSize:'12px',color:T.textMut,marginBottom:'8px',fontFamily:T.mono}}>{filtered.length} holdings</div>
      <div style={{overflowX:'auto'}}>
        <table style={st.table}>
          <thead><tr>
            <th style={st.th} onClick={()=>toggleSort('name')}>Holding</th>
            <th style={st.th}>Sector</th>
            <th style={st.th} onClick={()=>toggleSort('outstanding')}>Outstanding $M</th>
            <th style={st.th} onClick={()=>toggleSort('evic')}>EVIC $M</th>
            <th style={st.th} onClick={()=>toggleSort('attrFactor')}>Attr Factor</th>
            <th style={st.th} onClick={()=>toggleSort('attrJobs')}>Jobs</th>
            <th style={st.th} onClick={()=>toggleSort('attrCo2')}>CO2 (tCO2e)</th>
            <th style={st.th} onClick={()=>toggleSort('attrLives')}>Lives</th>
            <th style={st.th}>Rating</th>
          </tr></thead>
          <tbody>
            {filtered.slice(0,50).map(h=>(
              <tr key={h.id} style={{cursor:'pointer',background:selectedHolding?.id===h.id?T.surfaceH:'transparent'}} onClick={()=>setSelectedHolding(h)}>
                <td style={{...st.td,fontWeight:600,color:T.navy}}>{h.name}</td>
                <td style={st.td}>{h.sector}</td>
                <td style={st.td}>${h.outstanding}M</td>
                <td style={st.td}>${h.evic}M</td>
                <td style={st.td}>{h.attrFactor}</td>
                <td style={st.td}>{h.attrJobs.toLocaleString()}</td>
                <td style={st.td}>{h.attrCo2.toLocaleString()}</td>
                <td style={st.td}>{h.attrLives.toLocaleString()}</td>
                <td style={st.td}><span style={st.badge(h.impactRating.startsWith('A')?T.green:h.impactRating.startsWith('B')?T.amber:T.red)}>{h.impactRating}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {selectedHolding&&(<><div style={st.overlay} onClick={()=>setSelectedHolding(null)}/><div style={st.panel}>
        <div style={{display:'flex',justifyContent:'space-between',marginBottom:'20px'}}>
          <div><h3 style={{margin:0,fontSize:'18px',color:T.navy}}>{selectedHolding.name}</h3><div style={{fontSize:'12px',color:T.textSec,marginTop:'4px'}}>{selectedHolding.sector} | {selectedHolding.country} | {selectedHolding.methodology}</div></div>
          <button style={st.btn('outline')} onClick={()=>setSelectedHolding(null)}>Close</button>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'12px',marginBottom:'20px'}}>
          {[{l:'Outstanding',v:`$${selectedHolding.outstanding}M`},{l:'EVIC',v:`$${selectedHolding.evic}M`},{l:'Attribution',v:`${(selectedHolding.attrFactor*100).toFixed(1)}%`}].map((k,i)=>(
            <div key={i} style={{...st.card,textAlign:'center',padding:'12px'}}><div style={{fontSize:'20px',fontWeight:700,color:T.navy}}>{k.v}</div><div style={{fontSize:'10px',color:T.textMut}}>{k.l}</div></div>
          ))}
        </div>
        <h4 style={{fontSize:'14px',color:T.navy,marginBottom:'12px'}}>Attributed Impact</h4>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={[{name:'Jobs',company:selectedHolding.jobs,attributed:selectedHolding.attrJobs},{name:'CO2',company:Math.round(selectedHolding.co2/100),attributed:Math.round(selectedHolding.attrCo2/100)},{name:'Lives',company:Math.round(selectedHolding.lives/10),attributed:Math.round(selectedHolding.attrLives/10)}]} layout="vertical" margin={{left:50}}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
            <XAxis type="number" tick={{fontSize:10,fill:T.textSec}}/>
            <YAxis dataKey="name" type="category" tick={{fontSize:11,fill:T.textSec}}/>
            <Tooltip contentStyle={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:'6px',fontSize:'12px'}}/>
            <Legend/>
            <Bar dataKey="company" name="Company Total" fill={T.border} radius={[0,4,4,0]}/>
            <Bar dataKey="attributed" name="Attributed" fill={T.navy} radius={[0,4,4,0]}/>
          </BarChart>
        </ResponsiveContainer>
        <h4 style={{fontSize:'14px',color:T.navy,margin:'16px 0 12px'}}>IRIS+ Metrics</h4>
        <table style={st.table}><thead><tr><th style={st.th}>Metric</th><th style={st.th}>Value</th><th style={st.th}>Verified</th></tr></thead><tbody>
          {selectedHolding.irisMetrics.map((m,i)=>(
            <tr key={i}><td style={st.td}>{m.metric}</td><td style={st.td}>{m.value.toLocaleString()} {m.unit}</td><td style={st.td}>{m.verified?<span style={st.badge(T.green)}>Yes</span>:<span style={st.badge(T.red)}>No</span>}</td></tr>
          ))}
        </tbody></table>
        <h4 style={{fontSize:'14px',color:T.navy,margin:'16px 0 12px'}}>Quarterly Trend</h4>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={selectedHolding.trends} margin={{top:10,right:10,left:10,bottom:10}}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
            <XAxis dataKey="quarter" tick={{fontSize:9,fill:T.textSec}}/>
            <YAxis tick={{fontSize:9,fill:T.textSec}}/>
            <Tooltip contentStyle={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:'6px',fontSize:'11px'}}/>
            <Area type="monotone" dataKey="co2" stroke={T.sage} fill={T.sage} fillOpacity={0.2}/>
          </AreaChart>
        </ResponsiveContainer>
      </div></>)}
    </div>
  );

  const renderTab2=()=>{
    const scatterData=holdings.map(h=>({name:h.name,x:h.investedM,y:h.impactPerM,sector:h.sector,rating:h.impactRating}));
    const topEfficient=holdings.sort((a,b)=>b.impactPerM-a.impactPerM).slice(0,20);
    return(
      <div>
        <div style={st.card}>
          <h4 style={{margin:'0 0 12px',fontSize:'14px',color:T.navy}}>Impact Efficiency: Impact per $M Invested</h4>
          <ResponsiveContainer width="100%" height={350}>
            <ScatterChart margin={{top:10,right:30,bottom:30,left:30}}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
              <XAxis dataKey="x" name="Invested ($M)" tick={{fontSize:11,fill:T.textSec}} label={{value:'Invested ($M)',position:'insideBottom',offset:-10,fill:T.textSec,fontSize:12}}/>
              <YAxis dataKey="y" name="Impact/M" tick={{fontSize:11,fill:T.textSec}} label={{value:'Impact per $M',angle:-90,position:'insideLeft',fill:T.textSec,fontSize:12}}/>
              <Tooltip contentStyle={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:'6px',fontSize:'12px'}} formatter={(val,name)=>[typeof val==='number'?val.toFixed(1):val,name]}/>
              <Scatter data={scatterData} fill={T.navy} fillOpacity={0.6}>
                {scatterData.map((e,i)=>(<Cell key={i} fill={e.rating.startsWith('A')?T.green:e.rating.startsWith('B')?T.gold:T.red}/>))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </div>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'12px'}}>
          <h4 style={{margin:0,fontSize:'14px',color:T.navy}}>Top 20 Most Efficient Holdings</h4>
          <button style={st.btn('outline')} onClick={()=>exportCSV(topEfficient.map(h=>({Name:h.name,Sector:h.sector,Invested:h.investedM,ImpactPerM:h.impactPerM,Jobs:h.attrJobs,CO2:h.attrCo2,Rating:h.impactRating})),'impact_efficiency.csv')}>Export CSV</button>
        </div>
        <table style={st.table}>
          <thead><tr><th style={st.th}>#</th><th style={st.th}>Holding</th><th style={st.th}>Sector</th><th style={st.th}>Invested $M</th><th style={st.th}>Impact/M</th><th style={st.th}>Jobs/M</th><th style={st.th}>CO2/M</th><th style={st.th}>Rating</th></tr></thead>
          <tbody>{topEfficient.map((h,i)=>(
            <tr key={h.id}><td style={st.td}>{i+1}</td><td style={{...st.td,fontWeight:600,color:T.navy}}>{h.name}</td><td style={st.td}>{h.sector}</td><td style={st.td}>${h.investedM}M</td>
            <td style={st.td}><span style={st.badge(h.impactPerM>50?T.green:T.amber)}>{h.impactPerM}</span></td>
            <td style={st.td}>{Math.round(h.attrJobs/h.investedM)}</td><td style={st.td}>{Math.round(h.attrCo2/h.investedM)}</td>
            <td style={st.td}><span style={st.badge(h.impactRating.startsWith('A')?T.green:T.amber)}>{h.impactRating}</span></td></tr>
          ))}</tbody>
        </table>
      </div>
    );
  };

  const renderTab3=()=>(
    <div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 2fr',gap:'20px'}}>
        <div>
          <div style={st.card}>
            <h4 style={{margin:'0 0 12px',fontSize:'14px',color:T.navy}}>Report Configuration</h4>
            <div style={{marginBottom:'16px'}}>
              <div style={{fontSize:'11px',color:T.textMut,fontFamily:T.mono,marginBottom:'6px'}}>TARGET AUDIENCE</div>
              {['investors','board','regulators','public'].map(a=>(
                <label key={a} style={{display:'block',padding:'6px 0',fontSize:'13px',cursor:'pointer'}}>
                  <input type="radio" name="audience" checked={reportAudience===a} onChange={()=>setReportAudience(a)} style={{marginRight:'8px'}}/>{a.charAt(0).toUpperCase()+a.slice(1)}
                </label>
              ))}
            </div>
            <div style={{fontSize:'11px',color:T.textMut,fontFamily:T.mono,marginBottom:'6px'}}>SECTIONS</div>
            {reportSections.map((s,i)=>(
              <label key={i} style={{display:'flex',alignItems:'center',padding:'6px 0',fontSize:'13px',cursor:'pointer',gap:'8px'}}>
                <input type="checkbox" checked={s.enabled} onChange={()=>{const n=[...reportSections];n[i]={...n[i],enabled:!n[i].enabled};setReportSections(n);}}/>
                {s.name}
              </label>
            ))}
            <div style={{marginTop:'16px',display:'flex',gap:'8px'}}>
              <button style={st.btn('primary')} onClick={()=>exportCSV(holdings.map(h=>({Name:h.name,Sector:h.sector,Outstanding:h.outstanding,EVIC:h.evic,AttrJobs:h.attrJobs,AttrCO2:h.attrCo2,AttrLives:h.attrLives,ImpactPerM:h.impactPerM,Rating:h.impactRating,Methodology:h.methodology})),'impact_report_data.csv')}>Generate Report</button>
            </div>
          </div>
          <div style={{...st.card,background:T.surfaceH}}>
            <div style={{fontSize:'11px',color:T.textMut,fontFamily:T.mono,marginBottom:'8px'}}>FRAMEWORK ALIGNMENT</div>
            {['GIIN IRIS+','IMP Five Dimensions','OPIM Convergence','SDG Impact Standards'].map((f,i)=>(
              <div key={i} style={{display:'flex',justifyContent:'space-between',padding:'6px 0',fontSize:'12px',borderBottom:i<3?`1px solid ${T.border}`:'none'}}>
                <span>{f}</span><span style={st.badge(T.green)}>Aligned</span>
              </div>
            ))}
          </div>
        </div>
        <div>
          <div style={st.card}>
            <h4 style={{margin:'0 0 16px',fontSize:'16px',color:T.navy}}>Impact Report Preview — {reportAudience.charAt(0).toUpperCase()+reportAudience.slice(1)}</h4>
            {reportSections.filter(s=>s.enabled).map((s,i)=>(
              <div key={i} style={{marginBottom:'20px',padding:'16px',background:T.surfaceH,borderRadius:'8px',borderLeft:`3px solid ${T.navy}`}}>
                <h5 style={{margin:'0 0 8px',fontSize:'14px',color:T.navy}}>{i+1}. {s.name}</h5>
                <div style={{fontSize:'12px',color:T.textSec,lineHeight:'1.6'}}>
                  {s.name==='Executive Summary'&&`Portfolio of ${holdings.length} holdings generating ${aggKPIs[0].value} jobs, ${aggKPIs[2].value} tCO2e avoided. Average impact efficiency: ${Math.round(holdings.reduce((a,h)=>a+h.impactPerM,0)/holdings.length)} impact units per $M invested.`}
                  {s.name==='Portfolio Impact Overview'&&`Total invested: ${aggKPIs[5].value}. Methodology: PCAF-adapted impact attribution. ${holdings.filter(h=>h.impactRating.startsWith('A')).length} holdings rated A or above.`}
                  {s.name==='Environmental Impact'&&`${aggKPIs[2].value} tCO2e avoided, ${aggKPIs[3].value} MWh clean energy generated, ${aggKPIs[4].value} ML water saved.`}
                  {s.name==='Social Impact'&&`${aggKPIs[0].value} jobs created, ${aggKPIs[1].value} lives improved. Coverage across ${SECTORS.length} sectors.`}
                  {s.name==='SDG Alignment'&&`Portfolio contributes to 15 of 17 SDGs. Primary alignment: SDG 7, SDG 8, SDG 13.`}
                  {s.name.includes('Methodology')&&`Attribution factor = Outstanding / EVIC. Company-level impact scaled by investor ownership share.`}
                  {s.name.includes('Holding')&&`Detailed attribution for all ${holdings.length} holdings with per-metric breakdown.`}
                  {s.name.includes('IRIS')&&`${holdings.reduce((a,h)=>a+h.irisMetrics.length,0)} IRIS+ metrics tracked. ${holdings.reduce((a,h)=>a+h.irisMetrics.filter(m=>m.verified).length,0)} independently verified.`}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  return(
    <div style={st.page}>
      <div style={st.header}><h1 style={st.title}>Impact Attribution</h1><div style={st.subtitle}>EP-AW2 | 100 holdings | PCAF-adapted impact attribution model</div></div>
      <div style={st.kpiRow}>{aggKPIs.map((k,i)=>(<div key={i} style={st.kpiCard}><div style={st.kpiVal}>{k.value}</div><div style={st.kpiLabel}>{k.label}</div>{k.trend&&<div style={{fontSize:'11px',color:T.green}}>{k.trend}</div>}</div>))}</div>
      <div style={st.tabBar}>{tabs.map((t,i)=>(<button key={i} style={st.tabBtn(tab===i)} onClick={()=>setTab(i)}>{t}</button>))}</div>
      {tab===0&&renderTab0()}
      {tab===1&&renderTab1()}
      {tab===2&&renderTab2()}
      {tab===3&&renderTab3()}
    </div>
  );
}
