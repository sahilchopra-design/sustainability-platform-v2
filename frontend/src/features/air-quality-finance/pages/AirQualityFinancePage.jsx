import React,{useState,useMemo,useCallback} from 'react';
import {BarChart,Bar,XAxis,YAxis,CartesianGrid,Tooltip,ResponsiveContainer,AreaChart,Area,Cell,Legend,PieChart,Pie,RadarChart,Radar,PolarGrid,PolarAngleAxis,PolarRadiusAxis} from 'recharts';

const T={bg:'#f6f4f0',surface:'#ffffff',surfaceH:'#f0ede7',border:'#e5e0d8',borderL:'#d5cfc5',navy:'#1b3a5c',navyL:'#2c5a8c',gold:'#c5a96a',goldL:'#d4be8a',sage:'#5a8a6a',sageL:'#7ba67d',teal:'#5a8a6a',text:'#1b3a5c',textSec:'#5c6b7e',textMut:'#9aa3ae',red:'#dc2626',green:'#16a34a',amber:'#d97706',font:"'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"};
const sr=(s)=>{let x=Math.sin(s+1)*10000;return x-Math.floor(x);};

const QUARTERS=['Q1-23','Q2-23','Q3-23','Q4-23','Q1-24','Q2-24','Q3-24','Q4-24','Q1-25','Q2-25','Q3-25','Q4-25'];
const POLLUTANTS=['PM2.5','PM10','NO2','O3','SO2','CO'];
const ABATEMENT_TECHS=['Electrostatic Precipitator','Scrubber Systems','Catalytic Converter','Baghouse Filter','Low-NOx Burner','Selective Catalytic Reduction','Diesel Particulate Filter','Wet Scrubber','Cyclone Separator','Activated Carbon Adsorption'];
const SECTORS=['Power Generation','Manufacturing','Transport','Mining','Construction','Oil & Gas','Chemicals','Steel','Cement','Agriculture'];

const CITY_NAMES=['Beijing','Delhi','Mumbai','Shanghai','Cairo','Dhaka','Lahore','Jakarta','Mexico City','Lima','Ho Chi Minh','Bangkok','Chengdu','Lagos','Karachi','Kolkata','Hanoi','Baghdad','Kabul','Ulaanbaatar',
'Seoul','Sao Paulo','Santiago','Bogota','Addis Ababa','Nairobi','Accra','Kampala','Kinshasa','Dar es Salaam','London','Paris','Berlin','Tokyo','Sydney','New York','Los Angeles','Chicago','Toronto','Singapore',
'Dubai','Riyadh','Doha','Istanbul','Tehran','Moscow','Warsaw','Madrid','Rome','Athens'];

const COMPANY_PREFIXES=['Global','Trans','Apex','Nova','Prime','Stellar','Vertex','Omni','Crest','Meridian','Pacific','Nordic','Alpine','Quantum','Nexus','Pinnacle','Summit','Horizon','Zenith','Atlas'];
const COMPANY_SUFFIXES=['Energy','Steel','Materials','Petroleum','Power','Manufacturing','Industries','Resources','Mining','Chemicals','Transport','Corp','Solutions','Group','Metals','Dynamics','Systems','Holdings','Technologies','Operations'];

const genCities=(count)=>{
  const cities=[];
  for(let i=0;i<count;i++){
    const s1=sr(i*7+3);const s2=sr(i*13+7);const s3=sr(i*19+11);const s4=sr(i*23+17);const s5=sr(i*29+19);
    const pm25=Math.floor(5+s1*150);
    const pm10=Math.floor(pm25*1.3+s2*40);
    const no2=Math.floor(10+s3*80);
    const o3=Math.floor(20+s4*100);
    const so2=Math.floor(3+sr(i*31+5)*60);
    const co=Math.floor(200+sr(i*37+9)*2000);
    const whoCompliance=pm25<=15&&no2<=25&&o3<=60?100:pm25<=25?75:pm25<=50?50:pm25<=100?25:0;
    const popM=+(0.5+s5*25).toFixed(1);
    const mortalityCostM=Math.floor(pm25*popM*0.8+s1*200);
    const morbidityCostM=Math.floor(mortalityCostM*0.6+s2*100);
    const dalys=Math.floor(pm25*popM*15+s3*5000);
    const prodLossPct=+(pm25*0.03+s4*1).toFixed(1);
    const qTrend=QUARTERS.map((_,qi)=>({q:QUARTERS[qi],pm25:Math.floor(pm25*(0.85+qi*0.02+sr(i*41+qi*11)*0.15)),no2:Math.floor(no2*(0.9+qi*0.01+sr(i*43+qi*13)*0.1))}));
    cities.push({id:i,name:CITY_NAMES[i]||`City_${i}`,pm25,pm10,no2,o3,so2,co,whoCompliance,popM,mortalityCostM,morbidityCostM,dalys,prodLossPct,qTrend,
      region:i<20?'Asia':i<30?'Africa':i<40?'Americas/Europe':i<45?'Middle East':'Other',
      tier:pm25>100?'Severe':pm25>50?'Very Unhealthy':pm25>25?'Unhealthy':pm25>15?'Moderate':'Good'});
  }
  return cities;
};

const genCompanies=(count)=>{
  const companies=[];
  for(let i=0;i<count;i++){
    const s1=sr(i*7+101);const s2=sr(i*13+103);const s3=sr(i*19+107);const s4=sr(i*23+109);
    const sector=SECTORS[Math.floor(s1*SECTORS.length)];
    const name=COMPANY_PREFIXES[Math.floor(s2*COMPANY_PREFIXES.length)]+' '+COMPANY_SUFFIXES[Math.floor(s3*COMPANY_SUFFIXES.length)];
    const scope1AirPollutants=Math.floor(s4*50000+500);
    const regRisk=+(sr(i*29+111)*100).toFixed(0);
    const abatementCostM=Math.floor(sr(i*31+113)*200+5);
    const airQualityScore=Math.floor(sr(i*37+117)*100);
    const pollutantBreakdown=POLLUTANTS.map((_,pi)=>Math.floor(sr(i*41+pi*7+119)*scope1AirPollutants/POLLUTANTS.length));
    const qEmissions=QUARTERS.map((_,qi)=>Math.floor(scope1AirPollutants*(0.9+qi*0.01+sr(i*43+qi*11)*0.08)));
    companies.push({id:i,name,sector,scope1AirPollutants,regRisk:+regRisk,abatementCostM,airQualityScore,pollutantBreakdown,qEmissions,
      revenue:`$${Math.floor(sr(i*47+121)*50+1)}B`,country:['US','CN','IN','DE','JP','KR','AU','BR','SA','UK'][Math.floor(sr(i*53+123)*10)],
      complianceStatus:regRisk>70?'Non-Compliant':regRisk>40?'At Risk':'Compliant'});
  }
  return companies;
};

const CITIES=genCities(50);
const COMPANIES=genCompanies(80);

const pill=(color,text)=>(<span style={{display:'inline-block',padding:'2px 10px',borderRadius:12,fontSize:11,fontWeight:600,background:color+'18',color,border:`1px solid ${color}30`}}>{text}</span>);
const tierColor=(t)=>t==='Severe'||t==='Non-Compliant'?T.red:t==='Very Unhealthy'||t==='At Risk'?T.amber:t==='Unhealthy'||t==='Moderate'?T.gold:T.green;
const fmt=(n)=>n>=1e9?(n/1e9).toFixed(1)+'B':n>=1e6?(n/1e6).toFixed(1)+'M':n>=1e3?(n/1e3).toFixed(1)+'K':String(n);
const card=(s)=>({background:T.surface,borderRadius:10,border:`1px solid ${T.border}`,padding:18,...s});
const kpiBox=(label,value,sub,color)=>(<div style={card({flex:'1',minWidth:180,textAlign:'center'})}><div style={{fontSize:11,color:T.textMut,fontFamily:T.mono,textTransform:'uppercase',letterSpacing:1}}>{label}</div><div style={{fontSize:28,fontWeight:700,color:color||T.navy,margin:'4px 0'}}>{value}</div>{sub&&<div style={{fontSize:12,color:T.textSec}}>{sub}</div>}</div>);

const ABATEMENTS=ABATEMENT_TECHS.map((tech,i)=>({
  tech,costM:Math.floor(sr(i*7+200)*100+5),
  effectivenessPct:Math.floor(sr(i*13+201)*40+50),
  paybackYrs:+(sr(i*19+202)*8+1).toFixed(1),
  applicableSectors:SECTORS.filter((_,si)=>sr(i*23+si*7+203)>0.4).slice(0,4),
  greenBondEligible:sr(i*29+204)>0.5,
  cobenefitScore:Math.floor(sr(i*31+205)*100)
}));

export default function AirQualityFinancePage(){
  const [tab,setTab]=useState(0);
  const [searchTerm,setSearchTerm]=useState('');
  const [regionFilter,setRegionFilter]=useState('All');
  const [sectorFilter,setSectorFilter]=useState('All');
  const [sortKey,setSortKey]=useState('pm25');
  const [sortDir,setSortDir]=useState('desc');
  const [selectedCity,setSelectedCity]=useState(null);
  const [compSortKey,setCompSortKey]=useState('scope1AirPollutants');

  const TABS=['Air Quality Index Dashboard','Corporate Air Quality Exposure','Health Cost Externalities','Clean Air Investment'];

  const filteredCities=useMemo(()=>{
    let c=[...CITIES];
    if(searchTerm) c=c.filter(x=>x.name.toLowerCase().includes(searchTerm.toLowerCase()));
    if(regionFilter!=='All') c=c.filter(x=>x.region===regionFilter);
    c.sort((a,b)=>sortDir==='desc'?b[sortKey]-a[sortKey]:a[sortKey]-b[sortKey]);
    return c;
  },[searchTerm,regionFilter,sortKey,sortDir]);

  const filteredCompanies=useMemo(()=>{
    let c=[...COMPANIES];
    if(sectorFilter!=='All') c=c.filter(x=>x.sector===sectorFilter);
    c.sort((a,b)=>b[compSortKey]-a[compSortKey]);
    return c;
  },[sectorFilter,compSortKey]);

  const pollutantPie=useMemo(()=>POLLUTANTS.map((p,i)=>({name:p,value:CITIES.reduce((s,c)=>{const vals=[c.pm25,c.pm10,c.no2,c.o3,c.so2,c.co];return s+vals[i];},0)})),[]);
  const whoCompliant=useMemo(()=>CITIES.filter(c=>c.whoCompliance===100).length,[]);
  const COLORS=[T.red,T.amber,T.gold,T.sage,T.navy,T.navyL];

  const regionAgg=useMemo(()=>{
    const regions=['Asia','Africa','Americas/Europe','Middle East','Other'];
    return regions.map(r=>{const rc=CITIES.filter(c=>c.region===r);return{region:r,avgPM25:rc.length?Math.floor(rc.reduce((s,c)=>s+c.pm25,0)/rc.length):0,cities:rc.length,whoCompliantPct:rc.length?Math.floor(rc.filter(c=>c.whoCompliance===100).length/rc.length*100):0};});
  },[]);

  const sectorAgg=useMemo(()=>SECTORS.map(sec=>{const sc=COMPANIES.filter(c=>c.sector===sec);return{sector:sec,count:sc.length,totalEmissions:sc.reduce((s,c)=>s+c.scope1AirPollutants,0),avgRegRisk:sc.length?Math.floor(sc.reduce((s,c)=>s+c.regRisk,0)/sc.length):0,totalAbatementM:sc.reduce((s,c)=>s+c.abatementCostM,0)};}),[]);

  const healthAgg=useMemo(()=>{
    const totalMort=CITIES.reduce((s,c)=>s+c.mortalityCostM,0);
    const totalMorb=CITIES.reduce((s,c)=>s+c.morbidityCostM,0);
    const totalDALYs=CITIES.reduce((s,c)=>s+c.dalys,0);
    const avgProdLoss=+(CITIES.length?CITIES.reduce((s,c)=>s+c.prodLossPct,0)/CITIES.length:0).toFixed(1);
    return{totalMort,totalMorb,totalDALYs,avgProdLoss};
  },[]);

  const sortToggle=(key)=>{if(sortKey===key)setSortDir(d=>d==='desc'?'asc':'desc');else{setSortKey(key);setSortDir('desc');}};
  const thStyle={padding:'8px 10px',textAlign:'left',fontSize:11,fontFamily:T.mono,color:T.textMut,textTransform:'uppercase',letterSpacing:0.5,borderBottom:`2px solid ${T.border}`,cursor:'pointer',userSelect:'none',whiteSpace:'nowrap'};
  const tdStyle={padding:'8px 10px',fontSize:13,borderBottom:`1px solid ${T.border}`};

  const cityDetail=selectedCity!==null?CITIES.find(c=>c.id===selectedCity):null;

  const renderTab0=()=>(
    <div>
      <div style={{display:'flex',gap:12,marginBottom:20,flexWrap:'wrap'}}>
        {kpiBox('WHO Compliant',`${whoCompliant}/${CITIES.length}`,`${CITIES.length?Math.floor(whoCompliant/CITIES.length*100):0}% of cities`,T.green)}
        {kpiBox('Avg PM2.5',(CITIES.length?Math.floor(CITIES.reduce((s,c)=>s+c.pm25,0)/CITIES.length):0)+'ug/m3','Global mean (WHO limit: 15)',T.red)}
        {kpiBox('Avg NO2',(CITIES.length?Math.floor(CITIES.reduce((s,c)=>s+c.no2,0)/CITIES.length):0)+'ug/m3','WHO limit: 25',T.amber)}
        {kpiBox('Severe Cities',CITIES.filter(c=>c.tier==='Severe').length,'>100 ug/m3 PM2.5',T.red)}
      </div>
      <div style={{display:'flex',gap:12,marginBottom:16,alignItems:'center',flexWrap:'wrap'}}>
        <input placeholder="Search city..." value={searchTerm} onChange={e=>setSearchTerm(e.target.value)} style={{padding:'6px 12px',borderRadius:6,border:`1px solid ${T.border}`,fontSize:13,fontFamily:T.font,minWidth:160}}/>
        <select value={regionFilter} onChange={e=>setRegionFilter(e.target.value)} style={{padding:'6px 12px',borderRadius:6,border:`1px solid ${T.border}`,fontSize:13}}>
          <option value="All">All Regions</option>
          {['Asia','Africa','Americas/Europe','Middle East','Other'].map(r=>(<option key={r} value={r}>{r}</option>))}
        </select>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'2fr 1fr',gap:16,marginBottom:20}}>
        <div style={card()}>
          <div style={{fontSize:13,fontWeight:600,color:T.navy,marginBottom:8}}>PM2.5 Levels by City (ug/m3)</div>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={filteredCities.slice(0,25).map(c=>({name:c.name,pm25:c.pm25,whoLimit:15}))} layout="vertical" margin={{left:80,right:20,top:5,bottom:5}}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/>
              <XAxis type="number" tick={{fontSize:10,fill:T.textSec}}/>
              <YAxis dataKey="name" type="category" tick={{fontSize:10,fill:T.textSec}} width={75}/>
              <Tooltip contentStyle={{fontSize:12,borderRadius:8}}/>
              <Bar dataKey="pm25" radius={[0,4,4,0]} name="PM2.5">
                {filteredCities.slice(0,25).map((c,i)=>(<Cell key={i} fill={tierColor(c.tier)}/>))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={card()}>
          <div style={{fontSize:13,fontWeight:600,color:T.navy,marginBottom:8}}>Pollutant Breakdown (Global Sum)</div>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={pollutantPie} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={({name,percent})=>`${name} ${(percent*100).toFixed(0)}%`} labelLine={{stroke:T.textMut}} fontSize={11}>
                {pollutantPie.map((_,i)=>(<Cell key={i} fill={COLORS[i%COLORS.length]}/>))}
              </Pie>
              <Tooltip contentStyle={{fontSize:12,borderRadius:8}}/>
            </PieChart>
          </ResponsiveContainer>
          <div style={{fontSize:13,fontWeight:600,color:T.navy,marginBottom:8,marginTop:16}}>Regional Avg PM2.5</div>
          <ResponsiveContainer width="100%" height={150}>
            <BarChart data={regionAgg} margin={{top:5,right:10,bottom:5,left:10}}>
              <XAxis dataKey="region" tick={{fontSize:9,fill:T.textSec}}/>
              <YAxis tick={{fontSize:10,fill:T.textSec}}/>
              <Tooltip contentStyle={{fontSize:12,borderRadius:8}}/>
              <Bar dataKey="avgPM25" fill={T.amber} radius={[4,4,0,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div style={card({marginBottom:20})}>
        <div style={{fontSize:13,fontWeight:600,color:T.navy,marginBottom:8}}>Air Quality Trend (12 Quarters)</div>
        <ResponsiveContainer width="100%" height={250}>
          <AreaChart data={QUARTERS.map((q,qi)=>({q,avgPM25:CITIES.length?Math.floor(CITIES.reduce((s,c)=>s+c.qTrend[qi].pm25,0)/CITIES.length):0,avgNO2:CITIES.length?Math.floor(CITIES.reduce((s,c)=>s+c.qTrend[qi].no2,0)/CITIES.length):0}))} margin={{top:5,right:20,bottom:5,left:10}}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/>
            <XAxis dataKey="q" tick={{fontSize:10,fill:T.textSec}}/>
            <YAxis tick={{fontSize:10,fill:T.textSec}}/>
            <Tooltip contentStyle={{fontSize:12,borderRadius:8}}/>
            <Legend wrapperStyle={{fontSize:11}}/>
            <Area type="monotone" dataKey="avgPM25" stroke={T.red} fill={T.red+'20'} strokeWidth={2} name="Avg PM2.5"/>
            <Area type="monotone" dataKey="avgNO2" stroke={T.amber} fill={T.amber+'20'} strokeWidth={2} name="Avg NO2"/>
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div style={card()}>
        <div style={{fontSize:13,fontWeight:600,color:T.navy,marginBottom:8}}>City Air Quality Table</div>
        <div style={{overflowX:'auto',maxHeight:400,overflowY:'auto'}}>
          <table style={{width:'100%',borderCollapse:'collapse'}}>
            <thead style={{position:'sticky',top:0,background:T.surface}}><tr>
              <th style={thStyle}>#</th><th style={thStyle} onClick={()=>sortToggle('name')}>City</th><th style={thStyle}>Region</th>
              <th style={thStyle} onClick={()=>sortToggle('pm25')}>PM2.5</th><th style={thStyle} onClick={()=>sortToggle('pm10')}>PM10</th>
              <th style={thStyle} onClick={()=>sortToggle('no2')}>NO2</th><th style={thStyle} onClick={()=>sortToggle('o3')}>O3</th>
              <th style={thStyle}>WHO %</th><th style={thStyle}>Tier</th><th style={thStyle}>Pop (M)</th>
            </tr></thead>
            <tbody>{filteredCities.slice(0,40).map((c,i)=>(<tr key={c.id} onClick={()=>setSelectedCity(c.id)} style={{cursor:'pointer',background:selectedCity===c.id?T.surfaceH:'transparent'}}>
              <td style={tdStyle}>{i+1}</td><td style={{...tdStyle,fontWeight:600}}>{c.name}</td><td style={tdStyle}>{c.region}</td>
              <td style={{...tdStyle,color:c.pm25>50?T.red:c.pm25>25?T.amber:T.text}}>{c.pm25}</td>
              <td style={tdStyle}>{c.pm10}</td><td style={tdStyle}>{c.no2}</td><td style={tdStyle}>{c.o3}</td>
              <td style={tdStyle}>{c.whoCompliance}%</td><td style={tdStyle}>{pill(tierColor(c.tier),c.tier)}</td>
              <td style={tdStyle}>{c.popM}</td>
            </tr>))}</tbody>
          </table>
        </div>
      </div>
      {cityDetail&&(<div style={card({marginTop:16})}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
          <div><span style={{fontSize:16,fontWeight:700,color:T.navy}}>{cityDetail.name}</span> <span style={{fontSize:12,color:T.textMut,fontFamily:T.mono}}>{cityDetail.region} | Pop {cityDetail.popM}M</span></div>
          <button onClick={()=>setSelectedCity(null)} style={{padding:'4px 12px',borderRadius:6,border:`1px solid ${T.border}`,background:'transparent',cursor:'pointer',fontSize:12}}>Close</button>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
          <ResponsiveContainer width="100%" height={200}>
            <RadarChart data={POLLUTANTS.map((p,pi)=>({pollutant:p,value:[cityDetail.pm25,cityDetail.pm10,cityDetail.no2,cityDetail.o3,cityDetail.so2,cityDetail.co][pi],whoLimit:[15,45,25,60,20,1000][pi]}))}>
              <PolarGrid stroke={T.borderL}/><PolarAngleAxis dataKey="pollutant" tick={{fontSize:10,fill:T.textSec}}/>
              <PolarRadiusAxis tick={{fontSize:9,fill:T.textMut}}/>
              <Radar name="Actual" dataKey="value" stroke={T.red} fill={T.red+'30'} strokeWidth={2}/>
              <Radar name="WHO Limit" dataKey="whoLimit" stroke={T.green} fill={T.green+'15'} strokeWidth={1.5} strokeDasharray="4 4"/>
              <Legend wrapperStyle={{fontSize:10}}/><Tooltip contentStyle={{fontSize:12,borderRadius:8}}/>
            </RadarChart>
          </ResponsiveContainer>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={cityDetail.qTrend} margin={{top:5,right:10,bottom:5,left:5}}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/><XAxis dataKey="q" tick={{fontSize:9,fill:T.textSec}}/>
              <YAxis tick={{fontSize:10,fill:T.textSec}}/><Tooltip contentStyle={{fontSize:12,borderRadius:8}}/>
              <Area type="monotone" dataKey="pm25" stroke={T.red} fill={T.red+'20'} name="PM2.5"/><Area type="monotone" dataKey="no2" stroke={T.amber} fill={T.amber+'20'} name="NO2"/>
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>)}
    </div>
  );

  const renderTab1=()=>(
    <div>
      <div style={{display:'flex',gap:12,marginBottom:20,flexWrap:'wrap'}}>
        {kpiBox('Companies Tracked',COMPANIES.length,'Air quality exposure',T.navy)}
        {kpiBox('Non-Compliant',COMPANIES.filter(c=>c.complianceStatus==='Non-Compliant').length,`${COMPANIES.length?Math.floor(COMPANIES.filter(c=>c.complianceStatus==='Non-Compliant').length/COMPANIES.length*100):0}%`,T.red)}
        {kpiBox('Total Abatement',`$${fmt(COMPANIES.reduce((s,c)=>s+c.abatementCostM,0)*1e6)}`,'Estimated cost',T.amber)}
        {kpiBox('Avg Reg Risk',(COMPANIES.length?Math.floor(COMPANIES.reduce((s,c)=>s+c.regRisk,0)/COMPANIES.length):0)+'/100','Regulatory risk score',T.gold)}
      </div>
      <div style={{display:'flex',gap:8,marginBottom:16,flexWrap:'wrap'}}>
        <button onClick={()=>setSectorFilter('All')} style={{padding:'5px 14px',borderRadius:6,border:`1px solid ${sectorFilter==='All'?T.navy:T.border}`,background:sectorFilter==='All'?T.navy:'transparent',color:sectorFilter==='All'?'#fff':T.text,fontSize:12,fontWeight:600,cursor:'pointer'}}>All</button>
        {SECTORS.map(s=>(<button key={s} onClick={()=>setSectorFilter(s)} style={{padding:'5px 14px',borderRadius:6,border:`1px solid ${sectorFilter===s?T.navy:T.border}`,background:sectorFilter===s?T.navy:'transparent',color:sectorFilter===s?'#fff':T.text,fontSize:12,fontWeight:600,cursor:'pointer'}}>{s}</button>))}
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:20}}>
        <div style={card()}>
          <div style={{fontSize:13,fontWeight:600,color:T.navy,marginBottom:8}}>Sector Air Pollutant Emissions</div>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={sectorAgg} layout="vertical" margin={{left:110,right:20,top:5,bottom:5}}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/>
              <XAxis type="number" tick={{fontSize:10,fill:T.textSec}}/>
              <YAxis dataKey="sector" type="category" tick={{fontSize:10,fill:T.textSec}} width={105}/>
              <Tooltip contentStyle={{fontSize:12,borderRadius:8}}/>
              <Bar dataKey="totalEmissions" fill={T.red} radius={[0,4,4,0]} name="Total Emissions (tonnes)"/>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={card()}>
          <div style={{fontSize:13,fontWeight:600,color:T.navy,marginBottom:8}}>Sector Regulatory Risk & Abatement Cost</div>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={sectorAgg} margin={{top:5,right:20,bottom:30,left:10}}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/>
              <XAxis dataKey="sector" tick={{fontSize:9,fill:T.textSec,angle:-30,textAnchor:'end'}} height={60}/>
              <YAxis tick={{fontSize:10,fill:T.textSec}}/>
              <Tooltip contentStyle={{fontSize:12,borderRadius:8}}/>
              <Legend wrapperStyle={{fontSize:11}}/>
              <Bar dataKey="avgRegRisk" fill={T.amber} radius={[4,4,0,0]} name="Avg Reg Risk"/>
              <Bar dataKey="totalAbatementM" fill={T.sage} radius={[4,4,0,0]} name="Abatement ($M)"/>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div style={card()}>
        <div style={{fontSize:13,fontWeight:600,color:T.navy,marginBottom:8}}>Corporate Air Quality Exposure ({filteredCompanies.length} companies)</div>
        <div style={{display:'flex',gap:8,marginBottom:12}}>
          {['scope1AirPollutants','regRisk','abatementCostM','airQualityScore'].map(k=>(<button key={k} onClick={()=>setCompSortKey(k)} style={{padding:'4px 12px',borderRadius:6,border:`1px solid ${compSortKey===k?T.gold:T.border}`,background:compSortKey===k?T.gold+'20':'transparent',fontSize:11,cursor:'pointer',fontFamily:T.mono}}>{k.replace(/([A-Z])/g,' $1').trim()}</button>))}
        </div>
        <div style={{overflowX:'auto',maxHeight:400,overflowY:'auto'}}>
          <table style={{width:'100%',borderCollapse:'collapse'}}>
            <thead style={{position:'sticky',top:0,background:T.surface}}><tr>
              <th style={thStyle}>#</th><th style={thStyle}>Company</th><th style={thStyle}>Sector</th><th style={thStyle}>Country</th>
              <th style={thStyle}>Scope 1 (t)</th><th style={thStyle}>Reg Risk</th><th style={thStyle}>Abatement ($M)</th><th style={thStyle}>AQ Score</th><th style={thStyle}>Status</th>
            </tr></thead>
            <tbody>{filteredCompanies.slice(0,40).map((c,i)=>(<tr key={c.id}>
              <td style={tdStyle}>{i+1}</td><td style={{...tdStyle,fontWeight:600}}>{c.name}</td><td style={tdStyle}>{c.sector}</td>
              <td style={{...tdStyle,fontFamily:T.mono,fontSize:11}}>{c.country}</td>
              <td style={tdStyle}>{fmt(c.scope1AirPollutants)}</td>
              <td style={{...tdStyle,color:c.regRisk>70?T.red:c.regRisk>40?T.amber:T.text}}>{c.regRisk}</td>
              <td style={tdStyle}>${c.abatementCostM}M</td>
              <td style={tdStyle}>{c.airQualityScore}/100</td>
              <td style={tdStyle}>{pill(tierColor(c.complianceStatus),c.complianceStatus)}</td>
            </tr>))}</tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderTab2=()=>(
    <div>
      <div style={{display:'flex',gap:12,marginBottom:20,flexWrap:'wrap'}}>
        {kpiBox('Mortality Cost',`$${fmt(healthAgg.totalMort*1e6)}`,'Annual premature deaths',T.red)}
        {kpiBox('Morbidity Cost',`$${fmt(healthAgg.totalMorb*1e6)}`,'Chronic illness burden',T.amber)}
        {kpiBox('Total DALYs',fmt(healthAgg.totalDALYs),'Disability-adjusted life years',T.gold)}
        {kpiBox('Avg Prod. Loss',`${healthAgg.avgProdLoss}%`,'GDP productivity impact',T.red)}
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:20}}>
        <div style={card()}>
          <div style={{fontSize:13,fontWeight:600,color:T.navy,marginBottom:8}}>Health Cost by City ($M) &mdash; Mortality vs Morbidity</div>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={CITIES.sort((a,b)=>b.mortalityCostM-a.mortalityCostM).slice(0,20).map(c=>({name:c.name,mortality:c.mortalityCostM,morbidity:c.morbidityCostM}))} layout="vertical" margin={{left:80,right:20,top:5,bottom:5}}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/>
              <XAxis type="number" tick={{fontSize:10,fill:T.textSec}}/>
              <YAxis dataKey="name" type="category" tick={{fontSize:10,fill:T.textSec}} width={75}/>
              <Tooltip contentStyle={{fontSize:12,borderRadius:8}}/>
              <Legend wrapperStyle={{fontSize:11}}/>
              <Bar dataKey="mortality" fill={T.red} radius={[0,4,4,0]} name="Mortality ($M)" stackId="a"/>
              <Bar dataKey="morbidity" fill={T.amber} radius={[0,4,4,0]} name="Morbidity ($M)" stackId="a"/>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={card()}>
          <div style={{fontSize:13,fontWeight:600,color:T.navy,marginBottom:8}}>DALYs by City (top 20)</div>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={CITIES.sort((a,b)=>b.dalys-a.dalys).slice(0,20).map(c=>({name:c.name,dalys:c.dalys}))} layout="vertical" margin={{left:80,right:20,top:5,bottom:5}}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/>
              <XAxis type="number" tick={{fontSize:10,fill:T.textSec}}/>
              <YAxis dataKey="name" type="category" tick={{fontSize:10,fill:T.textSec}} width={75}/>
              <Tooltip contentStyle={{fontSize:12,borderRadius:8}}/>
              <Bar dataKey="dalys" fill={T.navy} radius={[0,4,4,0]} name="DALYs"/>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div style={card({marginBottom:20})}>
        <div style={{fontSize:13,fontWeight:600,color:T.navy,marginBottom:8}}>Economic Productivity Loss by City</div>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={CITIES.sort((a,b)=>b.prodLossPct-a.prodLossPct).slice(0,25).map(c=>({name:c.name,loss:c.prodLossPct}))} margin={{top:5,right:20,bottom:30,left:10}}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/>
            <XAxis dataKey="name" tick={{fontSize:8,fill:T.textSec,angle:-40,textAnchor:'end'}} height={60}/>
            <YAxis tick={{fontSize:10,fill:T.textSec}} label={{value:'GDP Loss %',angle:-90,position:'insideLeft',fontSize:10,fill:T.textMut}}/>
            <Tooltip contentStyle={{fontSize:12,borderRadius:8}}/>
            <Bar dataKey="loss" fill={T.gold} radius={[4,4,0,0]} name="Productivity Loss %"/>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div style={card()}>
        <div style={{fontSize:13,fontWeight:600,color:T.navy,marginBottom:8}}>Social Cost of Air Pollution Analogy</div>
        <div style={{overflowX:'auto'}}>
          <table style={{width:'100%',borderCollapse:'collapse'}}>
            <thead><tr><th style={thStyle}>City</th><th style={thStyle}>PM2.5</th><th style={thStyle}>Mortality ($M)</th><th style={thStyle}>Morbidity ($M)</th><th style={thStyle}>DALYs</th><th style={thStyle}>Prod Loss %</th><th style={thStyle}>Social Cost/Capita ($)</th></tr></thead>
            <tbody>{CITIES.sort((a,b)=>b.mortalityCostM-a.mortalityCostM).slice(0,25).map(c=>(<tr key={c.id}>
              <td style={{...tdStyle,fontWeight:600}}>{c.name}</td>
              <td style={{...tdStyle,color:c.pm25>50?T.red:T.text}}>{c.pm25}</td>
              <td style={tdStyle}>${fmt(c.mortalityCostM*1e6)}</td><td style={tdStyle}>${fmt(c.morbidityCostM*1e6)}</td>
              <td style={tdStyle}>{fmt(c.dalys)}</td><td style={{...tdStyle,color:c.prodLossPct>3?T.red:T.text}}>{c.prodLossPct}%</td>
              <td style={tdStyle}>${Math.floor((c.mortalityCostM+c.morbidityCostM)/c.popM)}</td>
            </tr>))}</tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderTab3=()=>(
    <div>
      <div style={{display:'flex',gap:12,marginBottom:20,flexWrap:'wrap'}}>
        {kpiBox('Abatement Options',ABATEMENTS.length,'Technologies assessed',T.navy)}
        {kpiBox('Green Bond Eligible',ABATEMENTS.filter(a=>a.greenBondEligible).length,'Of total technologies',T.green)}
        {kpiBox('Avg Effectiveness',(ABATEMENTS.length?Math.floor(ABATEMENTS.reduce((s,a)=>s+a.effectivenessPct,0)/ABATEMENTS.length):0)+'%','Mean pollution reduction',T.sage)}
        {kpiBox('Avg Payback',+(ABATEMENTS.length?ABATEMENTS.reduce((s,a)=>s+a.paybackYrs,0)/ABATEMENTS.length:0).toFixed(1)+' yrs','Investment return period',T.gold)}
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:20}}>
        <div style={card()}>
          <div style={{fontSize:13,fontWeight:600,color:T.navy,marginBottom:8}}>Cost vs Effectiveness by Technology</div>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={ABATEMENTS.sort((a,b)=>b.effectivenessPct-a.effectivenessPct)} margin={{top:5,right:20,bottom:30,left:10}}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/>
              <XAxis dataKey="tech" tick={{fontSize:8,fill:T.textSec,angle:-30,textAnchor:'end'}} height={80}/>
              <YAxis tick={{fontSize:10,fill:T.textSec}}/>
              <Tooltip contentStyle={{fontSize:12,borderRadius:8}}/>
              <Legend wrapperStyle={{fontSize:11}}/>
              <Bar dataKey="effectivenessPct" fill={T.sage} radius={[4,4,0,0]} name="Effectiveness %"/>
              <Bar dataKey="costM" fill={T.amber} radius={[4,4,0,0]} name="Cost ($M)"/>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={card()}>
          <div style={{fontSize:13,fontWeight:600,color:T.navy,marginBottom:8}}>Payback Period & Co-Benefit Score</div>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={ABATEMENTS} margin={{top:5,right:20,bottom:30,left:10}}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/>
              <XAxis dataKey="tech" tick={{fontSize:8,fill:T.textSec,angle:-30,textAnchor:'end'}} height={80}/>
              <YAxis tick={{fontSize:10,fill:T.textSec}}/>
              <Tooltip contentStyle={{fontSize:12,borderRadius:8}}/>
              <Legend wrapperStyle={{fontSize:11}}/>
              <Bar dataKey="paybackYrs" fill={T.navy} radius={[4,4,0,0]} name="Payback (yrs)"/>
              <Bar dataKey="cobenefitScore" fill={T.gold} radius={[4,4,0,0]} name="Co-Benefit Score"/>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div style={card()}>
        <div style={{fontSize:13,fontWeight:600,color:T.navy,marginBottom:8}}>Abatement Technology Assessment</div>
        <div style={{overflowX:'auto'}}>
          <table style={{width:'100%',borderCollapse:'collapse'}}>
            <thead><tr>
              <th style={thStyle}>Technology</th><th style={thStyle}>Cost ($M)</th><th style={thStyle}>Effectiveness</th><th style={thStyle}>Payback</th>
              <th style={thStyle}>Green Bond</th><th style={thStyle}>Co-Benefit</th><th style={thStyle}>Applicable Sectors</th>
            </tr></thead>
            <tbody>{ABATEMENTS.map(a=>(<tr key={a.tech}>
              <td style={{...tdStyle,fontWeight:600}}>{a.tech}</td>
              <td style={tdStyle}>${a.costM}M</td>
              <td style={{...tdStyle,color:a.effectivenessPct>75?T.green:T.text}}>{a.effectivenessPct}%</td>
              <td style={tdStyle}>{a.paybackYrs} yrs</td>
              <td style={tdStyle}>{a.greenBondEligible?pill(T.green,'Eligible'):pill(T.textMut,'No')}</td>
              <td style={tdStyle}>{a.cobenefitScore}/100</td>
              <td style={{...tdStyle,fontSize:11}}>{a.applicableSectors.join(', ')}</td>
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
          <h1 style={{fontSize:26,fontWeight:700,color:T.navy,margin:0}}>Air Quality Finance</h1>
          <p style={{color:T.textSec,fontSize:14,margin:'4px 0 0'}}>PM2.5/NO2/O3 analytics, corporate air quality exposure, health cost externalities & clean air investment across 50 cities and 80 companies</p>
        </div>
        <div style={{display:'flex',gap:4,marginBottom:20,borderBottom:`2px solid ${T.border}`,paddingBottom:0}}>
          {TABS.map((t,i)=>(<button key={i} onClick={()=>setTab(i)} style={{padding:'10px 20px',border:'none',borderBottom:tab===i?`3px solid ${T.gold}`:'3px solid transparent',background:'transparent',color:tab===i?T.navy:T.textMut,fontWeight:tab===i?700:500,fontSize:13,cursor:'pointer',fontFamily:T.font,transition:'all 0.2s'}}>{t}</button>))}
        </div>
        {tab===0&&renderTab0()}
        {tab===1&&renderTab1()}
        {tab===2&&renderTab2()}
        {tab===3&&renderTab3()}
        <div style={{marginTop:32,padding:'12px 16px',background:T.surfaceH,borderRadius:8,border:`1px solid ${T.border}`,fontSize:11,color:T.textMut,fontFamily:T.mono}}>
          EP-AU2 Air Quality Finance | Sprint AU: Climate & Health Nexus Finance | 50 cities, 80 companies, {POLLUTANTS.length} pollutants, {ABATEMENTS.length} technologies, {QUARTERS.length}Q trend
        </div>
      </div>
    </div>
  );
}