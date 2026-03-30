import React,{useState,useMemo,useCallback} from 'react';
import {BarChart,Bar,XAxis,YAxis,CartesianGrid,Tooltip,ResponsiveContainer,RadarChart,Radar,PolarGrid,PolarAngleAxis,PolarRadiusAxis,Cell,Legend,PieChart,Pie} from 'recharts';

const T={bg:'#f6f4f0',surface:'#ffffff',surfaceH:'#f0ede7',border:'#e5e0d8',borderL:'#d5cfc5',navy:'#1b3a5c',navyL:'#2c5a8c',gold:'#c5a96a',goldL:'#d4be8a',sage:'#5a8a6a',sageL:'#7ba67d',teal:'#5a8a6a',text:'#1b3a5c',textSec:'#5c6b7e',textMut:'#9aa3ae',red:'#dc2626',green:'#16a34a',amber:'#d97706',font:"'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"};
const sr=(s)=>{let x=Math.sin(s+1)*10000;return x-Math.floor(x);};

const SDG_NAMES=['No Poverty','Zero Hunger','Good Health','Quality Education','Gender Equality','Clean Water','Affordable Energy','Decent Work','Industry Innovation','Reduced Inequalities','Sustainable Cities','Responsible Consumption','Climate Action','Life Below Water','Life on Land','Peace Justice','Partnerships'];
const SDG_COLORS=['#E5243B','#DDA63A','#4C9F38','#C5192D','#FF3A21','#26BDE2','#FCC30B','#A21942','#FD6925','#DD1367','#FD9D24','#BF8B2E','#3F7E44','#0A97D9','#56C02B','#00689D','#19486A'];

const SECTORS=['Technology','Healthcare','Financial Services','Energy','Consumer Goods','Industrials','Materials','Utilities','Real Estate','Telecom','Education','Agriculture','Transportation','Mining','Retail'];
const COMPANY_PREFIXES=['Apex','Nova','Global','Prime','Stellar','Vertex','Zenith','Cascade','Meridian','Horizon','Summit','Pacific','Atlas','Quantum','Vanguard','Pinnacle','Nexus','Frontier','Crest','Forge'];
const COMPANY_SUFFIXES=['Corp','Industries','Holdings','Group','Partners','Capital','Solutions','Technologies','Systems','Dynamics','Energy','Resources','Analytics','Ventures','Labs'];

const BOND_TYPES=['Green Bond','Social Bond','Sustainability Bond','SDG Bond','Blue Bond','Transition Bond'];
const USE_OF_PROCEEDS=['Renewable Energy','Energy Efficiency','Clean Transportation','Sustainable Water','Affordable Housing','Healthcare Access','Education Programs','Food Security','Gender Finance','Digital Inclusion','Climate Adaptation','Pollution Prevention','Marine Conservation','Land Restoration','Institutional Strengthening'];

const genCompanies=(count)=>{
  const out=[];
  for(let i=0;i<count;i++){
    const s1=sr(i*71+3),s2=sr(i*37+11),s3=sr(i*53+7);
    const pIdx=Math.floor(s1*COMPANY_PREFIXES.length);
    const sIdx=Math.floor(s2*COMPANY_SUFFIXES.length);
    const secIdx=Math.floor(s3*SECTORS.length);
    const sdgScores=[];
    for(let g=0;g<17;g++){
      const sv=sr(i*17+g*31+100);
      sdgScores.push({sdg:g+1,name:SDG_NAMES[g],alignment:Math.round(sv*85+5),contribution:sv>0.5?'Positive':'Neutral',revenue:Math.round(sv*40+2)});
    }
    const topSDGs=sdgScores.sort((a,b)=>b.alignment-a.alignment).slice(0,5).map(s=>s.sdg);
    sdgScores.sort((a,b)=>a.sdg-b.sdg);
    out.push({id:i+1,name:`${COMPANY_PREFIXES[pIdx]} ${COMPANY_SUFFIXES[sIdx]}`,sector:SECTORS[secIdx],country:['US','GB','DE','JP','FR','CH','AU','CA','SG','NL'][Math.floor(sr(i*19+5)*10)],marketCap:Math.round((sr(i*41+9)*180+5)*100)/100,overallSDG:Math.round(sdgScores.reduce((a,b)=>a+b.alignment,0)/17),sdgScores,topSDGs,esgScore:Math.round(sr(i*61+13)*40+50),positiveCount:Math.floor(sr(i*29+17)*10+3),negativeCount:Math.floor(sr(i*23+19)*4),weight:Math.round((sr(i*47+21)*3+0.1)*100)/100});
  }
  return out;
};

const genBonds=(count)=>{
  const out=[];
  for(let i=0;i<count;i++){
    const s1=sr(i*67+200),s2=sr(i*43+210),s3=sr(i*31+220);
    const pIdx=Math.floor(s1*COMPANY_PREFIXES.length);
    const sIdx=Math.floor(s2*COMPANY_SUFFIXES.length);
    const btIdx=Math.floor(s3*BOND_TYPES.length);
    const primarySDGs=[];
    const numSDGs=Math.floor(sr(i*53+230)*3)+1;
    for(let j=0;j<numSDGs;j++){primarySDGs.push(Math.floor(sr(i*17+j*41+240)*17)+1);}
    const upIdx=Math.floor(sr(i*37+250)*USE_OF_PROCEEDS.length);
    out.push({id:i+1,issuer:`${COMPANY_PREFIXES[pIdx]} ${COMPANY_SUFFIXES[sIdx]}`,type:BOND_TYPES[btIdx],amount:Math.round((sr(i*71+260)*900+100)*10)/10,currency:['USD','EUR','GBP','JPY','CHF'][Math.floor(sr(i*19+270)*5)],coupon:Math.round((sr(i*29+280)*4+0.5)*100)/100,maturity:`${2025+Math.floor(sr(i*41+290)*8)}`,sdgs:[...new Set(primarySDGs)],useOfProceeds:USE_OF_PROCEEDS[upIdx],alignment:Math.round(sr(i*61+300)*40+55),verified:sr(i*47+310)>0.35,framework:['ICMA','CBI','EU Taxonomy','National'][Math.floor(sr(i*37+320)*4)]});
  }
  return out;
};

const genSDGPortfolio=()=>{
  const out=[];
  for(let g=0;g<17;g++){
    const exposure=Math.round(sr(g*71+400)*25+3);
    const target=Math.round(sr(g*43+410)*20+5);
    const topContributors=[];
    for(let c=0;c<5;c++){
      const pIdx=Math.floor(sr(g*17+c*31+420)*COMPANY_PREFIXES.length);
      const sIdx=Math.floor(sr(g*19+c*37+430)*COMPANY_SUFFIXES.length);
      topContributors.push({name:`${COMPANY_PREFIXES[pIdx]} ${COMPANY_SUFFIXES[sIdx]}`,contribution:Math.round(sr(g*23+c*41+440)*30+10)});
    }
    out.push({sdg:g+1,name:SDG_NAMES[g],color:SDG_COLORS[g],exposure,target,gap:target-exposure,investmentCount:Math.floor(sr(g*53+450)*20+5),totalAllocated:Math.round((sr(g*61+460)*500+50)*10)/10,avgAlignment:Math.round(sr(g*67+470)*30+55),topContributors,trend:sr(g*29+480)>0.5?'improving':'stable'});
  }
  return out;
};

export default function SdgAlignmentEnginePage(){
  const [tab,setTab]=useState(0);
  const [search,setSearch]=useState('');
  const [sortKey,setSortKey]=useState('overallSDG');
  const [sortDir,setSortDir]=useState('desc');
  const [selectedCompany,setSelectedCompany]=useState(null);
  const [selectedSDG,setSelectedSDG]=useState(null);
  const [selectedBond,setSelectedBond]=useState(null);
  const [bondSearch,setBondSearch]=useState('');
  const [bondSort,setBondSort]=useState('amount');

  const companies=useMemo(()=>genCompanies(120),[]);
  const bonds=useMemo(()=>genBonds(60),[]);
  const sdgPortfolio=useMemo(()=>genSDGPortfolio(),[]);

  const filtered=useMemo(()=>{
    let f=companies.filter(c=>c.name.toLowerCase().includes(search.toLowerCase())||c.sector.toLowerCase().includes(search.toLowerCase()));
    f.sort((a,b)=>sortDir==='desc'?(b[sortKey]||0)-(a[sortKey]||0):(a[sortKey]||0)-(b[sortKey]||0));
    return f;
  },[companies,search,sortKey,sortDir]);

  const filteredBonds=useMemo(()=>{
    let f=bonds.filter(b=>b.issuer.toLowerCase().includes(bondSearch.toLowerCase())||b.type.toLowerCase().includes(bondSearch.toLowerCase()));
    f.sort((a,b)=>bondSort==='amount'?b.amount-a.amount:b.alignment-a.alignment);
    return f;
  },[bonds,bondSearch,bondSort]);

  const toggleSort=(key)=>{if(sortKey===key)setSortDir(d=>d==='desc'?'asc':'desc');else{setSortKey(key);setSortDir('desc');}};

  const exportCSV=(data,filename)=>{
    if(!data||!data.length)return;
    const keys=Object.keys(data[0]).filter(k=>typeof data[0][k]!=='object');
    const csv=[keys.join(','),...data.map(r=>keys.map(k=>JSON.stringify(r[k]??'')).join(','))].join('\n');
    const blob=new Blob([csv],{type:'text/csv'});
    const url=URL.createObjectURL(blob);
    const a=document.createElement('a');a.href=url;a.download=filename;a.click();URL.revokeObjectURL(url);
  };

  const tabs=['SDG Portfolio Overview','Company SDG Scorer','SDG Bond Tagging','SDG Gap Analysis'];
  const kpiData=useMemo(()=>[
    {label:'Portfolio SDG Score',value:Math.round(companies.reduce((a,c)=>a+c.overallSDG,0)/companies.length),unit:'/100'},
    {label:'SDGs Covered (>5%)',value:sdgPortfolio.filter(s=>s.exposure>5).length,unit:'/17'},
    {label:'Total SDG Bonds',value:bonds.length,unit:'instruments'},
    {label:'Avg Alignment',value:Math.round(bonds.reduce((a,b)=>a+b.alignment,0)/bonds.length),unit:'%'},
    {label:'Verified Bonds',value:bonds.filter(b=>b.verified).length,unit:'bonds'},
    {label:'SDG Gaps',value:sdgPortfolio.filter(s=>s.gap>5).length,unit:'SDGs'}
  ],[companies,bonds,sdgPortfolio]);

  const st={page:{fontFamily:T.font,background:T.bg,minHeight:'100vh',padding:'24px',color:T.text},header:{marginBottom:'24px'},title:{fontSize:'28px',fontWeight:700,color:T.navy,margin:0},subtitle:{fontSize:'14px',color:T.textSec,marginTop:'4px',fontFamily:T.mono},kpiRow:{display:'grid',gridTemplateColumns:'repeat(6,1fr)',gap:'12px',marginBottom:'20px'},kpiCard:{background:T.surface,border:`1px solid ${T.border}`,borderRadius:'8px',padding:'16px',textAlign:'center'},kpiVal:{fontSize:'28px',fontWeight:700,color:T.navy},kpiLabel:{fontSize:'11px',color:T.textMut,fontFamily:T.mono,marginTop:'4px'},tabBar:{display:'flex',gap:'4px',marginBottom:'20px',borderBottom:`2px solid ${T.border}`,paddingBottom:'0'},tabBtn:(a)=>({padding:'10px 20px',background:a?T.navy:'transparent',color:a?'#fff':T.textSec,border:'none',borderRadius:'6px 6px 0 0',cursor:'pointer',fontFamily:T.font,fontSize:'13px',fontWeight:a?600:400}),card:{background:T.surface,border:`1px solid ${T.border}`,borderRadius:'8px',padding:'20px',marginBottom:'16px'},searchBar:{padding:'10px 16px',border:`1px solid ${T.border}`,borderRadius:'6px',width:'320px',fontFamily:T.font,fontSize:'13px',background:T.surface,outline:'none'},table:{width:'100%',borderCollapse:'collapse',fontSize:'12px',fontFamily:T.mono},th:{padding:'10px 12px',textAlign:'left',borderBottom:`2px solid ${T.border}`,color:T.textSec,cursor:'pointer',fontSize:'11px',fontWeight:600,textTransform:'uppercase',letterSpacing:'0.5px'},td:{padding:'10px 12px',borderBottom:`1px solid ${T.border}`},badge:(c)=>({display:'inline-block',padding:'2px 8px',borderRadius:'4px',fontSize:'10px',fontWeight:600,background:c+'20',color:c}),sdgDot:(c)=>({display:'inline-block',width:'24px',height:'24px',borderRadius:'4px',background:c,color:'#fff',fontSize:'10px',fontWeight:700,textAlign:'center',lineHeight:'24px',marginRight:'3px'}),panel:{position:'fixed',top:0,right:0,width:'520px',height:'100vh',background:T.surface,borderLeft:`2px solid ${T.border}`,padding:'24px',overflowY:'auto',zIndex:1000,boxShadow:'-4px 0 20px rgba(0,0,0,0.1)'},overlay:{position:'fixed',top:0,left:0,width:'100vw',height:'100vh',background:'rgba(0,0,0,0.3)',zIndex:999},btn:(variant)=>({padding:'8px 16px',borderRadius:'6px',border:variant==='outline'?`1px solid ${T.border}`:'none',background:variant==='primary'?T.navy:variant==='outline'?'transparent':T.surfaceH,color:variant==='primary'?'#fff':T.text,cursor:'pointer',fontFamily:T.font,fontSize:'12px',fontWeight:500}),sdgCard:{background:T.surface,border:`1px solid ${T.border}`,borderRadius:'8px',padding:'16px',cursor:'pointer',transition:'all 0.2s'},gridSdg:{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))',gap:'12px'}};

  const renderTab0=()=>(
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'16px'}}>
        <h3 style={{margin:0,fontSize:'16px',color:T.navy}}>17 SDGs Portfolio Exposure</h3>
        <button style={st.btn('outline')} onClick={()=>exportCSV(sdgPortfolio.map(s=>({SDG:s.sdg,Name:s.name,Exposure:s.exposure,Target:s.target,Gap:s.gap,Investments:s.investmentCount,Allocated:s.totalAllocated,AvgAlignment:s.avgAlignment})),'sdg_portfolio_overview.csv')}>Export CSV</button>
      </div>
      <div style={st.card}>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={sdgPortfolio} margin={{top:10,right:30,left:10,bottom:40}}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
            <XAxis dataKey="sdg" tick={{fontSize:11,fill:T.textSec}} label={{value:'SDG',position:'insideBottom',offset:-10,fill:T.textSec,fontSize:12}}/>
            <YAxis tick={{fontSize:11,fill:T.textSec}} label={{value:'Exposure %',angle:-90,position:'insideLeft',fill:T.textSec,fontSize:12}}/>
            <Tooltip contentStyle={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:'6px',fontSize:'12px',fontFamily:T.font}}/>
            <Legend/>
            <Bar dataKey="exposure" name="Current Exposure %" radius={[4,4,0,0]}>
              {sdgPortfolio.map((e,i)=>(<Cell key={i} fill={e.color}/>))}
            </Bar>
            <Bar dataKey="target" name="Target %" fill={T.navy} opacity={0.3} radius={[4,4,0,0]}/>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div style={st.gridSdg}>
        {sdgPortfolio.map(s=>(
          <div key={s.sdg} style={{...st.sdgCard,borderLeft:`4px solid ${s.color}`}} onClick={()=>setSelectedSDG(s)}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'8px'}}>
              <span style={st.sdgDot(s.color)}>{s.sdg}</span>
              <span style={{fontSize:'11px',fontFamily:T.mono,color:s.trend==='improving'?T.green:T.textMut}}>{s.trend==='improving'?'Improving':'Stable'}</span>
            </div>
            <div style={{fontSize:'13px',fontWeight:600,color:T.navy,marginBottom:'4px'}}>{s.name}</div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px',marginTop:'8px'}}>
              <div><div style={{fontSize:'18px',fontWeight:700,color:T.navy}}>{s.exposure}%</div><div style={{fontSize:'10px',color:T.textMut}}>Exposure</div></div>
              <div><div style={{fontSize:'18px',fontWeight:700,color:s.gap>5?T.red:T.green}}>{s.gap>0?`+${s.gap}`:s.gap}%</div><div style={{fontSize:'10px',color:T.textMut}}>Gap</div></div>
            </div>
            <div style={{fontSize:'11px',color:T.textSec,marginTop:'8px'}}>{s.investmentCount} investments | ${s.totalAllocated}M allocated</div>
          </div>
        ))}
      </div>
      {selectedSDG&&(<><div style={st.overlay} onClick={()=>setSelectedSDG(null)}/><div style={st.panel}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'20px'}}>
          <div><div style={{display:'flex',alignItems:'center',gap:'8px'}}><span style={st.sdgDot(selectedSDG.color)}>{selectedSDG.sdg}</span><h3 style={{margin:0,fontSize:'18px',color:T.navy}}>{selectedSDG.name}</h3></div></div>
          <button style={st.btn('outline')} onClick={()=>setSelectedSDG(null)}>Close</button>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'12px',marginBottom:'20px'}}>
          {[{l:'Exposure',v:`${selectedSDG.exposure}%`},{l:'Target',v:`${selectedSDG.target}%`},{l:'Avg Alignment',v:`${selectedSDG.avgAlignment}%`}].map((k,i)=>(
            <div key={i} style={{...st.card,textAlign:'center',padding:'12px'}}><div style={{fontSize:'22px',fontWeight:700,color:T.navy}}>{k.v}</div><div style={{fontSize:'10px',color:T.textMut,fontFamily:T.mono}}>{k.l}</div></div>
          ))}
        </div>
        <h4 style={{fontSize:'14px',color:T.navy,marginBottom:'12px'}}>Top Contributors</h4>
        <table style={st.table}><thead><tr><th style={st.th}>Company</th><th style={st.th}>Contribution %</th></tr></thead><tbody>
          {selectedSDG.topContributors.map((c,i)=>(<tr key={i}><td style={st.td}>{c.name}</td><td style={st.td}><div style={{background:selectedSDG.color+'30',borderRadius:'4px',overflow:'hidden',height:'16px',width:'100%',position:'relative'}}><div style={{background:selectedSDG.color,height:'100%',width:`${c.contribution}%`,borderRadius:'4px'}}/><span style={{position:'absolute',top:'1px',left:'6px',fontSize:'10px',color:T.navy,fontWeight:600}}>{c.contribution}%</span></div></td></tr>))}
        </tbody></table>
      </div></>)}
    </div>
  );

  const renderTab1=()=>(
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'16px'}}>
        <input style={st.searchBar} placeholder="Search companies..." value={search} onChange={e=>setSearch(e.target.value)}/>
        <div style={{display:'flex',gap:'8px'}}>
          <select style={{...st.searchBar,width:'180px'}} value={sortKey} onChange={e=>setSortKey(e.target.value)}>
            <option value="overallSDG">Overall SDG Score</option><option value="marketCap">Market Cap</option><option value="esgScore">ESG Score</option><option value="positiveCount">Positive SDGs</option>
          </select>
          <button style={st.btn('outline')} onClick={()=>setSortDir(d=>d==='desc'?'asc':'desc')}>{sortDir==='desc'?'Desc':'Asc'}</button>
          <button style={st.btn('outline')} onClick={()=>exportCSV(filtered.map(c=>({Name:c.name,Sector:c.sector,Country:c.country,MarketCap:c.marketCap,OverallSDG:c.overallSDG,ESG:c.esgScore,TopSDGs:c.topSDGs.join(';'),Positive:c.positiveCount,Negative:c.negativeCount})),'company_sdg_scores.csv')}>Export CSV</button>
        </div>
      </div>
      <div style={{fontSize:'12px',color:T.textMut,marginBottom:'12px',fontFamily:T.mono}}>{filtered.length} companies | Click row for detail</div>
      <div style={{overflowX:'auto'}}>
        <table style={st.table}>
          <thead><tr>
            <th style={st.th} onClick={()=>toggleSort('name')}>Company</th>
            <th style={st.th}>Sector</th>
            <th style={st.th} onClick={()=>toggleSort('overallSDG')}>SDG Score</th>
            <th style={st.th} onClick={()=>toggleSort('esgScore')}>ESG</th>
            <th style={st.th}>Top SDGs</th>
            <th style={st.th} onClick={()=>toggleSort('positiveCount')}>Positive</th>
            <th style={st.th} onClick={()=>toggleSort('negativeCount')}>Negative</th>
            <th style={st.th} onClick={()=>toggleSort('marketCap')}>Mkt Cap $B</th>
          </tr></thead>
          <tbody>
            {filtered.slice(0,50).map(c=>(
              <tr key={c.id} style={{cursor:'pointer',background:selectedCompany?.id===c.id?T.surfaceH:'transparent'}} onClick={()=>setSelectedCompany(c)}>
                <td style={{...st.td,fontWeight:600,color:T.navy}}>{c.name}</td>
                <td style={st.td}>{c.sector}</td>
                <td style={st.td}><span style={st.badge(c.overallSDG>=60?T.green:c.overallSDG>=40?T.amber:T.red)}>{c.overallSDG}</span></td>
                <td style={st.td}>{c.esgScore}</td>
                <td style={st.td}>{c.topSDGs.slice(0,3).map(g=>(<span key={g} style={{...st.sdgDot(SDG_COLORS[g-1]),width:'20px',height:'20px',lineHeight:'20px',fontSize:'9px'}}>{g}</span>))}</td>
                <td style={st.td}><span style={st.badge(T.green)}>{c.positiveCount}</span></td>
                <td style={st.td}><span style={st.badge(T.red)}>{c.negativeCount}</span></td>
                <td style={st.td}>{c.marketCap}B</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {selectedCompany&&(<><div style={st.overlay} onClick={()=>setSelectedCompany(null)}/><div style={st.panel}>
        <div style={{display:'flex',justifyContent:'space-between',marginBottom:'20px'}}>
          <div><h3 style={{margin:0,fontSize:'18px',color:T.navy}}>{selectedCompany.name}</h3><div style={{fontSize:'12px',color:T.textSec,marginTop:'4px'}}>{selectedCompany.sector} | {selectedCompany.country} | ${selectedCompany.marketCap}B</div></div>
          <button style={st.btn('outline')} onClick={()=>setSelectedCompany(null)}>Close</button>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'12px',marginBottom:'20px'}}>
          {[{l:'SDG Score',v:selectedCompany.overallSDG,u:'/100'},{l:'ESG Score',v:selectedCompany.esgScore,u:'/100'},{l:'Weight',v:selectedCompany.weight,u:'%'}].map((k,i)=>(
            <div key={i} style={{...st.card,textAlign:'center',padding:'12px'}}><div style={{fontSize:'22px',fontWeight:700,color:T.navy}}>{k.v}<span style={{fontSize:'12px',color:T.textMut}}>{k.u}</span></div><div style={{fontSize:'10px',color:T.textMut}}>{k.l}</div></div>
          ))}
        </div>
        <h4 style={{fontSize:'14px',color:T.navy,marginBottom:'12px'}}>SDG Alignment Radar</h4>
        <ResponsiveContainer width="100%" height={300}>
          <RadarChart data={selectedCompany.sdgScores.map(s=>({subject:`SDG${s.sdg}`,value:s.alignment}))}>
            <PolarGrid stroke={T.border}/>
            <PolarAngleAxis dataKey="subject" tick={{fontSize:9,fill:T.textSec}}/>
            <PolarRadiusAxis angle={90} domain={[0,100]} tick={{fontSize:9}}/>
            <Radar name="Alignment" dataKey="value" stroke={T.navy} fill={T.navy} fillOpacity={0.25}/>
          </RadarChart>
        </ResponsiveContainer>
        <h4 style={{fontSize:'14px',color:T.navy,margin:'16px 0 12px'}}>SDG Breakdown</h4>
        <table style={st.table}><thead><tr><th style={st.th}>SDG</th><th style={st.th}>Alignment</th><th style={st.th}>Revenue %</th><th style={st.th}>Impact</th></tr></thead><tbody>
          {selectedCompany.sdgScores.map(s=>(
            <tr key={s.sdg}><td style={st.td}><span style={st.sdgDot(SDG_COLORS[s.sdg-1])}>{s.sdg}</span> {s.name}</td>
            <td style={st.td}><span style={st.badge(s.alignment>=60?T.green:s.alignment>=35?T.amber:T.red)}>{s.alignment}%</span></td>
            <td style={st.td}>{s.revenue}%</td>
            <td style={st.td}><span style={st.badge(s.contribution==='Positive'?T.green:T.amber)}>{s.contribution}</span></td></tr>
          ))}
        </tbody></table>
      </div></>)}
    </div>
  );

  const renderTab2=()=>(
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'16px'}}>
        <input style={st.searchBar} placeholder="Search bonds or issuers..." value={bondSearch} onChange={e=>setBondSearch(e.target.value)}/>
        <div style={{display:'flex',gap:'8px'}}>
          <select style={{...st.searchBar,width:'160px'}} value={bondSort} onChange={e=>setBondSort(e.target.value)}>
            <option value="amount">By Amount</option><option value="alignment">By Alignment</option>
          </select>
          <button style={st.btn('outline')} onClick={()=>exportCSV(filteredBonds.map(b=>({Issuer:b.issuer,Type:b.type,Amount:b.amount,Currency:b.currency,Coupon:b.coupon,Maturity:b.maturity,SDGs:b.sdgs.join(';'),UseOfProceeds:b.useOfProceeds,Alignment:b.alignment,Verified:b.verified,Framework:b.framework})),'sdg_bonds.csv')}>Export CSV</button>
        </div>
      </div>
      <div style={{...st.card,marginBottom:'16px'}}>
        <h4 style={{fontSize:'14px',color:T.navy,marginBottom:'12px'}}>SDG Bond Distribution by Type</h4>
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie data={BOND_TYPES.map((t,i)=>({name:t,value:bonds.filter(b=>b.type===t).length}))} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({name,percent})=>`${name} ${(percent*100).toFixed(0)}%`}>
              {BOND_TYPES.map((t,i)=>(<Cell key={i} fill={[T.navy,T.sage,T.gold,T.navyL,T.teal,T.amber][i]}/>))}
            </Pie>
            <Tooltip/>
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div style={{fontSize:'12px',color:T.textMut,marginBottom:'12px',fontFamily:T.mono}}>{filteredBonds.length} instruments</div>
      <table style={st.table}>
        <thead><tr><th style={st.th}>Issuer</th><th style={st.th}>Type</th><th style={st.th}>Amount</th><th style={st.th}>Coupon</th><th style={st.th}>Maturity</th><th style={st.th}>SDGs</th><th style={st.th}>Use of Proceeds</th><th style={st.th}>Alignment</th><th style={st.th}>Verified</th></tr></thead>
        <tbody>
          {filteredBonds.map(b=>(
            <tr key={b.id} style={{cursor:'pointer',background:selectedBond?.id===b.id?T.surfaceH:'transparent'}} onClick={()=>setSelectedBond(b)}>
              <td style={{...st.td,fontWeight:600,color:T.navy}}>{b.issuer}</td>
              <td style={st.td}><span style={st.badge(T.navy)}>{b.type}</span></td>
              <td style={st.td}>{b.currency} {b.amount}M</td>
              <td style={st.td}>{b.coupon}%</td>
              <td style={st.td}>{b.maturity}</td>
              <td style={st.td}>{b.sdgs.map(g=>(<span key={g} style={{...st.sdgDot(SDG_COLORS[g-1]),width:'18px',height:'18px',lineHeight:'18px',fontSize:'8px'}}>{g}</span>))}</td>
              <td style={st.td}>{b.useOfProceeds}</td>
              <td style={st.td}><span style={st.badge(b.alignment>=70?T.green:b.alignment>=50?T.amber:T.red)}>{b.alignment}%</span></td>
              <td style={st.td}>{b.verified?<span style={st.badge(T.green)}>Yes</span>:<span style={st.badge(T.red)}>No</span>}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {selectedBond&&(<><div style={st.overlay} onClick={()=>setSelectedBond(null)}/><div style={st.panel}>
        <div style={{display:'flex',justifyContent:'space-between',marginBottom:'20px'}}>
          <h3 style={{margin:0,fontSize:'18px',color:T.navy}}>{selectedBond.issuer} — {selectedBond.type}</h3>
          <button style={st.btn('outline')} onClick={()=>setSelectedBond(null)}>Close</button>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:'12px',marginBottom:'20px'}}>
          {[{l:'Amount',v:`${selectedBond.currency} ${selectedBond.amount}M`},{l:'Coupon',v:`${selectedBond.coupon}%`},{l:'Maturity',v:selectedBond.maturity},{l:'Framework',v:selectedBond.framework},{l:'Alignment',v:`${selectedBond.alignment}%`},{l:'Verified',v:selectedBond.verified?'Yes':'No'}].map((k,i)=>(
            <div key={i} style={{...st.card,padding:'12px'}}><div style={{fontSize:'10px',color:T.textMut,fontFamily:T.mono}}>{k.l}</div><div style={{fontSize:'16px',fontWeight:600,color:T.navy}}>{k.v}</div></div>
          ))}
        </div>
        <h4 style={{fontSize:'14px',color:T.navy,marginBottom:'8px'}}>Mapped SDGs</h4>
        <div style={{display:'flex',gap:'8px',flexWrap:'wrap',marginBottom:'16px'}}>
          {selectedBond.sdgs.map(g=>(<div key={g} style={{display:'flex',alignItems:'center',gap:'6px',padding:'6px 12px',background:SDG_COLORS[g-1]+'20',borderRadius:'6px'}}><span style={st.sdgDot(SDG_COLORS[g-1])}>{g}</span><span style={{fontSize:'12px',fontWeight:500}}>{SDG_NAMES[g-1]}</span></div>))}
        </div>
        <h4 style={{fontSize:'14px',color:T.navy,marginBottom:'8px'}}>Use of Proceeds</h4>
        <div style={{...st.card,padding:'16px'}}><div style={{fontSize:'14px',color:T.text}}>{selectedBond.useOfProceeds}</div></div>
      </div></>)}
    </div>
  );

  const renderTab3=()=>{
    const gaps=sdgPortfolio.filter(s=>s.gap>0).sort((a,b)=>b.gap-a.gap);
    const recommendations=gaps.slice(0,5).map(g=>({sdg:g.sdg,name:g.name,color:g.color,gap:g.gap,action:g.gap>10?'Increase allocation significantly':'Moderate rebalancing needed',priority:g.gap>10?'High':'Medium',suggestedIncrease:`${Math.round(g.gap*1.2)}%`,currentInvestments:g.investmentCount}));
    return(
      <div>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'16px'}}>
          <h3 style={{margin:0,fontSize:'16px',color:T.navy}}>SDG Gap Analysis & Rebalancing</h3>
          <button style={st.btn('outline')} onClick={()=>exportCSV(sdgPortfolio.map(s=>({SDG:s.sdg,Name:s.name,Exposure:s.exposure,Target:s.target,Gap:s.gap,Trend:s.trend,Investments:s.investmentCount})),'sdg_gap_analysis.csv')}>Export CSV</button>
        </div>
        <div style={st.card}>
          <h4 style={{fontSize:'14px',color:T.navy,marginBottom:'12px'}}>Gap Overview (Target - Actual)</h4>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={sdgPortfolio} margin={{top:10,right:30,left:10,bottom:40}}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
              <XAxis dataKey="sdg" tick={{fontSize:11,fill:T.textSec}}/>
              <YAxis tick={{fontSize:11,fill:T.textSec}} label={{value:'Gap %',angle:-90,position:'insideLeft',fill:T.textSec,fontSize:12}}/>
              <Tooltip contentStyle={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:'6px',fontSize:'12px'}}/>
              <Bar dataKey="gap" name="Gap %" radius={[4,4,0,0]}>
                {sdgPortfolio.map((e,i)=>(<Cell key={i} fill={e.gap>5?T.red:e.gap>0?T.amber:T.green}/>))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <h4 style={{fontSize:'14px',color:T.navy,margin:'20px 0 12px'}}>Rebalancing Recommendations</h4>
        <div style={{display:'grid',gap:'12px'}}>
          {recommendations.map(r=>(
            <div key={r.sdg} style={{...st.card,borderLeft:`4px solid ${r.color}`,display:'grid',gridTemplateColumns:'auto 1fr auto',gap:'16px',alignItems:'center'}}>
              <span style={st.sdgDot(r.color)}>{r.sdg}</span>
              <div>
                <div style={{fontSize:'14px',fontWeight:600,color:T.navy}}>{r.name}</div>
                <div style={{fontSize:'12px',color:T.textSec,marginTop:'2px'}}>{r.action}</div>
                <div style={{fontSize:'11px',color:T.textMut,fontFamily:T.mono,marginTop:'4px'}}>{r.currentInvestments} current investments | Suggested increase: {r.suggestedIncrease}</div>
              </div>
              <span style={st.badge(r.priority==='High'?T.red:T.amber)}>{r.priority} Priority</span>
            </div>
          ))}
        </div>
        <div style={{...st.card,marginTop:'20px'}}>
          <h4 style={{fontSize:'14px',color:T.navy,marginBottom:'12px'}}>Underrepresented SDGs ({gaps.length})</h4>
          <table style={st.table}><thead><tr><th style={st.th}>SDG</th><th style={st.th}>Current</th><th style={st.th}>Target</th><th style={st.th}>Gap</th><th style={st.th}>Investments</th><th style={st.th}>Trend</th></tr></thead>
          <tbody>{gaps.map(g=>(
            <tr key={g.sdg}><td style={st.td}><span style={st.sdgDot(g.color)}>{g.sdg}</span> {g.name}</td>
            <td style={st.td}>{g.exposure}%</td><td style={st.td}>{g.target}%</td>
            <td style={st.td}><span style={st.badge(g.gap>10?T.red:T.amber)}>+{g.gap}%</span></td>
            <td style={st.td}>{g.investmentCount}</td>
            <td style={st.td}><span style={st.badge(g.trend==='improving'?T.green:T.textMut)}>{g.trend}</span></td></tr>
          ))}</tbody></table>
        </div>
      </div>
    );
  };

  return(
    <div style={st.page}>
      <div style={st.header}><h1 style={st.title}>SDG Alignment Engine</h1><div style={st.subtitle}>EP-AW1 | 17 SDGs x 120 companies | Revenue alignment, contribution scoring, bond tagging</div></div>
      <div style={st.kpiRow}>{kpiData.map((k,i)=>(<div key={i} style={st.kpiCard}><div style={st.kpiVal}>{k.value}</div><div style={st.kpiLabel}>{k.label} {k.unit}</div></div>))}</div>
      <div style={st.tabBar}>{tabs.map((t,i)=>(<button key={i} style={st.tabBtn(tab===i)} onClick={()=>setTab(i)}>{t}</button>))}</div>
      {tab===0&&renderTab0()}
      {tab===1&&renderTab1()}
      {tab===2&&renderTab2()}
      {tab===3&&renderTab3()}
    </div>
  );
}
