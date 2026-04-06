import React,{useState,useMemo,useCallback} from 'react';
import {BarChart,Bar,XAxis,YAxis,CartesianGrid,Tooltip,ResponsiveContainer,RadarChart,Radar,PolarGrid,PolarAngleAxis,PolarRadiusAxis,Cell,Legend,AreaChart,Area,PieChart,Pie} from 'recharts';

const T={bg:'#f6f4f0',surface:'#ffffff',surfaceH:'#f0ede7',border:'#e5e0d8',borderL:'#d5cfc5',navy:'#1b3a5c',navyL:'#2c5a8c',gold:'#c5a96a',goldL:'#d4be8a',sage:'#5a8a6a',sageL:'#7ba67d',teal:'#5a8a6a',text:'#1b3a5c',textSec:'#5c6b7e',textMut:'#9aa3ae',red:'#dc2626',green:'#16a34a',amber:'#d97706',font:"'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"};
const sr=(s)=>{let x=Math.sin(s+1)*10000;return x-Math.floor(x);};

const COUNTRIES=['USA','Brazil','India','Australia','Kenya','Argentina','France','Germany','UK','Mexico','Thailand','Indonesia','Colombia','Spain','South Africa','Canada','New Zealand','Japan','Netherlands','Ethiopia'];
const CROP_TYPES=['Wheat','Corn','Soybeans','Rice','Cotton','Coffee','Cocoa','Almonds','Sunflower','Canola','Barley','Oats','Potatoes','Tomatoes','Apples'];
const PRACTICES=['No-Till','Cover Cropping','Hedgerow Planting','Wildflower Strips','Crop Rotation','Integrated Pest Mgmt','Organic Farming','Buffer Zones','Wetland Creation','Agroforestry','Beetle Banks','Pond Restoration'];
const POLLINATOR_CROPS=['Almonds','Apples','Blueberries','Cherries','Coffee','Cocoa','Avocados','Watermelon','Pumpkin','Sunflower','Canola','Tomatoes','Strawberries','Mango','Passion Fruit'];
const NEONICS=['Imidacloprid','Clothianidin','Thiamethoxam','Acetamiprid','Thiacloprid','Dinotefuran'];
const SOIL_INDICATORS=['Microbial Biomass','Fungal:Bacterial Ratio','Earthworm Density','Mycorrhizal Colonization','Enzyme Activity','Soil Respiration','Nematode Diversity','Macro-arthropod Count'];
const CREDIT_PILOTS=['ValueNature Pilot','TNFD Aligned','Biodiversity Net Gain','Wallacea Trust','Plan Vivo Biodiv','Regen Network','EcoAustralia','BioCredit Alliance'];
const YEARS=[2019,2020,2021,2022,2023,2024,2025,2026];

const genOps=(n)=>{
  const ops=[];
  const farmNames=['Sunrise','Heritage','Prairie','Blue Ridge','Golden','Silver Creek','Cedar Hill','Oakwood','Meadow','Stonegate','River Bend','Windmill','Eagle Rock','Willow','Fox Hollow','Pine Ridge','Clover','Birch','Elm Park','Hazel Dell','Moss Glen','Thorn Hill','Ivy Farm','Sage Brush','Poplar','Fern Creek','Holly','Larch Hill','Yew Tree','Rowan'];
  for(let i=0;i<n;i++){
    const s1=sr(i*7+1),s2=sr(i*11+3),s3=sr(i*13+5),s4=sr(i*17+7),s5=sr(i*19+9),s6=sr(i*23+11),s7=sr(i*29+13),s8=sr(i*31+15);
    const crop=CROP_TYPES[Math.floor(s1*CROP_TYPES.length)];
    const country=COUNTRIES[Math.floor(s2*COUNTRIES.length)];
    const hectares=Math.floor(50+s3*4500);
    const msaScore=+(0.2+s4*0.7).toFixed(2);
    const speciesRichness=Math.floor(15+s5*185);
    const habitatQuality=Math.floor(20+s6*75);
    const practicesAdopted=PRACTICES.filter((_,pi)=>sr(i*37+pi*7)>0.5);
    const pollinatorDependency=Math.floor(10+sr(i*41+17)*80);
    const neonicExposure=+(0+sr(i*43+19)*8).toFixed(1);
    const wildflowerCoverage=Math.floor(sr(i*47+21)*25);
    const microbialDiversity=+(2+sr(i*53+23)*6).toFixed(1);
    const earthwormDensity=Math.floor(20+sr(i*59+25)*280);
    const soilOrgMatter=+(1.5+sr(i*61+27)*5.5).toFixed(1);
    const connScore=Math.floor(10+sr(i*67+29)*85);
    const creditPilot=sr(i*71+31)>0.55?CREDIT_PILOTS[Math.floor(sr(i*73+33)*CREDIT_PILOTS.length)]:null;
    const creditPrice=creditPilot?Math.floor(5+sr(i*79+35)*25):0;
    const annualCreditPotential=creditPilot?Math.floor(hectares*msaScore*0.5):0;
    const yearlyMSA=YEARS.map((_,yi)=>+(msaScore-0.05+sr(i*83+yi*11)*0.03*yi).toFixed(2));
    const yearlySpecies=YEARS.map((_,yi)=>Math.floor(speciesRichness-5+sr(i*89+yi*13)*3*yi));
    const soilIndicators=SOIL_INDICATORS.map((_,si)=>Math.floor(20+sr(i*97+si*17)*75));
    ops.push({id:i,name:farmNames[i%farmNames.length]+' '+(Math.floor(i/farmNames.length)+1),crop,country,hectares,msaScore,speciesRichness,habitatQuality,practices:practicesAdopted,pollinatorDependency,neonicExposure,wildflowerCoverage,microbialDiversity,earthwormDensity,soilOrgMatter,connectivityScore:connScore,creditPilot,creditPrice,annualCreditPotential,yearlyMSA,yearlySpecies,soilIndicators,
      biodivRating:msaScore>=0.7?'High':msaScore>=0.45?'Moderate':'Low',
      practiceScore:Math.floor(practicesAdopted.length/PRACTICES.length*100),
      pollinatorRisk:neonicExposure>5?'High':neonicExposure>2.5?'Medium':'Low',
    });
  }
  return ops;
};

const OPS=genOps(60);

const Card=({children,style})=><div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:8,padding:20,...style}}>{children}</div>;
const Pill=({active,onClick,children})=><button onClick={onClick} style={{padding:'6px 16px',borderRadius:6,border:`1px solid ${active?T.gold:T.border}`,background:active?T.gold+'18':T.surface,color:active?T.navy:T.textSec,fontFamily:T.font,fontSize:13,fontWeight:active?600:400,cursor:'pointer',transition:'all 0.2s'}}>{children}</button>;
const KPI=({label,value,sub,color})=><Card style={{textAlign:'center',flex:1,minWidth:150}}><div style={{fontFamily:T.mono,fontSize:24,fontWeight:700,color:color||T.navy}}>{value}</div><div style={{fontSize:12,color:T.textSec,marginTop:4}}>{label}</div>{sub&&<div style={{fontSize:11,color:T.textMut,marginTop:2}}>{sub}</div>}</Card>;
const Badge=({children,color})=><span style={{display:'inline-block',padding:'2px 8px',borderRadius:4,fontSize:11,fontWeight:600,background:(color||T.sage)+'18',color:color||T.sage,marginRight:4,marginBottom:2}}>{children}</span>;

const TABS=['Biodiversity Scorecard','Pollinator Health','Soil Biodiversity','Biodiversity Credit Market'];
const COLORS=[T.navy,T.gold,T.sage,T.navyL,T.amber,T.red,T.green,T.teal,'#8b5cf6','#ec4899','#06b6d4','#f97316'];

export default function AgriBiodiversityPage(){
  const [tab,setTab]=useState(0);
  const [cropFilter,setCropFilter]=useState('All');
  const [countryFilter,setCountryFilter]=useState('All');
  const [ratingFilter,setRatingFilter]=useState('All');
  const [sortField,setSortField]=useState('msaScore');
  const [sortDir,setSortDir]=useState('desc');
  const [selectedOp,setSelectedOp]=useState(null);
  const [searchTerm,setSearchTerm]=useState('');
  const [page,setPage]=useState(0);

  const filtered=useMemo(()=>{
    let f=OPS;
    if(cropFilter!=='All')f=f.filter(o=>o.crop===cropFilter);
    if(countryFilter!=='All')f=f.filter(o=>o.country===countryFilter);
    if(ratingFilter!=='All')f=f.filter(o=>o.biodivRating===ratingFilter);
    if(searchTerm)f=f.filter(o=>o.name.toLowerCase().includes(searchTerm.toLowerCase()));
    const dir=sortDir==='asc'?1:-1;
    return [...f].sort((a,b)=>(a[sortField]>b[sortField]?dir:-dir));
  },[cropFilter,countryFilter,ratingFilter,sortField,sortDir,searchTerm]);

  const stats=useMemo(()=>{
    const avgMSA=filtered.length?+(filtered.reduce((a,o)=>a+o.msaScore,0)/filtered.length).toFixed(2):0;
    const avgSpecies=filtered.length?Math.floor(filtered.reduce((a,o)=>a+o.speciesRichness,0)/filtered.length):0;
    const avgHabitat=filtered.length?Math.floor(filtered.reduce((a,o)=>a+o.habitatQuality,0)/filtered.length):0;
    const highPct=filtered.length?Math.floor(filtered.filter(o=>o.biodivRating==='High').length/filtered.length*100):0;
    const avgNeonic=filtered.length?+(filtered.reduce((a,o)=>a+o.neonicExposure,0)/filtered.length).toFixed(1):0;
    const totalCredits=filtered.reduce((a,o)=>a+o.annualCreditPotential,0);
    const avgEarthworm=filtered.length?Math.floor(filtered.reduce((a,o)=>a+o.earthwormDensity,0)/filtered.length):0;
    const pilotPct=filtered.length?Math.floor(filtered.filter(o=>o.creditPilot).length/filtered.length*100):0;
    return{avgMSA,avgSpecies,avgHabitat,highPct,avgNeonic,totalCredits,avgEarthworm,pilotPct};
  },[filtered]);

  const practiceAdoption=useMemo(()=>PRACTICES.map(p=>({name:p.length>18?p.slice(0,18)+'...':p,fullName:p,count:filtered.filter(o=>o.practices.includes(p)).length,pct:filtered.length?Math.floor(filtered.filter(o=>o.practices.includes(p)).length/filtered.length*100):0})).sort((a,b)=>b.count-a.count),[filtered]);

  const ratingBreakdown=useMemo(()=>['Low','Moderate','High'].map(r=>({name:r,value:filtered.filter(o=>o.biodivRating===r).length})),[filtered]);

  const msaTrend=useMemo(()=>YEARS.map((y,yi)=>({year:y.toString(),avgMSA:filtered.length?+(filtered.reduce((a,o)=>a+o.yearlyMSA[yi],0)/filtered.length).toFixed(2):0,avgSpecies:filtered.length?Math.floor(filtered.reduce((a,o)=>a+o.yearlySpecies[yi],0)/filtered.length):0})),[filtered]);

  const handleSort=useCallback((f)=>{if(sortField===f)setSortDir(d=>d==='asc'?'desc':'asc');else{setSortField(f);setSortDir('desc');}},[sortField]);
  const PAGE_SIZE=12;const totalPages=Math.ceil(filtered.length/PAGE_SIZE);const paged=filtered.slice(page*PAGE_SIZE,(page+1)*PAGE_SIZE);

  const renderScorecard=()=>(
    <div>
      <div style={{display:'flex',gap:12,marginBottom:16,flexWrap:'wrap',alignItems:'center'}}>
        <input value={searchTerm} onChange={e=>{setSearchTerm(e.target.value);setPage(0);}} placeholder="Search operations..." style={{padding:'6px 12px',border:`1px solid ${T.border}`,borderRadius:6,fontFamily:T.font,fontSize:13,width:200}}/>
        <select value={cropFilter} onChange={e=>{setCropFilter(e.target.value);setPage(0);}} style={{padding:'6px 10px',border:`1px solid ${T.border}`,borderRadius:6,fontFamily:T.font,fontSize:13}}>
          <option value="All">All Crops</option>{CROP_TYPES.map(c=><option key={c} value={c}>{c}</option>)}
        </select>
        <select value={countryFilter} onChange={e=>{setCountryFilter(e.target.value);setPage(0);}} style={{padding:'6px 10px',border:`1px solid ${T.border}`,borderRadius:6,fontFamily:T.font,fontSize:13}}>
          <option value="All">All Countries</option>{COUNTRIES.map(c=><option key={c} value={c}>{c}</option>)}
        </select>
        <select value={ratingFilter} onChange={e=>{setRatingFilter(e.target.value);setPage(0);}} style={{padding:'6px 10px',border:`1px solid ${T.border}`,borderRadius:6,fontFamily:T.font,fontSize:13}}>
          <option value="All">All Ratings</option>{['Low','Moderate','High'].map(r=><option key={r} value={r}>{r}</option>)}
        </select>
        <span style={{fontFamily:T.mono,fontSize:12,color:T.textMut}}>{filtered.length} ops</span>
      </div>

      <div style={{display:'flex',gap:12,marginBottom:20,flexWrap:'wrap'}}>
        <KPI label="Avg MSA Score" value={stats.avgMSA} sub="Mean Species Abundance" color={stats.avgMSA>=0.6?T.green:T.amber}/>
        <KPI label="Avg Species Richness" value={stats.avgSpecies} sub="species per operation" color={T.navy}/>
        <KPI label="Avg Habitat Quality" value={stats.avgHabitat+'%'} sub="habitat index" color={T.sage}/>
        <KPI label="High Biodiv" value={stats.highPct+'%'} sub="MSA ≥ 0.70" color={T.green}/>
        <KPI label="Practice Adoption" value={(filtered.length?Math.floor(filtered.reduce((a,o)=>a+o.practiceScore,0)/filtered.length):0)+'%'} sub="avg score" color={T.gold}/>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:20}}>
        <Card>
          <div style={{fontWeight:600,fontSize:14,color:T.navy,marginBottom:12}}>Biodiversity Practice Adoption</div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={practiceAdoption} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/>
              <XAxis type="number" domain={[0,100]} tick={{fontSize:11,fill:T.textSec}}/>
              <YAxis type="category" dataKey="name" width={130} tick={{fontSize:10,fill:T.textSec}}/>
              <Tooltip contentStyle={{fontFamily:T.font,fontSize:12}}/>
              <Bar dataKey="pct" fill={T.sage} radius={[0,4,4,0]} name="Adoption %"/>
            </BarChart>
          </ResponsiveContainer>
        </Card>
        <Card>
          <div style={{fontWeight:600,fontSize:14,color:T.navy,marginBottom:12}}>Biodiversity Rating Distribution</div>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={ratingBreakdown} cx="50%" cy="50%" outerRadius={110} innerRadius={50} dataKey="value" nameKey="name" label={({name,value})=>`${name}: ${value}`}>
                {ratingBreakdown.map((e,i)=><Cell key={i} fill={[T.red,T.amber,T.green][i]}/>)}
              </Pie>
              <Tooltip contentStyle={{fontFamily:T.font,fontSize:12}}/><Legend/>
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <Card style={{marginBottom:20}}>
        <div style={{fontWeight:600,fontSize:14,color:T.navy,marginBottom:12}}>MSA & Species Richness Trend</div>
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={msaTrend}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/>
            <XAxis dataKey="year" tick={{fontSize:11,fill:T.textSec}}/>
            <YAxis tick={{fontSize:11,fill:T.textSec}}/>
            <Tooltip contentStyle={{fontFamily:T.font,fontSize:12}}/>
            <Legend/>
            <Area type="monotone" dataKey="avgMSA" fill={T.green+'20'} stroke={T.green} strokeWidth={2} name="Avg MSA"/>
          </AreaChart>
        </ResponsiveContainer>
      </Card>

      <Card>
        <div style={{fontWeight:600,fontSize:14,color:T.navy,marginBottom:12}}>Operations Biodiversity Registry</div>
        <div style={{overflowX:'auto'}}>
          <table style={{width:'100%',borderCollapse:'collapse',fontFamily:T.font,fontSize:12}}>
            <thead><tr style={{borderBottom:`2px solid ${T.border}`}}>
              {[{k:'name',l:'Operation'},{k:'crop',l:'Crop'},{k:'msaScore',l:'MSA'},{k:'speciesRichness',l:'Species'},{k:'habitatQuality',l:'Habitat %'},{k:'practiceScore',l:'Practices'},{k:'biodivRating',l:'Rating'}].map(({k,l})=>(
                <th key={k} onClick={()=>handleSort(k)} style={{padding:'8px 6px',textAlign:'left',cursor:'pointer',color:sortField===k?T.navy:T.textSec,fontWeight:sortField===k?700:500}}>{l}{sortField===k?(sortDir==='asc'?' ↑':' ↓'):''}</th>
              ))}
            </tr></thead>
            <tbody>{paged.map(o=>(
              <tr key={o.id} onClick={()=>setSelectedOp(o.id===selectedOp?null:o.id)} style={{borderBottom:`1px solid ${T.borderL}`,background:o.id===selectedOp?T.surfaceH:'transparent',cursor:'pointer'}}>
                <td style={{padding:'6px',fontWeight:500}}>{o.name}</td>
                <td style={{padding:'6px'}}>{o.crop}</td>
                <td style={{padding:'6px',fontFamily:T.mono,color:o.msaScore>=0.7?T.green:o.msaScore>=0.45?T.amber:T.red,fontWeight:600}}>{o.msaScore}</td>
                <td style={{padding:'6px',fontFamily:T.mono}}>{o.speciesRichness}</td>
                <td style={{padding:'6px',fontFamily:T.mono}}>{o.habitatQuality}%</td>
                <td style={{padding:'6px'}}><div style={{width:50,height:6,background:T.borderL,borderRadius:3}}><div style={{width:`${o.practiceScore}%`,height:6,background:o.practiceScore>=60?T.green:T.amber,borderRadius:3}}/></div></td>
                <td style={{padding:'6px'}}><Badge color={o.biodivRating==='High'?T.green:o.biodivRating==='Moderate'?T.amber:T.red}>{o.biodivRating}</Badge></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
        {totalPages>1&&<div style={{display:'flex',gap:8,marginTop:12,justifyContent:'center'}}>
          <button onClick={()=>setPage(p=>Math.max(0,p-1))} disabled={page===0} style={{padding:'4px 12px',border:`1px solid ${T.border}`,borderRadius:4,background:T.surface,fontFamily:T.font,fontSize:12,cursor:page===0?'default':'pointer',opacity:page===0?0.4:1}}>Prev</button>
          <span style={{fontFamily:T.mono,fontSize:12,color:T.textSec}}>{page+1}/{totalPages}</span>
          <button onClick={()=>setPage(p=>Math.min(totalPages-1,p+1))} disabled={page>=totalPages-1} style={{padding:'4px 12px',border:`1px solid ${T.border}`,borderRadius:4,background:T.surface,fontFamily:T.font,fontSize:12,cursor:page>=totalPages-1?'default':'pointer',opacity:page>=totalPages-1?0.4:1}}>Next</button>
        </div>}
      </Card>

      {selectedOp!==null&&(()=>{const o=OPS.find(x=>x.id===selectedOp);if(!o)return null;return(
        <Card style={{marginTop:16}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
            <div style={{fontWeight:700,fontSize:16,color:T.navy}}>{o.name}</div>
            <button onClick={()=>setSelectedOp(null)} style={{background:'none',border:'none',color:T.textMut,cursor:'pointer',fontSize:18}}>×</button>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12,marginBottom:16}}>
            {[{l:'MSA',v:o.msaScore},{l:'Species',v:o.speciesRichness},{l:'Habitat',v:o.habitatQuality+'%'},{l:'Connectivity',v:o.connectivityScore+'%'},{l:'Earthworms',v:o.earthwormDensity+'/m²'},{l:'SOM',v:o.soilOrgMatter+'%'},{l:'Neonic Exposure',v:o.neonicExposure+' µg/L'},{l:'Wildflower',v:o.wildflowerCoverage+'%'}].map(({l,v},i)=>(
              <div key={i}><span style={{color:T.textMut,fontSize:11}}>{l}</span><div style={{fontWeight:600,fontFamily:T.mono,fontSize:13}}>{v}</div></div>
            ))}
          </div>
          <div style={{marginBottom:12}}>
            <span style={{color:T.textMut,fontSize:11}}>Practices</span>
            <div style={{display:'flex',flexWrap:'wrap',gap:4,marginTop:4}}>{o.practices.map(p=><Badge key={p} color={T.sage}>{p}</Badge>)}</div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <RadarChart data={SOIL_INDICATORS.map((s,si)=>({indicator:s.length>12?s.slice(0,12)+'...':s,value:o.soilIndicators[si]}))}>
              <PolarGrid stroke={T.borderL}/><PolarAngleAxis dataKey="indicator" tick={{fontSize:9,fill:T.textSec}}/><PolarRadiusAxis tick={{fontSize:8,fill:T.textMut}} domain={[0,100]}/>
              <Radar dataKey="value" stroke={T.sage} fill={T.sage+'30'} strokeWidth={2}/><Tooltip contentStyle={{fontFamily:T.font,fontSize:12}}/>
            </RadarChart>
          </ResponsiveContainer>
        </Card>
      );})()}
    </div>
  );

  const renderPollinator=()=>{
    const cropDependency=POLLINATOR_CROPS.map((c,ci)=>({name:c,dependency:Math.floor(30+sr(ci*17+1)*65),yieldAtRisk:Math.floor(5+sr(ci*23+3)*45),economicValue:Math.floor(1+sr(ci*29+5)*25)}));
    const neonicData=NEONICS.map((n,ni)=>({name:n,avgExposure:+(0.5+sr(ni*17+7)*7).toFixed(1),ops:Math.floor(5+sr(ni*23+9)*30),ld50:+(0.5+sr(ni*29+11)*5).toFixed(2)}));
    const corridorImpact=[{metric:'Pollinator Visits',before:100,after:165},{metric:'Species Count',before:12,after:28},{metric:'Colony Survival',before:60,after:82},{metric:'Crop Set Rate',before:55,after:78},{metric:'Yield Impact',before:0,after:15}];
    const pollinatorTrend=YEARS.map((y,yi)=>({year:y.toString(),avgDependency:Math.floor(45+sr(yi*23)*5),avgExposure:+(4.5-yi*0.2+sr(yi*29)*0.5).toFixed(1),corridorArea:Math.floor(5+yi*3+sr(yi*31)*2)}));

    return(
      <div>
        <div style={{display:'flex',gap:12,marginBottom:20,flexWrap:'wrap'}}>
          <KPI label="Avg Neonic Exposure" value={stats.avgNeonic+' µg/L'} sub="across operations" color={stats.avgNeonic>4?T.red:T.amber}/>
          <KPI label="High Risk" value={filtered.filter(o=>o.pollinatorRisk==='High').length} sub="operations at high risk" color={T.red}/>
          <KPI label="Avg Wildflower" value={(filtered.length?Math.floor(filtered.reduce((a,o)=>a+o.wildflowerCoverage,0)/filtered.length):0)+'%'} sub="corridor coverage" color={T.sage}/>
          <KPI label="Pollinator-Dependent" value={(filtered.length?Math.floor(filtered.reduce((a,o)=>a+o.pollinatorDependency,0)/filtered.length):0)+'%'} sub="crop dependency" color={T.gold}/>
        </div>

        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:20}}>
          <Card>
            <div style={{fontWeight:600,fontSize:14,color:T.navy,marginBottom:12}}>Pollinator Dependency by Crop (%)</div>
            <ResponsiveContainer width="100%" height={360}>
              <BarChart data={cropDependency.sort((a,b)=>b.dependency-a.dependency)} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/>
                <XAxis type="number" domain={[0,100]} tick={{fontSize:11,fill:T.textSec}}/>
                <YAxis type="category" dataKey="name" width={100} tick={{fontSize:10,fill:T.textSec}}/>
                <Tooltip contentStyle={{fontFamily:T.font,fontSize:12}}/>
                <Legend/>
                <Bar dataKey="dependency" fill={T.gold} name="Dependency %" radius={[0,4,4,0]}/>
                <Bar dataKey="yieldAtRisk" fill={T.red} name="Yield at Risk %" radius={[0,4,4,0]}/>
              </BarChart>
            </ResponsiveContainer>
          </Card>
          <Card>
            <div style={{fontWeight:600,fontSize:14,color:T.navy,marginBottom:12}}>Neonicotinoid Exposure by Chemical</div>
            <ResponsiveContainer width="100%" height={360}>
              <BarChart data={neonicData}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/>
                <XAxis dataKey="name" tick={{fontSize:10,fill:T.textSec}} angle={-25} textAnchor="end" height={60}/>
                <YAxis tick={{fontSize:11,fill:T.textSec}}/>
                <Tooltip contentStyle={{fontFamily:T.font,fontSize:12}}/>
                <Legend/>
                <Bar dataKey="avgExposure" fill={T.red} name="Avg µg/L" radius={[4,4,0,0]}/>
                <Bar dataKey="ops" fill={T.navy} name="# Operations" radius={[4,4,0,0]}/>
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>

        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
          <Card>
            <div style={{fontWeight:600,fontSize:14,color:T.navy,marginBottom:12}}>Wildflower Corridor Impact (Before/After)</div>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={corridorImpact}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/>
                <XAxis dataKey="metric" tick={{fontSize:10,fill:T.textSec}}/>
                <YAxis tick={{fontSize:11,fill:T.textSec}}/>
                <Tooltip contentStyle={{fontFamily:T.font,fontSize:12}}/>
                <Legend/>
                <Bar dataKey="before" fill={T.textMut} name="Before" radius={[4,4,0,0]}/>
                <Bar dataKey="after" fill={T.green} name="After" radius={[4,4,0,0]}/>
              </BarChart>
            </ResponsiveContainer>
          </Card>
          <Card>
            <div style={{fontWeight:600,fontSize:14,color:T.navy,marginBottom:12}}>Pollinator Health Trend</div>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={pollinatorTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/>
                <XAxis dataKey="year" tick={{fontSize:11,fill:T.textSec}}/>
                <YAxis tick={{fontSize:11,fill:T.textSec}}/>
                <Tooltip contentStyle={{fontFamily:T.font,fontSize:12}}/>
                <Legend/>
                <Area type="monotone" dataKey="corridorArea" fill={T.green+'20'} stroke={T.green} strokeWidth={2} name="Corridor Area (k ha)"/>
                <Area type="monotone" dataKey="avgExposure" fill={T.red+'20'} stroke={T.red} strokeWidth={2} name="Avg Neonic µg/L"/>
              </AreaChart>
            </ResponsiveContainer>
          </Card>
        </div>
      </div>
    );
  };

  const renderSoilBiodiv=()=>{
    const avgIndicators=SOIL_INDICATORS.map((s,si)=>({indicator:s.length>14?s.slice(0,14)+'...':s,fullName:s,value:filtered.length?Math.floor(filtered.reduce((a,o)=>a+o.soilIndicators[si],0)/filtered.length):0}));
    const practiceImpact=PRACTICES.slice(0,8).map((p,pi)=>({practice:p.length>14?p.slice(0,14)+'...':p,fullName:p,microbial:Math.floor(10+sr(pi*17+1)*40),earthworm:Math.floor(15+sr(pi*23+3)*45),som:Math.floor(5+sr(pi*29+5)*30)}));
    const somDistribution=[{range:'<2%',count:filtered.filter(o=>o.soilOrgMatter<2).length},{range:'2-3.5%',count:filtered.filter(o=>o.soilOrgMatter>=2&&o.soilOrgMatter<3.5).length},{range:'3.5-5%',count:filtered.filter(o=>o.soilOrgMatter>=3.5&&o.soilOrgMatter<5).length},{range:'5-6.5%',count:filtered.filter(o=>o.soilOrgMatter>=5&&o.soilOrgMatter<6.5).length},{range:'>6.5%',count:filtered.filter(o=>o.soilOrgMatter>=6.5).length}];

    return(
      <div>
        <div style={{display:'flex',gap:12,marginBottom:20,flexWrap:'wrap'}}>
          <KPI label="Avg Microbial Diversity" value={filtered.length?+(filtered.reduce((a,o)=>a+o.microbialDiversity,0)/filtered.length).toFixed(1):'0'} sub="Shannon index" color={T.sage}/>
          <KPI label="Avg Earthworm Density" value={stats.avgEarthworm+'/m²'} sub="indicator species" color={T.green}/>
          <KPI label="Avg SOM" value={filtered.length?+(filtered.reduce((a,o)=>a+o.soilOrgMatter,0)/filtered.length).toFixed(1)+'%':'0%'} sub="soil organic matter" color={T.gold}/>
          <KPI label="High SOM (>5%)" value={filtered.filter(o=>o.soilOrgMatter>5).length} sub="operations" color={T.navy}/>
        </div>

        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:20}}>
          <Card>
            <div style={{fontWeight:600,fontSize:14,color:T.navy,marginBottom:12}}>Soil Biodiversity Indicators (Portfolio Avg)</div>
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={avgIndicators}>
                <PolarGrid stroke={T.borderL}/>
                <PolarAngleAxis dataKey="indicator" tick={{fontSize:9,fill:T.textSec}}/>
                <PolarRadiusAxis tick={{fontSize:8,fill:T.textMut}} domain={[0,100]}/>
                <Radar dataKey="value" stroke={T.sage} fill={T.sage+'30'} strokeWidth={2}/>
                <Tooltip contentStyle={{fontFamily:T.font,fontSize:12}}/>
              </RadarChart>
            </ResponsiveContainer>
          </Card>
          <Card>
            <div style={{fontWeight:600,fontSize:14,color:T.navy,marginBottom:12}}>Soil Organic Matter Distribution</div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={somDistribution}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/>
                <XAxis dataKey="range" tick={{fontSize:11,fill:T.textSec}}/>
                <YAxis tick={{fontSize:11,fill:T.textSec}}/>
                <Tooltip contentStyle={{fontFamily:T.font,fontSize:12}}/>
                <Bar dataKey="count" fill={T.gold} radius={[4,4,0,0]} name="Operations">{somDistribution.map((e,i)=><Cell key={i} fill={[T.red,T.amber,T.gold,T.sage,T.green][i]}/>)}</Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>

        <Card>
          <div style={{fontWeight:600,fontSize:14,color:T.navy,marginBottom:12}}>Practice Impact on Soil Biodiversity (% improvement)</div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={practiceImpact}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/>
              <XAxis dataKey="practice" tick={{fontSize:9,fill:T.textSec}} angle={-25} textAnchor="end" height={60}/>
              <YAxis tick={{fontSize:11,fill:T.textSec}}/>
              <Tooltip contentStyle={{fontFamily:T.font,fontSize:12}}/>
              <Legend/>
              <Bar dataKey="microbial" fill={T.sage} name="Microbial +" radius={[4,4,0,0]}/>
              <Bar dataKey="earthworm" fill={T.gold} name="Earthworm +" radius={[4,4,0,0]}/>
              <Bar dataKey="som" fill={T.navy} name="SOM +" radius={[4,4,0,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>
    );
  };

  const renderCreditMarket=()=>{
    const pilotBreakdown=CREDIT_PILOTS.map(p=>({name:p.length>18?p.slice(0,18)+'...':p,fullName:p,ops:filtered.filter(o=>o.creditPilot===p).length,credits:filtered.filter(o=>o.creditPilot===p).reduce((a,o)=>a+o.annualCreditPotential,0),avgPrice:Math.floor(8+CREDIT_PILOTS.indexOf(p)*2+sr(CREDIT_PILOTS.indexOf(p)*17)*5)})).filter(p=>p.ops>0);
    const marketTrend=YEARS.map((y,yi)=>({year:y.toString(),pilots:Math.floor(2+yi*1.5+sr(yi*23)*1),volume:Math.floor(50+yi*80+sr(yi*29)*40),avgPrice:Math.floor(5+yi*3+sr(yi*31)*4)}));
    const methComparison=[{method:'Habitat Hectares',metric:'Area-based',maturity:'Emerging',integrity:'Medium'},{method:'Species Richness',metric:'Count-based',maturity:'Piloting',integrity:'High'},{method:'MSA Delta',metric:'Index-based',maturity:'Emerging',integrity:'High'},{method:'Ecosystem Services',metric:'Function-based',maturity:'Conceptual',integrity:'Medium'},{method:'Biodiversity Net Gain',metric:'Offset-based',maturity:'Regulated (UK)',integrity:'High'}];

    return(
      <div>
        <div style={{display:'flex',gap:12,marginBottom:20,flexWrap:'wrap'}}>
          <KPI label="Pilot Participation" value={stats.pilotPct+'%'} sub="operations in pilots" color={T.sage}/>
          <KPI label="Annual Credit Potential" value={(stats.totalCredits/1000).toFixed(0)+'k units'} sub="biodiv credits" color={T.green}/>
          <KPI label="Active Pilots" value={pilotBreakdown.length} sub="methodologies" color={T.navy}/>
          <KPI label="Avg Credit Price" value={pilotBreakdown.length?'$'+Math.floor(pilotBreakdown.reduce((a,p)=>a+p.avgPrice,0)/pilotBreakdown.length):'N/A'} sub="per biodiv unit" color={T.gold}/>
        </div>

        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:20}}>
          <Card>
            <div style={{fontWeight:600,fontSize:14,color:T.navy,marginBottom:12}}>Pilot Programme Participation</div>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={pilotBreakdown} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/>
                <XAxis type="number" tick={{fontSize:11,fill:T.textSec}}/>
                <YAxis type="category" dataKey="name" width={130} tick={{fontSize:10,fill:T.textSec}}/>
                <Tooltip contentStyle={{fontFamily:T.font,fontSize:12}}/>
                <Legend/>
                <Bar dataKey="ops" fill={T.sage} name="Operations" radius={[0,4,4,0]}/>
                <Bar dataKey="credits" fill={T.gold} name="Credits" radius={[0,4,4,0]}/>
              </BarChart>
            </ResponsiveContainer>
          </Card>
          <Card>
            <div style={{fontWeight:600,fontSize:14,color:T.navy,marginBottom:12}}>Biodiversity Credit Market Trend</div>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={marketTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/>
                <XAxis dataKey="year" tick={{fontSize:11,fill:T.textSec}}/>
                <YAxis tick={{fontSize:11,fill:T.textSec}}/>
                <Tooltip contentStyle={{fontFamily:T.font,fontSize:12}}/>
                <Legend/>
                <Area type="monotone" dataKey="volume" fill={T.green+'20'} stroke={T.green} strokeWidth={2} name="Volume (k units)"/>
                <Area type="monotone" dataKey="avgPrice" fill={T.gold+'20'} stroke={T.gold} strokeWidth={2} name="Avg Price ($)"/>
              </AreaChart>
            </ResponsiveContainer>
          </Card>
        </div>

        <Card>
          <div style={{fontWeight:600,fontSize:14,color:T.navy,marginBottom:12}}>Methodology Comparison</div>
          <div style={{overflowX:'auto'}}>
            <table style={{width:'100%',borderCollapse:'collapse',fontFamily:T.font,fontSize:12}}>
              <thead><tr style={{borderBottom:`2px solid ${T.border}`}}>
                {['Method','Metric Type','Maturity','Integrity'].map(h=><th key={h} style={{padding:'8px 10px',textAlign:'left',color:T.textSec}}>{h}</th>)}
              </tr></thead>
              <tbody>{methComparison.map((m,i)=>(
                <tr key={i} style={{borderBottom:`1px solid ${T.borderL}`}}>
                  <td style={{padding:'6px 10px',fontWeight:600}}>{m.method}</td>
                  <td style={{padding:'6px 10px'}}>{m.metric}</td>
                  <td style={{padding:'6px 10px'}}><Badge color={m.maturity.includes('Regulated')?T.green:m.maturity==='Piloting'?T.amber:T.textMut}>{m.maturity}</Badge></td>
                  <td style={{padding:'6px 10px'}}><Badge color={m.integrity==='High'?T.green:T.amber}>{m.integrity}</Badge></td>
                </tr>
              ))}</tbody>
            </table>
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
            <span style={{fontFamily:T.mono,fontSize:11,color:T.textMut,letterSpacing:1}}>EP-AT5</span>
            <span style={{width:4,height:4,borderRadius:2,background:T.gold}}/>
            <span style={{fontFamily:T.mono,fontSize:11,color:T.textMut}}>FOOD SYSTEMS & AGRICULTURAL FINANCE</span>
          </div>
          <h1 style={{fontSize:22,fontWeight:700,color:T.navy,margin:0}}>Agricultural Biodiversity</h1>
          <p style={{fontSize:13,color:T.textSec,margin:'4px 0 0'}}>Biodiversity scorecard, pollinator health, soil biodiversity & emerging credit markets across {OPS.length} agricultural operations</p>
        </div>

        <div style={{display:'flex',gap:8,marginBottom:20,borderBottom:`2px solid ${T.border}`,paddingBottom:8}}>
          {TABS.map((t,i)=><Pill key={t} active={tab===i} onClick={()=>setTab(i)}>{t}</Pill>)}
        </div>

        {tab===0&&renderScorecard()}
        {tab===1&&renderPollinator()}
        {tab===2&&renderSoilBiodiv()}
        {tab===3&&renderCreditMarket()}
      </div>
    </div>
  );
}