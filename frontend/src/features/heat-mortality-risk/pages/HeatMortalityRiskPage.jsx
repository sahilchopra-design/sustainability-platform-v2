import React,{useState,useMemo,useCallback} from 'react';
import {BarChart,Bar,XAxis,YAxis,CartesianGrid,Tooltip,ResponsiveContainer,LineChart,Line,AreaChart,Area,Cell,Legend,ScatterChart,Scatter} from 'recharts';

const T={bg:'#f6f4f0',surface:'#ffffff',surfaceH:'#f0ede7',border:'#e5e0d8',borderL:'#d5cfc5',navy:'#1b3a5c',navyL:'#2c5a8c',gold:'#c5a96a',goldL:'#d4be8a',sage:'#5a8a6a',sageL:'#7ba67d',teal:'#5a8a6a',text:'#1b3a5c',textSec:'#5c6b7e',textMut:'#9aa3ae',red:'#dc2626',green:'#16a34a',amber:'#d97706',font:"'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"};
const sr=(s)=>{let x=Math.sin(s+1)*10000;return x-Math.floor(x);};

const QUARTERS=['Q1-23','Q2-23','Q3-23','Q4-23','Q1-24','Q2-24','Q3-24','Q4-24','Q1-25','Q2-25','Q3-25','Q4-25'];
const RCP_SCENARIOS=['RCP 2.6','RCP 4.5','RCP 8.5'];
const HORIZONS=[2030,2040,2050];
const COUNTRIES=['US','IN','NG','PK','BD','BR','MX','EG','SA','IQ','AU','TH','PH','ID','CN','JP','ES','IT','FR','GR'];
const SECTORS_LABOUR=['Construction','Agriculture','Mining','Manufacturing','Military','Transport','Utilities','Forestry','Fisheries','Outdoor Services'];

const CITY_NAMES=['Phoenix','Dubai','Delhi','Lagos','Karachi','Dhaka','Baghdad','Riyadh','Cairo','Bangkok','Houston','Mumbai','Chennai','Kolkata','Lahore','Doha','Kuwait City','Muscat','Abu Dhabi','Jeddah',
'Singapore','Jakarta','Manila','Ho Chi Minh','Hanoi','Manaus','Sao Paulo','Monterrey','Hermosillo','Ahmedabad','Hyderabad','Nagpur','Bhopal','Lucknow','Jaipur','Athens','Seville','Palermo','Nicosia','Izmir',
'Perth','Darwin','Alice Springs','Tucson','Las Vegas','San Antonio','New Orleans','Miami','Tampa','Orlando','Havana','Kingston','Port Moresby','Suva','Nairobi','Accra','Bamako','Ouagadougou','Khartoum','Mogadishu'];

const genCities=(count)=>{
  const cities=[];
  for(let i=0;i<count;i++){
    const s1=sr(i*7+3);const s2=sr(i*13+7);const s3=sr(i*19+11);const s4=sr(i*23+17);const s5=sr(i*29+19);const s6=sr(i*31+23);
    const baseWBGT=25+s1*12;
    const days35=Math.floor(30+s2*180);
    const mortalityBase=Math.floor(s3*800+50);
    const uhiIntensity=1+s4*6;
    const popMillion=s5*25+0.5;
    const lat=s6>0.5?(s6*40):(s6*-40+20);
    const rcpMort=RCP_SCENARIOS.map((_,ri)=>HORIZONS.map((_,hi)=>Math.floor(mortalityBase*(1+ri*0.3+hi*0.25+sr(i*37+ri*11+hi*7)*0.2))));
    const rcpWBGT=RCP_SCENARIOS.map((_,ri)=>HORIZONS.map((_,hi)=>+(baseWBGT+ri*1.2+hi*0.8+sr(i*41+ri*13+hi*9)*0.5).toFixed(1)));
    const rcpDays=RCP_SCENARIOS.map((_,ri)=>HORIZONS.map((_,hi)=>Math.floor(days35*(1+ri*0.15+hi*0.2+sr(i*43+ri*17+hi*11)*0.1))));
    const qTrend=QUARTERS.map((_,qi)=>({q:QUARTERS[qi],mort:Math.floor(mortalityBase*(0.8+qi*0.03+sr(i*47+qi*13)*0.15)),wbgt:+(baseWBGT+qi*0.1+sr(i*53+qi*7)*0.5).toFixed(1)}));
    const labourLoss=SECTORS_LABOUR.map((sec,si)=>({sector:sec,lossPercent:+(sr(i*59+si*11)*8+1).toFixed(1),gdpImpactM:Math.floor(sr(i*61+si*13)*500+10),workersExposedK:Math.floor(sr(i*67+si*17)*200+5)}));
    const greenInfraGapM=Math.floor(sr(i*71+5)*2000+100);
    const cddProjection=HORIZONS.map((_,hi)=>Math.floor(1500+hi*400+sr(i*73+hi*11)*300));
    const healthcostM=Math.floor(sr(i*79+9)*1500+50);
    const insuranceClaimsM=Math.floor(sr(i*83+3)*400+10);
    const realEstateImpactPct=+(sr(i*89+7)*15+1).toFixed(1);
    const portfolioExposurePct=+(sr(i*97+13)*25+1).toFixed(1);
    cities.push({id:i,name:CITY_NAMES[i]||`City_${i}`,country:COUNTRIES[i%COUNTRIES.length],lat:+lat.toFixed(1),popMillion:+popMillion.toFixed(1),
      baseWBGT:+baseWBGT.toFixed(1),days35,mortalityBase,uhiIntensity:+uhiIntensity.toFixed(1),
      rcpMort,rcpWBGT,rcpDays,qTrend,labourLoss,greenInfraGapM,cddProjection,healthcostM,insuranceClaimsM,realEstateImpactPct,portfolioExposurePct,
      riskTier:mortalityBase>500?'Critical':mortalityBase>300?'High':mortalityBase>150?'Medium':'Low'});
  }
  return cities;
};

const CITIES=genCities(60);

const pill=(color,text)=>(<span style={{display:'inline-block',padding:'2px 10px',borderRadius:12,fontSize:11,fontWeight:600,background:color+'18',color,border:`1px solid ${color}30`}}>{text}</span>);
const tierColor=(t)=>t==='Critical'?T.red:t==='High'?T.amber:t==='Medium'?T.gold:T.green;
const fmt=(n)=>n>=1e9?(n/1e9).toFixed(1)+'B':n>=1e6?(n/1e6).toFixed(1)+'M':n>=1e3?(n/1e3).toFixed(1)+'K':String(n);
const card=(s)=>({background:T.surface,borderRadius:10,border:`1px solid ${T.border}`,padding:18,...s});
const kpiBox=(label,value,sub,color)=>(<div style={card({flex:'1',minWidth:180,textAlign:'center'})}><div style={{fontSize:11,color:T.textMut,fontFamily:T.mono,textTransform:'uppercase',letterSpacing:1}}>{label}</div><div style={{fontSize:28,fontWeight:700,color:color||T.navy,margin:'4px 0'}}>{value}</div>{sub&&<div style={{fontSize:12,color:T.textSec}}>{sub}</div>}</div>);

export default function HeatMortalityRiskPage(){
  const [tab,setTab]=useState(0);
  const [rcpIdx,setRcpIdx]=useState(1);
  const [horizonIdx,setHorizonIdx]=useState(0);
  const [sortKey,setSortKey]=useState('mortalityBase');
  const [sortDir,setSortDir]=useState('desc');
  const [searchTerm,setSearchTerm]=useState('');
  const [selectedCity,setSelectedCity]=useState(null);
  const [sectorFilter,setSectorFilter]=useState('All');
  const [countryFilter,setCountryFilter]=useState('All');

  const TABS=['Heat Risk Dashboard','Labour Productivity Impact','Urban Heat Island','Financial Impact'];

  const filteredCities=useMemo(()=>{
    let c=[...CITIES];
    if(searchTerm) c=c.filter(x=>x.name.toLowerCase().includes(searchTerm.toLowerCase()));
    if(countryFilter!=='All') c=c.filter(x=>x.country===countryFilter);
    c.sort((a,b)=>{
      let va=a[sortKey],vb=b[sortKey];
      if(sortKey==='rcpMortProj'){va=a.rcpMort[rcpIdx][horizonIdx];vb=b.rcpMort[rcpIdx][horizonIdx];}
      return sortDir==='desc'?vb-va:va-vb;
    });
    return c;
  },[searchTerm,countryFilter,sortKey,sortDir,rcpIdx,horizonIdx]);

  const topKPIs=useMemo(()=>{
    const crit=CITIES.filter(c=>c.riskTier==='Critical').length;
    const avgWBGT=+(CITIES.length?CITIES.reduce((s,c)=>s+c.baseWBGT,0)/CITIES.length:0).toFixed(1);
    const totalMort=CITIES.reduce((s,c)=>s+c.rcpMort[rcpIdx][horizonIdx],0);
    const avgDays35=CITIES.length?Math.floor(CITIES.reduce((s,c)=>s+c.days35,0)/CITIES.length):0;
    return {crit,avgWBGT,totalMort,avgDays35};
  },[rcpIdx,horizonIdx]);

  const barData=useMemo(()=>filteredCities.slice(0,25).map(c=>({
    name:c.name,mortality:c.rcpMort[rcpIdx][horizonIdx],wbgt:c.rcpWBGT[rcpIdx][horizonIdx],days35:c.rcpDays[rcpIdx][horizonIdx]
  })),[filteredCities,rcpIdx,horizonIdx]);

  const scatterData=useMemo(()=>CITIES.map(c=>({
    name:c.name,x:c.rcpWBGT[rcpIdx][horizonIdx],y:c.rcpMort[rcpIdx][horizonIdx],z:c.popMillion,tier:c.riskTier
  })),[rcpIdx,horizonIdx]);

  const labourAgg=useMemo(()=>{
    const agg={};
    SECTORS_LABOUR.forEach(sec=>{agg[sec]={totalGDP:0,totalWorkers:0,avgLoss:0,count:0};});
    CITIES.forEach(c=>c.labourLoss.forEach(l=>{agg[l.sector].totalGDP+=l.gdpImpactM;agg[l.sector].totalWorkers+=l.workersExposedK;agg[l.sector].avgLoss+=l.lossPercent;agg[l.sector].count++;}));
    return SECTORS_LABOUR.map(sec=>({sector:sec,totalGDPM:agg[sec].totalGDP,totalWorkersK:agg[sec].totalWorkers,avgLossPct:+(agg[sec].avgLoss/agg[sec].count).toFixed(1)}));
  },[]);

  const labourBySector=useMemo(()=>{
    if(sectorFilter==='All') return labourAgg;
    return labourAgg.filter(l=>l.sector===sectorFilter);
  },[labourAgg,sectorFilter]);

  const tempProductivityCurve=useMemo(()=>{
    const points=[];
    for(let t=20;t<=50;t++){
      const prod=t<=25?100:t<=30?100-(t-25)*2:t<=35?90-(t-30)*5:t<=40?65-(t-35)*8:t<=45?25-(t-40)*4:Math.max(5,25-(t-40)*4);
      points.push({temp:t,productivity:Math.max(0,Math.floor(prod))});
    }
    return points;
  },[]);

  const uhiData=useMemo(()=>CITIES.sort((a,b)=>b.uhiIntensity-a.uhiIntensity).slice(0,30).map(c=>({
    name:c.name,uhi:c.uhiIntensity,greenGapM:c.greenInfraGapM,cdd2030:c.cddProjection[0],cdd2040:c.cddProjection[1],cdd2050:c.cddProjection[2]
  })),[]);

  const financialData=useMemo(()=>CITIES.sort((a,b)=>b.healthcostM-a.healthcostM).slice(0,30).map(c=>({
    name:c.name,healthcostM:c.healthcostM,insuranceM:c.insuranceClaimsM,realEstatePct:c.realEstateImpactPct,portfolioPct:c.portfolioExposurePct,tier:c.riskTier
  })),[]);

  const totalFinancial=useMemo(()=>({
    healthCost:CITIES.reduce((s,c)=>s+c.healthcostM,0),insurance:CITIES.reduce((s,c)=>s+c.insuranceClaimsM,0),
    avgREImpact:+(CITIES.length?CITIES.reduce((s,c)=>s+c.realEstateImpactPct,0)/CITIES.length:0).toFixed(1),
    avgPortfolio:+(CITIES.length?CITIES.reduce((s,c)=>s+c.portfolioExposurePct,0)/CITIES.length:0).toFixed(1)
  }),[]);

  const cityDetail=selectedCity?CITIES.find(c=>c.id===selectedCity):null;

  const sortToggle=(key)=>{if(sortKey===key)setSortDir(d=>d==='desc'?'asc':'desc');else{setSortKey(key);setSortDir('desc');}};
  const thStyle={padding:'8px 10px',textAlign:'left',fontSize:11,fontFamily:T.mono,color:T.textMut,textTransform:'uppercase',letterSpacing:0.5,borderBottom:`2px solid ${T.border}`,cursor:'pointer',userSelect:'none',whiteSpace:'nowrap'};
  const tdStyle={padding:'8px 10px',fontSize:13,borderBottom:`1px solid ${T.border}`};

  const renderTab0=()=>(
    <div>
      <div style={{display:'flex',gap:12,marginBottom:20,flexWrap:'wrap'}}>
        {kpiBox('Critical Cities',topKPIs.crit,`of ${CITIES.length} monitored`,T.red)}
        {kpiBox('Avg Wet-Bulb',topKPIs.avgWBGT+'C','Global Mean',T.amber)}
        {kpiBox(`Proj. Mortality (${HORIZONS[horizonIdx]})`,fmt(topKPIs.totalMort),RCP_SCENARIOS[rcpIdx],T.red)}
        {kpiBox('Avg Days >35C',topKPIs.avgDays35,'Baseline annual',T.amber)}
      </div>
      <div style={{display:'flex',gap:12,marginBottom:16,alignItems:'center',flexWrap:'wrap'}}>
        <div style={{display:'flex',gap:4}}>{RCP_SCENARIOS.map((r,i)=>(<button key={i} onClick={()=>setRcpIdx(i)} style={{padding:'5px 14px',borderRadius:6,border:`1px solid ${rcpIdx===i?T.navy:T.border}`,background:rcpIdx===i?T.navy:'transparent',color:rcpIdx===i?'#fff':T.text,fontSize:12,fontWeight:600,cursor:'pointer',fontFamily:T.mono}}>{r}</button>))}</div>
        <div style={{display:'flex',gap:4}}>{HORIZONS.map((h,i)=>(<button key={i} onClick={()=>setHorizonIdx(i)} style={{padding:'5px 14px',borderRadius:6,border:`1px solid ${horizonIdx===i?T.gold:T.border}`,background:horizonIdx===i?T.gold+'20':'transparent',color:horizonIdx===i?T.navy:T.text,fontSize:12,fontWeight:600,cursor:'pointer',fontFamily:T.mono}}>{h}</button>))}</div>
        <input placeholder="Search city..." value={searchTerm} onChange={e=>setSearchTerm(e.target.value)} style={{padding:'6px 12px',borderRadius:6,border:`1px solid ${T.border}`,fontSize:13,fontFamily:T.font,flex:1,minWidth:160}}/>
        <select value={countryFilter} onChange={e=>setCountryFilter(e.target.value)} style={{padding:'6px 12px',borderRadius:6,border:`1px solid ${T.border}`,fontSize:13,fontFamily:T.font}}>
          <option value="All">All Countries</option>
          {COUNTRIES.map(c=>(<option key={c} value={c}>{c}</option>))}
        </select>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:20}}>
        <div style={card()}>
          <div style={{fontSize:13,fontWeight:600,color:T.navy,marginBottom:8}}>Projected Heat Mortality by City ({RCP_SCENARIOS[rcpIdx]}, {HORIZONS[horizonIdx]})</div>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={barData} layout="vertical" margin={{left:80,right:20,top:5,bottom:5}}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/>
              <XAxis type="number" tick={{fontSize:10,fill:T.textSec}}/>
              <YAxis dataKey="name" type="category" tick={{fontSize:10,fill:T.textSec}} width={75}/>
              <Tooltip contentStyle={{fontSize:12,borderRadius:8,border:`1px solid ${T.border}`}}/>
              <Bar dataKey="mortality" radius={[0,4,4,0]}>
                {barData.map((d,i)=>(<Cell key={i} fill={d.mortality>600?T.red:d.mortality>400?T.amber:d.mortality>200?T.gold:T.green}/>))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={card()}>
          <div style={{fontSize:13,fontWeight:600,color:T.navy,marginBottom:8}}>WBGT vs Mortality (bubble = population)</div>
          <ResponsiveContainer width="100%" height={350}>
            <ScatterChart margin={{top:10,right:20,bottom:20,left:10}}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/>
              <XAxis dataKey="x" name="WBGT (C)" tick={{fontSize:10,fill:T.textSec}} label={{value:'Wet-Bulb Globe Temp (C)',position:'bottom',fontSize:10,fill:T.textMut}}/>
              <YAxis dataKey="y" name="Mortality" tick={{fontSize:10,fill:T.textSec}} label={{value:'Proj. Deaths/yr',angle:-90,position:'insideLeft',fontSize:10,fill:T.textMut}}/>
              <Tooltip contentStyle={{fontSize:12,borderRadius:8}} formatter={(v,n)=>[v,n]} labelFormatter={(l)=>`City: ${scatterData[l]?.name||''}`}/>
              <Scatter data={scatterData} fill={T.navy}>
                {scatterData.map((d,i)=>(<Cell key={i} fill={tierColor(d.tier)} opacity={0.7}/>))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div style={card({marginBottom:20})}>
        <div style={{fontSize:13,fontWeight:600,color:T.navy,marginBottom:8}}>Heat Mortality Risk Ranking &mdash; {RCP_SCENARIOS[rcpIdx]} / {HORIZONS[horizonIdx]}</div>
        <div style={{overflowX:'auto'}}>
          <table style={{width:'100%',borderCollapse:'collapse'}}>
            <thead><tr>
              <th style={thStyle}>#</th>
              <th style={thStyle} onClick={()=>sortToggle('name')}>City</th>
              <th style={thStyle}>Country</th>
              <th style={thStyle} onClick={()=>sortToggle('mortalityBase')}>Baseline Mort.</th>
              <th style={thStyle} onClick={()=>sortToggle('rcpMortProj')}>Proj. Mort.</th>
              <th style={thStyle} onClick={()=>sortToggle('baseWBGT')}>WBGT (C)</th>
              <th style={thStyle} onClick={()=>sortToggle('days35')}>Days &gt;35C</th>
              <th style={thStyle}>Pop (M)</th>
              <th style={thStyle}>Risk Tier</th>
              <th style={thStyle}>UHI (C)</th>
            </tr></thead>
            <tbody>{filteredCities.slice(0,40).map((c,i)=>(<tr key={c.id} onClick={()=>setSelectedCity(c.id)} style={{cursor:'pointer',background:selectedCity===c.id?T.surfaceH:'transparent'}}>
              <td style={tdStyle}>{i+1}</td>
              <td style={{...tdStyle,fontWeight:600}}>{c.name}</td>
              <td style={tdStyle}><span style={{fontFamily:T.mono,fontSize:11}}>{c.country}</span></td>
              <td style={tdStyle}>{c.mortalityBase}</td>
              <td style={{...tdStyle,fontWeight:600,color:c.rcpMort[rcpIdx][horizonIdx]>600?T.red:c.rcpMort[rcpIdx][horizonIdx]>300?T.amber:T.text}}>{c.rcpMort[rcpIdx][horizonIdx]}</td>
              <td style={tdStyle}>{c.rcpWBGT[rcpIdx][horizonIdx]}</td>
              <td style={tdStyle}>{c.rcpDays[rcpIdx][horizonIdx]}</td>
              <td style={tdStyle}>{c.popMillion.toFixed(1)}</td>
              <td style={tdStyle}>{pill(tierColor(c.riskTier),c.riskTier)}</td>
              <td style={tdStyle}>{c.uhiIntensity}C</td>
            </tr>))}</tbody>
          </table>
        </div>
      </div>
      {cityDetail&&(<div style={card({marginBottom:20})}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
          <div><span style={{fontSize:16,fontWeight:700,color:T.navy}}>{cityDetail.name}</span> <span style={{fontSize:12,color:T.textMut,fontFamily:T.mono}}>{cityDetail.country} | Pop {cityDetail.popMillion.toFixed(1)}M</span></div>
          <button onClick={()=>setSelectedCity(null)} style={{padding:'4px 12px',borderRadius:6,border:`1px solid ${T.border}`,background:'transparent',cursor:'pointer',fontSize:12}}>Close</button>
        </div>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={cityDetail.qTrend} margin={{top:5,right:20,bottom:5,left:10}}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/>
            <XAxis dataKey="q" tick={{fontSize:10,fill:T.textSec}}/>
            <YAxis yAxisId="l" tick={{fontSize:10,fill:T.textSec}}/>
            <YAxis yAxisId="r" orientation="right" tick={{fontSize:10,fill:T.textSec}}/>
            <Tooltip contentStyle={{fontSize:12,borderRadius:8}}/>
            <Legend wrapperStyle={{fontSize:11}}/>
            <Line yAxisId="l" type="monotone" dataKey="mort" stroke={T.red} name="Mortality" strokeWidth={2}/>
            <Line yAxisId="r" type="monotone" dataKey="wbgt" stroke={T.amber} name="WBGT (C)" strokeWidth={2}/>
          </LineChart>
        </ResponsiveContainer>
      </div>)}
    </div>
  );

  const renderTab1=()=>(
    <div>
      <div style={{display:'flex',gap:12,marginBottom:20,flexWrap:'wrap'}}>
        {kpiBox('Total GDP Loss',`$${fmt(labourAgg.reduce((s,l)=>s+l.totalGDPM,0)*1e6)}`,'Heat-related across sectors',T.red)}
        {kpiBox('Workers Exposed',fmt(labourAgg.reduce((s,l)=>s+l.totalWorkersK,0)*1000),'Outdoor/industrial',T.amber)}
        {kpiBox('Avg Productivity Loss',`${(labourAgg.length?labourAgg.reduce((s,l)=>s+l.avgLossPct,0)/labourAgg.length:0).toFixed(1)}%`,'Mean across sectors',T.gold)}
        {kpiBox('Most Affected','Construction',`${labourAgg.find(l=>l.sector==='Construction')?.avgLossPct}% avg loss`,T.red)}
      </div>
      <div style={{display:'flex',gap:8,marginBottom:16,flexWrap:'wrap'}}>
        <button onClick={()=>setSectorFilter('All')} style={{padding:'5px 14px',borderRadius:6,border:`1px solid ${sectorFilter==='All'?T.navy:T.border}`,background:sectorFilter==='All'?T.navy:'transparent',color:sectorFilter==='All'?'#fff':T.text,fontSize:12,fontWeight:600,cursor:'pointer'}}>All Sectors</button>
        {SECTORS_LABOUR.map(s=>(<button key={s} onClick={()=>setSectorFilter(s)} style={{padding:'5px 14px',borderRadius:6,border:`1px solid ${sectorFilter===s?T.navy:T.border}`,background:sectorFilter===s?T.navy:'transparent',color:sectorFilter===s?'#fff':T.text,fontSize:12,fontWeight:600,cursor:'pointer'}}>{s}</button>))}
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:20}}>
        <div style={card()}>
          <div style={{fontSize:13,fontWeight:600,color:T.navy,marginBottom:8}}>GDP Loss by Sector ($M)</div>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={labourBySector} layout="vertical" margin={{left:100,right:20,top:5,bottom:5}}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/>
              <XAxis type="number" tick={{fontSize:10,fill:T.textSec}}/>
              <YAxis dataKey="sector" type="category" tick={{fontSize:10,fill:T.textSec}} width={95}/>
              <Tooltip contentStyle={{fontSize:12,borderRadius:8}}/>
              <Bar dataKey="totalGDPM" fill={T.red} radius={[0,4,4,0]} name="GDP Loss ($M)"/>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={card()}>
          <div style={{fontSize:13,fontWeight:600,color:T.navy,marginBottom:8}}>Temperature vs Productivity Curve</div>
          <ResponsiveContainer width="100%" height={350}>
            <AreaChart data={tempProductivityCurve} margin={{top:5,right:20,bottom:20,left:10}}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/>
              <XAxis dataKey="temp" tick={{fontSize:10,fill:T.textSec}} label={{value:'Temperature (C)',position:'bottom',fontSize:10,fill:T.textMut}}/>
              <YAxis tick={{fontSize:10,fill:T.textSec}} label={{value:'Productivity %',angle:-90,position:'insideLeft',fontSize:10,fill:T.textMut}}/>
              <Tooltip contentStyle={{fontSize:12,borderRadius:8}}/>
              <Area type="monotone" dataKey="productivity" stroke={T.red} fill={T.red+'30'} strokeWidth={2} name="Productivity %"/>
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div style={card({marginBottom:20})}>
        <div style={{fontSize:13,fontWeight:600,color:T.navy,marginBottom:8}}>Workers Exposed by Sector (thousands)</div>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={labourBySector} margin={{top:5,right:20,bottom:5,left:10}}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/>
            <XAxis dataKey="sector" tick={{fontSize:9,fill:T.textSec,angle:-30,textAnchor:'end'}} height={60}/>
            <YAxis tick={{fontSize:10,fill:T.textSec}}/>
            <Tooltip contentStyle={{fontSize:12,borderRadius:8}}/>
            <Legend wrapperStyle={{fontSize:11}}/>
            <Bar dataKey="totalWorkersK" fill={T.amber} radius={[4,4,0,0]} name="Workers (K)"/>
            <Bar dataKey="avgLossPct" fill={T.red} radius={[4,4,0,0]} name="Avg Loss %"/>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div style={card()}>
        <div style={{fontSize:13,fontWeight:600,color:T.navy,marginBottom:8}}>City-Level Labour Impact Detail</div>
        <div style={{overflowX:'auto',maxHeight:400,overflowY:'auto'}}>
          <table style={{width:'100%',borderCollapse:'collapse'}}>
            <thead style={{position:'sticky',top:0,background:T.surface,zIndex:1}}><tr>
              <th style={thStyle}>City</th>
              {SECTORS_LABOUR.slice(0,5).map(s=>(<th key={s} style={thStyle}>{s} Loss%</th>))}
              <th style={thStyle}>Total GDP Loss ($M)</th>
            </tr></thead>
            <tbody>{CITIES.slice(0,30).map(c=>{const total=c.labourLoss.reduce((s,l)=>s+l.gdpImpactM,0);return(<tr key={c.id}>
              <td style={{...tdStyle,fontWeight:600}}>{c.name}</td>
              {c.labourLoss.slice(0,5).map((l,li)=>(<td key={li} style={{...tdStyle,color:l.lossPercent>6?T.red:l.lossPercent>4?T.amber:T.text}}>{l.lossPercent}%</td>))}
              <td style={{...tdStyle,fontWeight:600}}>${fmt(total*1e6)}</td>
            </tr>);})}</tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderTab2=()=>(
    <div>
      <div style={{display:'flex',gap:12,marginBottom:20,flexWrap:'wrap'}}>
        {kpiBox('Avg UHI Intensity',`${(CITIES.length?CITIES.reduce((s,c)=>s+c.uhiIntensity,0)/CITIES.length:0).toFixed(1)}C`,'Urban Heat Island effect',T.red)}
        {kpiBox('Green Infra Gap',`$${fmt(CITIES.reduce((s,c)=>s+c.greenInfraGapM,0)*1e6)}`,'Investment needed',T.amber)}
        {kpiBox('Avg CDD 2050',CITIES.length?Math.floor(CITIES.reduce((s,c)=>s+c.cddProjection[2],0)/CITIES.length):0,'Cooling Degree Days',T.gold)}
        {kpiBox('High UHI Cities',CITIES.filter(c=>c.uhiIntensity>5).length,'>5C UHI intensity',T.red)}
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:20}}>
        <div style={card()}>
          <div style={{fontSize:13,fontWeight:600,color:T.navy,marginBottom:8}}>UHI Intensity by City (top 30)</div>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={uhiData} layout="vertical" margin={{left:80,right:20,top:5,bottom:5}}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/>
              <XAxis type="number" tick={{fontSize:10,fill:T.textSec}}/>
              <YAxis dataKey="name" type="category" tick={{fontSize:10,fill:T.textSec}} width={75}/>
              <Tooltip contentStyle={{fontSize:12,borderRadius:8}}/>
              <Bar dataKey="uhi" radius={[0,4,4,0]} name="UHI Intensity (C)">
                {uhiData.map((d,i)=>(<Cell key={i} fill={d.uhi>5?T.red:d.uhi>3?T.amber:T.gold}/>))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={card()}>
          <div style={{fontSize:13,fontWeight:600,color:T.navy,marginBottom:8}}>Cooling Degree Day Projections</div>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={uhiData.slice(0,15)} margin={{top:5,right:20,bottom:30,left:10}}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/>
              <XAxis dataKey="name" tick={{fontSize:9,fill:T.textSec,angle:-30,textAnchor:'end'}} height={60}/>
              <YAxis tick={{fontSize:10,fill:T.textSec}}/>
              <Tooltip contentStyle={{fontSize:12,borderRadius:8}}/>
              <Legend wrapperStyle={{fontSize:11}}/>
              <Bar dataKey="cdd2030" fill={T.gold} radius={[4,4,0,0]} name="CDD 2030"/>
              <Bar dataKey="cdd2040" fill={T.amber} radius={[4,4,0,0]} name="CDD 2040"/>
              <Bar dataKey="cdd2050" fill={T.red} radius={[4,4,0,0]} name="CDD 2050"/>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div style={card({marginBottom:20})}>
        <div style={{fontSize:13,fontWeight:600,color:T.navy,marginBottom:8}}>Green Infrastructure Investment Gap ($M)</div>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={uhiData.slice(0,20)} margin={{top:5,right:20,bottom:30,left:10}}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/>
            <XAxis dataKey="name" tick={{fontSize:9,fill:T.textSec,angle:-30,textAnchor:'end'}} height={60}/>
            <YAxis tick={{fontSize:10,fill:T.textSec}}/>
            <Tooltip contentStyle={{fontSize:12,borderRadius:8}}/>
            <Bar dataKey="greenGapM" fill={T.sage} radius={[4,4,0,0]} name="Green Infra Gap ($M)"/>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div style={card()}>
        <div style={{fontSize:13,fontWeight:600,color:T.navy,marginBottom:8}}>City UHI Detail Table</div>
        <div style={{overflowX:'auto',maxHeight:350,overflowY:'auto'}}>
          <table style={{width:'100%',borderCollapse:'collapse'}}>
            <thead style={{position:'sticky',top:0,background:T.surface}}><tr>
              <th style={thStyle}>City</th><th style={thStyle}>UHI (C)</th><th style={thStyle}>Green Gap ($M)</th><th style={thStyle}>CDD 2030</th><th style={thStyle}>CDD 2040</th><th style={thStyle}>CDD 2050</th><th style={thStyle}>Pop (M)</th>
            </tr></thead>
            <tbody>{uhiData.map(d=>{const c=CITIES.find(x=>x.name===d.name);return(<tr key={d.name}>
              <td style={{...tdStyle,fontWeight:600}}>{d.name}</td>
              <td style={{...tdStyle,color:d.uhi>5?T.red:T.text}}>{d.uhi}</td>
              <td style={tdStyle}>${fmt(d.greenGapM*1e6)}</td>
              <td style={tdStyle}>{d.cdd2030}</td><td style={tdStyle}>{d.cdd2040}</td><td style={tdStyle}>{d.cdd2050}</td>
              <td style={tdStyle}>{c?.popMillion.toFixed(1)}</td>
            </tr>);})}</tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderTab3=()=>(
    <div>
      <div style={{display:'flex',gap:12,marginBottom:20,flexWrap:'wrap'}}>
        {kpiBox('Total Healthcare Cost',`$${fmt(totalFinancial.healthCost*1e6)}`,'Annual projected',T.red)}
        {kpiBox('Insurance Claims',`$${fmt(totalFinancial.insurance*1e6)}`,'Heat-related annual',T.amber)}
        {kpiBox('Avg RE Impact',`-${totalFinancial.avgREImpact}%`,'Real estate value decline',T.red)}
        {kpiBox('Portfolio Exposure',`${totalFinancial.avgPortfolio}%`,'Avg heat-exposed holdings',T.amber)}
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:20}}>
        <div style={card()}>
          <div style={{fontSize:13,fontWeight:600,color:T.navy,marginBottom:8}}>Healthcare Cost Projections by City ($M)</div>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={financialData} layout="vertical" margin={{left:80,right:20,top:5,bottom:5}}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/>
              <XAxis type="number" tick={{fontSize:10,fill:T.textSec}}/>
              <YAxis dataKey="name" type="category" tick={{fontSize:10,fill:T.textSec}} width={75}/>
              <Tooltip contentStyle={{fontSize:12,borderRadius:8}}/>
              <Legend wrapperStyle={{fontSize:11}}/>
              <Bar dataKey="healthcostM" fill={T.red} radius={[0,4,4,0]} name="Healthcare ($M)"/>
              <Bar dataKey="insuranceM" fill={T.amber} radius={[0,4,4,0]} name="Insurance ($M)"/>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={card()}>
          <div style={{fontSize:13,fontWeight:600,color:T.navy,marginBottom:8}}>Real Estate Value Impact vs Portfolio Exposure</div>
          <ResponsiveContainer width="100%" height={400}>
            <ScatterChart margin={{top:10,right:20,bottom:20,left:10}}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/>
              <XAxis dataKey="realEstatePct" name="RE Value Decline %" tick={{fontSize:10,fill:T.textSec}} label={{value:'Real Estate Decline %',position:'bottom',fontSize:10,fill:T.textMut}}/>
              <YAxis dataKey="portfolioPct" name="Portfolio Exposure %" tick={{fontSize:10,fill:T.textSec}} label={{value:'Portfolio Exposure %',angle:-90,position:'insideLeft',fontSize:10,fill:T.textMut}}/>
              <Tooltip contentStyle={{fontSize:12,borderRadius:8}} formatter={(v,n)=>[v+'%',n]}/>
              <Scatter data={financialData} fill={T.navy}>
                {financialData.map((d,i)=>(<Cell key={i} fill={tierColor(d.tier)} opacity={0.7}/>))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div style={card({marginBottom:20})}>
        <div style={{fontSize:13,fontWeight:600,color:T.navy,marginBottom:8}}>Quarterly Healthcare Cost Trend (Top 10 Cities)</div>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={QUARTERS.map((q,qi)=>({q,...Object.fromEntries(CITIES.slice(0,10).map(c=>[c.name,c.qTrend[qi].mort]))}))} margin={{top:5,right:20,bottom:5,left:10}}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/>
            <XAxis dataKey="q" tick={{fontSize:10,fill:T.textSec}}/>
            <YAxis tick={{fontSize:10,fill:T.textSec}}/>
            <Tooltip contentStyle={{fontSize:12,borderRadius:8}}/>
            <Legend wrapperStyle={{fontSize:10}}/>
            {CITIES.slice(0,10).map((c,i)=><Line key={i} type="monotone" dataKey={c.name} stroke={[T.red,T.amber,T.gold,T.sage,T.navy,T.navyL,T.teal,'#9333ea','#0891b2','#be185d'][i]} strokeWidth={1.5} dot={false}/>)}
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div style={card()}>
        <div style={{fontSize:13,fontWeight:600,color:T.navy,marginBottom:8}}>Financial Impact Detail</div>
        <div style={{overflowX:'auto',maxHeight:350,overflowY:'auto'}}>
          <table style={{width:'100%',borderCollapse:'collapse'}}>
            <thead style={{position:'sticky',top:0,background:T.surface}}><tr>
              <th style={thStyle}>City</th><th style={thStyle}>Healthcare ($M)</th><th style={thStyle}>Insurance ($M)</th><th style={thStyle}>RE Decline %</th><th style={thStyle}>Portfolio Exp %</th><th style={thStyle}>Risk Tier</th>
            </tr></thead>
            <tbody>{financialData.map(d=>(<tr key={d.name}>
              <td style={{...tdStyle,fontWeight:600}}>{d.name}</td>
              <td style={{...tdStyle,color:d.healthcostM>1000?T.red:T.text}}>${fmt(d.healthcostM*1e6)}</td>
              <td style={tdStyle}>${fmt(d.insuranceM*1e6)}</td>
              <td style={{...tdStyle,color:T.red}}>-{d.realEstatePct}%</td>
              <td style={tdStyle}>{d.portfolioPct}%</td>
              <td style={tdStyle}>{pill(tierColor(d.tier),d.tier)}</td>
            </tr>))}</tbody>
          </table>
        </div>
      </div>
    </div>
  );

  return(
    <div style={{fontFamily:T.font,background:T.bg,minHeight:'100vh',padding:24,color:T.text}}>
      <div style={{maxWidth:1440,margin:'0 auto'}}>
        <div style={{marginBottom:24}}>
          <h1 style={{fontSize:26,fontWeight:700,color:T.navy,margin:0}}>Heat Mortality Risk</h1>
          <p style={{color:T.textSec,fontSize:14,margin:'4px 0 0'}}>Wet-bulb temperature thresholds, heat mortality projections, labour productivity & urban heat island analytics across 60 cities</p>
        </div>
        <div style={{display:'flex',gap:4,marginBottom:20,borderBottom:`2px solid ${T.border}`,paddingBottom:0}}>
          {TABS.map((t,i)=>(<button key={i} onClick={()=>setTab(i)} style={{padding:'10px 20px',border:'none',borderBottom:tab===i?`3px solid ${T.gold}`:'3px solid transparent',background:'transparent',color:tab===i?T.navy:T.textMut,fontWeight:tab===i?700:500,fontSize:13,cursor:'pointer',fontFamily:T.font,transition:'all 0.2s'}}>{t}</button>))}
        </div>
        {tab===0&&renderTab0()}
        {tab===1&&renderTab1()}
        {tab===2&&renderTab2()}
        {tab===3&&renderTab3()}
        <div style={{marginTop:32,padding:'12px 16px',background:T.surfaceH,borderRadius:8,border:`1px solid ${T.border}`,fontSize:11,color:T.textMut,fontFamily:T.mono}}>
          EP-AU1 Heat Mortality Risk | Sprint AU: Climate & Health Nexus Finance | 60 cities, {RCP_SCENARIOS.length} RCP scenarios, {HORIZONS.length} horizons, {SECTORS_LABOUR.length} sectors, {QUARTERS.length}Q trend
        </div>
      </div>
    </div>
  );
}