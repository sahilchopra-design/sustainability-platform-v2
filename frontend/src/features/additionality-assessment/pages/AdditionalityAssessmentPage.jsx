import React,{useState,useMemo,useCallback} from 'react';
import {BarChart,Bar,XAxis,YAxis,CartesianGrid,Tooltip,ResponsiveContainer,RadarChart,Radar,PolarGrid,PolarAngleAxis,PolarRadiusAxis,Cell,Legend,ScatterChart,Scatter} from 'recharts';

const T={bg:'#f6f4f0',surface:'#ffffff',surfaceH:'#f0ede7',border:'#e5e0d8',borderL:'#d5cfc5',navy:'#1b3a5c',navyL:'#2c5a8c',gold:'#c5a96a',goldL:'#d4be8a',sage:'#5a8a6a',sageL:'#7ba67d',teal:'#5a8a6a',text:'#1b3a5c',textSec:'#5c6b7e',textMut:'#9aa3ae',red:'#dc2626',green:'#16a34a',amber:'#d97706',font:"'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"};
const sr=(s)=>{let x=Math.sin(s+1)*10000;return x-Math.floor(x);};

const SECTORS=['Clean Energy','Affordable Housing','Healthcare','Education','Financial Inclusion','Sustainable Agriculture','Water & Sanitation','Climate Adaptation','Circular Economy','Digital Infrastructure'];
const GEOGRAPHIES=['Sub-Saharan Africa','South Asia','Southeast Asia','Latin America','MENA','Eastern Europe','Central Asia','Pacific Islands','Caribbean','East Africa'];
const DIMENSIONS=['Financial','Strategic','Policy','Capacity'];
const DIM_COLORS=[T.navy,T.sage,T.gold,T.navyL];
const INV_PREFIXES=['Solar','Micro','Health','Edu','Fin','Agri','Aqua','Climate','Circular','Digital','Green','Impact','Social','Infra','Tech'];
const INV_SUFFIXES=['Fund I','Fund II','Fund III','Project A','Project B','Initiative','Venture','Co-Inv','Direct','Platform'];
const DFI_NAMES=['IFC','MIGA','AfDB','ADB','EBRD','KfW','CDC','FMO','Proparco','OPIC'];

const FINANCIAL_EVIDENCE=['Below-market return accepted','Concessionary terms offered','First-loss tranche provided','Longer tenor than market','Higher risk tolerance than commercial','Catalytic capital deployed'];
const STRATEGIC_EVIDENCE=['Board seat held','Technical assistance provided','ESG governance improved','Supply chain development','Market linkages created','Management capacity built'];
const POLICY_EVIDENCE=['Policy advocacy conducted','Regulatory framework improved','Standards developed','Public goods created','Demonstration effect achieved','Replication enabled'];
const CAPACITY_EVIDENCE=['Local skills transferred','Institutional capacity built','Knowledge shared','Training programs delivered','Local leadership developed','Systems strengthened'];

const genInvestments=(count)=>{
  const out=[];
  for(let i=0;i<count;i++){
    const s1=sr(i*73+700),s2=sr(i*41+710),s3=sr(i*59+720);
    const pIdx=Math.floor(s1*INV_PREFIXES.length);
    const sIdx=Math.floor(s2*INV_SUFFIXES.length);
    const secIdx=Math.floor(s3*SECTORS.length);
    const geoIdx=Math.floor(sr(i*37+730)*GEOGRAPHIES.length);
    const financialScore=Math.round(sr(i*31+740)*60+30);
    const strategicScore=Math.round(sr(i*43+750)*60+25);
    const policyScore=Math.round(sr(i*53+760)*60+20);
    const capacityScore=Math.round(sr(i*67+770)*60+25);
    const compositeScore=Math.round((financialScore*0.35+strategicScore*0.25+policyScore*0.2+capacityScore*0.2));
    const investedM=Math.round((sr(i*71+780)*60+5)*10)/10;
    const projectIRR=Math.round((sr(i*29+790)*15+2)*100)/100;
    const benchmarkIRR=Math.round((sr(i*23+800)*8+5)*100)/100;
    const irrGap=Math.round((projectIRR-benchmarkIRR)*100)/100;
    const financialEvidence=FINANCIAL_EVIDENCE.filter((_,ei)=>sr(i*17+ei*31+810)>0.45);
    const strategicEvidence=STRATEGIC_EVIDENCE.filter((_,ei)=>sr(i*19+ei*29+820)>0.5);
    const policyEvidence=POLICY_EVIDENCE.filter((_,ei)=>sr(i*23+ei*37+830)>0.55);
    const capacityEvidence=CAPACITY_EVIDENCE.filter((_,ei)=>sr(i*29+ei*41+840)>0.5);
    const dfiComparison=DFI_NAMES.slice(0,3).map((d,di)=>({name:d,score:Math.round(sr(i*13+di*43+850)*40+40)}));
    const engagement={boardSeat:sr(i*37+860)>0.5,technicalAssistance:sr(i*41+870)>0.4,governanceImprovement:sr(i*43+880)>0.45,capacityBuilding:sr(i*47+890)>0.35};
    out.push({id:i+1,name:`${INV_PREFIXES[pIdx]} ${INV_SUFFIXES[sIdx]}`,sector:SECTORS[secIdx],geography:GEOGRAPHIES[geoIdx],investedM,projectIRR,benchmarkIRR,irrGap,financialScore,strategicScore,policyScore,capacityScore,compositeScore,financialEvidence,strategicEvidence,policyEvidence,capacityEvidence,dfiComparison,engagement,rating:compositeScore>=75?'A':compositeScore>=60?'B':compositeScore>=45?'C':'D',vintage:`${2018+Math.floor(sr(i*53+900)*7)}`,tenor:`${Math.floor(sr(i*61+910)*8+3)} years`,instrument:['Equity','Debt','Mezzanine','Guarantee','TA Grant'][Math.floor(sr(i*67+920)*5)],concessionality:sr(i*71+930)>0.4?'Yes':'No',catalytic:sr(i*73+940)>0.5?'Yes':'No'});
  }
  return out;
};

export default function AdditionalityAssessmentPage(){
  const [tab,setTab]=useState(0);
  const [search,setSearch]=useState('');
  const [sortKey,setSortKey]=useState('compositeScore');
  const [sortDir,setSortDir]=useState('desc');
  const [selectedInv,setSelectedInv]=useState(null);
  const [sectorFilter,setSectorFilter]=useState('All');
  const [ratingFilter,setRatingFilter]=useState('All');

  const investments=useMemo(()=>genInvestments(60),[]);

  const filtered=useMemo(()=>{
    let f=investments.filter(inv=>inv.name.toLowerCase().includes(search.toLowerCase())||inv.sector.toLowerCase().includes(search.toLowerCase()));
    if(sectorFilter!=='All')f=f.filter(inv=>inv.sector===sectorFilter);
    if(ratingFilter!=='All')f=f.filter(inv=>inv.rating===ratingFilter);
    f.sort((a,b)=>sortDir==='desc'?(b[sortKey]||0)-(a[sortKey]||0):(a[sortKey]||0)-(b[sortKey]||0));
    return f;
  },[investments,search,sortKey,sortDir,sectorFilter,ratingFilter]);

  const toggleSort=(key)=>{if(sortKey===key)setSortDir(d=>d==='desc'?'asc':'desc');else{setSortKey(key);setSortDir('desc');}};

  const exportCSV=(data,filename)=>{
    if(!data||!data.length)return;
    const keys=Object.keys(data[0]).filter(k=>typeof data[0][k]!=='object');
    const csv=[keys.join(','),...data.map(r=>keys.map(k=>JSON.stringify(r[k]??'')).join(','))].join('\n');
    const blob=new Blob([csv],{type:'text/csv'});
    const url=URL.createObjectURL(blob);
    const a=document.createElement('a');a.href=url;a.download=filename;a.click();URL.revokeObjectURL(url);
  };

  const tabs=['Additionality Scorecard','Financial Additionality','Strategic Additionality','Portfolio Report'];
  const st={page:{fontFamily:T.font,background:T.bg,minHeight:'100vh',padding:'24px',color:T.text},header:{marginBottom:'24px'},title:{fontSize:'28px',fontWeight:700,color:T.navy,margin:0},subtitle:{fontSize:'14px',color:T.textSec,marginTop:'4px',fontFamily:T.mono},kpiRow:{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:'12px',marginBottom:'20px'},kpiCard:{background:T.surface,border:`1px solid ${T.border}`,borderRadius:'8px',padding:'16px',textAlign:'center'},kpiVal:{fontSize:'26px',fontWeight:700,color:T.navy},kpiLabel:{fontSize:'11px',color:T.textMut,fontFamily:T.mono,marginTop:'4px'},tabBar:{display:'flex',gap:'4px',marginBottom:'20px',borderBottom:`2px solid ${T.border}`},tabBtn:(a)=>({padding:'10px 20px',background:a?T.navy:'transparent',color:a?'#fff':T.textSec,border:'none',borderRadius:'6px 6px 0 0',cursor:'pointer',fontFamily:T.font,fontSize:'13px',fontWeight:a?600:400}),card:{background:T.surface,border:`1px solid ${T.border}`,borderRadius:'8px',padding:'20px',marginBottom:'16px'},searchBar:{padding:'10px 16px',border:`1px solid ${T.border}`,borderRadius:'6px',width:'260px',fontFamily:T.font,fontSize:'13px',background:T.surface,outline:'none'},table:{width:'100%',borderCollapse:'collapse',fontSize:'12px',fontFamily:T.mono},th:{padding:'10px 12px',textAlign:'left',borderBottom:`2px solid ${T.border}`,color:T.textSec,cursor:'pointer',fontSize:'11px',fontWeight:600,textTransform:'uppercase',letterSpacing:'0.5px'},td:{padding:'10px 12px',borderBottom:`1px solid ${T.border}`},badge:(c)=>({display:'inline-block',padding:'2px 8px',borderRadius:'4px',fontSize:'10px',fontWeight:600,background:c+'20',color:c}),panel:{position:'fixed',top:0,right:0,width:'560px',height:'100vh',background:T.surface,borderLeft:`2px solid ${T.border}`,padding:'24px',overflowY:'auto',zIndex:1000,boxShadow:'-4px 0 20px rgba(0,0,0,0.1)'},overlay:{position:'fixed',top:0,left:0,width:'100vw',height:'100vh',background:'rgba(0,0,0,0.3)',zIndex:999},btn:(v)=>({padding:'8px 16px',borderRadius:'6px',border:v==='outline'?`1px solid ${T.border}`:'none',background:v==='primary'?T.navy:v==='outline'?'transparent':T.surfaceH,color:v==='primary'?'#fff':T.text,cursor:'pointer',fontFamily:T.font,fontSize:'12px',fontWeight:500})};

  const kpis=useMemo(()=>[
    {label:'Investments',value:investments.length},
    {label:'Avg Composite',value:investments.length?Math.round(investments.reduce((a,i)=>a+i.compositeScore,0)/investments.length):0},
    {label:'A-Rated',value:investments.filter(i=>i.rating==='A').length},
    {label:'Catalytic Capital',value:investments.filter(i=>i.catalytic==='Yes').length},
    {label:'Total Invested',value:`$${Math.round(investments.reduce((a,i)=>a+i.investedM,0))}M`}
  ],[investments]);

  const renderTab0=()=>(
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'16px'}}>
        <input style={st.searchBar} placeholder="Search investments..." value={search} onChange={e=>setSearch(e.target.value)}/>
        <div style={{display:'flex',gap:'8px'}}>
          <select style={{...st.searchBar,width:'150px'}} value={sectorFilter} onChange={e=>setSectorFilter(e.target.value)}>
            <option value="All">All Sectors</option>{SECTORS.map(s=>(<option key={s} value={s}>{s}</option>))}
          </select>
          <select style={{...st.searchBar,width:'120px'}} value={ratingFilter} onChange={e=>setRatingFilter(e.target.value)}>
            <option value="All">All Ratings</option>{['A','B','C','D'].map(r=>(<option key={r} value={r}>{r}</option>))}
          </select>
          <button style={st.btn('outline')} onClick={()=>exportCSV(filtered.map(i=>({Name:i.name,Sector:i.sector,Geography:i.geography,Invested:i.investedM,Financial:i.financialScore,Strategic:i.strategicScore,Policy:i.policyScore,Capacity:i.capacityScore,Composite:i.compositeScore,Rating:i.rating})),'additionality_scorecard.csv')}>Export CSV</button>
        </div>
      </div>
      <div style={st.card}>
        <h4 style={{margin:'0 0 12px',fontSize:'14px',color:T.navy}}>Composite Additionality Score Distribution</h4>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={filtered.sort((a,b)=>b.compositeScore-a.compositeScore).slice(0,30).map(i=>({name:i.name.split(' ')[0],composite:i.compositeScore,financial:i.financialScore,strategic:i.strategicScore}))} margin={{top:10,right:30,left:10,bottom:40}}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
            <XAxis dataKey="name" tick={{fontSize:9,fill:T.textSec,angle:-30,textAnchor:'end'}}/>
            <YAxis domain={[0,100]} tick={{fontSize:11,fill:T.textSec}}/>
            <Tooltip contentStyle={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:'6px',fontSize:'12px'}}/>
            <Bar dataKey="composite" name="Composite Score" radius={[4,4,0,0]}>
              {filtered.sort((a,b)=>b.compositeScore-a.compositeScore).slice(0,30).map((e,i)=>(<Cell key={i} fill={e.compositeScore>=75?T.green:e.compositeScore>=60?T.gold:e.compositeScore>=45?T.amber:T.red}/>))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div style={{fontSize:'12px',color:T.textMut,marginBottom:'8px',fontFamily:T.mono}}>{filtered.length} investments</div>
      <table style={st.table}>
        <thead><tr>
          <th style={st.th} onClick={()=>toggleSort('name')}>Investment</th>
          <th style={st.th}>Sector</th><th style={st.th}>Geography</th>
          <th style={st.th} onClick={()=>toggleSort('financialScore')}>Financial</th>
          <th style={st.th} onClick={()=>toggleSort('strategicScore')}>Strategic</th>
          <th style={st.th} onClick={()=>toggleSort('policyScore')}>Policy</th>
          <th style={st.th} onClick={()=>toggleSort('capacityScore')}>Capacity</th>
          <th style={st.th} onClick={()=>toggleSort('compositeScore')}>Composite</th>
          <th style={st.th}>Rating</th>
        </tr></thead>
        <tbody>{filtered.map(inv=>(
          <tr key={inv.id} style={{cursor:'pointer',background:selectedInv?.id===inv.id?T.surfaceH:'transparent'}} onClick={()=>setSelectedInv(inv)}>
            <td style={{...st.td,fontWeight:600,color:T.navy}}>{inv.name}</td>
            <td style={st.td}>{inv.sector}</td><td style={st.td}>{inv.geography}</td>
            <td style={st.td}><span style={st.badge(inv.financialScore>=65?T.green:inv.financialScore>=45?T.amber:T.red)}>{inv.financialScore}</span></td>
            <td style={st.td}><span style={st.badge(inv.strategicScore>=65?T.green:inv.strategicScore>=45?T.amber:T.red)}>{inv.strategicScore}</span></td>
            <td style={st.td}><span style={st.badge(inv.policyScore>=65?T.green:inv.policyScore>=45?T.amber:T.red)}>{inv.policyScore}</span></td>
            <td style={st.td}><span style={st.badge(inv.capacityScore>=65?T.green:inv.capacityScore>=45?T.amber:T.red)}>{inv.capacityScore}</span></td>
            <td style={{...st.td,fontWeight:700}}>{inv.compositeScore}</td>
            <td style={st.td}><span style={st.badge(inv.rating==='A'?T.green:inv.rating==='B'?T.gold:inv.rating==='C'?T.amber:T.red)}>{inv.rating}</span></td>
          </tr>
        ))}</tbody>
      </table>
      {selectedInv&&(<><div style={st.overlay} onClick={()=>setSelectedInv(null)}/><div style={st.panel}>
        <div style={{display:'flex',justifyContent:'space-between',marginBottom:'20px'}}>
          <div><h3 style={{margin:0,fontSize:'18px',color:T.navy}}>{selectedInv.name}</h3><div style={{fontSize:'12px',color:T.textSec,marginTop:'4px'}}>{selectedInv.sector} | {selectedInv.geography} | ${selectedInv.investedM}M</div></div>
          <button style={st.btn('outline')} onClick={()=>setSelectedInv(null)}>Close</button>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'12px',marginBottom:'20px'}}>
          {DIMENSIONS.map((d,di)=>(
            <div key={di} style={{...st.card,textAlign:'center',padding:'12px',borderTop:`3px solid ${DIM_COLORS[di]}`}}>
              <div style={{fontSize:'22px',fontWeight:700,color:T.navy}}>{selectedInv[`${d.toLowerCase()}Score`]}</div>
              <div style={{fontSize:'10px',color:T.textMut}}>{d}</div>
            </div>
          ))}
        </div>
        <h4 style={{fontSize:'14px',color:T.navy,marginBottom:'12px'}}>4-Dimension Radar</h4>
        <ResponsiveContainer width="100%" height={280}>
          <RadarChart data={DIMENSIONS.map(d=>({dimension:d,score:selectedInv[`${d.toLowerCase()}Score`]}))}>
            <PolarGrid stroke={T.border}/>
            <PolarAngleAxis dataKey="dimension" tick={{fontSize:12,fill:T.textSec}}/>
            <PolarRadiusAxis angle={90} domain={[0,100]} tick={{fontSize:9}}/>
            <Radar name="Score" dataKey="score" stroke={T.navy} fill={T.navy} fillOpacity={0.25}/>
          </RadarChart>
        </ResponsiveContainer>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px',marginTop:'16px'}}>
          <div style={{...st.card,padding:'12px'}}><div style={{fontSize:'11px',fontWeight:600,color:T.textMut,marginBottom:'6px'}}>DETAILS</div>
            {[{l:'Instrument',v:selectedInv.instrument},{l:'Vintage',v:selectedInv.vintage},{l:'Tenor',v:selectedInv.tenor},{l:'Concessionality',v:selectedInv.concessionality},{l:'Catalytic',v:selectedInv.catalytic}].map((r,i)=>(
              <div key={i} style={{display:'flex',justifyContent:'space-between',padding:'4px 0',fontSize:'12px'}}><span style={{color:T.textSec}}>{r.l}</span><span style={{fontWeight:500}}>{r.v}</span></div>
            ))}
          </div>
          <div style={{...st.card,padding:'12px'}}><div style={{fontSize:'11px',fontWeight:600,color:T.textMut,marginBottom:'6px'}}>DFI COMPARISON</div>
            {selectedInv.dfiComparison.map((d,i)=>(
              <div key={i} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'4px 0',fontSize:'12px'}}>
                <span>{d.name}</span>
                <div style={{display:'flex',alignItems:'center',gap:'8px'}}><div style={{width:'60px',height:'6px',background:T.border,borderRadius:'3px',overflow:'hidden'}}><div style={{width:`${d.score}%`,height:'100%',background:T.navyL,borderRadius:'3px'}}/></div><span style={{fontSize:'10px'}}>{d.score}</span></div>
              </div>
            ))}
          </div>
        </div>
        <h4 style={{fontSize:'14px',color:T.navy,margin:'16px 0 8px'}}>Evidence</h4>
        {[{title:'Financial',evidence:selectedInv.financialEvidence,color:DIM_COLORS[0]},{title:'Strategic',evidence:selectedInv.strategicEvidence,color:DIM_COLORS[1]},{title:'Policy',evidence:selectedInv.policyEvidence,color:DIM_COLORS[2]},{title:'Capacity',evidence:selectedInv.capacityEvidence,color:DIM_COLORS[3]}].map((e,i)=>(
          <div key={i} style={{marginBottom:'12px'}}>
            <div style={{fontSize:'11px',fontWeight:600,color:e.color,marginBottom:'4px'}}>{e.title}</div>
            <div style={{display:'flex',flexWrap:'wrap',gap:'4px'}}>{e.evidence.map((ev,ei)=>(<span key={ei} style={{...st.badge(e.color),fontSize:'10px'}}>{ev}</span>))}</div>
          </div>
        ))}
      </div></>)}
    </div>
  );

  const renderTab1=()=>(
    <div>
      <div style={{...st.card,background:T.surfaceH,padding:'16px',marginBottom:'16px'}}>
        <h4 style={{margin:'0 0 8px',fontSize:'14px',color:T.navy}}>Financial Additionality Framework</h4>
        <div style={{fontSize:'12px',color:T.textSec,lineHeight:'1.6'}}>
          Assesses whether the project would have received funding from commercial sources at comparable terms. Compares project IRR against benchmark commercial IRR to measure concessional gap.
        </div>
      </div>
      <div style={st.card}>
        <h4 style={{margin:'0 0 12px',fontSize:'14px',color:T.navy}}>Project IRR vs Benchmark IRR</h4>
        <ResponsiveContainer width="100%" height={350}>
          <ScatterChart margin={{top:10,right:30,bottom:30,left:30}}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
            <XAxis dataKey="x" name="Benchmark IRR %" tick={{fontSize:11,fill:T.textSec}} label={{value:'Benchmark IRR %',position:'insideBottom',offset:-10,fill:T.textSec,fontSize:12}}/>
            <YAxis dataKey="y" name="Project IRR %" tick={{fontSize:11,fill:T.textSec}} label={{value:'Project IRR %',angle:-90,position:'insideLeft',fill:T.textSec,fontSize:12}}/>
            <Tooltip contentStyle={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:'6px',fontSize:'12px'}} formatter={(val)=>[`${val}%`]}/>
            <Scatter data={investments.map(i=>({name:i.name,x:i.benchmarkIRR,y:i.projectIRR,gap:i.irrGap}))} fill={T.navy} fillOpacity={0.6}>
              {investments.map((inv,i)=>(<Cell key={i} fill={inv.irrGap<0?T.green:T.amber}/>))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
        <div style={{fontSize:'11px',color:T.textMut,textAlign:'center',marginTop:'8px'}}>Investments below the diagonal line accepted below-market returns (higher financial additionality)</div>
      </div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'12px'}}>
        <h4 style={{margin:0,fontSize:'14px',color:T.navy}}>Financial Additionality Detail</h4>
        <button style={st.btn('outline')} onClick={()=>exportCSV(investments.map(i=>({Name:i.name,Sector:i.sector,ProjectIRR:i.projectIRR,BenchmarkIRR:i.benchmarkIRR,IRRGap:i.irrGap,Concessionality:i.concessionality,FinancialScore:i.financialScore})),'financial_additionality.csv')}>Export CSV</button>
      </div>
      <table style={st.table}>
        <thead><tr>
          <th style={st.th}>Investment</th><th style={st.th}>Sector</th>
          <th style={st.th} onClick={()=>toggleSort('projectIRR')}>Project IRR</th>
          <th style={st.th} onClick={()=>toggleSort('benchmarkIRR')}>Benchmark IRR</th>
          <th style={st.th} onClick={()=>toggleSort('irrGap')}>IRR Gap</th>
          <th style={st.th}>Concessionality</th>
          <th style={st.th} onClick={()=>toggleSort('financialScore')}>Score</th>
          <th style={st.th}>Evidence</th>
        </tr></thead>
        <tbody>{investments.sort((a,b)=>a.irrGap-b.irrGap).map(inv=>(
          <tr key={inv.id}>
            <td style={{...st.td,fontWeight:600,color:T.navy}}>{inv.name}</td><td style={st.td}>{inv.sector}</td>
            <td style={st.td}>{inv.projectIRR}%</td><td style={st.td}>{inv.benchmarkIRR}%</td>
            <td style={st.td}><span style={st.badge(inv.irrGap<0?T.green:T.amber)}>{inv.irrGap>0?'+':''}{inv.irrGap}%</span></td>
            <td style={st.td}>{inv.concessionality==='Yes'?<span style={st.badge(T.green)}>Yes</span>:<span style={st.badge(T.textMut)}>No</span>}</td>
            <td style={st.td}><span style={st.badge(inv.financialScore>=65?T.green:inv.financialScore>=45?T.amber:T.red)}>{inv.financialScore}</span></td>
            <td style={st.td}>{inv.financialEvidence.length} items</td>
          </tr>
        ))}</tbody>
      </table>
    </div>
  );

  const renderTab2=()=>(
    <div>
      <div style={{...st.card,background:T.surfaceH,padding:'16px',marginBottom:'16px'}}>
        <h4 style={{margin:'0 0 8px',fontSize:'14px',color:T.navy}}>Strategic Additionality</h4>
        <div style={{fontSize:'12px',color:T.textSec,lineHeight:'1.6'}}>
          Measures non-financial value provided: governance support, technical assistance, market linkages, and capacity building beyond capital deployment.
        </div>
      </div>
      <div style={st.card}>
        <h4 style={{margin:'0 0 12px',fontSize:'14px',color:T.navy}}>Engagement Activities by Investment</h4>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={investments.slice(0,20).map(i=>({name:i.name.split(' ')[0],strategic:i.strategicScore,policy:i.policyScore,capacity:i.capacityScore}))} margin={{top:10,right:30,left:10,bottom:40}}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
            <XAxis dataKey="name" tick={{fontSize:9,fill:T.textSec,angle:-30,textAnchor:'end'}}/>
            <YAxis domain={[0,100]} tick={{fontSize:11,fill:T.textSec}}/>
            <Tooltip contentStyle={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:'6px',fontSize:'12px'}}/>
            <Legend/>
            <Bar dataKey="strategic" name="Strategic" fill={DIM_COLORS[1]} radius={[4,4,0,0]}/>
            <Bar dataKey="policy" name="Policy" fill={DIM_COLORS[2]} radius={[4,4,0,0]}/>
            <Bar dataKey="capacity" name="Capacity" fill={DIM_COLORS[3]} radius={[4,4,0,0]}/>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <table style={st.table}>
        <thead><tr>
          <th style={st.th}>Investment</th><th style={st.th}>Board Seat</th><th style={st.th}>Tech Assistance</th><th style={st.th}>ESG Governance</th><th style={st.th}>Capacity</th><th style={st.th}>Strategic Score</th><th style={st.th}>Evidence Items</th>
        </tr></thead>
        <tbody>{investments.sort((a,b)=>b.strategicScore-a.strategicScore).map(inv=>(
          <tr key={inv.id}>
            <td style={{...st.td,fontWeight:600,color:T.navy}}>{inv.name}</td>
            <td style={st.td}>{inv.engagement.boardSeat?<span style={st.badge(T.green)}>Yes</span>:<span style={st.badge(T.textMut)}>No</span>}</td>
            <td style={st.td}>{inv.engagement.technicalAssistance?<span style={st.badge(T.green)}>Yes</span>:<span style={st.badge(T.textMut)}>No</span>}</td>
            <td style={st.td}>{inv.engagement.governanceImprovement?<span style={st.badge(T.green)}>Yes</span>:<span style={st.badge(T.textMut)}>No</span>}</td>
            <td style={st.td}>{inv.engagement.capacityBuilding?<span style={st.badge(T.green)}>Yes</span>:<span style={st.badge(T.textMut)}>No</span>}</td>
            <td style={st.td}><span style={st.badge(inv.strategicScore>=65?T.green:inv.strategicScore>=45?T.amber:T.red)}>{inv.strategicScore}</span></td>
            <td style={st.td}>{inv.strategicEvidence.length+inv.policyEvidence.length+inv.capacityEvidence.length}</td>
          </tr>
        ))}</tbody>
      </table>
    </div>
  );

  const renderTab3=()=>{
    const avgByDim=DIMENSIONS.map(d=>({dimension:d,avg:investments.length?Math.round(investments.reduce((a,i)=>a+i[`${d.toLowerCase()}Score`],0)/investments.length):0}));
    const ratingDist=['A','B','C','D'].map(r=>({rating:r,count:investments.filter(i=>i.rating===r).length}));
    return(
      <div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'16px',marginBottom:'20px'}}>
          <div style={st.card}>
            <h4 style={{margin:'0 0 12px',fontSize:'14px',color:T.navy}}>Portfolio Additionality by Dimension</h4>
            <ResponsiveContainer width="100%" height={250}>
              <RadarChart data={avgByDim}>
                <PolarGrid stroke={T.border}/>
                <PolarAngleAxis dataKey="dimension" tick={{fontSize:12,fill:T.textSec}}/>
                <PolarRadiusAxis angle={90} domain={[0,100]} tick={{fontSize:9}}/>
                <Radar name="Average" dataKey="avg" stroke={T.navy} fill={T.navy} fillOpacity={0.25}/>
              </RadarChart>
            </ResponsiveContainer>
          </div>
          <div style={st.card}>
            <h4 style={{margin:'0 0 12px',fontSize:'14px',color:T.navy}}>Rating Distribution</h4>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={ratingDist} margin={{top:10,right:30,left:10,bottom:10}}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
                <XAxis dataKey="rating" tick={{fontSize:14,fill:T.textSec}}/>
                <YAxis tick={{fontSize:11,fill:T.textSec}}/>
                <Tooltip contentStyle={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:'6px',fontSize:'12px'}}/>
                <Bar dataKey="count" name="Count" radius={[4,4,0,0]}>
                  {ratingDist.map((e,i)=>(<Cell key={i} fill={[T.green,T.gold,T.amber,T.red][i]}/>))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div style={st.card}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'12px'}}>
            <h4 style={{margin:0,fontSize:'14px',color:T.navy}}>Portfolio Additionality Report</h4>
            <button style={st.btn('primary')} onClick={()=>exportCSV(investments.map(i=>({Name:i.name,Sector:i.sector,Geography:i.geography,Invested:i.investedM,Financial:i.financialScore,Strategic:i.strategicScore,Policy:i.policyScore,Capacity:i.capacityScore,Composite:i.compositeScore,Rating:i.rating,Instrument:i.instrument,Concessionality:i.concessionality,Catalytic:i.catalytic,ProjectIRR:i.projectIRR,BenchmarkIRR:i.benchmarkIRR})),'additionality_report.csv')}>Export Full Report</button>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'12px',marginBottom:'20px'}}>
            {avgByDim.map((d,i)=>(
              <div key={i} style={{...st.card,textAlign:'center',padding:'16px',borderTop:`3px solid ${DIM_COLORS[i]}`}}>
                <div style={{fontSize:'28px',fontWeight:700,color:T.navy}}>{d.avg}</div>
                <div style={{fontSize:'12px',color:T.textMut}}>{d.dimension} Avg</div>
              </div>
            ))}
          </div>
          <h4 style={{fontSize:'14px',color:T.navy,marginBottom:'12px'}}>DFI Benchmark Comparison</h4>
          <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:'12px'}}>
            {DFI_NAMES.slice(0,5).map((d,di)=>{
              const dfiAvg=investments.length?Math.round(investments.reduce((a,inv)=>{const comp=inv.dfiComparison.find(c=>c.name===d);return a+(comp?comp.score:50);},0)/investments.length):0;
              return(
                <div key={di} style={{...st.card,textAlign:'center',padding:'12px'}}>
                  <div style={{fontSize:'20px',fontWeight:700,color:T.navy}}>{dfiAvg}</div>
                  <div style={{fontSize:'11px',color:T.textMut}}>{d}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  return(
    <div style={st.page}>
      <div style={st.header}><h1 style={st.title}>Additionality Assessment</h1><div style={st.subtitle}>EP-AW5 | 60 investments | 4-dimension additionality scoring</div></div>
      <div style={st.kpiRow}>{kpis.map((k,i)=>(<div key={i} style={st.kpiCard}><div style={st.kpiVal}>{k.value}</div><div style={st.kpiLabel}>{k.label}</div></div>))}</div>
      <div style={st.tabBar}>{tabs.map((t,i)=>(<button key={i} style={st.tabBtn(tab===i)} onClick={()=>setTab(i)}>{t}</button>))}</div>
      {tab===0&&renderTab0()}
      {tab===1&&renderTab1()}
      {tab===2&&renderTab2()}
      {tab===3&&renderTab3()}
    </div>
  );
}
