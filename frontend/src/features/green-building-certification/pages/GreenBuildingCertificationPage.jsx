import React,{useState,useMemo} from 'react';
import {BarChart,Bar,XAxis,YAxis,CartesianGrid,Tooltip,ResponsiveContainer,RadarChart,Radar,PolarGrid,PolarAngleAxis,PolarRadiusAxis,Cell,Legend,ScatterChart,Scatter,PieChart,Pie} from 'recharts';

const T={bg:'#f6f4f0',surface:'#ffffff',surfaceH:'#f0ede7',border:'#e5e0d8',borderL:'#d5cfc5',navy:'#1b3a5c',navyL:'#2c5a8c',gold:'#c5a96a',goldL:'#d4be8a',sage:'#5a8a6a',sageL:'#7ba67d',teal:'#5a8a6a',text:'#1b3a5c',textSec:'#5c6b7e',textMut:'#9aa3ae',red:'#dc2626',green:'#16a34a',amber:'#d97706',font:"'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"};
const sr=(s)=>{let x=Math.sin(s+1)*10000;return x-Math.floor(x);};

const TABS=['Certification Dashboard','Scheme Comparison','Green Premium Analysis','Certification Planner'];
const SCHEMES=['LEED','BREEAM','WELL','NABERS','DGNB','HQE'];
const SCHEME_COLORS={'LEED':'#16a34a','BREEAM':'#2563eb','WELL':'#7c3aed','NABERS':'#ea580c','DGNB':'#0891b2','HQE':'#be185d'};
const LEVELS={'LEED':['Certified','Silver','Gold','Platinum'],'BREEAM':['Pass','Good','Very Good','Excellent','Outstanding'],'WELL':['Bronze','Silver','Gold','Platinum'],'NABERS':['1 Star','2 Star','3 Star','4 Star','5 Star','6 Star'],'DGNB':['Bronze','Silver','Gold','Platinum'],'HQE':['Pass','Good','Very Good','Excellent']};
const TYPES=['Office','Retail','Residential','Industrial','Mixed-Use'];
const CITIES=['London','Manchester','Birmingham','Edinburgh','Bristol','Frankfurt','Paris','Amsterdam','Sydney','Singapore'];

const certBuildings=Array.from({length:100},(_,i)=>{
  const s=sr(i*7+3);const s2=sr(i*11+5);const s3=sr(i*13+7);const s4=sr(i*17+11);const s5=sr(i*19+13);const s6=sr(i*23+17);
  const type=TYPES[Math.floor(s*5)];const city=CITIES[Math.floor(s2*CITIES.length)];
  const area=Math.floor(1000+s3*48000);const yearBuilt=Math.floor(1990+s4*35);
  const numCerts=Math.floor(s5*3.5);const certs=[];
  const allSchemes=[...SCHEMES];
  for(let c=0;c<numCerts&&allSchemes.length>0;c++){
    const idx=Math.floor(sr(i*31+c*7)*allSchemes.length);
    const scheme=allSchemes.splice(idx,1)[0];
    const levels=LEVELS[scheme];const level=levels[Math.floor(sr(i*37+c*11)*levels.length)];
    const certYear=Math.floor(2018+sr(i*41+c*13)*7);
    const expiryYear=certYear+3+Math.floor(sr(i*43+c*17)*3);
    certs.push({scheme,level,certYear,expiryYear,score:Math.floor(40+sr(i*47+c*19)*60)});
  }
  const certified=certs.length>0;
  const rentPsf=Math.floor((type==='Office'?45:type==='Retail'?35:type==='Residential'?28:type==='Industrial'?12:38)*(certified?1.08+s6*0.12:0.85+s6*0.15));
  const capRate=+(certified?4.2+s3*1.5:5.0+s3*2.0).toFixed(2);
  const vacancy=+(certified?3+s4*7:6+s4*14).toFixed(1);
  const value=Math.floor(area*rentPsf/(capRate/100));
  return{id:i+1,name:`${city} ${type} ${i+1}`,type,city,area,yearBuilt,certifications:certs,certified,numCerts:certs.length,rentPsf,capRate,vacancy,value,epcRating:['A','B','C','D'][Math.floor(s*4)],energyIntensity:Math.floor(80+s2*200),co2Intensity:Math.floor(15+s3*50)};
});

const schemeData=SCHEMES.map((scheme,i)=>{
  const s=sr(i*71+31);const s2=sr(i*73+37);
  return{scheme,buildings:certBuildings.filter(b=>b.certifications.some(c=>c.scheme===scheme)).length,
    categories:{energy:Math.floor(60+s*40),water:Math.floor(50+s2*50),materials:Math.floor(40+sr(i*77)*60),health:Math.floor(55+sr(i*79)*45),transport:Math.floor(45+sr(i*83)*55),management:Math.floor(50+sr(i*89)*50),innovation:Math.floor(30+sr(i*91)*70),land:Math.floor(40+sr(i*97)*60)},
    costPerSqm:Math.floor(8+s*25),timeMonths:Math.floor(6+s2*18),marketRecognition:Math.floor(60+s*40),
    renewalYears:3+Math.floor(s2*3),globalProjects:Math.floor(5000+s*95000)};
});

const sty={
  page:{fontFamily:T.font,background:T.bg,minHeight:'100vh',padding:'24px',color:T.text},
  header:{marginBottom:20},
  title:{fontSize:22,fontWeight:700,color:T.navy,margin:0},
  subtitle:{fontSize:13,color:T.textSec,fontFamily:T.mono,marginTop:4},
  tabs:{display:'flex',gap:2,marginBottom:20,borderBottom:`2px solid ${T.border}`},
  tab:(a)=>({padding:'10px 20px',cursor:'pointer',fontSize:13,fontWeight:a?700:500,color:a?T.navy:T.textSec,borderBottom:a?`3px solid ${T.gold}`:'3px solid transparent',background:a?T.surfaceH:'transparent',transition:'all 0.2s'}),
  card:{background:T.surface,border:`1px solid ${T.border}`,borderRadius:8,padding:20,marginBottom:16},
  cardTitle:{fontSize:15,fontWeight:700,color:T.navy,marginBottom:12},
  kpiRow:{display:'flex',gap:12,flexWrap:'wrap',marginBottom:16},
  kpi:{flex:'1 1 160px',background:T.surfaceH,border:`1px solid ${T.borderL}`,borderRadius:8,padding:16,textAlign:'center'},
  kpiVal:{fontSize:24,fontWeight:700,color:T.navy,fontFamily:T.mono},
  kpiLabel:{fontSize:11,color:T.textMut,marginTop:4},
  table:{width:'100%',borderCollapse:'collapse',fontSize:12,fontFamily:T.mono},
  th:{padding:'8px 10px',textAlign:'left',borderBottom:`2px solid ${T.border}`,color:T.textSec,fontWeight:600,fontSize:11,position:'sticky',top:0,background:T.surface},
  td:{padding:'7px 10px',borderBottom:`1px solid ${T.border}`},
  badge:(c)=>({display:'inline-block',padding:'2px 10px',borderRadius:10,fontSize:11,fontWeight:600,background:c+'22',color:c}),
  filterRow:{display:'flex',gap:10,marginBottom:14,flexWrap:'wrap',alignItems:'center'},
  select:{padding:'6px 12px',borderRadius:6,border:`1px solid ${T.border}`,fontSize:12,fontFamily:T.font,background:T.surface,color:T.text},
  grid2:{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16},
  grid3:{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:16},
  scrollBox:{maxHeight:440,overflowY:'auto'},
  pill:(a)=>({padding:'4px 14px',borderRadius:20,fontSize:12,cursor:'pointer',fontWeight:a?700:500,background:a?T.navy:T.surfaceH,color:a?'#fff':T.text,border:`1px solid ${a?T.navy:T.border}`}),
  exportBtn:{padding:'8px 18px',borderRadius:6,background:T.navy,color:'#fff',border:'none',fontSize:12,cursor:'pointer',fontWeight:600},
};

export default function GreenBuildingCertificationPage(){
  const[tab,setTab]=useState(0);
  const[typeFilter,setTypeFilter]=useState('All');
  const[schemeFilter,setSchemeFilter]=useState('All');
  const[certFilter,setCertFilter]=useState('All');
  const[sortCol,setSortCol]=useState('numCerts');
  const[sortDir,setSortDir]=useState('desc');
  const[selectedSchemes,setSelectedSchemes]=useState(['LEED','BREEAM','WELL']);
  const[selectedBuilding,setSelectedBuilding]=useState(null);
  const[plannerType,setPlannerType]=useState('Office');
  const[plannerScheme,setPlannerScheme]=useState('LEED');
  const[searchTerm,setSearchTerm]=useState('');

  const filtered=useMemo(()=>{
    let d=[...certBuildings];
    if(typeFilter!=='All') d=d.filter(b=>b.type===typeFilter);
    if(schemeFilter!=='All') d=d.filter(b=>b.certifications.some(c=>c.scheme===schemeFilter));
    if(certFilter==='Certified') d=d.filter(b=>b.certified);
    if(certFilter==='Uncertified') d=d.filter(b=>!b.certified);
    if(searchTerm) d=d.filter(b=>b.name.toLowerCase().includes(searchTerm.toLowerCase()));
    d.sort((a,b)=>sortDir==='asc'?a[sortCol]-b[sortCol]:b[sortCol]-a[sortCol]);
    return d;
  },[typeFilter,schemeFilter,certFilter,sortCol,sortDir,searchTerm]);

  const totalCertified=useMemo(()=>certBuildings.filter(b=>b.certified).length,[]);
  const schemeDist=useMemo(()=>SCHEMES.map(s=>({scheme:s,count:filtered.filter(b=>b.certifications.some(c=>c.scheme===s)).length})),[filtered]);
  const avgGreenPremium=useMemo(()=>{
    const cert=filtered.filter(b=>b.certified);const uncert=filtered.filter(b=>!b.certified);
    if(!cert.length||!uncert.length)return 0;
    return Math.floor((cert.reduce((s,b)=>s+b.rentPsf,0)/cert.length)/(uncert.reduce((s,b)=>s+b.rentPsf,0)/uncert.length)*100-100);
  },[filtered]);

  const radarData=useMemo(()=>{
    const cats=['energy','water','materials','health','transport','management','innovation','land'];
    return cats.map(cat=>({category:cat.charAt(0).toUpperCase()+cat.slice(1),...Object.fromEntries(selectedSchemes.map(s=>[s,schemeData.find(d=>d.scheme===s)?.categories[cat]||0]))}));
  },[selectedSchemes]);

  const premiumScatter=useMemo(()=>filtered.map(b=>({name:b.name,numCerts:b.numCerts,rentPsf:b.rentPsf,capRate:b.capRate,vacancy:b.vacancy,certified:b.certified?1:0,area:b.area})),[filtered]);

  const premiumByScheme=useMemo(()=>SCHEMES.map(s=>{
    const withScheme=filtered.filter(b=>b.certifications.some(c=>c.scheme===s));
    const without=filtered.filter(b=>!b.certifications.some(c=>c.scheme===s));
    const avgWith=withScheme.length?Math.floor(withScheme.reduce((sum,b)=>sum+b.rentPsf,0)/withScheme.length):0;
    const avgWithout=without.length?Math.floor(without.reduce((sum,b)=>sum+b.rentPsf,0)/without.length):0;
    return{scheme:s,withCert:avgWith,withoutCert:avgWithout,premium:avgWithout?Math.floor((avgWith/avgWithout-1)*100):0};
  }),[filtered]);

  const capRateComparison=useMemo(()=>{
    const cert=filtered.filter(b=>b.certified);const uncert=filtered.filter(b=>!b.certified);
    return[{label:'Certified',avgCapRate:cert.length?+(cert.reduce((s,b)=>s+b.capRate,0)/cert.length).toFixed(2):0,avgVacancy:cert.length?+(cert.reduce((s,b)=>s+b.vacancy,0)/cert.length).toFixed(1):0,count:cert.length},{label:'Uncertified',avgCapRate:uncert.length?+(uncert.reduce((s,b)=>s+b.capRate,0)/uncert.length).toFixed(2):0,avgVacancy:uncert.length?+(uncert.reduce((s,b)=>s+b.vacancy,0)/uncert.length).toFixed(1):0,count:uncert.length}];
  },[filtered]);

  const plannerGaps=useMemo(()=>{
    const sd=schemeData.find(s=>s.scheme===plannerScheme);
    if(!sd)return[];
    const cats=Object.entries(sd.categories);
    return cats.map(([cat,score])=>({category:cat.charAt(0).toUpperCase()+cat.slice(1),targetScore:score,currentEstimate:Math.floor(score*(0.4+sr(SCHEMES.indexOf(plannerScheme)*7+TYPES.indexOf(plannerType)*3)*0.5)),gap:0,priority:'',costEstimate:0})).map(g=>{
      g.gap=g.targetScore-g.currentEstimate;
      g.priority=g.gap>30?'Critical':g.gap>15?'High':g.gap>5?'Medium':'Low';
      g.costEstimate=Math.floor(g.gap*500+sr(g.gap*17)*5000);
      return g;
    }).sort((a,b)=>b.gap-a.gap);
  },[plannerScheme,plannerType]);

  const plannerTimeline=useMemo(()=>{
    const sd=schemeData.find(s=>s.scheme===plannerScheme);if(!sd)return[];
    const phases=[{phase:'Pre-Assessment',months:2,cost:sd.costPerSqm*0.15},{phase:'Design & Documentation',months:Math.floor(sd.timeMonths*0.3),cost:sd.costPerSqm*0.25},{phase:'Implementation',months:Math.floor(sd.timeMonths*0.4),cost:sd.costPerSqm*0.35},{phase:'Audit & Verification',months:Math.floor(sd.timeMonths*0.2),cost:sd.costPerSqm*0.15},{phase:'Certification Award',months:1,cost:sd.costPerSqm*0.10}];
    let cumMonths=0;
    return phases.map(p=>{cumMonths+=p.months;return{...p,cumMonths,costPer1000sqm:Math.floor(p.cost*1000)};});
  },[plannerScheme]);

  const certTimeline=useMemo(()=>{
    const years=[2018,2019,2020,2021,2022,2023,2024,2025];
    return years.map(y=>({year:y,...Object.fromEntries(SCHEMES.map(s=>[s,certBuildings.filter(b=>b.certifications.some(c=>c.scheme===s&&c.certYear<=y)).length]))}));
  },[]);

  const handleSort=(col)=>{if(sortCol===col)setSortDir(d=>d==='asc'?'desc':'asc');else{setSortCol(col);setSortDir('desc');}};
  const toggleScheme=(s)=>{setSelectedSchemes(prev=>prev.includes(s)?prev.filter(x=>x!==s):[...prev,s]);};

  return(
    <div style={sty.page}>
      <div style={sty.header}>
        <h1 style={sty.title}>Green Building Certification</h1>
        <div style={sty.subtitle}>EP-AS2 / LEED · BREEAM · WELL · NABERS · DGNB · HQE — {filtered.length} buildings</div>
      </div>

      <div style={sty.tabs}>{TABS.map((t,i)=><div key={i} style={sty.tab(tab===i)} onClick={()=>setTab(i)}>{t}</div>)}</div>

      {tab===0&&(
        <div>
          <div style={sty.kpiRow}>
            {[{v:totalCertified,l:'Certified Buildings'},{v:`${Math.floor(totalCertified/100*100)}%`,l:'Certification Rate'},{v:`+${avgGreenPremium}%`,l:'Avg Green Premium'},{v:certBuildings.reduce((s,b)=>s+b.certifications.length,0),l:'Total Certifications'},{v:SCHEMES.length,l:'Schemes Tracked'},{v:certBuildings.filter(b=>b.certifications.some(c=>c.expiryYear<=2026)).length,l:'Expiring 2026'}].map((k,i)=>(
              <div key={i} style={sty.kpi}><div style={sty.kpiVal}>{k.v}</div><div style={sty.kpiLabel}>{k.l}</div></div>
            ))}
          </div>

          <div style={sty.filterRow}>
            <select style={sty.select} value={typeFilter} onChange={e=>setTypeFilter(e.target.value)}><option value="All">All Types</option>{TYPES.map(t=><option key={t}>{t}</option>)}</select>
            <select style={sty.select} value={schemeFilter} onChange={e=>setSchemeFilter(e.target.value)}><option value="All">All Schemes</option>{SCHEMES.map(s=><option key={s}>{s}</option>)}</select>
            <select style={sty.select} value={certFilter} onChange={e=>setCertFilter(e.target.value)}><option value="All">All Status</option><option>Certified</option><option>Uncertified</option></select>
            <input style={{...sty.select,width:200}} placeholder="Search..." value={searchTerm} onChange={e=>setSearchTerm(e.target.value)}/>
          </div>

          <div style={sty.grid2}>
            <div style={sty.card}>
              <div style={sty.cardTitle}>Certification by Scheme</div>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={schemeDist}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="scheme" tick={{fontSize:11,fill:T.textSec}}/><YAxis tick={{fontSize:11,fill:T.textSec}}/><Tooltip contentStyle={{fontFamily:T.mono,fontSize:11}}/><Bar dataKey="count" radius={[4,4,0,0]}>{schemeDist.map((d,i)=><Cell key={i} fill={SCHEME_COLORS[d.scheme]}/>)}</Bar></BarChart>
              </ResponsiveContainer>
            </div>
            <div style={sty.card}>
              <div style={sty.cardTitle}>Certification Growth Over Time</div>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={certTimeline}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="year" tick={{fontSize:11,fill:T.textSec}}/><YAxis tick={{fontSize:11,fill:T.textSec}}/><Tooltip contentStyle={{fontFamily:T.mono,fontSize:11}}/><Legend wrapperStyle={{fontSize:10}}/>
                  {SCHEMES.map(s=><Bar key={s} dataKey={s} fill={SCHEME_COLORS[s]} stackId="a"/>)}
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div style={sty.grid2}>
            <div style={sty.card}>
              <div style={sty.cardTitle}>Certified vs Uncertified</div>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart><Pie data={[{name:'Certified',value:filtered.filter(b=>b.certified).length},{name:'Uncertified',value:filtered.filter(b=>!b.certified).length}]} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={({name,value})=>`${name}: ${value}`}><Cell fill={T.green}/><Cell fill={T.textMut}/></Pie><Tooltip/></PieChart>
              </ResponsiveContainer>
            </div>
            <div style={sty.card}>
              <div style={sty.cardTitle}>Coverage Gaps by Type</div>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={TYPES.map(t=>({type:t,certified:filtered.filter(b=>b.type===t&&b.certified).length,uncertified:filtered.filter(b=>b.type===t&&!b.certified).length}))}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="type" tick={{fontSize:10,fill:T.textSec}}/><YAxis tick={{fontSize:11,fill:T.textSec}}/><Tooltip contentStyle={{fontFamily:T.mono,fontSize:11}}/><Legend wrapperStyle={{fontSize:10}}/><Bar dataKey="certified" fill={T.green} stackId="a"/><Bar dataKey="uncertified" fill={T.textMut} stackId="a" radius={[4,4,0,0]}/></BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div style={sty.card}>
            <div style={sty.cardTitle}>Building Certification Details ({filtered.length})</div>
            <div style={sty.scrollBox}>
              <table style={sty.table}>
                <thead><tr>{['Name','Type','City','Certs','Schemes','Rent (£/sqft)','Cap Rate','Vacancy','Value'].map((h,i)=>{
                  const cols=['name','type','city','numCerts','numCerts','rentPsf','capRate','vacancy','value'];
                  return <th key={i} style={{...sty.th,cursor:'pointer'}} onClick={()=>handleSort(cols[i])}>{h}</th>;
                })}</tr></thead>
                <tbody>{filtered.slice(0,60).map(b=>(
                  <tr key={b.id} style={{cursor:'pointer',background:selectedBuilding===b.id?T.surfaceH:'transparent'}} onClick={()=>setSelectedBuilding(b.id)}>
                    <td style={sty.td}>{b.name}</td><td style={sty.td}>{b.type}</td><td style={sty.td}>{b.city}</td>
                    <td style={sty.td}><span style={sty.badge(b.numCerts>=2?T.green:b.numCerts===1?T.amber:T.textMut)}>{b.numCerts}</span></td>
                    <td style={sty.td}>{b.certifications.map(c=>c.scheme).join(', ')||'None'}</td>
                    <td style={sty.td}>£{b.rentPsf}</td><td style={sty.td}>{b.capRate}%</td>
                    <td style={sty.td}>{b.vacancy}%</td><td style={sty.td}>£{(b.value/1e6).toFixed(1)}M</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {tab===1&&(
        <div>
          <div style={sty.filterRow}>
            <span style={{fontSize:13,fontWeight:600}}>Compare Schemes:</span>
            {SCHEMES.map(s=><span key={s} style={{...sty.pill(selectedSchemes.includes(s)),borderColor:SCHEME_COLORS[s],color:selectedSchemes.includes(s)?'#fff':SCHEME_COLORS[s],background:selectedSchemes.includes(s)?SCHEME_COLORS[s]:T.surfaceH}} onClick={()=>toggleScheme(s)}>{s}</span>)}
          </div>

          <div style={sty.card}>
            <div style={sty.cardTitle}>Scheme Category Comparison</div>
            <ResponsiveContainer width="100%" height={380}>
              <RadarChart data={radarData}><PolarGrid stroke={T.border}/><PolarAngleAxis dataKey="category" tick={{fontSize:11,fill:T.textSec}}/><PolarRadiusAxis angle={30} domain={[0,100]} tick={{fontSize:9}}/>
                {selectedSchemes.map((s,i)=><Radar key={s} name={s} dataKey={s} stroke={SCHEME_COLORS[s]} fill={SCHEME_COLORS[s]} fillOpacity={0.15} strokeWidth={2}/>)}
                <Legend wrapperStyle={{fontSize:11}}/><Tooltip contentStyle={{fontFamily:T.mono,fontSize:11}}/>
              </RadarChart>
            </ResponsiveContainer>
          </div>

          <div style={sty.card}>
            <div style={sty.cardTitle}>Scheme Comparison Matrix</div>
            <table style={sty.table}>
              <thead><tr><th style={sty.th}>Attribute</th>{selectedSchemes.map(s=><th key={s} style={sty.th}>{s}</th>)}</tr></thead>
              <tbody>
                {['Cost (£/m²)','Timeline (months)','Market Recognition','Renewal (years)','Global Projects','Buildings in Portfolio'].map((attr,i)=>(
                  <tr key={i}><td style={{...sty.td,fontWeight:600}}>{attr}</td>
                    {selectedSchemes.map(s=>{
                      const sd=schemeData.find(d=>d.scheme===s);
                      const vals=[sd.costPerSqm,sd.timeMonths,`${sd.marketRecognition}/100`,sd.renewalYears,sd.globalProjects.toLocaleString(),schemeDist.find(d=>d.scheme===s)?.count||0];
                      return <td key={s} style={sty.td}>{i===0?`£${vals[i]}`:vals[i]}</td>;
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={sty.grid3}>
            {schemeData.filter(s=>selectedSchemes.includes(s.scheme)).map(sd=>(
              <div key={sd.scheme} style={{...sty.card,borderTop:`3px solid ${SCHEME_COLORS[sd.scheme]}`}}>
                <div style={{...sty.cardTitle,color:SCHEME_COLORS[sd.scheme]}}>{sd.scheme}</div>
                {Object.entries(sd.categories).map(([cat,val])=>(
                  <div key={cat} style={{display:'flex',alignItems:'center',gap:8,marginBottom:6}}>
                    <span style={{fontSize:11,width:80,color:T.textSec}}>{cat}</span>
                    <div style={{flex:1,height:8,background:T.surfaceH,borderRadius:4,overflow:'hidden'}}>
                      <div style={{height:'100%',width:`${val}%`,background:SCHEME_COLORS[sd.scheme],borderRadius:4}}/>
                    </div>
                    <span style={{fontSize:11,fontFamily:T.mono,width:30,textAlign:'right'}}>{val}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      {tab===2&&(
        <div>
          <div style={sty.kpiRow}>
            {[{v:`+${avgGreenPremium}%`,l:'Rent Premium'},{v:`${capRateComparison[0]?.avgCapRate||0}%`,l:'Certified Cap Rate'},{v:`${capRateComparison[1]?.avgCapRate||0}%`,l:'Uncertified Cap Rate'},{v:`${capRateComparison[0]?.avgVacancy||0}%`,l:'Certified Vacancy'},{v:`${capRateComparison[1]?.avgVacancy||0}%`,l:'Uncertified Vacancy'}].map((k,i)=>(
              <div key={i} style={sty.kpi}><div style={sty.kpiVal}>{k.v}</div><div style={sty.kpiLabel}>{k.l}</div></div>
            ))}
          </div>

          <div style={sty.grid2}>
            <div style={sty.card}>
              <div style={sty.cardTitle}>Rent Premium by Scheme</div>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={premiumByScheme}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="scheme" tick={{fontSize:11,fill:T.textSec}}/><YAxis tick={{fontSize:11,fill:T.textSec}}/><Tooltip contentStyle={{fontFamily:T.mono,fontSize:11}}/><Legend wrapperStyle={{fontSize:10}}/><Bar dataKey="withCert" name="With Cert (£/sqft)" fill={T.green} radius={[4,4,0,0]}/><Bar dataKey="withoutCert" name="Without (£/sqft)" fill={T.textMut} radius={[4,4,0,0]}/></BarChart>
              </ResponsiveContainer>
            </div>
            <div style={sty.card}>
              <div style={sty.cardTitle}>Certifications vs Rent Scatter</div>
              <ResponsiveContainer width="100%" height={260}>
                <ScatterChart><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="numCerts" name="Certifications" tick={{fontSize:11,fill:T.textSec}}/><YAxis dataKey="rentPsf" name="Rent (£/sqft)" tick={{fontSize:11,fill:T.textSec}}/><Tooltip contentStyle={{fontFamily:T.mono,fontSize:11}} cursor={{strokeDasharray:'3 3'}}/><Scatter data={premiumScatter} fill={T.navyL}>{premiumScatter.map((_,i)=><Cell key={i} fill={premiumScatter[i].certified?T.green:T.textMut}/>)}</Scatter></ScatterChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div style={sty.grid2}>
            <div style={sty.card}>
              <div style={sty.cardTitle}>Cap Rate Comparison</div>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={capRateComparison}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="label" tick={{fontSize:11,fill:T.textSec}}/><YAxis tick={{fontSize:11,fill:T.textSec}}/><Tooltip contentStyle={{fontFamily:T.mono,fontSize:11}}/><Bar dataKey="avgCapRate" name="Avg Cap Rate %" fill={T.navy} radius={[4,4,0,0]}/></BarChart>
              </ResponsiveContainer>
            </div>
            <div style={sty.card}>
              <div style={sty.cardTitle}>Vacancy Comparison</div>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={capRateComparison}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="label" tick={{fontSize:11,fill:T.textSec}}/><YAxis tick={{fontSize:11,fill:T.textSec}}/><Tooltip contentStyle={{fontFamily:T.mono,fontSize:11}}/><Bar dataKey="avgVacancy" name="Avg Vacancy %" fill={T.amber} radius={[4,4,0,0]}/></BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div style={sty.card}>
            <div style={sty.cardTitle}>Green Premium by Building Type</div>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={TYPES.map(t=>{const cert=filtered.filter(b=>b.type===t&&b.certified);const uncert=filtered.filter(b=>b.type===t&&!b.certified);const avgC=cert.length?Math.floor(cert.reduce((s,b)=>s+b.rentPsf,0)/cert.length):0;const avgU=uncert.length?Math.floor(uncert.reduce((s,b)=>s+b.rentPsf,0)/uncert.length):0;return{type:t,certified:avgC,uncertified:avgU,premium:avgU?Math.floor((avgC/avgU-1)*100):0};})}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="type" tick={{fontSize:10,fill:T.textSec}}/><YAxis tick={{fontSize:11,fill:T.textSec}}/><Tooltip contentStyle={{fontFamily:T.mono,fontSize:11}}/><Legend wrapperStyle={{fontSize:10}}/><Bar dataKey="certified" name="Certified" fill={T.green} radius={[4,4,0,0]}/><Bar dataKey="uncertified" name="Uncertified" fill={T.textMut} radius={[4,4,0,0]}/></BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {tab===3&&(
        <div>
          <div style={sty.filterRow}>
            <span style={{fontSize:13,fontWeight:600}}>Building Type:</span>
            <select style={sty.select} value={plannerType} onChange={e=>setPlannerType(e.target.value)}>{TYPES.map(t=><option key={t}>{t}</option>)}</select>
            <span style={{fontSize:13,fontWeight:600,marginLeft:12}}>Target Scheme:</span>
            {SCHEMES.map(s=><span key={s} style={{...sty.pill(plannerScheme===s),borderColor:SCHEME_COLORS[s],color:plannerScheme===s?'#fff':SCHEME_COLORS[s],background:plannerScheme===s?SCHEME_COLORS[s]:T.surfaceH}} onClick={()=>setPlannerScheme(s)}>{s}</span>)}
          </div>

          <div style={sty.kpiRow}>
            {[{v:plannerScheme,l:'Target Scheme'},{v:`£${schemeData.find(s=>s.scheme===plannerScheme)?.costPerSqm||0}/m²`,l:'Est. Cost'},{v:`${schemeData.find(s=>s.scheme===plannerScheme)?.timeMonths||0} months`,l:'Timeline'},{v:plannerGaps.filter(g=>g.gap>15).length,l:'Critical Gaps'},{v:`${Math.floor(plannerGaps.reduce((s,g)=>s+g.currentEstimate,0)/plannerGaps.length)}/100`,l:'Current Readiness'}].map((k,i)=>(
              <div key={i} style={sty.kpi}><div style={sty.kpiVal}>{k.v}</div><div style={sty.kpiLabel}>{k.l}</div></div>
            ))}
          </div>

          <div style={sty.grid2}>
            <div style={sty.card}>
              <div style={sty.cardTitle}>Gap Analysis — {plannerScheme}</div>
              <div style={sty.scrollBox}>
                <table style={sty.table}>
                  <thead><tr><th style={sty.th}>Category</th><th style={sty.th}>Target</th><th style={sty.th}>Current</th><th style={sty.th}>Gap</th><th style={sty.th}>Priority</th><th style={sty.th}>Est. Cost</th></tr></thead>
                  <tbody>{plannerGaps.map((g,i)=>(
                    <tr key={i}><td style={sty.td}>{g.category}</td><td style={sty.td}>{g.targetScore}</td><td style={sty.td}>{g.currentEstimate}</td>
                      <td style={sty.td}><span style={sty.badge(g.gap>20?T.red:g.gap>10?T.amber:T.green)}>{g.gap}</span></td>
                      <td style={sty.td}><span style={sty.badge(g.priority==='Critical'?T.red:g.priority==='High'?T.amber:T.green)}>{g.priority}</span></td>
                      <td style={sty.td}>£{g.costEstimate.toLocaleString()}</td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            </div>
            <div style={sty.card}>
              <div style={sty.cardTitle}>Readiness Radar</div>
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={plannerGaps.map(g=>({category:g.category,current:g.currentEstimate,target:g.targetScore}))}><PolarGrid stroke={T.border}/><PolarAngleAxis dataKey="category" tick={{fontSize:10,fill:T.textSec}}/><PolarRadiusAxis angle={30} domain={[0,100]} tick={{fontSize:9}}/>
                  <Radar name="Current" dataKey="current" stroke={T.amber} fill={T.amber} fillOpacity={0.2} strokeWidth={2}/>
                  <Radar name="Target" dataKey="target" stroke={SCHEME_COLORS[plannerScheme]} fill={SCHEME_COLORS[plannerScheme]} fillOpacity={0.15} strokeWidth={2}/>
                  <Legend wrapperStyle={{fontSize:11}}/><Tooltip contentStyle={{fontFamily:T.mono,fontSize:11}}/>
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div style={sty.card}>
            <div style={sty.cardTitle}>Certification Timeline — {plannerScheme}</div>
            <div style={{display:'flex',gap:0,marginTop:12}}>
              {plannerTimeline.map((p,i)=>(
                <div key={i} style={{flex:p.months,padding:12,background:i%2===0?T.surfaceH:T.surface,border:`1px solid ${T.border}`,textAlign:'center'}}>
                  <div style={{fontSize:12,fontWeight:700,color:T.navy}}>{p.phase}</div>
                  <div style={{fontSize:11,color:T.textSec,marginTop:4}}>{p.months} months</div>
                  <div style={{fontSize:11,fontFamily:T.mono,color:T.gold,marginTop:2}}>£{p.costPer1000sqm.toLocaleString()}/1000m²</div>
                </div>
              ))}
            </div>
            <div style={{marginTop:12,fontSize:12,color:T.textSec}}>
              Total: {plannerTimeline.reduce((s,p)=>s+p.months,0)} months | £{plannerTimeline.reduce((s,p)=>s+p.costPer1000sqm,0).toLocaleString()}/1000m²
            </div>
          </div>

          <div style={sty.card}>
            <div style={sty.cardTitle}>Scheme Recommendation Matrix</div>
            <table style={sty.table}>
              <thead><tr><th style={sty.th}>Scheme</th><th style={sty.th}>Fit Score</th><th style={sty.th}>Cost</th><th style={sty.th}>Timeline</th><th style={sty.th}>Market Value</th><th style={sty.th}>Recommendation</th></tr></thead>
              <tbody>{schemeData.map((sd,i)=>{
                const fit=Math.floor(50+sr(i*17+TYPES.indexOf(plannerType)*7)*50);
                return <tr key={i}><td style={sty.td}><span style={{color:SCHEME_COLORS[sd.scheme],fontWeight:600}}>{sd.scheme}</span></td><td style={sty.td}><span style={sty.badge(fit>75?T.green:fit>50?T.amber:T.red)}>{fit}/100</span></td><td style={sty.td}>£{sd.costPerSqm}/m²</td><td style={sty.td}>{sd.timeMonths} months</td><td style={sty.td}>{sd.marketRecognition}/100</td><td style={sty.td}>{fit>75?'Strongly Recommended':fit>50?'Consider':'Low Priority'}</td></tr>;
              })}</tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
