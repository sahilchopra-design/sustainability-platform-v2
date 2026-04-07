import React,{useState,useMemo,useCallback} from 'react';
import {BarChart,Bar,XAxis,YAxis,CartesianGrid,Tooltip,ResponsiveContainer,LineChart,Line,AreaChart,Area,Cell,Legend,PieChart,Pie,RadarChart,Radar,PolarGrid,PolarAngleAxis,PolarRadiusAxis} from 'recharts';

const T={bg:'#f6f4f0',surface:'#ffffff',surfaceH:'#f0ede7',border:'#e5e0d8',borderL:'#d5cfc5',navy:'#1b3a5c',navyL:'#2c5a8c',gold:'#c5a96a',goldL:'#d4be8a',sage:'#5a8a6a',sageL:'#7ba67d',teal:'#5a8a6a',text:'#1b3a5c',textSec:'#5c6b7e',textMut:'#9aa3ae',red:'#dc2626',green:'#16a34a',amber:'#d97706',font:"'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"};
const sr=(s)=>{let x=Math.sin(s+1)*10000;return x-Math.floor(x);};

const COUNTRIES=['USA','Brazil','India','Australia','Kenya','Argentina','France','Germany','Canada','Mexico','UK','China','Thailand','Indonesia','Nigeria','Ethiopia','Colombia','Spain','Italy','South Africa'];
const CROP_TYPES=['Wheat','Corn/Maize','Soybeans','Rice','Cotton','Coffee','Cocoa','Palm Oil','Sugarcane','Barley'];
const PRACTICES=['No-Till','Cover Crop','Crop Rotation','Agroforestry','Holistic Grazing','Composting','Biochar','Precision Ag','Strip Cropping','Terracing'];
const CERT_TYPES=['Organic USDA','Regenerative Organic Certified','Rainforest Alliance','Fair Trade','Carbon Verified','Soil Health Certified','EU Organic','Demeter Biodynamic'];
const YEARS=[2019,2020,2021,2022,2023,2024,2025,2026];
const MRV_METHODS=['Remote Sensing + Soil Sampling','Soil Core Lab Analysis','Eddy Covariance Flux Tower','Biogeochemical Modelling (DNDC)','Practice-Based Default Factors','Hybrid MRV Stack'];
const CARBON_REGISTRIES=['Verra VCS','Gold Standard','ACR','CAR','Puro.earth','CarbonCure','Nori'];

const genOps=(n)=>{
  const ops=[];
  const farmNames=['Sunrise','Green Valley','Heritage','Prairie Wind','Blue Ridge','Golden Acre','Silver Creek','Cedar Hill','Oakwood','Maple Grove','River Bend','Hillcrest','Meadowlark','Stonebridge','Windmill','Harvest Moon','Eagle Rock','Willow Springs','Fox Hollow','Pine Ridge'];
  for(let i=0;i<n;i++){
    const s1=sr(i*7+1),s2=sr(i*11+3),s3=sr(i*13+5),s4=sr(i*17+7),s5=sr(i*19+9),s6=sr(i*23+11),s7=sr(i*29+13),s8=sr(i*31+15);
    const crop=CROP_TYPES[Math.floor(s1*CROP_TYPES.length)];
    const country=COUNTRIES[Math.floor(s2*COUNTRIES.length)];
    const hectares=Math.floor(s3*4500+50);
    const adoptedPractices=PRACTICES.filter((_,pi)=>sr(i*37+pi*7)>0.45);
    const soilCarbon=+(1.2+s4*3.8).toFixed(2);
    const annualSeq=+(0.3+s5*2.7).toFixed(2);
    const yieldImpact=+(-5+s6*25).toFixed(1);
    const inputCostChange=+(-30+s7*15).toFixed(1);
    const certifications=CERT_TYPES.filter((_,ci)=>sr(i*41+ci*11)>0.65);
    const creditRevenue=Math.floor(s8*120+10);
    const adoptionYear=2018+Math.floor(sr(i*43+17)*7);
    const soilOrgMatter=+(1.5+sr(i*47+19)*4.5).toFixed(1);
    const waterRetention=Math.floor(20+sr(i*53+21)*60);
    const biodivScore=Math.floor(30+sr(i*59+23)*70);
    const mrvMethod=MRV_METHODS[Math.floor(sr(i*61+25)*MRV_METHODS.length)];
    const registry=CARBON_REGISTRIES[Math.floor(sr(i*67+27)*CARBON_REGISTRIES.length)];
    const yearlyCarbon=YEARS.map((_,yi)=>+(soilCarbon+sr(i*71+yi*13)*0.5*yi).toFixed(2));
    const yearlyYield=YEARS.map((_,yi)=>{const base=100+yieldImpact*0.5;return Math.floor(base+sr(i*73+yi*17)*15*yi/YEARS.length);});
    ops.push({id:i,name:farmNames[i%farmNames.length]+' '+(Math.floor(i/farmNames.length)+1),crop,country,hectares,practices:adoptedPractices,soilCarbon,annualSeq,yieldImpact,inputCostChange,certifications,creditRevenue,adoptionYear,soilOrgMatter,waterRetention,biodivScore,mrvMethod,registry,yearlyCarbon,yearlyYield,
      practiceScore:Math.floor(adoptedPractices.length/PRACTICES.length*100),
      transitionStage:adoptedPractices.length>=5?'Advanced':adoptedPractices.length>=3?'Intermediate':'Early',
      paybackYears:+(1+sr(i*79+29)*8).toFixed(1),
      carbonPrice:Math.floor(15+sr(i*83+31)*45),
      insettingEligible:sr(i*89+33)>0.4,
      verificationStatus:['Verified','Pending','In Review','Pre-Audit'][Math.floor(sr(i*91+35)*4)],
      latitude:+(sr(i*97+37)*140-70).toFixed(2),
      longitude:+(sr(i*101+39)*340-170).toFixed(2),
    });
  }
  return ops;
};

const OPS=genOps(80);

const Card=({children,style})=><div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:8,padding:20,...style}}>{children}</div>;
const Pill=({active,onClick,children})=><button onClick={onClick} style={{padding:'6px 16px',borderRadius:6,border:`1px solid ${active?T.gold:T.border}`,background:active?T.gold+'18':T.surface,color:active?T.navy:T.textSec,fontFamily:T.font,fontSize:13,fontWeight:active?600:400,cursor:'pointer',transition:'all 0.2s'}}>{children}</button>;
const KPI=({label,value,sub,color})=><Card style={{textAlign:'center',flex:1,minWidth:150}}><div style={{fontFamily:T.mono,fontSize:24,fontWeight:700,color:color||T.navy}}>{value}</div><div style={{fontSize:12,color:T.textSec,marginTop:4}}>{label}</div>{sub&&<div style={{fontSize:11,color:T.textMut,marginTop:2}}>{sub}</div>}</Card>;
const Badge=({children,color})=><span style={{display:'inline-block',padding:'2px 8px',borderRadius:4,fontSize:11,fontWeight:600,background:(color||T.sage)+'18',color:color||T.sage,marginRight:4,marginBottom:2}}>{children}</span>;

const TABS=['Practice Tracker','Soil Carbon Calculator','Economic Analysis','Certification & Markets'];

export default function RegenerativeAgriculturePage(){
  const [tab,setTab]=useState(0);
  const [cropFilter,setCropFilter]=useState('All');
  const [countryFilter,setCountryFilter]=useState('All');
  const [practiceFilter,setPracticeFilter]=useState('All');
  const [sortField,setSortField]=useState('practiceScore');
  const [sortDir,setSortDir]=useState('desc');
  const [selectedOp,setSelectedOp]=useState(null);
  const [mrvMethod,setMrvMethod]=useState('All');
  const [paybackMax,setPaybackMax]=useState(10);
  const [carbonPriceSlider,setCarbonPriceSlider]=useState(30);
  const [certFilter,setCertFilter]=useState('All');
  const [searchTerm,setSearchTerm]=useState('');
  const [page,setPage]=useState(0);

  const filtered=useMemo(()=>{
    let f=OPS;
    if(cropFilter!=='All')f=f.filter(o=>o.crop===cropFilter);
    if(countryFilter!=='All')f=f.filter(o=>o.country===countryFilter);
    if(practiceFilter!=='All')f=f.filter(o=>o.practices.includes(practiceFilter));
    if(mrvMethod!=='All')f=f.filter(o=>o.mrvMethod===mrvMethod);
    if(certFilter!=='All')f=f.filter(o=>o.certifications.includes(certFilter));
    if(searchTerm)f=f.filter(o=>o.name.toLowerCase().includes(searchTerm.toLowerCase())||o.crop.toLowerCase().includes(searchTerm.toLowerCase()));
    const dir=sortDir==='asc'?1:-1;
    return [...f].sort((a,b)=>(a[sortField]>b[sortField]?dir:-dir));
  },[cropFilter,countryFilter,practiceFilter,sortField,sortDir,mrvMethod,certFilter,searchTerm]);

  const stats=useMemo(()=>{
    const totalHa=filtered.reduce((a,o)=>a+o.hectares,0);
    const avgSeq=filtered.length?+(filtered.reduce((a,o)=>a+o.annualSeq,0)/filtered.length).toFixed(2):0;
    const totalSeq=Math.floor(filtered.reduce((a,o)=>a+o.annualSeq*o.hectares,0));
    const avgScore=filtered.length?Math.floor(filtered.reduce((a,o)=>a+o.practiceScore,0)/filtered.length):0;
    const advancedPct=filtered.length?Math.floor(filtered.filter(o=>o.transitionStage==='Advanced').length/filtered.length*100):0;
    const avgYieldImpact=filtered.length?+(filtered.reduce((a,o)=>a+o.yieldImpact,0)/filtered.length).toFixed(1):0;
    const certifiedPct=filtered.length?Math.floor(filtered.filter(o=>o.certifications.length>0).length/filtered.length*100):0;
    const totalCredRev=Math.floor(filtered.reduce((a,o)=>a+o.creditRevenue*o.hectares/1000,0));
    return{totalHa,avgSeq,totalSeq,avgScore,advancedPct,avgYieldImpact,certifiedPct,totalCredRev};
  },[filtered]);

  const practiceAdoption=useMemo(()=>PRACTICES.map(p=>({name:p,count:filtered.filter(o=>o.practices.includes(p)).length,pct:filtered.length?Math.floor(filtered.filter(o=>o.practices.includes(p)).length/filtered.length*100):0})).sort((a,b)=>b.count-a.count),[filtered]);

  const cropBreakdown=useMemo(()=>CROP_TYPES.map(c=>{const ops=filtered.filter(o=>o.crop===c);return{name:c,count:ops.length,avgSeq:ops.length?+(ops.reduce((a,o)=>a+o.annualSeq,0)/ops.length).toFixed(2):0,totalHa:ops.reduce((a,o)=>a+o.hectares,0)};}).filter(c=>c.count>0).sort((a,b)=>b.count-a.count),[filtered]);

  const countryBreakdown=useMemo(()=>COUNTRIES.map(c=>{const ops=filtered.filter(o=>o.country===c);return{name:c,count:ops.length,totalHa:ops.reduce((a,o)=>a+o.hectares,0)};}).filter(c=>c.count>0).sort((a,b)=>b.totalHa-a.totalHa),[filtered]);

  const stageBreakdown=useMemo(()=>['Early','Intermediate','Advanced'].map(s=>({name:s,value:filtered.filter(o=>o.transitionStage===s).length})),[filtered]);

  const yearTrend=useMemo(()=>YEARS.map((y,yi)=>({year:y.toString(),avgCarbon:filtered.length?+(filtered.reduce((a,o)=>a+o.yearlyCarbon[yi],0)/filtered.length).toFixed(2):0,totalSeq:Math.floor(filtered.reduce((a,o)=>a+o.yearlyCarbon[yi]*o.hectares/1000,0))})),[filtered]);

  const COLORS=[T.navy,T.gold,T.sage,T.navyL,T.amber,T.red,T.green,T.teal,'#8b5cf6','#ec4899'];
  const PAGE_SIZE=15;
  const totalPages=Math.ceil(filtered.length/PAGE_SIZE);
  const paged=filtered.slice(page*PAGE_SIZE,(page+1)*PAGE_SIZE);

  const handleSort=useCallback((field)=>{if(sortField===field)setSortDir(d=>d==='asc'?'desc':'asc');else{setSortField(field);setSortDir('desc');}},[sortField]);

  const renderPracticeTracker=()=>(
    <div>
      <div style={{display:'flex',gap:12,marginBottom:16,flexWrap:'wrap',alignItems:'center'}}>
        <input value={searchTerm} onChange={e=>{setSearchTerm(e.target.value);setPage(0);}} placeholder="Search operations..." style={{padding:'6px 12px',border:`1px solid ${T.border}`,borderRadius:6,fontFamily:T.font,fontSize:13,width:200}}/>
        <select value={cropFilter} onChange={e=>{setCropFilter(e.target.value);setPage(0);}} style={{padding:'6px 10px',border:`1px solid ${T.border}`,borderRadius:6,fontFamily:T.font,fontSize:13}}>
          <option value="All">All Crops</option>{CROP_TYPES.map(c=><option key={c} value={c}>{c}</option>)}
        </select>
        <select value={countryFilter} onChange={e=>{setCountryFilter(e.target.value);setPage(0);}} style={{padding:'6px 10px',border:`1px solid ${T.border}`,borderRadius:6,fontFamily:T.font,fontSize:13}}>
          <option value="All">All Countries</option>{COUNTRIES.map(c=><option key={c} value={c}>{c}</option>)}
        </select>
        <select value={practiceFilter} onChange={e=>{setPracticeFilter(e.target.value);setPage(0);}} style={{padding:'6px 10px',border:`1px solid ${T.border}`,borderRadius:6,fontFamily:T.font,fontSize:13}}>
          <option value="All">All Practices</option>{PRACTICES.map(p=><option key={p} value={p}>{p}</option>)}
        </select>
        <span style={{fontFamily:T.mono,fontSize:12,color:T.textMut}}>{filtered.length} ops</span>
      </div>

      <div style={{display:'flex',gap:12,marginBottom:20,flexWrap:'wrap'}}>
        <KPI label="Total Hectares" value={stats.totalHa.toLocaleString()} sub="under management" color={T.navy}/>
        <KPI label="Avg Sequestration" value={stats.avgSeq+' tCO2e/ha/yr'} sub="across operations" color={T.green}/>
        <KPI label="Total Annual Seq" value={(stats.totalSeq/1000).toFixed(0)+'k tCO2e'} sub="portfolio-wide" color={T.sage}/>
        <KPI label="Practice Score" value={stats.avgScore+'%'} sub="adoption rate" color={T.gold}/>
        <KPI label="Advanced Stage" value={stats.advancedPct+'%'} sub="of operations" color={T.teal}/>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:20}}>
        <Card>
          <div style={{fontWeight:600,fontSize:14,color:T.navy,marginBottom:12}}>Practice Adoption Rate</div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={practiceAdoption} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/>
              <XAxis type="number" domain={[0,100]} tick={{fontSize:11,fill:T.textSec}}/>
              <YAxis type="category" dataKey="name" width={120} tick={{fontSize:11,fill:T.textSec}}/>
              <Tooltip contentStyle={{fontFamily:T.font,fontSize:12,border:`1px solid ${T.border}`}}/>
              <Bar dataKey="pct" fill={T.sage} radius={[0,4,4,0]} name="Adoption %"/>
            </BarChart>
          </ResponsiveContainer>
        </Card>
        <Card>
          <div style={{fontWeight:600,fontSize:14,color:T.navy,marginBottom:12}}>Transition Stage Distribution</div>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={stageBreakdown} cx="50%" cy="50%" outerRadius={100} innerRadius={50} dataKey="value" nameKey="name" label={({name,value})=>`${name}: ${value}`} labelLine={false}>
                {stageBreakdown.map((e,i)=><Cell key={i} fill={[T.amber,T.gold,T.green][i]}/>)}
              </Pie>
              <Tooltip contentStyle={{fontFamily:T.font,fontSize:12}}/>
              <Legend/>
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:20}}>
        <Card>
          <div style={{fontWeight:600,fontSize:14,color:T.navy,marginBottom:12}}>Sequestration by Crop Type</div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={cropBreakdown}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/>
              <XAxis dataKey="name" tick={{fontSize:10,fill:T.textSec}} angle={-30} textAnchor="end" height={60}/>
              <YAxis tick={{fontSize:11,fill:T.textSec}}/>
              <Tooltip contentStyle={{fontFamily:T.font,fontSize:12}}/>
              <Bar dataKey="avgSeq" fill={T.navy} radius={[4,4,0,0]} name="Avg tCO2e/ha/yr"/>
            </BarChart>
          </ResponsiveContainer>
        </Card>
        <Card>
          <div style={{fontWeight:600,fontSize:14,color:T.navy,marginBottom:12}}>Country Coverage (Hectares)</div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={countryBreakdown.slice(0,10)} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/>
              <XAxis type="number" tick={{fontSize:11,fill:T.textSec}}/>
              <YAxis type="category" dataKey="name" width={80} tick={{fontSize:11,fill:T.textSec}}/>
              <Tooltip contentStyle={{fontFamily:T.font,fontSize:12}}/>
              <Bar dataKey="totalHa" fill={T.gold} radius={[0,4,4,0]} name="Hectares"/>
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <Card>
        <div style={{fontWeight:600,fontSize:14,color:T.navy,marginBottom:12}}>Operations Registry</div>
        <div style={{overflowX:'auto'}}>
          <table style={{width:'100%',borderCollapse:'collapse',fontFamily:T.font,fontSize:12}}>
            <thead>
              <tr style={{borderBottom:`2px solid ${T.border}`}}>
                {[{k:'name',l:'Operation'},{k:'crop',l:'Crop'},{k:'country',l:'Country'},{k:'hectares',l:'Hectares'},{k:'practiceScore',l:'Score'},{k:'annualSeq',l:'Seq tCO2e/ha'},{k:'transitionStage',l:'Stage'},{k:'soilOrgMatter',l:'SOM %'}].map(({k,l})=>(
                  <th key={k} onClick={()=>handleSort(k)} style={{padding:'8px 6px',textAlign:'left',cursor:'pointer',color:sortField===k?T.navy:T.textSec,fontWeight:sortField===k?700:500,whiteSpace:'nowrap'}}>{l}{sortField===k?(sortDir==='asc'?' ↑':' ↓'):''}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paged.map(o=>(
                <tr key={o.id} onClick={()=>setSelectedOp(o.id===selectedOp?null:o.id)} style={{borderBottom:`1px solid ${T.borderL}`,background:o.id===selectedOp?T.surfaceH:'transparent',cursor:'pointer',transition:'background 0.15s'}}>
                  <td style={{padding:'6px',fontWeight:500}}>{o.name}</td>
                  <td style={{padding:'6px'}}>{o.crop}</td>
                  <td style={{padding:'6px'}}>{o.country}</td>
                  <td style={{padding:'6px',fontFamily:T.mono}}>{o.hectares.toLocaleString()}</td>
                  <td style={{padding:'6px'}}><div style={{width:50,height:6,background:T.borderL,borderRadius:3}}><div style={{width:`${o.practiceScore}%`,height:6,background:o.practiceScore>=60?T.green:o.practiceScore>=30?T.amber:T.red,borderRadius:3}}/></div></td>
                  <td style={{padding:'6px',fontFamily:T.mono,color:T.green}}>{o.annualSeq}</td>
                  <td style={{padding:'6px'}}><Badge color={o.transitionStage==='Advanced'?T.green:o.transitionStage==='Intermediate'?T.amber:T.red}>{o.transitionStage}</Badge></td>
                  <td style={{padding:'6px',fontFamily:T.mono}}>{o.soilOrgMatter}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {totalPages>1&&<div style={{display:'flex',gap:8,marginTop:12,justifyContent:'center',alignItems:'center'}}>
          <button onClick={()=>setPage(p=>Math.max(0,p-1))} disabled={page===0} style={{padding:'4px 12px',border:`1px solid ${T.border}`,borderRadius:4,background:T.surface,cursor:page===0?'default':'pointer',opacity:page===0?0.4:1,fontFamily:T.font,fontSize:12}}>Prev</button>
          <span style={{fontFamily:T.mono,fontSize:12,color:T.textSec}}>Page {page+1} of {totalPages}</span>
          <button onClick={()=>setPage(p=>Math.min(totalPages-1,p+1))} disabled={page>=totalPages-1} style={{padding:'4px 12px',border:`1px solid ${T.border}`,borderRadius:4,background:T.surface,cursor:page>=totalPages-1?'default':'pointer',opacity:page>=totalPages-1?0.4:1,fontFamily:T.font,fontSize:12}}>Next</button>
        </div>}
      </Card>

      {selectedOp!==null&&(()=>{const o=OPS.find(x=>x.id===selectedOp);if(!o)return null;return(
        <Card style={{marginTop:16}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
            <div style={{fontWeight:700,fontSize:16,color:T.navy}}>{o.name}</div>
            <button onClick={()=>setSelectedOp(null)} style={{background:'none',border:'none',color:T.textMut,cursor:'pointer',fontSize:18}}>×</button>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12,marginBottom:16}}>
            <div><span style={{color:T.textMut,fontSize:11}}>Crop</span><div style={{fontWeight:600}}>{o.crop}</div></div>
            <div><span style={{color:T.textMut,fontSize:11}}>Country</span><div style={{fontWeight:600}}>{o.country}</div></div>
            <div><span style={{color:T.textMut,fontSize:11}}>Hectares</span><div style={{fontWeight:600,fontFamily:T.mono}}>{o.hectares.toLocaleString()}</div></div>
            <div><span style={{color:T.textMut,fontSize:11}}>Adoption Year</span><div style={{fontWeight:600}}>{o.adoptionYear}</div></div>
            <div><span style={{color:T.textMut,fontSize:11}}>Soil Carbon</span><div style={{fontWeight:600,fontFamily:T.mono,color:T.green}}>{o.soilCarbon}%</div></div>
            <div><span style={{color:T.textMut,fontSize:11}}>Water Retention</span><div style={{fontWeight:600,fontFamily:T.mono}}>{o.waterRetention}%</div></div>
            <div><span style={{color:T.textMut,fontSize:11}}>Biodiv Score</span><div style={{fontWeight:600,fontFamily:T.mono}}>{o.biodivScore}/100</div></div>
            <div><span style={{color:T.textMut,fontSize:11}}>Verification</span><Badge color={o.verificationStatus==='Verified'?T.green:T.amber}>{o.verificationStatus}</Badge></div>
          </div>
          <div style={{marginBottom:12}}>
            <span style={{color:T.textMut,fontSize:11}}>Adopted Practices</span>
            <div style={{display:'flex',flexWrap:'wrap',gap:4,marginTop:4}}>{o.practices.map(p=><Badge key={p} color={T.sage}>{p}</Badge>)}</div>
          </div>
          <div style={{marginBottom:12}}>
            <span style={{color:T.textMut,fontSize:11}}>Certifications</span>
            <div style={{display:'flex',flexWrap:'wrap',gap:4,marginTop:4}}>{o.certifications.length?o.certifications.map(c=><Badge key={c} color={T.gold}>{c}</Badge>):<span style={{fontSize:12,color:T.textMut}}>None</span>}</div>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
            <div>
              <div style={{fontSize:13,fontWeight:600,color:T.navy,marginBottom:8}}>Soil Carbon Trend</div>
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={YEARS.map((y,i)=>({year:y.toString(),carbon:o.yearlyCarbon[i]}))}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/>
                  <XAxis dataKey="year" tick={{fontSize:10,fill:T.textSec}}/>
                  <YAxis tick={{fontSize:10,fill:T.textSec}}/>
                  <Tooltip contentStyle={{fontFamily:T.font,fontSize:12}}/>
                  <Line type="monotone" dataKey="carbon" stroke={T.green} strokeWidth={2} dot={{r:3}}/>
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div>
              <div style={{fontSize:13,fontWeight:600,color:T.navy,marginBottom:8}}>Yield Index Trend</div>
              <ResponsiveContainer width="100%" height={180}>
                <AreaChart data={YEARS.map((y,i)=>({year:y.toString(),yield:o.yearlyYield[i]}))}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/>
                  <XAxis dataKey="year" tick={{fontSize:10,fill:T.textSec}}/>
                  <YAxis tick={{fontSize:10,fill:T.textSec}}/>
                  <Tooltip contentStyle={{fontFamily:T.font,fontSize:12}}/>
                  <Area type="monotone" dataKey="yield" fill={T.gold+'30'} stroke={T.gold} strokeWidth={2}/>
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </Card>
      );})()}
    </div>
  );

  const renderSoilCarbon=()=>{
    const mrvBreakdown=MRV_METHODS.map(m=>{const ops=filtered.filter(o=>o.mrvMethod===m);return{name:m.length>25?m.slice(0,25)+'...':m,fullName:m,count:ops.length,avgSeq:ops.length?+(ops.reduce((a,o)=>a+o.annualSeq,0)/ops.length).toFixed(2):0,avgConf:Math.floor(50+sr(MRV_METHODS.indexOf(m)*17)*50)};}).filter(m=>m.count>0);
    const carbonDepthProfile=[{depth:'0-10cm',stock:35},{depth:'10-30cm',stock:28},{depth:'30-50cm',stock:18},{depth:'50-100cm',stock:12},{depth:'100-150cm',stock:7}];
    const seqByPractice=PRACTICES.map((p,pi)=>({name:p.length>12?p.slice(0,12)+'...':p,avgSeq:+(0.5+sr(pi*23+7)*2.5).toFixed(2),maxSeq:+(1.5+sr(pi*29+11)*3.5).toFixed(2),minSeq:+(0.1+sr(pi*31+13)*1.0).toFixed(2)}));
    const permanenceRisk=[{factor:'Drought',risk:35},{factor:'Fire',risk:22},{factor:'Tillage Reversal',risk:28},{factor:'Policy Change',risk:15},{factor:'Market Abandonment',risk:18},{factor:'Soil Erosion',risk:25}];

    return(
      <div>
        <div style={{display:'flex',gap:12,marginBottom:16,flexWrap:'wrap',alignItems:'center'}}>
          <select value={mrvMethod} onChange={e=>setMrvMethod(e.target.value)} style={{padding:'6px 10px',border:`1px solid ${T.border}`,borderRadius:6,fontFamily:T.font,fontSize:13}}>
            <option value="All">All MRV Methods</option>{MRV_METHODS.map(m=><option key={m} value={m}>{m}</option>)}
          </select>
        </div>

        <div style={{display:'flex',gap:12,marginBottom:20,flexWrap:'wrap'}}>
          <KPI label="Avg Sequestration" value={stats.avgSeq+' tCO2e/ha/yr'} sub="filtered portfolio" color={T.green}/>
          <KPI label="Total Annual" value={(stats.totalSeq/1000).toFixed(1)+'k tCO2e'} sub="all operations" color={T.sage}/>
          <KPI label="Credit Potential" value={'$'+stats.totalCredRev.toLocaleString()+'k'} sub="at current prices" color={T.gold}/>
          <KPI label="MRV Coverage" value={filtered.filter(o=>o.mrvMethod!=='Practice-Based Default Factors').length+'/'+filtered.length} sub="direct measurement" color={T.navy}/>
        </div>

        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:20}}>
          <Card>
            <div style={{fontWeight:600,fontSize:14,color:T.navy,marginBottom:12}}>Sequestration by Practice Type</div>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={seqByPractice}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/>
                <XAxis dataKey="name" tick={{fontSize:10,fill:T.textSec}} angle={-30} textAnchor="end" height={60}/>
                <YAxis tick={{fontSize:11,fill:T.textSec}}/>
                <Tooltip contentStyle={{fontFamily:T.font,fontSize:12}}/>
                <Legend/>
                <Bar dataKey="avgSeq" fill={T.sage} name="Avg tCO2e/ha"/>
                <Bar dataKey="maxSeq" fill={T.green} name="Max"/>
              </BarChart>
            </ResponsiveContainer>
          </Card>
          <Card>
            <div style={{fontWeight:600,fontSize:14,color:T.navy,marginBottom:12}}>MRV Methodology Comparison</div>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={mrvBreakdown} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/>
                <XAxis type="number" tick={{fontSize:11,fill:T.textSec}}/>
                <YAxis type="category" dataKey="name" width={140} tick={{fontSize:10,fill:T.textSec}}/>
                <Tooltip contentStyle={{fontFamily:T.font,fontSize:12}} formatter={(v,n)=>[v,n==='avgSeq'?'Avg Seq':'Confidence']}/>
                <Legend/>
                <Bar dataKey="avgSeq" fill={T.navy} name="Avg Seq tCO2e/ha"/>
                <Bar dataKey="avgConf" fill={T.gold} name="Confidence %"/>
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>

        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:20}}>
          <Card>
            <div style={{fontWeight:600,fontSize:14,color:T.navy,marginBottom:12}}>Soil Carbon Depth Profile (avg tCO2e/ha)</div>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={carbonDepthProfile} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/>
                <XAxis type="number" tick={{fontSize:11,fill:T.textSec}}/>
                <YAxis type="category" dataKey="depth" width={80} tick={{fontSize:11,fill:T.textSec}}/>
                <Tooltip contentStyle={{fontFamily:T.font,fontSize:12}}/>
                <Bar dataKey="stock" fill={T.sage} radius={[0,4,4,0]} name="tCO2e/ha"/>
              </BarChart>
            </ResponsiveContainer>
          </Card>
          <Card>
            <div style={{fontWeight:600,fontSize:14,color:T.navy,marginBottom:12}}>Permanence Risk Assessment</div>
            <ResponsiveContainer width="100%" height={240}>
              <RadarChart data={permanenceRisk}>
                <PolarGrid stroke={T.borderL}/>
                <PolarAngleAxis dataKey="factor" tick={{fontSize:10,fill:T.textSec}}/>
                <PolarRadiusAxis tick={{fontSize:9,fill:T.textMut}}/>
                <Radar dataKey="risk" stroke={T.red} fill={T.red+'30'} strokeWidth={2}/>
                <Tooltip contentStyle={{fontFamily:T.font,fontSize:12}}/>
              </RadarChart>
            </ResponsiveContainer>
          </Card>
        </div>

        <Card>
          <div style={{fontWeight:600,fontSize:14,color:T.navy,marginBottom:12}}>Portfolio Soil Carbon Trend</div>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={yearTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/>
              <XAxis dataKey="year" tick={{fontSize:11,fill:T.textSec}}/>
              <YAxis tick={{fontSize:11,fill:T.textSec}}/>
              <Tooltip contentStyle={{fontFamily:T.font,fontSize:12}}/>
              <Legend/>
              <Area type="monotone" dataKey="avgCarbon" fill={T.green+'30'} stroke={T.green} strokeWidth={2} name="Avg Soil Carbon %"/>
              <Area type="monotone" dataKey="totalSeq" fill={T.navy+'20'} stroke={T.navy} strokeWidth={2} name="Total Seq (k tCO2e)"/>
            </AreaChart>
          </ResponsiveContainer>
        </Card>
      </div>
    );
  };

  const renderEconomics=()=>{
    const paybackData=filtered.map(o=>({name:o.name.slice(0,15),payback:+o.paybackYears,yieldImpact:o.yieldImpact,inputSaving:-o.inputCostChange,creditRev:o.creditRevenue}));
    const revenueByPrice=[15,20,25,30,40,50,60,75].map(p=>({price:'$'+p,totalRev:Math.floor(filtered.reduce((a,o)=>a+p*o.annualSeq*o.hectares/1000,0)),avgPerHa:filtered.length?Math.floor(filtered.reduce((a,o)=>a+p*o.annualSeq,0)/filtered.length):0}));
    const costBenefit=[{item:'Seed Cost Change',value:-8},{item:'Fertilizer Savings',value:22},{item:'Pesticide Savings',value:15},{item:'Labour Increase',value:-12},{item:'Equipment',value:-6},{item:'Carbon Credits',value:35},{item:'Yield Premium',value:18},{item:'Insurance Discount',value:5}];
    const roiByStage=['Early','Intermediate','Advanced'].map(s=>{const ops=filtered.filter(o=>o.transitionStage===s);return{stage:s,avgROI:ops.length?Math.floor(ops.reduce((a,o)=>a+o.creditRevenue-Math.abs(o.inputCostChange),0)/ops.length):0,avgPayback:ops.length?+(ops.reduce((a,o)=>a+o.paybackYears,0)/ops.length).toFixed(1):0,count:ops.length};});

    return(
      <div>
        <div style={{display:'flex',gap:12,marginBottom:16,alignItems:'center',flexWrap:'wrap'}}>
          <label style={{fontSize:12,color:T.textSec}}>Max Payback (yrs):</label>
          <input type="range" min={1} max={10} step={0.5} value={paybackMax} onChange={e=>setPaybackMax(+e.target.value)} style={{width:150}}/>
          <span style={{fontFamily:T.mono,fontSize:12,color:T.navy}}>{paybackMax} yrs</span>
          <label style={{fontSize:12,color:T.textSec,marginLeft:16}}>Carbon Price ($/tCO2e):</label>
          <input type="range" min={5} max={100} step={5} value={carbonPriceSlider} onChange={e=>setCarbonPriceSlider(+e.target.value)} style={{width:150}}/>
          <span style={{fontFamily:T.mono,fontSize:12,color:T.navy}}>${carbonPriceSlider}</span>
        </div>

        <div style={{display:'flex',gap:12,marginBottom:20,flexWrap:'wrap'}}>
          <KPI label="Avg Yield Impact" value={(stats.avgYieldImpact>0?'+':'')+stats.avgYieldImpact+'%'} sub="vs conventional" color={stats.avgYieldImpact>0?T.green:T.red}/>
          <KPI label="Carbon Credit Revenue" value={'$'+Math.floor(filtered.reduce((a,o)=>a+carbonPriceSlider*o.annualSeq*o.hectares/1000,0)).toLocaleString()+'k'} sub={'at $'+carbonPriceSlider+'/tCO2e'} color={T.gold}/>
          <KPI label="Avg Payback" value={filtered.length?+(filtered.reduce((a,o)=>a+o.paybackYears,0)/filtered.length).toFixed(1)+'yr':'N/A'} sub="to break even" color={T.navy}/>
          <KPI label="Within Target" value={filtered.filter(o=>o.paybackYears<=paybackMax).length+'/'+filtered.length} sub={'≤'+paybackMax+' yr payback'} color={T.sage}/>
        </div>

        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:20}}>
          <Card>
            <div style={{fontWeight:600,fontSize:14,color:T.navy,marginBottom:12}}>Revenue at Different Carbon Prices</div>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={revenueByPrice}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/>
                <XAxis dataKey="price" tick={{fontSize:11,fill:T.textSec}}/>
                <YAxis tick={{fontSize:11,fill:T.textSec}}/>
                <Tooltip contentStyle={{fontFamily:T.font,fontSize:12}}/>
                <Legend/>
                <Bar dataKey="totalRev" fill={T.gold} name="Total Rev ($k)" radius={[4,4,0,0]}/>
                <Bar dataKey="avgPerHa" fill={T.navy} name="Avg $/ha" radius={[4,4,0,0]}/>
              </BarChart>
            </ResponsiveContainer>
          </Card>
          <Card>
            <div style={{fontWeight:600,fontSize:14,color:T.navy,marginBottom:12}}>Cost-Benefit Waterfall ($/ha avg)</div>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={costBenefit}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/>
                <XAxis dataKey="item" tick={{fontSize:10,fill:T.textSec}} angle={-25} textAnchor="end" height={60}/>
                <YAxis tick={{fontSize:11,fill:T.textSec}}/>
                <Tooltip contentStyle={{fontFamily:T.font,fontSize:12}}/>
                <Bar dataKey="value" radius={[4,4,0,0]} name="$/ha">{costBenefit.map((e,i)=><Cell key={i} fill={e.value>=0?T.green:T.red}/>)}</Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>

        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
          <Card>
            <div style={{fontWeight:600,fontSize:14,color:T.navy,marginBottom:12}}>ROI by Transition Stage</div>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={roiByStage}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/>
                <XAxis dataKey="stage" tick={{fontSize:11,fill:T.textSec}}/>
                <YAxis tick={{fontSize:11,fill:T.textSec}}/>
                <Tooltip contentStyle={{fontFamily:T.font,fontSize:12}}/>
                <Legend/>
                <Bar dataKey="avgROI" fill={T.green} name="Avg ROI $/ha" radius={[4,4,0,0]}/>
                <Bar dataKey="count" fill={T.navy} name="# Operations" radius={[4,4,0,0]}/>
              </BarChart>
            </ResponsiveContainer>
          </Card>
          <Card>
            <div style={{fontWeight:600,fontSize:14,color:T.navy,marginBottom:12}}>Payback Distribution</div>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={[{range:'<2yr',count:filtered.filter(o=>o.paybackYears<2).length},{range:'2-4yr',count:filtered.filter(o=>o.paybackYears>=2&&o.paybackYears<4).length},{range:'4-6yr',count:filtered.filter(o=>o.paybackYears>=4&&o.paybackYears<6).length},{range:'6-8yr',count:filtered.filter(o=>o.paybackYears>=6&&o.paybackYears<8).length},{range:'8+yr',count:filtered.filter(o=>o.paybackYears>=8).length}]}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/>
                <XAxis dataKey="range" tick={{fontSize:11,fill:T.textSec}}/>
                <YAxis tick={{fontSize:11,fill:T.textSec}}/>
                <Tooltip contentStyle={{fontFamily:T.font,fontSize:12}}/>
                <Bar dataKey="count" fill={T.sage} radius={[4,4,0,0]} name="Operations"/>
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>
      </div>
    );
  };

  const renderCertification=()=>{
    const certBreakdown=CERT_TYPES.map(c=>({name:c.length>20?c.slice(0,20)+'...':c,fullName:c,count:filtered.filter(o=>o.certifications.includes(c)).length})).filter(c=>c.count>0).sort((a,b)=>b.count-a.count);
    const registryBreakdown=CARBON_REGISTRIES.map(r=>({name:r,count:filtered.filter(o=>o.registry===r).length})).filter(r=>r.count>0);
    const insettingData=[{type:'Scope 3 Insetting',value:filtered.filter(o=>o.insettingEligible).length},{type:'Offset Market',value:filtered.filter(o=>!o.insettingEligible).length}];
    const marketTrend=YEARS.map((y,yi)=>({year:y.toString(),vcmVolume:Math.floor(80+yi*35+sr(yi*23)*20),insettingVolume:Math.floor(10+yi*25+sr(yi*29)*15),avgPrice:Math.floor(15+yi*5+sr(yi*31)*8)}));
    const verificationStatus=[{status:'Verified',count:filtered.filter(o=>o.verificationStatus==='Verified').length},{status:'Pending',count:filtered.filter(o=>o.verificationStatus==='Pending').length},{status:'In Review',count:filtered.filter(o=>o.verificationStatus==='In Review').length},{status:'Pre-Audit',count:filtered.filter(o=>o.verificationStatus==='Pre-Audit').length}];

    return(
      <div>
        <div style={{display:'flex',gap:12,marginBottom:16,alignItems:'center'}}>
          <select value={certFilter} onChange={e=>setCertFilter(e.target.value)} style={{padding:'6px 10px',border:`1px solid ${T.border}`,borderRadius:6,fontFamily:T.font,fontSize:13}}>
            <option value="All">All Certifications</option>{CERT_TYPES.map(c=><option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div style={{display:'flex',gap:12,marginBottom:20,flexWrap:'wrap'}}>
          <KPI label="Certified Ops" value={stats.certifiedPct+'%'} sub="with ≥1 cert" color={T.sage}/>
          <KPI label="Insetting Eligible" value={filtered.filter(o=>o.insettingEligible).length+'/'+filtered.length} sub="Scope 3 value chain" color={T.green}/>
          <KPI label="Verified Credits" value={filtered.filter(o=>o.verificationStatus==='Verified').length} sub="operations verified" color={T.gold}/>
          <KPI label="Est. Credit Rev" value={'$'+stats.totalCredRev.toLocaleString()+'k'} sub="annual revenue" color={T.navy}/>
        </div>

        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:20}}>
          <Card>
            <div style={{fontWeight:600,fontSize:14,color:T.navy,marginBottom:12}}>Certification Coverage</div>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={certBreakdown} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/>
                <XAxis type="number" tick={{fontSize:11,fill:T.textSec}}/>
                <YAxis type="category" dataKey="name" width={130} tick={{fontSize:10,fill:T.textSec}}/>
                <Tooltip contentStyle={{fontFamily:T.font,fontSize:12}}/>
                <Bar dataKey="count" fill={T.sage} radius={[0,4,4,0]} name="Operations"/>
              </BarChart>
            </ResponsiveContainer>
          </Card>
          <Card>
            <div style={{fontWeight:600,fontSize:14,color:T.navy,marginBottom:12}}>Carbon Registry Distribution</div>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={registryBreakdown} cx="50%" cy="50%" outerRadius={100} innerRadius={45} dataKey="count" nameKey="name" label={({name,count})=>`${name}: ${count}`} labelLine={false}>
                  {registryBreakdown.map((e,i)=><Cell key={i} fill={COLORS[i%COLORS.length]}/>)}
                </Pie>
                <Tooltip contentStyle={{fontFamily:T.font,fontSize:12}}/>
                <Legend/>
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </div>

        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:20}}>
          <Card>
            <div style={{fontWeight:600,fontSize:14,color:T.navy,marginBottom:12}}>Voluntary Carbon Market Trend</div>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={marketTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/>
                <XAxis dataKey="year" tick={{fontSize:11,fill:T.textSec}}/>
                <YAxis tick={{fontSize:11,fill:T.textSec}}/>
                <Tooltip contentStyle={{fontFamily:T.font,fontSize:12}}/>
                <Legend/>
                <Area type="monotone" dataKey="vcmVolume" fill={T.navy+'20'} stroke={T.navy} strokeWidth={2} name="VCM Volume (MtCO2)"/>
                <Area type="monotone" dataKey="insettingVolume" fill={T.green+'20'} stroke={T.green} strokeWidth={2} name="Insetting Volume"/>
              </AreaChart>
            </ResponsiveContainer>
          </Card>
          <Card>
            <div style={{fontWeight:600,fontSize:14,color:T.navy,marginBottom:12}}>Verification Status</div>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={verificationStatus} cx="50%" cy="50%" outerRadius={95} innerRadius={40} dataKey="count" nameKey="status" label={({status,count})=>`${status}: ${count}`}>
                  {verificationStatus.map((e,i)=><Cell key={i} fill={[T.green,T.amber,T.navy,T.textMut][i]}/>)}
                </Pie>
                <Tooltip contentStyle={{fontFamily:T.font,fontSize:12}}/>
                <Legend/>
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </div>

        <Card>
          <div style={{fontWeight:600,fontSize:14,color:T.navy,marginBottom:12}}>Insetting vs Offset Market Split</div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 2fr',gap:20,alignItems:'center'}}>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={insettingData} cx="50%" cy="50%" outerRadius={80} innerRadius={35} dataKey="value" nameKey="type">
                  <Cell fill={T.green}/><Cell fill={T.navy}/>
                </Pie>
                <Tooltip contentStyle={{fontFamily:T.font,fontSize:12}}/>
                <Legend/>
              </PieChart>
            </ResponsiveContainer>
            <div style={{fontSize:13,color:T.textSec,lineHeight:1.8}}>
              <div><strong>Scope 3 Insetting:</strong> {filtered.filter(o=>o.insettingEligible).length} operations eligible for value chain insetting — emissions reductions within the company supply chain count toward Scope 3 targets.</div>
              <div style={{marginTop:8}}><strong>Offset Market:</strong> {filtered.filter(o=>!o.insettingEligible).length} operations generating credits for voluntary carbon market sale to third-party buyers.</div>
              <div style={{marginTop:8,fontFamily:T.mono,fontSize:11,color:T.textMut}}>Avg carbon price: ${filtered.length?Math.floor(filtered.reduce((a,o)=>a+o.carbonPrice,0)/filtered.length):0}/tCO2e | Registry split: {registryBreakdown.map(r=>r.name+': '+r.count).join(' | ')}</div>
            </div>
          </div>
        </Card>
      </div>
    );
  };

  return(
    <div style={{fontFamily:T.font,color:T.text,background:T.bg,minHeight:'100vh',padding:24}}>
      <div style={{maxWidth:1400,margin:'0 auto'}}>
        <div style={{marginBottom:20}}>
          <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:4}}>
            <span style={{fontFamily:T.mono,fontSize:11,color:T.textMut,letterSpacing:1}}>EP-AT1</span>
            <span style={{width:4,height:4,borderRadius:2,background:T.gold}}/>
            <span style={{fontFamily:T.mono,fontSize:11,color:T.textMut}}>FOOD SYSTEMS & AGRICULTURAL FINANCE</span>
          </div>
          <h1 style={{fontSize:22,fontWeight:700,color:T.navy,margin:0}}>Regenerative Agriculture</h1>
          <p style={{fontSize:13,color:T.textSec,margin:'4px 0 0'}}>Practice adoption tracking, soil carbon MRV, economics & certification across {OPS.length} agricultural operations</p>
        </div>

        <div style={{display:'flex',gap:8,marginBottom:20,borderBottom:`2px solid ${T.border}`,paddingBottom:8}}>
          {TABS.map((t,i)=><Pill key={t} active={tab===i} onClick={()=>setTab(i)}>{t}</Pill>)}
        </div>

        {tab===0&&renderPracticeTracker()}
        {tab===1&&renderSoilCarbon()}
        {tab===2&&renderEconomics()}
        {tab===3&&renderCertification()}
      </div>
    </div>
  );
}