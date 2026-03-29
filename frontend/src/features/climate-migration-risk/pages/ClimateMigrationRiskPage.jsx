import React,{useState,useMemo} from 'react';
import {BarChart,Bar,XAxis,YAxis,CartesianGrid,Tooltip,ResponsiveContainer,LineChart,Line,AreaChart,Area,Cell,Legend,PieChart,Pie} from 'recharts';

const T={bg:'#f6f4f0',surface:'#ffffff',surfaceH:'#f0ede7',border:'#e5e0d8',borderL:'#d5cfc5',navy:'#1b3a5c',navyL:'#2c5a8c',gold:'#c5a96a',goldL:'#d4be8a',sage:'#5a8a6a',sageL:'#7ba67d',teal:'#5a8a6a',text:'#1b3a5c',textSec:'#5c6b7e',textMut:'#9aa3ae',red:'#dc2626',green:'#16a34a',amber:'#d97706',font:"'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"};
const sr=(s)=>{let x=Math.sin(s+1)*10000;return x-Math.floor(x);};

const tabs=['Migration Projections','Displacement Risk','Economic & Fiscal','Investment Implications'];
const COLORS=[T.navy,T.gold,T.sage,T.red,T.amber,T.navyL,T.goldL,T.sageL,'#8b5cf6','#06b6d4'];
const DRIVERS=['Sea Level Rise','Drought','Flooding','Extreme Heat','Cyclones','Water Stress'];
const DRIVER_COLORS=[T.navy,T.amber,T.navyL,T.red,T.gold,T.sage];

const COUNTRIES_50=['Bangladesh','India','Vietnam','Philippines','Indonesia','Myanmar','Thailand','Pakistan','Sri Lanka','Nepal',
  'Nigeria','Ethiopia','Kenya','Tanzania','Mozambique','Madagascar','Somalia','Ghana','Senegal','Mali',
  'Egypt','Morocco','Tunisia','Sudan','South Sudan','DRC','Uganda','Rwanda','South Africa','Niger',
  'Mexico','Guatemala','Honduras','Brazil','Colombia','Peru','Ecuador','Haiti','Cuba','Jamaica',
  'China','Japan','South Korea','USA','Australia','Fiji','Tuvalu','Marshall Islands','Kiribati','Maldives'];

const CORRIDORS=[
  {from:'Sub-Saharan Africa',to:'North Africa/Europe',millions:86,drivers:'Drought, Heat, Water',rcp:'RCP 8.5 (2050)'},
  {from:'South Asia',to:'Urban India/Bangladesh',millions:62,drivers:'Sea Level, Flood, Heat',rcp:'RCP 8.5 (2050)'},
  {from:'Latin America',to:'Northern LatAm/US',millions:17,drivers:'Drought, Cyclone, Heat',rcp:'RCP 8.5 (2050)'},
  {from:'East Asia & Pacific',to:'Urban China/Coastal',millions:49,drivers:'Sea Level, Typhoon, Flood',rcp:'RCP 8.5 (2050)'},
  {from:'MENA',to:'Europe/Gulf States',millions:19,drivers:'Heat, Water, Drought',rcp:'RCP 8.5 (2050)'},
  {from:'Small Island States',to:'NZ/Australia/US',millions:3,drivers:'Sea Level, Cyclone',rcp:'RCP 4.5 (2050)'},
];

export default function ClimateMigrationRiskPage(){
  const [tab,setTab]=useState(0);
  const [rcpScenario,setRcpScenario]=useState('RCP 8.5');
  const [yearSlider,setYearSlider]=useState(2050);
  const [selCountry,setSelCountry]=useState(null);
  const [selDriver,setSelDriver]=useState('All');
  const [sortCol,setSortCol]=useState('totalDisplacement');
  const [sortDir,setSortDir]=useState('desc');

  const countries=useMemo(()=>{
    return COUNTRIES_50.map((c,i)=>{
      const s1=sr(i*19+7);const s2=sr(i*23+11);const s3=sr(i*29+13);const s4=sr(i*31+17);const s5=sr(i*37+19);const s6=sr(i*41+23);
      const region=i<10?'South Asia':i<20?'Sub-Saharan Africa (West)':i<30?'Sub-Saharan Africa (East)':i<40?'Latin America & Caribbean':i<44?'East Asia':i<45?'Oceania':'Small Island States';
      const rcpMult=rcpScenario==='RCP 8.5'?1:rcpScenario==='RCP 4.5'?0.6:0.35;
      const yearMult=(yearSlider-2025)/25;
      const baseProj=s1*8+0.5;
      const projection=+(baseProj*rcpMult*yearMult).toFixed(2);
      return{
        name:c,region,
        projectionMn:projection,
        seaLevel:Math.floor(s1*90)*rcpMult,
        drought:Math.floor(s2*85)*rcpMult,
        flooding:Math.floor(s3*80)*rcpMult,
        extremeHeat:Math.floor(s4*95)*rcpMult,
        cyclones:Math.floor(s5*70)*rcpMult,
        waterStress:Math.floor(s6*88)*rcpMult,
        totalDisplacement:Math.floor(s1*2000+100)*rcpMult*yearMult,
        annualDisplacement:Math.floor(s2*500+50)*rcpMult,
        humanitarianCostMn:Math.floor(s3*5000+100)*rcpMult,
        populationAtRisk:+(s4*30+2).toFixed(1),
        gdpImpact:+(s5*-8-0.5).toFixed(1),
        labourLoss:+(s6*15+1).toFixed(1),
        remittancePct:+(s1*25).toFixed(1),
        brainDrain:+(s2*20).toFixed(1),
        housingDemandIncrease:+(s3*40).toFixed(1),
        fiscalCostPct:+(s4*3+0.2).toFixed(1),
        realEstateRiskBn:+(s5*50+1).toFixed(1),
        infraInvestNeedBn:+(s6*30+2).toFixed(1),
        sovCreditImpact:Math.floor(s1*200)-50,
        adaptationInvestBn:+(s2*20+1).toFixed(1),
        cityPressure:['Low','Medium','High','Critical'][Math.floor(s3*4)],
      };
    });
  },[rcpScenario,yearSlider]);

  const sorted=useMemo(()=>{
    return[...countries].sort((a,b)=>sortDir==='desc'?(b[sortCol]||0)-(a[sortCol]||0):(a[sortCol]||0)-(b[sortCol]||0));
  },[countries,sortCol,sortDir]);

  const regionAgg=useMemo(()=>{
    const map={};
    countries.forEach(c=>{
      const r=c.region.split(' (')[0];
      if(!map[r])map[r]={region:r,totalProj:0,totalDisp:0,count:0};
      map[r].totalProj+=c.projectionMn;map[r].totalDisp+=c.totalDisplacement;map[r].count++;
    });
    return Object.values(map).sort((a,b)=>b.totalProj-a.totalProj);
  },[countries]);

  const scenarioTimeline=useMemo(()=>{
    const years=[2025,2030,2035,2040,2045,2050];
    return years.map((y,i)=>({
      year:y,
      rcp85:Math.round(20+i*i*7.5+sr(i*73+7)*10),
      rcp45:Math.round(15+i*i*3.5+sr(i*79+11)*8),
      rcp26:Math.round(10+i*i*1.5+sr(i*83+13)*5),
    }));
  },[]);

  const driverBreakdown=useMemo(()=>{
    const totals=DRIVERS.map((d,di)=>{
      const key=['seaLevel','drought','flooding','extremeHeat','cyclones','waterStress'][di];
      return{driver:d,total:Math.round(countries.reduce((a,c)=>a+(c[key]||0),0)/countries.length)};
    });
    return totals.sort((a,b)=>b.total-a.total);
  },[countries]);

  const displacementTrend=useMemo(()=>{
    const years=['2018','2019','2020','2021','2022','2023','2024','2025'];
    return years.map((y,i)=>({
      year:y,
      weather:Math.floor(sr(i*87+7)*15)+20+i*2,
      conflict:Math.floor(sr(i*89+11)*8)+5,
      total:Math.floor(sr(i*91+13)*20)+28+i*2,
    }));
  },[]);

  const handleSort=(col)=>{if(sortCol===col)setSortDir(d=>d==='desc'?'asc':'desc');else{setSortCol(col);setSortDir('desc');}};

  const exportCSV=()=>{
    const headers=['Country','Region','Projection Mn','Sea Level','Drought','Flooding','Heat','Cyclones','Water Stress','Annual Displacement','GDP Impact %','Real Estate Risk $Bn','Infra Need $Bn','Sov Credit bps'];
    const rows=sorted.map(c=>[c.name,c.region,c.projectionMn,c.seaLevel,c.drought,c.flooding,c.extremeHeat,c.cyclones,c.waterStress,c.annualDisplacement,c.gdpImpact,c.realEstateRiskBn,c.infraInvestNeedBn,c.sovCreditImpact].join(','));
    const csv=[headers.join(','),...rows].join('\n');
    const blob=new Blob([csv],{type:'text/csv'});const url=URL.createObjectURL(blob);
    const a=document.createElement('a');a.href=url;a.download='climate_migration_risk.csv';a.click();URL.revokeObjectURL(url);
  };

  const sty={
    wrap:{fontFamily:T.font,background:T.bg,minHeight:'100vh',padding:'24px'},
    title:{fontSize:'28px',fontWeight:700,color:T.navy,margin:0,letterSpacing:'-0.5px'},
    subtitle:{fontSize:'13px',color:T.textSec,marginTop:'4px',fontFamily:T.mono},
    tabs:{display:'flex',gap:'2px',background:T.border,borderRadius:'10px',padding:'3px',marginBottom:'24px'},
    tab:(a)=>({padding:'10px 20px',borderRadius:'8px',border:'none',cursor:'pointer',fontSize:'13px',fontWeight:a?600:400,background:a?T.surface:'transparent',color:a?T.navy:T.textSec,fontFamily:T.font,transition:'all 0.2s'}),
    card:{background:T.surface,borderRadius:'12px',border:`1px solid ${T.border}`,padding:'20px',marginBottom:'16px'},
    cardTitle:{fontSize:'15px',fontWeight:600,color:T.navy,marginBottom:'12px'},
    kpi:{display:'inline-block',background:T.surfaceH,borderRadius:'8px',padding:'12px 18px',margin:'4px',minWidth:'140px',textAlign:'center'},
    kpiVal:{fontSize:'22px',fontWeight:700,color:T.navy,fontFamily:T.mono},
    kpiLbl:{fontSize:'11px',color:T.textMut,marginTop:'2px'},
    grid2:{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'16px'},
    grid3:{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'16px'},
    table:{width:'100%',borderCollapse:'collapse',fontSize:'12px'},
    th:{padding:'8px 10px',textAlign:'left',borderBottom:`2px solid ${T.border}`,color:T.textSec,fontWeight:600,cursor:'pointer',fontSize:'11px',fontFamily:T.mono,textTransform:'uppercase',letterSpacing:'0.5px'},
    td:{padding:'7px 10px',borderBottom:`1px solid ${T.border}`,color:T.text,fontSize:'12px'},
    badge:(c)=>({display:'inline-block',padding:'2px 8px',borderRadius:'4px',fontSize:'10px',fontWeight:600,color:'#fff',background:c}),
    mono:{fontFamily:T.mono,fontSize:'11px'},
    row:{display:'flex',gap:'12px',alignItems:'center',flexWrap:'wrap',marginBottom:'12px'},
    tag:(active)=>({display:'inline-block',padding:'4px 10px',borderRadius:'12px',fontSize:'11px',fontWeight:500,cursor:'pointer',background:active?T.navy:T.surfaceH,color:active?'#fff':T.textSec,border:`1px solid ${active?T.navy:T.border}`,margin:'2px'}),
    slider:{width:'200px',accentColor:T.navy},
    progressBar:{height:'6px',borderRadius:'3px',background:T.surfaceH,position:'relative',overflow:'hidden'},
    progressFill:(pct,color)=>({height:'100%',borderRadius:'3px',background:color,width:`${Math.min(Math.abs(pct),100)}%`}),
    btn:{padding:'8px 16px',borderRadius:'6px',border:'none',cursor:'pointer',fontSize:'12px',fontWeight:600,fontFamily:T.font},
  };

  const totalProjection=countries.reduce((a,c)=>a+c.projectionMn,0);

  const renderTab0=()=>(
    <div>
      <div style={sty.row}>
        <span style={{fontSize:'12px',color:T.textSec}}>Scenario:</span>
        {['RCP 2.6','RCP 4.5','RCP 8.5'].map(s=>(<span key={s} style={sty.tag(rcpScenario===s)} onClick={()=>setRcpScenario(s)}>{s}</span>))}
        <span style={{fontSize:'12px',color:T.textSec,marginLeft:'20px'}}>Year:</span>
        <input type="range" min={2030} max={2050} step={5} value={yearSlider} onChange={e=>setYearSlider(+e.target.value)} style={sty.slider}/>
        <span style={sty.mono}>{yearSlider}</span>
      </div>
      <div style={sty.row}>
        {[{l:`Total Projected (${yearSlider})`,v:`${totalProjection.toFixed(0)}M`},{l:'Countries at Risk',v:50},{l:'Hotspot Corridors',v:CORRIDORS.length},{l:'World Bank Pessimistic',v:'216M'},{l:'Annual Displacement',v:`${Math.round(countries.reduce((a,c)=>a+c.annualDisplacement,0)/1000)}K`},{l:'Humanitarian Cost',v:`$${Math.round(countries.reduce((a,c)=>a+c.humanitarianCostMn,0)/1e3)}B`}].map((k,i)=>(
          <div key={i} style={sty.kpi}><div style={sty.kpiVal}>{k.v}</div><div style={sty.kpiLbl}>{k.l}</div></div>
        ))}
      </div>
      <div style={sty.card}>
        <div style={sty.cardTitle}>Climate Migration Projections by Scenario</div>
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={scenarioTimeline}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
            <XAxis dataKey="year" tick={{fontSize:11,fill:T.textSec}}/>
            <YAxis tick={{fontSize:10,fill:T.textSec}} label={{value:'Millions',position:'insideTopLeft',fontSize:10}}/>
            <Tooltip contentStyle={{fontSize:11,borderRadius:8}} formatter={v=>`${v}M`}/>
            <Area type="monotone" dataKey="rcp85" stroke={T.red} fill={T.red} fillOpacity={0.15} name="RCP 8.5 (Pessimistic)" strokeWidth={rcpScenario==='RCP 8.5'?3:1}/>
            <Area type="monotone" dataKey="rcp45" stroke={T.amber} fill={T.amber} fillOpacity={0.1} name="RCP 4.5 (Middle)" strokeWidth={rcpScenario==='RCP 4.5'?3:1}/>
            <Area type="monotone" dataKey="rcp26" stroke={T.sage} fill={T.sage} fillOpacity={0.1} name="RCP 2.6 (Optimistic)" strokeWidth={rcpScenario==='RCP 2.6'?3:1}/>
            <Legend wrapperStyle={{fontSize:11}}/>
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div style={sty.grid2}>
        <div style={sty.card}>
          <div style={sty.cardTitle}>Regional Migration Projections</div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={regionAgg} layout="vertical"><CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
              <XAxis type="number" tick={{fontSize:10,fill:T.textSec}}/>
              <YAxis dataKey="region" type="category" tick={{fontSize:9,fill:T.textSec}} width={120}/>
              <Tooltip formatter={v=>`${v.toFixed(1)}M`} contentStyle={{fontSize:11,borderRadius:8}}/>
              <Bar dataKey="totalProj" name="Projected Millions" radius={[0,4,4,0]}>
                {regionAgg.map((e,i)=>(<Cell key={i} fill={COLORS[i%COLORS.length]}/>))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={sty.card}>
          <div style={sty.cardTitle}>Hotspot Corridors</div>
          <table style={sty.table}>
            <thead><tr><th style={sty.th}>From</th><th style={sty.th}>To</th><th style={sty.th}>Millions</th><th style={sty.th}>Drivers</th></tr></thead>
            <tbody>{CORRIDORS.map((c,i)=>(
              <tr key={i}><td style={{...sty.td,fontWeight:600}}>{c.from}</td><td style={sty.td}>{c.to}</td>
                <td style={{...sty.td,...sty.mono,fontWeight:700}}>{c.millions}M</td>
                <td style={{...sty.td,fontSize:'11px'}}>{c.drivers}</td></tr>
            ))}</tbody>
          </table>
        </div>
      </div>
      <div style={sty.card}>
        <div style={sty.cardTitle}>Top 20 Countries by Projected Migration ({yearSlider}, {rcpScenario})</div>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={sorted.slice(0,20)} layout="vertical"><CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
            <XAxis type="number" tick={{fontSize:10,fill:T.textSec}}/>
            <YAxis dataKey="name" type="category" tick={{fontSize:9,fill:T.textSec}} width={100}/>
            <Tooltip formatter={v=>`${v}M`} contentStyle={{fontSize:11,borderRadius:8}}/>
            <Bar dataKey="projectionMn" name="Projected Millions" radius={[0,4,4,0]}>
              {sorted.slice(0,20).map((e,i)=>(<Cell key={i} fill={e.projectionMn>5?T.red:e.projectionMn>2?T.amber:T.sage}/>))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );

  const renderTab1=()=>(
    <div>
      <div style={sty.row}>
        <span style={{fontSize:'12px',color:T.textSec}}>Driver Filter:</span>
        {['All',...DRIVERS].map(d=>(<span key={d} style={sty.tag(selDriver===d)} onClick={()=>setSelDriver(d)}>{d}</span>))}
      </div>
      <div style={sty.grid2}>
        <div style={sty.card}>
          <div style={sty.cardTitle}>Climate Driver Risk Breakdown</div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={driverBreakdown}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
              <XAxis dataKey="driver" tick={{fontSize:9,fill:T.textSec}} angle={-20} textAnchor="end" height={50}/>
              <YAxis tick={{fontSize:10,fill:T.textSec}}/>
              <Tooltip contentStyle={{fontSize:11,borderRadius:8}}/>
              <Bar dataKey="total" name="Avg Risk Score" radius={[4,4,0,0]}>
                {driverBreakdown.map((e,i)=>(<Cell key={i} fill={DRIVER_COLORS[DRIVERS.indexOf(e.driver)]}/>))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={sty.card}>
          <div style={sty.cardTitle}>Annual Displacement Trend (IDMC)</div>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={displacementTrend}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
              <XAxis dataKey="year" tick={{fontSize:11,fill:T.textSec}}/>
              <YAxis tick={{fontSize:10,fill:T.textSec}} label={{value:'Millions',position:'insideTopLeft',fontSize:10}}/>
              <Tooltip contentStyle={{fontSize:11,borderRadius:8}} formatter={v=>`${v}M`}/>
              <Area type="monotone" dataKey="weather" stroke={T.navy} fill={T.navy} fillOpacity={0.15} name="Weather Events"/>
              <Area type="monotone" dataKey="conflict" stroke={T.red} fill={T.red} fillOpacity={0.1} name="Conflict"/>
              <Area type="monotone" dataKey="total" stroke={T.gold} fill={T.gold} fillOpacity={0.05} name="Total" strokeDasharray="5 5"/>
              <Legend wrapperStyle={{fontSize:11}}/>
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div style={sty.card}>
        <div style={sty.cardTitle}>Country Displacement Risk Assessment (50 Countries, 6 Drivers)</div>
        <div style={{maxHeight:'500px',overflowY:'auto'}}>
          <table style={sty.table}>
            <thead><tr>
              <th style={sty.th} onClick={()=>handleSort('name')}>Country</th><th style={sty.th}>Region</th>
              <th style={sty.th} onClick={()=>handleSort('seaLevel')}>Sea Level</th>
              <th style={sty.th} onClick={()=>handleSort('drought')}>Drought</th>
              <th style={sty.th} onClick={()=>handleSort('flooding')}>Flood</th>
              <th style={sty.th} onClick={()=>handleSort('extremeHeat')}>Heat</th>
              <th style={sty.th} onClick={()=>handleSort('cyclones')}>Cyclone</th>
              <th style={sty.th} onClick={()=>handleSort('waterStress')}>Water</th>
              <th style={sty.th} onClick={()=>handleSort('annualDisplacement')}>Annual Disp</th>
              <th style={sty.th} onClick={()=>handleSort('humanitarianCostMn')}>Cost $M</th>
            </tr></thead>
            <tbody>{sorted.map((c,i)=>(
              <tr key={i} style={{background:selCountry===c.name?`${T.gold}15`:i%2===0?'transparent':T.surfaceH,cursor:'pointer'}} onClick={()=>setSelCountry(selCountry===c.name?null:c.name)}>
                <td style={{...sty.td,fontWeight:600}}>{c.name}</td><td style={{...sty.td,fontSize:'11px'}}>{c.region}</td>
                {['seaLevel','drought','flooding','extremeHeat','cyclones','waterStress'].map(d=>(
                  <td key={d} style={sty.td}><div style={{display:'flex',alignItems:'center',gap:'3px'}}><div style={{...sty.progressBar,width:'35px'}}><div style={sty.progressFill(c[d],c[d]>60?T.red:c[d]>30?T.amber:T.green)}/></div><span style={sty.mono}>{Math.round(c[d])}</span></div></td>
                ))}
                <td style={{...sty.td,...sty.mono}}>{Math.round(c.annualDisplacement)}K</td>
                <td style={{...sty.td,...sty.mono}}>${Math.round(c.humanitarianCostMn)}M</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </div>
      {selCountry&&(()=>{
        const cd=countries.find(c=>c.name===selCountry);
        if(!cd)return null;
        return(
          <div style={{...sty.card,borderLeft:`4px solid ${T.gold}`}}>
            <div style={sty.cardTitle}>{selCountry} — Displacement Profile</div>
            <div style={sty.row}>
              {[{l:'Annual Displacement',v:`${Math.round(cd.annualDisplacement)}K`},{l:'Population at Risk',v:`${cd.populationAtRisk}%`},{l:'Humanitarian Cost',v:`$${Math.round(cd.humanitarianCostMn)}M`},{l:'Projected Migration',v:`${cd.projectionMn.toFixed(1)}M`},{l:'GDP Impact',v:`${cd.gdpImpact}%`},{l:'City Pressure',v:cd.cityPressure}].map((k,i)=>(
                <div key={i} style={sty.kpi}><div style={sty.kpiVal}>{k.v}</div><div style={sty.kpiLbl}>{k.l}</div></div>
              ))}
            </div>
          </div>
        );
      })()}
    </div>
  );

  const renderTab2=()=>(
    <div>
      <div style={sty.row}>
        {[{l:'Avg GDP Impact',v:`${(countries.reduce((a,c)=>a+parseFloat(c.gdpImpact),0)/50).toFixed(1)}%`},{l:'Avg Labour Loss',v:`${(countries.reduce((a,c)=>a+parseFloat(c.labourLoss),0)/50).toFixed(1)}%`},{l:'Avg Remittance Inflow',v:`${(countries.reduce((a,c)=>a+parseFloat(c.remittancePct),0)/50).toFixed(1)}%`},{l:'Avg Brain Drain',v:`${(countries.reduce((a,c)=>a+parseFloat(c.brainDrain),0)/50).toFixed(1)}%`},{l:'Avg Housing Demand +',v:`${(countries.reduce((a,c)=>a+parseFloat(c.housingDemandIncrease),0)/50).toFixed(0)}%`},{l:'Avg Fiscal Cost',v:`${(countries.reduce((a,c)=>a+parseFloat(c.fiscalCostPct),0)/50).toFixed(1)}% GDP`}].map((k,i)=>(
          <div key={i} style={sty.kpi}><div style={sty.kpiVal}>{k.v}</div><div style={sty.kpiLbl}>{k.l}</div></div>
        ))}
      </div>
      <div style={sty.grid2}>
        <div style={sty.card}>
          <div style={sty.cardTitle}>GDP Impact from Climate Migration (Top 20)</div>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={[...countries].sort((a,b)=>parseFloat(a.gdpImpact)-parseFloat(b.gdpImpact)).slice(0,20)} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
              <XAxis type="number" tick={{fontSize:10,fill:T.textSec}}/>
              <YAxis dataKey="name" type="category" tick={{fontSize:9,fill:T.textSec}} width={100}/>
              <Tooltip formatter={v=>`${v}%`} contentStyle={{fontSize:11,borderRadius:8}}/>
              <Bar dataKey="gdpImpact" name="GDP Impact %" radius={[0,4,4,0]}>
                {[...countries].sort((a,b)=>parseFloat(a.gdpImpact)-parseFloat(b.gdpImpact)).slice(0,20).map((e,i)=>(<Cell key={i} fill={parseFloat(e.gdpImpact)<-5?T.red:parseFloat(e.gdpImpact)<-2?T.amber:T.sage}/>))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={sty.card}>
          <div style={sty.cardTitle}>Receiving Region: Housing Demand Increase</div>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={[...countries].sort((a,b)=>parseFloat(b.housingDemandIncrease)-parseFloat(a.housingDemandIncrease)).slice(0,20)} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
              <XAxis type="number" tick={{fontSize:10,fill:T.textSec}}/>
              <YAxis dataKey="name" type="category" tick={{fontSize:9,fill:T.textSec}} width={100}/>
              <Tooltip formatter={v=>`+${v}%`} contentStyle={{fontSize:11,borderRadius:8}}/>
              <Bar dataKey="housingDemandIncrease" name="Housing +%" radius={[0,4,4,0]} fill={T.gold}/>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div style={sty.card}>
        <div style={sty.cardTitle}>Sending vs Receiving Economic Dynamics</div>
        <div style={sty.grid3}>
          {[{title:'Sending Region Impact',items:[{m:'Avg Labour Loss',v:`${(countries.reduce((a,c)=>a+parseFloat(c.labourLoss),0)/50).toFixed(1)}%`},{m:'Brain Drain',v:`${(countries.reduce((a,c)=>a+parseFloat(c.brainDrain),0)/50).toFixed(1)}%`},{m:'Agricultural Labour',v:'-12.3%'},{m:'GDP Impact (Sending)',v:`${(countries.reduce((a,c)=>a+parseFloat(c.gdpImpact),0)/50).toFixed(1)}%`}]},
            {title:'Receiving Region Impact',items:[{m:'Housing Demand',v:`+${(countries.reduce((a,c)=>a+parseFloat(c.housingDemandIncrease),0)/50).toFixed(0)}%`},{m:'Labour Supply',v:'+8.4%'},{m:'Fiscal Cost',v:`${(countries.reduce((a,c)=>a+parseFloat(c.fiscalCostPct),0)/50).toFixed(1)}% GDP`},{m:'Infrastructure Need',v:`$${Math.round(countries.reduce((a,c)=>a+parseFloat(c.infraInvestNeedBn),0))}B`}]},
            {title:'Financial Flows',items:[{m:'Remittances',v:`${(countries.reduce((a,c)=>a+parseFloat(c.remittancePct),0)/50).toFixed(1)}% GDP`},{m:'Aid Flows',v:'$42B/yr'},{m:'Climate Finance',v:'$18B/yr (needed: $200B)'},{m:'Insurance Gap',v:'87%'}]}
          ].map((sec,si)=>(
            <div key={si} style={{padding:'12px',background:T.surfaceH,borderRadius:'8px'}}>
              <div style={{fontSize:'13px',fontWeight:600,color:T.navy,marginBottom:'8px'}}>{sec.title}</div>
              {sec.items.map((item,ii)=>(
                <div key={ii} style={{display:'flex',justifyContent:'space-between',padding:'4px 0',borderBottom:`1px solid ${T.border}`}}>
                  <span style={{fontSize:'11px',color:T.textSec}}>{item.m}</span>
                  <span style={{...sty.mono,fontWeight:600,color:T.navy}}>{item.v}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderTab3=()=>(
    <div>
      <div style={sty.row}>
        {[{l:'Total RE Stranded Risk',v:`$${Math.round(countries.reduce((a,c)=>a+parseFloat(c.realEstateRiskBn),0))}B`},{l:'Total Infra Invest Need',v:`$${Math.round(countries.reduce((a,c)=>a+parseFloat(c.infraInvestNeedBn),0))}B`},{l:'Total Adaptation Need',v:`$${Math.round(countries.reduce((a,c)=>a+parseFloat(c.adaptationInvestBn),0))}B`},{l:'Sov Credit Impact (avg)',v:`${Math.round(countries.reduce((a,c)=>a+c.sovCreditImpact,0)/50)} bps`},{l:'Critical City Pressure',v:countries.filter(c=>c.cityPressure==='Critical').length}].map((k,i)=>(
          <div key={i} style={sty.kpi}><div style={sty.kpiVal}>{k.v}</div><div style={sty.kpiLbl}>{k.l}</div></div>
        ))}
      </div>
      <div style={sty.grid2}>
        <div style={sty.card}>
          <div style={sty.cardTitle}>Real Estate Stranded Asset Risk (Top 20)</div>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={[...countries].sort((a,b)=>parseFloat(b.realEstateRiskBn)-parseFloat(a.realEstateRiskBn)).slice(0,20)} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
              <XAxis type="number" tick={{fontSize:10,fill:T.textSec}}/>
              <YAxis dataKey="name" type="category" tick={{fontSize:9,fill:T.textSec}} width={100}/>
              <Tooltip formatter={v=>`$${v}B`} contentStyle={{fontSize:11,borderRadius:8}}/>
              <Bar dataKey="realEstateRiskBn" name="RE Risk $Bn" radius={[0,4,4,0]}>
                {[...countries].sort((a,b)=>parseFloat(b.realEstateRiskBn)-parseFloat(a.realEstateRiskBn)).slice(0,20).map((e,i)=>(<Cell key={i} fill={parseFloat(e.realEstateRiskBn)>30?T.red:parseFloat(e.realEstateRiskBn)>15?T.amber:T.sage}/>))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={sty.card}>
          <div style={sty.cardTitle}>Sovereign Credit Impact (bps)</div>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={[...countries].sort((a,b)=>b.sovCreditImpact-a.sovCreditImpact).slice(0,20)} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
              <XAxis type="number" tick={{fontSize:10,fill:T.textSec}}/>
              <YAxis dataKey="name" type="category" tick={{fontSize:9,fill:T.textSec}} width={100}/>
              <Tooltip formatter={v=>`${v} bps`} contentStyle={{fontSize:11,borderRadius:8}}/>
              <Bar dataKey="sovCreditImpact" name="Credit Impact bps" radius={[0,4,4,0]}>
                {[...countries].sort((a,b)=>b.sovCreditImpact-a.sovCreditImpact).slice(0,20).map((e,i)=>(<Cell key={i} fill={e.sovCreditImpact>100?T.red:e.sovCreditImpact>50?T.amber:T.green}/>))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div style={sty.card}>
        <div style={sty.cardTitle}>Adaptation Investment vs Migration Pressure</div>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={[...countries].sort((a,b)=>parseFloat(b.adaptationInvestBn)-parseFloat(a.adaptationInvestBn)).slice(0,15)}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
            <XAxis dataKey="name" tick={{fontSize:9,fill:T.textSec}} angle={-35} textAnchor="end" height={60}/>
            <YAxis tick={{fontSize:10,fill:T.textSec}}/>
            <Tooltip contentStyle={{fontSize:11,borderRadius:8}}/>
            <Bar dataKey="adaptationInvestBn" fill={T.sage} name="Adaptation $Bn" radius={[4,4,0,0]}/>
            <Bar dataKey="projectionMn" fill={T.red} name="Migration Mn" radius={[4,4,0,0]}/>
            <Legend wrapperStyle={{fontSize:11}}/>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div style={sty.card}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'12px'}}>
          <div style={sty.cardTitle}>Full Country Investment Risk Matrix</div>
          <button style={{...sty.btn,background:T.gold,color:'#fff'}} onClick={exportCSV}>Export CSV</button>
        </div>
        <div style={{maxHeight:'400px',overflowY:'auto'}}>
          <table style={sty.table}>
            <thead><tr>
              <th style={sty.th}>Country</th><th style={sty.th}>RE Risk $Bn</th><th style={sty.th}>Infra $Bn</th>
              <th style={sty.th}>Adaptation $Bn</th><th style={sty.th}>Sov Credit bps</th><th style={sty.th}>City Pressure</th><th style={sty.th}>GDP Impact</th>
            </tr></thead>
            <tbody>{sorted.slice(0,30).map((c,i)=>(
              <tr key={i} style={{background:i%2===0?'transparent':T.surfaceH}}>
                <td style={{...sty.td,fontWeight:600}}>{c.name}</td>
                <td style={{...sty.td,...sty.mono}}>${c.realEstateRiskBn}B</td>
                <td style={{...sty.td,...sty.mono}}>${c.infraInvestNeedBn}B</td>
                <td style={{...sty.td,...sty.mono}}>${c.adaptationInvestBn}B</td>
                <td style={{...sty.td,...sty.mono,color:c.sovCreditImpact>100?T.red:T.text}}>{c.sovCreditImpact} bps</td>
                <td style={sty.td}><span style={sty.badge(c.cityPressure==='Critical'?T.red:c.cityPressure==='High'?T.amber:c.cityPressure==='Medium'?T.gold:T.green)}>{c.cityPressure}</span></td>
                <td style={{...sty.td,...sty.mono,color:T.red}}>{c.gdpImpact}%</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </div>
    </div>
  );

  return(
    <div style={sty.wrap}>
      <div style={{marginBottom:'24px'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
          <div><h1 style={sty.title}>Climate Migration & Displacement Risk</h1><p style={sty.subtitle}>EP-AV5 // World Bank Groundswell, IDMC displacement, economic impact // 50 countries, 6 drivers, RCP scenarios</p></div>
          <div style={{...sty.mono,color:T.textMut}}>Updated: 2026-03-29</div>
        </div>
      </div>
      <div style={sty.tabs}>{tabs.map((t,i)=>(<button key={i} style={sty.tab(tab===i)} onClick={()=>setTab(i)}>{t}</button>))}</div>
      {tab===0&&renderTab0()}
      {tab===1&&renderTab1()}
      {tab===2&&renderTab2()}
      {tab===3&&renderTab3()}
    </div>
  );
}
