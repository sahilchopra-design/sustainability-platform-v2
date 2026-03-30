import React,{useState,useMemo,useCallback} from 'react';
import {BarChart,Bar,XAxis,YAxis,CartesianGrid,Tooltip,ResponsiveContainer,LineChart,Line,PieChart,Pie,Cell,Legend} from 'recharts';

const T={bg:'#f6f4f0',surface:'#ffffff',surfaceH:'#f0ede7',border:'#e5e0d8',borderL:'#d5cfc5',navy:'#1b3a5c',navyL:'#2c5a8c',gold:'#c5a96a',goldL:'#d4be8a',sage:'#5a8a6a',sageL:'#7ba67d',teal:'#5a8a6a',text:'#1b3a5c',textSec:'#5c6b7e',textMut:'#9aa3ae',red:'#dc2626',green:'#16a34a',amber:'#d97706',font:"'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"};
const sr=(s)=>{let x=Math.sin(s+1)*10000;return x-Math.floor(x);};

const TOC_STAGES=['Inputs','Activities','Outputs','Outcomes','Impact'];
const STAGE_COLORS=[T.navy,T.navyL,T.gold,T.sage,T.green];
const SECTORS=['Clean Energy','Affordable Housing','Healthcare Access','Education','Financial Inclusion','Sustainable Agriculture','Water & Sanitation','Digital Inclusion','Climate Adaptation','Circular Economy'];
const VERIFICATION_STATUSES=['Verified','In Progress','Pending','Not Started'];
const EVIDENCE_QUALITY=['High','Medium','Low'];
const INV_PREFIXES=['Solar','Micro','Health','Edu','Fin','Agri','Aqua','Digi','Climate','Circular','Green','Impact','Social','Community','Inclusive'];
const INV_SUFFIXES=['Fund I','Fund II','Project Alpha','Project Beta','Initiative','Venture','Partnership','Co-Investment','Direct','Platform'];

const TEMPLATES={
  'Clean Energy':{inputs:['$25M capital deployed','Technical expertise','Government partnerships'],activities:['Solar farm construction','Grid connection setup','Community training'],outputs:['150MW installed capacity','500 direct jobs','12 communities connected'],outcomes:['30% reduction in energy costs','15,000 households with clean energy','40% reduction in diesel use'],impact:['50,000 tCO2e avoided annually','$12M economic value created','Improved health outcomes']},
  'Affordable Housing':{inputs:['$40M capital deployed','Land acquisition','Municipal permits'],activities:['Housing construction','Infrastructure development','Community services setup'],outputs:['2,000 housing units built','1 community center','3km road infrastructure'],outcomes:['5,000 families housed','25% rent reduction vs market','Improved school attendance'],impact:['Reduced homelessness by 15%','$8M social value created','Intergenerational wealth building']},
  'Healthcare Access':{inputs:['$15M capital deployed','Medical equipment','Staff recruitment'],activities:['Clinic construction','Telemedicine deployment','Health worker training'],outputs:['10 clinics established','50,000 consultations/year','200 health workers trained'],outcomes:['40% increase in healthcare access','30% reduction in maternal mortality','Improved vaccination rates'],impact:['20,000 DALYs averted','$25M healthcare savings','Healthier workforce']},
  'Education':{inputs:['$10M capital deployed','Curriculum development','Teacher training'],activities:['School construction','EdTech platform deployment','Scholarship programs'],outputs:['5 schools built','10,000 students enrolled','500 scholarships awarded'],outcomes:['90% completion rate','30% improvement in test scores','50% increase in employment'],impact:['$50M lifetime earnings uplift','Reduced inequality','Community development']},
  'Financial Inclusion':{inputs:['$20M capital deployed','Technology platform','Regulatory licenses'],activities:['Mobile banking deployment','Agent network building','Financial literacy programs'],outputs:['200,000 accounts opened','500 agents trained','50,000 trained in financial literacy'],outcomes:['40% increase in savings rates','25% increase in small business loans','Reduced informal lending'],impact:['$15M economic inclusion','Poverty reduction','Women economic empowerment']},
};
const defaultTemplate={inputs:['Capital deployed','Technical resources','Partnerships'],activities:['Project implementation','Capacity building','Monitoring setup'],outputs:['Direct deliverables','Jobs created','Infrastructure built'],outcomes:['Measurable improvements','Behavior changes','System changes'],impact:['Long-term societal change','Environmental restoration','Economic value created']};

const genInvestments=(count)=>{
  const out=[];
  for(let i=0;i<count;i++){
    const s1=sr(i*73+100),s2=sr(i*41+110),s3=sr(i*59+120);
    const pIdx=Math.floor(s1*INV_PREFIXES.length);
    const sIdx=Math.floor(s2*INV_SUFFIXES.length);
    const secIdx=Math.floor(s3*SECTORS.length);
    const sector=SECTORS[secIdx];
    const template=TEMPLATES[sector]||defaultTemplate;
    const stageKPIs=TOC_STAGES.map((stage,si)=>{
      const items=(template[stage.toLowerCase()]||defaultTemplate[stage.toLowerCase()]).map((item,ii)=>({
        description:item,target:Math.round(sr(i*17+si*5+ii*13+200)*1000+100),actual:Math.round(sr(i*23+si*7+ii*11+210)*900+50),unit:item.includes('$')?'$M':item.includes('%')?'%':'units'
      }));
      return{stage,color:STAGE_COLORS[si],progress:Math.round(sr(i*31+si*19+220)*50+40),items};
    });
    const invested=Math.round((sr(i*67+230)*40+5)*10)/10;
    const counterfactualBase=Math.round(sr(i*43+240)*30+10);
    const withInvestment=Math.round(counterfactualBase*(1+sr(i*53+250)*1.5+0.3));
    const additionality=Math.round(((withInvestment-counterfactualBase)/withInvestment)*100);
    const verStatus=VERIFICATION_STATUSES[Math.floor(sr(i*37+260)*4)];
    const evidenceQ=EVIDENCE_QUALITY[Math.floor(sr(i*29+270)*3)];
    const quarterlyProgress=[];
    for(let q=0;q<8;q++){
      quarterlyProgress.push({quarter:`Q${(q%4)+1}-${q<4?'24':'25'}`,inputProgress:Math.min(100,Math.round(sr(i*11+q*17+280)*20+q*12)),outputProgress:Math.min(100,Math.round(sr(i*13+q*19+290)*15+q*10)),outcomeProgress:Math.min(100,Math.round(sr(i*17+q*23+300)*12+q*8))});
    }
    out.push({id:i+1,name:`${INV_PREFIXES[pIdx]} ${INV_SUFFIXES[sIdx]}`,sector,country:['Kenya','India','Brazil','Indonesia','Nigeria','Vietnam','Mexico','Colombia','Bangladesh','Tanzania'][Math.floor(sr(i*19+310)*10)],invested,stageKPIs,counterfactualBase,withInvestment,additionality,verificationStatus:verStatus,evidenceQuality:evidenceQ,isae3000:sr(i*47+320)>0.6,thirdPartyVerifier:['KPMG','PwC','EY','Deloitte','BSR','Sustainalytics'][Math.floor(sr(i*61+330)*6)],quarterlyProgress,overallProgress:Math.round(stageKPIs.reduce((a,s)=>a+s.progress,0)/5),risks:['Execution risk','Market risk','Political risk','Climate risk','Currency risk'].filter((_,ri)=>sr(i*71+ri*31+340)>0.5),assumptions:['Stable policy environment','Market demand sustained','No major climate events','Local capacity available'].filter((_,ai)=>sr(i*83+ai*29+350)>0.4)});
  }
  return out;
};

export default function TheoryOfChangePage(){
  const [tab,setTab]=useState(0);
  const [search,setSearch]=useState('');
  const [sortKey,setSortKey]=useState('overallProgress');
  const [sortDir,setSortDir]=useState('desc');
  const [selectedInv,setSelectedInv]=useState(null);
  const [sectorFilter,setSectorFilter]=useState('All');
  const [verFilter,setVerFilter]=useState('All');

  const investments=useMemo(()=>genInvestments(30),[]);

  const filtered=useMemo(()=>{
    let f=investments.filter(inv=>inv.name.toLowerCase().includes(search.toLowerCase())||inv.sector.toLowerCase().includes(search.toLowerCase()));
    if(sectorFilter!=='All')f=f.filter(inv=>inv.sector===sectorFilter);
    if(verFilter!=='All')f=f.filter(inv=>inv.verificationStatus===verFilter);
    f.sort((a,b)=>sortDir==='desc'?(b[sortKey]||0)-(a[sortKey]||0):(a[sortKey]||0)-(b[sortKey]||0));
    return f;
  },[investments,search,sortKey,sortDir,sectorFilter,verFilter]);

  const toggleSort=(key)=>{if(sortKey===key)setSortDir(d=>d==='desc'?'asc':'desc');else{setSortKey(key);setSortDir('desc');}};

  const exportCSV=(data,filename)=>{
    if(!data||!data.length)return;
    const keys=Object.keys(data[0]).filter(k=>typeof data[0][k]!=='object');
    const csv=[keys.join(','),...data.map(r=>keys.map(k=>JSON.stringify(r[k]??'')).join(','))].join('\n');
    const blob=new Blob([csv],{type:'text/csv'});
    const url=URL.createObjectURL(blob);
    const a=document.createElement('a');a.href=url;a.download=filename;a.click();URL.revokeObjectURL(url);
  };

  const tabs=['ToC Builder','Outcome Measurement','Counterfactual Analysis','Impact Verification'];
  const st={page:{fontFamily:T.font,background:T.bg,minHeight:'100vh',padding:'24px',color:T.text},header:{marginBottom:'24px'},title:{fontSize:'28px',fontWeight:700,color:T.navy,margin:0},subtitle:{fontSize:'14px',color:T.textSec,marginTop:'4px',fontFamily:T.mono},kpiRow:{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:'12px',marginBottom:'20px'},kpiCard:{background:T.surface,border:`1px solid ${T.border}`,borderRadius:'8px',padding:'16px',textAlign:'center'},kpiVal:{fontSize:'26px',fontWeight:700,color:T.navy},kpiLabel:{fontSize:'11px',color:T.textMut,fontFamily:T.mono,marginTop:'4px'},tabBar:{display:'flex',gap:'4px',marginBottom:'20px',borderBottom:`2px solid ${T.border}`},tabBtn:(a)=>({padding:'10px 20px',background:a?T.navy:'transparent',color:a?'#fff':T.textSec,border:'none',borderRadius:'6px 6px 0 0',cursor:'pointer',fontFamily:T.font,fontSize:'13px',fontWeight:a?600:400}),card:{background:T.surface,border:`1px solid ${T.border}`,borderRadius:'8px',padding:'20px',marginBottom:'16px'},searchBar:{padding:'10px 16px',border:`1px solid ${T.border}`,borderRadius:'6px',width:'280px',fontFamily:T.font,fontSize:'13px',background:T.surface,outline:'none'},table:{width:'100%',borderCollapse:'collapse',fontSize:'12px',fontFamily:T.mono},th:{padding:'10px 12px',textAlign:'left',borderBottom:`2px solid ${T.border}`,color:T.textSec,cursor:'pointer',fontSize:'11px',fontWeight:600,textTransform:'uppercase',letterSpacing:'0.5px'},td:{padding:'10px 12px',borderBottom:`1px solid ${T.border}`},badge:(c)=>({display:'inline-block',padding:'2px 8px',borderRadius:'4px',fontSize:'10px',fontWeight:600,background:c+'20',color:c}),panel:{position:'fixed',top:0,right:0,width:'600px',height:'100vh',background:T.surface,borderLeft:`2px solid ${T.border}`,padding:'24px',overflowY:'auto',zIndex:1000,boxShadow:'-4px 0 20px rgba(0,0,0,0.1)'},overlay:{position:'fixed',top:0,left:0,width:'100vw',height:'100vh',background:'rgba(0,0,0,0.3)',zIndex:999},btn:(v)=>({padding:'8px 16px',borderRadius:'6px',border:v==='outline'?`1px solid ${T.border}`:'none',background:v==='primary'?T.navy:v==='outline'?'transparent':T.surfaceH,color:v==='primary'?'#fff':T.text,cursor:'pointer',fontFamily:T.font,fontSize:'12px',fontWeight:500}),progressBar:(pct,color)=>({background:T.border,borderRadius:'4px',height:'8px',width:'100%',overflow:'hidden',position:'relative'}),progressFill:(pct,color)=>({background:color,height:'100%',width:`${pct}%`,borderRadius:'4px',transition:'width 0.3s'})};

  const kpis=useMemo(()=>[
    {label:'Investments',value:investments.length},
    {label:'Avg Progress',value:`${Math.round(investments.reduce((a,i)=>a+i.overallProgress,0)/investments.length)}%`},
    {label:'Verified',value:investments.filter(i=>i.verificationStatus==='Verified').length},
    {label:'Avg Additionality',value:`${Math.round(investments.reduce((a,i)=>a+i.additionality,0)/investments.length)}%`},
    {label:'Total Invested',value:`$${Math.round(investments.reduce((a,i)=>a+i.invested,0))}M`}
  ],[investments]);

  const renderTocFlow=(inv)=>(
    <div style={{display:'flex',gap:'8px',alignItems:'stretch',marginBottom:'20px',overflowX:'auto'}}>
      {inv.stageKPIs.map((stage,si)=>(
        <React.Fragment key={si}>
          <div style={{flex:1,minWidth:'160px',background:stage.color+'10',border:`1px solid ${stage.color}40`,borderRadius:'8px',padding:'12px'}}>
            <div style={{fontSize:'12px',fontWeight:700,color:stage.color,marginBottom:'8px',textTransform:'uppercase'}}>{stage.stage}</div>
            <div style={st.progressBar(stage.progress,stage.color)}><div style={st.progressFill(stage.progress,stage.color)}/></div>
            <div style={{fontSize:'10px',color:T.textMut,marginTop:'4px',textAlign:'right'}}>{stage.progress}%</div>
            <div style={{marginTop:'8px'}}>
              {stage.items.map((item,ii)=>(
                <div key={ii} style={{fontSize:'11px',color:T.textSec,padding:'4px 0',borderBottom:ii<stage.items.length-1?`1px solid ${T.border}`:'none'}}>{item.description}</div>
              ))}
            </div>
          </div>
          {si<4&&<div style={{display:'flex',alignItems:'center',fontSize:'20px',color:T.textMut}}>&#8594;</div>}
        </React.Fragment>
      ))}
    </div>
  );

  const renderTab0=()=>(
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'16px'}}>
        <input style={st.searchBar} placeholder="Search investments..." value={search} onChange={e=>setSearch(e.target.value)}/>
        <div style={{display:'flex',gap:'8px'}}>
          <select style={{...st.searchBar,width:'160px'}} value={sectorFilter} onChange={e=>setSectorFilter(e.target.value)}>
            <option value="All">All Sectors</option>{SECTORS.map(s=>(<option key={s} value={s}>{s}</option>))}
          </select>
          <button style={st.btn('outline')} onClick={()=>exportCSV(filtered.map(i=>({Name:i.name,Sector:i.sector,Country:i.country,Invested:i.invested,Progress:i.overallProgress,Additionality:i.additionality,Verification:i.verificationStatus})),'toc_investments.csv')}>Export CSV</button>
        </div>
      </div>
      <div style={{fontSize:'12px',color:T.textMut,marginBottom:'12px',fontFamily:T.mono}}>Select an investment to view its Theory of Change flow</div>
      {filtered.map(inv=>(
        <div key={inv.id} style={{...st.card,cursor:'pointer',borderLeft:`4px solid ${inv.overallProgress>=70?T.green:inv.overallProgress>=50?T.gold:T.amber}`}} onClick={()=>setSelectedInv(inv)}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'12px'}}>
            <div>
              <div style={{fontSize:'15px',fontWeight:600,color:T.navy}}>{inv.name}</div>
              <div style={{fontSize:'12px',color:T.textSec}}>{inv.sector} | {inv.country} | ${inv.invested}M</div>
            </div>
            <div style={{textAlign:'right'}}>
              <div style={{fontSize:'22px',fontWeight:700,color:inv.overallProgress>=70?T.green:T.amber}}>{inv.overallProgress}%</div>
              <div style={{fontSize:'10px',color:T.textMut}}>Overall Progress</div>
            </div>
          </div>
          {renderTocFlow(inv)}
        </div>
      ))}
      {selectedInv&&(<><div style={st.overlay} onClick={()=>setSelectedInv(null)}/><div style={st.panel}>
        <div style={{display:'flex',justifyContent:'space-between',marginBottom:'20px'}}>
          <div><h3 style={{margin:0,fontSize:'18px',color:T.navy}}>{selectedInv.name}</h3><div style={{fontSize:'12px',color:T.textSec,marginTop:'4px'}}>{selectedInv.sector} | {selectedInv.country}</div></div>
          <button style={st.btn('outline')} onClick={()=>setSelectedInv(null)}>Close</button>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'12px',marginBottom:'20px'}}>
          {[{l:'Invested',v:`$${selectedInv.invested}M`},{l:'Progress',v:`${selectedInv.overallProgress}%`},{l:'Additionality',v:`${selectedInv.additionality}%`}].map((k,i)=>(
            <div key={i} style={{...st.card,textAlign:'center',padding:'12px'}}><div style={{fontSize:'20px',fontWeight:700,color:T.navy}}>{k.v}</div><div style={{fontSize:'10px',color:T.textMut}}>{k.l}</div></div>
          ))}
        </div>
        <h4 style={{fontSize:'14px',color:T.navy,marginBottom:'12px'}}>Theory of Change Flow</h4>
        {renderTocFlow(selectedInv)}
        <h4 style={{fontSize:'14px',color:T.navy,margin:'16px 0 12px'}}>Stage KPIs</h4>
        {selectedInv.stageKPIs.map((stage,si)=>(
          <div key={si} style={{marginBottom:'16px'}}>
            <div style={{fontSize:'12px',fontWeight:600,color:stage.color,marginBottom:'8px'}}>{stage.stage}</div>
            <table style={st.table}><thead><tr><th style={st.th}>KPI</th><th style={st.th}>Target</th><th style={st.th}>Actual</th><th style={st.th}>Progress</th></tr></thead><tbody>
              {stage.items.map((item,ii)=>{const pct=Math.min(100,Math.round(item.actual/item.target*100));return(
                <tr key={ii}><td style={st.td}>{item.description}</td><td style={st.td}>{item.target}</td><td style={st.td}>{item.actual}</td>
                <td style={st.td}><div style={{display:'flex',alignItems:'center',gap:'8px'}}><div style={{...st.progressBar(pct,stage.color),width:'80px'}}><div style={st.progressFill(pct,stage.color)}/></div><span style={{fontSize:'10px'}}>{pct}%</span></div></td></tr>
              );})}
            </tbody></table>
          </div>
        ))}
        <h4 style={{fontSize:'14px',color:T.navy,margin:'16px 0 8px'}}>Assumptions & Risks</h4>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px'}}>
          <div style={{...st.card,padding:'12px'}}><div style={{fontSize:'11px',fontWeight:600,color:T.textMut,marginBottom:'6px'}}>ASSUMPTIONS</div>{selectedInv.assumptions.map((a,i)=>(<div key={i} style={{fontSize:'12px',color:T.textSec,padding:'4px 0'}}>{a}</div>))}</div>
          <div style={{...st.card,padding:'12px'}}><div style={{fontSize:'11px',fontWeight:600,color:T.textMut,marginBottom:'6px'}}>RISKS</div>{selectedInv.risks.map((r,i)=>(<div key={i} style={{fontSize:'12px',color:T.red,padding:'4px 0'}}>{r}</div>))}</div>
        </div>
      </div></>)}
    </div>
  );

  const renderTab1=()=>(
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'16px'}}>
        <h3 style={{margin:0,fontSize:'16px',color:T.navy}}>Outcome Measurement Dashboard</h3>
        <button style={st.btn('outline')} onClick={()=>exportCSV(investments.map(i=>({Name:i.name,Sector:i.sector,InputProgress:i.stageKPIs[0].progress,OutputProgress:i.stageKPIs[2].progress,OutcomeProgress:i.stageKPIs[3].progress,ImpactProgress:i.stageKPIs[4].progress})),'outcome_measurement.csv')}>Export CSV</button>
      </div>
      <div style={st.card}>
        <h4 style={{margin:'0 0 12px',fontSize:'14px',color:T.navy}}>Progress by Stage (All Investments)</h4>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={TOC_STAGES.map((stage,si)=>({stage,avg:Math.round(investments.reduce((a,inv)=>a+inv.stageKPIs[si].progress,0)/investments.length)}))} margin={{top:10,right:30,left:10,bottom:10}}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
            <XAxis dataKey="stage" tick={{fontSize:12,fill:T.textSec}}/>
            <YAxis domain={[0,100]} tick={{fontSize:11,fill:T.textSec}}/>
            <Tooltip contentStyle={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:'6px',fontSize:'12px'}}/>
            <Bar dataKey="avg" name="Avg Progress %" radius={[4,4,0,0]}>
              {TOC_STAGES.map((s,i)=>(<Cell key={i} fill={STAGE_COLORS[i]}/>))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div style={st.card}>
        <h4 style={{margin:'0 0 12px',fontSize:'14px',color:T.navy}}>Quarterly Progress Tracking</h4>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={investments[0]?.quarterlyProgress||[]} margin={{top:10,right:30,left:10,bottom:10}}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
            <XAxis dataKey="quarter" tick={{fontSize:11,fill:T.textSec}}/>
            <YAxis domain={[0,100]} tick={{fontSize:11,fill:T.textSec}}/>
            <Tooltip contentStyle={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:'6px',fontSize:'12px'}}/>
            <Legend/>
            <Line type="monotone" dataKey="inputProgress" name="Inputs" stroke={STAGE_COLORS[0]} strokeWidth={2} dot={{r:3}}/>
            <Line type="monotone" dataKey="outputProgress" name="Outputs" stroke={STAGE_COLORS[2]} strokeWidth={2} dot={{r:3}}/>
            <Line type="monotone" dataKey="outcomeProgress" name="Outcomes" stroke={STAGE_COLORS[3]} strokeWidth={2} dot={{r:3}}/>
          </LineChart>
        </ResponsiveContainer>
      </div>
      <table style={st.table}>
        <thead><tr><th style={st.th}>Investment</th><th style={st.th}>Sector</th>{TOC_STAGES.map(s=>(<th key={s} style={st.th}>{s}</th>))}<th style={st.th}>Overall</th></tr></thead>
        <tbody>{filtered.map(inv=>(
          <tr key={inv.id} style={{cursor:'pointer'}} onClick={()=>setSelectedInv(inv)}>
            <td style={{...st.td,fontWeight:600,color:T.navy}}>{inv.name}</td>
            <td style={st.td}>{inv.sector}</td>
            {inv.stageKPIs.map((s,si)=>(
              <td key={si} style={st.td}><div style={{display:'flex',alignItems:'center',gap:'6px'}}><div style={{width:'50px',height:'6px',background:T.border,borderRadius:'3px',overflow:'hidden'}}><div style={{width:`${s.progress}%`,height:'100%',background:STAGE_COLORS[si],borderRadius:'3px'}}/></div><span style={{fontSize:'10px'}}>{s.progress}%</span></div></td>
            ))}
            <td style={st.td}><span style={st.badge(inv.overallProgress>=70?T.green:inv.overallProgress>=50?T.amber:T.red)}>{inv.overallProgress}%</span></td>
          </tr>
        ))}</tbody>
      </table>
    </div>
  );

  const renderTab2=()=>(
    <div>
      <div style={{...st.card,background:T.surfaceH,padding:'16px',marginBottom:'16px'}}>
        <h4 style={{margin:'0 0 8px',fontSize:'14px',color:T.navy}}>Counterfactual Methodology</h4>
        <div style={{fontSize:'12px',color:T.textSec,lineHeight:'1.6'}}>
          <strong>Additionality = (With Investment - Without Investment) / With Investment</strong><br/>
          Measures the incremental impact attributable solely to the investment, controlling for what would have occurred in a baseline scenario.
        </div>
      </div>
      <div style={st.card}>
        <h4 style={{margin:'0 0 12px',fontSize:'14px',color:T.navy}}>Additionality Distribution</h4>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={investments.sort((a,b)=>b.additionality-a.additionality).map(i=>({name:i.name.split(' ')[0],additionality:i.additionality,baseline:i.counterfactualBase,withInv:i.withInvestment}))} margin={{top:10,right:30,left:10,bottom:40}}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
            <XAxis dataKey="name" tick={{fontSize:9,fill:T.textSec,angle:-30,textAnchor:'end'}}/>
            <YAxis tick={{fontSize:11,fill:T.textSec}} label={{value:'Impact Units',angle:-90,position:'insideLeft',fill:T.textSec,fontSize:11}}/>
            <Tooltip contentStyle={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:'6px',fontSize:'12px'}}/>
            <Legend/>
            <Bar dataKey="baseline" name="Baseline (No Investment)" fill={T.border} radius={[4,4,0,0]}/>
            <Bar dataKey="withInv" name="With Investment" fill={T.sage} radius={[4,4,0,0]}/>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'12px'}}>
        <h4 style={{margin:0,fontSize:'14px',color:T.navy}}>Investment Additionality Scores</h4>
        <button style={st.btn('outline')} onClick={()=>exportCSV(investments.map(i=>({Name:i.name,Sector:i.sector,Baseline:i.counterfactualBase,WithInvestment:i.withInvestment,Additionality:i.additionality,EvidenceQuality:i.evidenceQuality})),'counterfactual_analysis.csv')}>Export CSV</button>
      </div>
      <table style={st.table}>
        <thead><tr><th style={st.th}>Investment</th><th style={st.th}>Sector</th><th style={st.th}>Baseline</th><th style={st.th}>With Investment</th><th style={st.th}>Additionality</th><th style={st.th}>Evidence</th></tr></thead>
        <tbody>{investments.sort((a,b)=>b.additionality-a.additionality).map(inv=>(
          <tr key={inv.id}>
            <td style={{...st.td,fontWeight:600,color:T.navy}}>{inv.name}</td><td style={st.td}>{inv.sector}</td>
            <td style={st.td}>{inv.counterfactualBase}</td><td style={st.td}>{inv.withInvestment}</td>
            <td style={st.td}><span style={st.badge(inv.additionality>=60?T.green:inv.additionality>=40?T.amber:T.red)}>{inv.additionality}%</span></td>
            <td style={st.td}><span style={st.badge(inv.evidenceQuality==='High'?T.green:inv.evidenceQuality==='Medium'?T.amber:T.red)}>{inv.evidenceQuality}</span></td>
          </tr>
        ))}</tbody>
      </table>
    </div>
  );

  const renderTab3=()=>{
    const verCounts=VERIFICATION_STATUSES.map(v=>({status:v,count:investments.filter(i=>i.verificationStatus===v).length}));
    return(
      <div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'16px',marginBottom:'20px'}}>
          <div style={st.card}>
            <h4 style={{margin:'0 0 12px',fontSize:'14px',color:T.navy}}>Verification Status Distribution</h4>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={verCounts} dataKey="count" nameKey="status" cx="50%" cy="50%" outerRadius={90} label={({name,percent})=>`${name} ${(percent*100).toFixed(0)}%`}>
                  {verCounts.map((e,i)=>(<Cell key={i} fill={[T.green,T.gold,T.amber,T.red][i]}/>))}
                </Pie>
                <Tooltip/>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div style={st.card}>
            <h4 style={{margin:'0 0 12px',fontSize:'14px',color:T.navy}}>Evidence Quality</h4>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={EVIDENCE_QUALITY.map(q=>({quality:q,count:investments.filter(i=>i.evidenceQuality===q).length}))} dataKey="count" nameKey="quality" cx="50%" cy="50%" outerRadius={90} label={({name,percent})=>`${name} ${(percent*100).toFixed(0)}%`}>
                  {EVIDENCE_QUALITY.map((e,i)=>(<Cell key={i} fill={[T.green,T.amber,T.red][i]}/>))}
                </Pie>
                <Tooltip/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'12px'}}>
          <div style={{display:'flex',gap:'8px'}}>
            <select style={{...st.searchBar,width:'160px'}} value={verFilter} onChange={e=>setVerFilter(e.target.value)}>
              <option value="All">All Statuses</option>{VERIFICATION_STATUSES.map(v=>(<option key={v} value={v}>{v}</option>))}
            </select>
          </div>
          <button style={st.btn('outline')} onClick={()=>exportCSV(investments.map(i=>({Name:i.name,Sector:i.sector,Status:i.verificationStatus,Evidence:i.evidenceQuality,ISAE3000:i.isae3000,Verifier:i.thirdPartyVerifier,Additionality:i.additionality})),'impact_verification.csv')}>Export CSV</button>
        </div>
        <table style={st.table}>
          <thead><tr><th style={st.th}>Investment</th><th style={st.th}>Sector</th><th style={st.th}>Status</th><th style={st.th}>Evidence</th><th style={st.th}>ISAE 3000</th><th style={st.th}>Verifier</th><th style={st.th}>Additionality</th></tr></thead>
          <tbody>{filtered.map(inv=>(
            <tr key={inv.id}>
              <td style={{...st.td,fontWeight:600,color:T.navy}}>{inv.name}</td><td style={st.td}>{inv.sector}</td>
              <td style={st.td}><span style={st.badge(inv.verificationStatus==='Verified'?T.green:inv.verificationStatus==='In Progress'?T.amber:T.red)}>{inv.verificationStatus}</span></td>
              <td style={st.td}><span style={st.badge(inv.evidenceQuality==='High'?T.green:inv.evidenceQuality==='Medium'?T.amber:T.red)}>{inv.evidenceQuality}</span></td>
              <td style={st.td}>{inv.isae3000?<span style={st.badge(T.green)}>Aligned</span>:<span style={st.badge(T.red)}>No</span>}</td>
              <td style={st.td}>{inv.thirdPartyVerifier}</td>
              <td style={st.td}>{inv.additionality}%</td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    );
  };

  return(
    <div style={st.page}>
      <div style={st.header}><h1 style={st.title}>Theory of Change</h1><div style={st.subtitle}>EP-AW3 | 30 impact investments | 5-stage ToC framework | Counterfactual analysis</div></div>
      <div style={st.kpiRow}>{kpis.map((k,i)=>(<div key={i} style={st.kpiCard}><div style={st.kpiVal}>{k.value}</div><div style={st.kpiLabel}>{k.label}</div></div>))}</div>
      <div style={st.tabBar}>{tabs.map((t,i)=>(<button key={i} style={st.tabBtn(tab===i)} onClick={()=>setTab(i)}>{t}</button>))}</div>
      {tab===0&&renderTab0()}
      {tab===1&&renderTab1()}
      {tab===2&&renderTab2()}
      {tab===3&&renderTab3()}
    </div>
  );
}
