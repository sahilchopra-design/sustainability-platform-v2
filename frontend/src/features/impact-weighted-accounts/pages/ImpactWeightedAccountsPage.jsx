import React,{useState,useMemo,useCallback} from 'react';
import {BarChart,Bar,XAxis,YAxis,CartesianGrid,Tooltip,ResponsiveContainer,LineChart,Line,Cell,Legend,AreaChart,Area} from 'recharts';

const T={bg:'#f6f4f0',surface:'#ffffff',surfaceH:'#f0ede7',border:'#e5e0d8',borderL:'#d5cfc5',navy:'#1b3a5c',navyL:'#2c5a8c',gold:'#c5a96a',goldL:'#d4be8a',sage:'#5a8a6a',sageL:'#7ba67d',teal:'#5a8a6a',text:'#1b3a5c',textSec:'#5c6b7e',textMut:'#9aa3ae',red:'#dc2626',green:'#16a34a',amber:'#d97706',font:"'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"};
const sr=(s)=>{let x=Math.sin(s+1)*10000;return x-Math.floor(x);};

const SECTORS=['Technology','Healthcare','Financial Services','Energy','Consumer Goods','Industrials','Materials','Utilities','Real Estate','Telecom','Agriculture','Transportation'];
const COMPANY_PREFIXES=['Apex','Nova','Global','Prime','Stellar','Vertex','Zenith','Cascade','Meridian','Horizon','Summit','Pacific','Atlas','Quantum','Vanguard','Pinnacle','Nexus','Frontier','Crest','Forge'];
const COMPANY_SUFFIXES=['Corp','Industries','Holdings','Group','Partners','Capital','Solutions','Technologies','Systems','Dynamics'];
const QUARTERS=['Q1-23','Q2-23','Q3-23','Q4-23','Q1-24','Q2-24','Q3-24','Q4-24'];

const genCompanies=(count)=>{
  const out=[];
  for(let i=0;i<count;i++){
    const s1=sr(i*73+500),s2=sr(i*41+510),s3=sr(i*59+520);
    const pIdx=Math.floor(s1*COMPANY_PREFIXES.length);
    const sIdx=Math.floor(s2*COMPANY_SUFFIXES.length);
    const secIdx=Math.floor(s3*SECTORS.length);
    const revenue=Math.round((sr(i*31+530)*5000+200)*10)/10;
    const opProfit=Math.round(revenue*(sr(i*37+540)*0.25+0.05)*10)/10;
    const carbonCost=Math.round((sr(i*43+550)*revenue*0.08)*10)/10;
    const waterCost=Math.round((sr(i*47+560)*revenue*0.02)*10)/10;
    const wasteCost=Math.round((sr(i*53+570)*revenue*0.015)*10)/10;
    const biodiversityCost=Math.round((sr(i*61+580)*revenue*0.01)*10)/10;
    const totalEnvCost=Math.round((carbonCost+waterCost+wasteCost+biodiversityCost)*10)/10;
    const jobsQuality=Math.round((sr(i*67+590)*revenue*0.03-revenue*0.01)*10)/10;
    const livingWage=Math.round((sr(i*71+600)*revenue*0.02-revenue*0.005)*10)/10;
    const healthSafety=Math.round((sr(i*29+610)*revenue*0.01-revenue*0.003)*10)/10;
    const diversity=Math.round((sr(i*23+620)*revenue*0.015-revenue*0.002)*10)/10;
    const totalSocialValue=Math.round((jobsQuality+livingWage+healthSafety+diversity)*10)/10;
    const employmentImpact=Math.round((sr(i*83+630)*revenue*0.05-revenue*0.01)*10)/10;
    const productImpact=Math.round((sr(i*89+640)*revenue*0.04-revenue*0.015)*10)/10;
    const envImpact=-totalEnvCost;
    const totalImpact=Math.round((employmentImpact+productImpact+envImpact+totalSocialValue)*10)/10;
    const impactWeightedProfit=Math.round((opProfit+totalImpact)*10)/10;
    const weight=Math.round((sr(i*97+650)*3+0.1)*100)/100;
    const trendData=[];
    for(let q=0;q<8;q++){
      const qFactor=0.85+sr(i*11+q*17+660)*0.3;
      trendData.push({quarter:QUARTERS[q],tradProfit:Math.round(opProfit*qFactor/4*10)/10,iwProfit:Math.round(impactWeightedProfit*qFactor/4*10)/10,envCost:Math.round(totalEnvCost*qFactor/4*10)/10,socialVal:Math.round(totalSocialValue*qFactor/4*10)/10});
    }
    const tradReturn=Math.round((sr(i*101+670)*20-5)*100)/100;
    const impactReturn=Math.round((tradReturn+(totalImpact/revenue)*5)*100)/100;
    out.push({id:i+1,name:`${COMPANY_PREFIXES[pIdx]} ${COMPANY_SUFFIXES[sIdx]}`,sector:SECTORS[secIdx],country:['US','GB','DE','JP','FR','CH','AU','CA','SG','NL'][Math.floor(sr(i*19+680)*10)],revenue,opProfit,carbonCost,waterCost,wasteCost,biodiversityCost,totalEnvCost,jobsQuality,livingWage,healthSafety,diversity,totalSocialValue,employmentImpact,productImpact,envImpact,totalImpact,impactWeightedProfit,weight,trendData,tradReturn,impactReturn,impactAlpha:Math.round((impactReturn-tradReturn)*100)/100});
  }
  return out;
};

export default function ImpactWeightedAccountsPage(){
  const [tab,setTab]=useState(0);
  const [search,setSearch]=useState('');
  const [sortKey,setSortKey]=useState('impactWeightedProfit');
  const [sortDir,setSortDir]=useState('desc');
  const [selectedCompany,setSelectedCompany]=useState(null);
  const [sectorFilter,setSectorFilter]=useState('All');

  const companies=useMemo(()=>genCompanies(80),[]);

  const filtered=useMemo(()=>{
    let f=companies.filter(c=>c.name.toLowerCase().includes(search.toLowerCase())||c.sector.toLowerCase().includes(search.toLowerCase()));
    if(sectorFilter!=='All')f=f.filter(c=>c.sector===sectorFilter);
    f.sort((a,b)=>sortDir==='desc'?(b[sortKey]||0)-(a[sortKey]||0):(a[sortKey]||0)-(b[sortKey]||0));
    return f;
  },[companies,search,sortKey,sortDir,sectorFilter]);

  const toggleSort=(key)=>{if(sortKey===key)setSortDir(d=>d==='desc'?'asc':'desc');else{setSortKey(key);setSortDir('desc');}};

  const exportCSV=(data,filename)=>{
    if(!data||!data.length)return;
    const keys=Object.keys(data[0]).filter(k=>typeof data[0][k]!=='object');
    const csv=[keys.join(','),...data.map(r=>keys.map(k=>JSON.stringify(r[k]??'')).join(','))].join('\n');
    const blob=new Blob([csv],{type:'text/csv'});
    const url=URL.createObjectURL(blob);
    const a=document.createElement('a');a.href=url;a.download=filename;a.click();URL.revokeObjectURL(url);
  };

  const tabs=['Impact P&L','Environmental Costs','Social Value','Impact-Weighted Returns'];
  const st={page:{fontFamily:T.font,background:T.bg,minHeight:'100vh',padding:'24px',color:T.text},header:{marginBottom:'24px'},title:{fontSize:'28px',fontWeight:700,color:T.navy,margin:0},subtitle:{fontSize:'14px',color:T.textSec,marginTop:'4px',fontFamily:T.mono},kpiRow:{display:'grid',gridTemplateColumns:'repeat(6,1fr)',gap:'12px',marginBottom:'20px'},kpiCard:{background:T.surface,border:`1px solid ${T.border}`,borderRadius:'8px',padding:'16px',textAlign:'center'},kpiVal:{fontSize:'22px',fontWeight:700,color:T.navy},kpiLabel:{fontSize:'11px',color:T.textMut,fontFamily:T.mono,marginTop:'4px'},tabBar:{display:'flex',gap:'4px',marginBottom:'20px',borderBottom:`2px solid ${T.border}`},tabBtn:(a)=>({padding:'10px 20px',background:a?T.navy:'transparent',color:a?'#fff':T.textSec,border:'none',borderRadius:'6px 6px 0 0',cursor:'pointer',fontFamily:T.font,fontSize:'13px',fontWeight:a?600:400}),card:{background:T.surface,border:`1px solid ${T.border}`,borderRadius:'8px',padding:'20px',marginBottom:'16px'},searchBar:{padding:'10px 16px',border:`1px solid ${T.border}`,borderRadius:'6px',width:'280px',fontFamily:T.font,fontSize:'13px',background:T.surface,outline:'none'},table:{width:'100%',borderCollapse:'collapse',fontSize:'12px',fontFamily:T.mono},th:{padding:'10px 12px',textAlign:'left',borderBottom:`2px solid ${T.border}`,color:T.textSec,cursor:'pointer',fontSize:'11px',fontWeight:600,textTransform:'uppercase',letterSpacing:'0.5px'},td:{padding:'10px 12px',borderBottom:`1px solid ${T.border}`},badge:(c)=>({display:'inline-block',padding:'2px 8px',borderRadius:'4px',fontSize:'10px',fontWeight:600,background:c+'20',color:c}),panel:{position:'fixed',top:0,right:0,width:'560px',height:'100vh',background:T.surface,borderLeft:`2px solid ${T.border}`,padding:'24px',overflowY:'auto',zIndex:1000,boxShadow:'-4px 0 20px rgba(0,0,0,0.1)'},overlay:{position:'fixed',top:0,left:0,width:'100vw',height:'100vh',background:'rgba(0,0,0,0.3)',zIndex:999},btn:(v)=>({padding:'8px 16px',borderRadius:'6px',border:v==='outline'?`1px solid ${T.border}`:'none',background:v==='primary'?T.navy:v==='outline'?'transparent':T.surfaceH,color:v==='primary'?'#fff':T.text,cursor:'pointer',fontFamily:T.font,fontSize:'12px',fontWeight:500})};

  const agg=useMemo(()=>{
    const totRev=Math.round(companies.reduce((a,c)=>a+c.revenue,0));
    const totOp=Math.round(companies.reduce((a,c)=>a+c.opProfit,0));
    const totIW=Math.round(companies.reduce((a,c)=>a+c.impactWeightedProfit,0));
    const totEnv=Math.round(companies.reduce((a,c)=>a+c.totalEnvCost,0));
    const totSoc=Math.round(companies.reduce((a,c)=>a+c.totalSocialValue,0));
    const avgAlpha=Math.round(companies.reduce((a,c)=>a+c.impactAlpha,0)/companies.length*100)/100;
    return[{label:'Total Revenue',value:`$${(totRev/1000).toFixed(0)}B`},{label:'Operating Profit',value:`$${(totOp/1000).toFixed(1)}B`},{label:'IW Profit',value:`$${(totIW/1000).toFixed(1)}B`},{label:'Env Externalities',value:`-$${(totEnv/1000).toFixed(1)}B`},{label:'Social Value',value:`$${(totSoc/1000).toFixed(1)}B`},{label:'Avg Impact Alpha',value:`${avgAlpha}%`}];
  },[companies]);

  const renderTab0=()=>(
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'16px'}}>
        <input style={st.searchBar} placeholder="Search companies..." value={search} onChange={e=>setSearch(e.target.value)}/>
        <div style={{display:'flex',gap:'8px'}}>
          <select style={{...st.searchBar,width:'160px'}} value={sectorFilter} onChange={e=>setSectorFilter(e.target.value)}>
            <option value="All">All Sectors</option>{SECTORS.map(s=>(<option key={s} value={s}>{s}</option>))}
          </select>
          <button style={st.btn('outline')} onClick={()=>exportCSV(filtered.map(c=>({Name:c.name,Sector:c.sector,Revenue:c.revenue,OpProfit:c.opProfit,EmploymentImpact:c.employmentImpact,ProductImpact:c.productImpact,EnvImpact:c.envImpact,SocialValue:c.totalSocialValue,TotalImpact:c.totalImpact,IWProfit:c.impactWeightedProfit})),'impact_pl.csv')}>Export CSV</button>
        </div>
      </div>
      <div style={st.card}>
        <h4 style={{margin:'0 0 12px',fontSize:'14px',color:T.navy}}>Traditional vs Impact-Weighted Profit by Sector</h4>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={SECTORS.map(s=>{const sc=companies.filter(c=>c.sector===s);return{sector:s,tradProfit:Math.round(sc.reduce((a,c)=>a+c.opProfit,0)),iwProfit:Math.round(sc.reduce((a,c)=>a+c.impactWeightedProfit,0))};})} margin={{top:10,right:30,left:10,bottom:40}}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
            <XAxis dataKey="sector" tick={{fontSize:9,fill:T.textSec,angle:-25,textAnchor:'end'}}/>
            <YAxis tick={{fontSize:11,fill:T.textSec}} label={{value:'$M',angle:-90,position:'insideLeft',fill:T.textSec,fontSize:11}}/>
            <Tooltip contentStyle={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:'6px',fontSize:'12px'}}/>
            <Legend/>
            <Bar dataKey="tradProfit" name="Traditional Profit" fill={T.navy} radius={[4,4,0,0]}/>
            <Bar dataKey="iwProfit" name="IW Profit" fill={T.sage} radius={[4,4,0,0]}/>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <table style={st.table}>
        <thead><tr>
          <th style={st.th} onClick={()=>toggleSort('name')}>Company</th>
          <th style={st.th}>Sector</th>
          <th style={st.th} onClick={()=>toggleSort('revenue')}>Revenue $M</th>
          <th style={st.th} onClick={()=>toggleSort('opProfit')}>Op Profit $M</th>
          <th style={st.th} onClick={()=>toggleSort('employmentImpact')}>Employment $M</th>
          <th style={st.th} onClick={()=>toggleSort('productImpact')}>Product $M</th>
          <th style={st.th} onClick={()=>toggleSort('envImpact')}>Env $M</th>
          <th style={st.th} onClick={()=>toggleSort('totalImpact')}>Total Impact $M</th>
          <th style={st.th} onClick={()=>toggleSort('impactWeightedProfit')}>IW Profit $M</th>
        </tr></thead>
        <tbody>{filtered.slice(0,50).map(c=>(
          <tr key={c.id} style={{cursor:'pointer',background:selectedCompany?.id===c.id?T.surfaceH:'transparent'}} onClick={()=>setSelectedCompany(c)}>
            <td style={{...st.td,fontWeight:600,color:T.navy}}>{c.name}</td><td style={st.td}>{c.sector}</td>
            <td style={st.td}>{c.revenue.toLocaleString()}</td><td style={st.td}>{c.opProfit.toLocaleString()}</td>
            <td style={st.td}><span style={{color:c.employmentImpact>=0?T.green:T.red}}>{c.employmentImpact}</span></td>
            <td style={st.td}><span style={{color:c.productImpact>=0?T.green:T.red}}>{c.productImpact}</span></td>
            <td style={st.td}><span style={{color:T.red}}>{c.envImpact}</span></td>
            <td style={st.td}><span style={st.badge(c.totalImpact>=0?T.green:T.red)}>{c.totalImpact}</span></td>
            <td style={{...st.td,fontWeight:600}}><span style={{color:c.impactWeightedProfit>=0?T.green:T.red}}>{c.impactWeightedProfit}</span></td>
          </tr>
        ))}</tbody>
      </table>
      {selectedCompany&&(<><div style={st.overlay} onClick={()=>setSelectedCompany(null)}/><div style={st.panel}>
        <div style={{display:'flex',justifyContent:'space-between',marginBottom:'20px'}}>
          <div><h3 style={{margin:0,fontSize:'18px',color:T.navy}}>{selectedCompany.name}</h3><div style={{fontSize:'12px',color:T.textSec,marginTop:'4px'}}>{selectedCompany.sector} | {selectedCompany.country}</div></div>
          <button style={st.btn('outline')} onClick={()=>setSelectedCompany(null)}>Close</button>
        </div>
        <div style={{...st.card,padding:'16px'}}>
          <h4 style={{margin:'0 0 12px',fontSize:'14px',color:T.navy}}>Impact P&L Waterfall</h4>
          <table style={{...st.table,fontSize:'13px'}}>
            <tbody>
              {[{l:'Revenue',v:selectedCompany.revenue,c:T.navy},{l:'Operating Profit',v:selectedCompany.opProfit,c:T.navy},{l:'+ Employment Impact',v:selectedCompany.employmentImpact,c:selectedCompany.employmentImpact>=0?T.green:T.red},{l:'+ Product Impact',v:selectedCompany.productImpact,c:selectedCompany.productImpact>=0?T.green:T.red},{l:'- Environmental Costs',v:selectedCompany.envImpact,c:T.red},{l:'+ Social Value',v:selectedCompany.totalSocialValue,c:selectedCompany.totalSocialValue>=0?T.green:T.red}].map((r,i)=>(
                <tr key={i} style={{borderBottom:`1px solid ${T.border}`}}><td style={{...st.td,fontWeight:500}}>{r.l}</td><td style={{...st.td,textAlign:'right',fontWeight:600,color:r.c}}>${r.v}M</td></tr>
              ))}
              <tr style={{background:T.surfaceH}}><td style={{...st.td,fontWeight:700,fontSize:'14px'}}>Impact-Weighted Profit</td><td style={{...st.td,textAlign:'right',fontWeight:700,fontSize:'14px',color:selectedCompany.impactWeightedProfit>=0?T.green:T.red}}>${selectedCompany.impactWeightedProfit}M</td></tr>
            </tbody>
          </table>
        </div>
        <div style={st.card}>
          <h4 style={{margin:'0 0 12px',fontSize:'14px',color:T.navy}}>Quarterly Trend</h4>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={selectedCompany.trendData} margin={{top:10,right:10,left:10,bottom:10}}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
              <XAxis dataKey="quarter" tick={{fontSize:10,fill:T.textSec}}/>
              <YAxis tick={{fontSize:10,fill:T.textSec}}/>
              <Tooltip contentStyle={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:'6px',fontSize:'11px'}}/>
              <Legend/>
              <Line type="monotone" dataKey="tradProfit" name="Trad Profit" stroke={T.navy} strokeWidth={2}/>
              <Line type="monotone" dataKey="iwProfit" name="IW Profit" stroke={T.sage} strokeWidth={2}/>
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px'}}>
          <div style={{...st.card,padding:'12px'}}>
            <div style={{fontSize:'11px',fontWeight:600,color:T.textMut,marginBottom:'6px'}}>ENVIRONMENTAL COSTS</div>
            {[{l:'Carbon',v:selectedCompany.carbonCost},{l:'Water',v:selectedCompany.waterCost},{l:'Waste',v:selectedCompany.wasteCost},{l:'Biodiversity',v:selectedCompany.biodiversityCost}].map((r,i)=>(
              <div key={i} style={{display:'flex',justifyContent:'space-between',padding:'4px 0',fontSize:'12px'}}><span style={{color:T.textSec}}>{r.l}</span><span style={{color:T.red,fontWeight:500}}>-${r.v}M</span></div>
            ))}
          </div>
          <div style={{...st.card,padding:'12px'}}>
            <div style={{fontSize:'11px',fontWeight:600,color:T.textMut,marginBottom:'6px'}}>SOCIAL VALUE</div>
            {[{l:'Jobs Quality',v:selectedCompany.jobsQuality},{l:'Living Wage',v:selectedCompany.livingWage},{l:'Health & Safety',v:selectedCompany.healthSafety},{l:'Diversity',v:selectedCompany.diversity}].map((r,i)=>(
              <div key={i} style={{display:'flex',justifyContent:'space-between',padding:'4px 0',fontSize:'12px'}}><span style={{color:T.textSec}}>{r.l}</span><span style={{color:r.v>=0?T.green:T.red,fontWeight:500}}>${r.v}M</span></div>
            ))}
          </div>
        </div>
      </div></>)}
    </div>
  );

  const renderTab1=()=>(
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'16px'}}>
        <h3 style={{margin:0,fontSize:'16px',color:T.navy}}>Environmental Externality Costs (Monetized)</h3>
        <button style={st.btn('outline')} onClick={()=>exportCSV(filtered.map(c=>({Name:c.name,Sector:c.sector,CarbonCost:c.carbonCost,WaterCost:c.waterCost,WasteCost:c.wasteCost,BiodiversityCost:c.biodiversityCost,TotalEnvCost:c.totalEnvCost})),'environmental_costs.csv')}>Export CSV</button>
      </div>
      <div style={st.card}>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={SECTORS.map(s=>{const sc=companies.filter(c=>c.sector===s);return{sector:s,carbon:Math.round(sc.reduce((a,c)=>a+c.carbonCost,0)),water:Math.round(sc.reduce((a,c)=>a+c.waterCost,0)),waste:Math.round(sc.reduce((a,c)=>a+c.wasteCost,0)),biodiversity:Math.round(sc.reduce((a,c)=>a+c.biodiversityCost,0))};})} margin={{top:10,right:30,left:10,bottom:40}}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
            <XAxis dataKey="sector" tick={{fontSize:9,fill:T.textSec,angle:-25,textAnchor:'end'}}/>
            <YAxis tick={{fontSize:11,fill:T.textSec}} label={{value:'$M',angle:-90,position:'insideLeft',fill:T.textSec,fontSize:11}}/>
            <Tooltip contentStyle={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:'6px',fontSize:'12px'}}/>
            <Legend/>
            <Bar dataKey="carbon" name="Carbon" stackId="a" fill={T.navy}/>
            <Bar dataKey="water" name="Water" stackId="a" fill={T.navyL}/>
            <Bar dataKey="waste" name="Waste" stackId="a" fill={T.gold}/>
            <Bar dataKey="biodiversity" name="Biodiversity" stackId="a" fill={T.sage} radius={[4,4,0,0]}/>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <table style={st.table}>
        <thead><tr>
          <th style={st.th} onClick={()=>toggleSort('name')}>Company</th><th style={st.th}>Sector</th>
          <th style={st.th} onClick={()=>toggleSort('carbonCost')}>Carbon $M</th>
          <th style={st.th} onClick={()=>toggleSort('waterCost')}>Water $M</th>
          <th style={st.th} onClick={()=>toggleSort('wasteCost')}>Waste $M</th>
          <th style={st.th} onClick={()=>toggleSort('biodiversityCost')}>Biodiversity $M</th>
          <th style={st.th} onClick={()=>toggleSort('totalEnvCost')}>Total Env $M</th>
          <th style={st.th}>% of Revenue</th>
        </tr></thead>
        <tbody>{filtered.slice(0,50).map(c=>(
          <tr key={c.id}><td style={{...st.td,fontWeight:600,color:T.navy}}>{c.name}</td><td style={st.td}>{c.sector}</td>
          <td style={{...st.td,color:T.red}}>{c.carbonCost}</td><td style={{...st.td,color:T.red}}>{c.waterCost}</td>
          <td style={{...st.td,color:T.red}}>{c.wasteCost}</td><td style={{...st.td,color:T.red}}>{c.biodiversityCost}</td>
          <td style={{...st.td,fontWeight:600,color:T.red}}>{c.totalEnvCost}</td>
          <td style={st.td}>{(c.totalEnvCost/c.revenue*100).toFixed(1)}%</td></tr>
        ))}</tbody>
      </table>
    </div>
  );

  const renderTab2=()=>(
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'16px'}}>
        <h3 style={{margin:0,fontSize:'16px',color:T.navy}}>Social Value (Monetized)</h3>
        <button style={st.btn('outline')} onClick={()=>exportCSV(filtered.map(c=>({Name:c.name,Sector:c.sector,JobsQuality:c.jobsQuality,LivingWage:c.livingWage,HealthSafety:c.healthSafety,Diversity:c.diversity,TotalSocial:c.totalSocialValue})),'social_value.csv')}>Export CSV</button>
      </div>
      <div style={st.card}>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={SECTORS.map(s=>{const sc=companies.filter(c=>c.sector===s);return{sector:s,jobs:Math.round(sc.reduce((a,c)=>a+c.jobsQuality,0)),wage:Math.round(sc.reduce((a,c)=>a+c.livingWage,0)),health:Math.round(sc.reduce((a,c)=>a+c.healthSafety,0)),diversity:Math.round(sc.reduce((a,c)=>a+c.diversity,0))};})} margin={{top:10,right:30,left:10,bottom:40}}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
            <XAxis dataKey="sector" tick={{fontSize:9,fill:T.textSec,angle:-25,textAnchor:'end'}}/>
            <YAxis tick={{fontSize:11,fill:T.textSec}} label={{value:'$M',angle:-90,position:'insideLeft',fill:T.textSec,fontSize:11}}/>
            <Tooltip contentStyle={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:'6px',fontSize:'12px'}}/>
            <Legend/>
            <Bar dataKey="jobs" name="Jobs Quality" stackId="a" fill={T.green}/>
            <Bar dataKey="wage" name="Living Wage" stackId="a" fill={T.sage}/>
            <Bar dataKey="health" name="Health & Safety" stackId="a" fill={T.gold}/>
            <Bar dataKey="diversity" name="Diversity" stackId="a" fill={T.navyL} radius={[4,4,0,0]}/>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <table style={st.table}>
        <thead><tr>
          <th style={st.th} onClick={()=>toggleSort('name')}>Company</th><th style={st.th}>Sector</th>
          <th style={st.th} onClick={()=>toggleSort('jobsQuality')}>Jobs Quality $M</th>
          <th style={st.th} onClick={()=>toggleSort('livingWage')}>Living Wage $M</th>
          <th style={st.th} onClick={()=>toggleSort('healthSafety')}>Health & Safety $M</th>
          <th style={st.th} onClick={()=>toggleSort('diversity')}>Diversity $M</th>
          <th style={st.th} onClick={()=>toggleSort('totalSocialValue')}>Total Social $M</th>
        </tr></thead>
        <tbody>{filtered.slice(0,50).map(c=>(
          <tr key={c.id}><td style={{...st.td,fontWeight:600,color:T.navy}}>{c.name}</td><td style={st.td}>{c.sector}</td>
          <td style={{...st.td,color:c.jobsQuality>=0?T.green:T.red}}>{c.jobsQuality}</td>
          <td style={{...st.td,color:c.livingWage>=0?T.green:T.red}}>{c.livingWage}</td>
          <td style={{...st.td,color:c.healthSafety>=0?T.green:T.red}}>{c.healthSafety}</td>
          <td style={{...st.td,color:c.diversity>=0?T.green:T.red}}>{c.diversity}</td>
          <td style={{...st.td,fontWeight:600,color:c.totalSocialValue>=0?T.green:T.red}}>{c.totalSocialValue}</td></tr>
        ))}</tbody>
      </table>
    </div>
  );

  const renderTab3=()=>{
    const portTrendData=QUARTERS.map((q,qi)=>{
      const tradSum=companies.reduce((a,c)=>a+(c.trendData[qi]?.tradProfit||0),0);
      const iwSum=companies.reduce((a,c)=>a+(c.trendData[qi]?.iwProfit||0),0);
      return{quarter:q,tradReturn:Math.round(tradSum/10)/10,iwReturn:Math.round(iwSum/10)/10};
    });
    return(
      <div>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'16px'}}>
          <h3 style={{margin:0,fontSize:'16px',color:T.navy}}>Portfolio Impact-Weighted Returns</h3>
          <button style={st.btn('outline')} onClick={()=>exportCSV(filtered.map(c=>({Name:c.name,Sector:c.sector,TradReturn:c.tradReturn,ImpactReturn:c.impactReturn,ImpactAlpha:c.impactAlpha,Weight:c.weight})),'iw_returns.csv')}>Export CSV</button>
        </div>
        <div style={st.card}>
          <h4 style={{margin:'0 0 12px',fontSize:'14px',color:T.navy}}>Traditional vs Impact-Weighted Returns (Quarterly)</h4>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={portTrendData} margin={{top:10,right:30,left:10,bottom:10}}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
              <XAxis dataKey="quarter" tick={{fontSize:11,fill:T.textSec}}/>
              <YAxis tick={{fontSize:11,fill:T.textSec}} label={{value:'Return ($M)',angle:-90,position:'insideLeft',fill:T.textSec,fontSize:11}}/>
              <Tooltip contentStyle={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:'6px',fontSize:'12px'}}/>
              <Legend/>
              <Area type="monotone" dataKey="tradReturn" name="Traditional" stroke={T.navy} fill={T.navy} fillOpacity={0.1} strokeWidth={2}/>
              <Area type="monotone" dataKey="iwReturn" name="Impact-Weighted" stroke={T.sage} fill={T.sage} fillOpacity={0.1} strokeWidth={2}/>
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div style={st.card}>
          <h4 style={{margin:'0 0 12px',fontSize:'14px',color:T.navy}}>Impact Alpha Decomposition by Sector</h4>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={SECTORS.map(s=>{const sc=companies.filter(c=>c.sector===s);const avg=sc.length?Math.round(sc.reduce((a,c)=>a+c.impactAlpha,0)/sc.length*100)/100:0;return{sector:s,alpha:avg};})} margin={{top:10,right:30,left:10,bottom:40}}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
              <XAxis dataKey="sector" tick={{fontSize:9,fill:T.textSec,angle:-25,textAnchor:'end'}}/>
              <YAxis tick={{fontSize:11,fill:T.textSec}} label={{value:'Impact Alpha %',angle:-90,position:'insideLeft',fill:T.textSec,fontSize:11}}/>
              <Tooltip contentStyle={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:'6px',fontSize:'12px'}}/>
              <Bar dataKey="alpha" name="Impact Alpha %" radius={[4,4,0,0]}>
                {SECTORS.map((s,i)=>{const sc=companies.filter(c=>c.sector===s);const avg=sc.length?sc.reduce((a,c)=>a+c.impactAlpha,0)/sc.length:0;return(<Cell key={i} fill={avg>=0?T.green:T.red}/>);})}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <table style={st.table}>
          <thead><tr>
            <th style={st.th} onClick={()=>toggleSort('name')}>Company</th><th style={st.th}>Sector</th>
            <th style={st.th} onClick={()=>toggleSort('tradReturn')}>Trad Return %</th>
            <th style={st.th} onClick={()=>toggleSort('impactReturn')}>IW Return %</th>
            <th style={st.th} onClick={()=>toggleSort('impactAlpha')}>Impact Alpha %</th>
            <th style={st.th} onClick={()=>toggleSort('weight')}>Weight %</th>
          </tr></thead>
          <tbody>{filtered.slice(0,50).map(c=>(
            <tr key={c.id}><td style={{...st.td,fontWeight:600,color:T.navy}}>{c.name}</td><td style={st.td}>{c.sector}</td>
            <td style={st.td}>{c.tradReturn}%</td>
            <td style={st.td}>{c.impactReturn}%</td>
            <td style={st.td}><span style={st.badge(c.impactAlpha>=0?T.green:T.red)}>{c.impactAlpha}%</span></td>
            <td style={st.td}>{c.weight}%</td></tr>
          ))}</tbody>
        </table>
      </div>
    );
  };

  return(
    <div style={st.page}>
      <div style={st.header}><h1 style={st.title}>Impact-Weighted Accounts</h1><div style={st.subtitle}>EP-AW4 | Harvard IMP/IWAI | 80 companies | Monetized externalities</div></div>
      <div style={st.kpiRow}>{agg.map((k,i)=>(<div key={i} style={st.kpiCard}><div style={st.kpiVal}>{k.value}</div><div style={st.kpiLabel}>{k.label}</div></div>))}</div>
      <div style={st.tabBar}>{tabs.map((t,i)=>(<button key={i} style={st.tabBtn(tab===i)} onClick={()=>setTab(i)}>{t}</button>))}</div>
      {tab===0&&renderTab0()}
      {tab===1&&renderTab1()}
      {tab===2&&renderTab2()}
      {tab===3&&renderTab3()}
    </div>
  );
}
