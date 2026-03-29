import React,{useState,useMemo,useCallback} from 'react';
import {BarChart,Bar,XAxis,YAxis,CartesianGrid,Tooltip,ResponsiveContainer,AreaChart,Area,Cell,Legend,ScatterChart,Scatter,RadarChart,Radar,PolarGrid,PolarAngleAxis,PolarRadiusAxis} from 'recharts';

const T={bg:'#f6f4f0',surface:'#ffffff',surfaceH:'#f0ede7',border:'#e5e0d8',borderL:'#d5cfc5',navy:'#1b3a5c',navyL:'#2c5a8c',gold:'#c5a96a',goldL:'#d4be8a',sage:'#5a8a6a',sageL:'#7ba67d',teal:'#5a8a6a',text:'#1b3a5c',textSec:'#5c6b7e',textMut:'#9aa3ae',red:'#dc2626',green:'#16a34a',amber:'#d97706',font:"'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"};
const sr=(s)=>{let x=Math.sin(s+1)*10000;return x-Math.floor(x);};

const REGIONS=['Punjab, India','Murray-Darling, AU','Central Valley, US','Nile Delta, EG','North China Plain','Ogallala, US','Mekong Delta, VN','São Francisco, BR','Indus Basin, PK','Po Valley, IT','Ganges Plain, IN','Ebro Basin, ES','Saskatchewan, CA','Orange-Vaal, ZA','Tigris-Euphrates, IQ','Huang He Plain, CN','Pampas, AR','Loire Valley, FR','Danube Plain, HU','Rhine Valley, DE','Fergana Valley, UZ','Mae Klong, TH','Helmand, AF','Senegal River, SN','Limpopo, MZ','Blue Nile, ET','Irrawaddy, MM','Colorado Basin, US','Guadalquivir, ES','Tana River, KE','Jordan Valley, JO','Red River, VN','Aral Basin, KZ','Cauvery, IN','Krishna, IN','Godavari, IN','Mississippi Delta, US','Yangtze Delta, CN','Pearl River, CN','Columbia Basin, US','Snake River, US','Trinity, US','San Joaquin, US','Brazos, US','Volta Basin, GH','Niger Basin, NG','Zambezi, ZM','Okavango, BW','Rio Grande, MX','Euphrates, SY'];
const CROPS=['Rice','Wheat','Corn','Soybeans','Cotton','Sugarcane','Coffee','Almonds','Avocado','Tomatoes','Potatoes','Barley','Olives','Grapes','Palm Oil','Cocoa','Tea','Rubber','Cassava','Millet'];
const DROUGHT_SEVERITY=['Mild','Moderate','Severe','Extreme'];
const AWS_LEVELS=['Gold','Platinum','Core','Not Certified'];
const YEARS=[2019,2020,2021,2022,2023,2024,2025,2026];

const genRegions=(n)=>{
  const regions=[];
  for(let i=0;i<n;i++){
    const s1=sr(i*7+1),s2=sr(i*11+3),s3=sr(i*13+5),s4=sr(i*17+7),s5=sr(i*19+9),s6=sr(i*23+11);
    const name=REGIONS[i%REGIONS.length];
    const waterStress=+(1+s1*4).toFixed(2);
    const agWithdrawal=Math.floor(40+s2*50);
    const irrigEfficiency=Math.floor(30+s3*55);
    const groundwaterDepletion=+(0+s4*8).toFixed(1);
    const annualRainfall=Math.floor(100+s5*1400);
    const irrigArea=Math.floor(5000+s6*95000);
    const primaryCrop=CROPS[Math.floor(sr(i*29+13)*CROPS.length)];
    const secondaryCrop=CROPS[Math.floor(sr(i*31+15)*CROPS.length)];
    const awsCert=AWS_LEVELS[Math.floor(sr(i*37+17)*AWS_LEVELS.length)];
    const droughtFreq=+(0.5+sr(i*41+19)*3.5).toFixed(1);
    const cropWaterBlue=Math.floor(200+sr(i*43+21)*1800);
    const cropWaterGreen=Math.floor(500+sr(i*47+23)*3500);
    const cropWaterGrey=Math.floor(50+sr(i*53+25)*450);
    const yieldRisk=Math.floor(5+sr(i*59+27)*45);
    const revenueAtRisk=Math.floor(10+sr(i*61+29)*200);
    const waterPrice=+(0.1+sr(i*67+31)*2.5).toFixed(2);
    const reductionTarget=Math.floor(10+sr(i*71+33)*30);
    const currentReduction=Math.floor(sr(i*73+35)*reductionTarget);
    const circularWater=Math.floor(sr(i*79+37)*40);
    const investmentNeeded=Math.floor(5+sr(i*83+39)*95);
    const yearlyStress=YEARS.map((_,yi)=>+(waterStress+sr(i*89+yi*17)*0.3*yi/YEARS.length).toFixed(2));
    const yearlyYield=YEARS.map((_,yi)=>Math.floor(100-yieldRisk*0.3+sr(i*97+yi*13)*10));
    regions.push({id:i,name,waterStress,agWithdrawal,irrigEfficiency,groundwaterDepletion,annualRainfall,irrigArea,primaryCrop,secondaryCrop,awsCert,droughtFreq,cropWaterBlue,cropWaterGreen,cropWaterGrey,yieldRisk,revenueAtRisk,waterPrice,reductionTarget,currentReduction,circularWater,investmentNeeded,yearlyStress,yearlyYield,
      riskLevel:waterStress>3.5?'Extremely High':waterStress>2.5?'High':waterStress>1.5?'Medium':'Low',
      totalWaterFootprint:cropWaterBlue+cropWaterGreen+cropWaterGrey,
      latitude:+(sr(i*101+41)*140-70).toFixed(2),longitude:+(sr(i*103+43)*340-170).toFixed(2),
    });
  }
  return regions;
};

const REGION_DATA=genRegions(50);

const cropWaterData=CROPS.map((c,ci)=>({name:c,blue:Math.floor(200+sr(ci*17+1)*1800),green:Math.floor(500+sr(ci*23+3)*3500),grey:Math.floor(50+sr(ci*29+5)*450),total:0}));
cropWaterData.forEach(c=>{c.total=c.blue+c.green+c.grey;});

const Card=({children,style})=><div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:8,padding:20,...style}}>{children}</div>;
const Pill=({active,onClick,children})=><button onClick={onClick} style={{padding:'6px 16px',borderRadius:6,border:`1px solid ${active?T.gold:T.border}`,background:active?T.gold+'18':T.surface,color:active?T.navy:T.textSec,fontFamily:T.font,fontSize:13,fontWeight:active?600:400,cursor:'pointer',transition:'all 0.2s'}}>{children}</button>;
const KPI=({label,value,sub,color})=><Card style={{textAlign:'center',flex:1,minWidth:150}}><div style={{fontFamily:T.mono,fontSize:24,fontWeight:700,color:color||T.navy}}>{value}</div><div style={{fontSize:12,color:T.textSec,marginTop:4}}>{label}</div>{sub&&<div style={{fontSize:11,color:T.textMut,marginTop:2}}>{sub}</div>}</Card>;
const Badge=({children,color})=><span style={{display:'inline-block',padding:'2px 8px',borderRadius:4,fontSize:11,fontWeight:600,background:(color||T.sage)+'18',color:color||T.sage,marginRight:4}}>{children}</span>;

const TABS=['Water Stress Dashboard','Crop Water Footprint','Drought Risk Modelling','Water Stewardship'];
const COLORS=[T.navy,T.gold,T.sage,T.navyL,T.amber,T.red,T.green,T.teal,'#8b5cf6','#ec4899'];

export default function WaterAgricultureRiskPage(){
  const [tab,setTab]=useState(0);
  const [riskFilter,setRiskFilter]=useState('All');
  const [cropFilter,setCropFilter]=useState('All');
  const [sortField,setSortField]=useState('waterStress');
  const [sortDir,setSortDir]=useState('desc');
  const [selectedReg,setSelectedReg]=useState(null);
  const [droughtSev,setDroughtSev]=useState(1);
  const [droughtDur,setDroughtDur]=useState(3);
  const [awsFilter,setAwsFilter]=useState('All');
  const [searchTerm,setSearchTerm]=useState('');
  const [page,setPage]=useState(0);

  const filtered=useMemo(()=>{
    let f=REGION_DATA;
    if(riskFilter!=='All')f=f.filter(r=>r.riskLevel===riskFilter);
    if(cropFilter!=='All')f=f.filter(r=>r.primaryCrop===cropFilter||r.secondaryCrop===cropFilter);
    if(awsFilter!=='All')f=f.filter(r=>r.awsCert===awsFilter);
    if(searchTerm)f=f.filter(r=>r.name.toLowerCase().includes(searchTerm.toLowerCase()));
    const dir=sortDir==='asc'?1:-1;
    return [...f].sort((a,b)=>(a[sortField]>b[sortField]?dir:-dir));
  },[riskFilter,cropFilter,awsFilter,sortField,sortDir,searchTerm]);

  const stats=useMemo(()=>{
    const avgStress=filtered.length?+(filtered.reduce((a,r)=>a+r.waterStress,0)/filtered.length).toFixed(2):0;
    const totalIrrigArea=filtered.reduce((a,r)=>a+r.irrigArea,0);
    const avgEfficiency=filtered.length?Math.floor(filtered.reduce((a,r)=>a+r.irrigEfficiency,0)/filtered.length):0;
    const highRiskPct=filtered.length?Math.floor(filtered.filter(r=>r.waterStress>2.5).length/filtered.length*100):0;
    const totalRevAtRisk=filtered.reduce((a,r)=>a+r.revenueAtRisk,0);
    const avgDepletion=filtered.length?+(filtered.reduce((a,r)=>a+r.groundwaterDepletion,0)/filtered.length).toFixed(1):0;
    return{avgStress,totalIrrigArea,avgEfficiency,highRiskPct,totalRevAtRisk,avgDepletion};
  },[filtered]);

  const riskDistribution=useMemo(()=>['Low','Medium','High','Extremely High'].map(r=>({name:r,value:filtered.filter(reg=>reg.riskLevel===r).length})),[filtered]);
  const stressTrend=useMemo(()=>YEARS.map((y,yi)=>({year:y.toString(),avgStress:filtered.length?+(filtered.reduce((a,r)=>a+r.yearlyStress[yi],0)/filtered.length).toFixed(2):0})),[filtered]);

  const handleSort=useCallback((f)=>{if(sortField===f)setSortDir(d=>d==='asc'?'desc':'asc');else{setSortField(f);setSortDir('desc');}},[sortField]);
  const PAGE_SIZE=12;const totalPages=Math.ceil(filtered.length/PAGE_SIZE);const paged=filtered.slice(page*PAGE_SIZE,(page+1)*PAGE_SIZE);

  const renderWaterStress=()=>(
    <div>
      <div style={{display:'flex',gap:12,marginBottom:16,flexWrap:'wrap',alignItems:'center'}}>
        <input value={searchTerm} onChange={e=>{setSearchTerm(e.target.value);setPage(0);}} placeholder="Search regions..." style={{padding:'6px 12px',border:`1px solid ${T.border}`,borderRadius:6,fontFamily:T.font,fontSize:13,width:200}}/>
        <select value={riskFilter} onChange={e=>{setRiskFilter(e.target.value);setPage(0);}} style={{padding:'6px 10px',border:`1px solid ${T.border}`,borderRadius:6,fontFamily:T.font,fontSize:13}}>
          <option value="All">All Risk Levels</option>{['Low','Medium','High','Extremely High'].map(r=><option key={r} value={r}>{r}</option>)}
        </select>
        <select value={cropFilter} onChange={e=>{setCropFilter(e.target.value);setPage(0);}} style={{padding:'6px 10px',border:`1px solid ${T.border}`,borderRadius:6,fontFamily:T.font,fontSize:13}}>
          <option value="All">All Crops</option>{CROPS.map(c=><option key={c} value={c}>{c}</option>)}
        </select>
        <span style={{fontFamily:T.mono,fontSize:12,color:T.textMut}}>{filtered.length} regions</span>
      </div>

      <div style={{display:'flex',gap:12,marginBottom:20,flexWrap:'wrap'}}>
        <KPI label="Avg Water Stress" value={stats.avgStress} sub="Aqueduct index (0-5)" color={stats.avgStress>2.5?T.red:T.amber}/>
        <KPI label="Total Irrigated" value={(stats.totalIrrigArea/1000).toFixed(0)+'k ha'} sub="area under irrigation" color={T.navy}/>
        <KPI label="Avg Efficiency" value={stats.avgEfficiency+'%'} sub="irrigation efficiency" color={T.sage}/>
        <KPI label="High/Extreme Risk" value={stats.highRiskPct+'%'} sub="of regions" color={T.red}/>
        <KPI label="Revenue at Risk" value={'$'+stats.totalRevAtRisk+'M'} sub="water-related" color={T.amber}/>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:20}}>
        <Card>
          <div style={{fontWeight:600,fontSize:14,color:T.navy,marginBottom:12}}>Water Risk Distribution</div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={riskDistribution}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/>
              <XAxis dataKey="name" tick={{fontSize:11,fill:T.textSec}}/>
              <YAxis tick={{fontSize:11,fill:T.textSec}}/>
              <Tooltip contentStyle={{fontFamily:T.font,fontSize:12}}/>
              <Bar dataKey="value" name="Regions" radius={[4,4,0,0]}>{riskDistribution.map((e,i)=><Cell key={i} fill={[T.green,T.amber,T.red,'#991b1b'][i]}/>)}</Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>
        <Card>
          <div style={{fontWeight:600,fontSize:14,color:T.navy,marginBottom:12}}>Water Stress Trend (Avg Index)</div>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={stressTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/>
              <XAxis dataKey="year" tick={{fontSize:11,fill:T.textSec}}/>
              <YAxis tick={{fontSize:11,fill:T.textSec}} domain={[0,5]}/>
              <Tooltip contentStyle={{fontFamily:T.font,fontSize:12}}/>
              <Area type="monotone" dataKey="avgStress" fill={T.red+'20'} stroke={T.red} strokeWidth={2} name="Avg Stress Index"/>
            </AreaChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <Card style={{marginBottom:20}}>
        <div style={{fontWeight:600,fontSize:14,color:T.navy,marginBottom:12}}>Water Stress vs Agricultural Withdrawal</div>
        <ResponsiveContainer width="100%" height={300}>
          <ScatterChart>
            <CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/>
            <XAxis type="number" dataKey="waterStress" name="Water Stress" tick={{fontSize:11,fill:T.textSec}} domain={[0,5]}/>
            <YAxis type="number" dataKey="agWithdrawal" name="Ag Withdrawal %" tick={{fontSize:11,fill:T.textSec}}/>
            <Tooltip contentStyle={{fontFamily:T.font,fontSize:12}} formatter={(v,n)=>[v,n]}/>
            <Scatter data={filtered} fill={T.navy} fillOpacity={0.6} name="Regions"/>
          </ScatterChart>
        </ResponsiveContainer>
      </Card>

      <Card>
        <div style={{fontWeight:600,fontSize:14,color:T.navy,marginBottom:12}}>Regional Water Risk Registry</div>
        <div style={{overflowX:'auto'}}>
          <table style={{width:'100%',borderCollapse:'collapse',fontFamily:T.font,fontSize:12}}>
            <thead><tr style={{borderBottom:`2px solid ${T.border}`}}>
              {[{k:'name',l:'Region'},{k:'waterStress',l:'Stress'},{k:'agWithdrawal',l:'Ag %'},{k:'irrigEfficiency',l:'Efficiency'},{k:'groundwaterDepletion',l:'GW Depl.'},{k:'riskLevel',l:'Risk'},{k:'primaryCrop',l:'Primary Crop'}].map(({k,l})=>(
                <th key={k} onClick={()=>handleSort(k)} style={{padding:'8px 6px',textAlign:'left',cursor:'pointer',color:sortField===k?T.navy:T.textSec,fontWeight:sortField===k?700:500,whiteSpace:'nowrap'}}>{l}{sortField===k?(sortDir==='asc'?' ↑':' ↓'):''}</th>
              ))}
            </tr></thead>
            <tbody>{paged.map(r=>(
              <tr key={r.id} onClick={()=>setSelectedReg(r.id===selectedReg?null:r.id)} style={{borderBottom:`1px solid ${T.borderL}`,background:r.id===selectedReg?T.surfaceH:'transparent',cursor:'pointer'}}>
                <td style={{padding:'6px',fontWeight:500,fontSize:11}}>{r.name}</td>
                <td style={{padding:'6px',fontFamily:T.mono,color:r.waterStress>3.5?T.red:r.waterStress>2.5?T.amber:T.green}}>{r.waterStress}</td>
                <td style={{padding:'6px',fontFamily:T.mono}}>{r.agWithdrawal}%</td>
                <td style={{padding:'6px',fontFamily:T.mono}}>{r.irrigEfficiency}%</td>
                <td style={{padding:'6px',fontFamily:T.mono}}>{r.groundwaterDepletion} cm/yr</td>
                <td style={{padding:'6px'}}><Badge color={r.riskLevel==='Extremely High'?T.red:r.riskLevel==='High'?T.amber:r.riskLevel==='Medium'?T.gold:T.green}>{r.riskLevel}</Badge></td>
                <td style={{padding:'6px'}}>{r.primaryCrop}</td>
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

      {selectedReg!==null&&(()=>{const r=REGION_DATA.find(x=>x.id===selectedReg);if(!r)return null;return(
        <Card style={{marginTop:16}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
            <div style={{fontWeight:700,fontSize:16,color:T.navy}}>{r.name}</div>
            <button onClick={()=>setSelectedReg(null)} style={{background:'none',border:'none',color:T.textMut,cursor:'pointer',fontSize:18}}>×</button>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12,marginBottom:16}}>
            <div><span style={{color:T.textMut,fontSize:11}}>Water Stress</span><div style={{fontWeight:600,fontFamily:T.mono,color:r.waterStress>3?T.red:T.amber}}>{r.waterStress}/5.0</div></div>
            <div><span style={{color:T.textMut,fontSize:11}}>Irrigated Area</span><div style={{fontWeight:600,fontFamily:T.mono}}>{r.irrigArea.toLocaleString()} ha</div></div>
            <div><span style={{color:T.textMut,fontSize:11}}>Annual Rainfall</span><div style={{fontWeight:600,fontFamily:T.mono}}>{r.annualRainfall} mm</div></div>
            <div><span style={{color:T.textMut,fontSize:11}}>Drought Freq</span><div style={{fontWeight:600,fontFamily:T.mono}}>{r.droughtFreq}/yr</div></div>
            <div><span style={{color:T.textMut,fontSize:11}}>GW Depletion</span><div style={{fontWeight:600,fontFamily:T.mono,color:T.red}}>{r.groundwaterDepletion} cm/yr</div></div>
            <div><span style={{color:T.textMut,fontSize:11}}>Revenue at Risk</span><div style={{fontWeight:600,fontFamily:T.mono}}>${r.revenueAtRisk}M</div></div>
            <div><span style={{color:T.textMut,fontSize:11}}>AWS Cert</span><Badge color={r.awsCert==='Gold'?T.gold:r.awsCert==='Platinum'?T.navy:T.textMut}>{r.awsCert}</Badge></div>
            <div><span style={{color:T.textMut,fontSize:11}}>Investment Needed</span><div style={{fontWeight:600,fontFamily:T.mono}}>${r.investmentNeeded}M</div></div>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={YEARS.map((y,yi)=>({year:y.toString(),stress:r.yearlyStress[yi]}))}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/><XAxis dataKey="year" tick={{fontSize:10,fill:T.textSec}}/><YAxis tick={{fontSize:10,fill:T.textSec}} domain={[0,5]}/>
                <Tooltip contentStyle={{fontFamily:T.font,fontSize:12}}/><Area type="monotone" dataKey="stress" fill={T.red+'20'} stroke={T.red} strokeWidth={2} name="Water Stress"/>
              </AreaChart>
            </ResponsiveContainer>
            <div>
              <div style={{fontSize:12,fontWeight:600,marginBottom:8}}>Water Footprint Breakdown</div>
              <div style={{display:'flex',gap:8}}>
                {[{label:'Blue',val:r.cropWaterBlue,color:T.navy},{label:'Green',val:r.cropWaterGreen,color:T.green},{label:'Grey',val:r.cropWaterGrey,color:T.textMut}].map(w=>(
                  <div key={w.label} style={{flex:1,textAlign:'center',padding:8,background:w.color+'10',borderRadius:6,border:`1px solid ${w.color}30`}}>
                    <div style={{fontFamily:T.mono,fontSize:18,fontWeight:700,color:w.color}}>{w.val}</div>
                    <div style={{fontSize:11,color:T.textSec}}>{w.label} m³/t</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>
      );})()}
    </div>
  );

  const renderCropWater=()=>{
    const sorted=[...cropWaterData].sort((a,b)=>b.total-a.total);
    const virtualWaterTrade=[{flow:'US→China (Soy)',volume:45},{flow:'Brazil→EU (Coffee)',volume:32},{flow:'India→ME (Rice)',volume:28},{flow:'AU→Asia (Wheat)',volume:22},{flow:'Thailand→World (Rice)',volume:19},{flow:'Argentina→China (Soy)',volume:16},{flow:'Vietnam→EU (Coffee)',volume:14},{flow:'Indonesia→World (Palm)',volume:38},{flow:'Mexico→US (Avocado)',volume:11},{flow:'Spain→EU (Olives)',volume:9}];

    return(
      <div>
        <div style={{display:'flex',gap:12,marginBottom:20,flexWrap:'wrap'}}>
          <KPI label="Highest Water Crop" value={sorted[0].name} sub={sorted[0].total+' m³/t total'} color={T.red}/>
          <KPI label="Lowest Water Crop" value={sorted[sorted.length-1].name} sub={sorted[sorted.length-1].total+' m³/t total'} color={T.green}/>
          <KPI label="Avg Blue Water" value={Math.floor(cropWaterData.reduce((a,c)=>a+c.blue,0)/cropWaterData.length)+' m³/t'} sub="irrigation component" color={T.navy}/>
          <KPI label="Avg Total" value={Math.floor(cropWaterData.reduce((a,c)=>a+c.total,0)/cropWaterData.length)+' m³/t'} sub="all components" color={T.gold}/>
        </div>

        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:20}}>
          <Card>
            <div style={{fontWeight:600,fontSize:14,color:T.navy,marginBottom:12}}>Crop Water Footprint (m³/tonne)</div>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={sorted.slice(0,15)} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/>
                <XAxis type="number" tick={{fontSize:11,fill:T.textSec}}/>
                <YAxis type="category" dataKey="name" width={80} tick={{fontSize:10,fill:T.textSec}}/>
                <Tooltip contentStyle={{fontFamily:T.font,fontSize:12}}/>
                <Legend/>
                <Bar dataKey="blue" stackId="a" fill={T.navy} name="Blue"/>
                <Bar dataKey="green" stackId="a" fill={T.green} name="Green"/>
                <Bar dataKey="grey" stackId="a" fill={T.textMut} name="Grey"/>
              </BarChart>
            </ResponsiveContainer>
          </Card>
          <Card>
            <div style={{fontWeight:600,fontSize:14,color:T.navy,marginBottom:12}}>Virtual Water Trade Flows (km³/yr)</div>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={virtualWaterTrade} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/>
                <XAxis type="number" tick={{fontSize:11,fill:T.textSec}}/>
                <YAxis type="category" dataKey="flow" width={150} tick={{fontSize:10,fill:T.textSec}}/>
                <Tooltip contentStyle={{fontFamily:T.font,fontSize:12}}/>
                <Bar dataKey="volume" fill={T.gold} radius={[0,4,4,0]} name="km³/yr"/>
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>

        <Card>
          <div style={{fontWeight:600,fontSize:14,color:T.navy,marginBottom:12}}>Blue vs Green Water by Crop</div>
          <ResponsiveContainer width="100%" height={300}>
            <ScatterChart>
              <CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/>
              <XAxis type="number" dataKey="blue" name="Blue Water" tick={{fontSize:11,fill:T.textSec}}/>
              <YAxis type="number" dataKey="green" name="Green Water" tick={{fontSize:11,fill:T.textSec}}/>
              <Tooltip contentStyle={{fontFamily:T.font,fontSize:12}} formatter={(v,n)=>[v+' m³/t',n]}/>
              <Scatter data={cropWaterData} fill={T.sage} fillOpacity={0.7} name="Crops"/>
            </ScatterChart>
          </ResponsiveContainer>
        </Card>
      </div>
    );
  };

  const renderDrought=()=>{
    const sevIdx=droughtSev;const durMo=droughtDur;
    const impactData=filtered.slice(0,20).map(r=>{const base=r.yieldRisk;const sev=sevIdx*15;const dur=durMo*5;const impact=Math.min(95,Math.floor(base+sev+dur+sr(r.id*23)*10));return{name:r.name.length>18?r.name.slice(0,18)+'...':r.name,yieldLoss:impact,revenueLoss:Math.floor(r.revenueAtRisk*impact/100),insuranceTrigger:impact>40};});
    const scenarioMatrix=DROUGHT_SEVERITY.map((sev,si)=>[3,6,9,12].map(dur=>({severity:sev,duration:dur+'mo',avgYieldLoss:Math.floor(10+si*15+dur*2+sr(si*17+dur*11)*8)}))).flat();
    const historicalDroughts=[{year:'2012',region:'US Midwest',yieldImpact:-27,econLoss:35},{year:'2015',region:'India (El Niño)',yieldImpact:-18,econLoss:22},{year:'2018',region:'Europe Heat',yieldImpact:-20,econLoss:28},{year:'2019',region:'Australia',yieldImpact:-35,econLoss:14},{year:'2021',region:'Brazil (La Niña)',yieldImpact:-22,econLoss:18},{year:'2022',region:'Horn of Africa',yieldImpact:-45,econLoss:8},{year:'2023',region:'Amazon Basin',yieldImpact:-15,econLoss:12},{year:'2024',region:'Southern Europe',yieldImpact:-24,econLoss:25}];

    return(
      <div>
        <div style={{display:'flex',gap:16,marginBottom:16,alignItems:'center',flexWrap:'wrap'}}>
          <label style={{fontSize:12,color:T.textSec}}>Drought Severity:</label>
          <input type="range" min={0} max={3} step={1} value={droughtSev} onChange={e=>setDroughtSev(+e.target.value)} style={{width:150}}/>
          <Badge color={[T.green,T.amber,T.red,'#991b1b'][droughtSev]}>{DROUGHT_SEVERITY[droughtSev]}</Badge>
          <label style={{fontSize:12,color:T.textSec,marginLeft:16}}>Duration (months):</label>
          <input type="range" min={1} max={12} step={1} value={droughtDur} onChange={e=>setDroughtDur(+e.target.value)} style={{width:150}}/>
          <span style={{fontFamily:T.mono,fontSize:12,color:T.navy}}>{droughtDur} mo</span>
        </div>

        <div style={{display:'flex',gap:12,marginBottom:20,flexWrap:'wrap'}}>
          <KPI label="Avg Yield Impact" value={impactData.length?'-'+Math.floor(impactData.reduce((a,d)=>a+d.yieldLoss,0)/impactData.length)+'%':'N/A'} sub={DROUGHT_SEVERITY[droughtSev]+' / '+droughtDur+'mo'} color={T.red}/>
          <KPI label="Revenue at Risk" value={'$'+impactData.reduce((a,d)=>a+d.revenueLoss,0)+'M'} sub="modelled scenario" color={T.amber}/>
          <KPI label="Insurance Triggers" value={impactData.filter(d=>d.insuranceTrigger).length+'/'+impactData.length} sub=">40% yield loss" color={T.navy}/>
          <KPI label="Avg GW Depletion" value={stats.avgDepletion+' cm/yr'} sub="accelerating under drought" color={T.red}/>
        </div>

        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:20}}>
          <Card>
            <div style={{fontWeight:600,fontSize:14,color:T.navy,marginBottom:12}}>Scenario Impact: Yield Loss by Region</div>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={impactData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/>
                <XAxis type="number" tick={{fontSize:11,fill:T.textSec}} domain={[0,100]}/>
                <YAxis type="category" dataKey="name" width={120} tick={{fontSize:9,fill:T.textSec}}/>
                <Tooltip contentStyle={{fontFamily:T.font,fontSize:12}}/>
                <Bar dataKey="yieldLoss" name="Yield Loss %" radius={[0,4,4,0]}>{impactData.map((e,i)=><Cell key={i} fill={e.yieldLoss>60?T.red:e.yieldLoss>30?T.amber:T.green}/>)}</Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card>
          <Card>
            <div style={{fontWeight:600,fontSize:14,color:T.navy,marginBottom:12}}>Historical Major Droughts</div>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={historicalDroughts}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/>
                <XAxis dataKey="year" tick={{fontSize:11,fill:T.textSec}}/>
                <YAxis tick={{fontSize:11,fill:T.textSec}}/>
                <Tooltip contentStyle={{fontFamily:T.font,fontSize:12}}/>
                <Legend/>
                <Bar dataKey="econLoss" fill={T.gold} name="Econ Loss $B" radius={[4,4,0,0]}/>
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>

        <Card>
          <div style={{fontWeight:600,fontSize:14,color:T.navy,marginBottom:12}}>Drought Scenario Matrix — Avg Yield Loss %</div>
          <div style={{overflowX:'auto'}}>
            <table style={{width:'100%',borderCollapse:'collapse',fontFamily:T.font,fontSize:12}}>
              <thead><tr style={{borderBottom:`2px solid ${T.border}`}}>
                <th style={{padding:'8px',textAlign:'left',color:T.textSec}}>Severity \ Duration</th>
                {[3,6,9,12].map(d=><th key={d} style={{padding:'8px',textAlign:'center',color:T.textSec}}>{d} months</th>)}
              </tr></thead>
              <tbody>{DROUGHT_SEVERITY.map((sev,si)=>(
                <tr key={sev} style={{borderBottom:`1px solid ${T.borderL}`}}>
                  <td style={{padding:'6px 8px',fontWeight:600}}>{sev}</td>
                  {[3,6,9,12].map((dur,di)=>{const val=scenarioMatrix.find(s=>s.severity===sev&&s.duration===dur+'mo');return(
                    <td key={di} style={{padding:'6px 8px',textAlign:'center',fontFamily:T.mono,color:val.avgYieldLoss>50?T.red:val.avgYieldLoss>30?T.amber:T.green,fontWeight:600}}>{val.avgYieldLoss}%</td>
                  );})}
                </tr>
              ))}</tbody>
            </table>
          </div>
        </Card>
      </div>
    );
  };

  const renderStewardship=()=>{
    const awsBreakdown=AWS_LEVELS.map(l=>({level:l,count:filtered.filter(r=>r.awsCert===l).length}));
    const targetProgress=filtered.map(r=>({name:r.name.length>18?r.name.slice(0,18)+'...':r.name,target:r.reductionTarget,current:r.currentReduction,gap:r.reductionTarget-r.currentReduction}));
    const investmentNeeds=[{area:'Drip Irrigation',cost:25,impact:35,payback:4},{area:'Rainwater Harvesting',cost:12,impact:15,payback:3},{area:'Water Recycling',cost:30,impact:25,payback:5},{area:'Precision Monitoring',cost:8,impact:18,payback:2},{area:'Desalination',cost:45,impact:20,payback:8},{area:'Watershed Restoration',cost:18,impact:22,payback:6},{area:'Soil Moisture Sensors',cost:5,impact:12,payback:1.5},{area:'Leak Detection',cost:10,impact:10,payback:2}];
    const waterRiskProfile=[{metric:'Physical Risk',value:filtered.length?Math.floor(filtered.reduce((a,r)=>a+r.waterStress*20,0)/filtered.length):0},{metric:'Regulatory Risk',value:Math.floor(45+sr(1001)*25)},{metric:'Reputational Risk',value:Math.floor(30+sr(1003)*30)},{metric:'Supply Chain Risk',value:Math.floor(50+sr(1005)*30)},{metric:'Technology Risk',value:Math.floor(20+sr(1007)*25)},{metric:'Financial Risk',value:Math.floor(35+sr(1009)*35)}];

    return(
      <div>
        <div style={{display:'flex',gap:12,marginBottom:16,alignItems:'center'}}>
          <select value={awsFilter} onChange={e=>setAwsFilter(e.target.value)} style={{padding:'6px 10px',border:`1px solid ${T.border}`,borderRadius:6,fontFamily:T.font,fontSize:13}}>
            <option value="All">All AWS Levels</option>{AWS_LEVELS.map(l=><option key={l} value={l}>{l}</option>)}
          </select>
        </div>

        <div style={{display:'flex',gap:12,marginBottom:20,flexWrap:'wrap'}}>
          <KPI label="AWS Certified" value={filtered.filter(r=>r.awsCert!=='Not Certified').length} sub={'of '+filtered.length+' regions'} color={T.sage}/>
          <KPI label="Avg Circular Water" value={filtered.length?Math.floor(filtered.reduce((a,r)=>a+r.circularWater,0)/filtered.length)+'%':'0%'} sub="reuse rate" color={T.green}/>
          <KPI label="Total Investment Need" value={'$'+filtered.reduce((a,r)=>a+r.investmentNeeded,0)+'M'} sub="for water resilience" color={T.navy}/>
          <KPI label="On Track" value={filtered.filter(r=>r.currentReduction>=r.reductionTarget*0.7).length} sub="≥70% of target" color={T.gold}/>
        </div>

        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:20}}>
          <Card>
            <div style={{fontWeight:600,fontSize:14,color:T.navy,marginBottom:12}}>AWS Certification Distribution</div>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={awsBreakdown}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/>
                <XAxis dataKey="level" tick={{fontSize:11,fill:T.textSec}}/>
                <YAxis tick={{fontSize:11,fill:T.textSec}}/>
                <Tooltip contentStyle={{fontFamily:T.font,fontSize:12}}/>
                <Bar dataKey="count" name="Regions" radius={[4,4,0,0]}>{awsBreakdown.map((e,i)=><Cell key={i} fill={[T.gold,T.navy,T.sage,T.textMut][i]}/>)}</Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card>
          <Card>
            <div style={{fontWeight:600,fontSize:14,color:T.navy,marginBottom:12}}>Water Risk Profile</div>
            <ResponsiveContainer width="100%" height={260}>
              <RadarChart data={waterRiskProfile}>
                <PolarGrid stroke={T.borderL}/>
                <PolarAngleAxis dataKey="metric" tick={{fontSize:10,fill:T.textSec}}/>
                <PolarRadiusAxis tick={{fontSize:9,fill:T.textMut}} domain={[0,100]}/>
                <Radar dataKey="value" stroke={T.navy} fill={T.navy+'30'} strokeWidth={2}/>
                <Tooltip contentStyle={{fontFamily:T.font,fontSize:12}}/>
              </RadarChart>
            </ResponsiveContainer>
          </Card>
        </div>

        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
          <Card>
            <div style={{fontWeight:600,fontSize:14,color:T.navy,marginBottom:12}}>Water Investment — Impact vs Cost</div>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={investmentNeeds}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/>
                <XAxis dataKey="area" tick={{fontSize:9,fill:T.textSec}} angle={-30} textAnchor="end" height={60}/>
                <YAxis tick={{fontSize:11,fill:T.textSec}}/>
                <Tooltip contentStyle={{fontFamily:T.font,fontSize:12}}/>
                <Legend/>
                <Bar dataKey="impact" fill={T.green} name="Impact %" radius={[4,4,0,0]}/>
                <Bar dataKey="cost" fill={T.navy} name="Cost $M" radius={[4,4,0,0]}/>
              </BarChart>
            </ResponsiveContainer>
          </Card>
          <Card>
            <div style={{fontWeight:600,fontSize:14,color:T.navy,marginBottom:12}}>Reduction Target Progress (top 15)</div>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={targetProgress.slice(0,15)} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/>
                <XAxis type="number" tick={{fontSize:11,fill:T.textSec}}/>
                <YAxis type="category" dataKey="name" width={120} tick={{fontSize:9,fill:T.textSec}}/>
                <Tooltip contentStyle={{fontFamily:T.font,fontSize:12}}/>
                <Legend/>
                <Bar dataKey="current" stackId="a" fill={T.green} name="Achieved %"/>
                <Bar dataKey="gap" stackId="a" fill={T.borderL} name="Remaining %"/>
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>
      </div>
    );
  };

  return(
    <div style={{fontFamily:T.font,color:T.text,background:T.bg,minHeight:'100vh',padding:24}}>
      <div style={{maxWidth:1400,margin:'0 auto'}}>
        <div style={{marginBottom:20}}>
          <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:4}}>
            <span style={{fontFamily:T.mono,fontSize:11,color:T.textMut,letterSpacing:1}}>EP-AT3</span>
            <span style={{width:4,height:4,borderRadius:2,background:T.gold}}/>
            <span style={{fontFamily:T.mono,fontSize:11,color:T.textMut}}>FOOD SYSTEMS & AGRICULTURAL FINANCE</span>
          </div>
          <h1 style={{fontSize:22,fontWeight:700,color:T.navy,margin:0}}>Water & Agriculture Risk</h1>
          <p style={{fontSize:13,color:T.textSec,margin:'4px 0 0'}}>Water stress mapping, crop water footprint, drought risk modelling & stewardship across {REGION_DATA.length} agricultural regions</p>
        </div>

        <div style={{display:'flex',gap:8,marginBottom:20,borderBottom:`2px solid ${T.border}`,paddingBottom:8}}>
          {TABS.map((t,i)=><Pill key={t} active={tab===i} onClick={()=>setTab(i)}>{t}</Pill>)}
        </div>

        {tab===0&&renderWaterStress()}
        {tab===1&&renderCropWater()}
        {tab===2&&renderDrought()}
        {tab===3&&renderStewardship()}
      </div>
    </div>
  );
}