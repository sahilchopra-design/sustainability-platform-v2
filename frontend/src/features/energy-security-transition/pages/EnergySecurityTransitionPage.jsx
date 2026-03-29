import React,{useState,useMemo} from 'react';
import {BarChart,Bar,XAxis,YAxis,CartesianGrid,Tooltip,ResponsiveContainer,LineChart,Line,AreaChart,Area,Cell,Legend,PieChart,Pie} from 'recharts';

const T={bg:'#f6f4f0',surface:'#ffffff',surfaceH:'#f0ede7',border:'#e5e0d8',borderL:'#d5cfc5',navy:'#1b3a5c',navyL:'#2c5a8c',gold:'#c5a96a',goldL:'#d4be8a',sage:'#5a8a6a',sageL:'#7ba67d',teal:'#5a8a6a',text:'#1b3a5c',textSec:'#5c6b7e',textMut:'#9aa3ae',red:'#dc2626',green:'#16a34a',amber:'#d97706',font:"'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"};
const sr=(s)=>{let x=Math.sin(s+1)*10000;return x-Math.floor(x);};

const tabs=['Energy Security Index','Fossil Fuel Dependency','Renewable Self-Sufficiency','Investment Implications'];
const COLORS=[T.navy,T.gold,T.sage,T.red,T.amber,T.navyL,T.goldL,T.sageL,'#8b5cf6','#06b6d4'];

const COUNTRIES_50=['Germany','France','UK','Italy','Spain','Poland','Netherlands','Belgium','Sweden','Norway',
  'Finland','Denmark','Austria','Switzerland','Czech Republic','Romania','Hungary','Portugal','Greece','Ireland',
  'USA','Canada','Japan','South Korea','China','India','Australia','Brazil','Mexico','Turkey',
  'Saudi Arabia','UAE','Qatar','Indonesia','Thailand','Vietnam','Philippines','Malaysia','Singapore','Taiwan',
  'South Africa','Nigeria','Kenya','Egypt','Morocco','Chile','Colombia','Argentina','Israel','New Zealand'];

const CHOKEPOINTS=[
  {name:'Strait of Hormuz',oil:21,lng:25,countries:'Iran, Oman, UAE',risk:'Critical',alternativeRoute:'Red Sea (limited)',dailyBbl:21},
  {name:'Strait of Malacca',oil:16,lng:15,countries:'Malaysia, Indonesia, Singapore',risk:'High',alternativeRoute:'Lombok/Sunda Strait',dailyBbl:16},
  {name:'Suez Canal',oil:9,lng:12,countries:'Egypt',risk:'High',alternativeRoute:'Cape of Good Hope (+14 days)',dailyBbl:9},
  {name:'Bab el-Mandeb',oil:6.2,lng:8,countries:'Yemen, Djibouti, Eritrea',risk:'Critical (Houthi)',alternativeRoute:'Cape of Good Hope',dailyBbl:6.2},
  {name:'Turkish Straits',oil:3.4,lng:2,countries:'Turkey',risk:'Medium',alternativeRoute:'Pipelines (BTC, TAP)',dailyBbl:3.4},
  {name:'Panama Canal',oil:1.0,lng:5,countries:'Panama',risk:'Medium (drought)',alternativeRoute:'Trans-ship/rail',dailyBbl:1},
  {name:'CAPE Pipeline',oil:0,lng:0,countries:'Denmark/Germany',risk:'Sabotage Risk',alternativeRoute:'Nord Stream destroyed, Baltic Pipe',dailyBbl:0},
  {name:'Danish Straits',oil:3.2,lng:1.5,countries:'Denmark',risk:'Medium',alternativeRoute:'Limited',dailyBbl:3.2},
];

const PIPELINE_ROUTES=[
  {name:'Nord Stream (destroyed)',from:'Russia',to:'Germany',capacity:55,status:'Destroyed',type:'Gas',utilization:0},
  {name:'TurkStream',from:'Russia',to:'Turkey',capacity:31.5,status:'Operational',type:'Gas',utilization:78},
  {name:'Yamal-Europe',from:'Russia',to:'Poland/Germany',capacity:33,status:'Reduced',type:'Gas',utilization:15},
  {name:'Trans-Adriatic (TAP)',from:'Azerbaijan',to:'Italy',capacity:10,status:'Operational',type:'Gas',utilization:92},
  {name:'Southern Gas Corridor',from:'Azerbaijan',to:'EU',capacity:16,status:'Expanding',type:'Gas',utilization:85},
  {name:'Baltic Pipe',from:'Norway',to:'Poland',capacity:10,status:'Operational',type:'Gas',utilization:88},
  {name:'Interconnector (IUK)',from:'UK',to:'Belgium',capacity:25.5,status:'Operational',type:'Gas',utilization:65},
  {name:'Druzhba Pipeline',from:'Russia',to:'Central Europe',capacity:1.4,status:'Reduced',type:'Oil',utilization:30},
  {name:'BTC Pipeline',from:'Azerbaijan',to:'Turkey/Med',capacity:1.2,status:'Operational',type:'Oil',utilization:75},
  {name:'East-West (ESPO)',from:'Russia',to:'China/Pacific',capacity:1.6,status:'Expanded',type:'Oil',utilization:95},
];

export default function EnergySecurityTransitionPage(){
  const [tab,setTab]=useState(0);
  const [selCountry,setSelCountry]=useState(null);
  const [sortCol,setSortCol]=useState('securityIndex');
  const [sortDir,setSortDir]=useState('desc');
  const [regionFilter,setRegionFilter]=useState('All');
  const [scenarioToggle,setScenarioToggle]=useState('Current');
  const [yearSlider,setYearSlider]=useState(2030);

  const countries=useMemo(()=>{
    return COUNTRIES_50.map((c,i)=>{
      const s1=sr(i*19+7);const s2=sr(i*23+11);const s3=sr(i*29+13);const s4=sr(i*31+17);const s5=sr(i*37+19);const s6=sr(i*41+23);
      const region=i<20?'Europe':i<24?'Americas':i<30?'Asia Pacific':i<33?'Middle East':i<40?'Asia Pacific':i<45?'Africa':'Americas';
      const importDep=i>=30&&i<=32?-Math.floor(s1*200):Math.floor(s1*85)+5;
      const renewShare=Math.floor(s3*60)+5;
      const gasFromRussia=region==='Europe'?Math.floor(s4*50):Math.floor(s4*10);
      const reserveDays=Math.floor(s2*180)+10;
      const gridReliability=80+Math.floor(s5*20);
      const hhiImports=+(s6*8000+500).toFixed(0);
      const fuelDiversity=+(1-s4*0.6).toFixed(2);
      const securityIndex=Math.round((100-Math.abs(importDep)*0.3+reserveDays*0.15+renewShare*0.5+gridReliability*0.2-hhiImports*0.005)*0.5);
      return{
        name:c,region,importDependency:importDep,reserveDays,renewableShare:renewShare,gridReliability,
        hhiImports:Math.floor(hhiImports),fuelDiversity,gasFromRussia,securityIndex:Math.max(10,Math.min(95,securityIndex)),
        oilImportPct:Math.floor(s1*90)+5,gasImportPct:Math.floor(s2*85)+5,coalImportPct:Math.floor(s3*70)+5,
        lngTerminalCap:Math.floor(s4*50),nuclearShare:Math.floor(s5*35),
        renewPotential:Math.floor(s6*90)+20,currentDeployment:renewShare,
        energyIndependenceYear:2025+Math.floor(s1*30),
        criticalMineralDep:Math.floor(s2*90)+5,
        sovSpreadPremium:Math.floor(s3*150),utilityExposure:Math.floor(s4*100),
        gridInvestNeedBn:Math.floor(s5*200)+10,hydrogenHub:s6>0.6,
        gasRoutes:['Pipeline','LNG','Both'][Math.floor(s1*3)],
        oilRoutes:['Tanker','Pipeline','Both'][Math.floor(s2*3)],
        coalSource:['Domestic','Imported','Mixed'][Math.floor(s3*3)],
      };
    });
  },[]);

  const sortedCountries=useMemo(()=>{
    let f=countries;
    if(regionFilter!=='All')f=f.filter(c=>c.region===regionFilter);
    return[...f].sort((a,b)=>sortDir==='desc'?(b[sortCol]||0)-(a[sortCol]||0):(a[sortCol]||0)-(b[sortCol]||0));
  },[countries,regionFilter,sortCol,sortDir]);

  const regions=[...new Set(countries.map(c=>c.region))];

  const avgByRegion=useMemo(()=>{
    const map={};
    countries.forEach(c=>{
      if(!map[c.region])map[c.region]={region:c.region,totalSec:0,totalImport:0,totalRenew:0,count:0};
      map[c.region].totalSec+=c.securityIndex;map[c.region].totalImport+=c.importDependency;map[c.region].totalRenew+=c.renewableShare;map[c.region].count++;
    });
    return Object.values(map).map(r=>({region:r.region,avgSecurity:Math.round(r.totalSec/r.count),avgImportDep:Math.round(r.totalImport/r.count),avgRenewable:Math.round(r.totalRenew/r.count)}));
  },[countries]);

  const quarterlyEnergy=useMemo(()=>{
    const qs=['Q1 2024','Q2 2024','Q3 2024','Q4 2024','Q1 2025','Q2 2025','Q3 2025','Q4 2025','Q1 2026'];
    return qs.map((q,i)=>({
      quarter:q,
      oilPrice:+(sr(i*103+7)*40+60).toFixed(1),
      gasPrice:+(sr(i*107+11)*15+20).toFixed(1),
      renewCapGW:+(sr(i*109+13)*200+800+i*50).toFixed(0),
      lngImportsEU:+(sr(i*113+17)*30+80+i*5).toFixed(0),
      russiaGasEU:+(sr(i*127+19)*10+5-i*0.5).toFixed(0),
      storageLevel:+(sr(i*131+23)*30+55).toFixed(0),
    }));
  },[]);

  const renewTrajectory=useMemo(()=>{
    const years=[2025,2030,2035,2040,2045,2050];
    return years.map((y,i)=>({
      year:y,
      currentPolicy:Math.round(25+i*5+sr(i*137+29)*3),
      iea_nze:Math.round(30+i*12+sr(i*139+31)*2),
      accelerated:Math.round(28+i*14+sr(i*141+37)*2),
    }));
  },[]);

  const investmentNeeds=useMemo(()=>{
    return['Grid Modernization','Renewable Capacity','Storage (Battery+Pump)','Hydrogen Infrastructure','LNG Terminals','Nuclear New Build','Interconnectors','EV Charging'].map((cat,i)=>({
      category:cat,
      investBn:Math.floor(sr(i*143+41)*500)+50,
      gap:Math.floor(sr(i*149+43)*60)+10,
      timeline:`${2025+Math.floor(sr(i*151+47)*5)}-${2035+Math.floor(sr(i*157+53)*10)}`,
    }));
  },[]);

  const handleSort=(col)=>{
    if(sortCol===col)setSortDir(d=>d==='desc'?'asc':'desc');
    else{setSortCol(col);setSortDir('desc');}
  };

  const sty={
    wrap:{fontFamily:T.font,background:T.bg,minHeight:'100vh',padding:'24px'},
    header:{marginBottom:'24px'},
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
    select:{padding:'8px 12px',borderRadius:'6px',border:`1px solid ${T.border}`,fontSize:'13px',fontFamily:T.font,background:T.surface},
    badge:(c)=>({display:'inline-block',padding:'2px 8px',borderRadius:'4px',fontSize:'10px',fontWeight:600,color:'#fff',background:c}),
    mono:{fontFamily:T.mono,fontSize:'11px'},
    row:{display:'flex',gap:'12px',alignItems:'center',flexWrap:'wrap',marginBottom:'12px'},
    progressBar:{height:'6px',borderRadius:'3px',background:T.surfaceH,position:'relative',overflow:'hidden'},
    progressFill:(pct,color)=>({height:'100%',borderRadius:'3px',background:color,width:`${Math.min(Math.abs(pct),100)}%`,transition:'width 0.3s'}),
    chip:(c)=>({display:'inline-flex',alignItems:'center',gap:'4px',padding:'3px 8px',borderRadius:'4px',fontSize:'10px',fontWeight:600,background:`${c}15`,color:c,border:`1px solid ${c}30`}),
    slider:{width:'200px',accentColor:T.navy},
    tag:(active)=>({display:'inline-block',padding:'4px 10px',borderRadius:'12px',fontSize:'11px',fontWeight:500,cursor:'pointer',background:active?T.navy:T.surfaceH,color:active?'#fff':T.textSec,border:`1px solid ${active?T.navy:T.border}`,margin:'2px'}),
  };

  const renderTab0=()=>{
    const topCountries=sortedCountries.slice(0,10);
    return(
      <div>
        <div style={sty.row}>
          {[{l:'Countries Tracked',v:50},{l:'Avg Security Index',v:Math.round(countries.reduce((a,c)=>a+c.securityIndex,0)/50)},{l:'Avg Import Dependency',v:`${Math.round(countries.reduce((a,c)=>a+Math.max(0,c.importDependency),0)/50)}%`},{l:'Avg Renewable Share',v:`${Math.round(countries.reduce((a,c)=>a+c.renewableShare,0)/50)}%`},{l:'Avg Reserve Days',v:Math.round(countries.reduce((a,c)=>a+c.reserveDays,0)/50)},{l:'Avg Grid Reliability',v:`${Math.round(countries.reduce((a,c)=>a+c.gridReliability,0)/50)}%`}].map((k,i)=>(
            <div key={i} style={sty.kpi}><div style={sty.kpiVal}>{k.v}</div><div style={sty.kpiLbl}>{k.l}</div></div>
          ))}
        </div>
        <div style={sty.row}>
          <span style={{fontSize:'12px',color:T.textSec}}>Region:</span>
          {['All',...regions].map(r=>(<span key={r} style={sty.tag(regionFilter===r)} onClick={()=>setRegionFilter(r)}>{r}</span>))}
        </div>
        <div style={sty.grid2}>
          <div style={sty.card}>
            <div style={sty.cardTitle}>Top 10 by Energy Security Index</div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topCountries} layout="vertical"><CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
                <XAxis type="number" domain={[0,100]} tick={{fontSize:10,fill:T.textSec}}/>
                <YAxis dataKey="name" type="category" tick={{fontSize:10,fill:T.textSec}} width={100}/>
                <Tooltip contentStyle={{fontSize:11,borderRadius:8}}/>
                <Bar dataKey="securityIndex" fill={T.navy} radius={[0,4,4,0]} name="Security Index">
                  {topCountries.map((e,i)=>(<Cell key={i} fill={e.securityIndex>70?T.green:e.securityIndex>50?T.amber:T.red}/>))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={sty.card}>
            <div style={sty.cardTitle}>Regional Averages</div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={avgByRegion}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
                <XAxis dataKey="region" tick={{fontSize:9,fill:T.textSec}} angle={-20} textAnchor="end" height={50}/>
                <YAxis tick={{fontSize:10,fill:T.textSec}}/>
                <Tooltip contentStyle={{fontSize:11,borderRadius:8}}/>
                <Bar dataKey="avgSecurity" fill={T.navy} name="Avg Security" radius={[4,4,0,0]}/>
                <Bar dataKey="avgRenewable" fill={T.sage} name="Avg Renewable %" radius={[4,4,0,0]}/>
                <Bar dataKey="avgImportDep" fill={T.red} name="Avg Import Dep %" radius={[4,4,0,0]}/>
                <Legend wrapperStyle={{fontSize:11}}/>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div style={sty.card}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'12px'}}>
            <div style={sty.cardTitle}>Energy Security Rankings — {sortedCountries.length} Countries</div>
          </div>
          <div style={{maxHeight:'500px',overflowY:'auto'}}>
            <table style={sty.table}>
              <thead><tr>
                <th style={sty.th}>#</th>
                <th style={sty.th} onClick={()=>handleSort('name')}>Country</th>
                <th style={sty.th}>Region</th>
                <th style={sty.th} onClick={()=>handleSort('securityIndex')}>Security Index</th>
                <th style={sty.th} onClick={()=>handleSort('importDependency')}>Import Dep %</th>
                <th style={sty.th} onClick={()=>handleSort('renewableShare')}>Renewable %</th>
                <th style={sty.th} onClick={()=>handleSort('reserveDays')}>Reserve Days</th>
                <th style={sty.th} onClick={()=>handleSort('gridReliability')}>Grid Rel %</th>
                <th style={sty.th} onClick={()=>handleSort('hhiImports')}>HHI (Imports)</th>
                <th style={sty.th}>Fuel Diversity</th>
              </tr></thead>
              <tbody>{sortedCountries.map((c,i)=>(
                <tr key={i} style={{background:selCountry===c.name?`${T.gold}15`:i%2===0?'transparent':T.surfaceH,cursor:'pointer'}} onClick={()=>setSelCountry(selCountry===c.name?null:c.name)}>
                  <td style={{...sty.td,...sty.mono}}>{i+1}</td>
                  <td style={{...sty.td,fontWeight:600}}>{c.name}</td>
                  <td style={sty.td}>{c.region}</td>
                  <td style={sty.td}><div style={{display:'flex',alignItems:'center',gap:'4px'}}><div style={{...sty.progressBar,width:'50px'}}><div style={sty.progressFill(c.securityIndex,c.securityIndex>70?T.green:c.securityIndex>50?T.amber:T.red)}/></div><span style={sty.mono}>{c.securityIndex}</span></div></td>
                  <td style={{...sty.td,...sty.mono,color:c.importDependency>60?T.red:c.importDependency<0?T.green:T.text}}>{c.importDependency}%</td>
                  <td style={{...sty.td,...sty.mono}}>{c.renewableShare}%</td>
                  <td style={{...sty.td,...sty.mono}}>{c.reserveDays}</td>
                  <td style={{...sty.td,...sty.mono}}>{c.gridReliability}%</td>
                  <td style={{...sty.td,...sty.mono,color:c.hhiImports>4000?T.red:c.hhiImports>2500?T.amber:T.green}}>{c.hhiImports}</td>
                  <td style={{...sty.td,...sty.mono}}>{c.fuelDiversity}</td>
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
              <div style={sty.cardTitle}>{selCountry} — Energy Security Profile</div>
              <div style={sty.row}>
                {[{l:'Security Index',v:cd.securityIndex},{l:'Import Dep',v:`${cd.importDependency}%`},{l:'Renewable',v:`${cd.renewableShare}%`},{l:'Reserve Days',v:cd.reserveDays},{l:'Grid',v:`${cd.gridReliability}%`},{l:'Nuclear',v:`${cd.nuclearShare}%`},{l:'LNG Cap',v:`${cd.lngTerminalCap} bcm`},{l:'Russia Gas',v:`${cd.gasFromRussia}%`}].map((k,i)=>(
                  <div key={i} style={sty.kpi}><div style={sty.kpiVal}>{k.v}</div><div style={sty.kpiLbl}>{k.l}</div></div>
                ))}
              </div>
              <div style={sty.grid3}>
                <div style={{padding:'8px',background:T.surfaceH,borderRadius:'8px'}}><div style={{fontSize:'11px',color:T.textMut}}>Gas Routes</div><div style={{fontSize:'13px',fontWeight:600}}>{cd.gasRoutes}</div></div>
                <div style={{padding:'8px',background:T.surfaceH,borderRadius:'8px'}}><div style={{fontSize:'11px',color:T.textMut}}>Oil Routes</div><div style={{fontSize:'13px',fontWeight:600}}>{cd.oilRoutes}</div></div>
                <div style={{padding:'8px',background:T.surfaceH,borderRadius:'8px'}}><div style={{fontSize:'11px',color:T.textMut}}>Coal Source</div><div style={{fontSize:'13px',fontWeight:600}}>{cd.coalSource}</div></div>
              </div>
            </div>
          );
        })()}
      </div>
    );
  };

  const renderTab1=()=>(
    <div>
      <div style={sty.row}>
        {[{l:'EU Russia Gas (pre-war)',v:'40%'},{l:'EU Russia Gas (current)',v:'~8%'},{l:'OPEC+ Market Share',v:'~40%'},{l:'Global LNG Trade',v:'542 bcm'},{l:'Pipeline Disrupted',v:'88.5 bcm'},{l:'Chokepoints Tracked',v:CHOKEPOINTS.length}].map((k,i)=>(
          <div key={i} style={sty.kpi}><div style={sty.kpiVal}>{k.v}</div><div style={sty.kpiLbl}>{k.l}</div></div>
        ))}
      </div>
      <div style={sty.card}>
        <div style={sty.cardTitle}>Chokepoint Analysis — Global Energy Transit Points</div>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={CHOKEPOINTS}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
            <XAxis dataKey="name" tick={{fontSize:9,fill:T.textSec}} angle={-25} textAnchor="end" height={60}/>
            <YAxis tick={{fontSize:10,fill:T.textSec}}/>
            <Tooltip contentStyle={{fontSize:11,borderRadius:8}}/>
            <Bar dataKey="oil" fill={T.navy} name="Oil (mbd)" radius={[4,4,0,0]}/>
            <Bar dataKey="lng" fill={T.gold} name="LNG (%)" radius={[4,4,0,0]}/>
            <Legend wrapperStyle={{fontSize:11}}/>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div style={sty.grid2}>
        <div style={sty.card}>
          <div style={sty.cardTitle}>Chokepoint Details</div>
          <div style={{maxHeight:'350px',overflowY:'auto'}}>
            <table style={sty.table}>
              <thead><tr><th style={sty.th}>Chokepoint</th><th style={sty.th}>Oil mbd</th><th style={sty.th}>LNG %</th><th style={sty.th}>Risk</th><th style={sty.th}>Alternative</th></tr></thead>
              <tbody>{CHOKEPOINTS.map((cp,i)=>(
                <tr key={i}><td style={{...sty.td,fontWeight:600}}>{cp.name}</td><td style={{...sty.td,...sty.mono}}>{cp.oil}</td><td style={{...sty.td,...sty.mono}}>{cp.lng}%</td>
                  <td style={sty.td}><span style={sty.badge(cp.risk==='Critical'||cp.risk==='Critical (Houthi)'?T.red:cp.risk==='High'?T.amber:T.sage)}>{cp.risk}</span></td>
                  <td style={{...sty.td,fontSize:'11px'}}>{cp.alternativeRoute}</td></tr>
              ))}</tbody>
            </table>
          </div>
        </div>
        <div style={sty.card}>
          <div style={sty.cardTitle}>Key Pipeline Routes</div>
          <div style={{maxHeight:'350px',overflowY:'auto'}}>
            <table style={sty.table}>
              <thead><tr><th style={sty.th}>Pipeline</th><th style={sty.th}>From</th><th style={sty.th}>To</th><th style={sty.th}>Cap (bcm)</th><th style={sty.th}>Status</th><th style={sty.th}>Util %</th></tr></thead>
              <tbody>{PIPELINE_ROUTES.map((p,i)=>(
                <tr key={i}><td style={{...sty.td,fontWeight:600,fontSize:'11px'}}>{p.name}</td><td style={sty.td}>{p.from}</td><td style={sty.td}>{p.to}</td>
                  <td style={{...sty.td,...sty.mono}}>{p.capacity}</td>
                  <td style={sty.td}><span style={sty.badge(p.status==='Destroyed'?T.red:p.status==='Reduced'?T.amber:T.green)}>{p.status}</span></td>
                  <td style={sty.td}><div style={{display:'flex',alignItems:'center',gap:'4px'}}><div style={{...sty.progressBar,width:'40px'}}><div style={sty.progressFill(p.utilization,p.utilization>80?T.green:p.utilization>40?T.amber:T.red)}/></div><span style={sty.mono}>{p.utilization}%</span></div></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </div>
      </div>
      <div style={sty.card}>
        <div style={sty.cardTitle}>EU Energy Market Quarterly Trends</div>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={quarterlyEnergy}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
            <XAxis dataKey="quarter" tick={{fontSize:10,fill:T.textSec}} angle={-30} textAnchor="end" height={50}/>
            <YAxis tick={{fontSize:10,fill:T.textSec}}/>
            <Tooltip contentStyle={{fontSize:11,borderRadius:8}}/>
            <Line type="monotone" dataKey="oilPrice" stroke={T.navy} strokeWidth={2} name="Oil $/bbl"/>
            <Line type="monotone" dataKey="gasPrice" stroke={T.gold} strokeWidth={2} name="Gas $/MMBtu"/>
            <Line type="monotone" dataKey="russiaGasEU" stroke={T.red} strokeWidth={2} name="Russia Gas EU %"/>
            <Line type="monotone" dataKey="storageLevel" stroke={T.sage} strokeWidth={2} name="Storage Level %"/>
            <Legend wrapperStyle={{fontSize:11}}/>
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div style={sty.card}>
        <div style={sty.cardTitle}>Country Russia Gas Dependency (Europe)</div>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={countries.filter(c=>c.region==='Europe').sort((a,b)=>b.gasFromRussia-a.gasFromRussia).slice(0,15)}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
            <XAxis dataKey="name" tick={{fontSize:9,fill:T.textSec}} angle={-35} textAnchor="end" height={60}/>
            <YAxis tick={{fontSize:10,fill:T.textSec}} label={{value:'%',position:'insideTopLeft',fontSize:10}}/>
            <Tooltip contentStyle={{fontSize:11,borderRadius:8}}/>
            <Bar dataKey="gasFromRussia" name="Russia Gas %" radius={[4,4,0,0]}>
              {countries.filter(c=>c.region==='Europe').sort((a,b)=>b.gasFromRussia-a.gasFromRussia).slice(0,15).map((e,i)=>(<Cell key={i} fill={e.gasFromRussia>30?T.red:e.gasFromRussia>15?T.amber:T.green}/>))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );

  const renderTab2=()=>(
    <div>
      <div style={sty.row}>
        <span style={{fontSize:'12px',color:T.textSec}}>Scenario:</span>
        {['Current','IEA NZE','Accelerated'].map(s=>(<span key={s} style={sty.tag(scenarioToggle===s)} onClick={()=>setScenarioToggle(s)}>{s}</span>))}
        <span style={{fontSize:'12px',color:T.textSec,marginLeft:'20px'}}>Target Year:</span>
        <input type="range" min={2025} max={2050} step={5} value={yearSlider} onChange={e=>setYearSlider(+e.target.value)} style={sty.slider}/>
        <span style={sty.mono}>{yearSlider}</span>
      </div>
      <div style={sty.row}>
        {[{l:'Avg Renewable Potential',v:`${Math.round(countries.reduce((a,c)=>a+c.renewPotential,0)/50)}%`},{l:'Avg Current Deployment',v:`${Math.round(countries.reduce((a,c)=>a+c.currentDeployment,0)/50)}%`},{l:'Deployment Gap',v:`${Math.round(countries.reduce((a,c)=>a+(c.renewPotential-c.currentDeployment),0)/50)}pp`},{l:'Nuclear Renaissance',v:`${countries.filter(c=>c.nuclearShare>15).length} countries`},{l:'Avg Critical Mineral Dep',v:`${Math.round(countries.reduce((a,c)=>a+c.criticalMineralDep,0)/50)}%`},{l:'Independence by '+yearSlider,v:`${countries.filter(c=>c.energyIndependenceYear<=yearSlider).length}`}].map((k,i)=>(
          <div key={i} style={sty.kpi}><div style={sty.kpiVal}>{k.v}</div><div style={sty.kpiLbl}>{k.l}</div></div>
        ))}
      </div>
      <div style={sty.card}>
        <div style={sty.cardTitle}>Renewable Self-Sufficiency Trajectory</div>
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={renewTrajectory}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
            <XAxis dataKey="year" tick={{fontSize:11,fill:T.textSec}}/>
            <YAxis tick={{fontSize:10,fill:T.textSec}} label={{value:'%',position:'insideTopLeft',fontSize:10}}/>
            <Tooltip contentStyle={{fontSize:11,borderRadius:8}}/>
            <Area type="monotone" dataKey="currentPolicy" stroke={T.textMut} fill={T.textMut} fillOpacity={0.1} name="Current Policy"/>
            <Area type="monotone" dataKey="iea_nze" stroke={T.sage} fill={T.sage} fillOpacity={0.15} name="IEA NZE"/>
            <Area type="monotone" dataKey="accelerated" stroke={T.green} fill={T.green} fillOpacity={0.15} name="Accelerated"/>
            <Legend wrapperStyle={{fontSize:11}}/>
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div style={sty.grid2}>
        <div style={sty.card}>
          <div style={sty.cardTitle}>Renewable Potential vs Deployment (Top 20)</div>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={countries.sort((a,b)=>(b.renewPotential-b.currentDeployment)-(a.renewPotential-a.currentDeployment)).slice(0,20)} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
              <XAxis type="number" tick={{fontSize:10,fill:T.textSec}}/>
              <YAxis dataKey="name" type="category" tick={{fontSize:9,fill:T.textSec}} width={90}/>
              <Tooltip contentStyle={{fontSize:11,borderRadius:8}}/>
              <Bar dataKey="renewPotential" fill={T.sage} name="Potential %" radius={[0,4,4,0]}/>
              <Bar dataKey="currentDeployment" fill={T.gold} name="Current %" radius={[0,4,4,0]}/>
              <Legend wrapperStyle={{fontSize:11}}/>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={sty.card}>
          <div style={sty.cardTitle}>Critical Mineral Import Dependency for Renewables</div>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={countries.sort((a,b)=>b.criticalMineralDep-a.criticalMineralDep).slice(0,20)} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
              <XAxis type="number" domain={[0,100]} tick={{fontSize:10,fill:T.textSec}}/>
              <YAxis dataKey="name" type="category" tick={{fontSize:9,fill:T.textSec}} width={90}/>
              <Tooltip contentStyle={{fontSize:11,borderRadius:8}}/>
              <Bar dataKey="criticalMineralDep" name="Mineral Dep %" radius={[0,4,4,0]}>
                {countries.sort((a,b)=>b.criticalMineralDep-a.criticalMineralDep).slice(0,20).map((e,i)=>(<Cell key={i} fill={e.criticalMineralDep>70?T.red:e.criticalMineralDep>40?T.amber:T.green}/>))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div style={sty.card}>
        <div style={sty.cardTitle}>Nuclear Renaissance Tracker</div>
        <table style={sty.table}>
          <thead><tr><th style={sty.th}>Country</th><th style={sty.th}>Nuclear Share %</th><th style={sty.th}>Policy Status</th><th style={sty.th}>New Build Plans</th></tr></thead>
          <tbody>{countries.filter(c=>c.nuclearShare>10).sort((a,b)=>b.nuclearShare-a.nuclearShare).map((c,i)=>(
            <tr key={i}><td style={{...sty.td,fontWeight:600}}>{c.name}</td><td style={{...sty.td,...sty.mono}}>{c.nuclearShare}%</td>
              <td style={sty.td}><span style={sty.badge(c.nuclearShare>25?T.green:T.amber)}>{c.nuclearShare>25?'Expanding':'Maintaining'}</span></td>
              <td style={{...sty.td,fontSize:'11px'}}>{c.nuclearShare>25?'SMR + Large':'Life extension'}</td></tr>
          ))}</tbody>
        </table>
      </div>
    </div>
  );

  const renderTab3=()=>(
    <div>
      <div style={sty.row}>
        {[{l:'Avg Sov Spread Premium',v:`${Math.round(countries.reduce((a,c)=>a+c.sovSpreadPremium,0)/50)} bps`},{l:'Avg Utility Exposure',v:`${Math.round(countries.reduce((a,c)=>a+c.utilityExposure,0)/50)}%`},{l:'Total Grid Invest Need',v:`$${Math.round(countries.reduce((a,c)=>a+c.gridInvestNeedBn,0))}B`},{l:'Hydrogen Hubs',v:countries.filter(c=>c.hydrogenHub).length},{l:'LNG vs Pipeline',v:`${countries.filter(c=>c.gasRoutes==='LNG').length} LNG-only`}].map((k,i)=>(
          <div key={i} style={sty.kpi}><div style={sty.kpiVal}>{k.v}</div><div style={sty.kpiLbl}>{k.l}</div></div>
        ))}
      </div>
      <div style={sty.card}>
        <div style={sty.cardTitle}>Infrastructure Investment Needs by Category</div>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={investmentNeeds}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
            <XAxis dataKey="category" tick={{fontSize:9,fill:T.textSec}} angle={-25} textAnchor="end" height={60}/>
            <YAxis tick={{fontSize:10,fill:T.textSec}}/>
            <Tooltip contentStyle={{fontSize:11,borderRadius:8}}/>
            <Bar dataKey="investBn" fill={T.navy} name="Investment $Bn" radius={[4,4,0,0]}/>
            <Bar dataKey="gap" fill={T.red} name="Funding Gap %" radius={[4,4,0,0]}/>
            <Legend wrapperStyle={{fontSize:11}}/>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div style={sty.grid2}>
        <div style={sty.card}>
          <div style={sty.cardTitle}>Sovereign Spread Energy Premium (Top 20)</div>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={countries.sort((a,b)=>b.sovSpreadPremium-a.sovSpreadPremium).slice(0,20)} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
              <XAxis type="number" tick={{fontSize:10,fill:T.textSec}}/>
              <YAxis dataKey="name" type="category" tick={{fontSize:9,fill:T.textSec}} width={90}/>
              <Tooltip formatter={v=>`${v} bps`} contentStyle={{fontSize:11,borderRadius:8}}/>
              <Bar dataKey="sovSpreadPremium" name="Premium bps" radius={[0,4,4,0]}>
                {countries.sort((a,b)=>b.sovSpreadPremium-a.sovSpreadPremium).slice(0,20).map((e,i)=>(<Cell key={i} fill={e.sovSpreadPremium>100?T.red:e.sovSpreadPremium>50?T.amber:T.green}/>))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={sty.card}>
          <div style={sty.cardTitle}>Strategic Hydrogen Hubs</div>
          <table style={sty.table}>
            <thead><tr><th style={sty.th}>Country</th><th style={sty.th}>Hub Status</th><th style={sty.th}>Renewable %</th><th style={sty.th}>Grid Invest $Bn</th></tr></thead>
            <tbody>{countries.filter(c=>c.hydrogenHub).sort((a,b)=>b.gridInvestNeedBn-a.gridInvestNeedBn).map((c,i)=>(
              <tr key={i}><td style={{...sty.td,fontWeight:600}}>{c.name}</td>
                <td style={sty.td}><span style={sty.badge(T.green)}>Active Hub</span></td>
                <td style={{...sty.td,...sty.mono}}>{c.renewableShare}%</td>
                <td style={{...sty.td,...sty.mono}}>${c.gridInvestNeedBn}B</td></tr>
            ))}</tbody>
          </table>
        </div>
      </div>
      <div style={sty.card}>
        <div style={sty.cardTitle}>Quarterly Renewable Capacity & LNG Imports</div>
        <ResponsiveContainer width="100%" height={250}>
          <AreaChart data={quarterlyEnergy}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
            <XAxis dataKey="quarter" tick={{fontSize:10,fill:T.textSec}} angle={-30} textAnchor="end" height={50}/>
            <YAxis tick={{fontSize:10,fill:T.textSec}}/>
            <Tooltip contentStyle={{fontSize:11,borderRadius:8}}/>
            <Area type="monotone" dataKey="renewCapGW" stroke={T.sage} fill={T.sage} fillOpacity={0.15} name="Renewable Cap GW"/>
            <Area type="monotone" dataKey="lngImportsEU" stroke={T.navy} fill={T.navy} fillOpacity={0.1} name="EU LNG Imports bcm"/>
            <Legend wrapperStyle={{fontSize:11}}/>
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div style={sty.card}>
        <div style={sty.cardTitle}>LNG vs Pipeline Economics</div>
        <div style={sty.grid3}>
          {[{metric:'LNG Spot Price',value:'$12.4/MMBtu',trend:'down',desc:'Easing due to new US/Qatar capacity'},{metric:'Pipeline Gas (EU avg)',value:'$9.8/MMBtu',trend:'stable',desc:'TAP, Baltic Pipe, Norway routes'},{metric:'LNG Premium',value:'+26%',trend:'narrowing',desc:'Converging as LNG terminal capacity grows'},{metric:'New LNG FID 2026',value:'42 mtpa',trend:'up',desc:'US Gulf, Qatar NFE, Mozambique'},{metric:'EU Regas Capacity',value:'285 bcm/yr',trend:'up',desc:'35% increase since 2022'},{metric:'Long-term Contract %',value:'62%',trend:'up',desc:'Shift from spot to 10-15yr contracts'}].map((m,i)=>(
            <div key={i} style={{padding:'12px',background:T.surfaceH,borderRadius:'8px'}}>
              <div style={{fontSize:'11px',color:T.textMut}}>{m.metric}</div>
              <div style={{fontSize:'18px',fontWeight:700,color:T.navy,fontFamily:T.mono}}>{m.value}</div>
              <div style={{fontSize:'10px',color:m.trend==='up'?T.green:m.trend==='down'?T.red:T.amber,fontWeight:600}}>{m.trend.toUpperCase()}</div>
              <div style={{fontSize:'10px',color:T.textSec,marginTop:'2px'}}>{m.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return(
    <div style={sty.wrap}>
      <div style={sty.header}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
          <div><h1 style={sty.title}>Energy Security & Transition</h1><p style={sty.subtitle}>EP-AV2 // Energy security indices, fossil fuel dependency, renewable self-sufficiency // {COUNTRIES_50.length} countries, 12 quarters</p></div>
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
