import React,{useState,useMemo,useCallback} from 'react';
import {BarChart,Bar,XAxis,YAxis,CartesianGrid,Tooltip,ResponsiveContainer,PieChart,Pie,Cell,Legend,AreaChart,Area,LineChart,Line} from 'recharts';

const T={bg:'#f6f4f0',surface:'#ffffff',surfaceH:'#f0ede7',border:'#e5e0d8',borderL:'#d5cfc5',navy:'#1b3a5c',navyL:'#2c5a8c',gold:'#c5a96a',goldL:'#d4be8a',sage:'#5a8a6a',sageL:'#7ba67d',teal:'#5a8a6a',text:'#1b3a5c',textSec:'#5c6b7e',textMut:'#9aa3ae',red:'#dc2626',green:'#16a34a',amber:'#d97706',font:"'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"};
const sr=(s)=>{let x=Math.sin(s+1)*10000;return x-Math.floor(x);};

const QUARTERS=['Q1-23','Q2-23','Q3-23','Q4-23','Q1-24','Q2-24','Q3-24','Q4-24','Q1-25','Q2-25','Q3-25','Q4-25'];
const FINANCE_TYPES=['Green Bond','Social Bond','Sustainability-Linked','Blended Finance','MDB Programme','Sovereign Health Bond','Impact Fund','Concessional Loan'];
const EARLY_WARNING_TYPES=['Heat Alert','Flood Health','Air Quality','Disease Outbreak','Wildfire Smoke','UV Index'];
const INFRA_CATEGORIES=['Hospital Cooling','Water Sanitation','Disease Surveillance','Emergency Shelters','Vaccine Cold Chain','Mental Health','Maternal Health','Nutrition Systems'];

const COUNTRY_NAMES=['Bangladesh','India','Nigeria','Kenya','Ethiopia','Tanzania','Uganda','Mozambique','Pakistan','Nepal',
'Cambodia','Laos','Myanmar','Philippines','Vietnam','Mali','Burkina Faso','Niger','Chad','Senegal',
'Guatemala','Honduras','Haiti','Bolivia','Peru','Madagascar','Malawi','Zambia','Rwanda','Ghana'];

const genCountries=(count)=>{
  const countries=[];
  for(let i=0;i<count;i++){
    const s1=sr(i*7+401);const s2=sr(i*13+403);const s3=sr(i*19+407);const s4=sr(i*23+409);const s5=sr(i*29+411);
    const adaptSpendM=Math.floor(s1*2000+20);
    const mitigSpendM=Math.floor(adaptSpendM*1.5+s2*1000);
    const healthAdaptPct=+(adaptSpendM/(adaptSpendM+mitigSpendM)*100).toFixed(1);
    const donorCommitM=Math.floor(s3*3000+50);
    const financingGapM=Math.floor(s4*5000+200);
    const popM=+(s5*150+2).toFixed(1);
    const infraScores=INFRA_CATEGORIES.map((_,ci)=>({category:INFRA_CATEGORIES[ci],score:Math.floor(sr(i*31+ci*7+413)*100),investNeedM:Math.floor(sr(i*37+ci*11+417)*500+10)}));
    const earlyWarning=EARLY_WARNING_TYPES.map((_,ei)=>({type:EARLY_WARNING_TYPES[ei],coveragePct:Math.floor(sr(i*41+ei*13+419)*100),effectivenessPct:Math.floor(sr(i*43+ei*17+421)*100),investNeedM:Math.floor(sr(i*47+ei*7+423)*100+5)}));
    const qTrend=QUARTERS.map((_,qi)=>({q:QUARTERS[qi],adaptSpend:Math.floor(adaptSpendM*(0.8+qi*0.03+sr(i*53+qi*11)*0.1)),gapClosure:Math.floor(sr(i*59+qi*7)*10+qi*2)}));
    const financingInstruments=FINANCE_TYPES.map((_,fi)=>({type:FINANCE_TYPES[fi],amountM:Math.floor(sr(i*61+fi*11+425)*800+10),tenorYrs:Math.floor(sr(i*67+fi*13+427)*15+3),rateSpread:+(sr(i*71+fi*7+429)*3+0.5).toFixed(2)}));
    countries.push({id:i,name:COUNTRY_NAMES[i]||`Country_${i}`,adaptSpendM,mitigSpendM,healthAdaptPct,donorCommitM,financingGapM,popM,
      infraScores,earlyWarning,qTrend,financingInstruments,
      region:i<10?'South Asia':i<20?'Africa':i<25?'Latin America':'Other',
      vulnerabilityTier:financingGapM>3000?'Critical':financingGapM>1500?'High':financingGapM>500?'Medium':'Low'});
  }
  return countries;
};

const COUNTRIES=genCountries(30);

const pill=(color,text)=>(<span style={{display:'inline-block',padding:'2px 10px',borderRadius:12,fontSize:11,fontWeight:600,background:color+'18',color,border:`1px solid ${color}30`}}>{text}</span>);
const tierColor=(t)=>t==='Critical'?T.red:t==='High'?T.amber:t==='Medium'?T.gold:T.green;
const fmt=(n)=>n>=1e9?(n/1e9).toFixed(1)+'B':n>=1e6?(n/1e6).toFixed(1)+'M':n>=1e3?(n/1e3).toFixed(1)+'K':String(n);
const card=(s)=>({background:T.surface,borderRadius:10,border:`1px solid ${T.border}`,padding:18,...s});
const kpiBox=(label,value,sub,color)=>(<div style={card({flex:'1',minWidth:180,textAlign:'center'})}><div style={{fontSize:11,color:T.textMut,fontFamily:T.mono,textTransform:'uppercase',letterSpacing:1}}>{label}</div><div style={{fontSize:28,fontWeight:700,color:color||T.navy,margin:'4px 0'}}>{value}</div>{sub&&<div style={{fontSize:12,color:T.textSec}}>{sub}</div>}</div>);

export default function HealthAdaptationFinancePage(){
  const [tab,setTab]=useState(0);
  const [searchTerm,setSearchTerm]=useState('');
  const [regionFilter,setRegionFilter]=useState('All');
  const [selectedCountry,setSelectedCountry]=useState(null);
  const [instrumentFilter,setInstrumentFilter]=useState('All');

  const TABS=['Adaptation Finance Dashboard','Healthcare Infrastructure','Early Warning Systems','Financing Instruments'];

  const filtered=useMemo(()=>{
    let c=[...COUNTRIES];
    if(searchTerm) c=c.filter(x=>x.name.toLowerCase().includes(searchTerm.toLowerCase()));
    if(regionFilter!=='All') c=c.filter(x=>x.region===regionFilter);
    return c;
  },[searchTerm,regionFilter]);

  const globalKPIs=useMemo(()=>{
    const totalAdapt=COUNTRIES.reduce((s,c)=>s+c.adaptSpendM,0);
    const totalMitig=COUNTRIES.reduce((s,c)=>s+c.mitigSpendM,0);
    const totalDonor=COUNTRIES.reduce((s,c)=>s+c.donorCommitM,0);
    const totalGap=COUNTRIES.reduce((s,c)=>s+c.financingGapM,0);
    return{totalAdapt,totalMitig,totalDonor,totalGap,adaptPct:+(totalAdapt/(totalAdapt+totalMitig)*100).toFixed(1)};
  },[]);

  const adaptMitigSplit=useMemo(()=>[{name:'Adaptation',value:globalKPIs.totalAdapt},{name:'Mitigation',value:globalKPIs.totalMitig}],[globalKPIs]);
  const COLORS=[T.sage,T.navy,T.gold,T.amber,T.red,T.green,T.navyL,'#9333ea'];

  const infraAgg=useMemo(()=>INFRA_CATEGORIES.map(cat=>{
    const scores=COUNTRIES.map(c=>c.infraScores.find(x=>x.category===cat));
    const avgScore=Math.floor(scores.reduce((s,x)=>s+(x?.score||0),0)/ Math.max(1, scores.length));
    const totalNeed=scores.reduce((s,x)=>s+(x?.investNeedM||0),0);
    return{category:cat,avgScore,totalNeedM:totalNeed};
  }),[]);

  const ewsAgg=useMemo(()=>EARLY_WARNING_TYPES.map(ew=>{
    const items=COUNTRIES.map(c=>c.earlyWarning.find(x=>x.type===ew));
    const avgCov=Math.floor(items.reduce((s,x)=>s+(x?.coveragePct||0),0)/ Math.max(1, items.length));
    const avgEff=Math.floor(items.reduce((s,x)=>s+(x?.effectivenessPct||0),0)/ Math.max(1, items.length));
    const totalInvest=items.reduce((s,x)=>s+(x?.investNeedM||0),0);
    return{type:ew,avgCoverage:avgCov,avgEffectiveness:avgEff,totalInvestM:totalInvest};
  }),[]);

  const finInstrumentAgg=useMemo(()=>FINANCE_TYPES.map(ft=>{
    const items=COUNTRIES.flatMap(c=>c.financingInstruments.filter(x=>x.type===ft));
    const totalM=items.reduce((s,x)=>s+x.amountM,0);
    const avgTenor=items.length?+(items.reduce((s,x)=>s+x.tenorYrs,0)/items.length).toFixed(1):0;
    const avgSpread=items.length?+(items.reduce((s,x)=>s+x.rateSpread,0)/items.length).toFixed(2):0;
    return{type:ft,totalM,avgTenor,avgSpread,count:items.length};
  }),[]);

  const thStyle={padding:'8px 10px',textAlign:'left',fontSize:11,fontFamily:T.mono,color:T.textMut,textTransform:'uppercase',letterSpacing:0.5,borderBottom:`2px solid ${T.border}`,cursor:'pointer',userSelect:'none',whiteSpace:'nowrap'};
  const tdStyle={padding:'8px 10px',fontSize:13,borderBottom:`1px solid ${T.border}`};
  const detail=selectedCountry!==null?COUNTRIES.find(c=>c.id===selectedCountry):null;

  const renderTab0=()=>(
    <div>
      <div style={{display:'flex',gap:12,marginBottom:20,flexWrap:'wrap'}}>
        {kpiBox('Total Adaptation',`$${fmt(globalKPIs.totalAdapt*1e6)}`,'Climate-health spending',T.sage)}
        {kpiBox('Adapt vs Mitig',`${globalKPIs.adaptPct}%`,'Adaptation share',globalKPIs.adaptPct<30?T.red:T.gold)}
        {kpiBox('Donor Commitments',`$${fmt(globalKPIs.totalDonor*1e6)}`,'Total pledged',T.green)}
        {kpiBox('Financing Gap',`$${fmt(globalKPIs.totalGap*1e6)}`,'Unmet health-climate need',T.red)}
      </div>
      <div style={{display:'flex',gap:12,marginBottom:16,alignItems:'center',flexWrap:'wrap'}}>
        <input placeholder="Search country..." value={searchTerm} onChange={e=>setSearchTerm(e.target.value)} style={{padding:'6px 12px',borderRadius:6,border:`1px solid ${T.border}`,fontSize:13,fontFamily:T.font,minWidth:160}}/>
        <select value={regionFilter} onChange={e=>setRegionFilter(e.target.value)} style={{padding:'6px 12px',borderRadius:6,border:`1px solid ${T.border}`,fontSize:13}}>
          <option value="All">All Regions</option>
          {['South Asia','Africa','Latin America','Other'].map(r=>(<option key={r} value={r}>{r}</option>))}
        </select>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'2fr 1fr',gap:16,marginBottom:20}}>
        <div style={card()}>
          <div style={{fontSize:13,fontWeight:600,color:T.navy,marginBottom:8}}>Adaptation vs Mitigation Spending by Country ($M)</div>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={filtered.sort((a,b)=>(b.adaptSpendM+b.mitigSpendM)-(a.adaptSpendM+a.mitigSpendM)).slice(0,20).map(c=>({name:c.name,adapt:c.adaptSpendM,mitig:c.mitigSpendM}))} layout="vertical" margin={{left:90,right:20,top:5,bottom:5}}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/>
              <XAxis type="number" tick={{fontSize:10,fill:T.textSec}}/>
              <YAxis dataKey="name" type="category" tick={{fontSize:10,fill:T.textSec}} width={85}/>
              <Tooltip contentStyle={{fontSize:12,borderRadius:8}}/>
              <Legend wrapperStyle={{fontSize:11}}/>
              <Bar dataKey="adapt" fill={T.sage} radius={[0,4,4,0]} name="Adaptation ($M)" stackId="a"/>
              <Bar dataKey="mitig" fill={T.navy} radius={[0,4,4,0]} name="Mitigation ($M)" stackId="a"/>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={card()}>
          <div style={{fontSize:13,fontWeight:600,color:T.navy,marginBottom:8}}>Global Adapt/Mitig Split</div>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={adaptMitigSplit} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({name,percent})=>`${name} ${(percent*100).toFixed(0)}%`} labelLine={{stroke:T.textMut}} fontSize={11}>
                <Cell fill={T.sage}/><Cell fill={T.navy}/>
              </Pie>
              <Tooltip contentStyle={{fontSize:12,borderRadius:8}} formatter={(v)=>[`$${fmt(v*1e6)}`,'Spending']}/>
            </PieChart>
          </ResponsiveContainer>
          <div style={{fontSize:13,fontWeight:600,color:T.navy,marginBottom:8,marginTop:12}}>Financing Gap by Country</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={filtered.sort((a,b)=>b.financingGapM-a.financingGapM).slice(0,10).map(c=>({name:c.name,gap:c.financingGapM}))} margin={{top:5,right:10,bottom:30,left:5}}>
              <XAxis dataKey="name" tick={{fontSize:8,fill:T.textSec,angle:-30,textAnchor:'end'}} height={50}/>
              <YAxis tick={{fontSize:9,fill:T.textSec}}/>
              <Tooltip contentStyle={{fontSize:12,borderRadius:8}}/>
              <Bar dataKey="gap" fill={T.red} radius={[4,4,0,0]} name="Gap ($M)"/>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div style={card({marginBottom:20})}>
        <div style={{fontSize:13,fontWeight:600,color:T.navy,marginBottom:8}}>Quarterly Adaptation Spend Trend (Global Aggregate)</div>
        <ResponsiveContainer width="100%" height={250}>
          <AreaChart data={QUARTERS.map((q,qi)=>({q,totalAdapt:COUNTRIES.reduce((s,c)=>s+c.qTrend[qi].adaptSpend,0),gapClosure:Math.floor(COUNTRIES.reduce((s,c)=>s+c.qTrend[qi].gapClosure,0)/ Math.max(1, COUNTRIES.length))}))} margin={{top:5,right:20,bottom:5,left:10}}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/><XAxis dataKey="q" tick={{fontSize:10,fill:T.textSec}}/><YAxis tick={{fontSize:10,fill:T.textSec}}/>
            <Tooltip contentStyle={{fontSize:12,borderRadius:8}}/><Legend wrapperStyle={{fontSize:11}}/>
            <Area type="monotone" dataKey="totalAdapt" stroke={T.sage} fill={T.sage+'20'} strokeWidth={2} name="Total Adaptation ($M)"/>
            <Area type="monotone" dataKey="gapClosure" stroke={T.gold} fill={T.gold+'20'} strokeWidth={2} name="Gap Closure %"/>
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div style={card()}>
        <div style={{fontSize:13,fontWeight:600,color:T.navy,marginBottom:8}}>Country Adaptation Finance Table</div>
        <div style={{overflowX:'auto',maxHeight:350,overflowY:'auto'}}>
          <table style={{width:'100%',borderCollapse:'collapse'}}>
            <thead style={{position:'sticky',top:0,background:T.surface}}><tr>
              <th style={thStyle}>Country</th><th style={thStyle}>Region</th><th style={thStyle}>Adaptation ($M)</th><th style={thStyle}>Mitigation ($M)</th><th style={thStyle}>Health Adapt %</th><th style={thStyle}>Donor ($M)</th><th style={thStyle}>Gap ($M)</th><th style={thStyle}>Vulnerability</th>
            </tr></thead>
            <tbody>{filtered.map(c=>(<tr key={c.id} onClick={()=>setSelectedCountry(c.id)} style={{cursor:'pointer',background:selectedCountry===c.id?T.surfaceH:'transparent'}}>
              <td style={{...tdStyle,fontWeight:600}}>{c.name}</td><td style={tdStyle}>{c.region}</td>
              <td style={tdStyle}>${fmt(c.adaptSpendM*1e6)}</td><td style={tdStyle}>${fmt(c.mitigSpendM*1e6)}</td>
              <td style={tdStyle}>{c.healthAdaptPct}%</td><td style={tdStyle}>${fmt(c.donorCommitM*1e6)}</td>
              <td style={{...tdStyle,color:c.financingGapM>3000?T.red:T.text}}>${fmt(c.financingGapM*1e6)}</td>
              <td style={tdStyle}>{pill(tierColor(c.vulnerabilityTier),c.vulnerabilityTier)}</td>
            </tr>))}</tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderTab1=()=>(
    <div>
      <div style={{display:'flex',gap:12,marginBottom:20,flexWrap:'wrap'}}>
        {kpiBox('Avg Hospital Score',Math.floor(infraAgg.find(x=>x.category==='Hospital Cooling')?.avgScore||0)+'/100','Cooling systems readiness',T.amber)}
        {kpiBox('Total Infra Need',`$${fmt(infraAgg.reduce((s,x)=>s+x.totalNeedM,0)*1e6)}`,'Across all categories',T.red)}
        {kpiBox('Lowest Scoring','Disease Surveillance',`${infraAgg.sort((a,b)=>a.avgScore-b.avgScore)[0]?.avgScore}/100`,T.red)}
        {kpiBox('Categories Tracked',INFRA_CATEGORIES.length,'Health infrastructure types',T.navy)}
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:20}}>
        <div style={card()}>
          <div style={{fontSize:13,fontWeight:600,color:T.navy,marginBottom:8}}>Average Infrastructure Resilience Score</div>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={infraAgg.sort((a,b)=>a.avgScore-b.avgScore)} layout="vertical" margin={{left:130,right:20,top:5,bottom:5}}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/>
              <XAxis type="number" tick={{fontSize:10,fill:T.textSec}} domain={[0,100]}/>
              <YAxis dataKey="category" type="category" tick={{fontSize:10,fill:T.textSec}} width={125}/>
              <Tooltip contentStyle={{fontSize:12,borderRadius:8}}/>
              <Bar dataKey="avgScore" radius={[0,4,4,0]} name="Avg Score">
                {infraAgg.sort((a,b)=>a.avgScore-b.avgScore).map((d,i)=>(<Cell key={i} fill={d.avgScore>60?T.green:d.avgScore>40?T.gold:T.red}/>))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={card()}>
          <div style={{fontSize:13,fontWeight:600,color:T.navy,marginBottom:8}}>Investment Need by Category ($M)</div>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={infraAgg.sort((a,b)=>b.totalNeedM-a.totalNeedM)} layout="vertical" margin={{left:130,right:20,top:5,bottom:5}}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/>
              <XAxis type="number" tick={{fontSize:10,fill:T.textSec}}/>
              <YAxis dataKey="category" type="category" tick={{fontSize:10,fill:T.textSec}} width={125}/>
              <Tooltip contentStyle={{fontSize:12,borderRadius:8}} formatter={(v)=>[`$${fmt(v*1e6)}`,'Investment Need']}/>
              <Bar dataKey="totalNeedM" fill={T.amber} radius={[0,4,4,0]} name="Need ($M)"/>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div style={card()}>
        <div style={{fontSize:13,fontWeight:600,color:T.navy,marginBottom:8}}>Country-Level Infrastructure Scores</div>
        <div style={{overflowX:'auto',maxHeight:400,overflowY:'auto'}}>
          <table style={{width:'100%',borderCollapse:'collapse'}}>
            <thead style={{position:'sticky',top:0,background:T.surface}}><tr>
              <th style={thStyle}>Country</th>
              {INFRA_CATEGORIES.map(cat=>(<th key={cat} style={{...thStyle,fontSize:9}}>{cat}</th>))}
              <th style={thStyle}>Avg</th>
            </tr></thead>
            <tbody>{COUNTRIES.map(c=>{const avg=Math.floor(c.infraScores.reduce((s,x)=>s+x.score,0)/c.infraScores.length);return(<tr key={c.id}>
              <td style={{...tdStyle,fontWeight:600}}>{c.name}</td>
              {c.infraScores.map((inf,ii)=>(<td key={ii} style={{...tdStyle,fontSize:12,color:inf.score<40?T.red:inf.score<60?T.amber:T.green}}>{inf.score}</td>))}
              <td style={{...tdStyle,fontWeight:700}}>{avg}</td>
            </tr>);})}</tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderTab2=()=>(
    <div>
      <div style={{display:'flex',gap:12,marginBottom:20,flexWrap:'wrap'}}>
        {kpiBox('Avg Coverage',Math.floor(ewsAgg.reduce((s,e)=>s+e.avgCoverage,0)/ Math.max(1, ewsAgg.length))+'%','Early warning systems',T.gold)}
        {kpiBox('Avg Effectiveness',Math.floor(ewsAgg.reduce((s,e)=>s+e.avgEffectiveness,0)/ Math.max(1, ewsAgg.length))+'%','System performance',T.sage)}
        {kpiBox('Total Investment Need',`$${fmt(ewsAgg.reduce((s,e)=>s+e.totalInvestM,0)*1e6)}`,'EWS gap',T.amber)}
        {kpiBox('EWS Types',EARLY_WARNING_TYPES.length,'Alert categories',T.navy)}
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:20}}>
        <div style={card()}>
          <div style={{fontSize:13,fontWeight:600,color:T.navy,marginBottom:8}}>Coverage vs Effectiveness by EWS Type</div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={ewsAgg} margin={{top:5,right:20,bottom:5,left:10}}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/>
              <XAxis dataKey="type" tick={{fontSize:10,fill:T.textSec}}/>
              <YAxis tick={{fontSize:10,fill:T.textSec}} domain={[0,100]}/>
              <Tooltip contentStyle={{fontSize:12,borderRadius:8}}/>
              <Legend wrapperStyle={{fontSize:11}}/>
              <Bar dataKey="avgCoverage" fill={T.sage} radius={[4,4,0,0]} name="Coverage %"/>
              <Bar dataKey="avgEffectiveness" fill={T.gold} radius={[4,4,0,0]} name="Effectiveness %"/>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={card()}>
          <div style={{fontSize:13,fontWeight:600,color:T.navy,marginBottom:8}}>Investment Need by EWS Type ($M)</div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={ewsAgg.sort((a,b)=>b.totalInvestM-a.totalInvestM)} margin={{top:5,right:20,bottom:5,left:10}}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/>
              <XAxis dataKey="type" tick={{fontSize:10,fill:T.textSec}}/>
              <YAxis tick={{fontSize:10,fill:T.textSec}}/>
              <Tooltip contentStyle={{fontSize:12,borderRadius:8}} formatter={(v)=>[`$${fmt(v*1e6)}`,'Need']}/>
              <Bar dataKey="totalInvestM" fill={T.amber} radius={[4,4,0,0]} name="Investment ($M)"/>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div style={card()}>
        <div style={{fontSize:13,fontWeight:600,color:T.navy,marginBottom:8}}>Country Early Warning System Coverage</div>
        <div style={{overflowX:'auto',maxHeight:400,overflowY:'auto'}}>
          <table style={{width:'100%',borderCollapse:'collapse'}}>
            <thead style={{position:'sticky',top:0,background:T.surface}}><tr>
              <th style={thStyle}>Country</th>
              {EARLY_WARNING_TYPES.map(ew=>(<th key={ew} style={{...thStyle,fontSize:9}}>{ew}</th>))}
              <th style={thStyle}>Avg %</th><th style={thStyle}>Need ($M)</th>
            </tr></thead>
            <tbody>{COUNTRIES.map(c=>{const avg=Math.floor(c.earlyWarning.reduce((s,e)=>s+e.coveragePct,0)/c.earlyWarning.length);const need=c.earlyWarning.reduce((s,e)=>s+e.investNeedM,0);return(<tr key={c.id}>
              <td style={{...tdStyle,fontWeight:600}}>{c.name}</td>
              {c.earlyWarning.map((ew,ei)=>(<td key={ei} style={{...tdStyle,fontSize:12,color:ew.coveragePct<40?T.red:ew.coveragePct<70?T.amber:T.green}}>{ew.coveragePct}%</td>))}
              <td style={{...tdStyle,fontWeight:700,color:avg<50?T.red:T.text}}>{avg}%</td>
              <td style={tdStyle}>${fmt(need*1e6)}</td>
            </tr>);})}</tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderTab3=()=>(
    <div>
      <div style={{display:'flex',gap:12,marginBottom:20,flexWrap:'wrap'}}>
        {kpiBox('Total Issuance',`$${fmt(finInstrumentAgg.reduce((s,f)=>s+f.totalM,0)*1e6)}`,'All health-climate bonds',T.green)}
        {kpiBox('Instruments',finInstrumentAgg.length,'Financing types',T.navy)}
        {kpiBox('Avg Tenor',+(finInstrumentAgg.reduce((s,f)=>s+f.avgTenor,0)/ Math.max(1, finInstrumentAgg.length)).toFixed(1)+' yrs','Bond maturity',T.gold)}
        {kpiBox('Avg Spread',+(finInstrumentAgg.reduce((s,f)=>s+f.avgSpread,0)/ Math.max(1, finInstrumentAgg.length)).toFixed(2)+'%','Over benchmark',T.amber)}
      </div>
      <div style={{display:'flex',gap:8,marginBottom:16,flexWrap:'wrap'}}>
        <button onClick={()=>setInstrumentFilter('All')} style={{padding:'5px 14px',borderRadius:6,border:`1px solid ${instrumentFilter==='All'?T.navy:T.border}`,background:instrumentFilter==='All'?T.navy:'transparent',color:instrumentFilter==='All'?'#fff':T.text,fontSize:12,fontWeight:600,cursor:'pointer'}}>All</button>
        {FINANCE_TYPES.map(ft=>(<button key={ft} onClick={()=>setInstrumentFilter(ft)} style={{padding:'5px 14px',borderRadius:6,border:`1px solid ${instrumentFilter===ft?T.navy:T.border}`,background:instrumentFilter===ft?T.navy:'transparent',color:instrumentFilter===ft?'#fff':T.text,fontSize:12,fontWeight:600,cursor:'pointer'}}>{ft}</button>))}
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:20}}>
        <div style={card()}>
          <div style={{fontSize:13,fontWeight:600,color:T.navy,marginBottom:8}}>Issuance by Instrument Type ($M)</div>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={finInstrumentAgg} dataKey="totalM" nameKey="type" cx="50%" cy="50%" outerRadius={100} label={({name,percent})=>`${name.split(' ')[0]} ${(percent*100).toFixed(0)}%`} labelLine={{stroke:T.textMut}} fontSize={10}>
                {finInstrumentAgg.map((_,i)=>(<Cell key={i} fill={COLORS[i%COLORS.length]}/>))}
              </Pie>
              <Tooltip contentStyle={{fontSize:12,borderRadius:8}} formatter={(v)=>[`$${fmt(v*1e6)}`,'Issuance']}/>
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div style={card()}>
          <div style={{fontSize:13,fontWeight:600,color:T.navy,marginBottom:8}}>Tenor vs Spread by Instrument</div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={finInstrumentAgg} margin={{top:5,right:20,bottom:30,left:10}}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/>
              <XAxis dataKey="type" tick={{fontSize:8,fill:T.textSec,angle:-30,textAnchor:'end'}} height={60}/>
              <YAxis tick={{fontSize:10,fill:T.textSec}}/>
              <Tooltip contentStyle={{fontSize:12,borderRadius:8}}/>
              <Legend wrapperStyle={{fontSize:11}}/>
              <Bar dataKey="avgTenor" fill={T.navy} radius={[4,4,0,0]} name="Avg Tenor (yrs)"/>
              <Bar dataKey="avgSpread" fill={T.gold} radius={[4,4,0,0]} name="Avg Spread (%)"/>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div style={card()}>
        <div style={{fontSize:13,fontWeight:600,color:T.navy,marginBottom:8}}>Country Financing Instruments Detail</div>
        <div style={{overflowX:'auto',maxHeight:400,overflowY:'auto'}}>
          <table style={{width:'100%',borderCollapse:'collapse'}}>
            <thead style={{position:'sticky',top:0,background:T.surface}}><tr>
              <th style={thStyle}>Country</th>
              {(instrumentFilter==='All'?FINANCE_TYPES:FINANCE_TYPES.filter(ft=>ft===instrumentFilter)).map(ft=>(<th key={ft} style={{...thStyle,fontSize:9}}>{ft} ($M)</th>))}
              <th style={thStyle}>Total ($M)</th>
            </tr></thead>
            <tbody>{COUNTRIES.map(c=>{const instruments=instrumentFilter==='All'?c.financingInstruments:c.financingInstruments.filter(fi=>fi.type===instrumentFilter);const total=instruments.reduce((s,fi)=>s+fi.amountM,0);return(<tr key={c.id}>
              <td style={{...tdStyle,fontWeight:600}}>{c.name}</td>
              {instruments.map((fi,fii)=>(<td key={fii} style={tdStyle}>${fmt(fi.amountM*1e6)}</td>))}
              <td style={{...tdStyle,fontWeight:700}}>${fmt(total*1e6)}</td>
            </tr>);})}</tbody>
          </table>
        </div>
      </div>
    </div>
  );

  return(
    <div style={{fontFamily:T.font,background:T.bg,minHeight:'100vh',padding:24,color:T.text}}>
      <div style={{maxWidth:1440,margin:'0 auto'}}>
        <div style={{marginBottom:24}}>
          <h1 style={{fontSize:26,fontWeight:700,color:T.navy,margin:0}}>Health Adaptation Finance</h1>
          <p style={{color:T.textSec,fontSize:14,margin:'4px 0 0'}}>Climate-health adaptation projects, healthcare infrastructure investment, early warning systems & financing instruments across 30 countries</p>
        </div>
        <div style={{display:'flex',gap:4,marginBottom:20,borderBottom:`2px solid ${T.border}`,paddingBottom:0}}>
          {TABS.map((t,i)=>(<button key={i} onClick={()=>setTab(i)} style={{padding:'10px 20px',border:'none',borderBottom:tab===i?`3px solid ${T.gold}`:'3px solid transparent',background:'transparent',color:tab===i?T.navy:T.textMut,fontWeight:tab===i?700:500,fontSize:13,cursor:'pointer',fontFamily:T.font,transition:'all 0.2s'}}>{t}</button>))}
        </div>
        {tab===0&&renderTab0()}
        {tab===1&&renderTab1()}
        {tab===2&&renderTab2()}
        {tab===3&&renderTab3()}
        <div style={{marginTop:32,padding:'12px 16px',background:T.surfaceH,borderRadius:8,border:`1px solid ${T.border}`,fontSize:11,color:T.textMut,fontFamily:T.mono}}>
          EP-AU4 Health Adaptation Finance | Sprint AU: Climate & Health Nexus Finance | 30 countries, {INFRA_CATEGORIES.length} infra categories, {EARLY_WARNING_TYPES.length} EWS types, {FINANCE_TYPES.length} instruments, {QUARTERS.length}Q trend
        </div>
      </div>
    </div>
  );
}