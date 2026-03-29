import React,{useState,useMemo,useCallback} from 'react';
import {BarChart,Bar,XAxis,YAxis,CartesianGrid,Tooltip,ResponsiveContainer,LineChart,Line,AreaChart,Area,Cell,Legend,ScatterChart,Scatter} from 'recharts';

const T={bg:'#f6f4f0',surface:'#ffffff',surfaceH:'#f0ede7',border:'#e5e0d8',borderL:'#d5cfc5',navy:'#1b3a5c',navyL:'#2c5a8c',gold:'#c5a96a',goldL:'#d4be8a',sage:'#5a8a6a',sageL:'#7ba67d',teal:'#5a8a6a',text:'#1b3a5c',textSec:'#5c6b7e',textMut:'#9aa3ae',red:'#dc2626',green:'#16a34a',amber:'#d97706',font:"'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"};
const sr=(s)=>{let x=Math.sin(s+1)*10000;return x-Math.floor(x);};

const QUARTERS=['Q1-23','Q2-23','Q3-23','Q4-23','Q1-24','Q2-24','Q3-24','Q4-24','Q1-25','Q2-25','Q3-25','Q4-25'];
const RCP_SCENARIOS=['RCP 2.6','RCP 4.5','RCP 8.5'];
const DISEASES=['Malaria','Dengue','Zika','Chikungunya','Lyme','West Nile'];
const HORIZONS=[2030,2040,2050];

const COUNTRY_NAMES=['Brazil','DRC','Indonesia','India','Nigeria','Peru','Colombia','Mexico','Ecuador','Madagascar',
'Myanmar','Papua New Guinea','Philippines','Thailand','Vietnam','Cameroon','Ghana','Tanzania','Kenya','Ethiopia',
'China','Bangladesh','Pakistan','Nepal','Sri Lanka','Malaysia','Cambodia','Laos','Uganda','Mozambique',
'Honduras','Guatemala','Nicaragua','Costa Rica','Panama','Bolivia','Paraguay','Guyana','Suriname','French Guiana'];

const genCountries=(count)=>{
  const countries=[];
  for(let i=0;i<count;i++){
    const s1=sr(i*7+301);const s2=sr(i*13+303);const s3=sr(i*19+307);const s4=sr(i*23+309);const s5=sr(i*29+311);
    const deforestKm2=Math.floor(s1*50000+100);
    const habitatFragPct=+(s2*80+10).toFixed(1);
    const wildlifeTradePct=+(s3*60+5).toFixed(1);
    const spilloverRisk=Math.floor(s4*100);
    const ghsIndex=+(20+s5*60).toFixed(1);
    const healthcareCapacityBeds=Math.floor(sr(i*31+313)*800+50);
    const pharmaSupplyVuln=Math.floor(sr(i*37+317)*100);
    const popM=+(sr(i*41+319)*250+2).toFixed(1);
    const amrIndex=Math.floor(sr(i*43+321)*100);
    const diseaseRange=DISEASES.map((d,di)=>({
      disease:d,
      currentPopAtRiskM:+(sr(i*47+di*11+323)*popM*0.4).toFixed(1),
      rcpProjections:RCP_SCENARIOS.map((_,ri)=>HORIZONS.map((_,hi)=>+(sr(i*53+di*7+ri*5+hi*3+325)*popM*0.6*(1+ri*0.2+hi*0.15)).toFixed(1)))
    }));
    const qTrend=QUARTERS.map((_,qi)=>({q:QUARTERS[qi],spillover:Math.floor(spilloverRisk*(0.85+qi*0.02+sr(i*59+qi*7)*0.1)),ghs:+(ghsIndex+sr(i*61+qi*11)*2-1).toFixed(1)}));
    const pharmaExposure=Math.floor(sr(i*67+327)*5000+100);
    const healthInfraGapM=Math.floor(sr(i*71+329)*10000+200);
    const pandemicBondM=Math.floor(sr(i*73+331)*2000);
    const oneHealthInvestM=Math.floor(sr(i*79+333)*1500+50);
    countries.push({id:i,name:COUNTRY_NAMES[i]||`Country_${i}`,deforestKm2,habitatFragPct,wildlifeTradePct,spilloverRisk,ghsIndex,
      healthcareCapacityBeds,pharmaSupplyVuln,popM,amrIndex,diseaseRange,qTrend,pharmaExposure,healthInfraGapM,pandemicBondM,oneHealthInvestM,
      region:i<10?'Latin America':i<20?'Africa':i<30?'South Asia':'SE Asia/Other',
      riskTier:spilloverRisk>75?'Critical':spilloverRisk>50?'High':spilloverRisk>25?'Medium':'Low'});
  }
  return countries;
};

const COUNTRIES=genCountries(40);

const pill=(color,text)=>(<span style={{display:'inline-block',padding:'2px 10px',borderRadius:12,fontSize:11,fontWeight:600,background:color+'18',color,border:`1px solid ${color}30`}}>{text}</span>);
const tierColor=(t)=>t==='Critical'?T.red:t==='High'?T.amber:t==='Medium'?T.gold:T.green;
const fmt=(n)=>n>=1e9?(n/1e9).toFixed(1)+'B':n>=1e6?(n/1e6).toFixed(1)+'M':n>=1e3?(n/1e3).toFixed(1)+'K':String(n);
const card=(s)=>({background:T.surface,borderRadius:10,border:`1px solid ${T.border}`,padding:18,...s});
const kpiBox=(label,value,sub,color)=>(<div style={card({flex:'1',minWidth:180,textAlign:'center'})}><div style={{fontSize:11,color:T.textMut,fontFamily:T.mono,textTransform:'uppercase',letterSpacing:1}}>{label}</div><div style={{fontSize:28,fontWeight:700,color:color||T.navy,margin:'4px 0'}}>{value}</div>{sub&&<div style={{fontSize:12,color:T.textSec}}>{sub}</div>}</div>);

export default function PandemicClimateNexusPage(){
  const [tab,setTab]=useState(0);
  const [rcpIdx,setRcpIdx]=useState(1);
  const [horizonIdx,setHorizonIdx]=useState(0);
  const [searchTerm,setSearchTerm]=useState('');
  const [regionFilter,setRegionFilter]=useState('All');
  const [diseaseFilter,setDiseaseFilter]=useState('All');
  const [sortKey,setSortKey]=useState('spilloverRisk');
  const [sortDir,setSortDir]=useState('desc');
  const [selectedCountry,setSelectedCountry]=useState(null);

  const TABS=['Zoonotic Risk Map','Vector-Borne Disease Expansion','Pandemic Preparedness','Investment Implications'];

  const filtered=useMemo(()=>{
    let c=[...COUNTRIES];
    if(searchTerm) c=c.filter(x=>x.name.toLowerCase().includes(searchTerm.toLowerCase()));
    if(regionFilter!=='All') c=c.filter(x=>x.region===regionFilter);
    c.sort((a,b)=>sortDir==='desc'?b[sortKey]-a[sortKey]:a[sortKey]-b[sortKey]);
    return c;
  },[searchTerm,regionFilter,sortKey,sortDir]);

  const topKPIs=useMemo(()=>({
    criticalCount:COUNTRIES.filter(c=>c.riskTier==='Critical').length,
    avgSpillover:Math.floor(COUNTRIES.reduce((s,c)=>s+c.spilloverRisk,0)/COUNTRIES.length),
    totalDeforest:COUNTRIES.reduce((s,c)=>s+c.deforestKm2,0),
    avgGHS:+(COUNTRIES.reduce((s,c)=>s+c.ghsIndex,0)/COUNTRIES.length).toFixed(1)
  }),[]);

  const scatterData=useMemo(()=>COUNTRIES.map(c=>({name:c.name,x:c.deforestKm2,y:c.spilloverRisk,z:c.popM,tier:c.riskTier})),[]);

  const diseaseAgg=useMemo(()=>DISEASES.map(d=>{
    const totalCurrent=COUNTRIES.reduce((s,c)=>{const dr=c.diseaseRange.find(x=>x.disease===d);return s+(dr?+dr.currentPopAtRiskM:0);},0);
    const projections=RCP_SCENARIOS.map((_,ri)=>HORIZONS.map((_,hi)=>COUNTRIES.reduce((s,c)=>{const dr=c.diseaseRange.find(x=>x.disease===d);return s+(dr?+dr.rcpProjections[ri][hi]:0);},0)));
    return{disease:d,totalCurrent:+totalCurrent.toFixed(1),projections};
  }),[]);

  const ghsData=useMemo(()=>COUNTRIES.sort((a,b)=>b.ghsIndex-a.ghsIndex).map(c=>({name:c.name,ghs:c.ghsIndex,capacity:c.healthcareCapacityBeds/10,pharmaVuln:c.pharmaSupplyVuln})),[]);

  const investData=useMemo(()=>{
    const totalPharma=COUNTRIES.reduce((s,c)=>s+c.pharmaExposure,0);
    const totalInfra=COUNTRIES.reduce((s,c)=>s+c.healthInfraGapM,0);
    const totalBonds=COUNTRIES.reduce((s,c)=>s+c.pandemicBondM,0);
    const totalOneHealth=COUNTRIES.reduce((s,c)=>s+c.oneHealthInvestM,0);
    return{totalPharma,totalInfra,totalBonds,totalOneHealth};
  },[]);

  const sortToggle=(key)=>{if(sortKey===key)setSortDir(d=>d==='desc'?'asc':'desc');else{setSortKey(key);setSortDir('desc');}};
  const thStyle={padding:'8px 10px',textAlign:'left',fontSize:11,fontFamily:T.mono,color:T.textMut,textTransform:'uppercase',letterSpacing:0.5,borderBottom:`2px solid ${T.border}`,cursor:'pointer',userSelect:'none',whiteSpace:'nowrap'};
  const tdStyle={padding:'8px 10px',fontSize:13,borderBottom:`1px solid ${T.border}`};
  const detail=selectedCountry!==null?COUNTRIES.find(c=>c.id===selectedCountry):null;

  const renderTab0=()=>(
    <div>
      <div style={{display:'flex',gap:12,marginBottom:20,flexWrap:'wrap'}}>
        {kpiBox('Critical Risk',topKPIs.criticalCount,`of ${COUNTRIES.length} countries`,T.red)}
        {kpiBox('Avg Spillover Risk',topKPIs.avgSpillover+'/100','Mean zoonotic index',T.amber)}
        {kpiBox('Total Deforestation',fmt(topKPIs.totalDeforest)+' km2','Cumulative habitat loss',T.red)}
        {kpiBox('Avg GHS Index',topKPIs.avgGHS+'/100','Health security readiness',T.gold)}
      </div>
      <div style={{display:'flex',gap:12,marginBottom:16,alignItems:'center',flexWrap:'wrap'}}>
        <input placeholder="Search country..." value={searchTerm} onChange={e=>setSearchTerm(e.target.value)} style={{padding:'6px 12px',borderRadius:6,border:`1px solid ${T.border}`,fontSize:13,fontFamily:T.font,minWidth:160}}/>
        <select value={regionFilter} onChange={e=>setRegionFilter(e.target.value)} style={{padding:'6px 12px',borderRadius:6,border:`1px solid ${T.border}`,fontSize:13}}>
          <option value="All">All Regions</option>
          {['Latin America','Africa','South Asia','SE Asia/Other'].map(r=>(<option key={r} value={r}>{r}</option>))}
        </select>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:20}}>
        <div style={card()}>
          <div style={{fontSize:13,fontWeight:600,color:T.navy,marginBottom:8}}>Zoonotic Spillover Risk by Country</div>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={filtered.slice(0,25).map(c=>({name:c.name,risk:c.spilloverRisk}))} layout="vertical" margin={{left:90,right:20,top:5,bottom:5}}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/>
              <XAxis type="number" tick={{fontSize:10,fill:T.textSec}} domain={[0,100]}/>
              <YAxis dataKey="name" type="category" tick={{fontSize:10,fill:T.textSec}} width={85}/>
              <Tooltip contentStyle={{fontSize:12,borderRadius:8}}/>
              <Bar dataKey="risk" radius={[0,4,4,0]} name="Spillover Risk">
                {filtered.slice(0,25).map((c,i)=>(<Cell key={i} fill={tierColor(c.riskTier)}/>))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={card()}>
          <div style={{fontSize:13,fontWeight:600,color:T.navy,marginBottom:8}}>Deforestation vs Spillover Risk (bubble = population)</div>
          <ResponsiveContainer width="100%" height={400}>
            <ScatterChart margin={{top:10,right:20,bottom:20,left:10}}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/>
              <XAxis dataKey="x" name="Deforestation (km2)" tick={{fontSize:10,fill:T.textSec}} label={{value:'Deforestation (km2)',position:'bottom',fontSize:10,fill:T.textMut}}/>
              <YAxis dataKey="y" name="Spillover Risk" tick={{fontSize:10,fill:T.textSec}} label={{value:'Spillover Risk',angle:-90,position:'insideLeft',fontSize:10,fill:T.textMut}}/>
              <Tooltip contentStyle={{fontSize:12,borderRadius:8}} formatter={(v,n)=>[fmt(v),n]}/>
              <Scatter data={scatterData} fill={T.navy}>
                {scatterData.map((d,i)=>(<Cell key={i} fill={tierColor(d.tier)} opacity={0.7}/>))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div style={card({marginBottom:20})}>
        <div style={{fontSize:13,fontWeight:600,color:T.navy,marginBottom:8}}>Country Zoonotic Risk Table</div>
        <div style={{overflowX:'auto',maxHeight:400,overflowY:'auto'}}>
          <table style={{width:'100%',borderCollapse:'collapse'}}>
            <thead style={{position:'sticky',top:0,background:T.surface}}><tr>
              <th style={thStyle}>#</th><th style={thStyle} onClick={()=>sortToggle('name')}>Country</th><th style={thStyle}>Region</th>
              <th style={thStyle} onClick={()=>sortToggle('spilloverRisk')}>Spillover Risk</th>
              <th style={thStyle} onClick={()=>sortToggle('deforestKm2')}>Deforestation (km2)</th>
              <th style={thStyle} onClick={()=>sortToggle('habitatFragPct')}>Habitat Frag %</th>
              <th style={thStyle} onClick={()=>sortToggle('wildlifeTradePct')}>Wildlife Trade %</th>
              <th style={thStyle}>AMR Index</th><th style={thStyle}>Risk Tier</th>
            </tr></thead>
            <tbody>{filtered.slice(0,35).map((c,i)=>(<tr key={c.id} onClick={()=>setSelectedCountry(c.id)} style={{cursor:'pointer',background:selectedCountry===c.id?T.surfaceH:'transparent'}}>
              <td style={tdStyle}>{i+1}</td><td style={{...tdStyle,fontWeight:600}}>{c.name}</td><td style={tdStyle}>{c.region}</td>
              <td style={{...tdStyle,color:c.spilloverRisk>75?T.red:c.spilloverRisk>50?T.amber:T.text}}>{c.spilloverRisk}/100</td>
              <td style={tdStyle}>{fmt(c.deforestKm2)}</td><td style={tdStyle}>{c.habitatFragPct}%</td>
              <td style={tdStyle}>{c.wildlifeTradePct}%</td><td style={tdStyle}>{c.amrIndex}/100</td>
              <td style={tdStyle}>{pill(tierColor(c.riskTier),c.riskTier)}</td>
            </tr>))}</tbody>
          </table>
        </div>
      </div>
      {detail&&(<div style={card()}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
          <div><span style={{fontSize:16,fontWeight:700,color:T.navy}}>{detail.name}</span> <span style={{fontSize:12,color:T.textMut,fontFamily:T.mono}}>{detail.region} | Pop {detail.popM}M</span></div>
          <button onClick={()=>setSelectedCountry(null)} style={{padding:'4px 12px',borderRadius:6,border:`1px solid ${T.border}`,background:'transparent',cursor:'pointer',fontSize:12}}>Close</button>
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={detail.qTrend} margin={{top:5,right:20,bottom:5,left:10}}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/><XAxis dataKey="q" tick={{fontSize:10,fill:T.textSec}}/>
            <YAxis tick={{fontSize:10,fill:T.textSec}}/><Tooltip contentStyle={{fontSize:12,borderRadius:8}}/><Legend wrapperStyle={{fontSize:11}}/>
            <Line type="monotone" dataKey="spillover" stroke={T.red} name="Spillover Risk" strokeWidth={2}/>
            <Line type="monotone" dataKey="ghs" stroke={T.green} name="GHS Index" strokeWidth={2}/>
          </LineChart>
        </ResponsiveContainer>
      </div>)}
    </div>
  );

  const renderTab1=()=>(
    <div>
      <div style={{display:'flex',gap:12,marginBottom:20,flexWrap:'wrap'}}>
        {kpiBox('Diseases Tracked',DISEASES.length,'Vector-borne',T.navy)}
        {kpiBox('Current Pop at Risk',fmt(diseaseAgg.reduce((s,d)=>s+d.totalCurrent,0)*1e6)+'M','All diseases combined',T.red)}
        {kpiBox(`Proj. at Risk (${HORIZONS[horizonIdx]})`,fmt(diseaseAgg.reduce((s,d)=>s+d.projections[rcpIdx][horizonIdx],0)*1e6)+'M',RCP_SCENARIOS[rcpIdx],T.amber)}
        {kpiBox('Highest Risk Disease',diseaseAgg.sort((a,b)=>b.totalCurrent-a.totalCurrent)[0]?.disease||'-','By current population',T.red)}
      </div>
      <div style={{display:'flex',gap:12,marginBottom:16,alignItems:'center',flexWrap:'wrap'}}>
        <div style={{display:'flex',gap:4}}>{RCP_SCENARIOS.map((r,i)=>(<button key={i} onClick={()=>setRcpIdx(i)} style={{padding:'5px 14px',borderRadius:6,border:`1px solid ${rcpIdx===i?T.navy:T.border}`,background:rcpIdx===i?T.navy:'transparent',color:rcpIdx===i?'#fff':T.text,fontSize:12,fontWeight:600,cursor:'pointer',fontFamily:T.mono}}>{r}</button>))}</div>
        <div style={{display:'flex',gap:4}}>{HORIZONS.map((h,i)=>(<button key={i} onClick={()=>setHorizonIdx(i)} style={{padding:'5px 14px',borderRadius:6,border:`1px solid ${horizonIdx===i?T.gold:T.border}`,background:horizonIdx===i?T.gold+'20':'transparent',color:horizonIdx===i?T.navy:T.text,fontSize:12,fontWeight:600,cursor:'pointer',fontFamily:T.mono}}>{h}</button>))}</div>
        <select value={diseaseFilter} onChange={e=>setDiseaseFilter(e.target.value)} style={{padding:'6px 12px',borderRadius:6,border:`1px solid ${T.border}`,fontSize:13}}>
          <option value="All">All Diseases</option>
          {DISEASES.map(d=>(<option key={d} value={d}>{d}</option>))}
        </select>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:20}}>
        <div style={card()}>
          <div style={{fontSize:13,fontWeight:600,color:T.navy,marginBottom:8}}>Current vs Projected Population at Risk (M)</div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={(diseaseFilter==='All'?diseaseAgg:diseaseAgg.filter(d=>d.disease===diseaseFilter)).map(d=>({disease:d.disease,current:d.totalCurrent,projected:d.projections[rcpIdx][horizonIdx]}))} margin={{top:5,right:20,bottom:5,left:10}}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/>
              <XAxis dataKey="disease" tick={{fontSize:10,fill:T.textSec}}/>
              <YAxis tick={{fontSize:10,fill:T.textSec}}/>
              <Tooltip contentStyle={{fontSize:12,borderRadius:8}}/>
              <Legend wrapperStyle={{fontSize:11}}/>
              <Bar dataKey="current" fill={T.gold} radius={[4,4,0,0]} name="Current (M)"/>
              <Bar dataKey="projected" fill={T.red} radius={[4,4,0,0]} name={`Proj. ${HORIZONS[horizonIdx]} (M)`}/>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={card()}>
          <div style={{fontSize:13,fontWeight:600,color:T.navy,marginBottom:8}}>Range Expansion Trajectory (All Diseases)</div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={HORIZONS.map((h,hi)=>({horizon:h,...Object.fromEntries(diseaseAgg.map(d=>[d.disease,d.projections[rcpIdx][hi]]))}))}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/>
              <XAxis dataKey="horizon" tick={{fontSize:10,fill:T.textSec}}/>
              <YAxis tick={{fontSize:10,fill:T.textSec}} label={{value:'Pop at Risk (M)',angle:-90,position:'insideLeft',fontSize:10,fill:T.textMut}}/>
              <Tooltip contentStyle={{fontSize:12,borderRadius:8}}/>
              <Legend wrapperStyle={{fontSize:11}}/>
              {DISEASES.map((d,i)=><Line key={d} type="monotone" dataKey={d} stroke={[T.red,T.amber,T.gold,T.sage,T.navy,T.navyL][i]} strokeWidth={2} dot={{r:4}}/>)}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div style={card()}>
        <div style={{fontSize:13,fontWeight:600,color:T.navy,marginBottom:8}}>Country-Level Disease Exposure ({RCP_SCENARIOS[rcpIdx]}, {HORIZONS[horizonIdx]})</div>
        <div style={{overflowX:'auto',maxHeight:400,overflowY:'auto'}}>
          <table style={{width:'100%',borderCollapse:'collapse'}}>
            <thead style={{position:'sticky',top:0,background:T.surface}}><tr>
              <th style={thStyle}>Country</th>
              {DISEASES.map(d=>(<th key={d} style={thStyle}>{d} (M)</th>))}
              <th style={thStyle}>Total (M)</th>
            </tr></thead>
            <tbody>{COUNTRIES.sort((a,b)=>{const aT=a.diseaseRange.reduce((s,d)=>s+ +d.rcpProjections[rcpIdx][horizonIdx],0);const bT=b.diseaseRange.reduce((s,d)=>s+ +d.rcpProjections[rcpIdx][horizonIdx],0);return bT-aT;}).slice(0,30).map(c=>{
              const total=c.diseaseRange.reduce((s,d)=>s+ +d.rcpProjections[rcpIdx][horizonIdx],0);
              return(<tr key={c.id}><td style={{...tdStyle,fontWeight:600}}>{c.name}</td>
                {c.diseaseRange.map((d,di)=>(<td key={di} style={tdStyle}>{d.rcpProjections[rcpIdx][horizonIdx]}</td>))}
                <td style={{...tdStyle,fontWeight:700,color:total>100?T.red:T.text}}>{total.toFixed(1)}</td>
              </tr>);
            })}</tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderTab2=()=>(
    <div>
      <div style={{display:'flex',gap:12,marginBottom:20,flexWrap:'wrap'}}>
        {kpiBox('Avg GHS Index',topKPIs.avgGHS+'/100','Global Health Security',T.gold)}
        {kpiBox('Low Prepared',COUNTRIES.filter(c=>c.ghsIndex<40).length,'GHS <40',T.red)}
        {kpiBox('Avg Pharma Vuln',Math.floor(COUNTRIES.reduce((s,c)=>s+c.pharmaSupplyVuln,0)/COUNTRIES.length)+'/100','Supply chain vulnerability',T.amber)}
        {kpiBox('Avg AMR Index',Math.floor(COUNTRIES.reduce((s,c)=>s+c.amrIndex,0)/COUNTRIES.length)+'/100','Antimicrobial resistance',T.red)}
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:20}}>
        <div style={card()}>
          <div style={{fontSize:13,fontWeight:600,color:T.navy,marginBottom:8}}>GHS Index by Country (top 30)</div>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={ghsData.slice(0,30)} layout="vertical" margin={{left:90,right:20,top:5,bottom:5}}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/>
              <XAxis type="number" tick={{fontSize:10,fill:T.textSec}} domain={[0,100]}/>
              <YAxis dataKey="name" type="category" tick={{fontSize:10,fill:T.textSec}} width={85}/>
              <Tooltip contentStyle={{fontSize:12,borderRadius:8}}/>
              <Bar dataKey="ghs" radius={[0,4,4,0]} name="GHS Index">
                {ghsData.slice(0,30).map((d,i)=>(<Cell key={i} fill={d.ghs>60?T.green:d.ghs>40?T.gold:T.red}/>))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={card()}>
          <div style={{fontSize:13,fontWeight:600,color:T.navy,marginBottom:8}}>Healthcare Capacity vs Pharma Supply Vulnerability</div>
          <ResponsiveContainer width="100%" height={400}>
            <ScatterChart margin={{top:10,right:20,bottom:20,left:10}}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/>
              <XAxis dataKey="capacity" name="Beds/10K pop" tick={{fontSize:10,fill:T.textSec}} label={{value:'Hospital Beds per 10K',position:'bottom',fontSize:10,fill:T.textMut}}/>
              <YAxis dataKey="pharmaVuln" name="Pharma Vulnerability" tick={{fontSize:10,fill:T.textSec}} label={{value:'Pharma Supply Vuln',angle:-90,position:'insideLeft',fontSize:10,fill:T.textMut}}/>
              <Tooltip contentStyle={{fontSize:12,borderRadius:8}} formatter={(v,n)=>[v,n]}/>
              <Scatter data={ghsData.slice(0,30)} fill={T.navy}>
                {ghsData.slice(0,30).map((d,i)=>(<Cell key={i} fill={d.pharmaVuln>70?T.red:d.pharmaVuln>40?T.amber:T.green} opacity={0.7}/>))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div style={card({marginBottom:20})}>
        <div style={{fontSize:13,fontWeight:600,color:T.navy,marginBottom:8}}>GHS Index Trend (12 Quarters)</div>
        <ResponsiveContainer width="100%" height={250}>
          <AreaChart data={QUARTERS.map((q,qi)=>({q,avgGHS:+(COUNTRIES.reduce((s,c)=>s+c.qTrend[qi].ghs,0)/COUNTRIES.length).toFixed(1)}))} margin={{top:5,right:20,bottom:5,left:10}}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/><XAxis dataKey="q" tick={{fontSize:10,fill:T.textSec}}/><YAxis tick={{fontSize:10,fill:T.textSec}} domain={[0,100]}/>
            <Tooltip contentStyle={{fontSize:12,borderRadius:8}}/><Area type="monotone" dataKey="avgGHS" stroke={T.green} fill={T.green+'20'} strokeWidth={2} name="Avg GHS Index"/>
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div style={card()}>
        <div style={{fontSize:13,fontWeight:600,color:T.navy,marginBottom:8}}>Preparedness Detail Table</div>
        <div style={{overflowX:'auto',maxHeight:350,overflowY:'auto'}}>
          <table style={{width:'100%',borderCollapse:'collapse'}}>
            <thead style={{position:'sticky',top:0,background:T.surface}}><tr>
              <th style={thStyle}>Country</th><th style={thStyle}>GHS Index</th><th style={thStyle}>Beds/10K</th><th style={thStyle}>Pharma Vuln</th><th style={thStyle}>AMR Index</th><th style={thStyle}>Pop (M)</th>
            </tr></thead>
            <tbody>{COUNTRIES.sort((a,b)=>a.ghsIndex-b.ghsIndex).slice(0,30).map(c=>(<tr key={c.id}>
              <td style={{...tdStyle,fontWeight:600}}>{c.name}</td>
              <td style={{...tdStyle,color:c.ghsIndex<40?T.red:T.text}}>{c.ghsIndex}</td>
              <td style={tdStyle}>{(c.healthcareCapacityBeds/10).toFixed(0)}</td>
              <td style={{...tdStyle,color:c.pharmaSupplyVuln>70?T.red:T.text}}>{c.pharmaSupplyVuln}/100</td>
              <td style={{...tdStyle,color:c.amrIndex>70?T.red:T.text}}>{c.amrIndex}/100</td>
              <td style={tdStyle}>{c.popM}</td>
            </tr>))}</tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderTab3=()=>(
    <div>
      <div style={{display:'flex',gap:12,marginBottom:20,flexWrap:'wrap'}}>
        {kpiBox('Pharma Exposure',`$${fmt(investData.totalPharma*1e6)}`,'Portfolio pharma at-risk',T.red)}
        {kpiBox('Health Infra Gap',`$${fmt(investData.totalInfra*1e6)}`,'Investment needed',T.amber)}
        {kpiBox('Pandemic Bonds',`$${fmt(investData.totalBonds*1e6)}`,'Market size',T.gold)}
        {kpiBox('One Health Invest',`$${fmt(investData.totalOneHealth*1e6)}`,'Total opportunity',T.green)}
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:20}}>
        <div style={card()}>
          <div style={{fontSize:13,fontWeight:600,color:T.navy,marginBottom:8}}>Healthcare Infrastructure Investment Needs ($M)</div>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={COUNTRIES.sort((a,b)=>b.healthInfraGapM-a.healthInfraGapM).slice(0,20).map(c=>({name:c.name,gap:c.healthInfraGapM}))} layout="vertical" margin={{left:90,right:20,top:5,bottom:5}}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/>
              <XAxis type="number" tick={{fontSize:10,fill:T.textSec}}/>
              <YAxis dataKey="name" type="category" tick={{fontSize:10,fill:T.textSec}} width={85}/>
              <Tooltip contentStyle={{fontSize:12,borderRadius:8}} formatter={(v)=>[`$${fmt(v*1e6)}`,'Infra Gap']}/>
              <Bar dataKey="gap" fill={T.amber} radius={[0,4,4,0]} name="Infra Gap ($M)"/>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={card()}>
          <div style={{fontSize:13,fontWeight:600,color:T.navy,marginBottom:8}}>One Health Investment vs Pandemic Bond Issuance ($M)</div>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={COUNTRIES.sort((a,b)=>b.oneHealthInvestM-a.oneHealthInvestM).slice(0,20).map(c=>({name:c.name,oneHealth:c.oneHealthInvestM,bonds:c.pandemicBondM}))} margin={{top:5,right:20,bottom:30,left:10}}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/>
              <XAxis dataKey="name" tick={{fontSize:8,fill:T.textSec,angle:-35,textAnchor:'end'}} height={60}/>
              <YAxis tick={{fontSize:10,fill:T.textSec}}/>
              <Tooltip contentStyle={{fontSize:12,borderRadius:8}}/>
              <Legend wrapperStyle={{fontSize:11}}/>
              <Bar dataKey="oneHealth" fill={T.green} radius={[4,4,0,0]} name="One Health ($M)"/>
              <Bar dataKey="bonds" fill={T.gold} radius={[4,4,0,0]} name="Pandemic Bonds ($M)"/>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div style={card({marginBottom:20})}>
        <div style={{fontSize:13,fontWeight:600,color:T.navy,marginBottom:8}}>Pharma Portfolio Exposure by Country ($M)</div>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={COUNTRIES.sort((a,b)=>b.pharmaExposure-a.pharmaExposure).slice(0,25).map(c=>({name:c.name,exposure:c.pharmaExposure}))} margin={{top:5,right:20,bottom:30,left:10}}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/>
            <XAxis dataKey="name" tick={{fontSize:8,fill:T.textSec,angle:-35,textAnchor:'end'}} height={60}/>
            <YAxis tick={{fontSize:10,fill:T.textSec}}/>
            <Tooltip contentStyle={{fontSize:12,borderRadius:8}}/>
            <Bar dataKey="exposure" fill={T.red} radius={[4,4,0,0]} name="Pharma Exposure ($M)"/>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div style={card()}>
        <div style={{fontSize:13,fontWeight:600,color:T.navy,marginBottom:8}}>Investment Implications Table</div>
        <div style={{overflowX:'auto',maxHeight:350,overflowY:'auto'}}>
          <table style={{width:'100%',borderCollapse:'collapse'}}>
            <thead style={{position:'sticky',top:0,background:T.surface}}><tr>
              <th style={thStyle}>Country</th><th style={thStyle}>Pharma Exp ($M)</th><th style={thStyle}>Infra Gap ($M)</th><th style={thStyle}>Pandemic Bonds ($M)</th><th style={thStyle}>One Health ($M)</th><th style={thStyle}>GHS</th><th style={thStyle}>Risk Tier</th>
            </tr></thead>
            <tbody>{COUNTRIES.sort((a,b)=>b.healthInfraGapM-a.healthInfraGapM).map(c=>(<tr key={c.id}>
              <td style={{...tdStyle,fontWeight:600}}>{c.name}</td>
              <td style={tdStyle}>${fmt(c.pharmaExposure*1e6)}</td><td style={tdStyle}>${fmt(c.healthInfraGapM*1e6)}</td>
              <td style={tdStyle}>${fmt(c.pandemicBondM*1e6)}</td><td style={tdStyle}>${fmt(c.oneHealthInvestM*1e6)}</td>
              <td style={tdStyle}>{c.ghsIndex}</td><td style={tdStyle}>{pill(tierColor(c.riskTier),c.riskTier)}</td>
            </tr>))}</tbody>
          </table>
        </div>
      </div>
    </div>
  );

  return(
    <div style={{fontFamily:T.font,background:T.bg,minHeight:'100vh',padding:24,color:T.text}}>
      <div style={{maxWidth:1440,margin:'0 auto'}}>
        <div style={{marginBottom:24}}>
          <h1 style={{fontSize:26,fontWeight:700,color:T.navy,margin:0}}>Pandemic-Climate Nexus</h1>
          <p style={{color:T.textSec,fontSize:14,margin:'4px 0 0'}}>Zoonotic spillover risk, vector-borne disease expansion, pandemic preparedness & investment implications across 40 countries</p>
        </div>
        <div style={{display:'flex',gap:4,marginBottom:20,borderBottom:`2px solid ${T.border}`,paddingBottom:0}}>
          {TABS.map((t,i)=>(<button key={i} onClick={()=>setTab(i)} style={{padding:'10px 20px',border:'none',borderBottom:tab===i?`3px solid ${T.gold}`:'3px solid transparent',background:'transparent',color:tab===i?T.navy:T.textMut,fontWeight:tab===i?700:500,fontSize:13,cursor:'pointer',fontFamily:T.font,transition:'all 0.2s'}}>{t}</button>))}
        </div>
        {tab===0&&renderTab0()}
        {tab===1&&renderTab1()}
        {tab===2&&renderTab2()}
        {tab===3&&renderTab3()}
        <div style={{marginTop:32,padding:'12px 16px',background:T.surfaceH,borderRadius:8,border:`1px solid ${T.border}`,fontSize:11,color:T.textMut,fontFamily:T.mono}}>
          EP-AU3 Pandemic-Climate Nexus | Sprint AU: Climate & Health Nexus Finance | 40 countries, {DISEASES.length} diseases, {RCP_SCENARIOS.length} RCPs, {QUARTERS.length}Q trend
        </div>
      </div>
    </div>
  );
}