import React,{useState,useMemo,useCallback} from 'react';
import {BarChart,Bar,XAxis,YAxis,CartesianGrid,Tooltip,ResponsiveContainer,RadarChart,Radar,PolarGrid,PolarAngleAxis,PolarRadiusAxis,Cell,Legend,PieChart,Pie,LineChart,Line} from 'recharts';

const T={bg:'#f6f4f0',surface:'#ffffff',surfaceH:'#f0ede7',border:'#e5e0d8',borderL:'#d5cfc5',navy:'#1b3a5c',navyL:'#2c5a8c',gold:'#c5a96a',goldL:'#d4be8a',sage:'#5a8a6a',sageL:'#7ba67d',teal:'#5a8a6a',text:'#1b3a5c',textSec:'#5c6b7e',textMut:'#9aa3ae',red:'#dc2626',green:'#16a34a',amber:'#d97706',font:"'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"};
const sr=(s)=>{let x=Math.sin(s+1)*10000;return x-Math.floor(x);};
const sn=(s,min,max)=>min+sr(s)*(max-min);
const si=(s,min,max)=>Math.floor(sn(s,min,max));
const sp=(arr,s)=>arr[si(s,0,arr.length)];

const MINERALS=[
  {id:'lithium',name:'Lithium',sym:'Li',sector:'Batteries',crit:'Strategic'},
  {id:'cobalt',name:'Cobalt',sym:'Co',sector:'Batteries',crit:'Critical'},
  {id:'nickel',name:'Nickel',sym:'Ni',sector:'Batteries',crit:'Strategic'},
  {id:'manganese',name:'Manganese',sym:'Mn',sector:'Batteries',crit:'Important'},
  {id:'graphite',name:'Graphite',sym:'C',sector:'Batteries',crit:'Critical'},
  {id:'rare_earths',name:'Rare Earths',sym:'REE',sector:'Magnets',crit:'Critical'},
  {id:'tin',name:'Tin',sym:'Sn',sector:'Electronics',crit:'Conflict'},
  {id:'tantalum',name:'Tantalum',sym:'Ta',sector:'Electronics',crit:'Conflict'},
  {id:'tungsten',name:'Tungsten',sym:'W',sector:'Industrial',crit:'Conflict'},
  {id:'gold',name:'Gold',sym:'Au',sector:'Electronics',crit:'Conflict'},
  {id:'copper',name:'Copper',sym:'Cu',sector:'Wiring',crit:'Strategic'},
  {id:'platinum',name:'Platinum',sym:'Pt',sector:'Catalysts',crit:'Strategic'},
];

const COUNTRIES=['DRC','China','Australia','Chile','Indonesia','South Africa','Russia','Brazil','Philippines','Argentina','Peru','Bolivia','Myanmar','Rwanda','Colombia','Mexico','Canada','India','Zimbabwe','Tanzania','Zambia','Ghana','Morocco','Kazakhstan','Vietnam'];

const COMPANY_NAMES=['Tesla','Apple','Samsung','BYD','CATL','Panasonic','LG Energy','SK Innovation','BMW','Volkswagen','Mercedes-Benz','Toyota','Ford','GM','Stellantis','Rivian','Lucid','NIO','Sony','Microsoft','Intel','AMD','Qualcomm','TSMC','Dell','HP Inc','Lenovo','Huawei','Xiaomi','NVIDIA','Bosch','Siemens','ABB','Schneider','GE','Honeywell','3M','Corning','Texas Instruments','Infineon','STMicro','NXP Semi','Murata','TDK Corp','Kyocera','Foxconn','Pegatron','Jabil','Flex Ltd','Amphenol','TE Connectivity','Molex','Johnson Matthey','BASF','Umicore','Albemarle','SQM','Livent','Pilbara Minerals','Allkem','Glencore','BHP','Rio Tinto','Vale','Anglo American','Freeport-McMoRan','Norilsk Nickel','Southern Copper','First Quantum','Teck Resources','Newmont','Barrick Gold','Ivanhoe Mines','AMG Advanced','MP Materials','Lynas Rare Earths','Iluka Resources','Energy Fuels','Neo Performance','Kennametal'];

const SMELTER_NAMES=['Jiangxi Copper Smelter','Umicore Belgium','LS-Nikko Copper','PT Timah','Thaisarco','Malaysia Smelting','Minsur Peru','Alpha Tungsten','Wolfram Bergbau','KEMET Blue Powder','H.C. Starck Tantalum','Global Advanced Metals','Metalor Technologies','PAMP SA','Asahi Refining','Heraeus Precious Metals','Johnson Matthey Refinery','Sumitomo Metal Mining','Jinchuan Group','CNGR Advanced Materials','Ganfeng Lithium Refinery','Tianqi Lithium Process','Albemarle Conversion','SQM Lithium Refinery','Norilsk Nickel Refinery','Glencore Nikkelverk','BHP Nickel West','Huayou Cobalt Refinery','Zhejiang Huayou','Congo DongFang Mining','Chemaf Refinery','ERG Africa','Shenzhen Green Eco','GEM Co Recycling','Posco Chemical','Ecopro BM','Livent Processing','Pilbara Spodumene','Sociedad Quimica y Minera','Freeport Cobalt'];

const RECYCLING_FACILITIES=['Li-Cycle Rochester','Redwood Materials NV','Umicore Hoboken','Retriev Technologies','Battery Resources Finland','Duesenfeld Germany','Accurec Germany','SungEel HiTech Korea','Green Li-ion Singapore','Fortum Finland','Neometals Australia','American Manganese BC','RecycLiCo Innovations','Primobius Germany','TES Singapore','Cirba Solutions OH','Ascend Elements GA','Nth Cycle MA','Aqua Metals NV','Ecobat Resources TX'];

const genMinerals=()=>MINERALS.map((m,i)=>{
  const supplyRisk=sn(i*100+1,35,95);
  const hhi=sn(i*100+2,1200,8500);
  const priceVol=sn(i*100+3,8,55);
  const recycRate=sn(i*100+4,2,65);
  const demandGrowth=sn(i*100+5,3,28);
  const reserveYrs=si(i*100+30,8,120);
  const prodTonnes=si(i*100+31,500,500000);
  const countries=COUNTRIES.slice(0,si(i*100+6,4,10)).map((c,j)=>({
    country:c,share:sn(i*1000+j*10+7,5,60),conflictScore:sn(i*1000+j*10+8,10,95),
    govScore:sn(i*1000+j*10+9,15,85),envRisk:sn(i*1000+j*10+40,20,90),
    labourRisk:sn(i*1000+j*10+41,15,85),
  }));
  countries.sort((a,b)=>b.share-a.share);
  const totalShare=countries.reduce((s,c)=>s+c.share,0);
  countries.forEach(c=>c.share=+(c.share/totalShare*100).toFixed(1));
  const priceHistory=Array.from({length:12},(_, q)=>({
    q:`Q${(q%4)+1} ${2023+Math.floor(q/4)}`,
    price:sn(i*500+q*13+10,50,500),
    idx:sn(i*500+q*13+11,80,140),
    volume:si(i*500+q*13+42,1000,50000),
  }));
  const topProducers=countries.slice(0,3).map(c=>c.country);
  return {...m,supplyRisk:+supplyRisk.toFixed(1),hhi:Math.round(hhi),priceVol:+priceVol.toFixed(1),recycRate:+recycRate.toFixed(1),demandGrowth:+demandGrowth.toFixed(1),reserveYrs,prodTonnes,countries,priceHistory,topProducers};
});

const genCompanies=()=>COMPANY_NAMES.map((name,i)=>{
  const sector=sp(['Automotive','Electronics','Mining','Battery','Industrial','Semiconductor','Components','Chemicals'],i*200+1);
  const revenue=sn(i*200+2,500,250000);
  const marketCap=revenue*(sn(i*200+60,1.5,8));
  const exposure=MINERALS.map((m,j)=>({mineral:m.id,name:m.name,level:sn(i*200+j*17+3,0,100)>60?sn(i*200+j*17+4,10,100):0}));
  const totalExposure=exposure.filter(e=>e.level>0).length;
  const ddScore=sn(i*200+50,25,98);
  const doddFrank=sn(i*200+51,0,1)>0.3;
  const euCrma=sn(i*200+52,0,1)>0.4;
  const oecdStep=si(i*200+53,1,6);
  const filingStatus=sp(['Filed','Pending','Overdue','Exempt','N/A'],i*200+54);
  const riskLevel=ddScore>75?'Low':ddScore>50?'Medium':ddScore>30?'High':'Critical';
  const gaps=si(i*200+55,0,8);
  const country=sp(['US','DE','JP','KR','CN','TW','NL','CH','AU','UK','FR','SE'],i*200+56);
  const employees=si(i*200+57,500,300000);
  const tier1Suppliers=si(i*200+58,5,80);
  const supplyChainScore=sn(i*200+59,30,95);
  return {id:i,name,sector,revenue:Math.round(revenue),marketCap:Math.round(marketCap),exposure,totalExposure,ddScore:+ddScore.toFixed(1),doddFrank,euCrma,oecdStep,filingStatus,riskLevel,gaps,country,employees,tier1Suppliers,supplyChainScore:+supplyChainScore.toFixed(1)};
});

const genSmelters=()=>SMELTER_NAMES.map((name,i)=>{
  const country=sp(COUNTRIES,i*300+1);
  const mineral=sp(MINERALS,i*300+2);
  const rmap=sn(i*300+3,0,1)>0.45;
  const capacity=si(i*300+4,500,50000);
  const riskScore=sn(i*300+5,15,90);
  const cahra=sn(i*300+6,0,1)>0.6;
  const tier=si(i*300+7,1,4);
  const cert=sp(['RMAP Conformant','RMAP Active','Under Review','Not Certified','Pending Audit'],i*300+8);
  const lastAudit=`${2024+si(i*300+9,0,3)}-${String(si(i*300+10,1,13)).padStart(2,'0')}`;
  const lat=sn(i*300+20,-30,60);
  const lng=sn(i*300+21,-120,140);
  const employees=si(i*300+22,50,5000);
  const upstreamMines=si(i*300+23,2,15);
  const downstreamOEMs=si(i*300+24,3,25);
  return {id:i,name,country,mineral:mineral.name,mineralId:mineral.id,rmap,capacity,riskScore:+riskScore.toFixed(1),cahra,tier,cert,lastAudit,lat:+lat.toFixed(2),lng:+lng.toFixed(2),employees,upstreamMines,downstreamOEMs};
});

const genRecycling=()=>RECYCLING_FACILITIES.map((name,i)=>{
  const minerals=MINERALS.filter((_,j)=>sn(i*400+j*19+1,0,1)>0.55).map(m=>m.name);
  const capacity=si(i*400+2,1000,25000);
  const recoveryRate=sn(i*400+3,60,98);
  const tech=sp(['Hydrometallurgical','Pyrometallurgical','Direct Recycling','Mechanical','Hybrid'],i*400+4);
  const operational=sn(i*400+5,0,1)>0.2;
  const yearBuilt=si(i*400+6,2018,2026);
  const investmentM=si(i*400+7,20,500);
  const co2Saved=si(i*400+8,500,15000);
  return {id:i,name,minerals:minerals.length>0?minerals:['Lithium','Cobalt'],capacity,recoveryRate:+recoveryRate.toFixed(1),tech,operational,yearBuilt,investmentM,co2Saved};
});

const TABS=['Mineral Risk Dashboard','Due Diligence & Compliance','Supply Chain Mapping','Strategic & Financial Impact'];
const riskColor=(v)=>v>=75?T.red:v>=50?T.amber:v>=25?T.gold:T.green;
const fmt=(n)=>n>=1e6?(n/1e6).toFixed(1)+'M':n>=1e3?(n/1e3).toFixed(1)+'K':n.toFixed(0);

const Card=({title,children,style})=>(
  <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:6,padding:'14px 16px',fontFamily:T.font,...style}}>
    {title&&<div style={{fontSize:11,fontFamily:T.mono,color:T.textMut,textTransform:'uppercase',letterSpacing:1,marginBottom:10}}>{title}</div>}
    {children}
  </div>
);
const KPI=({label,value,sub,color})=>(
  <div style={{textAlign:'center',padding:'10px 6px'}}>
    <div style={{fontSize:22,fontWeight:700,color:color||T.navy,fontFamily:T.mono}}>{value}</div>
    <div style={{fontSize:11,color:T.textSec,marginTop:2}}>{label}</div>
    {sub&&<div style={{fontSize:10,color:T.textMut,marginTop:1}}>{sub}</div>}
  </div>
);
const Badge=({text,color})=>(
  <span style={{display:'inline-block',padding:'2px 8px',borderRadius:10,fontSize:10,fontWeight:600,fontFamily:T.mono,color:color||T.navy,background:color?color+'18':T.surfaceH,border:`1px solid ${color||T.border}`}}>{text}</span>
);

/* ═══════════════════════════════════════════════════════════════════ */
/*  TAB 1: MINERAL RISK DASHBOARD                                    */
/* ═══════════════════════════════════════════════════════════════════ */
const MineralRiskDashboard=({minerals,companies,selMineral,setSelMineral,selCompany,setSelCompany})=>{
  const topRisk=useMemo(()=>[...minerals].sort((a,b)=>b.supplyRisk-a.supplyRisk),[minerals]);
  const radarData=useMemo(()=>minerals.map(m=>({mineral:m.sym,supplyRisk:m.supplyRisk,priceVol:m.priceVol,concentration:Math.min(m.hhi/85,100),demandGrowth:m.demandGrowth*3.5})),[minerals]);
  const selM=selMineral?minerals.find(m=>m.id===selMineral):null;
  const selC=selCompany!==null?companies[selCompany]:null;
  const hhiData=useMemo(()=>minerals.map(m=>({name:m.sym,hhi:m.hhi})),[minerals]);
  const demandData=useMemo(()=>minerals.map(m=>({name:m.sym,growth:m.demandGrowth,reserve:m.reserveYrs})),[minerals]);

  return (<div style={{display:'flex',flexDirection:'column',gap:14}}>
    {/* KPI Row */}
    <div style={{display:'grid',gridTemplateColumns:'repeat(6,1fr)',gap:10}}>
      <Card><KPI label="Critical Minerals" value="12" sub="EU CRMA list"/></Card>
      <Card><KPI label="Avg Supply Risk" value={+(minerals.reduce((s,m)=>s+m.supplyRisk,0)/12).toFixed(1)} color={T.amber}/></Card>
      <Card><KPI label="Conflict Minerals" value="4" sub="3TG (Sn,Ta,W,Au)" color={T.red}/></Card>
      <Card><KPI label="Companies Exposed" value={companies.filter(c=>c.totalExposure>3).length} sub="3+ minerals"/></Card>
      <Card><KPI label="High Concentration" value={minerals.filter(m=>m.hhi>4000).length} sub="HHI > 4000"/></Card>
      <Card><KPI label="Avg Recycle Rate" value={+(minerals.reduce((s,m)=>s+m.recycRate,0)/12).toFixed(1)+'%'} color={T.sage}/></Card>
    </div>

    {/* Mineral Summary Table */}
    <Card title="12 Critical Minerals -- Supply Risk Overview">
      <div style={{overflowX:'auto'}}>
        <table style={{width:'100%',borderCollapse:'collapse',fontSize:10,fontFamily:T.mono}}>
          <thead><tr>
            {['Mineral','Symbol','Sector','Classification','Supply Risk','HHI','Volatility','Recycle %','Demand Growth','Reserve (yr)','Top Producers'].map(h=>(
              <th key={h} style={{textAlign:'left',padding:'4px 6px',borderBottom:`2px solid ${T.border}`,color:T.textMut,fontSize:9}}>{h}</th>
            ))}
          </tr></thead>
          <tbody>{minerals.map((m,i)=>(
            <tr key={i} style={{cursor:'pointer',background:selMineral===m.id?T.surfaceH:i%2?'transparent':T.bg,borderBottom:`1px solid ${T.border}`}} onClick={()=>setSelMineral(m.id)}>
              <td style={{padding:'3px 6px',fontWeight:600,color:T.text}}>{m.name}</td>
              <td style={{padding:'3px 6px',color:T.textSec}}>{m.sym}</td>
              <td style={{padding:'3px 6px',color:T.textSec}}>{m.sector}</td>
              <td style={{padding:'3px 6px'}}><Badge text={m.crit} color={m.crit==='Conflict'?T.red:m.crit==='Critical'?T.amber:T.navy}/></td>
              <td style={{padding:'3px 6px',fontWeight:700,color:riskColor(m.supplyRisk)}}>{m.supplyRisk}</td>
              <td style={{padding:'3px 6px',color:m.hhi>4000?T.red:T.textSec}}>{m.hhi}</td>
              <td style={{padding:'3px 6px',color:T.textSec}}>{m.priceVol}%</td>
              <td style={{padding:'3px 6px',color:m.recycRate<15?T.red:T.sage}}>{m.recycRate}%</td>
              <td style={{padding:'3px 6px',color:T.sage}}>+{m.demandGrowth}%</td>
              <td style={{padding:'3px 6px',color:m.reserveYrs<20?T.red:T.textSec}}>{m.reserveYrs}</td>
              <td style={{padding:'3px 6px',color:T.textMut,fontSize:9}}>{m.topProducers.join(', ')}</td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </Card>

    {/* Supply Risk Bar + Radar */}
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
      <Card title="Supply Risk Score by Mineral">
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={topRisk} layout="vertical" margin={{left:80,right:20,top:5,bottom:5}}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
            <XAxis type="number" domain={[0,100]} tick={{fontSize:10,fill:T.textSec}}/>
            <YAxis type="category" dataKey="name" tick={{fontSize:10,fill:T.text}} width={75}/>
            <Tooltip contentStyle={{fontFamily:T.mono,fontSize:11}}/>
            <Bar dataKey="supplyRisk" name="Supply Risk" radius={[0,4,4,0]} cursor="pointer" onClick={(_,idx)=>setSelMineral(topRisk[idx].id)}>
              {topRisk.map((m,i)=><Cell key={i} fill={riskColor(m.supplyRisk)}/>)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Card>
      <Card title="Multi-Dimensional Risk Radar">
        <ResponsiveContainer width="100%" height={320}>
          <RadarChart data={radarData}>
            <PolarGrid stroke={T.border}/>
            <PolarAngleAxis dataKey="mineral" tick={{fontSize:9,fill:T.text}}/>
            <PolarRadiusAxis angle={30} domain={[0,100]} tick={{fontSize:8,fill:T.textMut}}/>
            <Radar name="Supply Risk" dataKey="supplyRisk" stroke={T.red} fill={T.red} fillOpacity={0.15}/>
            <Radar name="Price Volatility" dataKey="priceVol" stroke={T.amber} fill={T.amber} fillOpacity={0.15}/>
            <Radar name="Concentration" dataKey="concentration" stroke={T.navy} fill={T.navy} fillOpacity={0.1}/>
            <Legend wrapperStyle={{fontSize:10}}/>
          </RadarChart>
        </ResponsiveContainer>
      </Card>
    </div>

    {/* HHI + Demand Growth */}
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
      <Card title="Country Concentration Risk (Herfindahl-Hirschman Index)">
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={hhiData} margin={{left:10,right:10,top:5,bottom:5}}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
            <XAxis dataKey="name" tick={{fontSize:10,fill:T.textSec}}/>
            <YAxis tick={{fontSize:9,fill:T.textMut}}/>
            <Tooltip contentStyle={{fontFamily:T.mono,fontSize:10}}/>
            <Bar dataKey="hhi" name="HHI" radius={[4,4,0,0]}>
              {hhiData.map((d,i)=><Cell key={i} fill={d.hhi>4000?T.red:d.hhi>2500?T.amber:T.sage}/>)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <div style={{fontSize:9,color:T.textMut,marginTop:4}}>HHI &gt; 4000 = highly concentrated | 2500-4000 = moderately concentrated</div>
      </Card>
      <Card title="Demand Growth % vs Reserve Life (years)">
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={demandData} margin={{left:10,right:10,top:5,bottom:5}}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
            <XAxis dataKey="name" tick={{fontSize:10,fill:T.textSec}}/>
            <YAxis tick={{fontSize:9,fill:T.textMut}}/>
            <Tooltip contentStyle={{fontFamily:T.mono,fontSize:10}}/>
            <Bar dataKey="growth" name="Demand Growth %" fill={T.sage} radius={[4,4,0,0]}/>
            <Bar dataKey="reserve" name="Reserve Life (yr)" fill={T.navyL} radius={[4,4,0,0]}/>
            <Legend wrapperStyle={{fontSize:10}}/>
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </div>

    {/* Selected Mineral deep dive */}
    {selM&&<Card title={`${selM.name} (${selM.sym}) -- 12-Quarter Price & Index Trend`}>
      <div style={{display:'flex',gap:10,marginBottom:10,flexWrap:'wrap'}}>
        <Badge text={`Supply Risk: ${selM.supplyRisk}`} color={riskColor(selM.supplyRisk)}/>
        <Badge text={`HHI: ${selM.hhi}`} color={selM.hhi>4000?T.red:T.amber}/>
        <Badge text={`Volatility: ${selM.priceVol}%`}/>
        <Badge text={`Demand Growth: +${selM.demandGrowth}%`} color={T.sage}/>
        <Badge text={`Recycle Rate: ${selM.recycRate}%`}/>
        <Badge text={`Reserve: ${selM.reserveYrs} yr`}/>
        <Badge text={selM.crit} color={selM.crit==='Critical'?T.red:selM.crit==='Conflict'?T.amber:T.navy}/>
        <Badge text={`Production: ${fmt(selM.prodTonnes)} t/yr`}/>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={selM.priceHistory} margin={{left:10,right:20,top:5,bottom:5}}>
          <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
          <XAxis dataKey="q" tick={{fontSize:9,fill:T.textMut}}/>
          <YAxis yAxisId="l" tick={{fontSize:9,fill:T.textSec}}/>
          <YAxis yAxisId="r" orientation="right" tick={{fontSize:9,fill:T.textMut}}/>
          <Tooltip contentStyle={{fontFamily:T.mono,fontSize:10}}/>
          <Line yAxisId="l" type="monotone" dataKey="price" stroke={T.gold} strokeWidth={2} dot={{r:3}} name="Price ($/kg)"/>
          <Line yAxisId="r" type="monotone" dataKey="idx" stroke={T.navy} strokeWidth={2} dot={{r:3}} name="Price Index"/>
          <Legend wrapperStyle={{fontSize:10}}/>
        </LineChart>
      </ResponsiveContainer>
      <div style={{marginTop:12}}>
        <div style={{fontSize:11,fontFamily:T.mono,color:T.textMut,marginBottom:6}}>SOURCE COUNTRY BREAKDOWN</div>
        <div style={{overflowX:'auto'}}>
          <table style={{width:'100%',borderCollapse:'collapse',fontSize:10,fontFamily:T.mono}}>
            <thead><tr>
              {['Country','Market Share','Conflict Score','Gov Score','Env Risk','Labour Risk','Flag'].map(h=>(
                <th key={h} style={{textAlign:'left',padding:'3px 6px',borderBottom:`1px solid ${T.border}`,color:T.textMut,fontSize:9}}>{h}</th>
              ))}
            </tr></thead>
            <tbody>{selM.countries.map((c,j)=>(
              <tr key={j} style={{borderBottom:`1px solid ${T.border}`}}>
                <td style={{padding:'3px 6px',fontWeight:600,color:T.text}}>{c.country}</td>
                <td style={{padding:'3px 6px',color:T.textSec}}>{c.share}%</td>
                <td style={{padding:'3px 6px',color:riskColor(c.conflictScore)}}>{c.conflictScore.toFixed(0)}</td>
                <td style={{padding:'3px 6px',color:riskColor(100-c.govScore)}}>{c.govScore.toFixed(0)}</td>
                <td style={{padding:'3px 6px',color:riskColor(c.envRisk)}}>{c.envRisk.toFixed(0)}</td>
                <td style={{padding:'3px 6px',color:riskColor(c.labourRisk)}}>{c.labourRisk.toFixed(0)}</td>
                <td style={{padding:'3px 6px'}}><Badge text={c.conflictScore>60?'Conflict':'Stable'} color={c.conflictScore>60?T.red:T.green}/></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </div>
    </Card>}
    {!selM&&<div style={{fontSize:11,color:T.textMut,fontStyle:'italic',padding:8}}>Click a mineral in the table or bar chart above to view price trends and country breakdown.</div>}

    {/* Exposure Heatmap (top 30 companies x 12 minerals) */}
    <Card title="Company-Mineral Exposure Heatmap (Top 30 Companies x 12 Minerals)">
      <div style={{overflowX:'auto'}}>
        <table style={{width:'100%',borderCollapse:'collapse',fontSize:10,fontFamily:T.mono}}>
          <thead><tr>
            <th style={{textAlign:'left',padding:'4px 6px',borderBottom:`1px solid ${T.border}`,color:T.textMut,position:'sticky',left:0,background:T.surface,minWidth:110}}>Company</th>
            {MINERALS.map(m=><th key={m.id} style={{padding:'4px 3px',borderBottom:`1px solid ${T.border}`,color:T.textMut,fontSize:9,writingMode:'vertical-lr',height:55}}>{m.sym}</th>)}
            <th style={{padding:'4px 6px',borderBottom:`1px solid ${T.border}`,color:T.textMut,fontSize:9}}>Total</th>
          </tr></thead>
          <tbody>{companies.slice(0,30).map((c,ri)=>(
            <tr key={ri} style={{cursor:'pointer',background:selCompany===ri?T.surfaceH:'transparent'}} onClick={()=>setSelCompany(ri)}>
              <td style={{padding:'3px 6px',borderBottom:`1px solid ${T.border}`,fontWeight:500,color:T.text,position:'sticky',left:0,background:selCompany===ri?T.surfaceH:T.surface,fontSize:10,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis',maxWidth:120}}>{c.name}</td>
              {c.exposure.map((e,ei)=>{
                const bg=e.level>0?`rgba(220,38,38,${Math.min(e.level/100,0.8)})`:'transparent';
                return <td key={ei} style={{padding:2,borderBottom:`1px solid ${T.border}`,textAlign:'center',background:bg,color:e.level>50?'#fff':T.textMut,fontSize:9}}>{e.level>0?e.level.toFixed(0):''}</td>;
              })}
              <td style={{padding:'3px 6px',borderBottom:`1px solid ${T.border}`,fontWeight:700,color:T.navy}}>{c.totalExposure}</td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </Card>

    {/* Selected Company Profile */}
    {selC&&<Card title={`${selC.name} -- Mineral Dependency Profile`}>
      <div style={{display:'flex',gap:8,marginBottom:10,flexWrap:'wrap'}}>
        <Badge text={`Sector: ${selC.sector}`}/><Badge text={`Country: ${selC.country}`}/>
        <Badge text={`Minerals: ${selC.totalExposure}`} color={selC.totalExposure>6?T.red:T.amber}/>
        <Badge text={`DD Score: ${selC.ddScore}`} color={riskColor(100-selC.ddScore)}/>
        <Badge text={`Risk: ${selC.riskLevel}`} color={riskColor(selC.riskLevel==='Critical'?90:selC.riskLevel==='High'?70:40)}/>
        <Badge text={`Supply Chain: ${selC.supplyChainScore}`}/>
        <Badge text={`T1 Suppliers: ${selC.tier1Suppliers}`}/>
        <Badge text={`Revenue: $${fmt(selC.revenue)}`}/>
        <Badge text={`Employees: ${fmt(selC.employees)}`}/>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'2fr 1fr',gap:14}}>
        <div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={selC.exposure.filter(e=>e.level>0)} margin={{left:10,right:10,top:5,bottom:5}}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
              <XAxis dataKey="name" tick={{fontSize:9,fill:T.textSec}}/>
              <YAxis domain={[0,100]} tick={{fontSize:9,fill:T.textMut}}/>
              <Tooltip contentStyle={{fontFamily:T.mono,fontSize:10}}/>
              <Bar dataKey="level" name="Exposure Level" radius={[4,4,0,0]}>
                {selC.exposure.filter(e=>e.level>0).map((e,i)=><Cell key={i} fill={riskColor(e.level)}/>)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={{display:'flex',flexDirection:'column',gap:6}}>
          <div style={{fontSize:10,fontFamily:T.mono,color:T.textMut,marginBottom:2}}>COMPLIANCE STATUS</div>
          <div style={{padding:'4px 8px',background:T.surfaceH,borderRadius:3,fontSize:10}}>
            <span style={{color:T.textSec}}>Dodd-Frank 1502: </span>
            <Badge text={selC.doddFrank?'Filed':'Not Filed'} color={selC.doddFrank?T.green:T.red}/>
          </div>
          <div style={{padding:'4px 8px',background:T.surfaceH,borderRadius:3,fontSize:10}}>
            <span style={{color:T.textSec}}>EU CRMA: </span>
            <Badge text={selC.euCrma?'Compliant':'Gap'} color={selC.euCrma?T.green:T.red}/>
          </div>
          <div style={{padding:'4px 8px',background:T.surfaceH,borderRadius:3,fontSize:10}}>
            <span style={{color:T.textSec}}>OECD Step: </span>
            <Badge text={`${selC.oecdStep}/5`} color={selC.oecdStep>=4?T.green:selC.oecdStep>=3?T.amber:T.red}/>
          </div>
          <div style={{padding:'4px 8px',background:T.surfaceH,borderRadius:3,fontSize:10}}>
            <span style={{color:T.textSec}}>Filing: </span>
            <Badge text={selC.filingStatus} color={selC.filingStatus==='Filed'?T.green:selC.filingStatus==='Overdue'?T.red:T.amber}/>
          </div>
          <div style={{padding:'4px 8px',background:T.surfaceH,borderRadius:3,fontSize:10}}>
            <span style={{color:T.textSec}}>SC Visibility: </span>
            <span style={{fontFamily:T.mono,fontWeight:600,color:selC.supplyChainScore>60?T.green:T.amber}}>{selC.supplyChainScore}%</span>
          </div>
          <div style={{padding:'4px 8px',background:T.surfaceH,borderRadius:3,fontSize:10}}>
            <span style={{color:T.textSec}}>DD Gaps: </span>
            <span style={{fontFamily:T.mono,fontWeight:600,color:selC.gaps>3?T.red:T.textSec}}>{selC.gaps}</span>
          </div>
        </div>
      </div>
    </Card>}

    {/* Geopolitical Risk by Country */}
    <Card title="Geopolitical Risk Assessment -- Top Source Countries (25)">
      <div style={{overflowX:'auto',maxHeight:280,overflowY:'auto'}}>
        <table style={{width:'100%',borderCollapse:'collapse',fontSize:10,fontFamily:T.mono}}>
          <thead><tr style={{position:'sticky',top:0,background:T.surface}}>
            {['Country','Key Minerals','Market Share','Conflict Score','Governance','Env Risk','Labour Risk','Overall Risk'].map(h=>(
              <th key={h} style={{textAlign:'left',padding:'4px 6px',borderBottom:`2px solid ${T.border}`,color:T.textMut,fontSize:9}}>{h}</th>
            ))}
          </tr></thead>
          <tbody>{COUNTRIES.map((country,ci)=>{
            const cMinerals=minerals.filter(m=>m.countries.some(c=>c.country===country));
            const conflictAvg=cMinerals.length>0?cMinerals.reduce((s,m)=>{const c=m.countries.find(c=>c.country===country);return s+(c?c.conflictScore:0);},0)/cMinerals.length:0;
            const govAvg=cMinerals.length>0?cMinerals.reduce((s,m)=>{const c=m.countries.find(c=>c.country===country);return s+(c?c.govScore:0);},0)/cMinerals.length:0;
            const envAvg=sn(ci*3000+1,20,80);
            const labAvg=sn(ci*3000+2,15,75);
            const overall=(conflictAvg*0.3+((100-govAvg)*0.25)+(envAvg*0.25)+(labAvg*0.2));
            const shareAvg=cMinerals.length>0?cMinerals.reduce((s,m)=>{const c=m.countries.find(c=>c.country===country);return s+(c?c.share:0);},0)/cMinerals.length:0;
            return (
              <tr key={ci} style={{borderBottom:`1px solid ${T.border}`,background:ci%2?T.surfaceH:'transparent'}}>
                <td style={{padding:'3px 6px',fontWeight:600,color:T.text}}>{country}</td>
                <td style={{padding:'3px 6px',color:T.textSec,fontSize:9}}>{cMinerals.slice(0,3).map(m=>m.sym).join(', ')||'--'}</td>
                <td style={{padding:'3px 6px',color:T.textSec}}>{shareAvg>0?shareAvg.toFixed(1)+'%':'--'}</td>
                <td style={{padding:'3px 6px',color:riskColor(conflictAvg),fontWeight:600}}>{conflictAvg>0?conflictAvg.toFixed(0):'--'}</td>
                <td style={{padding:'3px 6px',color:riskColor(100-govAvg)}}>{govAvg>0?govAvg.toFixed(0):'--'}</td>
                <td style={{padding:'3px 6px',color:riskColor(envAvg)}}>{envAvg.toFixed(0)}</td>
                <td style={{padding:'3px 6px',color:riskColor(labAvg)}}>{labAvg.toFixed(0)}</td>
                <td style={{padding:'3px 6px'}}><Badge text={overall>60?'High':overall>40?'Medium':'Low'} color={riskColor(overall)}/></td>
              </tr>
            );
          })}</tbody>
        </table>
      </div>
    </Card>

    {/* Sector Exposure Summary */}
    <Card title="Sector Mineral Exposure Summary">
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))',gap:8}}>
        {['Automotive','Electronics','Mining','Battery','Industrial','Semiconductor','Components','Chemicals'].map((sector,si2)=>{
          const sectorCos=companies.filter(c=>c.sector===sector);
          const avgExp=sectorCos.length>0?+(sectorCos.reduce((s,c)=>s+c.totalExposure,0)/sectorCos.length).toFixed(1):0;
          const avgDD=sectorCos.length>0?+(sectorCos.reduce((s,c)=>s+c.ddScore,0)/sectorCos.length).toFixed(1):0;
          const highRisk=sectorCos.filter(c=>c.riskLevel==='High'||c.riskLevel==='Critical').length;
          return (
            <div key={si2} style={{padding:'8px 10px',background:T.surfaceH,borderRadius:4,border:`1px solid ${T.border}`,borderLeft:`3px solid ${highRisk>3?T.red:highRisk>1?T.amber:T.sage}`}}>
              <div style={{fontSize:11,fontWeight:600,color:T.text}}>{sector}</div>
              <div style={{fontSize:10,color:T.textSec,marginTop:3,fontFamily:T.mono}}>
                {sectorCos.length} companies | Avg exposure: {avgExp} minerals
              </div>
              <div style={{fontSize:10,color:T.textSec,fontFamily:T.mono}}>
                Avg DD: {avgDD} | High-risk: {highRisk}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  </div>);
};

/* ═══════════════════════════════════════════════════════════════════ */
/*  TAB 2: DUE DILIGENCE & COMPLIANCE                                */
/* ═══════════════════════════════════════════════════════════════════ */
const DueDiligenceCompliance=({companies,smelters})=>{
  const [ddTarget,setDdTarget]=useState(null);
  const [ddResult,setDdResult]=useState(null);
  const [compFilter,setCompFilter]=useState('All');

  const oecdSteps=['1. Management Systems','2. Identify Risks','3. Risk Strategy','4. Third-Party Audit','5. Report on DD'];
  const euChecklist=['Strategic mineral list alignment','Supply chain mapping completed','Risk assessment documented','Recycling targets set','Annual reporting submitted','Monitoring system in place','Substitution analysis done','Stockpiling strategy defined'];

  const complianceSummary=useMemo(()=>{
    const filed=companies.filter(c=>c.filingStatus==='Filed').length;
    const pending=companies.filter(c=>c.filingStatus==='Pending').length;
    const overdue=companies.filter(c=>c.filingStatus==='Overdue').length;
    const exempt=companies.filter(c=>c.filingStatus==='Exempt').length;
    return {filed,pending,overdue,exempt};
  },[companies]);

  const rmapStats=useMemo(()=>{
    const conformant=smelters.filter(s=>s.cert==='RMAP Conformant').length;
    const active=smelters.filter(s=>s.cert==='RMAP Active').length;
    const review=smelters.filter(s=>s.cert==='Under Review').length;
    const notCert=smelters.filter(s=>s.cert==='Not Certified').length;
    const pending=smelters.filter(s=>s.cert==='Pending Audit').length;
    return [{name:'Conformant',val:conformant,color:T.green},{name:'Active',val:active,color:T.sage},{name:'Under Review',val:review,color:T.amber},{name:'Not Certified',val:notCert,color:T.red},{name:'Pending',val:pending,color:T.textMut}];
  },[smelters]);

  const cahraList=useMemo(()=>smelters.filter(s=>s.cahra),[smelters]);

  const filteredCompanies=useMemo(()=>{
    if(compFilter==='All')return companies;
    return companies.filter(c=>c.filingStatus===compFilter);
  },[companies,compFilter]);

  const oecdDistribution=useMemo(()=>{
    const dist=[0,0,0,0,0];
    companies.forEach(c=>{if(c.oecdStep>=1&&c.oecdStep<=5)dist[c.oecdStep-1]++;});
    return oecdSteps.map((s,i)=>({step:s,count:dist[i]}));
  },[companies]);

  const runDD=useCallback(()=>{
    if(ddTarget===null)return;
    const c=companies[ddTarget];
    const gaps=[];
    if(c.oecdStep<3)gaps.push('OECD step 1-2 incomplete: management systems and risk identification insufficient');
    if(!c.doddFrank)gaps.push('Dodd-Frank 1502 filing not submitted or overdue');
    if(!c.euCrma)gaps.push('EU CRMA compliance checklist incomplete');
    if(c.gaps>3)gaps.push(`${c.gaps} supply chain documentation gaps identified`);
    if(c.ddScore<50)gaps.push('Overall due diligence score below acceptable threshold (50)');
    if(c.supplyChainScore<40)gaps.push('Supply chain visibility score critically low');
    if(c.tier1Suppliers>50&&c.ddScore<60)gaps.push('Large supplier base with inadequate oversight');
    const strongAreas=[];
    if(c.oecdStep>=4)strongAreas.push('Third-party audit completed (OECD Step 4)');
    if(c.doddFrank)strongAreas.push('Dodd-Frank Section 1502 filing current');
    if(c.euCrma)strongAreas.push('EU CRMA compliance progressing');
    if(c.ddScore>70)strongAreas.push('Strong overall due diligence posture');
    if(c.supplyChainScore>70)strongAreas.push('Good supply chain visibility and traceability');
    const recommendations=[];
    if(c.oecdStep<5)recommendations.push(`Advance from OECD Step ${c.oecdStep} to Step ${c.oecdStep+1}`);
    if(c.gaps>0)recommendations.push(`Close ${c.gaps} documentation gaps within 90 days`);
    if(!c.euCrma)recommendations.push('Complete EU CRMA compliance checklist');
    if(c.supplyChainScore<60)recommendations.push('Invest in supply chain mapping technology');
    setDdResult({company:c.name,score:c.ddScore,riskLevel:c.riskLevel,oecdStep:c.oecdStep,gaps,strongAreas,recommendations,timestamp:new Date().toISOString().split('T')[0]});
  },[ddTarget,companies]);

  return (<div style={{display:'flex',flexDirection:'column',gap:14}}>
    <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:10}}>
      <Card><KPI label="Filed (Dodd-Frank)" value={complianceSummary.filed} color={T.green}/></Card>
      <Card><KPI label="Pending Filings" value={complianceSummary.pending} color={T.amber}/></Card>
      <Card><KPI label="Overdue Filings" value={complianceSummary.overdue} color={T.red}/></Card>
      <Card><KPI label="RMAP Conformant" value={rmapStats[0].val} sub={`of ${smelters.length} smelters`} color={T.green}/></Card>
      <Card><KPI label="CAHRA Flagged" value={cahraList.length} sub="conflict zone smelters" color={T.red}/></Card>
    </div>

    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
      {/* OECD Distribution */}
      <Card title="OECD 5-Step Due Diligence -- Company Distribution">
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={oecdDistribution} margin={{left:10,right:10,top:5,bottom:5}}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
            <XAxis dataKey="step" tick={{fontSize:8,fill:T.textSec}} angle={-10} textAnchor="end" height={50}/>
            <YAxis tick={{fontSize:9,fill:T.textMut}}/>
            <Tooltip contentStyle={{fontFamily:T.mono,fontSize:10}}/>
            <Bar dataKey="count" name="Companies" fill={T.navyL} radius={[4,4,0,0]}/>
          </BarChart>
        </ResponsiveContainer>
      </Card>
      {/* RMAP Status Pie */}
      <Card title="Smelter RMAP Certification Status">
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie data={rmapStats} dataKey="val" nameKey="name" cx="50%" cy="50%" outerRadius={85} label={({name,val})=>`${name}: ${val}`} labelLine={{stroke:T.textMut}} style={{fontSize:9}}>
              {rmapStats.map((s,i)=><Cell key={i} fill={s.color}/>)}
            </Pie>
            <Tooltip contentStyle={{fontFamily:T.mono,fontSize:10}}/>
            <Legend wrapperStyle={{fontSize:10}}/>
          </PieChart>
        </ResponsiveContainer>
      </Card>
    </div>

    {/* OECD step progress per company */}
    <Card title="OECD 5-Step Progress by Company (Top 15)">
      <div style={{display:'flex',flexDirection:'column',gap:6}}>
        {companies.slice(0,15).map((c,i)=>(
          <div key={i} style={{display:'flex',alignItems:'center',gap:8,fontSize:10}}>
            <span style={{width:110,fontWeight:500,color:T.text,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{c.name}</span>
            <div style={{flex:1,display:'flex',gap:2}}>
              {oecdSteps.map((_,si)=>(
                <div key={si} style={{flex:1,height:14,borderRadius:2,background:si<c.oecdStep?T.sage:T.surfaceH,border:`1px solid ${T.border}`,position:'relative'}}>
                  {si<c.oecdStep&&<div style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',fontSize:7,color:'#fff',fontWeight:700}}>S{si+1}</div>}
                </div>
              ))}
            </div>
            <Badge text={`Step ${c.oecdStep}`} color={c.oecdStep>=4?T.green:c.oecdStep>=3?T.amber:T.red}/>
          </div>
        ))}
      </div>
    </Card>

    {/* Dodd-Frank Filing Tracker with filter */}
    <Card title="Dodd-Frank Section 1502 Filing Tracker">
      <div style={{display:'flex',gap:6,marginBottom:8}}>
        {['All','Filed','Pending','Overdue','Exempt','N/A'].map(f=>(
          <button key={f} onClick={()=>setCompFilter(f)} style={{padding:'3px 10px',borderRadius:4,fontSize:10,fontFamily:T.mono,border:`1px solid ${compFilter===f?T.gold:T.border}`,background:compFilter===f?T.gold+'20':'transparent',color:compFilter===f?T.navy:T.textMut,cursor:'pointer'}}>{f}</button>
        ))}
      </div>
      <div style={{overflowX:'auto',maxHeight:240,overflowY:'auto'}}>
        <table style={{width:'100%',borderCollapse:'collapse',fontSize:10,fontFamily:T.mono}}>
          <thead><tr style={{position:'sticky',top:0,background:T.surface}}>
            {['Company','Sector','Revenue','Filing','DD Score','OECD','EU CRMA','SC Score','Gaps'].map(h=><th key={h} style={{textAlign:'left',padding:'4px 6px',borderBottom:`2px solid ${T.border}`,color:T.textMut,fontSize:9}}>{h}</th>)}
          </tr></thead>
          <tbody>{filteredCompanies.slice(0,50).map((c,i)=>(
            <tr key={i} style={{borderBottom:`1px solid ${T.border}`,background:i%2?T.surfaceH:'transparent'}}>
              <td style={{padding:'3px 6px',fontWeight:500,color:T.text}}>{c.name}</td>
              <td style={{padding:'3px 6px',color:T.textSec}}>{c.sector}</td>
              <td style={{padding:'3px 6px',color:T.textSec}}>${fmt(c.revenue)}</td>
              <td style={{padding:'3px 6px'}}><Badge text={c.filingStatus} color={c.filingStatus==='Filed'?T.green:c.filingStatus==='Overdue'?T.red:T.amber}/></td>
              <td style={{padding:'3px 6px',color:riskColor(100-c.ddScore),fontWeight:600}}>{c.ddScore}</td>
              <td style={{padding:'3px 6px',color:T.textSec}}>{c.oecdStep}/5</td>
              <td style={{padding:'3px 6px'}}><Badge text={c.euCrma?'Yes':'Gap'} color={c.euCrma?T.green:T.red}/></td>
              <td style={{padding:'3px 6px',color:c.supplyChainScore<40?T.red:T.textSec}}>{c.supplyChainScore}</td>
              <td style={{padding:'3px 6px',color:c.gaps>3?T.red:T.textSec}}>{c.gaps}</td>
            </tr>
          ))}</tbody>
        </table>
      </div>
      <div style={{fontSize:9,color:T.textMut,marginTop:4}}>Showing {filteredCompanies.slice(0,50).length} of {filteredCompanies.length} companies</div>
    </Card>

    {/* EU CRMA Checklist */}
    <Card title="EU Critical Raw Materials Act -- Compliance Checklist">
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:8}}>
        {euChecklist.map((item,i)=>{
          const pct=si(i*777+1,30,100);
          return (<div key={i} style={{padding:'8px 10px',background:T.surfaceH,borderRadius:4,borderLeft:`3px solid ${pct>70?T.green:pct>40?T.amber:T.red}`}}>
            <div style={{fontSize:10,color:T.text,fontWeight:500,marginBottom:4}}>{item}</div>
            <div style={{height:6,background:T.border,borderRadius:3,overflow:'hidden'}}>
              <div style={{height:'100%',width:`${pct}%`,background:pct>70?T.green:pct>40?T.amber:T.red,borderRadius:3}}/>
            </div>
            <div style={{fontSize:9,color:T.textMut,marginTop:2,fontFamily:T.mono}}>{pct}% complete</div>
          </div>);
        })}
      </div>
    </Card>

    {/* CAHRA List */}
    <Card title="Conflict-Affected & High-Risk Areas (CAHRA) Smelters">
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))',gap:6}}>
        {cahraList.map((s,i)=>(
          <div key={i} style={{padding:'6px 10px',background:`${T.red}08`,border:`1px solid ${T.red}30`,borderRadius:4,fontSize:10}}>
            <div style={{fontWeight:600,color:T.text}}>{s.name}</div>
            <div style={{color:T.textSec,marginTop:2}}>{s.country} | {s.mineral} | Risk: {s.riskScore} | Tier {s.tier}</div>
            <div style={{display:'flex',gap:4,marginTop:3}}>
              <Badge text={s.cert} color={s.cert==='Not Certified'?T.red:T.amber}/>
              <Badge text={`Audit: ${s.lastAudit}`}/>
            </div>
          </div>
        ))}
      </div>
    </Card>

    {/* Run DD Assessment */}
    <Card title="Run Due Diligence Assessment">
      <div style={{display:'flex',gap:10,alignItems:'center',marginBottom:10}}>
        <select value={ddTarget??''} onChange={e=>setDdTarget(e.target.value===''?null:+e.target.value)} style={{padding:'6px 10px',borderRadius:4,border:`1px solid ${T.border}`,fontFamily:T.font,fontSize:11,flex:1}}>
          <option value="">Select company for DD assessment...</option>
          {companies.slice(0,50).map((c,i)=><option key={i} value={i}>{c.name} ({c.sector})</option>)}
        </select>
        <button onClick={runDD} style={{padding:'6px 16px',borderRadius:4,background:T.navy,color:'#fff',border:'none',fontFamily:T.font,fontSize:11,fontWeight:600,cursor:'pointer',opacity:ddTarget===null?0.4:1}}>Run DD Assessment</button>
      </div>
      {ddResult&&<div style={{padding:12,background:T.surfaceH,borderRadius:6,border:`1px solid ${T.border}`}}>
        <div style={{fontSize:13,fontWeight:700,color:T.text,marginBottom:8}}>{ddResult.company} -- DD Assessment ({ddResult.timestamp})</div>
        <div style={{display:'flex',gap:10,marginBottom:8,flexWrap:'wrap'}}>
          <Badge text={`Score: ${ddResult.score}`} color={riskColor(100-ddResult.score)}/>
          <Badge text={`Risk: ${ddResult.riskLevel}`} color={riskColor(ddResult.riskLevel==='Critical'?90:ddResult.riskLevel==='High'?70:40)}/>
          <Badge text={`OECD Step: ${ddResult.oecdStep}/5`}/>
        </div>
        {ddResult.gaps.length>0&&<div style={{marginBottom:8}}>
          <div style={{fontSize:10,fontFamily:T.mono,color:T.red,fontWeight:600,marginBottom:4}}>GAPS ({ddResult.gaps.length})</div>
          {ddResult.gaps.map((g,i)=><div key={i} style={{fontSize:10,color:T.textSec,padding:'2px 0',paddingLeft:10,borderLeft:`2px solid ${T.red}`}}>{g}</div>)}
        </div>}
        {ddResult.strongAreas.length>0&&<div style={{marginBottom:8}}>
          <div style={{fontSize:10,fontFamily:T.mono,color:T.green,fontWeight:600,marginBottom:4}}>STRONG AREAS ({ddResult.strongAreas.length})</div>
          {ddResult.strongAreas.map((s,i)=><div key={i} style={{fontSize:10,color:T.textSec,padding:'2px 0',paddingLeft:10,borderLeft:`2px solid ${T.green}`}}>{s}</div>)}
        </div>}
        {ddResult.recommendations.length>0&&<div>
          <div style={{fontSize:10,fontFamily:T.mono,color:T.navy,fontWeight:600,marginBottom:4}}>RECOMMENDATIONS ({ddResult.recommendations.length})</div>
          {ddResult.recommendations.map((r,i)=><div key={i} style={{fontSize:10,color:T.textSec,padding:'2px 0',paddingLeft:10,borderLeft:`2px solid ${T.gold}`}}>{r}</div>)}
        </div>}
      </div>}
    </Card>
  </div>);
};

/* ═══════════════════════════════════════════════════════════════════ */
/*  TAB 3: SUPPLY CHAIN MAPPING                                       */
/* ═══════════════════════════════════════════════════════════════════ */
const SupplyChainMapping=({smelters,minerals,recycling})=>{
  const [removedSmelter,setRemovedSmelter]=useState(null);
  const [showImpact,setShowImpact]=useState(false);
  const [smelterFilter,setSmelterFilter]=useState('All');

  const tiers=useMemo(()=>[
    {label:'Tier 4: Mines',count:si(8001,60,120),icon:'M',desc:'Extraction sites'},
    {label:'Tier 3: Smelters',count:smelters.length,icon:'S',desc:'Processing facilities'},
    {label:'Tier 2: Components',count:si(8002,80,200),icon:'C',desc:'Component manufacturers'},
    {label:'Tier 1: OEMs',count:si(8003,30,80),icon:'O',desc:'Original equipment makers'},
  ],[smelters]);

  const tierConcentration=useMemo(()=>tiers.map((t,i)=>({
    tier:t.label.split(':')[0],hhi:si(i*900+1,1500,7000),topShare:sn(i*900+2,25,70),entities:t.count,
  })),[tiers]);

  const filteredSmelters=useMemo(()=>{
    if(smelterFilter==='All')return smelters;
    if(smelterFilter==='CAHRA')return smelters.filter(s=>s.cahra);
    if(smelterFilter==='Certified')return smelters.filter(s=>s.cert==='RMAP Conformant'||s.cert==='RMAP Active');
    if(smelterFilter==='Not Certified')return smelters.filter(s=>s.cert==='Not Certified');
    return smelters;
  },[smelters,smelterFilter]);

  const impactAnalysis=useMemo(()=>{
    if(removedSmelter===null||!showImpact)return null;
    const s=smelters[removedSmelter];
    const affectedCompanies=si(removedSmelter*1111+1,3,15);
    const capacityLoss=sn(removedSmelter*1111+2,5,25);
    const priceImpact=sn(removedSmelter*1111+3,2,18);
    const leadTime=si(removedSmelter*1111+4,3,18);
    const costIncrease=sn(removedSmelter*1111+5,1,12);
    const alternativeSmelters=smelters.filter((_,i)=>i!==removedSmelter&&smelters[i].mineralId===s.mineralId).slice(0,5);
    const riskMitigation=alternativeSmelters.length>2?'Manageable':'Severe';
    return {smelter:s,affectedCompanies,capacityLoss:+capacityLoss.toFixed(1),priceImpact:+priceImpact.toFixed(1),leadTime,costIncrease:+costIncrease.toFixed(1),alternativeSmelters,riskMitigation};
  },[removedSmelter,showImpact,smelters]);

  const recycleByMineral=useMemo(()=>minerals.map(m=>({
    name:m.sym,mineral:m.name,rate:m.recycRate,target:25,gap:Math.max(0,25-m.recycRate),
  })),[minerals]);

  const smelterByMineral=useMemo(()=>{
    const counts={};
    smelters.forEach(s=>{counts[s.mineral]=(counts[s.mineral]||0)+1;});
    return Object.entries(counts).map(([name,count])=>({name,count})).sort((a,b)=>b.count-a.count);
  },[smelters]);

  return (<div style={{display:'flex',flexDirection:'column',gap:14}}>
    {/* Supply Chain Visual Flow */}
    <Card title="Supply Chain Tiers -- Mine to OEM Flow">
      <div style={{display:'flex',justifyContent:'space-around',alignItems:'center',padding:'16px 0'}}>
        {tiers.map((t,i)=>(
          <React.Fragment key={i}>
            <div style={{textAlign:'center',padding:12,background:T.surfaceH,borderRadius:8,border:`1px solid ${T.border}`,minWidth:140}}>
              <div style={{fontSize:28,fontWeight:700,color:T.navy,fontFamily:T.mono}}>{t.icon}</div>
              <div style={{fontSize:11,fontWeight:600,color:T.text,marginTop:4}}>{t.label}</div>
              <div style={{fontSize:18,fontWeight:700,color:T.gold,fontFamily:T.mono,marginTop:4}}>{t.count}</div>
              <div style={{fontSize:9,color:T.textMut}}>{t.desc}</div>
            </div>
            {i<tiers.length-1&&<div style={{fontSize:24,color:T.gold,fontWeight:700}}>&#8594;</div>}
          </React.Fragment>
        ))}
      </div>
    </Card>

    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
      <Card title="Supply Chain Concentration by Tier">
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={tierConcentration} margin={{left:10,right:20,top:5,bottom:5}}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
            <XAxis dataKey="tier" tick={{fontSize:10,fill:T.textSec}}/>
            <YAxis tick={{fontSize:9,fill:T.textMut}}/>
            <Tooltip contentStyle={{fontFamily:T.mono,fontSize:10}}/>
            <Bar dataKey="hhi" name="HHI" fill={T.navy} radius={[4,4,0,0]}/>
            <Bar dataKey="topShare" name="Top Producer %" fill={T.gold} radius={[4,4,0,0]}/>
            <Legend wrapperStyle={{fontSize:10}}/>
          </BarChart>
        </ResponsiveContainer>
      </Card>
      <Card title="Smelters by Mineral Processed">
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={smelterByMineral} margin={{left:10,right:10,top:5,bottom:5}}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
            <XAxis dataKey="name" tick={{fontSize:8,fill:T.textSec}} angle={-15} textAnchor="end" height={45}/>
            <YAxis tick={{fontSize:9,fill:T.textMut}}/>
            <Tooltip contentStyle={{fontFamily:T.mono,fontSize:10}}/>
            <Bar dataKey="count" name="Smelters" fill={T.sage} radius={[4,4,0,0]}/>
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </div>

    {/* Smelter/Refiner Table */}
    <Card title={`Smelters & Refiners Registry (${filteredSmelters.length} shown)`}>
      <div style={{display:'flex',gap:6,marginBottom:8}}>
        {['All','CAHRA','Certified','Not Certified'].map(f=>(
          <button key={f} onClick={()=>setSmelterFilter(f)} style={{padding:'3px 10px',borderRadius:4,fontSize:10,fontFamily:T.mono,border:`1px solid ${smelterFilter===f?T.gold:T.border}`,background:smelterFilter===f?T.gold+'20':'transparent',color:smelterFilter===f?T.navy:T.textMut,cursor:'pointer'}}>{f}</button>
        ))}
      </div>
      <div style={{overflowX:'auto',maxHeight:300,overflowY:'auto'}}>
        <table style={{width:'100%',borderCollapse:'collapse',fontSize:10,fontFamily:T.mono}}>
          <thead><tr style={{position:'sticky',top:0,background:T.surface}}>
            {['#','Smelter/Refiner','Country','Mineral','Cert','Risk','CAHRA','Tier','Capacity','Employees','Upstream','Downstream','Audit'].map(h=><th key={h} style={{textAlign:'left',padding:'4px 5px',borderBottom:`2px solid ${T.border}`,color:T.textMut,fontSize:9}}>{h}</th>)}
          </tr></thead>
          <tbody>{filteredSmelters.map((s,i)=>(
            <tr key={i} style={{borderBottom:`1px solid ${T.border}`,background:i%2?T.surfaceH:'transparent'}}>
              <td style={{padding:'3px 5px',color:T.textMut}}>{s.id+1}</td>
              <td style={{padding:'3px 5px',fontWeight:500,color:T.text,maxWidth:160,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{s.name}</td>
              <td style={{padding:'3px 5px',color:T.textSec}}>{s.country}</td>
              <td style={{padding:'3px 5px',color:T.textSec}}>{s.mineral}</td>
              <td style={{padding:'3px 5px'}}><Badge text={s.cert.replace('RMAP ','')} color={s.cert==='RMAP Conformant'?T.green:s.cert==='Not Certified'?T.red:T.amber}/></td>
              <td style={{padding:'3px 5px',color:riskColor(s.riskScore),fontWeight:600}}>{s.riskScore}</td>
              <td style={{padding:'3px 5px'}}>{s.cahra?<Badge text="Yes" color={T.red}/>:<span style={{color:T.textMut}}>No</span>}</td>
              <td style={{padding:'3px 5px',color:T.textSec}}>T{s.tier}</td>
              <td style={{padding:'3px 5px',color:T.textSec}}>{fmt(s.capacity)}t</td>
              <td style={{padding:'3px 5px',color:T.textSec}}>{s.employees}</td>
              <td style={{padding:'3px 5px',color:T.textSec}}>{s.upstreamMines}</td>
              <td style={{padding:'3px 5px',color:T.textSec}}>{s.downstreamOEMs}</td>
              <td style={{padding:'3px 5px',color:T.textMut}}>{s.lastAudit}</td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </Card>

    {/* Alternative Sourcing Simulator */}
    <Card title="Alternative Sourcing Simulator -- Remove High-Risk Smelter">
      <div style={{display:'flex',gap:10,alignItems:'center',marginBottom:10}}>
        <select value={removedSmelter??''} onChange={e=>{setRemovedSmelter(e.target.value===''?null:+e.target.value);setShowImpact(false);}} style={{padding:'6px 10px',borderRadius:4,border:`1px solid ${T.border}`,fontFamily:T.font,fontSize:11,flex:1}}>
          <option value="">Select smelter to remove...</option>
          {smelters.map((s,i)=><option key={i} value={i}>{s.name} ({s.country} | {s.mineral} | Risk: {s.riskScore})</option>)}
        </select>
        <button onClick={()=>setShowImpact(true)} style={{padding:'6px 16px',borderRadius:4,background:T.red,color:'#fff',border:'none',fontFamily:T.font,fontSize:11,fontWeight:600,cursor:'pointer',opacity:removedSmelter===null?0.4:1}}>Analyze Impact</button>
      </div>
      {impactAnalysis&&<div style={{padding:12,background:`${T.red}06`,borderRadius:6,border:`1px solid ${T.red}25`}}>
        <div style={{fontSize:12,fontWeight:700,color:T.text,marginBottom:8}}>Impact: Removing "{impactAnalysis.smelter.name}" ({impactAnalysis.smelter.country})</div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:8,marginBottom:10}}>
          <div style={{textAlign:'center'}}><div style={{fontSize:18,fontWeight:700,color:T.red,fontFamily:T.mono}}>{impactAnalysis.affectedCompanies}</div><div style={{fontSize:9,color:T.textMut}}>Companies Hit</div></div>
          <div style={{textAlign:'center'}}><div style={{fontSize:18,fontWeight:700,color:T.amber,fontFamily:T.mono}}>{impactAnalysis.capacityLoss}%</div><div style={{fontSize:9,color:T.textMut}}>Capacity Loss</div></div>
          <div style={{textAlign:'center'}}><div style={{fontSize:18,fontWeight:700,color:T.red,fontFamily:T.mono}}>+{impactAnalysis.priceImpact}%</div><div style={{fontSize:9,color:T.textMut}}>Price Impact</div></div>
          <div style={{textAlign:'center'}}><div style={{fontSize:18,fontWeight:700,color:T.amber,fontFamily:T.mono}}>+{impactAnalysis.costIncrease}%</div><div style={{fontSize:9,color:T.textMut}}>Cost Increase</div></div>
          <div style={{textAlign:'center'}}><div style={{fontSize:18,fontWeight:700,color:T.navy,fontFamily:T.mono}}>{impactAnalysis.leadTime}mo</div><div style={{fontSize:9,color:T.textMut}}>Transition Time</div></div>
        </div>
        <Badge text={`Mitigation: ${impactAnalysis.riskMitigation}`} color={impactAnalysis.riskMitigation==='Manageable'?T.sage:T.red}/>
        {impactAnalysis.alternativeSmelters.length>0&&<div style={{marginTop:8}}>
          <div style={{fontSize:10,fontFamily:T.mono,color:T.sage,fontWeight:600,marginBottom:4}}>ALTERNATIVE SOURCES ({impactAnalysis.alternativeSmelters.length})</div>
          {impactAnalysis.alternativeSmelters.map((a,i)=>(
            <div key={i} style={{fontSize:10,color:T.textSec,padding:'3px 0',paddingLeft:10,borderLeft:`2px solid ${T.sage}`,display:'flex',gap:8}}>
              <span style={{fontWeight:500}}>{a.name}</span>
              <span>{a.country}</span>
              <Badge text={a.cert.replace('RMAP ','')} color={a.cert==='RMAP Conformant'?T.green:T.amber}/>
              <span>Risk: {a.riskScore}</span>
            </div>
          ))}
        </div>}
      </div>}
    </Card>

    {/* Recycling Rates */}
    <Card title="Recycling Rate by Mineral vs EU CRMA 25% Target">
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={recycleByMineral} margin={{left:10,right:20,top:5,bottom:5}}>
          <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
          <XAxis dataKey="name" tick={{fontSize:10,fill:T.textSec}}/>
          <YAxis domain={[0,80]} tick={{fontSize:9,fill:T.textMut}}/>
          <Tooltip contentStyle={{fontFamily:T.mono,fontSize:10}}/>
          <Bar dataKey="rate" name="Current Rate %" radius={[4,4,0,0]}>
            {recycleByMineral.map((m,i)=><Cell key={i} fill={m.rate>=25?T.green:m.rate>=15?T.amber:T.red}/>)}
          </Bar>
          <Bar dataKey="target" name="EU Target %" fill="transparent" stroke={T.navy} strokeWidth={2} strokeDasharray="4 4"/>
          <Legend wrapperStyle={{fontSize:10}}/>
        </BarChart>
      </ResponsiveContainer>
    </Card>

    {/* Recycling Facilities */}
    <Card title="Recycling Facilities (20)">
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(290px,1fr))',gap:8}}>
        {recycling.map((r,i)=>(
          <div key={i} style={{padding:'8px 10px',background:T.surfaceH,borderRadius:4,border:`1px solid ${T.border}`}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <span style={{fontSize:11,fontWeight:600,color:T.text}}>{r.name}</span>
              <Badge text={r.operational?'Operational':'Planned'} color={r.operational?T.green:T.amber}/>
            </div>
            <div style={{fontSize:10,color:T.textSec,marginTop:3}}>{r.tech} | {fmt(r.capacity)}t/yr | Recovery: {r.recoveryRate}%</div>
            <div style={{fontSize:9,color:T.textMut,marginTop:2}}>Built: {r.yearBuilt} | Investment: ${r.investmentM}M | CO2 saved: {fmt(r.co2Saved)}t/yr</div>
            <div style={{fontSize:9,color:T.textMut,marginTop:1}}>Minerals: {r.minerals.join(', ')}</div>
          </div>
        ))}
      </div>
    </Card>

    {/* Mine-to-OEM Traceability Detail */}
    <Card title="Mine-to-OEM Supply Chain Trace (Sample Paths)">
      <div style={{display:'flex',flexDirection:'column',gap:8}}>
        {[
          {mine:'Katanga Mine (DRC)',smelter:'Huayou Cobalt Refinery',component:'CATL Cell Division',oem:'Tesla',mineral:'Cobalt',risk:82},
          {mine:'Greenbushes (AUS)',smelter:'Tianqi Lithium Process',component:'Panasonic Energy',oem:'BMW',mineral:'Lithium',risk:35},
          {mine:'Bangka Island (IDN)',smelter:'PT Timah',component:'Foxconn',oem:'Apple',mineral:'Tin',risk:68},
          {mine:'Kipushi (DRC)',smelter:'Congo DongFang Mining',component:'LG Energy',oem:'GM',mineral:'Cobalt',risk:88},
          {mine:'Pilgangoora (AUS)',smelter:'Pilbara Spodumene',component:'SK Innovation',oem:'Ford',mineral:'Lithium',risk:28},
          {mine:'Norilsk (RUS)',smelter:'Norilsk Nickel Refinery',component:'Posco Chemical',oem:'Volkswagen',mineral:'Nickel',risk:75},
        ].map((path,pi)=>(
          <div key={pi} style={{display:'flex',alignItems:'center',gap:6,padding:'6px 10px',background:path.risk>70?`${T.red}06`:T.surfaceH,borderRadius:4,border:`1px solid ${path.risk>70?T.red+'30':T.border}`}}>
            <div style={{flex:1,fontSize:10}}>
              <span style={{fontWeight:600,color:T.text}}>{path.mine}</span>
              <span style={{color:T.gold,margin:'0 6px'}}>&#8594;</span>
              <span style={{color:T.textSec}}>{path.smelter}</span>
              <span style={{color:T.gold,margin:'0 6px'}}>&#8594;</span>
              <span style={{color:T.textSec}}>{path.component}</span>
              <span style={{color:T.gold,margin:'0 6px'}}>&#8594;</span>
              <span style={{fontWeight:600,color:T.text}}>{path.oem}</span>
            </div>
            <Badge text={path.mineral}/>
            <Badge text={`Risk: ${path.risk}`} color={riskColor(path.risk)}/>
          </div>
        ))}
      </div>
    </Card>

    {/* Smelter Country Distribution */}
    <Card title="Smelter Geographic Distribution">
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(130px,1fr))',gap:6}}>
        {(() => {
          const countryCounts={};
          smelters.forEach(s=>{countryCounts[s.country]=(countryCounts[s.country]||0)+1;});
          return Object.entries(countryCounts).sort((a,b)=>b[1]-a[1]).map(([country,count],gi)=>(
            <div key={gi} style={{padding:'6px 8px',background:T.surfaceH,borderRadius:4,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <span style={{fontSize:10,fontWeight:500,color:T.text}}>{country}</span>
              <span style={{fontSize:12,fontWeight:700,color:T.navy,fontFamily:T.mono}}>{count}</span>
            </div>
          ));
        })()}
      </div>
    </Card>
  </div>);
};

/* ═══════════════════════════════════════════════════════════════════ */
/*  TAB 4: STRATEGIC & FINANCIAL IMPACT                               */
/* ═══════════════════════════════════════════════════════════════════ */
const StrategicFinancialImpact=({minerals,companies})=>{
  const euTargets=[
    {metric:'Domestic Mining',current:sn(9001,3,8),target:10,unit:'%'},
    {metric:'Domestic Processing',current:sn(9002,15,30),target:40,unit:'%'},
    {metric:'Domestic Recycling',current:sn(9003,10,20),target:25,unit:'%'},
    {metric:'Single Country Cap',current:sn(9004,55,75),target:65,unit:'% max'},
  ];

  const substitutionData=useMemo(()=>MINERALS.slice(0,8).map((m,i)=>({
    mineral:m.name,feasibility:sn(i*600+1,10,85),costPremium:sn(i*600+2,5,60),timelineYrs:si(i*600+3,1,10),
    application:sp(['EV Batteries','Electronics','Magnets','Catalysts','Wiring','Industrial'],i*600+4),
    substitute:sp(['Sodium-ion','Iron phosphate','Aluminum','Synthetic','Recycled','Bio-based','Ceramic','Polymer'],i*600+5),
    trl:si(i*600+6,3,9),
  })),[]);

  const investmentData=useMemo(()=>Array.from({length:8},(_,i)=>({
    area:sp(['Mining Exploration','Processing Plants','Recycling Infra','R&D Substitution','Supply Chain Tech','Strategic Reserves','Workforce Training','Circular Economy'],i*700+1),
    invested:sn(i*700+2,200,5000),
    planned:sn(i*700+3,500,8000),
    roi:sn(i*700+4,3,22),
  })),[]);

  const circularData=useMemo(()=>minerals.map(m=>({
    name:m.sym,recycled:m.recycRate,virgin:100-m.recycRate,
  })),[minerals]);

  const priceVolImpact=useMemo(()=>companies.slice(0,20).map((c,i)=>({
    name:c.name.length>14?c.name.slice(0,14)+'..':c.name,
    impact:sn(i*800+1,0.5,8.5),minerals:c.totalExposure,revenue:c.revenue,
  })),[companies]);

  const yearlyTrend=useMemo(()=>Array.from({length:6},(_,i)=>({
    year:2020+i,mining:sn(i*950+1,2,10),processing:sn(i*950+2,10,38),recycling:sn(i*950+3,8,22),
  })),[]);

  const exportCSV=useCallback(()=>{
    const headers=['Mineral','Supply Risk','HHI','Price Volatility %','Recycling Rate %','Demand Growth %','Reserve Years','Classification','Sector','Top Producers'];
    const rows=minerals.map(m=>[m.name,m.supplyRisk,m.hhi,m.priceVol,m.recycRate,m.demandGrowth,m.reserveYrs,m.crit,m.sector,m.topProducers.join(';')].join(','));
    const csv=[headers.join(','),...rows].join('\n');
    const blob=new Blob([csv],{type:'text/csv'});
    const url=URL.createObjectURL(blob);
    const a=document.createElement('a');
    a.href=url;a.download='conflict_minerals_risk_report.csv';a.click();
    URL.revokeObjectURL(url);
  },[minerals]);

  return (<div style={{display:'flex',flexDirection:'column',gap:14}}>
    {/* EU CRMA Strategic Autonomy Targets */}
    <Card title="EU CRMA Strategic Autonomy Targets (2030)">
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12}}>
        {euTargets.map((t,i)=>(
          <div key={i} style={{padding:10,background:T.surfaceH,borderRadius:6,textAlign:'center'}}>
            <div style={{fontSize:11,color:T.textSec,fontWeight:500,marginBottom:6}}>{t.metric}</div>
            <div style={{position:'relative',height:90,width:90,margin:'0 auto'}}>
              <svg viewBox="0 0 36 36" style={{transform:'rotate(-90deg)'}}>
                <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke={T.border} strokeWidth="3"/>
                <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke={t.current>=t.target?T.green:T.amber} strokeWidth="3" strokeDasharray={`${(t.current/100)*100}, 100`}/>
              </svg>
              <div style={{position:'absolute',top:'50%',left:'50%',transform:'translate(-50%,-50%)',fontFamily:T.mono,fontSize:14,fontWeight:700,color:T.navy}}>{t.current.toFixed(1)}%</div>
            </div>
            <div style={{fontSize:10,color:T.textMut,marginTop:4,fontFamily:T.mono}}>Target: {t.target}{t.unit}</div>
            <Badge text={t.current>=t.target?'On Track':'Behind'} color={t.current>=t.target?T.green:T.amber}/>
          </div>
        ))}
      </div>
    </Card>

    {/* EU CRMA Progress Trend */}
    <Card title="EU Strategic Autonomy Progress (2020-2025)">
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={yearlyTrend} margin={{left:10,right:20,top:5,bottom:5}}>
          <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
          <XAxis dataKey="year" tick={{fontSize:10,fill:T.textSec}}/>
          <YAxis domain={[0,45]} tick={{fontSize:9,fill:T.textMut}} label={{value:'%',angle:-90,position:'insideLeft',fontSize:10}}/>
          <Tooltip contentStyle={{fontFamily:T.mono,fontSize:10}}/>
          <Line type="monotone" dataKey="mining" stroke={T.navy} strokeWidth={2} dot={{r:3}} name="Mining %"/>
          <Line type="monotone" dataKey="processing" stroke={T.sage} strokeWidth={2} dot={{r:3}} name="Processing %"/>
          <Line type="monotone" dataKey="recycling" stroke={T.gold} strokeWidth={2} dot={{r:3}} name="Recycling %"/>
          <Legend wrapperStyle={{fontSize:10}}/>
        </LineChart>
      </ResponsiveContainer>
    </Card>

    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
      {/* Price Volatility Impact */}
      <Card title="Price Volatility Impact on Portfolio (Top 20)">
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={priceVolImpact} layout="vertical" margin={{left:90,right:20,top:5,bottom:5}}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
            <XAxis type="number" tick={{fontSize:9,fill:T.textSec}} label={{value:'Cost Impact %',position:'bottom',fontSize:10,fill:T.textMut}}/>
            <YAxis type="category" dataKey="name" tick={{fontSize:9,fill:T.text}} width={85}/>
            <Tooltip contentStyle={{fontFamily:T.mono,fontSize:10}} formatter={(v)=>`${v.toFixed(1)}%`}/>
            <Bar dataKey="impact" name="Cost Impact %" radius={[0,4,4,0]}>
              {priceVolImpact.map((p,i)=><Cell key={i} fill={p.impact>5?T.red:p.impact>3?T.amber:T.sage}/>)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* Substitution Analysis */}
      <Card title="Mineral Substitution Feasibility Analysis">
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={substitutionData} margin={{left:10,right:20,top:5,bottom:5}}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
            <XAxis dataKey="mineral" tick={{fontSize:8,fill:T.textSec}} angle={-10} textAnchor="end" height={40}/>
            <YAxis tick={{fontSize:9,fill:T.textMut}}/>
            <Tooltip contentStyle={{fontFamily:T.mono,fontSize:10}}/>
            <Bar dataKey="feasibility" name="Feasibility %" fill={T.sage} radius={[4,4,0,0]}/>
            <Bar dataKey="costPremium" name="Cost Premium %" fill={T.amber} radius={[4,4,0,0]}/>
            <Legend wrapperStyle={{fontSize:10}}/>
          </BarChart>
        </ResponsiveContainer>
        <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:4,marginTop:6}}>
          {substitutionData.map((s,i)=>(
            <div key={i} style={{fontSize:9,padding:'3px 6px',background:T.surfaceH,borderRadius:3,display:'flex',justifyContent:'space-between'}}>
              <span><span style={{fontWeight:600,color:T.text}}>{s.mineral}</span> <span style={{color:T.textMut}}>-&gt; {s.substitute}</span></span>
              <span style={{color:T.textSec}}>TRL-{s.trl} | {s.timelineYrs}yr | {s.application}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>

    {/* Investment */}
    <Card title="Investment in Critical Mineral Supply Chains ($M)">
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={investmentData} margin={{left:10,right:20,top:5,bottom:5}}>
          <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
          <XAxis dataKey="area" tick={{fontSize:8,fill:T.textSec}} angle={-15} textAnchor="end" height={50}/>
          <YAxis tick={{fontSize:9,fill:T.textMut}}/>
          <Tooltip contentStyle={{fontFamily:T.mono,fontSize:10}} formatter={(v)=>`$${v.toFixed(0)}M`}/>
          <Bar dataKey="invested" name="Invested" fill={T.navy} radius={[4,4,0,0]}/>
          <Bar dataKey="planned" name="Planned" fill={T.goldL} radius={[4,4,0,0]}/>
          <Legend wrapperStyle={{fontSize:10}}/>
        </BarChart>
      </ResponsiveContainer>
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:6,marginTop:8}}>
        {investmentData.map((d,i)=>(
          <div key={i} style={{padding:'6px 8px',background:T.surfaceH,borderRadius:4,fontSize:10}}>
            <div style={{fontWeight:600,color:T.text}}>{d.area}</div>
            <div style={{fontFamily:T.mono,color:T.textSec,marginTop:2}}>Invested: ${fmt(d.invested)}M | Planned: ${fmt(d.planned)}M</div>
            <div style={{fontFamily:T.mono,color:T.sage,fontSize:9}}>Est. ROI: {d.roi.toFixed(1)}%</div>
          </div>
        ))}
      </div>
    </Card>

    {/* Circular Economy */}
    <Card title="Circular Economy Contribution -- Recycled vs Virgin by Mineral">
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={circularData} margin={{left:10,right:20,top:5,bottom:5}}>
          <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
          <XAxis dataKey="name" tick={{fontSize:10,fill:T.textSec}}/>
          <YAxis domain={[0,100]} tick={{fontSize:9,fill:T.textMut}}/>
          <Tooltip contentStyle={{fontFamily:T.mono,fontSize:10}}/>
          <Bar dataKey="recycled" name="Recycled %" stackId="a" fill={T.green}/>
          <Bar dataKey="virgin" name="Virgin %" stackId="a" fill={T.border}/>
          <Legend wrapperStyle={{fontSize:10}}/>
        </BarChart>
      </ResponsiveContainer>
    </Card>

    {/* Revenue at Risk by Mineral */}
    <Card title="Portfolio Revenue at Risk by Mineral Dependency">
      <div style={{overflowX:'auto'}}>
        <table style={{width:'100%',borderCollapse:'collapse',fontSize:10,fontFamily:T.mono}}>
          <thead><tr>
            {['Mineral','Exposed Companies','Total Revenue ($M)','Avg Exposure','Price Vol %','Revenue at Risk ($M)','Risk Rating'].map(h=>(
              <th key={h} style={{textAlign:'left',padding:'4px 6px',borderBottom:`2px solid ${T.border}`,color:T.textMut,fontSize:9}}>{h}</th>
            ))}
          </tr></thead>
          <tbody>{minerals.map((m,mi)=>{
            const exposed=companies.filter(c=>c.exposure.find(e=>e.mineral===m.id&&e.level>0));
            const totalRev=exposed.reduce((s,c)=>s+c.revenue,0);
            const avgExposure=exposed.length>0?+(exposed.reduce((s,c)=>{const e=c.exposure.find(e=>e.mineral===m.id);return s+(e?e.level:0);},0)/exposed.length).toFixed(1):0;
            const revenueAtRisk=+(totalRev*(m.priceVol/100)*(avgExposure/100)).toFixed(0);
            return (
              <tr key={mi} style={{borderBottom:`1px solid ${T.border}`,background:mi%2?T.surfaceH:'transparent'}}>
                <td style={{padding:'3px 6px',fontWeight:600,color:T.text}}>{m.name}</td>
                <td style={{padding:'3px 6px',color:T.textSec}}>{exposed.length}</td>
                <td style={{padding:'3px 6px',color:T.textSec}}>${fmt(totalRev)}</td>
                <td style={{padding:'3px 6px',color:riskColor(avgExposure)}}>{avgExposure}</td>
                <td style={{padding:'3px 6px',color:m.priceVol>30?T.red:T.textSec}}>{m.priceVol}%</td>
                <td style={{padding:'3px 6px',fontWeight:700,color:revenueAtRisk>500?T.red:T.amber}}>${fmt(revenueAtRisk)}</td>
                <td style={{padding:'3px 6px'}}><Badge text={revenueAtRisk>500?'High':revenueAtRisk>100?'Medium':'Low'} color={revenueAtRisk>500?T.red:revenueAtRisk>100?T.amber:T.green}/></td>
              </tr>
            );
          })}</tbody>
        </table>
      </div>
    </Card>

    {/* Battery Mineral Supply Chain Focus */}
    <Card title="Battery Mineral Supply Chain -- Sector Deep Dive">
      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10}}>
        {['Lithium','Cobalt','Nickel','Manganese','Graphite','Copper'].map((mName,bi)=>{
          const m=minerals.find(mm=>mm.name===mName);
          if(!m)return null;
          const evDemand=si(bi*1500+1,20,80);
          const gridDemand=si(bi*1500+2,10,40);
          const otherDemand=100-evDemand-gridDemand;
          return (
            <div key={bi} style={{padding:'10px 12px',background:T.surfaceH,borderRadius:6,border:`1px solid ${T.border}`}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:6}}>
                <span style={{fontSize:12,fontWeight:700,color:T.navy}}>{mName}</span>
                <Badge text={`Risk: ${m.supplyRisk}`} color={riskColor(m.supplyRisk)}/>
              </div>
              <div style={{fontSize:10,color:T.textSec,marginBottom:4}}>Demand Split:</div>
              <div style={{display:'flex',height:10,borderRadius:4,overflow:'hidden',marginBottom:4}}>
                <div style={{width:`${evDemand}%`,background:T.sage}} title={`EV: ${evDemand}%`}/>
                <div style={{width:`${gridDemand}%`,background:T.gold}} title={`Grid: ${gridDemand}%`}/>
                <div style={{width:`${otherDemand}%`,background:T.border}} title={`Other: ${otherDemand}%`}/>
              </div>
              <div style={{display:'flex',gap:8,fontSize:9,color:T.textMut}}>
                <span>EV: {evDemand}%</span>
                <span>Grid: {gridDemand}%</span>
                <span>Other: {otherDemand}%</span>
              </div>
              <div style={{fontSize:9,color:T.textSec,marginTop:4,fontFamily:T.mono}}>
                Growth: +{m.demandGrowth}% | Reserve: {m.reserveYrs}yr | Recycle: {m.recycRate}%
              </div>
            </div>
          );
        })}
      </div>
    </Card>

    {/* Strategic Recommendations */}
    <Card title="Strategic Recommendations -- Critical Mineral Risk Mitigation">
      <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:8}}>
        {[
          {priority:'P1',title:'Diversify Cobalt Sources',desc:'Reduce DRC dependency below 40% through Australian and Canadian sourcing partnerships',timeline:'6-12 months',impact:'High'},
          {priority:'P1',title:'Accelerate Li Recycling',desc:'Invest in hydrometallurgical recycling capacity to reach 25% recycled lithium by 2028',timeline:'12-24 months',impact:'High'},
          {priority:'P2',title:'RMAP Certification Push',desc:'Require all Tier 3 suppliers to achieve RMAP conformance within 18 months',timeline:'18 months',impact:'Medium'},
          {priority:'P2',title:'Substitute Critical Minerals',desc:'Evaluate sodium-ion and iron phosphate alternatives for battery applications',timeline:'24-36 months',impact:'Medium'},
          {priority:'P3',title:'Strategic Stockpiling',desc:'Establish 90-day buffer stocks for high-risk minerals (Ta, W, REE)',timeline:'6 months',impact:'Medium'},
          {priority:'P3',title:'EU CRMA Compliance',desc:'Complete remaining compliance checklist items and annual reporting before Q4 deadline',timeline:'3 months',impact:'Low'},
        ].map((rec,ri)=>(
          <div key={ri} style={{padding:'8px 10px',background:T.surfaceH,borderRadius:4,border:`1px solid ${T.border}`,borderLeft:`3px solid ${rec.priority==='P1'?T.red:rec.priority==='P2'?T.amber:T.sage}`}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:4}}>
              <span style={{fontSize:11,fontWeight:600,color:T.text}}>{rec.title}</span>
              <div style={{display:'flex',gap:4}}>
                <Badge text={rec.priority} color={rec.priority==='P1'?T.red:rec.priority==='P2'?T.amber:T.sage}/>
                <Badge text={rec.impact} color={rec.impact==='High'?T.red:rec.impact==='Medium'?T.amber:T.sage}/>
              </div>
            </div>
            <div style={{fontSize:10,color:T.textSec,marginBottom:2}}>{rec.desc}</div>
            <div style={{fontSize:9,color:T.textMut,fontFamily:T.mono}}>Timeline: {rec.timeline}</div>
          </div>
        ))}
      </div>
    </Card>

    {/* Export */}
    <div style={{display:'flex',justifyContent:'flex-end',gap:10}}>
      <button onClick={exportCSV} style={{padding:'8px 20px',borderRadius:4,background:T.navy,color:'#fff',border:'none',fontFamily:T.font,fontSize:11,fontWeight:600,cursor:'pointer'}}>
        Export Mineral Risk Report CSV
      </button>
    </div>
  </div>);
};

/* ═══════════════════════════════════════════════════════════════════ */
/*  MAIN PAGE                                                         */
/* ═══════════════════════════════════════════════════════════════════ */
export default function ConflictMineralsPage(){
  const [tab,setTab]=useState(0);
  const [selMineral,setSelMineral]=useState(null);
  const [selCompany,setSelCompany]=useState(null);

  const minerals=useMemo(()=>genMinerals(),[]);
  const companies=useMemo(()=>genCompanies(),[]);
  const smelters=useMemo(()=>genSmelters(),[]);
  const recycling=useMemo(()=>genRecycling(),[]);

  const conflictCount=minerals.filter(m=>m.crit==='Conflict').length;
  const avgRisk=+(minerals.reduce((s,m)=>s+m.supplyRisk,0)/minerals.length).toFixed(1);
  const highRiskCompanies=companies.filter(c=>c.riskLevel==='High'||c.riskLevel==='Critical').length;

  return (
    <div style={{minHeight:'100vh',background:T.bg,fontFamily:T.font,color:T.text,paddingBottom:30}}>
      {/* Header */}
      <div style={{background:T.surface,borderBottom:`1px solid ${T.border}`,padding:'16px 24px'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <div>
            <div style={{fontSize:11,fontFamily:T.mono,color:T.gold,letterSpacing:1.5,textTransform:'uppercase',marginBottom:2}}>EP-AP4</div>
            <h1 style={{fontSize:20,fontWeight:700,color:T.navy,margin:0}}>Conflict Minerals & Critical Raw Materials</h1>
            <div style={{fontSize:11,color:T.textSec,marginTop:2}}>EU CRMA | Dodd-Frank 1502 | OECD Due Diligence | Battery Supply Chains</div>
          </div>
          <div style={{display:'flex',gap:12,alignItems:'center'}}>
            <div style={{textAlign:'center',padding:'4px 12px',background:T.surfaceH,borderRadius:4}}>
              <div style={{fontSize:14,fontWeight:700,color:T.amber,fontFamily:T.mono}}>{conflictCount}</div>
              <div style={{fontSize:9,color:T.textMut}}>Conflict Minerals</div>
            </div>
            <div style={{textAlign:'center',padding:'4px 12px',background:T.surfaceH,borderRadius:4}}>
              <div style={{fontSize:14,fontWeight:700,color:riskColor(avgRisk),fontFamily:T.mono}}>{avgRisk}</div>
              <div style={{fontSize:9,color:T.textMut}}>Avg Supply Risk</div>
            </div>
            <div style={{textAlign:'center',padding:'4px 12px',background:T.surfaceH,borderRadius:4}}>
              <div style={{fontSize:14,fontWeight:700,color:T.red,fontFamily:T.mono}}>{highRiskCompanies}</div>
              <div style={{fontSize:9,color:T.textMut}}>High-Risk Companies</div>
            </div>
          </div>
        </div>
        {/* Tab Bar */}
        <div style={{display:'flex',gap:0,marginTop:14,borderBottom:`2px solid ${T.border}`}}>
          {TABS.map((t,i)=>(
            <button key={i} onClick={()=>setTab(i)} style={{padding:'8px 16px',fontSize:11,fontWeight:tab===i?700:500,color:tab===i?T.navy:T.textMut,background:'transparent',border:'none',borderBottom:tab===i?`2px solid ${T.gold}`:'2px solid transparent',cursor:'pointer',fontFamily:T.font,marginBottom:-2,transition:'all 0.15s ease'}}>{t}</button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{padding:'16px 24px',maxWidth:1440,margin:'0 auto'}}>
        {tab===0&&<MineralRiskDashboard minerals={minerals} companies={companies} selMineral={selMineral} setSelMineral={setSelMineral} selCompany={selCompany} setSelCompany={setSelCompany}/>}
        {tab===1&&<DueDiligenceCompliance companies={companies} smelters={smelters}/>}
        {tab===2&&<SupplyChainMapping smelters={smelters} minerals={minerals} recycling={recycling}/>}
        {tab===3&&<StrategicFinancialImpact minerals={minerals} companies={companies}/>}
      </div>

      {/* Status Bar */}
      <div style={{position:'fixed',bottom:0,left:0,right:0,background:T.navy,padding:'4px 24px',display:'flex',justifyContent:'space-between',alignItems:'center',fontSize:10,fontFamily:T.mono,color:T.goldL,zIndex:50}}>
        <span>EP-AP4 Conflict Minerals & Critical Raw Materials</span>
        <span>12 minerals | 80 companies | 25 countries | 40 smelters | 20 recyclers</span>
        <span>{new Date().toISOString().split('T')[0]}</span>
      </div>
    </div>
  );
}
