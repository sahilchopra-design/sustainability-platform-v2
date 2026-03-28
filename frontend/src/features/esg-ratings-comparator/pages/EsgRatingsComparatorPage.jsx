import React,{useState,useMemo} from 'react';
import {BarChart,Bar,XAxis,YAxis,CartesianGrid,Tooltip,ResponsiveContainer,RadarChart,Radar,PolarGrid,PolarAngleAxis,PolarRadiusAxis,Cell,ScatterChart,Scatter,Legend} from 'recharts';

const T={bg:'#f6f4f0',surface:'#ffffff',surfaceH:'#f0ede7',border:'#e5e0d8',borderL:'#d5cfc5',navy:'#1b3a5c',navyL:'#2c5a8c',gold:'#c5a96a',goldL:'#d4be8a',sage:'#5a8a6a',sageL:'#7ba67d',teal:'#5a8a6a',text:'#1b3a5c',textSec:'#5c6b7e',textMut:'#9aa3ae',red:'#dc2626',green:'#16a34a',amber:'#d97706',font:"'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"};

const sr=(s)=>{let x=Math.sin(s+1)*10000;return x-Math.floor(x);};

const PROVIDERS=['MSCI','Sustainalytics','ISS ESG','CDP','S&P Global','Bloomberg ESG'];
const PROVIDER_SHORT=['MSCI','Sust','ISS','CDP','S&P','BBG'];
const PROVIDER_COLORS=[T.navy,T.sage,'#8b5cf6',T.gold,T.red,'#0891b2'];

const SECTORS=['Energy','Materials','Industrials','Consumer Discretionary','Consumer Staples',
  'Health Care','Financials','Information Technology','Communication Services','Utilities'];

const MSCI_GRADES=['AAA','AA','A','BBB','BB','B','CCC'];
const CDP_GRADES=['A','A-','B','B-','C','C-','D','D-'];

const COMPANIES=[
  'NextEra Energy','Exxon Mobil','Chevron','ConocoPhillips','Enbridge',
  'BHP Group','Linde','Air Liquide','Freeport-McMoRan','Nucor',
  'Caterpillar','Honeywell','Siemens','Schneider Electric','Deere & Co',
  'Tesla','LVMH','Nike','Amazon','Home Depot',
  'Nestle','Procter & Gamble','Unilever','Coca-Cola','PepsiCo',
  'Johnson & Johnson','UnitedHealth','Roche','Novo Nordisk','Pfizer',
  'JPMorgan Chase','Bank of America','HSBC','Allianz','BlackRock',
  'Apple','Microsoft','NVIDIA','TSMC','SAP',
  'Alphabet','Meta','Walt Disney','Netflix','Comcast',
  'Duke Energy','Iberdrola','Enel','Southern Company','Dominion Energy'
];

const COMPANY_SECTORS=[
  0,0,0,0,0,
  1,1,1,1,1,
  2,2,2,2,2,
  3,3,3,3,3,
  4,4,4,4,4,
  5,5,5,5,5,
  6,6,6,6,6,
  7,7,7,7,7,
  8,8,8,8,8,
  9,9,9,9,9
];

function genRatings(){
  const data=[];
  for(let i=0;i<50;i++){
    const base=sr(i*7+3)*40+30;
    const msciRaw=Math.min(6,Math.max(0,Math.floor(sr(i*13+1)*7)));
    const sustRaw=Math.max(5,Math.min(95,Math.floor(base*0.8+sr(i*17+2)*30)));
    const issRaw=Math.max(1,Math.min(10,Math.floor(sr(i*23+5)*5+base/15)));
    const cdpRaw=Math.min(7,Math.max(0,Math.floor(sr(i*31+7)*8)));
    const spRaw=Math.max(5,Math.min(98,Math.floor(base+sr(i*37+11)*20-10)));
    const bbgRaw=Math.max(5,Math.min(98,Math.floor(base*0.9+sr(i*41+13)*25)));
    const msciNorm=(6-msciRaw)/6*100;
    const sustNorm=100-sustRaw;
    const issNorm=issRaw/10*100;
    const cdpNorm=(7-cdpRaw)/7*100;
    const spNorm=spRaw;
    const bbgNorm=bbgRaw;
    const norms=[msciNorm,sustNorm,issNorm,cdpNorm,spNorm,bbgNorm];
    const avg=norms.reduce((a,b)=>a+b,0)/6;
    const variance=norms.reduce((a,b)=>a+(b-avg)*(b-avg),0)/6;
    const divergence=Math.sqrt(variance);
    data.push({
      id:i,name:COMPANIES[i],sector:SECTORS[COMPANY_SECTORS[i]],sectorIdx:COMPANY_SECTORS[i],
      msci:MSCI_GRADES[msciRaw],msciNum:msciRaw,msciNorm,
      sust:sustRaw,sustNorm,
      iss:issRaw,issNorm,
      cdp:CDP_GRADES[cdpRaw],cdpNum:cdpRaw,cdpNorm,
      sp:spRaw,spNorm,
      bbg:bbgRaw,bbgNorm,
      norms,consensus:Math.round(avg*10)/10,divergence:Math.round(divergence*10)/10
    });
  }
  return data;
}

const sty={
  page:{fontFamily:T.font,background:T.bg,minHeight:'100vh',padding:'24px 32px',color:T.text},
  header:{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:24},
  title:{fontSize:26,fontWeight:700,color:T.navy,margin:0},
  subtitle:{fontSize:14,color:T.textSec,marginTop:4},
  badge:{display:'inline-flex',alignItems:'center',padding:'4px 12px',borderRadius:20,fontSize:12,
    fontWeight:600,background:T.navy,color:'#fff',marginLeft:12},
  tabs:{display:'flex',gap:4,marginBottom:24,borderBottom:`2px solid ${T.border}`,paddingBottom:0},
  tab:(a)=>({padding:'10px 20px',fontSize:14,fontWeight:a?700:500,color:a?T.navy:T.textSec,
    background:a?T.surface:'transparent',border:a?`2px solid ${T.border}`:'2px solid transparent',
    borderBottom:a?'2px solid #fff':'2px solid transparent',borderRadius:'8px 8px 0 0',
    cursor:'pointer',marginBottom:-2,transition:'all 0.15s'}),
  card:{background:T.surface,border:`1px solid ${T.border}`,borderRadius:12,padding:20,marginBottom:16},
  cardTitle:{fontSize:16,fontWeight:700,color:T.navy,marginBottom:12},
  table:{width:'100%',borderCollapse:'collapse',fontSize:13},
  th:{padding:'10px 12px',textAlign:'left',borderBottom:`2px solid ${T.border}`,fontWeight:700,
    color:T.navy,cursor:'pointer',userSelect:'none',whiteSpace:'nowrap'},
  td:{padding:'8px 12px',borderBottom:`1px solid ${T.border}`,fontSize:13},
  trHover:{cursor:'pointer',transition:'background 0.1s'},
  checkbox:(c)=>({width:16,height:16,borderRadius:4,border:`2px solid ${c?T.navy:T.borderL}`,
    background:c?T.navy:'#fff',display:'inline-flex',alignItems:'center',justifyContent:'center',
    cursor:'pointer',marginRight:8,transition:'all 0.15s'}),
  chip:(a)=>({padding:'5px 14px',borderRadius:20,fontSize:12,fontWeight:a?700:500,
    background:a?T.navy:'transparent',color:a?'#fff':T.textSec,
    border:`1px solid ${a?T.navy:T.border}`,cursor:'pointer',transition:'all 0.15s'}),
  select:{padding:'8px 12px',borderRadius:8,border:`1px solid ${T.border}`,fontSize:13,
    fontFamily:T.font,color:T.navy,background:T.surface,cursor:'pointer',outline:'none'},
  btn:(variant)=>({padding:'8px 16px',borderRadius:8,fontSize:13,fontWeight:600,
    border:variant==='outline'?`1px solid ${T.border}`:'none',
    background:variant==='primary'?T.navy:variant==='danger'?T.red:'transparent',
    color:variant==='primary'||variant==='danger'?'#fff':T.navy,
    cursor:'pointer',transition:'all 0.15s',fontFamily:T.font}),
  kpi:{textAlign:'center',padding:16},
  kpiVal:{fontSize:28,fontWeight:800,color:T.navy},
  kpiLbl:{fontSize:12,color:T.textMut,marginTop:4},
  divBadge:(d)=>({display:'inline-block',padding:'2px 8px',borderRadius:12,fontSize:11,fontWeight:700,
    background:d<15?'#dcfce7':d<30?'#fef3c7':'#fee2e2',
    color:d<15?T.green:d<30?T.amber:T.red}),
  matCell:(v)=>({width:64,height:48,display:'flex',alignItems:'center',justifyContent:'center',
    fontSize:12,fontWeight:700,borderRadius:6,cursor:'pointer',transition:'all 0.15s',
    color:'#fff',background:v>0.8?T.navy:v>0.6?T.navyL:v>0.4?T.sage:v>0.2?T.gold:T.red}),
  toggle:(a)=>({padding:'6px 14px',borderRadius:6,fontSize:12,fontWeight:a?700:500,
    background:a?T.navy:'transparent',color:a?'#fff':T.textSec,
    border:`1px solid ${a?T.navy:T.border}`,cursor:'pointer',transition:'all 0.15s'}),
  pctBar:(pct,color)=>({width:`${pct}%`,height:6,background:color||T.navy,borderRadius:3,
    transition:'width 0.3s ease'}),
  methodNote:{fontSize:12,color:T.textSec,lineHeight:1.6,padding:'12px 16px',
    background:T.surfaceH,borderRadius:8,borderLeft:`3px solid ${T.gold}`,marginTop:12}
};

function Chk({checked,onChange,label}){
  return <label style={{display:'inline-flex',alignItems:'center',cursor:'pointer',marginRight:16,fontSize:13}}>
    <div style={sty.checkbox(checked)} onClick={onChange}>
      {checked&&<svg width="10" height="10" viewBox="0 0 10 10"><path d="M2 5l2 2 4-4" stroke="#fff" strokeWidth="2" fill="none"/></svg>}
    </div>{label}
  </label>;
}

function SortIcon({dir}){
  if(!dir)return <span style={{color:T.textMut,marginLeft:4,fontSize:10}}></span>;
  return <span style={{marginLeft:4,fontSize:10}}>{dir==='asc'?'\u25B2':'\u25BC'}</span>;
}

function MiniBar({value,max=100,color}){
  const pct=Math.max(0,Math.min(100,(value/max)*100));
  return <div style={{display:'flex',alignItems:'center',gap:6}}>
    <div style={{flex:1,height:6,background:T.surfaceH,borderRadius:3,overflow:'hidden',minWidth:40}}>
      <div style={sty.pctBar(pct,color)}/>
    </div>
  </div>;
}

export default function EsgRatingsComparatorPage(){
  const allData=useMemo(()=>genRatings(),[]);
  const [tab,setTab]=useState(0);
  const [providerFilter,setProviderFilter]=useState([true,true,true,true,true,true]);
  const [sectorFilter,setSectorFilter]=useState('All');
  const [searchQuery,setSearchQuery]=useState('');
  const [sortCol,setSortCol]=useState('divergence');
  const [sortDir,setSortDir]=useState('desc');
  const [expandedRow,setExpandedRow]=useState(null);
  const [showMethodology,setShowMethodology]=useState(false);
  const [corrSector,setCorrSector]=useState('All');
  const [corrCell,setCorrCell]=useState(null);
  const [biasMode,setBiasMode]=useState('absolute');
  const [biasSector,setBiasSector]=useState('All');
  const [highlightProvider,setHighlightProvider]=useState(null);
  const [portfolio,setPortfolio]=useState(()=>{
    const ids=[];for(let i=0;i<20;i++)ids.push(Math.floor(sr(i*53+99)*50));
    return [...new Set(ids)].slice(0,20);
  });
  const [portSearch,setPortSearch]=useState('');
  const [portSector,setPortSector]=useState('All');
  const [portSort,setPortSort]=useState('consensus');
  const [portSortDir,setPortSortDir]=useState('desc');
  const [divThreshold,setDivThreshold]=useState('all');

  const TABS=['Provider Comparison','Correlation Matrix','Sector Bias Analysis','Portfolio Analyzer'];

  const filteredData=useMemo(()=>{
    let d=allData;
    if(sectorFilter!=='All')d=d.filter(r=>r.sector===sectorFilter);
    if(searchQuery.trim()){
      const q=searchQuery.toLowerCase();
      d=d.filter(r=>r.name.toLowerCase().includes(q));
    }
    if(divThreshold!=='all'){
      if(divThreshold==='low')d=d.filter(r=>r.divergence<15);
      else if(divThreshold==='medium')d=d.filter(r=>r.divergence>=15&&r.divergence<30);
      else if(divThreshold==='high')d=d.filter(r=>r.divergence>=30);
    }
    return d;
  },[allData,sectorFilter,searchQuery,divThreshold]);

  const sortedData=useMemo(()=>{
    const d=[...filteredData];
    d.sort((a,b)=>{
      let va,vb;
      switch(sortCol){
        case 'name':va=a.name;vb=b.name;return sortDir==='asc'?va.localeCompare(vb):vb.localeCompare(va);
        case 'msci':va=a.msciNum;vb=b.msciNum;break;
        case 'sust':va=a.sust;vb=b.sust;break;
        case 'iss':va=a.iss;vb=b.iss;break;
        case 'cdp':va=a.cdpNum;vb=b.cdpNum;break;
        case 'sp':va=a.sp;vb=b.sp;break;
        case 'bbg':va=a.bbg;vb=b.bbg;break;
        case 'consensus':va=a.consensus;vb=b.consensus;break;
        case 'divergence':va=a.divergence;vb=b.divergence;break;
        default:va=0;vb=0;
      }
      return sortDir==='asc'?va-vb:vb-va;
    });
    return d;
  },[filteredData,sortCol,sortDir]);

  const summaryStats=useMemo(()=>{
    const d=filteredData;
    if(!d.length)return null;
    const avgCons=Math.round(d.reduce((a,r)=>a+r.consensus,0)/d.length*10)/10;
    const avgDiv=Math.round(d.reduce((a,r)=>a+r.divergence,0)/d.length*10)/10;
    const highDiv=d.filter(r=>r.divergence>=30).length;
    const lowDiv=d.filter(r=>r.divergence<15).length;
    const bestCons=d.reduce((best,r)=>r.consensus>best.consensus?r:best,d[0]);
    const worstDiv=d.reduce((w,r)=>r.divergence>w.divergence?r:w,d[0]);
    return{avgCons,avgDiv,highDiv,lowDiv,bestCons,worstDiv,count:d.length};
  },[filteredData]);

  const handleSort=(col)=>{
    if(sortCol===col)setSortDir(d=>d==='asc'?'desc':'asc');
    else{setSortCol(col);setSortDir('desc');}
  };

  const toggleProvider=(i)=>{
    const n=[...providerFilter];n[i]=!n[i];setProviderFilter(n);
  };

  const percentileRanks=useMemo(()=>{
    const ranks={};
    const sorted=[...allData].sort((a,b)=>a.consensus-b.consensus);
    sorted.forEach((r,idx)=>{ranks[r.id]=Math.round(idx/(sorted.length-1)*100);});
    return ranks;
  },[allData]);

  const correlations=useMemo(()=>{
    let d=allData;
    if(corrSector!=='All')d=d.filter(r=>r.sector===corrSector);
    const mat=[];
    for(let i=0;i<6;i++){
      mat[i]=[];
      for(let j=0;j<6;j++){
        const xs=d.map(r=>r.norms[i]);
        const ys=d.map(r=>r.norms[j]);
        const n=xs.length;
        const mx=xs.reduce((a,b)=>a+b,0)/n;
        const my=ys.reduce((a,b)=>a+b,0)/n;
        let num=0,dx=0,dy=0;
        for(let k=0;k<n;k++){num+=(xs[k]-mx)*(ys[k]-my);dx+=(xs[k]-mx)**2;dy+=(ys[k]-my)**2;}
        mat[i][j]=dx&&dy?Math.round(num/Math.sqrt(dx*dy)*100)/100:i===j?1:0;
      }
    }
    return mat;
  },[allData,corrSector]);

  const avgCorr=useMemo(()=>{
    let s=0,c=0;
    for(let i=0;i<6;i++)for(let j=i+1;j<6;j++){s+=correlations[i][j];c++;}
    return Math.round(s/c*100)/100;
  },[correlations]);

  const scatterData=useMemo(()=>{
    if(!corrCell)return[];
    let d=allData;
    if(corrSector!=='All')d=d.filter(r=>r.sector===corrSector);
    return d.map(r=>({name:r.name,x:r.norms[corrCell[0]],y:r.norms[corrCell[1]],sector:r.sector}));
  },[allData,corrCell,corrSector]);

  const outlierPairs=useMemo(()=>{
    const pairs=[];
    for(let i=0;i<6;i++){
      for(let j=i+1;j<6;j++){
        if(correlations[i][j]<0.3){
          pairs.push({a:PROVIDERS[i],b:PROVIDERS[j],corr:correlations[i][j],
            aShort:PROVIDER_SHORT[i],bShort:PROVIDER_SHORT[j]});
        }
      }
    }
    return pairs.sort((a,b)=>a.corr-b.corr);
  },[correlations]);

  const sectorBiasData=useMemo(()=>{
    const targetSectors=biasSector==='All'?SECTORS:[biasSector];
    return targetSectors.map(sec=>{
      const d=allData.filter(r=>r.sector===sec);
      const avgs=[];
      for(let p=0;p<6;p++){
        const vals=d.map(r=>r.norms[p]);
        avgs.push(vals.reduce((a,b)=>a+b,0)/vals.length);
      }
      if(biasMode==='zscore'){
        const mean=avgs.reduce((a,b)=>a+b,0)/6;
        const std=Math.sqrt(avgs.reduce((a,b)=>a+(b-mean)**2,0)/6)||1;
        const obj={sector:sec};
        PROVIDER_SHORT.forEach((p,i)=>{obj[p]=Math.round((avgs[i]-mean)/std*100)/100;});
        return obj;
      }
      const obj={sector:sec};
      PROVIDER_SHORT.forEach((p,i)=>{obj[p]=Math.round(avgs[i]*10)/10;});
      return obj;
    });
  },[allData,biasMode,biasSector]);

  const sectorRankings=useMemo(()=>{
    const targetSectors=biasSector==='All'?SECTORS:[biasSector];
    return targetSectors.map(sec=>{
      const d=allData.filter(r=>r.sector===sec);
      const avgs=PROVIDER_SHORT.map((_,p)=>{
        const vals=d.map(r=>r.norms[p]);
        return{provider:PROVIDERS[p],short:PROVIDER_SHORT[p],
          avg:Math.round(vals.reduce((a,b)=>a+b,0)/vals.length*10)/10};
      });
      const sorted=[...avgs].sort((a,b)=>b.avg-a.avg);
      return{sector:sec,harshest:sorted[sorted.length-1].provider,
        generous:sorted[0].provider,rankings:sorted};
    });
  },[allData,biasSector]);

  const providerGlobalAvgs=useMemo(()=>{
    return PROVIDER_SHORT.map((_,i)=>{
      const vals=allData.map(r=>r.norms[i]);
      return Math.round(vals.reduce((a,b)=>a+b,0)/vals.length*10)/10;
    });
  },[allData]);

  const portfolioData=useMemo(()=>{
    return portfolio.map(id=>allData[id]).filter(Boolean);
  },[allData,portfolio]);

  const portfolioStats=useMemo(()=>{
    if(!portfolioData.length)return{consensus:0,coverage:0,maxDiv:0,agreement:0,medianCons:0};
    const cons=Math.round(portfolioData.reduce((a,r)=>a+r.consensus,0)/portfolioData.length*10)/10;
    const maxDiv=Math.max(...portfolioData.map(r=>r.divergence));
    const avgDiv=portfolioData.reduce((a,r)=>a+r.divergence,0)/portfolioData.length;
    const agreement=Math.round(Math.max(0,100-avgDiv*2)*10)/10;
    const sorted=[...portfolioData].sort((a,b)=>a.consensus-b.consensus);
    const mid=Math.floor(sorted.length/2);
    const medianCons=sorted.length%2?sorted[mid].consensus:Math.round((sorted[mid-1].consensus+sorted[mid].consensus)/2*10)/10;
    return{consensus:cons,coverage:portfolioData.length*6,maxDiv:Math.round(maxDiv*10)/10,agreement,medianCons};
  },[portfolioData]);

  const addToPortfolio=(id)=>{
    if(!portfolio.includes(id)&&portfolio.length<30)setPortfolio(p=>[...p,id]);
  };
  const removeFromPortfolio=(id)=>{
    setPortfolio(p=>p.filter(x=>x!==id));
  };

  const exportCSV=()=>{
    const header=['Company','Sector','MSCI','Sustainalytics','ISS ESG','CDP','S&P Global','Bloomberg ESG','Consensus','Divergence'];
    const rows=portfolioData.map(r=>[r.name,r.sector,r.msci,r.sust,r.iss,r.cdp,r.sp,r.bbg,r.consensus,r.divergence]);
    const csv=[header,...rows].map(r=>r.join(',')).join('\n');
    const blob=new Blob([csv],{type:'text/csv'});
    const url=URL.createObjectURL(blob);
    const a=document.createElement('a');a.href=url;a.download='esg_ratings_portfolio.csv';a.click();
    URL.revokeObjectURL(url);
  };

  const radarData=useMemo(()=>{
    if(expandedRow===null)return[];
    const r=allData[expandedRow];
    if(!r)return[];
    return PROVIDERS.map((p,i)=>({provider:PROVIDER_SHORT[i],value:Math.round(r.norms[i]*10)/10,fullMark:100}));
  },[allData,expandedRow]);

  const searchResults=useMemo(()=>{
    if(!portSearch.trim())return[];
    const q=portSearch.toLowerCase();
    return allData.filter(r=>r.name.toLowerCase().includes(q)&&!portfolio.includes(r.id)).slice(0,8);
  },[allData,portSearch,portfolio]);

  const portFiltered=useMemo(()=>{
    let d=portfolioData;
    if(portSector!=='All')d=d.filter(r=>r.sector===portSector);
    d=[...d].sort((a,b)=>{
      const va=portSort==='consensus'?a.consensus:a.divergence;
      const vb=portSort==='consensus'?b.consensus:b.divergence;
      return portSortDir==='asc'?va-vb:vb-va;
    });
    return d;
  },[portfolioData,portSector,portSort,portSortDir]);

  const handlePortSort=(col)=>{
    if(portSort===col)setPortSortDir(d=>d==='asc'?'desc':'asc');
    else{setPortSort(col);setPortSortDir('desc');}
  };

  return(<div style={sty.page}>
    <div style={sty.header}>
      <div>
        <h1 style={sty.title}>ESG Ratings Comparator<span style={sty.badge}>EP-AK1</span></h1>
        <p style={sty.subtitle}>Side-by-side comparison of ESG ratings across 6 major providers -- 50 companies, 10 GICS sectors</p>
      </div>
      <div style={{display:'flex',gap:12,alignItems:'center'}}>
        <div style={{...sty.card,padding:'12px 20px',marginBottom:0,textAlign:'center'}}>
          <div style={{fontSize:22,fontWeight:800,color:T.navy}}>6</div>
          <div style={{fontSize:11,color:T.textMut}}>Providers</div>
        </div>
        <div style={{...sty.card,padding:'12px 20px',marginBottom:0,textAlign:'center'}}>
          <div style={{fontSize:22,fontWeight:800,color:T.sage}}>50</div>
          <div style={{fontSize:11,color:T.textMut}}>Companies</div>
        </div>
        <div style={{...sty.card,padding:'12px 20px',marginBottom:0,textAlign:'center'}}>
          <div style={{fontSize:22,fontWeight:800,color:T.gold}}>300</div>
          <div style={{fontSize:11,color:T.textMut}}>Ratings</div>
        </div>
        <button style={sty.btn(showMethodology?'primary':'outline')}
          onClick={()=>setShowMethodology(!showMethodology)}>
          {showMethodology?'Hide':'Show'} Methodology
        </button>
      </div>
    </div>

    {showMethodology&&(
      <div style={sty.methodNote}>
        <strong>Rating Scale Normalization:</strong> All provider ratings are normalized to 0-100 for cross-provider comparison.
        MSCI grades (AAA=100, CCC=0) | Sustainalytics risk scores inverted (lower risk = higher score) |
        ISS 1-10 scaled to 0-100 | CDP letter grades (A=100, D-=0) | S&P Global and Bloomberg ESG used directly (0-100).
        Consensus = average of normalized scores. Divergence = standard deviation across providers.
        Divergence thresholds: Green (&lt;15 = high agreement), Amber (15-30 = moderate), Red (&gt;30 = significant disagreement).
      </div>
    )}

    <div style={sty.tabs}>
      {TABS.map((t,i)=><div key={i} style={sty.tab(tab===i)} onClick={()=>setTab(i)}>{t}</div>)}
    </div>

    {tab===0&&<Tab1
      data={sortedData} allData={allData} providerFilter={providerFilter} toggleProvider={toggleProvider}
      sectorFilter={sectorFilter} setSectorFilter={setSectorFilter}
      searchQuery={searchQuery} setSearchQuery={setSearchQuery}
      sortCol={sortCol} sortDir={sortDir} handleSort={handleSort}
      expandedRow={expandedRow} setExpandedRow={setExpandedRow} radarData={radarData}
      summaryStats={summaryStats} percentileRanks={percentileRanks}
      divThreshold={divThreshold} setDivThreshold={setDivThreshold}
    />}
    {tab===1&&<Tab2
      correlations={correlations} corrSector={corrSector} setCorrSector={setCorrSector}
      corrCell={corrCell} setCorrCell={setCorrCell} scatterData={scatterData} avgCorr={avgCorr}
      outlierPairs={outlierPairs}
    />}
    {tab===2&&<Tab3
      sectorBiasData={sectorBiasData} biasMode={biasMode} setBiasMode={setBiasMode}
      biasSector={biasSector} setBiasSector={setBiasSector} sectorRankings={sectorRankings}
      highlightProvider={highlightProvider} setHighlightProvider={setHighlightProvider}
      providerGlobalAvgs={providerGlobalAvgs}
    />}
    {tab===3&&<Tab4
      portfolioData={portFiltered} allPortData={portfolioData} stats={portfolioStats}
      portfolio={portfolio} addToPortfolio={addToPortfolio} removeFromPortfolio={removeFromPortfolio}
      portSearch={portSearch} setPortSearch={setPortSearch} searchResults={searchResults}
      portSector={portSector} setPortSector={setPortSector} exportCSV={exportCSV} allData={allData}
      handlePortSort={handlePortSort} portSort={portSort} portSortDir={portSortDir}
    />}
  </div>);
}

/* ======== TAB 1: Provider Comparison ======== */
function Tab1({data,allData,providerFilter,toggleProvider,sectorFilter,setSectorFilter,
  searchQuery,setSearchQuery,sortCol,sortDir,handleSort,expandedRow,setExpandedRow,radarData,
  summaryStats,percentileRanks,divThreshold,setDivThreshold}){

  return(<div>
    {/* Filters bar */}
    <div style={{...sty.card,display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:12}}>
      <div style={{display:'flex',alignItems:'center',gap:4,flexWrap:'wrap'}}>
        <span style={{fontSize:13,fontWeight:600,color:T.navy,marginRight:8}}>Providers:</span>
        {PROVIDERS.map((p,i)=><Chk key={i} checked={providerFilter[i]} onChange={()=>toggleProvider(i)} label={PROVIDER_SHORT[i]}/>)}
      </div>
      <div style={{display:'flex',alignItems:'center',gap:8,flexWrap:'wrap'}}>
        <input style={{...sty.select,minWidth:180}} placeholder="Search company..."
          value={searchQuery} onChange={e=>setSearchQuery(e.target.value)}/>
        <select style={sty.select} value={sectorFilter} onChange={e=>setSectorFilter(e.target.value)}>
          <option value="All">All Sectors</option>
          {SECTORS.map(s=><option key={s} value={s}>{s}</option>)}
        </select>
        <select style={sty.select} value={divThreshold}
          onChange={e=>setDivThreshold(e.target.value)}>
          <option value="all">All Divergence</option>
          <option value="low">Low (&lt;15)</option>
          <option value="medium">Medium (15-30)</option>
          <option value="high">High (&gt;30)</option>
        </select>
      </div>
    </div>

    {/* Summary stats */}
    {summaryStats&&(
      <div style={{display:'grid',gridTemplateColumns:'repeat(6,1fr)',gap:12,marginBottom:16}}>
        {[
          {label:'Companies',val:summaryStats.count,color:T.navy},
          {label:'Avg Consensus',val:summaryStats.avgCons,color:T.sage},
          {label:'Avg Divergence',val:summaryStats.avgDiv,color:summaryStats.avgDiv>20?T.amber:T.green},
          {label:'High Divergence',val:summaryStats.highDiv,color:T.red},
          {label:'Low Divergence',val:summaryStats.lowDiv,color:T.green},
          {label:'Best Consensus',val:summaryStats.bestCons.consensus,color:T.navy,
            sub:summaryStats.bestCons.name}
        ].map(k=>(
          <div key={k.label} style={{...sty.card,padding:'10px 14px',marginBottom:0,textAlign:'center'}}>
            <div style={{fontSize:20,fontWeight:800,color:k.color}}>{k.val}</div>
            <div style={{fontSize:11,color:T.textMut}}>{k.label}</div>
            {k.sub&&<div style={{fontSize:10,color:T.textSec,marginTop:2}}>{k.sub}</div>}
          </div>
        ))}
      </div>
    )}

    {/* Main table */}
    <div style={sty.card}>
      <div style={{overflowX:'auto'}}>
        <table style={sty.table}>
          <thead>
            <tr>
              <th style={sty.th} onClick={()=>handleSort('name')}>
                Company<SortIcon dir={sortCol==='name'?sortDir:null}/></th>
              {providerFilter[0]&&<th style={sty.th} onClick={()=>handleSort('msci')}>
                MSCI<SortIcon dir={sortCol==='msci'?sortDir:null}/></th>}
              {providerFilter[1]&&<th style={sty.th} onClick={()=>handleSort('sust')}>
                Sust (Risk)<SortIcon dir={sortCol==='sust'?sortDir:null}/></th>}
              {providerFilter[2]&&<th style={sty.th} onClick={()=>handleSort('iss')}>
                ISS (1-10)<SortIcon dir={sortCol==='iss'?sortDir:null}/></th>}
              {providerFilter[3]&&<th style={sty.th} onClick={()=>handleSort('cdp')}>
                CDP<SortIcon dir={sortCol==='cdp'?sortDir:null}/></th>}
              {providerFilter[4]&&<th style={sty.th} onClick={()=>handleSort('sp')}>
                S&P (0-100)<SortIcon dir={sortCol==='sp'?sortDir:null}/></th>}
              {providerFilter[5]&&<th style={sty.th} onClick={()=>handleSort('bbg')}>
                BBG (0-100)<SortIcon dir={sortCol==='bbg'?sortDir:null}/></th>}
              <th style={sty.th} onClick={()=>handleSort('consensus')}>
                Consensus<SortIcon dir={sortCol==='consensus'?sortDir:null}/></th>
              <th style={sty.th} onClick={()=>handleSort('divergence')}>
                Divergence<SortIcon dir={sortCol==='divergence'?sortDir:null}/></th>
            </tr>
          </thead>
          <tbody>
            {data.map(r=>(
              <React.Fragment key={r.id}>
                <tr style={{...sty.trHover,background:expandedRow===r.id?T.surfaceH:'transparent'}}
                  onClick={()=>setExpandedRow(expandedRow===r.id?null:r.id)}
                  onMouseEnter={e=>e.currentTarget.style.background=T.surfaceH}
                  onMouseLeave={e=>{if(expandedRow!==r.id)e.currentTarget.style.background='transparent';}}>
                  <td style={{...sty.td,fontWeight:600,color:T.navy}}>
                    <div>{r.name}</div>
                    <div style={{fontSize:11,color:T.textMut,fontWeight:400}}>{r.sector}</div>
                  </td>
                  {providerFilter[0]&&<td style={sty.td}>
                    <span style={{fontFamily:T.mono,fontWeight:700,
                      color:r.msciNum<=1?T.green:r.msciNum<=3?T.gold:T.red}}>{r.msci}</span></td>}
                  {providerFilter[1]&&<td style={sty.td}>
                    <span style={{fontFamily:T.mono,
                      color:r.sust<30?T.green:r.sust<50?T.gold:T.red}}>{r.sust}</span></td>}
                  {providerFilter[2]&&<td style={sty.td}>
                    <span style={{fontFamily:T.mono,
                      color:r.iss>=7?T.green:r.iss>=4?T.gold:T.red}}>{r.iss}</span></td>}
                  {providerFilter[3]&&<td style={sty.td}>
                    <span style={{fontFamily:T.mono,fontWeight:700,
                      color:r.cdpNum<=1?T.green:r.cdpNum<=3?T.gold:T.red}}>{r.cdp}</span></td>}
                  {providerFilter[4]&&<td style={sty.td}>
                    <span style={{fontFamily:T.mono,
                      color:r.sp>=70?T.green:r.sp>=40?T.gold:T.red}}>{r.sp}</span></td>}
                  {providerFilter[5]&&<td style={sty.td}>
                    <span style={{fontFamily:T.mono,
                      color:r.bbg>=70?T.green:r.bbg>=40?T.gold:T.red}}>{r.bbg}</span></td>}
                  <td style={sty.td}>
                    <div style={{display:'flex',alignItems:'center',gap:6}}>
                      <span style={{fontFamily:T.mono,fontWeight:700}}>{r.consensus}</span>
                      <MiniBar value={r.consensus} color={T.sage}/>
                    </div>
                  </td>
                  <td style={sty.td}><span style={sty.divBadge(r.divergence)}>{r.divergence}</span></td>
                </tr>

                {expandedRow===r.id&&(
                  <tr><td colSpan={9} style={{padding:0,border:'none'}}>
                    <div style={{background:T.surfaceH,padding:20,borderBottom:`1px solid ${T.border}`}}>
                      <div style={{display:'flex',gap:24,alignItems:'flex-start',flexWrap:'wrap'}}>
                        {/* Radar chart */}
                        <div style={{width:300,flexShrink:0}}>
                          <div style={{fontSize:14,fontWeight:700,color:T.navy,marginBottom:8}}>
                            Rating Profile: {r.name}
                          </div>
                          <ResponsiveContainer width="100%" height={240}>
                            <RadarChart data={radarData} cx="50%" cy="50%" outerRadius={80}>
                              <PolarGrid stroke={T.border}/>
                              <PolarAngleAxis dataKey="provider" tick={{fontSize:11,fill:T.textSec}}/>
                              <PolarRadiusAxis angle={30} domain={[0,100]} tick={{fontSize:10}}/>
                              <Radar name="Score" dataKey="value" stroke={T.navy} fill={T.navy}
                                fillOpacity={0.25} strokeWidth={2}/>
                            </RadarChart>
                          </ResponsiveContainer>
                        </div>

                        {/* Bar breakdown */}
                        <div style={{flex:1,minWidth:260}}>
                          <div style={{fontSize:14,fontWeight:700,color:T.navy,marginBottom:12}}>
                            Normalized Scores (0-100)
                          </div>
                          {PROVIDERS.map((p,i)=>(
                            <div key={i} style={{display:'flex',alignItems:'center',gap:8,marginBottom:8}}>
                              <div style={{width:90,fontSize:12,color:T.textSec}}>{PROVIDER_SHORT[i]}</div>
                              <div style={{flex:1,height:20,background:'#e8e4de',borderRadius:10,overflow:'hidden'}}>
                                <div style={{width:`${r.norms[i]}%`,height:'100%',
                                  background:PROVIDER_COLORS[i],borderRadius:10,transition:'width 0.3s'}}/>
                              </div>
                              <div style={{width:40,fontSize:12,fontFamily:T.mono,fontWeight:600,
                                textAlign:'right'}}>{Math.round(r.norms[i])}</div>
                            </div>
                          ))}
                        </div>

                        {/* Detail stats */}
                        <div style={{width:200,flexShrink:0}}>
                          <div style={{fontSize:14,fontWeight:700,color:T.navy,marginBottom:12}}>
                            Key Metrics
                          </div>
                          {[
                            {l:'Consensus',v:r.consensus},
                            {l:'Divergence',v:r.divergence,badge:true},
                            {l:'Percentile',v:`${percentileRanks[r.id]||0}th`},
                            {l:'Min Score',v:Math.round(Math.min(...r.norms))},
                            {l:'Max Score',v:Math.round(Math.max(...r.norms))},
                            {l:'Range',v:Math.round(Math.max(...r.norms)-Math.min(...r.norms))}
                          ].map(m=>(
                            <div key={m.l} style={{display:'flex',justifyContent:'space-between',
                              padding:'4px 0',borderBottom:`1px solid ${T.border}`,fontSize:12}}>
                              <span style={{color:T.textMut}}>{m.l}</span>
                              {m.badge?<span style={sty.divBadge(r.divergence)}>{m.v}</span>:
                                <span style={{fontWeight:700,fontFamily:T.mono}}>{m.v}</span>}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </td></tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{marginTop:12,fontSize:12,color:T.textMut,display:'flex',justifyContent:'space-between'}}>
        <span>Showing {data.length} companies. Click a row to expand rating profile.</span>
        <span>Sorted by: {sortCol} ({sortDir})</span>
      </div>
    </div>
  </div>);
}

/* ======== TAB 2: Correlation Matrix ======== */
function Tab2({correlations,corrSector,setCorrSector,corrCell,setCorrCell,scatterData,avgCorr,outlierPairs}){
  return(<div>
    <div style={{display:'flex',gap:16,marginBottom:16,alignItems:'flex-start',flexWrap:'wrap'}}>
      <div style={{...sty.card,flex:'0 0 auto',marginBottom:0}}>
        <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:16,flexWrap:'wrap'}}>
          <span style={{fontSize:13,fontWeight:600,color:T.navy}}>Sector:</span>
          <select style={sty.select} value={corrSector}
            onChange={e=>{setCorrSector(e.target.value);setCorrCell(null);}}>
            <option value="All">All Sectors</option>
            {SECTORS.map(s=><option key={s} value={s}>{s}</option>)}
          </select>
          <div style={{marginLeft:16,padding:'8px 16px',background:T.surfaceH,borderRadius:8}}>
            <span style={{fontSize:12,color:T.textMut}}>Avg Cross-Provider Correlation: </span>
            <span style={{fontWeight:800,color:T.navy,fontFamily:T.mono}}>{avgCorr}</span>
          </div>
        </div>
        <div style={{fontSize:14,fontWeight:700,color:T.navy,marginBottom:12}}>Provider Correlation Matrix</div>
        <table style={{borderCollapse:'separate',borderSpacing:4}}>
          <thead>
            <tr>
              <td style={{width:60}}/>
              {PROVIDER_SHORT.map((p,i)=><td key={i} style={{fontSize:11,fontWeight:700,
                color:T.navy,textAlign:'center',width:64}}>{p}</td>)}
            </tr>
          </thead>
          <tbody>
            {PROVIDER_SHORT.map((p,i)=>(
              <tr key={i}>
                <td style={{fontSize:11,fontWeight:700,color:T.navy,paddingRight:8}}>{p}</td>
                {correlations[i].map((v,j)=>(
                  <td key={j}>
                    <div
                      style={{...sty.matCell(Math.abs(v)),
                        border:corrCell&&corrCell[0]===i&&corrCell[1]===j
                          ?'3px solid #000':'3px solid transparent'}}
                      onClick={()=>{if(i!==j)setCorrCell(
                        corrCell&&corrCell[0]===i&&corrCell[1]===j?null:[i,j]);}}
                    >{v.toFixed(2)}</div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{marginTop:12,fontSize:11,color:T.textMut}}>
          Click a cell to view scatter plot (excluding diagonal).
        </div>
        <div style={{display:'flex',gap:8,marginTop:8}}>
          {[{c:T.navy,l:'> 0.8'},{c:T.navyL,l:'0.6-0.8'},{c:T.sage,l:'0.4-0.6'},
            {c:T.gold,l:'0.2-0.4'},{c:T.red,l:'< 0.2'}].map(({c,l})=>(
            <div key={l} style={{display:'flex',alignItems:'center',gap:4,fontSize:10}}>
              <div style={{width:12,height:12,borderRadius:3,background:c}}/>{l}
            </div>
          ))}
        </div>
      </div>

      {corrCell&&(
        <div style={{...sty.card,flex:1,minWidth:360,marginBottom:0}}>
          <div style={{fontSize:14,fontWeight:700,color:T.navy,marginBottom:4}}>
            {PROVIDERS[corrCell[0]]} vs {PROVIDERS[corrCell[1]]}
          </div>
          <div style={{fontSize:12,color:T.textMut,marginBottom:12}}>
            Correlation: <span style={{fontWeight:700,color:T.navy}}>
              {correlations[corrCell[0]][corrCell[1]].toFixed(3)}</span>
            {corrSector!=='All'&&<span> | Sector: {corrSector}</span>}
            <span> | N = {scatterData.length}</span>
          </div>
          <ResponsiveContainer width="100%" height={340}>
            <ScatterChart margin={{top:10,right:20,bottom:20,left:10}}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
              <XAxis type="number" dataKey="x" name={PROVIDER_SHORT[corrCell[0]]} domain={[0,100]}
                tick={{fontSize:11}} label={{value:PROVIDER_SHORT[corrCell[0]],position:'bottom',
                  fontSize:12,fill:T.textSec}}/>
              <YAxis type="number" dataKey="y" name={PROVIDER_SHORT[corrCell[1]]} domain={[0,100]}
                tick={{fontSize:11}} label={{value:PROVIDER_SHORT[corrCell[1]],angle:-90,
                  position:'left',fontSize:12,fill:T.textSec}}/>
              <Tooltip cursor={{strokeDasharray:'3 3'}} content={({payload})=>{
                if(!payload||!payload.length)return null;
                const d=payload[0].payload;
                return <div style={{background:T.surface,border:`1px solid ${T.border}`,
                  borderRadius:8,padding:10,fontSize:12}}>
                  <div style={{fontWeight:700,color:T.navy}}>{d.name}</div>
                  <div style={{color:T.textSec}}>{d.sector}</div>
                  <div>{PROVIDER_SHORT[corrCell[0]]}: <b>{Math.round(d.x)}</b></div>
                  <div>{PROVIDER_SHORT[corrCell[1]]}: <b>{Math.round(d.y)}</b></div>
                </div>;
              }}/>
              <Scatter data={scatterData} fill={T.navy} fillOpacity={0.6} r={5}>
                {scatterData.map((entry,idx)=>(
                  <Cell key={idx} fill={PROVIDER_COLORS[SECTORS.indexOf(entry.sector)%PROVIDER_COLORS.length]}/>
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>

    {/* Insights and outlier pairs */}
    <div style={{display:'grid',gridTemplateColumns:corrCell?'1fr':'1fr 1fr',gap:16}}>
      <div style={sty.card}>
        <div style={sty.cardTitle}>Key Insights</div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))',gap:12}}>
          {[
            {label:'Highest Correlation',val:(()=>{let mx=-1,pi='',pj='';
              for(let i=0;i<6;i++)for(let j=i+1;j<6;j++)if(correlations[i][j]>mx){
                mx=correlations[i][j];pi=PROVIDER_SHORT[i];pj=PROVIDER_SHORT[j];}
              return `${pi} - ${pj}: ${mx.toFixed(2)}`;})()},
            {label:'Lowest Correlation',val:(()=>{let mn=2,pi='',pj='';
              for(let i=0;i<6;i++)for(let j=i+1;j<6;j++)if(correlations[i][j]<mn){
                mn=correlations[i][j];pi=PROVIDER_SHORT[i];pj=PROVIDER_SHORT[j];}
              return `${pi} - ${pj}: ${mn.toFixed(2)}`;})()},
            {label:'Average Correlation',val:avgCorr.toFixed(3)},
            {label:'Sector Filter',val:corrSector==='All'?'All 10 Sectors':corrSector}
          ].map(({label,val})=>(
            <div key={label} style={{background:T.surfaceH,borderRadius:8,padding:14}}>
              <div style={{fontSize:11,color:T.textMut,marginBottom:4}}>{label}</div>
              <div style={{fontSize:14,fontWeight:700,color:T.navy}}>{val}</div>
            </div>
          ))}
        </div>
      </div>

      {!corrCell&&outlierPairs.length>0&&(
        <div style={sty.card}>
          <div style={sty.cardTitle}>Low-Correlation Provider Pairs</div>
          <div style={{fontSize:12,color:T.textMut,marginBottom:12}}>
            Pairs with correlation below 0.3 -- indicating significant methodology differences.
          </div>
          {outlierPairs.map((p,i)=>(
            <div key={i} style={{display:'flex',alignItems:'center',justifyContent:'space-between',
              padding:'8px 12px',borderBottom:`1px solid ${T.border}`,cursor:'pointer'}}
              onClick={()=>setCorrCell([PROVIDER_SHORT.indexOf(p.aShort),PROVIDER_SHORT.indexOf(p.bShort)])}
              onMouseEnter={e=>e.currentTarget.style.background=T.surfaceH}
              onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
              <div style={{display:'flex',alignItems:'center',gap:8}}>
                <span style={{fontWeight:700,color:T.navy}}>{p.a}</span>
                <span style={{color:T.textMut}}>vs</span>
                <span style={{fontWeight:700,color:T.navy}}>{p.b}</span>
              </div>
              <span style={{fontFamily:T.mono,fontWeight:700,color:T.red}}>{p.corr.toFixed(2)}</span>
            </div>
          ))}
          {outlierPairs.length===0&&(
            <div style={{padding:12,fontSize:12,color:T.textMut,textAlign:'center'}}>
              No low-correlation pairs found. All providers show moderate-to-high agreement.
            </div>
          )}
        </div>
      )}
    </div>
  </div>);
}

/* ======== TAB 3: Sector Bias Analysis ======== */
function Tab3({sectorBiasData,biasMode,setBiasMode,biasSector,setBiasSector,sectorRankings,
  highlightProvider,setHighlightProvider,providerGlobalAvgs}){

  return(<div>
    <div style={{...sty.card,display:'flex',alignItems:'center',gap:16,flexWrap:'wrap'}}>
      <span style={{fontSize:13,fontWeight:600,color:T.navy}}>Sector:</span>
      <select style={sty.select} value={biasSector} onChange={e=>setBiasSector(e.target.value)}>
        <option value="All">All Sectors</option>
        {SECTORS.map(s=><option key={s} value={s}>{s}</option>)}
      </select>
      <div style={{display:'flex',gap:4,marginLeft:16}}>
        <button style={sty.toggle(biasMode==='absolute')} onClick={()=>setBiasMode('absolute')}>
          Absolute Scores</button>
        <button style={sty.toggle(biasMode==='zscore')} onClick={()=>setBiasMode('zscore')}>
          Z-Scores</button>
      </div>
      <div style={{marginLeft:'auto',display:'flex',alignItems:'center',gap:8}}>
        <span style={{fontSize:12,color:T.textMut}}>Highlight:</span>
        <select style={sty.select} value={highlightProvider||''}
          onChange={e=>setHighlightProvider(e.target.value||null)}>
          <option value="">All Providers</option>
          {PROVIDERS.map((p,i)=><option key={i} value={PROVIDER_SHORT[i]}>{p}</option>)}
        </select>
      </div>
    </div>

    {/* Provider global averages */}
    <div style={{display:'grid',gridTemplateColumns:'repeat(6,1fr)',gap:12,marginBottom:16}}>
      {PROVIDERS.map((p,i)=>(
        <div key={i} style={{...sty.card,padding:'12px 14px',marginBottom:0,textAlign:'center',
          border:highlightProvider===PROVIDER_SHORT[i]?`2px solid ${PROVIDER_COLORS[i]}`
            :`1px solid ${T.border}`,cursor:'pointer'}}
          onClick={()=>setHighlightProvider(
            highlightProvider===PROVIDER_SHORT[i]?null:PROVIDER_SHORT[i])}>
          <div style={{fontSize:11,color:T.textMut,marginBottom:4}}>{PROVIDER_SHORT[i]}</div>
          <div style={{fontSize:20,fontWeight:800,color:PROVIDER_COLORS[i]}}>{providerGlobalAvgs[i]}</div>
          <div style={{fontSize:10,color:T.textMut}}>Global Avg</div>
        </div>
      ))}
    </div>

    <div style={sty.card}>
      <div style={sty.cardTitle}>
        Average Rating per Provider per Sector {biasMode==='zscore'?'(Z-Score)':'(Normalized 0-100)'}
      </div>
      <ResponsiveContainer width="100%" height={Math.max(300,sectorBiasData.length*50+60)}>
        <BarChart data={sectorBiasData} layout="vertical" margin={{top:10,right:30,left:100,bottom:10}}>
          <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
          <XAxis type="number" tick={{fontSize:11}} domain={biasMode==='zscore'?[-3,3]:[0,100]}/>
          <YAxis type="category" dataKey="sector" tick={{fontSize:11}} width={95}/>
          <Tooltip contentStyle={{borderRadius:8,border:`1px solid ${T.border}`,fontSize:12}}/>
          <Legend wrapperStyle={{fontSize:12}}/>
          {PROVIDER_SHORT.map((p,i)=>(
            <Bar key={p} dataKey={p} fill={PROVIDER_COLORS[i]} barSize={8} radius={[0,4,4,0]}
              fillOpacity={highlightProvider&&highlightProvider!==p?0.15:1}/>
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>

    <div style={sty.card}>
      <div style={sty.cardTitle}>Provider Rankings by Sector</div>
      <div style={{overflowX:'auto'}}>
        <table style={sty.table}>
          <thead>
            <tr>
              <th style={sty.th}>Sector</th>
              <th style={sty.th}>Most Generous</th>
              <th style={sty.th}>Harshest</th>
              <th style={{...sty.th,minWidth:300}}>Ranking (High to Low)</th>
            </tr>
          </thead>
          <tbody>
            {sectorRankings.map(s=>(
              <tr key={s.sector} onMouseEnter={e=>e.currentTarget.style.background=T.surfaceH}
                onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                <td style={{...sty.td,fontWeight:600,color:T.navy}}>{s.sector}</td>
                <td style={sty.td}><span style={{color:T.green,fontWeight:700}}>{s.generous}</span></td>
                <td style={sty.td}><span style={{color:T.red,fontWeight:700}}>{s.harshest}</span></td>
                <td style={sty.td}>
                  <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
                    {s.rankings.map((r,i)=>(
                      <span key={r.short} style={{
                        padding:'2px 8px',borderRadius:12,fontSize:11,fontWeight:600,
                        background:i===0?'#dcfce7':i===s.rankings.length-1?'#fee2e2':T.surfaceH,
                        color:i===0?T.green:i===s.rankings.length-1?T.red:T.textSec,
                        border:highlightProvider===r.short?`2px solid ${T.navy}`:'2px solid transparent'
                      }}>{r.short} {r.avg}</span>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>

    <div style={sty.methodNote}>
      <strong>Interpretation:</strong> Z-scores show how each provider deviates from the cross-provider mean
      for a given sector. Positive z-scores indicate a provider rates that sector more favorably than
      peers; negative z-scores indicate harsher assessment. Absolute scores show the raw normalized average.
    </div>
  </div>);
}

/* ======== TAB 4: Portfolio Analyzer ======== */
function Tab4({portfolioData,allPortData,stats,portfolio,addToPortfolio,removeFromPortfolio,
  portSearch,setPortSearch,searchResults,portSector,setPortSector,exportCSV,allData,
  handlePortSort,portSort,portSortDir}){

  return(<div>
    {/* KPI row */}
    <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:16,marginBottom:16}}>
      {[
        {label:'Consensus Rating',val:stats.consensus,color:T.navy,sub:'/100'},
        {label:'Median Consensus',val:stats.medianCons,color:T.navyL,sub:'50th pctile'},
        {label:'Coverage (Ratings)',val:stats.coverage,color:T.sage,sub:`${portfolio.length} x 6`},
        {label:'Max Divergence',val:stats.maxDiv,
          color:stats.maxDiv>30?T.red:stats.maxDiv>15?T.amber:T.green,
          sub:stats.maxDiv<15?'Low':stats.maxDiv<30?'Medium':'High'},
        {label:'Agreement Score',val:`${stats.agreement}%`,
          color:stats.agreement>70?T.green:stats.agreement>50?T.amber:T.red,
          sub:'Cross-provider'}
      ].map(k=>(
        <div key={k.label} style={sty.card}>
          <div style={sty.kpi}>
            <div style={{...sty.kpiVal,color:k.color}}>{k.val}</div>
            <div style={sty.kpiLbl}>{k.label}</div>
            <div style={{fontSize:10,color:T.textMut,marginTop:2}}>{k.sub}</div>
          </div>
        </div>
      ))}
    </div>

    {/* Portfolio list + search */}
    <div style={{display:'flex',gap:16,marginBottom:16,flexWrap:'wrap'}}>
      <div style={{...sty.card,flex:'1 1 440px',marginBottom:0}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',
          marginBottom:12,flexWrap:'wrap',gap:8}}>
          <div style={sty.cardTitle}>Portfolio Companies ({portfolio.length})</div>
          <div style={{display:'flex',gap:8,alignItems:'center'}}>
            <select style={sty.select} value={portSector}
              onChange={e=>setPortSector(e.target.value)}>
              <option value="All">All Sectors</option>
              {SECTORS.map(s=><option key={s} value={s}>{s}</option>)}
            </select>
            <button style={sty.btn('primary')} onClick={exportCSV}>Export CSV</button>
          </div>
        </div>
        <div style={{maxHeight:420,overflowY:'auto'}}>
          <table style={sty.table}>
            <thead>
              <tr>
                <th style={sty.th}>Company</th>
                <th style={sty.th} onClick={()=>handlePortSort('consensus')}>
                  Consensus<SortIcon dir={portSort==='consensus'?portSortDir:null}/></th>
                <th style={sty.th} onClick={()=>handlePortSort('divergence')}>
                  Divergence<SortIcon dir={portSort==='divergence'?portSortDir:null}/></th>
                <th style={{...sty.th,width:40}}/>
              </tr>
            </thead>
            <tbody>
              {portfolioData.map(r=>(
                <tr key={r.id}
                  onMouseEnter={e=>e.currentTarget.style.background=T.surfaceH}
                  onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                  <td style={{...sty.td,fontWeight:600,color:T.navy}}>
                    <div>{r.name}</div>
                    <div style={{fontSize:10,color:T.textMut,fontWeight:400}}>{r.sector}</div>
                  </td>
                  <td style={sty.td}>
                    <div style={{display:'flex',alignItems:'center',gap:6}}>
                      <span style={{fontFamily:T.mono,fontWeight:700}}>{r.consensus}</span>
                      <MiniBar value={r.consensus} color={T.sage}/>
                    </div>
                  </td>
                  <td style={sty.td}><span style={sty.divBadge(r.divergence)}>{r.divergence}</span></td>
                  <td style={sty.td}>
                    <button style={{...sty.btn('danger'),padding:'4px 8px',fontSize:11}}
                      onClick={()=>removeFromPortfolio(r.id)}>x</button>
                  </td>
                </tr>
              ))}
              {portfolioData.length===0&&(
                <tr><td colSpan={4} style={{...sty.td,textAlign:'center',color:T.textMut,padding:24}}>
                  No companies in portfolio{portSector!=='All'?` for ${portSector}`:''}.
                  Use the search panel to add companies.
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div style={{...sty.card,flex:'0 0 300px',marginBottom:0}}>
        <div style={sty.cardTitle}>Add Companies</div>
        <input
          style={{...sty.select,width:'100%',marginBottom:12,boxSizing:'border-box'}}
          placeholder="Search companies..."
          value={portSearch} onChange={e=>setPortSearch(e.target.value)}
        />
        {searchResults.length>0&&(
          <div style={{maxHeight:220,overflowY:'auto'}}>
            {searchResults.map(r=>(
              <div key={r.id} style={{display:'flex',justifyContent:'space-between',alignItems:'center',
                padding:'8px 12px',borderBottom:`1px solid ${T.border}`,cursor:'pointer'}}
                onMouseEnter={e=>e.currentTarget.style.background=T.surfaceH}
                onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                <div>
                  <div style={{fontSize:13,fontWeight:600,color:T.navy}}>{r.name}</div>
                  <div style={{fontSize:10,color:T.textMut}}>
                    {r.sector} | Consensus: {r.consensus}</div>
                </div>
                <button style={{...sty.btn('primary'),padding:'4px 12px',fontSize:11}}
                  onClick={()=>{addToPortfolio(r.id);setPortSearch('');}}>+ Add</button>
              </div>
            ))}
          </div>
        )}
        {portSearch&&searchResults.length===0&&(
          <div style={{padding:12,fontSize:12,color:T.textMut,textAlign:'center'}}>
            No matching companies found.
          </div>
        )}

        <div style={{marginTop:16}}>
          <div style={{fontSize:12,fontWeight:600,color:T.navy,marginBottom:8}}>Quick Add by Sector</div>
          <div style={{display:'flex',flexWrap:'wrap',gap:4}}>
            {SECTORS.map(sec=>{
              const available=allData.filter(c=>c.sector===sec&&!portfolio.includes(c.id));
              return <button key={sec} style={{...sty.chip(false),fontSize:10,padding:'3px 8px'}}
                onClick={()=>{if(available.length>0)addToPortfolio(available[0].id);}}>
                {sec.split(' ')[0]} ({available.length})
              </button>;
            })}
          </div>
        </div>

        <div style={{marginTop:16,padding:'10px 12px',background:T.surfaceH,borderRadius:8}}>
          <div style={{fontSize:11,fontWeight:600,color:T.navy,marginBottom:4}}>Portfolio Sectors</div>
          {[...new Set(allPortData.map(r=>r.sector))].map(sec=>{
            const count=allPortData.filter(r=>r.sector===sec).length;
            return <div key={sec} style={{display:'flex',justifyContent:'space-between',
              fontSize:11,padding:'2px 0'}}>
              <span style={{color:T.textSec}}>{sec}</span>
              <span style={{fontWeight:700,fontFamily:T.mono}}>{count}</span>
            </div>;
          })}
        </div>
      </div>
    </div>

    {/* Portfolio bar chart */}
    <div style={sty.card}>
      <div style={sty.cardTitle}>Portfolio Rating Distribution by Provider</div>
      <ResponsiveContainer width="100%" height={320}>
        <BarChart data={allPortData.map(r=>({
          name:r.name.length>12?r.name.substring(0,12)+'...':r.name,
          ...PROVIDER_SHORT.reduce((a,p,i)=>{a[p]=Math.round(r.norms[i]);return a;},{})
        }))}>
          <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
          <XAxis dataKey="name" tick={{fontSize:9,angle:-45,textAnchor:'end'}} height={60}/>
          <YAxis domain={[0,100]} tick={{fontSize:11}}/>
          <Tooltip contentStyle={{borderRadius:8,border:`1px solid ${T.border}`,fontSize:12}}/>
          <Legend wrapperStyle={{fontSize:11}}/>
          {PROVIDER_SHORT.map((p,i)=>(
            <Bar key={p} dataKey={p} fill={PROVIDER_COLORS[i]} barSize={6} radius={[2,2,0,0]}/>
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>

    {/* Coverage detail table */}
    <div style={sty.card}>
      <div style={sty.cardTitle}>Provider Coverage & Agreement Detail</div>
      <div style={{overflowX:'auto'}}>
        <table style={sty.table}>
          <thead>
            <tr>
              <th style={sty.th}>Company</th>
              {PROVIDER_SHORT.map(p=><th key={p} style={sty.th}>{p}</th>)}
              <th style={sty.th}>Min</th>
              <th style={sty.th}>Max</th>
              <th style={sty.th}>Range</th>
            </tr>
          </thead>
          <tbody>
            {allPortData.map(r=>{
              const mn=Math.min(...r.norms);
              const mx=Math.max(...r.norms);
              const range=Math.round((mx-mn)*10)/10;
              return <tr key={r.id}
                onMouseEnter={e=>e.currentTarget.style.background=T.surfaceH}
                onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                <td style={{...sty.td,fontWeight:600,color:T.navy,fontSize:12}}>{r.name}</td>
                {r.norms.map((n,i)=><td key={i} style={{...sty.td,fontFamily:T.mono,fontSize:12,
                  color:n===mx?T.green:n===mn?T.red:T.text,fontWeight:n===mx||n===mn?700:400}}>
                  {Math.round(n)}</td>)}
                <td style={{...sty.td,fontFamily:T.mono,fontSize:12,color:T.red,fontWeight:700}}>
                  {Math.round(mn)}</td>
                <td style={{...sty.td,fontFamily:T.mono,fontSize:12,color:T.green,fontWeight:700}}>
                  {Math.round(mx)}</td>
                <td style={sty.td}><span style={sty.divBadge(range/2)}>{range}</span></td>
              </tr>;
            })}
          </tbody>
        </table>
      </div>
    </div>
  </div>);
}
