import React,{useState,useMemo} from 'react';
import {BarChart,Bar,XAxis,YAxis,CartesianGrid,Tooltip,ResponsiveContainer,RadarChart,Radar,PolarGrid,PolarAngleAxis,PolarRadiusAxis,Cell,Legend,LineChart,Line,PieChart,Pie} from 'recharts';

const T={bg:'#f6f4f0',surface:'#ffffff',surfaceH:'#f0ede7',border:'#e5e0d8',borderL:'#d5cfc5',navy:'#1b3a5c',navyL:'#2c5a8c',gold:'#c5a96a',goldL:'#d4be8a',sage:'#5a8a6a',sageL:'#7ba67d',teal:'#5a8a6a',text:'#1b3a5c',textSec:'#5c6b7e',textMut:'#9aa3ae',red:'#dc2626',green:'#16a34a',amber:'#d97706',font:"'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"};
const sr=(s)=>{let x=Math.sin(s+1)*10000;return x-Math.floor(x);};

const tabs=['Concentration Dashboard','Friendshoring & Derisking','Export Controls & Nationalism','Portfolio Mineral Risk'];
const COLORS=[T.navy,T.gold,T.sage,T.red,T.amber,T.navyL,T.goldL,T.sageL,'#8b5cf6','#06b6d4','#ec4899','#14b8a6','#f97316','#6366f1','#84cc16'];

const MINERALS=[
  {name:'Lithium',symbol:'Li',mining:{Chile:28,Australia:24,China:16,Argentina:10,Other:22},processing:{China:65,Chile:18,Argentina:8,Other:9},greenApp:'EV batteries, grid storage',demand2030:3.2,supplyRisk:'High'},
  {name:'Cobalt',symbol:'Co',mining:{DRC:74,Russia:5,Australia:4,Philippines:3,Other:14},processing:{China:73,Finland:10,Belgium:5,Other:12},greenApp:'Battery cathodes',demand2030:2.8,supplyRisk:'Critical'},
  {name:'Nickel',symbol:'Ni',mining:{Indonesia:49,Philippines:10,Russia:7,NewCaledonia:6,Other:28},processing:{China:35,Indonesia:30,Japan:8,Other:27},greenApp:'Battery cathodes, steel',demand2030:2.5,supplyRisk:'High'},
  {name:'Rare Earths',symbol:'REE',mining:{China:60,Myanmar:12,Australia:8,USA:5,Other:15},processing:{China:90,Estonia:2,Japan:2,Other:6},greenApp:'Wind turbine magnets, EVs',demand2030:2.9,supplyRisk:'Critical'},
  {name:'Graphite',symbol:'C',mining:{China:65,Mozambique:12,Madagascar:6,Brazil:5,Other:12},processing:{China:93,Japan:3,Other:4},greenApp:'Battery anodes',demand2030:3.5,supplyRisk:'Critical'},
  {name:'Manganese',symbol:'Mn',mining:{SouthAfrica:37,Gabon:18,Australia:13,China:7,Other:25},processing:{China:52,SouthAfrica:15,India:8,Other:25},greenApp:'Steel, batteries',demand2030:1.8,supplyRisk:'Medium'},
  {name:'Copper',symbol:'Cu',mining:{Chile:24,Peru:10,DRC:10,China:8,Other:48},processing:{China:42,Chile:12,Japan:8,Other:38},greenApp:'Wiring, EVs, grid',demand2030:2.1,supplyRisk:'High'},
  {name:'Silicon',symbol:'Si',mining:{China:67,Russia:7,Brazil:5,Norway:4,Other:17},processing:{China:78,Norway:5,USA:4,Other:13},greenApp:'Solar PV wafers',demand2030:2.4,supplyRisk:'High'},
  {name:'Gallium',symbol:'Ga',mining:{China:80,Japan:5,SouthKorea:3,Other:12},processing:{China:98,Japan:1,Other:1},greenApp:'Semiconductors, LEDs',demand2030:2.2,supplyRisk:'Critical'},
  {name:'Germanium',symbol:'Ge',mining:{China:60,Russia:5,USA:5,Belgium:3,Other:27},processing:{China:80,Belgium:8,Canada:5,Other:7},greenApp:'Solar cells, fiber optics',demand2030:1.9,supplyRisk:'High'},
  {name:'Platinum',symbol:'Pt',mining:{SouthAfrica:72,Russia:12,Zimbabwe:8,Other:8},processing:{SouthAfrica:55,UK:15,Japan:10,Other:20},greenApp:'Hydrogen fuel cells',demand2030:1.6,supplyRisk:'Medium'},
  {name:'Palladium',symbol:'Pd',mining:{Russia:40,SouthAfrica:35,Canada:8,USA:5,Other:12},processing:{Russia:40,SouthAfrica:30,UK:10,Other:20},greenApp:'Catalysts, H2',demand2030:1.4,supplyRisk:'High'},
  {name:'Vanadium',symbol:'V',mining:{China:66,Russia:17,SouthAfrica:9,Other:8},processing:{China:73,Russia:12,SouthAfrica:5,Other:10},greenApp:'Vanadium redox flow batteries',demand2030:2.0,supplyRisk:'High'},
  {name:'Tungsten',symbol:'W',mining:{China:82,Vietnam:5,Russia:3,Other:10},processing:{China:85,Japan:3,Austria:2,Other:10},greenApp:'Cutting tools, electronics',demand2030:1.3,supplyRisk:'Critical'},
  {name:'Antimony',symbol:'Sb',mining:{China:55,Russia:15,Tajikistan:12,Other:18},processing:{China:80,Vietnam:5,Other:15},greenApp:'Flame retardants, batteries',demand2030:1.5,supplyRisk:'High'},
];

const COUNTRIES_40=['China','USA','Australia','Chile','DRC','Indonesia','Russia','SouthAfrica','Brazil','India',
  'Canada','Japan','SouthKorea','Germany','UK','France','Finland','Belgium','Norway','Sweden',
  'Argentina','Peru','Philippines','NewCaledonia','Myanmar','Madagascar','Mozambique','Gabon','Zimbabwe','Tajikistan',
  'Vietnam','Taiwan','Mexico','Turkey','Morocco','Estonia','Austria','Kazakhstan','Mongolia','Tanzania'];

const COMPANIES_80=[];
const COMP_NAMES_M=['Tesla Inc','BYD Auto','CATL','LG Energy','Samsung SDI','Panasonic','SK Innovation','Northvolt','SVOLT Energy','Gotion High-Tech',
  'EVE Energy','CALB','Envision AESC','Farasis Energy','Contemporary Amperex','Apple Inc','Volkswagen','BMW Group','Mercedes-Benz','Toyota Motor',
  'Hyundai Motor','Ford Motor','GM Motors','Stellantis','Rivian Auto','Lucid Motors','NIO Inc','XPeng Motors','Li Auto','Vinfast',
  'Vestas Wind','Siemens Gamesa','Goldwind Tech','Envision Energy','Nordex','GE Vernova','LONGi Green','Jinko Solar','Trina Solar','First Solar',
  'Canadian Solar','JA Solar','SunPower Corp','Enphase Energy','SolarEdge','NextEra Energy','Enel Green','Orsted','Iberdrola','EDF Renewables',
  'Rio Tinto','BHP Group','Glencore','Anglo American','Vale SA','Freeport McMoRan','Albemarle Corp','SQM Chile','Livent Corp','Pilbara Minerals',
  'Allkem Ltd','IGO Ltd','Mineral Resources','Lynas Rare Earths','MP Materials','Umicore','Johnson Matthey','BASF','Norsk Hydro','Alcoa Corp',
  'Southern Copper','Newmont Mining','Barrick Gold','Norilsk Nickel','ERG Group','AMG Advanced','Tianqi Lithium','Ganfeng Lithium','Huayou Cobalt','CMOC Group'];

for(let i=0;i<80;i++){
  const s1=sr(i*19+3);const s2=sr(i*23+7);const s3=sr(i*29+11);const s4=sr(i*31+13);const s5=sr(i*37+17);
  COMPANIES_80.push({
    id:i+1,name:COMP_NAMES_M[i],
    sector:['EV/Battery','Solar','Wind','Mining','Refining','Auto OEM','Tech','Utility'][Math.floor(s1*8)],
    topMineral:MINERALS[Math.floor(s2*15)].name,
    concentrationRisk:Math.floor(s3*100),
    chinaProcessingDep:Math.floor(s4*95)+5,
    diversificationScore:Math.floor(s5*100),
    friendshoringReady:Math.floor(s1*100),
    geoRiskScore:Math.floor(s2*100),
    supplierCount:Math.floor(s3*20)+2,
    secondSourcePct:Math.floor(s4*60),
    exportControlExposure:['None','Low','Medium','High','Critical'][Math.floor(s5*5)],
    revenueMn:Math.floor(s1*50000)+500,
    mineralSpendMn:Math.floor(s2*5000)+50,
  });
}

const EXPORT_CONTROLS=[
  {country:'China',minerals:['Gallium','Germanium','Graphite','Rare Earths','Antimony','Tungsten'],type:'Export Licensing',date:'2023-08 onwards',priceImpact:'+25-50%',substitution:'Limited',status:'Active'},
  {country:'Indonesia',minerals:['Nickel'],type:'Export Ban (ore)',date:'2020-01',priceImpact:'+35%',substitution:'Philippines, New Caledonia',status:'Active'},
  {country:'Chile',minerals:['Lithium'],type:'Partial Nationalization',date:'2023-04',priceImpact:'+15%',substitution:'Australia, Argentina',status:'In Progress'},
  {country:'DRC',minerals:['Cobalt'],type:'Royalty Increase 3.5%→10%',date:'2024-01',priceImpact:'+8%',substitution:'Limited (74% share)',status:'Active'},
  {country:'Zimbabwe',minerals:['Lithium'],type:'Raw Lithium Export Ban',date:'2022-12',priceImpact:'+5%',substitution:'Global supply minimal impact',status:'Active'},
  {country:'Russia',minerals:['Palladium','Nickel','Vanadium'],type:'Western Sanctions',date:'2022-02',priceImpact:'+20-40%',substitution:'South Africa, Indonesia',status:'Active'},
  {country:'Myanmar',minerals:['Rare Earths'],type:'Conflict/Sanctions',date:'2021-02',priceImpact:'+10%',substitution:'China domestic, Australia',status:'Active'},
  {country:'Argentina',minerals:['Lithium'],type:'Export Tax Proposal',date:'2025-H2',priceImpact:'TBD (+5-10%)',substitution:'Chile, Australia',status:'Proposed'},
  {country:'Mexico',minerals:['Lithium'],type:'Nationalization Decree',date:'2023-08',priceImpact:'Minimal (small producer)',substitution:'N/A',status:'Active'},
  {country:'Tanzania',minerals:['Graphite','Rare Earths'],type:'Value-Add Processing Mandate',date:'2024-06',priceImpact:'+3%',substitution:'Mozambique, Madagascar',status:'Active'},
];

const FRIENDSHORING_POLICIES=[
  {policy:'US IRA Domestic Content',country:'USA',minerals:'All critical',target:'50% domestic by 2027, 80% by 2029',investment:'$369B total',status:'Active'},
  {policy:'EU Critical Raw Materials Act',country:'EU',minerals:'34 critical minerals',target:'10% mining, 40% processing, 25% recycling by 2030',investment:'EUR 170B est.',status:'In Force 2024'},
  {policy:'India PLI Scheme',country:'India',minerals:'Li, Co, REE, Si',target:'Reduce China dependency 50% by 2030',investment:'$10B',status:'Active'},
  {policy:'Australia Critical Minerals Strategy',country:'Australia',minerals:'Li, REE, Co, Ni',target:'Downstream processing hub',investment:'AUD 4B',status:'Active'},
  {policy:'Canada Critical Minerals Strategy',country:'Canada',minerals:'Li, Co, Ni, Graphite, REE',target:'End-to-end supply chain',investment:'CAD 3.8B',status:'Active'},
  {policy:'Japan Economic Security Act',country:'Japan',minerals:'REE, Co, Ni, Mn, Li',target:'Stockpile + diversification',investment:'JPY 1.5T',status:'Active'},
  {policy:'South Korea K-Battery Plan',country:'South Korea',minerals:'Li, Ni, Co, Graphite',target:'50% non-China supply by 2030',investment:'KRW 40T',status:'Active'},
  {policy:'UK Critical Minerals Strategy',country:'UK',minerals:'Li, Co, REE, PGM',target:'Secure supply, recycling hub',investment:'GBP 1B',status:'Active'},
];

export default function CriticalMineralGeopoliticsPage(){
  const [tab,setTab]=useState(0);
  const [selMineral,setSelMineral]=useState(null);
  const [selPolicy,setSelPolicy]=useState(null);
  const [sortCol,setSortCol]=useState('geoRiskScore');
  const [sortDir,setSortDir]=useState('desc');
  const [searchTerm,setSearchTerm]=useState('');
  const [sectorFilter,setSectorFilter]=useState('All');
  const [compPage,setCompPage]=useState(0);

  const mineralHHI=useMemo(()=>{
    return MINERALS.map(m=>{
      const miningVals=Object.values(m.mining);
      const processVals=Object.values(m.processing);
      const mHHI=miningVals.reduce((a,v)=>a+v*v,0);
      const pHHI=processVals.reduce((a,v)=>a+v*v,0);
      const chinaProcess=m.processing.China||0;
      const topMiner=Object.entries(m.mining).sort((a,b)=>b[1]-a[1])[0];
      const friendshoreScore=100-chinaProcess;
      return{...m,miningHHI:mHHI,processingHHI:pHHI,chinaProcess,topMiner:topMiner[0],topMinerPct:topMiner[1],friendshoreScore};
    }).sort((a,b)=>b.processingHHI-a.processingHHI);
  },[]);

  const friendshoringByMineral=useMemo(()=>{
    return mineralHHI.map(m=>({
      name:m.symbol,mineral:m.name,
      alliedPct:100-(m.processing.China||0),
      chinaDepPct:m.processing.China||0,
      reshoreTarget:Math.min(100,Math.floor((100-(m.processing.China||0))*1.5)),
      reshoreGapPct:Math.max(0,Math.floor((m.processing.China||0)-30)),
      costPremium:`+${Math.floor((m.processing.China||0)*0.4)}%`
    }));
  },[mineralHHI]);

  const radarData=useMemo(()=>{
    if(!selMineral)return[];
    const m=mineralHHI.find(mm=>mm.name===selMineral);
    if(!m)return[];
    return Object.entries(m.mining).filter(([k])=>k!=='Other').map(([country,pct])=>({
      country,miningPct:pct,processingPct:m.processing[country]||0,
      governanceScore:Math.floor(sr(country.length*17+3)*80+20)
    }));
  },[selMineral,mineralHHI]);

  const filteredCompanies=useMemo(()=>{
    let f=COMPANIES_80;
    if(sectorFilter!=='All')f=f.filter(c=>c.sector===sectorFilter);
    if(searchTerm)f=f.filter(c=>c.name.toLowerCase().includes(searchTerm.toLowerCase()));
    return[...f].sort((a,b)=>sortDir==='desc'?(b[sortCol]||0)-(a[sortCol]||0):(a[sortCol]||0)-(b[sortCol]||0));
  },[sectorFilter,searchTerm,sortCol,sortDir]);

  const sectors=[...new Set(COMPANIES_80.map(c=>c.sector))];
  const PAGE_SIZE=15;
  const pagedCompanies=filteredCompanies.slice(compPage*PAGE_SIZE,(compPage+1)*PAGE_SIZE);
  const totalPages=Math.ceil(filteredCompanies.length/PAGE_SIZE);

  const handleSort=(col)=>{if(sortCol===col)setSortDir(d=>d==='desc'?'asc':'desc');else{setSortCol(col);setSortDir('desc');}};

  const exportCSV=()=>{
    const headers=['Company','Sector','Top Mineral','Concentration Risk','China Processing Dep %','Diversification Score','Friendshoring Ready','Geo Risk Score','Suppliers','Export Control Exposure'];
    const rows=filteredCompanies.map(c=>[c.name,c.sector,c.topMineral,c.concentrationRisk,c.chinaProcessingDep,c.diversificationScore,c.friendshoringReady,c.geoRiskScore,c.supplierCount,c.exportControlExposure].join(','));
    const csv=[headers.join(','),...rows].join('\n');
    const blob=new Blob([csv],{type:'text/csv'});const url=URL.createObjectURL(blob);
    const a=document.createElement('a');a.href=url;a.download='mineral_geopolitical_risk.csv';a.click();URL.revokeObjectURL(url);
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
    progressBar:{height:'6px',borderRadius:'3px',background:T.surfaceH,position:'relative',overflow:'hidden'},
    progressFill:(pct,color)=>({height:'100%',borderRadius:'3px',background:color,width:`${Math.min(pct,100)}%`}),
    tag:(active)=>({display:'inline-block',padding:'4px 10px',borderRadius:'12px',fontSize:'11px',fontWeight:500,cursor:'pointer',background:active?T.navy:T.surfaceH,color:active?'#fff':T.textSec,border:`1px solid ${active?T.navy:T.border}`,margin:'2px'}),
    chip:(c)=>({display:'inline-flex',alignItems:'center',gap:'4px',padding:'3px 8px',borderRadius:'4px',fontSize:'10px',fontWeight:600,background:`${c}15`,color:c,border:`1px solid ${c}30`}),
  };

  const renderTab0=()=>(
    <div>
      <div style={sty.row}>
        {[{l:'Critical Minerals',v:15},{l:'Countries Tracked',v:40},{l:'Avg China Processing',v:`${Math.round(mineralHHI.reduce((a,m)=>a+m.chinaProcess,0)/15)}%`},{l:'Critical Risk Minerals',v:mineralHHI.filter(m=>m.supplyRisk==='Critical').length},{l:'Avg Processing HHI',v:Math.round(mineralHHI.reduce((a,m)=>a+m.processingHHI,0)/15)},{l:'Demand Growth 2030x',v:`${(mineralHHI.reduce((a,m)=>a+m.demand2030,0)/15).toFixed(1)}x`}].map((k,i)=>(
          <div key={i} style={sty.kpi}><div style={sty.kpiVal}>{k.v}</div><div style={sty.kpiLbl}>{k.l}</div></div>
        ))}
      </div>
      <div style={sty.card}>
        <div style={sty.cardTitle}>Mining vs Processing Concentration (HHI) by Mineral</div>
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={mineralHHI}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
            <XAxis dataKey="symbol" tick={{fontSize:10,fill:T.textSec}}/>
            <YAxis tick={{fontSize:10,fill:T.textSec}} label={{value:'HHI',position:'insideTopLeft',fontSize:10}}/>
            <Tooltip contentStyle={{fontSize:11,borderRadius:8}}/>
            <Bar dataKey="miningHHI" fill={T.navy} name="Mining HHI" radius={[4,4,0,0]}/>
            <Bar dataKey="processingHHI" fill={T.red} name="Processing HHI" radius={[4,4,0,0]}/>
            <Legend wrapperStyle={{fontSize:11}}/>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div style={sty.grid2}>
        <div style={sty.card}>
          <div style={sty.cardTitle}>China Processing Dominance</div>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={mineralHHI.sort((a,b)=>b.chinaProcess-a.chinaProcess)} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
              <XAxis type="number" domain={[0,100]} tick={{fontSize:10,fill:T.textSec}}/>
              <YAxis dataKey="name" type="category" tick={{fontSize:9,fill:T.textSec}} width={90}/>
              <Tooltip contentStyle={{fontSize:11,borderRadius:8}} formatter={v=>`${v}%`}/>
              <Bar dataKey="chinaProcess" name="China %" radius={[0,4,4,0]}>
                {mineralHHI.sort((a,b)=>b.chinaProcess-a.chinaProcess).map((e,i)=>(<Cell key={i} fill={e.chinaProcess>80?T.red:e.chinaProcess>60?T.amber:T.green}/>))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={sty.card}>
          <div style={sty.cardTitle}>Demand Growth to 2030 (multiplier)</div>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={mineralHHI.sort((a,b)=>b.demand2030-a.demand2030)} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
              <XAxis type="number" tick={{fontSize:10,fill:T.textSec}}/>
              <YAxis dataKey="name" type="category" tick={{fontSize:9,fill:T.textSec}} width={90}/>
              <Tooltip contentStyle={{fontSize:11,borderRadius:8}} formatter={v=>`${v}x`}/>
              <Bar dataKey="demand2030" name="2030 Demand x" radius={[0,4,4,0]} fill={T.sage}/>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div style={sty.card}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'12px'}}>
          <div style={sty.cardTitle}>Mineral Detail — Click to drill down</div>
          <div style={sty.row}>{MINERALS.map(m=>(<span key={m.name} style={sty.tag(selMineral===m.name)} onClick={()=>setSelMineral(selMineral===m.name?null:m.name)}>{m.symbol}</span>))}</div>
        </div>
        <table style={sty.table}>
          <thead><tr><th style={sty.th}>Mineral</th><th style={sty.th}>Top Miner</th><th style={sty.th}>Mining HHI</th><th style={sty.th}>China Process %</th><th style={sty.th}>Processing HHI</th><th style={sty.th}>Risk</th><th style={sty.th}>Green App</th><th style={sty.th}>2030 Demand</th></tr></thead>
          <tbody>{mineralHHI.map((m,i)=>(
            <tr key={i} style={{background:selMineral===m.name?`${T.gold}15`:i%2===0?'transparent':T.surfaceH,cursor:'pointer'}} onClick={()=>setSelMineral(selMineral===m.name?null:m.name)}>
              <td style={{...sty.td,fontWeight:600}}><span style={{...sty.mono,marginRight:'4px'}}>{m.symbol}</span>{m.name}</td>
              <td style={sty.td}>{m.topMiner} ({m.topMinerPct}%)</td>
              <td style={{...sty.td,...sty.mono}}>{m.miningHHI}</td>
              <td style={sty.td}><div style={{display:'flex',alignItems:'center',gap:'4px'}}><div style={{...sty.progressBar,width:'50px'}}><div style={sty.progressFill(m.chinaProcess,m.chinaProcess>80?T.red:m.chinaProcess>60?T.amber:T.green)}/></div><span style={sty.mono}>{m.chinaProcess}%</span></div></td>
              <td style={{...sty.td,...sty.mono}}>{m.processingHHI}</td>
              <td style={sty.td}><span style={sty.badge(m.supplyRisk==='Critical'?T.red:m.supplyRisk==='High'?T.amber:T.sage)}>{m.supplyRisk}</span></td>
              <td style={{...sty.td,fontSize:'11px'}}>{m.greenApp}</td>
              <td style={{...sty.td,...sty.mono}}>{m.demand2030}x</td>
            </tr>
          ))}</tbody>
        </table>
      </div>
      {selMineral&&(()=>{
        const m=mineralHHI.find(mm=>mm.name===selMineral);
        const miningData=Object.entries(m.mining).map(([k,v])=>({country:k,pct:v})).sort((a,b)=>b.pct-a.pct);
        const processData=Object.entries(m.processing).map(([k,v])=>({country:k,pct:v})).sort((a,b)=>b.pct-a.pct);
        return(
          <div style={{...sty.card,borderLeft:`4px solid ${T.gold}`}}>
            <div style={sty.cardTitle}>{selMineral} ({m.symbol}) — Source Country Breakdown</div>
            <div style={sty.grid2}>
              <div>
                <div style={{fontSize:'13px',fontWeight:600,color:T.navy,marginBottom:'8px'}}>Mining</div>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart><Pie data={miningData} cx="50%" cy="50%" outerRadius={70} innerRadius={30} dataKey="pct" label={({country,pct})=>`${country}: ${pct}%`}>
                    {miningData.map((e,i)=>(<Cell key={i} fill={COLORS[i%COLORS.length]}/>))}</Pie><Tooltip/></PieChart>
                </ResponsiveContainer>
              </div>
              <div>
                <div style={{fontSize:'13px',fontWeight:600,color:T.navy,marginBottom:'8px'}}>Processing</div>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart><Pie data={processData} cx="50%" cy="50%" outerRadius={70} innerRadius={30} dataKey="pct" label={({country,pct})=>`${country}: ${pct}%`}>
                    {processData.map((e,i)=>(<Cell key={i} fill={COLORS[i%COLORS.length]}/>))}</Pie><Tooltip/></PieChart>
                </ResponsiveContainer>
              </div>
            </div>
            {radarData.length>0&&(
              <ResponsiveContainer width="100%" height={250}>
                <RadarChart data={radarData}><PolarGrid stroke={T.border}/>
                  <PolarAngleAxis dataKey="country" tick={{fontSize:10,fill:T.textSec}}/>
                  <PolarRadiusAxis tick={{fontSize:9,fill:T.textMut}}/>
                  <Radar name="Mining %" dataKey="miningPct" stroke={T.navy} fill={T.navy} fillOpacity={0.2}/>
                  <Radar name="Processing %" dataKey="processingPct" stroke={T.red} fill={T.red} fillOpacity={0.15}/>
                  <Radar name="Governance" dataKey="governanceScore" stroke={T.sage} fill={T.sage} fillOpacity={0.1}/>
                  <Legend wrapperStyle={{fontSize:11}}/><Tooltip contentStyle={{fontSize:11,borderRadius:8}}/></RadarChart>
              </ResponsiveContainer>
            )}
          </div>
        );
      })()}
    </div>
  );

  const renderTab1=()=>(
    <div>
      <div style={sty.row}>
        {[{l:'Active Policies',v:FRIENDSHORING_POLICIES.length},{l:'Total Investment',v:'>$500B'},{l:'Avg Friendshore %',v:`${Math.round(friendshoringByMineral.reduce((a,m)=>a+m.alliedPct,0)/15)}%`},{l:'Target by 2030',v:'40-80%'},{l:'Reshore Gap',v:`${Math.round(friendshoringByMineral.reduce((a,m)=>a+m.reshoreGapPct,0)/15)}pp`}].map((k,i)=>(
          <div key={i} style={sty.kpi}><div style={sty.kpiVal}>{k.v}</div><div style={sty.kpiLbl}>{k.l}</div></div>
        ))}
      </div>
      <div style={sty.card}>
        <div style={sty.cardTitle}>Friendshoring Index by Mineral — % from Allied Nations</div>
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={friendshoringByMineral}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
            <XAxis dataKey="name" tick={{fontSize:10,fill:T.textSec}}/>
            <YAxis domain={[0,100]} tick={{fontSize:10,fill:T.textSec}}/>
            <Tooltip contentStyle={{fontSize:11,borderRadius:8}}/>
            <Bar dataKey="alliedPct" fill={T.sage} name="Allied %" radius={[4,4,0,0]} stackId="a"/>
            <Bar dataKey="chinaDepPct" fill={T.red} name="China Dep %" radius={[4,4,0,0]} stackId="a"/>
            <Legend wrapperStyle={{fontSize:11}}/>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div style={sty.card}>
        <div style={sty.cardTitle}>National Friendshoring Policies</div>
        <table style={sty.table}>
          <thead><tr><th style={sty.th}>Policy</th><th style={sty.th}>Country</th><th style={sty.th}>Minerals</th><th style={sty.th}>Target</th><th style={sty.th}>Investment</th><th style={sty.th}>Status</th></tr></thead>
          <tbody>{FRIENDSHORING_POLICIES.map((p,i)=>(
            <tr key={i} style={{background:selPolicy===i?`${T.gold}15`:i%2===0?'transparent':T.surfaceH,cursor:'pointer'}} onClick={()=>setSelPolicy(selPolicy===i?null:i)}>
              <td style={{...sty.td,fontWeight:600}}>{p.policy}</td><td style={sty.td}>{p.country}</td>
              <td style={{...sty.td,fontSize:'11px'}}>{p.minerals}</td><td style={{...sty.td,fontSize:'11px'}}>{p.target}</td>
              <td style={{...sty.td,...sty.mono}}>{p.investment}</td>
              <td style={sty.td}><span style={sty.badge(p.status==='Active'||p.status.includes('Force')?T.green:T.amber)}>{p.status}</span></td>
            </tr>
          ))}</tbody>
        </table>
      </div>
      <div style={sty.card}>
        <div style={sty.cardTitle}>Reshoring Cost Premium by Mineral</div>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={friendshoringByMineral.sort((a,b)=>parseInt(b.costPremium)-parseInt(a.costPremium))}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
            <XAxis dataKey="name" tick={{fontSize:10,fill:T.textSec}}/>
            <YAxis tick={{fontSize:10,fill:T.textSec}}/>
            <Tooltip contentStyle={{fontSize:11,borderRadius:8}}/>
            <Bar dataKey="reshoreGapPct" fill={T.amber} name="Reshore Gap %" radius={[4,4,0,0]}/>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );

  const renderTab2=()=>(
    <div>
      <div style={sty.row}>
        {[{l:'Active Controls',v:EXPORT_CONTROLS.filter(e=>e.status==='Active').length},{l:'Countries with Controls',v:new Set(EXPORT_CONTROLS.map(e=>e.country)).size},{l:'Minerals Affected',v:new Set(EXPORT_CONTROLS.flatMap(e=>e.minerals)).size},{l:'Avg Price Impact',v:'+15-30%'},{l:'Proposed New',v:EXPORT_CONTROLS.filter(e=>e.status==='Proposed').length}].map((k,i)=>(
          <div key={i} style={sty.kpi}><div style={sty.kpiVal}>{k.v}</div><div style={sty.kpiLbl}>{k.l}</div></div>
        ))}
      </div>
      <div style={sty.card}>
        <div style={sty.cardTitle}>Export Controls & Resource Nationalism</div>
        <table style={sty.table}>
          <thead><tr><th style={sty.th}>Country</th><th style={sty.th}>Minerals</th><th style={sty.th}>Type</th><th style={sty.th}>Date</th><th style={sty.th}>Price Impact</th><th style={sty.th}>Substitution</th><th style={sty.th}>Status</th></tr></thead>
          <tbody>{EXPORT_CONTROLS.map((e,i)=>(
            <tr key={i} style={{background:i%2===0?'transparent':T.surfaceH}}>
              <td style={{...sty.td,fontWeight:600}}>{e.country}</td>
              <td style={sty.td}>{e.minerals.join(', ')}</td>
              <td style={{...sty.td,fontSize:'11px'}}>{e.type}</td>
              <td style={{...sty.td,...sty.mono}}>{e.date}</td>
              <td style={{...sty.td,...sty.mono,color:T.red}}>{e.priceImpact}</td>
              <td style={{...sty.td,fontSize:'11px'}}>{e.substitution}</td>
              <td style={sty.td}><span style={sty.badge(e.status==='Active'?T.red:e.status==='Proposed'?T.amber:T.sage)}>{e.status}</span></td>
            </tr>
          ))}</tbody>
        </table>
      </div>
      <div style={sty.grid2}>
        <div style={sty.card}>
          <div style={sty.cardTitle}>Price Impact by Mineral (Export Controls)</div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={MINERALS.map((m,i)=>({name:m.symbol,impact:Math.floor(sr(i*61+7)*40)+5})).sort((a,b)=>b.impact-a.impact)}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
              <XAxis dataKey="name" tick={{fontSize:10,fill:T.textSec}}/>
              <YAxis tick={{fontSize:10,fill:T.textSec}} label={{value:'%',position:'insideTopLeft',fontSize:10}}/>
              <Tooltip formatter={v=>`+${v}%`} contentStyle={{fontSize:11,borderRadius:8}}/>
              <Bar dataKey="impact" name="Price Impact %" radius={[4,4,0,0]}>
                {MINERALS.map((m,i)=>(<Cell key={i} fill={sr(i*61+7)*40+5>25?T.red:T.amber}/>))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={sty.card}>
          <div style={sty.cardTitle}>Substitution Viability</div>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={[{name:'Limited',value:6},{name:'Available',value:4},{name:'Minimal Impact',value:3},{name:'TBD',value:2}]} cx="50%" cy="50%" outerRadius={90} innerRadius={50} dataKey="value" label={({name,value})=>`${name}: ${value}`}>
                {[T.red,T.sage,T.amber,T.textMut].map((c,i)=>(<Cell key={i} fill={c}/>))}
              </Pie><Tooltip/><Legend wrapperStyle={{fontSize:11}}/></PieChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div style={sty.card}>
        <div style={sty.cardTitle}>China Export Restrictions Timeline</div>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={[{period:'2023 H2',minerals:2,impact:30},{period:'2024 H1',minerals:3,impact:35},{period:'2024 H2',minerals:4,impact:40},{period:'2025 H1',minerals:5,impact:42},{period:'2025 H2',minerals:6,impact:48},{period:'2026 H1',minerals:6,impact:50}]}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
            <XAxis dataKey="period" tick={{fontSize:10,fill:T.textSec}}/>
            <YAxis tick={{fontSize:10,fill:T.textSec}}/>
            <Tooltip contentStyle={{fontSize:11,borderRadius:8}}/>
            <Line type="monotone" dataKey="minerals" stroke={T.navy} strokeWidth={2} name="Minerals Restricted"/>
            <Line type="monotone" dataKey="impact" stroke={T.red} strokeWidth={2} name="Avg Price Impact %"/>
            <Legend wrapperStyle={{fontSize:11}}/>
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );

  const renderTab3=()=>(
    <div>
      <div style={sty.row}>
        {[{l:'Companies Scored',v:80},{l:'Avg Geo Risk',v:Math.round(COMPANIES_80.reduce((a,c)=>a+c.geoRiskScore,0)/80)},{l:'Avg China Dep',v:`${Math.round(COMPANIES_80.reduce((a,c)=>a+c.chinaProcessingDep,0)/80)}%`},{l:'High/Critical Export',v:COMPANIES_80.filter(c=>c.exportControlExposure==='High'||c.exportControlExposure==='Critical').length},{l:'Avg Diversification',v:Math.round(COMPANIES_80.reduce((a,c)=>a+c.diversificationScore,0)/80)},{l:'Avg Friendshore Ready',v:`${Math.round(COMPANIES_80.reduce((a,c)=>a+c.friendshoringReady,0)/80)}%`}].map((k,i)=>(
          <div key={i} style={sty.kpi}><div style={sty.kpiVal}>{k.v}</div><div style={sty.kpiLbl}>{k.l}</div></div>
        ))}
      </div>
      <div style={sty.card}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'12px',flexWrap:'wrap',gap:'8px'}}>
          <div style={sty.cardTitle}>Portfolio Mineral Geopolitical Risk</div>
          <div style={{display:'flex',gap:'8px',alignItems:'center'}}>
            <input style={sty.input} placeholder="Search..." value={searchTerm} onChange={e=>setSearchTerm(e.target.value)}/>
            <select style={sty.select} value={sectorFilter} onChange={e=>setSectorFilter(e.target.value)}>
              <option value="All">All Sectors</option>{sectors.map(s=>(<option key={s} value={s}>{s}</option>))}
            </select>
            <button style={{...sty.btn,background:T.gold,color:'#fff'}} onClick={exportCSV}>Export CSV</button>
          </div>
        </div>
        <div style={{fontSize:'12px',color:T.textMut,marginBottom:'8px'}}>{filteredCompanies.length} companies | Page {compPage+1}/{totalPages}</div>
        <div style={{overflowX:'auto'}}>
          <table style={sty.table}>
            <thead><tr>
              <th style={sty.th} onClick={()=>handleSort('name')}>Company</th><th style={sty.th}>Sector</th><th style={sty.th}>Top Mineral</th>
              <th style={sty.th} onClick={()=>handleSort('geoRiskScore')}>Geo Risk</th>
              <th style={sty.th} onClick={()=>handleSort('chinaProcessingDep')}>China Dep %</th>
              <th style={sty.th} onClick={()=>handleSort('concentrationRisk')}>Conc Risk</th>
              <th style={sty.th} onClick={()=>handleSort('diversificationScore')}>Diversification</th>
              <th style={sty.th} onClick={()=>handleSort('friendshoringReady')}>Friendshore</th>
              <th style={sty.th}>Suppliers</th><th style={sty.th}>Export Ctrl</th>
            </tr></thead>
            <tbody>{pagedCompanies.map((c,i)=>(
              <tr key={i} style={{background:i%2===0?'transparent':T.surfaceH}}>
                <td style={{...sty.td,fontWeight:600,fontSize:'11px'}}>{c.name}</td><td style={sty.td}>{c.sector}</td><td style={sty.td}>{c.topMineral}</td>
                <td style={sty.td}><div style={{display:'flex',alignItems:'center',gap:'4px'}}><div style={{...sty.progressBar,width:'40px'}}><div style={sty.progressFill(c.geoRiskScore,c.geoRiskScore>70?T.red:c.geoRiskScore>40?T.amber:T.green)}/></div><span style={sty.mono}>{c.geoRiskScore}</span></div></td>
                <td style={{...sty.td,...sty.mono,color:c.chinaProcessingDep>70?T.red:T.text}}>{c.chinaProcessingDep}%</td>
                <td style={{...sty.td,...sty.mono}}>{c.concentrationRisk}</td>
                <td style={{...sty.td,...sty.mono}}>{c.diversificationScore}</td>
                <td style={{...sty.td,...sty.mono}}>{c.friendshoringReady}%</td>
                <td style={{...sty.td,...sty.mono}}>{c.supplierCount}</td>
                <td style={sty.td}><span style={sty.badge(c.exportControlExposure==='Critical'?T.red:c.exportControlExposure==='High'?T.amber:c.exportControlExposure==='Medium'?T.gold:T.sage)}>{c.exportControlExposure}</span></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
        <div style={{display:'flex',justifyContent:'center',gap:'4px',marginTop:'12px'}}>
          <button style={{...sty.btn,background:T.surfaceH,color:T.navy}} disabled={compPage===0} onClick={()=>setCompPage(p=>p-1)}>Prev</button>
          {Array.from({length:Math.min(totalPages,7)},(_, idx)=>(
            <button key={idx} style={{...sty.btn,background:compPage===idx?T.navy:T.surfaceH,color:compPage===idx?'#fff':T.navy}} onClick={()=>setCompPage(idx)}>{idx+1}</button>
          ))}
          <button style={{...sty.btn,background:T.surfaceH,color:T.navy}} disabled={compPage>=totalPages-1} onClick={()=>setCompPage(p=>p+1)}>Next</button>
        </div>
      </div>
    </div>
  );

  return(
    <div style={sty.wrap}>
      <div style={{marginBottom:'24px'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
          <div><h1 style={sty.title}>Critical Mineral Geopolitics</h1><p style={sty.subtitle}>EP-AV3 // 15 minerals, 40 countries, processing concentration, friendshoring, export controls</p></div>
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
