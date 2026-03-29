import React,{useState,useMemo} from 'react';
import {BarChart,Bar,XAxis,YAxis,CartesianGrid,Tooltip,ResponsiveContainer,AreaChart,Area,Cell,Legend,PieChart,Pie,ScatterChart,Scatter} from 'recharts';
import { CARBON_PRICES } from '../../../data/referenceData';

const T={bg:'#f6f4f0',surface:'#ffffff',surfaceH:'#f0ede7',border:'#e5e0d8',borderL:'#d5cfc5',navy:'#1b3a5c',navyL:'#2c5a8c',gold:'#c5a96a',goldL:'#d4be8a',sage:'#5a8a6a',sageL:'#7ba67d',teal:'#5a8a6a',text:'#1b3a5c',textSec:'#5c6b7e',textMut:'#9aa3ae',red:'#dc2626',green:'#16a34a',amber:'#d97706',font:"'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"};
const sr=(s)=>{let x=Math.sin(s+1)*10000;return x-Math.floor(x);};

const tabs=['CBAM Compliance','Global Carbon Border','Embedded Emissions','Portfolio Trade Risk'];
const COLORS=[T.navy,T.gold,T.sage,T.red,T.amber,T.navyL,T.goldL,T.sageL,'#8b5cf6','#06b6d4'];

const CBAM_SECTORS=['Cement','Iron & Steel','Aluminium','Fertilisers','Electricity','Hydrogen'];
const CBAM_IMPORTERS=[];
const IMP_NAMES=['HeidelbergCement','LafargeHolcim','CRH Group','Buzzi Unicem','Vicat SA','ArcelorMittal','Thyssenkrupp','SSAB','voestalpine','Salzgitter',
  'Tata Steel EU','JSW Steel EU','POSCO EU','Nippon Steel EU','JFE EU Ops','Norsk Hydro','Alcoa EU','Hindalco EU','Rusal EU','Rio Tinto Alcan',
  'Yara International','CF Industries EU','OCI NV','Nutrien EU','EuroChem','PhosAgro EU','Mosaic EU','ICL Group','K+S AG','Borealis',
  'EDF Trading','Vattenfall','Fortum','Verbund','Statkraft','Axpo','Enel Trading','Iberdrola EU','RWE Trading','Uniper',
  'Linde Green H2','Air Liquide H2','Nel Hydrogen','ITM Power','Plug Power EU','Hyzon Motors EU','Ballard EU','Ceres Power','SFC Energy','McPhy',
  'CEMEX EU','Dangote EU','Eagle Materials','Summit Materials','US Concrete','Gerdau EU','Nucor EU Import','Ternium','Tenaris','Acerinox',
  'China Baowu EU','Maanshan EU','Ansteel EU','Hesteel EU','SAIL EU Import','Emirates Steel EU','Saudi Steel EU','Qatar Steel','Oman Cement','Iran Steel',
  'Turkish Steel Co','Tosyali EU','Colakoglu EU','Kardemir EU','Erdemir EU','Bangladesh Steel','Vietnam Steel','Thai Steel','Malaysia Steel','Indonesia Steel',
  'India Cement EU','UltraTech EU','Shree Cement EU','ACC EU Import','Ambuja EU','Pakistan Cement','Egypt Cement','Algeria Cement','Morocco Cement','Tunisia Cement',
  'Brazil Steel EU','Colombia Steel','Argentina Steel','Peru Metal','Chile Copper EU','South Africa Steel','Nigeria Steel','Kenya Steel','Ghana Metal','Senegal Cement'];

for(let i=0;i<100;i++){
  const s1=sr(i*19+7);const s2=sr(i*23+11);const s3=sr(i*29+13);const s4=sr(i*31+17);const s5=sr(i*37+19);
  CBAM_IMPORTERS.push({
    id:i+1,name:IMP_NAMES[i],
    sector:CBAM_SECTORS[Math.floor(s1*6)],
    country:['Turkey','China','India','Russia','Ukraine','Egypt','Morocco','Brazil','South Korea','Vietnam','Indonesia','Thailand','Pakistan','Algeria','Tunisia','USA','UK','Japan','Saudi Arabia','UAE'][Math.floor(s2*20)],
    importVolumeTons:Math.floor(s3*500000)+10000,
    embeddedEmissions:+(s4*2.5+0.3).toFixed(2),
    cbamCostMn:+(s5*50+0.5).toFixed(1),
    defaultValue:+(s1*3+0.5).toFixed(2),
    actualEmissions:+(s2*2.5+0.2).toFixed(2),
    savingsVsDefault:Math.floor(s3*40),
    complianceStatus:['Full','Partial','Transitional','Non-Compliant'][Math.floor(s4*4)],
    reportingGap:['None','Minor','Moderate','Significant'][Math.floor(s5*4)],
    costPassThrough:Math.floor(s1*80)+10,
    competitiveAdv:s2>0.5?'Low-Carbon Leader':'Standard',
  });
}

const COUNTRIES_40=['EU','UK','USA','Canada','Japan','South Korea','China','India','Turkey','Russia',
  'Brazil','Mexico','Indonesia','Vietnam','Thailand','South Africa','Nigeria','Egypt','Morocco','Saudi Arabia',
  'UAE','Australia','New Zealand','Switzerland','Norway','Singapore','Chile','Colombia','Argentina','Peru',
  'Pakistan','Bangladesh','Philippines','Malaysia','Taiwan','Israel','Kenya','Ghana','Tunisia','Algeria'];

const COUNTRY_POLICIES=COUNTRIES_40.map((c,i)=>{
  const s1=sr(i*41+7);const s2=sr(i*43+11);const s3=sr(i*47+13);const s4=sr(i*53+17);
  return{
    country:c,
    carbonBorderMech:i===0?'EU CBAM (Active)':i===1?'UK CBAM 2027':i===2?'US Potential (CCA)':i===3?'Canada CBAM Study':s1<0.2?'Proposed':'None',
    carbonPrice:Math.floor(s2*120),etsActive:s3<0.4,
    wtoCompatibility:['Compatible','Under Review','Challenged','N/A'][Math.floor(s4*4)],
    devCountryExempt:i>15&&s1>0.3,
    tradeExposure:Math.floor(s1*100),
    embeddedCO2Mn:Math.floor(s2*500)+10,
    virtualCarbonBalance:Math.floor(s3*200)-100,
    carbonLeakageRisk:['Low','Medium','High','Critical'][Math.floor(s4*4)],
    reshoreIncentive:Math.floor(s1*50),
    climateClub:i<6||s2<0.2,
  };
});

const TRADE_FLOWS=[];
for(let i=0;i<30;i++){
  const s1=sr(i*57+7);const s2=sr(i*59+11);const s3=sr(i*61+13);
  const from=COUNTRIES_40[Math.floor(s1*20)+10];
  const to=COUNTRIES_40[Math.floor(s2*5)];
  TRADE_FLOWS.push({
    from,to,
    sector:CBAM_SECTORS[Math.floor(s3*6)],
    tradeBn:+(s1*20+0.5).toFixed(1),
    carbonIntensity:+(s2*3+0.3).toFixed(2),
    embeddedMtCO2:+(s3*50+1).toFixed(1),
    cbamLiability:+(s1*s2*100).toFixed(1),
  });
}

export default function TradeCarbonPolicyPage(){
  const [tab,setTab]=useState(0);
  const [carbonPrice,setCarbonPrice]=useState(80);
  const [selSector,setSelSector]=useState('All');
  const [selCountry,setSelCountry]=useState(null);
  const [searchTerm,setSearchTerm]=useState('');
  const [sortCol,setSortCol]=useState('cbamCostMn');
  const [sortDir,setSortDir]=useState('desc');
  const [compPage,setCompPage]=useState(0);

  const sectorSummary=useMemo(()=>{
    return CBAM_SECTORS.map(s=>{
      const imps=CBAM_IMPORTERS.filter(c=>c.sector===s);
      return{
        sector:s,count:imps.length,
        totalVolume:imps.reduce((a,c)=>a+c.importVolumeTons,0),
        avgEmissions:+(imps.reduce((a,c)=>a+c.embeddedEmissions,0)/Math.max(imps.length,1)).toFixed(2),
        totalCbamMn:+imps.reduce((a,c)=>a+c.cbamCostMn,0).toFixed(1),
        adjustedCbamMn:+imps.reduce((a,c)=>a+c.cbamCostMn*(carbonPrice/80),0).toFixed(1),
      };
    });
  },[carbonPrice]);

  const filteredImporters=useMemo(()=>{
    let f=CBAM_IMPORTERS.map(c=>({...c,adjustedCost:+(c.cbamCostMn*(carbonPrice/80)).toFixed(1)}));
    if(selSector!=='All')f=f.filter(c=>c.sector===selSector);
    if(searchTerm)f=f.filter(c=>c.name.toLowerCase().includes(searchTerm.toLowerCase()));
    return[...f].sort((a,b)=>sortDir==='desc'?(b[sortCol]||0)-(a[sortCol]||0):(a[sortCol]||0)-(b[sortCol]||0));
  },[selSector,searchTerm,sortCol,sortDir,carbonPrice]);

  const countryPolicySummary=useMemo(()=>{
    return[{name:'Active CBAM',value:COUNTRY_POLICIES.filter(c=>c.carbonBorderMech.includes('Active')).length},
      {name:'Planned/Proposed',value:COUNTRY_POLICIES.filter(c=>c.carbonBorderMech.includes('2027')||c.carbonBorderMech.includes('Potential')||c.carbonBorderMech==='Proposed').length},
      {name:'Climate Club',value:COUNTRY_POLICIES.filter(c=>c.climateClub).length},
      {name:'ETS Active',value:COUNTRY_POLICIES.filter(c=>c.etsActive).length}];
  },[]);

  const virtualCarbonBalance=useMemo(()=>{
    return COUNTRY_POLICIES.sort((a,b)=>b.virtualCarbonBalance-a.virtualCarbonBalance).slice(0,20).map(c=>({
      country:c.country,balance:c.virtualCarbonBalance,embeddedMn:c.embeddedCO2Mn
    }));
  },[]);

  const scatterData=useMemo(()=>{
    return TRADE_FLOWS.map(f=>({x:f.tradeBn,y:f.carbonIntensity,z:f.embeddedMtCO2,name:`${f.from}→${f.to} (${f.sector})`}));
  },[]);

  const PAGE_SIZE=15;
  const pagedImporters=filteredImporters.slice(compPage*PAGE_SIZE,(compPage+1)*PAGE_SIZE);
  const totalPages=Math.ceil(filteredImporters.length/PAGE_SIZE);
  const handleSort=(col)=>{if(sortCol===col)setSortDir(d=>d==='desc'?'asc':'desc');else{setSortCol(col);setSortDir('desc');}};

  const exportCSV=()=>{
    const headers=['Company','Sector','Country','Volume Tons','Emissions tCO2/t','CBAM Cost $M','Default Value','Actual Emissions','Compliance','Reporting Gap','Cost Pass-Through %','Competitive'];
    const rows=filteredImporters.map(c=>[c.name,c.sector,c.country,c.importVolumeTons,c.embeddedEmissions,c.adjustedCost,c.defaultValue,c.actualEmissions,c.complianceStatus,c.reportingGap,c.costPassThrough,c.competitiveAdv].join(','));
    const csv=[headers.join(','),...rows].join('\n');
    const blob=new Blob([csv],{type:'text/csv'});const url=URL.createObjectURL(blob);
    const a=document.createElement('a');a.href=url;a.download='cbam_trade_risk.csv';a.click();URL.revokeObjectURL(url);
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
    input:{padding:'8px 12px',borderRadius:'6px',border:`1px solid ${T.border}`,fontSize:'13px',fontFamily:T.font,outline:'none',width:'220px'},
    select:{padding:'8px 12px',borderRadius:'6px',border:`1px solid ${T.border}`,fontSize:'13px',fontFamily:T.font,background:T.surface},
    btn:{padding:'8px 16px',borderRadius:'6px',border:'none',cursor:'pointer',fontSize:'12px',fontWeight:600,fontFamily:T.font},
    slider:{width:'200px',accentColor:T.navy},
    tag:(active)=>({display:'inline-block',padding:'4px 10px',borderRadius:'12px',fontSize:'11px',fontWeight:500,cursor:'pointer',background:active?T.navy:T.surfaceH,color:active?'#fff':T.textSec,border:`1px solid ${active?T.navy:T.border}`,margin:'2px'}),
    progressBar:{height:'6px',borderRadius:'3px',background:T.surfaceH,position:'relative',overflow:'hidden'},
    progressFill:(pct,color)=>({height:'100%',borderRadius:'3px',background:color,width:`${Math.min(Math.abs(pct),100)}%`}),
  };

  const renderTab0=()=>(
    <div>
      <div style={sty.row}>
        <span style={{fontSize:'13px',fontWeight:600,color:T.navy}}>Carbon Price Slider:</span>
        <input type="range" min={20} max={200} value={carbonPrice} onChange={e=>setCarbonPrice(+e.target.value)} style={sty.slider}/>
        <span style={{...sty.mono,fontSize:'14px',fontWeight:700,color:T.gold}}>{'\u20AC'}{carbonPrice}/tCO2</span>
      </div>
      <div style={sty.row}>
        {[{l:'Importers Screened',v:100},{l:'CBAM Sectors',v:6},{l:'Total CBAM Cost',v:`\u20AC${sectorSummary.reduce((a,s)=>a+s.adjustedCbamMn,0).toFixed(0)}M`},{l:'Avg Embedded Emissions',v:`${(CBAM_IMPORTERS.reduce((a,c)=>a+c.embeddedEmissions,0)/100).toFixed(2)} tCO2/t`},{l:'Full Compliance',v:`${CBAM_IMPORTERS.filter(c=>c.complianceStatus==='Full').length}%`},{l:'Transitional Period',v:'2024-2025'}].map((k,i)=>(
          <div key={i} style={sty.kpi}><div style={sty.kpiVal}>{k.v}</div><div style={sty.kpiLbl}>{k.l}</div></div>
        ))}
      </div>
      <div style={sty.grid2}>
        <div style={sty.card}>
          <div style={sty.cardTitle}>CBAM Cost by Sector (at {'\u20AC'}{carbonPrice}/tCO2)</div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={sectorSummary}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
              <XAxis dataKey="sector" tick={{fontSize:10,fill:T.textSec}}/>
              <YAxis tick={{fontSize:10,fill:T.textSec}}/>
              <Tooltip formatter={v=>`\u20AC${v}M`} contentStyle={{fontSize:11,borderRadius:8}}/>
              <Bar dataKey="adjustedCbamMn" name="CBAM Cost \u20ACM" radius={[4,4,0,0]}>
                {sectorSummary.map((e,i)=>(<Cell key={i} fill={COLORS[i]}/>))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={sty.card}>
          <div style={sty.cardTitle}>Avg Emissions Intensity by Sector</div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={sectorSummary}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
              <XAxis dataKey="sector" tick={{fontSize:10,fill:T.textSec}}/>
              <YAxis tick={{fontSize:10,fill:T.textSec}}/>
              <Tooltip formatter={v=>`${v} tCO2/t`} contentStyle={{fontSize:11,borderRadius:8}}/>
              <Bar dataKey="avgEmissions" name="Avg tCO2/t" radius={[4,4,0,0]} fill={T.red}/>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div style={sty.card}>
        <div style={sty.cardTitle}>CBAM Sector Summary</div>
        <table style={sty.table}>
          <thead><tr><th style={sty.th}>Sector</th><th style={sty.th}>Importers</th><th style={sty.th}>Volume (tons)</th><th style={sty.th}>Avg Emissions</th><th style={sty.th}>CBAM Cost \u20ACM</th></tr></thead>
          <tbody>{sectorSummary.map((s,i)=>(
            <tr key={i} style={{cursor:'pointer',background:selSector===s.sector?`${T.gold}15`:'transparent'}} onClick={()=>setSelSector(selSector===s.sector?'All':s.sector)}>
              <td style={{...sty.td,fontWeight:600}}>{s.sector}</td><td style={{...sty.td,...sty.mono}}>{s.count}</td>
              <td style={{...sty.td,...sty.mono}}>{(s.totalVolume/1e6).toFixed(1)}M</td>
              <td style={{...sty.td,...sty.mono}}>{s.avgEmissions} tCO2/t</td>
              <td style={{...sty.td,...sty.mono,fontWeight:700}}>\u20AC{s.adjustedCbamMn}M</td>
            </tr>
          ))}</tbody>
        </table>
      </div>
      <div style={sty.card}>
        <div style={sty.cardTitle}>CBAM Certificate Cost Calculator</div>
        <div style={sty.grid3}>
          {[20,50,80,100,150,200].map(p=>{
            const totalCost=CBAM_IMPORTERS.reduce((a,c)=>a+c.cbamCostMn*(p/80),0);
            return(<div key={p} style={{padding:'12px',background:p===carbonPrice?`${T.gold}20`:T.surfaceH,borderRadius:'8px',textAlign:'center',cursor:'pointer',border:p===carbonPrice?`2px solid ${T.gold}`:'2px solid transparent'}} onClick={()=>setCarbonPrice(p)}>
              <div style={{fontSize:'11px',color:T.textMut}}>{'\u20AC'}{p}/tCO2</div>
              <div style={{fontSize:'18px',fontWeight:700,color:T.navy,fontFamily:T.mono}}>{'\u20AC'}{totalCost.toFixed(0)}M</div>
              <div style={{fontSize:'10px',color:T.textSec}}>Total CBAM cost</div>
            </div>);
          })}
        </div>
      </div>
    </div>
  );

  const renderTab1=()=>(
    <div>
      <div style={sty.row}>
        {[{l:'Countries with Carbon Border',v:COUNTRY_POLICIES.filter(c=>c.carbonBorderMech!=='None').length},{l:'Active ETS',v:COUNTRY_POLICIES.filter(c=>c.etsActive).length},{l:'Climate Club Members',v:COUNTRY_POLICIES.filter(c=>c.climateClub).length},{l:'WTO Challenges',v:COUNTRY_POLICIES.filter(c=>c.wtoCompatibility==='Challenged').length},{l:'Dev Country Exemptions',v:COUNTRY_POLICIES.filter(c=>c.devCountryExempt).length}].map((k,i)=>(
          <div key={i} style={sty.kpi}><div style={sty.kpiVal}>{k.v}</div><div style={sty.kpiLbl}>{k.l}</div></div>
        ))}
      </div>
      <div style={sty.grid2}>
        <div style={sty.card}>
          <div style={sty.cardTitle}>Carbon Border Policy Status</div>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart><Pie data={countryPolicySummary} cx="50%" cy="50%" outerRadius={90} innerRadius={50} dataKey="value" label={({name,value})=>`${name}: ${value}`}>
              {countryPolicySummary.map((e,i)=>(<Cell key={i} fill={COLORS[i]}/>))}
            </Pie><Tooltip/><Legend wrapperStyle={{fontSize:11}}/></PieChart>
          </ResponsiveContainer>
        </div>
        <div style={sty.card}>
          <div style={sty.cardTitle}>Carbon Price by Country (Top 20)</div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={COUNTRY_POLICIES.sort((a,b)=>b.carbonPrice-a.carbonPrice).slice(0,20)}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
              <XAxis dataKey="country" tick={{fontSize:9,fill:T.textSec}} angle={-35} textAnchor="end" height={50}/>
              <YAxis tick={{fontSize:10,fill:T.textSec}} label={{value:'\u20AC/tCO2',position:'insideTopLeft',fontSize:9}}/>
              <Tooltip formatter={v=>`\u20AC${v}`} contentStyle={{fontSize:11,borderRadius:8}}/>
              <Bar dataKey="carbonPrice" name="Carbon Price" radius={[4,4,0,0]}>
                {COUNTRY_POLICIES.sort((a,b)=>b.carbonPrice-a.carbonPrice).slice(0,20).map((e,i)=>(<Cell key={i} fill={e.carbonPrice>80?T.navy:e.carbonPrice>30?T.gold:T.textMut}/>))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div style={sty.card}>
        <div style={sty.cardTitle}>Global Carbon Border Mechanism Landscape</div>
        <div style={{maxHeight:'450px',overflowY:'auto'}}>
          <table style={sty.table}>
            <thead><tr><th style={sty.th}>Country</th><th style={sty.th}>Mechanism</th><th style={sty.th}>Carbon Price</th><th style={sty.th}>ETS</th><th style={sty.th}>WTO</th><th style={sty.th}>Climate Club</th><th style={sty.th}>Trade Exposure</th><th style={sty.th}>Leakage Risk</th></tr></thead>
            <tbody>{COUNTRY_POLICIES.map((c,i)=>(
              <tr key={i} style={{background:selCountry===c.country?`${T.gold}15`:i%2===0?'transparent':T.surfaceH,cursor:'pointer'}} onClick={()=>setSelCountry(selCountry===c.country?null:c.country)}>
                <td style={{...sty.td,fontWeight:600}}>{c.country}</td>
                <td style={sty.td}><span style={sty.badge(c.carbonBorderMech.includes('Active')?T.green:c.carbonBorderMech==='None'?T.textMut:T.amber)}>{c.carbonBorderMech}</span></td>
                <td style={{...sty.td,...sty.mono}}>{c.carbonPrice>0?`\u20AC${c.carbonPrice}`:'-'}</td>
                <td style={sty.td}>{c.etsActive?<span style={sty.badge(T.green)}>Active</span>:'-'}</td>
                <td style={sty.td}><span style={sty.badge(c.wtoCompatibility==='Compatible'?T.green:c.wtoCompatibility==='Challenged'?T.red:T.amber)}>{c.wtoCompatibility}</span></td>
                <td style={sty.td}>{c.climateClub?<span style={sty.badge(T.sage)}>Member</span>:'-'}</td>
                <td style={{...sty.td,...sty.mono}}>{c.tradeExposure}%</td>
                <td style={sty.td}><span style={sty.badge(c.carbonLeakageRisk==='Critical'?T.red:c.carbonLeakageRisk==='High'?T.amber:c.carbonLeakageRisk==='Medium'?T.gold:T.green)}>{c.carbonLeakageRisk}</span></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </div>
      {selCountry&&(()=>{
        const cd=COUNTRY_POLICIES.find(c=>c.country===selCountry);
        return(<div style={{...sty.card,borderLeft:`4px solid ${T.gold}`}}>
          <div style={sty.cardTitle}>{selCountry} — Carbon Border Profile</div>
          <div style={sty.row}>
            {[{l:'Mechanism',v:cd.carbonBorderMech},{l:'Carbon Price',v:cd.carbonPrice>0?`\u20AC${cd.carbonPrice}`:'-'},{l:'ETS',v:cd.etsActive?'Active':'No'},{l:'Climate Club',v:cd.climateClub?'Member':'No'},{l:'WTO Status',v:cd.wtoCompatibility},{l:'Leakage Risk',v:cd.carbonLeakageRisk},{l:'Embedded CO2',v:`${cd.embeddedCO2Mn} Mt`},{l:'Carbon Balance',v:`${cd.virtualCarbonBalance>0?'+':''}${cd.virtualCarbonBalance} Mt`}].map((k,i)=>(
              <div key={i} style={sty.kpi}><div style={{...sty.kpiVal,fontSize:'16px'}}>{k.v}</div><div style={sty.kpiLbl}>{k.l}</div></div>
            ))}
          </div>
        </div>);
      })()}
    </div>
  );

  const renderTab2=()=>(
    <div>
      <div style={sty.row}>
        {[{l:'Trade Flows Tracked',v:TRADE_FLOWS.length},{l:'Total Embedded CO2',v:`${TRADE_FLOWS.reduce((a,f)=>a+parseFloat(f.embeddedMtCO2),0).toFixed(0)} Mt`},{l:'Total Trade Value',v:`$${TRADE_FLOWS.reduce((a,f)=>a+parseFloat(f.tradeBn),0).toFixed(0)}B`},{l:'Avg Carbon Intensity',v:`${(TRADE_FLOWS.reduce((a,f)=>a+parseFloat(f.carbonIntensity),0)/TRADE_FLOWS.length).toFixed(2)} tCO2/$M`},{l:'Total CBAM Liability',v:`\u20AC${TRADE_FLOWS.reduce((a,f)=>a+parseFloat(f.cbamLiability),0).toFixed(0)}M`}].map((k,i)=>(
          <div key={i} style={sty.kpi}><div style={sty.kpiVal}>{k.v}</div><div style={sty.kpiLbl}>{k.l}</div></div>
        ))}
      </div>
      <div style={sty.card}>
        <div style={sty.cardTitle}>Virtual Carbon Trade Balance by Country</div>
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={virtualCarbonBalance} layout="vertical"><CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
            <XAxis type="number" tick={{fontSize:10,fill:T.textSec}}/>
            <YAxis dataKey="country" type="category" tick={{fontSize:9,fill:T.textSec}} width={80}/>
            <Tooltip formatter={v=>`${v} Mt CO2`} contentStyle={{fontSize:11,borderRadius:8}}/>
            <Bar dataKey="balance" name="Virtual Carbon Balance Mt" radius={[0,4,4,0]}>
              {virtualCarbonBalance.map((e,i)=>(<Cell key={i} fill={e.balance>0?T.red:T.green}/>))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div style={sty.grid2}>
        <div style={sty.card}>
          <div style={sty.cardTitle}>Trade Value vs Carbon Intensity</div>
          <ResponsiveContainer width="100%" height={280}>
            <ScatterChart><CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
              <XAxis dataKey="x" name="Trade $Bn" tick={{fontSize:10,fill:T.textSec}} label={{value:'Trade $Bn',position:'insideBottom',offset:-5,fontSize:10}}/>
              <YAxis dataKey="y" name="Carbon Intensity" tick={{fontSize:10,fill:T.textSec}} label={{value:'tCO2/t',angle:-90,position:'insideLeft',fontSize:10}}/>
              <Tooltip contentStyle={{fontSize:11,borderRadius:8}} formatter={(v,n)=>n==='x'?`$${v}B`:n==='y'?`${v} tCO2/t`:`${v} Mt`}/>
              <Scatter data={scatterData} fill={T.navy} name="Trade Flows">
                {scatterData.map((e,i)=>(<Cell key={i} fill={e.y>2?T.red:e.y>1?T.amber:T.green}/>))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </div>
        <div style={sty.card}>
          <div style={sty.cardTitle}>Carbon Leakage Risk Sectors</div>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={CBAM_SECTORS.map((s,i)=>({name:s,value:Math.floor(sr(i*71+23)*50)+10}))} cx="50%" cy="50%" outerRadius={90} innerRadius={50} dataKey="value" label={({name,value})=>`${name}: ${value}%`}>
                {CBAM_SECTORS.map((e,i)=>(<Cell key={i} fill={COLORS[i]}/>))}
              </Pie><Tooltip/><Legend wrapperStyle={{fontSize:10}}/></PieChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div style={sty.card}>
        <div style={sty.cardTitle}>Bilateral Trade Flows x Carbon Intensity</div>
        <div style={{maxHeight:'400px',overflowY:'auto'}}>
          <table style={sty.table}>
            <thead><tr><th style={sty.th}>From</th><th style={sty.th}>To</th><th style={sty.th}>Sector</th><th style={sty.th}>Trade $Bn</th><th style={sty.th}>Intensity</th><th style={sty.th}>Embedded Mt</th><th style={sty.th}>CBAM \u20ACM</th></tr></thead>
            <tbody>{TRADE_FLOWS.sort((a,b)=>parseFloat(b.cbamLiability)-parseFloat(a.cbamLiability)).map((f,i)=>(
              <tr key={i} style={{background:i%2===0?'transparent':T.surfaceH}}>
                <td style={{...sty.td,fontWeight:600}}>{f.from}</td><td style={sty.td}>{f.to}</td><td style={sty.td}>{f.sector}</td>
                <td style={{...sty.td,...sty.mono}}>${f.tradeBn}B</td>
                <td style={{...sty.td,...sty.mono,color:parseFloat(f.carbonIntensity)>2?T.red:T.text}}>{f.carbonIntensity}</td>
                <td style={{...sty.td,...sty.mono}}>{f.embeddedMtCO2}</td>
                <td style={{...sty.td,...sty.mono,fontWeight:600}}>\u20AC{f.cbamLiability}M</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderTab3=()=>(
    <div>
      <div style={sty.row}>
        {[{l:'Importers Tracked',v:100},{l:'Total CBAM Exposure',v:`\u20AC${filteredImporters.reduce((a,c)=>a+c.adjustedCost,0).toFixed(0)}M`},{l:'Non-Compliant',v:CBAM_IMPORTERS.filter(c=>c.complianceStatus==='Non-Compliant').length},{l:'Low-Carbon Leaders',v:CBAM_IMPORTERS.filter(c=>c.competitiveAdv==='Low-Carbon Leader').length},{l:'Avg Cost Pass-Through',v:`${Math.round(CBAM_IMPORTERS.reduce((a,c)=>a+c.costPassThrough,0)/100)}%`}].map((k,i)=>(
          <div key={i} style={sty.kpi}><div style={sty.kpiVal}>{k.v}</div><div style={sty.kpiLbl}>{k.l}</div></div>
        ))}
      </div>
      <div style={sty.card}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'12px',flexWrap:'wrap',gap:'8px'}}>
          <div style={sty.cardTitle}>Portfolio CBAM Trade Risk (at {'\u20AC'}{carbonPrice}/tCO2)</div>
          <div style={{display:'flex',gap:'8px',alignItems:'center'}}>
            <input style={sty.input} placeholder="Search..." value={searchTerm} onChange={e=>setSearchTerm(e.target.value)}/>
            <select style={sty.select} value={selSector} onChange={e=>setSelSector(e.target.value)}>
              <option value="All">All Sectors</option>{CBAM_SECTORS.map(s=>(<option key={s} value={s}>{s}</option>))}
            </select>
            <button style={{...sty.btn,background:T.gold,color:'#fff'}} onClick={exportCSV}>Export CSV</button>
          </div>
        </div>
        <div style={{fontSize:'12px',color:T.textMut,marginBottom:'8px'}}>{filteredImporters.length} importers | Page {compPage+1}/{totalPages}</div>
        <div style={{overflowX:'auto'}}>
          <table style={sty.table}>
            <thead><tr>
              <th style={sty.th} onClick={()=>handleSort('name')}>Company</th><th style={sty.th}>Sector</th><th style={sty.th}>Country</th>
              <th style={sty.th} onClick={()=>handleSort('importVolumeTons')}>Volume</th>
              <th style={sty.th} onClick={()=>handleSort('embeddedEmissions')}>Emissions</th>
              <th style={sty.th} onClick={()=>handleSort('cbamCostMn')}>CBAM \u20ACM</th>
              <th style={sty.th}>Default vs Actual</th><th style={sty.th}>Compliance</th>
              <th style={sty.th} onClick={()=>handleSort('costPassThrough')}>Pass-Through %</th><th style={sty.th}>Competitive</th>
            </tr></thead>
            <tbody>{pagedImporters.map((c,i)=>(
              <tr key={i} style={{background:i%2===0?'transparent':T.surfaceH}}>
                <td style={{...sty.td,fontWeight:600,fontSize:'11px'}}>{c.name}</td><td style={sty.td}>{c.sector}</td><td style={sty.td}>{c.country}</td>
                <td style={{...sty.td,...sty.mono}}>{(c.importVolumeTons/1000).toFixed(0)}K t</td>
                <td style={{...sty.td,...sty.mono}}>{c.embeddedEmissions}</td>
                <td style={{...sty.td,...sty.mono,fontWeight:700}}>\u20AC{c.adjustedCost}M</td>
                <td style={{...sty.td,...sty.mono}}>{c.defaultValue} / {c.actualEmissions}</td>
                <td style={sty.td}><span style={sty.badge(c.complianceStatus==='Full'?T.green:c.complianceStatus==='Non-Compliant'?T.red:T.amber)}>{c.complianceStatus}</span></td>
                <td style={{...sty.td,...sty.mono}}>{c.costPassThrough}%</td>
                <td style={sty.td}>{c.competitiveAdv==='Low-Carbon Leader'?<span style={sty.badge(T.green)}>Leader</span>:<span style={{color:T.textMut}}>Standard</span>}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
        <div style={{display:'flex',justifyContent:'center',gap:'4px',marginTop:'12px'}}>
          <button style={{...sty.btn,background:T.surfaceH,color:T.navy}} disabled={compPage===0} onClick={()=>setCompPage(p=>p-1)}>Prev</button>
          {Array.from({length:Math.min(totalPages,7)},(_, idx)=>(<button key={idx} style={{...sty.btn,background:compPage===idx?T.navy:T.surfaceH,color:compPage===idx?'#fff':T.navy}} onClick={()=>setCompPage(idx)}>{idx+1}</button>))}
          <button style={{...sty.btn,background:T.surfaceH,color:T.navy}} disabled={compPage>=totalPages-1} onClick={()=>setCompPage(p=>p+1)}>Next</button>
        </div>
      </div>
    </div>
  );

  return(
    <div style={sty.wrap}>
      <div style={{marginBottom:'24px'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
          <div><h1 style={sty.title}>Trade & Carbon Border Policy</h1><p style={sty.subtitle}>EP-AV4 // EU CBAM, carbon border mechanisms, embedded emissions, trade risk // 40 countries, 100 importers</p></div>
          <div style={{...sty.mono,color:T.textMut}}>Updated: 2026-03-29</div>
        </div>
      </div>
      <div style={sty.tabs}>{tabs.map((t,i)=>(<button key={i} style={sty.tab(tab===i)} onClick={()=>{setTab(i);setCompPage(0);}}>{t}</button>))}</div>
      {tab===0&&renderTab0()}
      {tab===1&&renderTab1()}
      {tab===2&&renderTab2()}
      {tab===3&&renderTab3()}
    </div>
  );
}
