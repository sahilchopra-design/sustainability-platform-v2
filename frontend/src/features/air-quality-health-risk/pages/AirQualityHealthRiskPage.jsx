import React,{useState,useMemo} from 'react';
import {BarChart,Bar,LineChart,Line,AreaChart,Area,ScatterChart,Scatter,RadarChart,Radar,PolarGrid,PolarAngleAxis,PolarRadiusAxis,PieChart,Pie,Cell,XAxis,YAxis,CartesianGrid,Tooltip,ResponsiveContainer,Legend} from 'recharts';

const T={bg:'#f6f4f0',surface:'#ffffff',surfaceH:'#f0ede7',border:'#e5e0d8',borderL:'#d5cfc5',navy:'#1b3a5c',navyL:'#2c5a8c',gold:'#c5a96a',goldL:'#d4be8a',sage:'#5a8a6a',sageL:'#7ba67d',teal:'#5a8a6a',text:'#1b3a5c',textSec:'#5c6b7e',textMut:'#9aa3ae',red:'#dc2626',green:'#16a34a',amber:'#d97706',font:"'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"};
const sr=(s)=>{let x=Math.sin(s+1)*10000;return x-Math.floor(x);};
const tip={contentStyle:{background:T.surface,border:`1px solid ${T.border}`,borderRadius:8,color:T.text,fontFamily:T.font},labelStyle:{color:T.textSec}};
const COLORS=[T.navy,T.gold,T.sage,T.red,T.amber,T.green,T.navyL,T.goldL,T.sageL,'#8b5cf6','#ec4899','#06b6d4'];
const fmt=v=>typeof v==='number'?v>=1e9?(v/1e9).toFixed(1)+'B':v>=1e6?(v/1e6).toFixed(1)+'M':v>=1e3?(v/1e3).toFixed(1)+'K':v.toFixed(1):v;
const TABS=['City Dashboard','Pollutant Analysis','Health Economics','Regulatory Tracker'];
const REGIONS=['All','South Asia','East Asia','Southeast Asia','Middle East','Africa','Europe','Americas'];

const CITIES=Array.from({length:50},(_,i)=>{
  const names=['Delhi','Lahore','Dhaka','Kolkata','Chengdu','Jakarta','Karachi','Mumbai','Beijing','Cairo','Lagos','Hanoi','Bangkok','Lima','Santiago','Bogota','Manila','Riyadh','Tehran','Kabul','Accra','Nairobi','Addis Ababa','Ulaanbaatar','Almaty','Tashkent','Kathmandu','Colombo','Yangon','Phnom Penh','Ho Chi Minh','Kuala Lumpur','Singapore','Tokyo','Seoul','Shanghai','Guangzhou','Shenzhen','Taipei','Hong Kong','London','Paris','Berlin','Madrid','Rome','Warsaw','Istanbul','Moscow','Mexico City','Sao Paulo'];
  const regions=['South Asia','South Asia','South Asia','South Asia','East Asia','Southeast Asia','South Asia','South Asia','East Asia','Middle East','Africa','Southeast Asia','Southeast Asia','Americas','Americas','Americas','Southeast Asia','Middle East','Middle East','South Asia','Africa','Africa','Africa','East Asia','East Asia','East Asia','South Asia','South Asia','Southeast Asia','Southeast Asia','Southeast Asia','Southeast Asia','Southeast Asia','East Asia','East Asia','East Asia','East Asia','East Asia','East Asia','East Asia','Europe','Europe','Europe','Europe','Europe','Europe','Middle East','Europe','Americas','Americas'];
  const basePM=95-i*1.4+sr(i*7)*12;
  const baseNO2=48-i*0.6+sr(i*11)*10;
  const baseSO2=35-i*0.5+sr(i*13)*8;
  const baseO3=80+sr(i*17)*40;
  return {
    id:i+1,city:names[i],region:regions[i],
    pm25:+basePM.toFixed(1),no2:+baseNO2.toFixed(1),so2:+baseSO2.toFixed(1),o3:+baseO3.toFixed(1),
    aqi:Math.round(basePM*3.5+sr(i*3)*40),
    whoCompliant:basePM<15?'Yes':'No',
    healthCostBn:+(sr(i*19)*25+2).toFixed(1),
    prematureDeaths:Math.round(sr(i*23)*15000+500),
    asthmaCases:Math.round(sr(i*29)*80000+5000),
    copd:Math.round(sr(i*31)*20000+1000),
    pop:+(sr(i*37)*25+1).toFixed(1),
    trend:sr(i*41)>0.6?'Improving':sr(i*41)<0.3?'Worsening':'Stable',
    yoy:+((sr(i*43)-0.5)*12).toFixed(1),
    regulatoryScore:+(sr(i*47)*40+50).toFixed(0),
    enforcementGrade:['A','A-','B+','B','B-','C+','C','D'][Math.floor(sr(i*53)*8)]
  };
});

const POLLUTANTS=['PM2.5','PM10','NO2','SO2','O3','CO','Lead','Benzene'];
const MONTHLY=Array.from({length:36},(_,i)=>({
  month:`${2023+Math.floor(i/12)}-${String(i%12+1).padStart(2,'0')}`,
  pm25:+(25+sr(i*3)*45).toFixed(1),no2:+(15+sr(i*7)*30).toFixed(1),
  so2:+(8+sr(i*11)*20).toFixed(1),o3:+(60+sr(i*13)*50).toFixed(1),
  aqi:Math.round(100+sr(i*17)*200),whoLimit:5
}));

const HEALTH_ECON=Array.from({length:50},(_,i)=>({
  city:CITIES[i].city,region:CITIES[i].region,
  dalys:Math.round(sr(i*61)*500+50),
  healthSpend:+(sr(i*67)*8+0.5).toFixed(1),
  prodLoss:+(sr(i*71)*12+1).toFixed(1),
  mortalityRate:+(sr(i*73)*15+2).toFixed(1),
  childAsthma:+(sr(i*79)*25+5).toFixed(1),
  elderlyImpact:+(sr(i*83)*30+10).toFixed(1),
  costPerCapita:Math.round(sr(i*89)*800+50),
  insurancePrem:+(sr(i*97)*35+5).toFixed(1)
}));

const REGULATIONS=Array.from({length:40},(_,i)=>{
  const countries=['India','Pakistan','Bangladesh','China','Indonesia','Egypt','Nigeria','Vietnam','Thailand','Peru','Chile','Colombia','Philippines','Saudi Arabia','Iran','Afghanistan','Ghana','Kenya','Ethiopia','Mongolia','Kazakhstan','Uzbekistan','Nepal','Sri Lanka','Myanmar','Cambodia','Malaysia','Singapore','Japan','South Korea','UK','France','Germany','Spain','Italy','Poland','Turkey','Brazil','Mexico','USA'];
  return {
    id:i+1,country:countries[i],
    pm25Standard:+(sr(i*101)*40+10).toFixed(0),
    no2Standard:+(sr(i*103)*30+20).toFixed(0),
    whoGap:+(sr(i*107)*35).toFixed(1),
    enforcementScore:+(sr(i*109)*60+30).toFixed(0),
    penalties:sr(i*113)>0.5?'Strong':'Weak',
    monitoring:Math.round(sr(i*117)*500+10),
    lastUpdated:2018+Math.floor(sr(i*119)*8),
    emissionTradingScheme:sr(i*121)>0.6?'Active':sr(i*121)>0.3?'Planned':'None',
    cleanAirZones:Math.round(sr(i*127)*20),
    vehicleStandard:['Euro 6','Euro 5','Euro 4','Euro 3','Euro 2'][Math.floor(sr(i*131)*5)]
  };
});

const PAGE_SIZE=12;

export default function AirQualityHealthRiskPage(){
  const [tab,setTab]=useState(0);
  const [search,setSearch]=useState('');
  const [sortCol,setSortCol]=useState('pm25');
  const [sortDir,setSortDir]=useState('desc');
  const [regionFilter,setRegionFilter]=useState('All');
  const [page,setPage]=useState(0);
  const [selected,setSelected]=useState(null);
  const [whoOnly,setWhoOnly]=useState(false);
  const [pollutant,setPollutant]=useState('pm25');
  const [pmThreshold,setPmThreshold]=useState(35);
  const [regSearch,setRegSearch]=useState('');
  const [regSort,setRegSort]=useState('whoGap');
  const [regDir,setRegDir]=useState('desc');
  const [regPage,setRegPage]=useState(0);
  const [healthSort,setHealthSort]=useState('dalys');
  const [healthDir,setHealthDir]=useState('desc');
  const [healthPage,setHealthPage]=useState(0);

  const doSort=(data,col,dir)=>[...data].sort((a,b)=>dir==='asc'?(a[col]>b[col]?1:-1):(a[col]<b[col]?1:-1));
  const toggleSort=(col,current,setC,dir,setD)=>{if(current===col)setD(dir==='asc'?'desc':'asc');else{setC(col);setD('desc');}};

  const filteredCities=useMemo(()=>{
    let d=CITIES.filter(c=>c.city.toLowerCase().includes(search.toLowerCase()));
    if(regionFilter!=='All')d=d.filter(c=>c.region===regionFilter);
    if(whoOnly)d=d.filter(c=>c.whoCompliant==='Yes');
    d=d.filter(c=>c.pm25>=pmThreshold-30);
    return doSort(d,sortCol,sortDir);
  },[search,regionFilter,whoOnly,pmThreshold,sortCol,sortDir]);

  const pagedCities=filteredCities.slice(page*PAGE_SIZE,(page+1)*PAGE_SIZE);
  const totalPages=Math.ceil(filteredCities.length/PAGE_SIZE);

  const filteredRegs=useMemo(()=>{
    let d=REGULATIONS.filter(r=>r.country.toLowerCase().includes(regSearch.toLowerCase()));
    return doSort(d,regSort,regDir);
  },[regSearch,regSort,regDir]);
  const pagedRegs=filteredRegs.slice(regPage*PAGE_SIZE,(regPage+1)*PAGE_SIZE);
  const totalRegPages=Math.ceil(filteredRegs.length/PAGE_SIZE);

  const filteredHealth=useMemo(()=>{
    let d=HEALTH_ECON.filter(h=>h.city.toLowerCase().includes(search.toLowerCase()));
    if(regionFilter!=='All')d=d.filter(h=>h.region===regionFilter);
    return doSort(d,healthSort,healthDir);
  },[search,regionFilter,healthSort,healthDir]);
  const pagedHealth=filteredHealth.slice(healthPage*PAGE_SIZE,(healthPage+1)*PAGE_SIZE);
  const totalHealthPages=Math.ceil(filteredHealth.length/PAGE_SIZE);

  const csvExport=(data,filename)=>{
    const headers=Object.keys(data[0]);
    const csv=[headers.join(','),...data.map(r=>headers.map(h=>JSON.stringify(r[h]??'')).join(','))].join('\n');
    const blob=new Blob([csv],{type:'text/csv'});
    const url=URL.createObjectURL(blob);
    const a=document.createElement('a');a.href=url;a.download=filename;a.click();URL.revokeObjectURL(url);
  };

  const kpi=(label,value,sub)=>(
    <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:'16px 20px',flex:1,minWidth:170}}>
      <div style={{fontSize:11,color:T.textMut,fontFamily:T.mono,textTransform:'uppercase',letterSpacing:1}}>{label}</div>
      <div style={{fontSize:26,fontWeight:700,color:T.navy,marginTop:4}}>{value}</div>
      {sub&&<div style={{fontSize:12,color:T.textSec,marginTop:2}}>{sub}</div>}
    </div>
  );

  const SortHeader=({label,col,currentCol,dir,onClick})=>(
    <th onClick={()=>onClick(col)} style={{padding:'10px 12px',textAlign:'left',cursor:'pointer',fontSize:11,fontFamily:T.mono,color:T.textSec,textTransform:'uppercase',letterSpacing:0.5,borderBottom:`2px solid ${T.border}`,whiteSpace:'nowrap',userSelect:'none',background:T.surfaceH}}>
      {label}{currentCol===col?(dir==='asc'?' \u25B2':' \u25BC'):''}
    </th>
  );

  const renderCityDashboard=()=>(
    <div>
      <div style={{display:'flex',gap:12,marginBottom:20,flexWrap:'wrap'}}>
        {kpi('Cities Monitored',filteredCities.length)}
        {kpi('Avg PM2.5',fmt(filteredCities.reduce((a,c)=>a+c.pm25,0)/filteredCities.length||0)+' ug/m3','WHO limit: 5 ug/m3')}
        {kpi('Total Health Cost','$'+fmt(filteredCities.reduce((a,c)=>a+c.healthCostBn,0))+'B')}
        {kpi('Premature Deaths',fmt(filteredCities.reduce((a,c)=>a+c.prematureDeaths,0)))}
        {kpi('WHO Compliant',filteredCities.filter(c=>c.whoCompliant==='Yes').length+'/'+filteredCities.length)}
      </div>

      <div style={{display:'flex',gap:12,marginBottom:16,flexWrap:'wrap',alignItems:'center'}}>
        <input value={search} onChange={e=>{setSearch(e.target.value);setPage(0);}} placeholder="Search cities..." style={{padding:'8px 14px',border:`1px solid ${T.border}`,borderRadius:8,fontFamily:T.font,fontSize:13,background:T.surface,color:T.text,width:220}}/>
        <select value={regionFilter} onChange={e=>{setRegionFilter(e.target.value);setPage(0);}} style={{padding:'8px 12px',border:`1px solid ${T.border}`,borderRadius:8,fontFamily:T.font,fontSize:13,background:T.surface,color:T.text}}>
          {REGIONS.map(r=><option key={r}>{r}</option>)}
        </select>
        <label style={{fontSize:13,color:T.textSec,display:'flex',alignItems:'center',gap:6}}>
          <input type="checkbox" checked={whoOnly} onChange={e=>setWhoOnly(e.target.checked)}/> WHO compliant only
        </label>
        <div style={{fontSize:12,color:T.textSec,display:'flex',alignItems:'center',gap:8}}>
          PM2.5 min: {pmThreshold} ug/m3
          <input type="range" min={0} max={80} value={pmThreshold} onChange={e=>setPmThreshold(+e.target.value)} style={{width:120}}/>
        </div>
        <button onClick={()=>csvExport(filteredCities,'air_quality_cities.csv')} style={{marginLeft:'auto',padding:'8px 16px',background:T.navy,color:'#fff',border:'none',borderRadius:8,fontFamily:T.mono,fontSize:12,cursor:'pointer'}}>Export CSV</button>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:20}}>
        <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:16}}>
          <div style={{fontSize:13,fontWeight:600,color:T.navy,marginBottom:12}}>PM2.5 by City (Top 20)</div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={filteredCities.slice(0,20)} margin={{left:10,right:10}}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/>
              <XAxis dataKey="city" tick={{fontSize:9,fill:T.textSec}} angle={-45} textAnchor="end" height={80}/>
              <YAxis tick={{fontSize:10,fill:T.textSec}}/>
              <Tooltip {...tip}/>
              <Bar dataKey="pm25" name="PM2.5">{filteredCities.slice(0,20).map((c,i)=><Cell key={i} fill={c.pm25>50?T.red:c.pm25>25?T.amber:T.green}/>)}</Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:16}}>
          <div style={{fontSize:13,fontWeight:600,color:T.navy,marginBottom:12}}>AQI vs Health Cost Scatter</div>
          <ResponsiveContainer width="100%" height={300}>
            <ScatterChart margin={{left:10,right:10}}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/>
              <XAxis dataKey="aqi" name="AQI" tick={{fontSize:10,fill:T.textSec}}/>
              <YAxis dataKey="healthCostBn" name="Health Cost ($B)" tick={{fontSize:10,fill:T.textSec}}/>
              <Tooltip {...tip} formatter={(v,n)=>[fmt(v),n]}/>
              <Scatter data={filteredCities} fill={T.navy} fillOpacity={0.7}/>
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={{overflowX:'auto',border:`1px solid ${T.border}`,borderRadius:10,background:T.surface}}>
        <table style={{width:'100%',borderCollapse:'collapse',fontFamily:T.font,fontSize:13}}>
          <thead>
            <tr>
              {[['City','city'],['Region','region'],['PM2.5','pm25'],['NO2','no2'],['AQI','aqi'],['WHO','whoCompliant'],['Health Cost $B','healthCostBn'],['Deaths','prematureDeaths'],['Trend','trend'],['YoY %','yoy']].map(([l,c])=>
                <SortHeader key={c} label={l} col={c} currentCol={sortCol} dir={sortDir} onClick={c2=>toggleSort(c2,sortCol,setSortCol,sortDir,setSortDir)}/>
              )}
            </tr>
          </thead>
          <tbody>
            {pagedCities.map((c,i)=>(
              <React.Fragment key={c.id}>
                <tr onClick={()=>setSelected(selected===c.id?null:c.id)} style={{cursor:'pointer',background:selected===c.id?T.surfaceH:i%2===0?T.surface:'#fafaf8',transition:'background 0.15s'}}>
                  <td style={{padding:'10px 12px',fontWeight:600,color:T.navy}}>{c.city}</td>
                  <td style={{padding:'10px 12px',color:T.textSec}}>{c.region}</td>
                  <td style={{padding:'10px 12px',color:c.pm25>50?T.red:c.pm25>25?T.amber:T.green,fontFamily:T.mono,fontWeight:600}}>{c.pm25}</td>
                  <td style={{padding:'10px 12px',fontFamily:T.mono}}>{c.no2}</td>
                  <td style={{padding:'10px 12px',fontFamily:T.mono,color:c.aqi>200?T.red:c.aqi>100?T.amber:T.green}}>{c.aqi}</td>
                  <td style={{padding:'10px 12px'}}><span style={{padding:'2px 8px',borderRadius:10,fontSize:11,fontWeight:600,background:c.whoCompliant==='Yes'?'#dcfce7':'#fef2f2',color:c.whoCompliant==='Yes'?T.green:T.red}}>{c.whoCompliant}</span></td>
                  <td style={{padding:'10px 12px',fontFamily:T.mono}}>${c.healthCostBn}B</td>
                  <td style={{padding:'10px 12px',fontFamily:T.mono}}>{fmt(c.prematureDeaths)}</td>
                  <td style={{padding:'10px 12px'}}><span style={{color:c.trend==='Improving'?T.green:c.trend==='Worsening'?T.red:T.amber}}>{c.trend}</span></td>
                  <td style={{padding:'10px 12px',fontFamily:T.mono,color:c.yoy<0?T.green:T.red}}>{c.yoy>0?'+':''}{c.yoy}%</td>
                </tr>
                {selected===c.id&&(
                  <tr><td colSpan={10} style={{padding:20,background:T.surfaceH,borderTop:`1px solid ${T.border}`}}>
                    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:16}}>
                      <div><span style={{fontSize:11,color:T.textMut,fontFamily:T.mono}}>SO2</span><div style={{fontSize:18,fontWeight:700,color:T.navy}}>{c.so2} ug/m3</div></div>
                      <div><span style={{fontSize:11,color:T.textMut,fontFamily:T.mono}}>O3</span><div style={{fontSize:18,fontWeight:700,color:T.navy}}>{c.o3} ug/m3</div></div>
                      <div><span style={{fontSize:11,color:T.textMut,fontFamily:T.mono}}>Population</span><div style={{fontSize:18,fontWeight:700,color:T.navy}}>{c.pop}M</div></div>
                      <div><span style={{fontSize:11,color:T.textMut,fontFamily:T.mono}}>Asthma Cases</span><div style={{fontSize:18,fontWeight:700,color:T.navy}}>{fmt(c.asthmaCases)}</div></div>
                      <div><span style={{fontSize:11,color:T.textMut,fontFamily:T.mono}}>COPD Cases</span><div style={{fontSize:18,fontWeight:700,color:T.navy}}>{fmt(c.copd)}</div></div>
                      <div><span style={{fontSize:11,color:T.textMut,fontFamily:T.mono}}>Regulatory Score</span><div style={{fontSize:18,fontWeight:700,color:T.navy}}>{c.regulatoryScore}/100</div></div>
                      <div><span style={{fontSize:11,color:T.textMut,fontFamily:T.mono}}>Enforcement</span><div style={{fontSize:18,fontWeight:700,color:T.navy}}>{c.enforcementGrade}</div></div>
                    </div>
                  </td></tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginTop:12}}>
        <span style={{fontSize:12,color:T.textMut}}>{filteredCities.length} cities</span>
        <div style={{display:'flex',gap:6}}>
          <button disabled={page===0} onClick={()=>setPage(page-1)} style={{padding:'6px 12px',border:`1px solid ${T.border}`,borderRadius:6,background:T.surface,cursor:page===0?'default':'pointer',opacity:page===0?0.4:1,fontFamily:T.mono,fontSize:12}}>Prev</button>
          <span style={{padding:'6px 12px',fontSize:12,color:T.textSec}}>{page+1}/{totalPages||1}</span>
          <button disabled={page>=totalPages-1} onClick={()=>setPage(page+1)} style={{padding:'6px 12px',border:`1px solid ${T.border}`,borderRadius:6,background:T.surface,cursor:page>=totalPages-1?'default':'pointer',opacity:page>=totalPages-1?0.4:1,fontFamily:T.mono,fontSize:12}}>Next</button>
        </div>
      </div>
    </div>
  );

  const renderPollutantAnalysis=()=>(
    <div>
      <div style={{display:'flex',gap:12,marginBottom:16,alignItems:'center'}}>
        <select value={pollutant} onChange={e=>setPollutant(e.target.value)} style={{padding:'8px 12px',border:`1px solid ${T.border}`,borderRadius:8,fontFamily:T.font,fontSize:13,background:T.surface,color:T.text}}>
          {[['pm25','PM2.5'],['no2','NO2'],['so2','SO2'],['o3','O3']].map(([v,l])=><option key={v} value={v}>{l}</option>)}
        </select>
        <button onClick={()=>csvExport(MONTHLY,'pollutant_trends.csv')} style={{marginLeft:'auto',padding:'8px 16px',background:T.navy,color:'#fff',border:'none',borderRadius:8,fontFamily:T.mono,fontSize:12,cursor:'pointer'}}>Export CSV</button>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:20}}>
        <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:16}}>
          <div style={{fontSize:13,fontWeight:600,color:T.navy,marginBottom:12}}>Monthly Trend: {pollutant.toUpperCase()}</div>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={MONTHLY}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/>
              <XAxis dataKey="month" tick={{fontSize:9,fill:T.textSec}} interval={5}/>
              <YAxis tick={{fontSize:10,fill:T.textSec}}/>
              <Tooltip {...tip}/>
              <Area type="monotone" dataKey={pollutant} stroke={T.navy} fill={T.navy} fillOpacity={0.15}/>
              {pollutant==='pm25'&&<Area type="monotone" dataKey="whoLimit" stroke={T.red} fill="none" strokeDasharray="5 5"/>}
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:16}}>
          <div style={{fontSize:13,fontWeight:600,color:T.navy,marginBottom:12}}>AQI Trend</div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={MONTHLY}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/>
              <XAxis dataKey="month" tick={{fontSize:9,fill:T.textSec}} interval={5}/>
              <YAxis tick={{fontSize:10,fill:T.textSec}}/>
              <Tooltip {...tip}/>
              <Line type="monotone" dataKey="aqi" stroke={T.red} strokeWidth={2} dot={false}/>
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
        <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:16}}>
          <div style={{fontSize:13,fontWeight:600,color:T.navy,marginBottom:12}}>Multi-Pollutant Comparison</div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={MONTHLY.filter((_,i)=>i%6===0)}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/>
              <XAxis dataKey="month" tick={{fontSize:9,fill:T.textSec}}/>
              <YAxis tick={{fontSize:10,fill:T.textSec}}/>
              <Tooltip {...tip}/>
              <Bar dataKey="pm25" fill={T.navy} name="PM2.5"/>
              <Bar dataKey="no2" fill={T.gold} name="NO2"/>
              <Bar dataKey="so2" fill={T.sage} name="SO2"/>
              <Legend/>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:16}}>
          <div style={{fontSize:13,fontWeight:600,color:T.navy,marginBottom:12}}>Regional Pollutant Radar</div>
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={REGIONS.filter(r=>r!=='All').map(r=>{const rc=CITIES.filter(c=>c.region===r);return {region:r,pm25:rc.reduce((a,c)=>a+c.pm25,0)/(rc.length||1),no2:rc.reduce((a,c)=>a+c.no2,0)/(rc.length||1),so2:rc.reduce((a,c)=>a+c.so2,0)/(rc.length||1)};})}>
              <PolarGrid stroke={T.borderL}/>
              <PolarAngleAxis dataKey="region" tick={{fontSize:9,fill:T.textSec}}/>
              <PolarRadiusAxis tick={{fontSize:9,fill:T.textMut}}/>
              <Radar name="PM2.5" dataKey="pm25" stroke={T.navy} fill={T.navy} fillOpacity={0.2}/>
              <Radar name="NO2" dataKey="no2" stroke={T.gold} fill={T.gold} fillOpacity={0.2}/>
              <Legend/>
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );

  const renderHealthEconomics=()=>(
    <div>
      <div style={{display:'flex',gap:12,marginBottom:16,flexWrap:'wrap',alignItems:'center'}}>
        {kpi('Total DALYs',fmt(filteredHealth.reduce((a,h)=>a+h.dalys,0)))}
        {kpi('Avg Health Spend','$'+fmt(filteredHealth.reduce((a,h)=>a+parseFloat(h.healthSpend),0)/filteredHealth.length||0)+'B')}
        {kpi('Total Prod Loss','$'+fmt(filteredHealth.reduce((a,h)=>a+parseFloat(h.prodLoss),0))+'B')}
      </div>
      <div style={{display:'flex',gap:12,marginBottom:16,alignItems:'center'}}>
        <button onClick={()=>csvExport(filteredHealth,'health_economics.csv')} style={{marginLeft:'auto',padding:'8px 16px',background:T.navy,color:'#fff',border:'none',borderRadius:8,fontFamily:T.mono,fontSize:12,cursor:'pointer'}}>Export CSV</button>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:20}}>
        <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:16}}>
          <div style={{fontSize:13,fontWeight:600,color:T.navy,marginBottom:12}}>DALYs by City (Top 15)</div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={filteredHealth.slice(0,15)} layout="vertical" margin={{left:80}}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/>
              <XAxis type="number" tick={{fontSize:10,fill:T.textSec}}/>
              <YAxis type="category" dataKey="city" tick={{fontSize:10,fill:T.textSec}}/>
              <Tooltip {...tip}/>
              <Bar dataKey="dalys" fill={T.navy}/>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:16}}>
          <div style={{fontSize:13,fontWeight:600,color:T.navy,marginBottom:12}}>Cost per Capita vs Mortality</div>
          <ResponsiveContainer width="100%" height={300}>
            <ScatterChart>
              <CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/>
              <XAxis dataKey="costPerCapita" name="Cost/Capita $" tick={{fontSize:10,fill:T.textSec}}/>
              <YAxis dataKey="mortalityRate" name="Mortality Rate" tick={{fontSize:10,fill:T.textSec}}/>
              <Tooltip {...tip}/>
              <Scatter data={filteredHealth} fill={T.red} fillOpacity={0.6}/>
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div style={{overflowX:'auto',border:`1px solid ${T.border}`,borderRadius:10,background:T.surface}}>
        <table style={{width:'100%',borderCollapse:'collapse',fontFamily:T.font,fontSize:13}}>
          <thead>
            <tr>
              {[['City','city'],['DALYs','dalys'],['Health $B','healthSpend'],['Prod Loss $B','prodLoss'],['Mortality','mortalityRate'],['Child Asthma %','childAsthma'],['Elderly %','elderlyImpact'],['$/Capita','costPerCapita']].map(([l,c])=>
                <SortHeader key={c} label={l} col={c} currentCol={healthSort} dir={healthDir} onClick={c2=>toggleSort(c2,healthSort,setHealthSort,healthDir,setHealthDir)}/>
              )}
            </tr>
          </thead>
          <tbody>
            {pagedHealth.map((h,i)=>(
              <tr key={h.city} style={{background:i%2===0?T.surface:'#fafaf8'}}>
                <td style={{padding:'10px 12px',fontWeight:600,color:T.navy}}>{h.city}</td>
                <td style={{padding:'10px 12px',fontFamily:T.mono}}>{h.dalys}</td>
                <td style={{padding:'10px 12px',fontFamily:T.mono}}>${h.healthSpend}B</td>
                <td style={{padding:'10px 12px',fontFamily:T.mono}}>${h.prodLoss}B</td>
                <td style={{padding:'10px 12px',fontFamily:T.mono,color:parseFloat(h.mortalityRate)>10?T.red:T.amber}}>{h.mortalityRate}</td>
                <td style={{padding:'10px 12px',fontFamily:T.mono}}>{h.childAsthma}%</td>
                <td style={{padding:'10px 12px',fontFamily:T.mono}}>{h.elderlyImpact}%</td>
                <td style={{padding:'10px 12px',fontFamily:T.mono}}>${h.costPerCapita}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{display:'flex',justifyContent:'space-between',marginTop:12}}>
        <span style={{fontSize:12,color:T.textMut}}>{filteredHealth.length} records</span>
        <div style={{display:'flex',gap:6}}>
          <button disabled={healthPage===0} onClick={()=>setHealthPage(healthPage-1)} style={{padding:'6px 12px',border:`1px solid ${T.border}`,borderRadius:6,background:T.surface,cursor:healthPage===0?'default':'pointer',opacity:healthPage===0?0.4:1,fontFamily:T.mono,fontSize:12}}>Prev</button>
          <span style={{padding:'6px 12px',fontSize:12,color:T.textSec}}>{healthPage+1}/{totalHealthPages||1}</span>
          <button disabled={healthPage>=totalHealthPages-1} onClick={()=>setHealthPage(healthPage+1)} style={{padding:'6px 12px',border:`1px solid ${T.border}`,borderRadius:6,background:T.surface,cursor:healthPage>=totalHealthPages-1?'default':'pointer',opacity:healthPage>=totalHealthPages-1?0.4:1,fontFamily:T.mono,fontSize:12}}>Next</button>
        </div>
      </div>
    </div>
  );

  const renderRegulatoryTracker=()=>(
    <div>
      <div style={{display:'flex',gap:12,marginBottom:16,alignItems:'center'}}>
        <input value={regSearch} onChange={e=>{setRegSearch(e.target.value);setRegPage(0);}} placeholder="Search countries..." style={{padding:'8px 14px',border:`1px solid ${T.border}`,borderRadius:8,fontFamily:T.font,fontSize:13,background:T.surface,color:T.text,width:220}}/>
        <button onClick={()=>csvExport(filteredRegs,'regulations.csv')} style={{marginLeft:'auto',padding:'8px 16px',background:T.navy,color:'#fff',border:'none',borderRadius:8,fontFamily:T.mono,fontSize:12,cursor:'pointer'}}>Export CSV</button>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:20}}>
        <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:16}}>
          <div style={{fontSize:13,fontWeight:600,color:T.navy,marginBottom:12}}>WHO Gap by Country</div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={filteredRegs.slice(0,15)}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/>
              <XAxis dataKey="country" tick={{fontSize:9,fill:T.textSec}} angle={-45} textAnchor="end" height={80}/>
              <YAxis tick={{fontSize:10,fill:T.textSec}}/>
              <Tooltip {...tip}/>
              <Bar dataKey="whoGap" name="WHO Gap">{filteredRegs.slice(0,15).map((r,i)=><Cell key={i} fill={parseFloat(r.whoGap)>20?T.red:parseFloat(r.whoGap)>10?T.amber:T.green}/>)}</Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:16}}>
          <div style={{fontSize:13,fontWeight:600,color:T.navy,marginBottom:12}}>Enforcement vs Standards</div>
          <ResponsiveContainer width="100%" height={300}>
            <ScatterChart>
              <CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/>
              <XAxis dataKey="pm25Standard" name="PM2.5 Standard" tick={{fontSize:10,fill:T.textSec}}/>
              <YAxis dataKey="enforcementScore" name="Enforcement" tick={{fontSize:10,fill:T.textSec}}/>
              <Tooltip {...tip}/>
              <Scatter data={filteredRegs} fill={T.sage} fillOpacity={0.7}/>
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div style={{overflowX:'auto',border:`1px solid ${T.border}`,borderRadius:10,background:T.surface}}>
        <table style={{width:'100%',borderCollapse:'collapse',fontFamily:T.font,fontSize:13}}>
          <thead>
            <tr>
              {[['Country','country'],['PM2.5 Std','pm25Standard'],['NO2 Std','no2Standard'],['WHO Gap','whoGap'],['Enforcement','enforcementScore'],['Penalties','penalties'],['Monitors','monitoring'],['Updated','lastUpdated'],['ETS','emissionTradingScheme'],['Vehicle Std','vehicleStandard']].map(([l,c])=>
                <SortHeader key={c} label={l} col={c} currentCol={regSort} dir={regDir} onClick={c2=>toggleSort(c2,regSort,setRegSort,regDir,setRegDir)}/>
              )}
            </tr>
          </thead>
          <tbody>
            {pagedRegs.map((r,i)=>(
              <tr key={r.id} style={{background:i%2===0?T.surface:'#fafaf8'}}>
                <td style={{padding:'10px 12px',fontWeight:600,color:T.navy}}>{r.country}</td>
                <td style={{padding:'10px 12px',fontFamily:T.mono}}>{r.pm25Standard}</td>
                <td style={{padding:'10px 12px',fontFamily:T.mono}}>{r.no2Standard}</td>
                <td style={{padding:'10px 12px',fontFamily:T.mono,color:parseFloat(r.whoGap)>20?T.red:T.amber}}>{r.whoGap}</td>
                <td style={{padding:'10px 12px',fontFamily:T.mono}}>{r.enforcementScore}</td>
                <td style={{padding:'10px 12px'}}><span style={{padding:'2px 8px',borderRadius:10,fontSize:11,fontWeight:600,background:r.penalties==='Strong'?'#dcfce7':'#fef2f2',color:r.penalties==='Strong'?T.green:T.red}}>{r.penalties}</span></td>
                <td style={{padding:'10px 12px',fontFamily:T.mono}}>{r.monitoring}</td>
                <td style={{padding:'10px 12px',fontFamily:T.mono}}>{r.lastUpdated}</td>
                <td style={{padding:'10px 12px'}}><span style={{padding:'2px 8px',borderRadius:10,fontSize:11,background:r.emissionTradingScheme==='Active'?'#dcfce7':r.emissionTradingScheme==='Planned'?'#fef9c3':'#f3f4f6',color:r.emissionTradingScheme==='Active'?T.green:r.emissionTradingScheme==='Planned'?T.amber:T.textMut}}>{r.emissionTradingScheme}</span></td>
                <td style={{padding:'10px 12px',fontFamily:T.mono,fontSize:11}}>{r.vehicleStandard}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{display:'flex',justifyContent:'space-between',marginTop:12}}>
        <span style={{fontSize:12,color:T.textMut}}>{filteredRegs.length} countries</span>
        <div style={{display:'flex',gap:6}}>
          <button disabled={regPage===0} onClick={()=>setRegPage(regPage-1)} style={{padding:'6px 12px',border:`1px solid ${T.border}`,borderRadius:6,background:T.surface,cursor:regPage===0?'default':'pointer',opacity:regPage===0?0.4:1,fontFamily:T.mono,fontSize:12}}>Prev</button>
          <span style={{padding:'6px 12px',fontSize:12,color:T.textSec}}>{regPage+1}/{totalRegPages||1}</span>
          <button disabled={regPage>=totalRegPages-1} onClick={()=>setRegPage(regPage+1)} style={{padding:'6px 12px',border:`1px solid ${T.border}`,borderRadius:6,background:T.surface,cursor:regPage>=totalRegPages-1?'default':'pointer',opacity:regPage>=totalRegPages-1?0.4:1,fontFamily:T.mono,fontSize:12}}>Next</button>
        </div>
      </div>
    </div>
  );

  return(
    <div style={{fontFamily:T.font,background:T.bg,minHeight:'100vh',padding:'24px 32px',color:T.text}}>
      <div style={{marginBottom:24}}>
        <div style={{fontSize:11,fontFamily:T.mono,color:T.textMut,letterSpacing:1,textTransform:'uppercase'}}>Environmental Health Intelligence</div>
        <h1 style={{fontSize:28,fontWeight:700,color:T.navy,margin:'4px 0 0'}}>Air Quality & Health Risk</h1>
      </div>
      <div style={{display:'flex',gap:4,marginBottom:24,borderBottom:`2px solid ${T.border}`,paddingBottom:0}}>
        {TABS.map((t,i)=>(
          <button key={t} onClick={()=>setTab(i)} style={{padding:'10px 20px',border:'none',borderBottom:tab===i?`2px solid ${T.gold}`:'2px solid transparent',background:tab===i?T.surface:'transparent',color:tab===i?T.navy:T.textSec,fontFamily:T.font,fontSize:13,fontWeight:tab===i?600:400,cursor:'pointer',transition:'all 0.2s',marginBottom:-2}}>{t}</button>
        ))}
      </div>
      {tab===0&&renderCityDashboard()}
      {tab===1&&renderPollutantAnalysis()}
      {tab===2&&renderHealthEconomics()}
      {tab===3&&renderRegulatoryTracker()}
    </div>
  );
}