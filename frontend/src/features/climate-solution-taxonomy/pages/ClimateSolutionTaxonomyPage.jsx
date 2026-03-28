import React, { useState, useMemo, useCallback } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, RadarChart, Radar, PolarGrid, PolarAngleAxis,
  PolarRadiusAxis, AreaChart, Area,
} from 'recharts';

const T={bg:'#f6f4f0',surface:'#ffffff',surfaceH:'#f0ede7',border:'#e5e0d8',borderL:'#d5cfc5',navy:'#1b3a5c',navyL:'#2c5a8c',gold:'#c5a96a',goldL:'#d4be8a',sage:'#5a8a6a',sageL:'#7ba67d',teal:'#5a8a6a',text:'#1b3a5c',textSec:'#5c6b7e',textMut:'#9aa3ae',red:'#dc2626',green:'#16a34a',amber:'#d97706',font:"'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"};
const sr=(s)=>{let x=Math.sin(s+1)*10000;return x-Math.floor(x);};

/* ─── 12 Climate Solution Categories ─── */
const CATEGORIES = [
  { id:'clean_energy', name:'Clean Energy Generation', icon:'\u2600', color:'#f59e0b',
    marketSize:1420, growth:14.2, subCats:['Solar PV','Onshore Wind','Offshore Wind','Geothermal','Tidal/Wave'], keyTech:['Perovskite cells','Floating turbines','Enhanced geothermal'], investReq:890 },
  { id:'energy_storage', name:'Energy Storage', icon:'\u26a1', color:'#8b5cf6',
    marketSize:310, growth:22.5, subCats:['Li-ion batteries','Flow batteries','Pumped hydro','Compressed air','Thermal storage'], keyTech:['Solid-state batteries','Iron-air batteries','Gravity storage'], investReq:420 },
  { id:'grid_infra', name:'Grid Infrastructure', icon:'\ud83d\udd0c', color:'#06b6d4',
    marketSize:580, growth:9.8, subCats:['Smart grids','HVDC transmission','Microgrids','Grid-scale inverters','Demand response'], keyTech:['AI grid management','Superconducting cables','Virtual power plants'], investReq:670 },
  { id:'ev_transport', name:'EV & Clean Transport', icon:'\ud83d\ude97', color:'#10b981',
    marketSize:890, growth:18.6, subCats:['Passenger EVs','Commercial EVs','E-buses','Rail electrification','Maritime electrification'], keyTech:['Solid-state EV batteries','Autonomous EVs','Electric aviation'], investReq:750 },
  { id:'green_hydrogen', name:'Green Hydrogen', icon:'\ud83d\udca7', color:'#3b82f6',
    marketSize:180, growth:35.2, subCats:['Electrolysis','H2 fuel cells','H2 storage','H2 pipelines','Industrial H2'], keyTech:['PEM electrolyzers','Solid oxide cells','Ammonia cracking'], investReq:560 },
  { id:'ccus', name:'CCUS', icon:'\ud83c\udf2b\ufe0f', color:'#6366f1',
    marketSize:95, growth:28.4, subCats:['Point-source capture','Direct air capture','CO2 transport','CO2 storage','CO2 utilization'], keyTech:['Amine solvents','Solid sorbents','Mineral carbonation'], investReq:340 },
  { id:'sust_ag', name:'Sustainable Agriculture', icon:'\ud83c\udf3e', color:'#84cc16',
    marketSize:420, growth:11.3, subCats:['Precision farming','Regenerative ag','Alt proteins','Vertical farming','Biochar'], keyTech:['AI crop monitoring','Gene editing','Methane inhibitors'], investReq:280 },
  { id:'circular', name:'Circular Economy', icon:'\u267b\ufe0f', color:'#f97316',
    marketSize:340, growth:12.8, subCats:['Chemical recycling','Remanufacturing','Product-as-service','Waste-to-value','Industrial symbiosis'], keyTech:['AI sorting','Enzymatic recycling','Digital product passports'], investReq:210 },
  { id:'water_tech', name:'Water Technology', icon:'\ud83d\udca7', color:'#0ea5e9',
    marketSize:260, growth:8.9, subCats:['Desalination','Water recycling','Smart water grids','Flood management','Water-energy nexus'], keyTech:['Graphene membranes','AI leak detection','Atmospheric water generation'], investReq:190 },
  { id:'nature_based', name:'Nature-Based Solutions', icon:'\ud83c\udf33', color:'#22c55e',
    marketSize:150, growth:16.7, subCats:['Reforestation','Mangrove restoration','Peatland restoration','Biodiversity credits','Ocean CDR'], keyTech:['LiDAR monitoring','eDNA sampling','Satellite MRV'], investReq:120 },
  { id:'green_buildings', name:'Green Buildings', icon:'\ud83c\udfe2', color:'#14b8a6',
    marketSize:530, growth:10.5, subCats:['Heat pumps','Smart HVAC','Green cement','Mass timber','Building retrofits'], keyTech:['Digital twins','Phase-change materials','Electrochromic glass'], investReq:450 },
  { id:'climate_adapt', name:'Climate Adaptation', icon:'\ud83d\udee1\ufe0f', color:'#ef4444',
    marketSize:190, growth:19.3, subCats:['Early warning systems','Resilient infrastructure','Climate insurance','Drought-resistant crops','Cooling tech'], keyTech:['AI climate modelling','Parametric insurance','Heat-reflective materials'], investReq:310 },
];

const CAT_MAP = Object.fromEntries(CATEGORIES.map(c=>[c.id,c]));
const TRL_LABELS = ['TRL 1','TRL 2','TRL 3','TRL 4','TRL 5','TRL 6','TRL 7','TRL 8','TRL 9'];
const TAXONOMY_NAMES = ['EU Taxonomy','CBI Taxonomy','FTSE Green Rev','Proprietary'];
const PIE_COLORS = ['#1b3a5c','#2c5a8c','#5a8a6a','#c5a96a','#7ba67d','#d4be8a','#9aa3ae','#dc2626','#f59e0b','#8b5cf6','#06b6d4','#ef4444'];

/* ─── 150 Companies ─── */
const COMPANIES = useMemoCompanies();
function useMemoCompanies(){
  const sectors = ['Utilities','Energy','Technology','Industrials','Materials','Consumer','Healthcare','Financials','Real Estate','Transport'];
  const prefixes = ['Apex','Nova','Terra','Solaris','Verdant','Quantum','Helios','Aqua','Zenith','Orion','Vortex','Nexus','Atlas','Cirrus','Ember','Flux','Geo','Ion','Kai','Lux'];
  const suffixes = ['Energy','Power','Tech','Green','Solutions','Systems','Corp','Holdings','Group','Industries','Labs','Dynamics','Ventures','Capital','Networks'];
  const companies = [];
  for(let i=0;i<150;i++){
    const s1 = sr(i*7+3), s2 = sr(i*11+5), s3 = sr(i*13+7);
    const name = prefixes[Math.floor(s1*prefixes.length)] + ' ' + suffixes[Math.floor(s2*suffixes.length)];
    const sector = sectors[Math.floor(sr(i*17+1)*sectors.length)];
    const mktCap = Math.round(500 + sr(i*19+2)*99500);
    const numCats = 1 + Math.floor(sr(i*23+4)*4);
    const catIds = [];
    for(let j=0;j<numCats;j++){
      const ci = Math.floor(sr(i*31+j*7)*CATEGORIES.length);
      if(!catIds.includes(CATEGORIES[ci].id)) catIds.push(CATEGORIES[ci].id);
    }
    const revBreakdown = {};
    let remPct = 100;
    catIds.forEach((cid,idx)=>{
      if(idx===catIds.length-1){ revBreakdown[cid]=remPct; }
      else { const pct=Math.round(5+sr(i*37+idx*11)*(remPct-5*( catIds.length-idx-1))); revBreakdown[cid]=Math.min(pct,remPct); remPct-=pct; }
    });
    const euAlign = Math.round(sr(i*41+3)*100);
    const cbiClass = ['Aligned','Partially Aligned','Not Aligned','Under Review'][Math.floor(sr(i*43+5)*4)];
    const ftseGreen = Math.round(sr(i*47+7)*100);
    const propScore = Math.round(20+sr(i*53+9)*80);
    const trl = 1+Math.floor(sr(i*59+11)*9);
    const greenRevPct = Math.round(catIds.reduce((sum,cid)=>sum+(revBreakdown[cid]||0),0) * (sr(i*61+1)*0.5+0.3));
    companies.push({ id:i+1, name:`${name} ${(i+1).toString().padStart(3,'0')}`, sector, mktCap, catIds, revBreakdown,
      euAlign, cbiClass, ftseGreen, propScore, trl, greenRevPct:Math.min(greenRevPct,98),
      country:['US','UK','DE','JP','CN','FR','KR','CA','AU','IN'][Math.floor(sr(i*67+3)*10)],
      employees:Math.round(100+sr(i*71+5)*49900),
    });
  }
  return companies;
}

/* ─── Category Timeline Data (2020-2035) ─── */
function genTimeline(catIdx){
  const years=[];
  for(let y=2020;y<=2035;y++){
    const base = CATEGORIES[catIdx].marketSize * 0.4;
    const growth = CATEGORIES[catIdx].growth/100;
    const val = Math.round(base * Math.pow(1+growth, y-2020) + sr(catIdx*100+y)*50);
    years.push({year:y, value:val});
  }
  return years;
}

/* ─── Shared Styles ─── */
const card = { background:T.surface, borderRadius:14, border:`1px solid ${T.border}`, padding:20, marginBottom:16 };
const badge = (bg,fg)=>({ display:'inline-block', padding:'3px 10px', borderRadius:8, fontSize:11, fontWeight:600, background:bg, color:fg||T.text, marginRight:6, marginBottom:4 });
const btn = (active)=>({ padding:'8px 18px', borderRadius:10, border:`1.5px solid ${active?T.navy:T.border}`, background:active?T.navy:'transparent',
  color:active?'#fff':T.text, cursor:'pointer', fontSize:13, fontWeight:600, fontFamily:T.font, transition:'all 0.2s' });
const select = { padding:'7px 12px', borderRadius:8, border:`1px solid ${T.border}`, fontSize:13, fontFamily:T.font, color:T.text, background:T.surface, cursor:'pointer' };
const th = { padding:'10px 12px', textAlign:'left', fontSize:11, fontWeight:700, color:T.textMut, textTransform:'uppercase', letterSpacing:0.5, borderBottom:`2px solid ${T.border}` };
const td = { padding:'9px 12px', fontSize:13, color:T.text, borderBottom:`1px solid ${T.border}` };
const kpi = (label,value,sub,color)=>(
  <div key={label} style={{...card,textAlign:'center',flex:1,minWidth:160}}>
    <div style={{fontSize:11,color:T.textMut,fontWeight:600,textTransform:'uppercase',letterSpacing:0.5,marginBottom:6}}>{label}</div>
    <div style={{fontSize:28,fontWeight:800,color:color||T.navy,fontFamily:T.mono}}>{value}</div>
    {sub && <div style={{fontSize:12,color:T.textSec,marginTop:4}}>{sub}</div>}
  </div>
);

const CustomTooltip = ({active,payload,label})=>{
  if(!active||!payload?.length) return null;
  return (<div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:8,padding:'8px 12px',fontSize:12}}>
    <div style={{fontWeight:700,marginBottom:4}}>{label}</div>
    {payload.map((p,i)=><div key={i} style={{color:p.color||T.text}}>{p.name}: {typeof p.value==='number'?p.value.toLocaleString():p.value}{p.unit||''}</div>)}
  </div>);
};

/* ─── Tab 1: Taxonomy Classifier ─── */
function TabClassifier(){
  const [selCo, setSelCo] = useState(0);
  const [searchQ, setSearchQ] = useState('');
  const [showWizard, setShowWizard] = useState(false);
  const [wizRevStreams, setWizRevStreams] = useState([{cat:CATEGORIES[0].id, pct:50},{cat:CATEGORIES[3].id, pct:30},{cat:CATEGORIES[7].id, pct:20}]);
  const [wizResult, setWizResult] = useState(null);

  const filtered = useMemo(()=> searchQ ? COMPANIES.filter(c=>c.name.toLowerCase().includes(searchQ.toLowerCase())) : COMPANIES, [searchQ]);
  const co = COMPANIES[selCo];

  const stackedData = useMemo(()=>{
    const cats = co.catIds;
    return [{name:co.name, ...Object.fromEntries(cats.map(cid=>[CAT_MAP[cid].name, co.revBreakdown[cid]||0]))}];
  },[selCo]);

  const radarData = useMemo(()=> TAXONOMY_NAMES.map((tn,i)=>{
    const vals = { taxonomy:tn };
    vals['EU Taxonomy'] = co.euAlign;
    vals['CBI Taxonomy'] = co.cbiClass==='Aligned'?90:co.cbiClass==='Partially Aligned'?55:co.cbiClass==='Under Review'?35:15;
    vals['FTSE Green Rev'] = co.ftseGreen;
    vals['Proprietary'] = co.propScore;
    return vals;
  }),[selCo]);

  const radarMetrics = useMemo(()=>[
    {name:'EU Taxonomy', val:co.euAlign}, {name:'CBI Score', val:co.cbiClass==='Aligned'?90:co.cbiClass==='Partially Aligned'?55:co.cbiClass==='Under Review'?35:15},
    {name:'FTSE Green', val:co.ftseGreen}, {name:'Proprietary', val:co.propScore},
    {name:'Tech Readiness', val:co.trl*11}, {name:'Green Rev %', val:co.greenRevPct}
  ],[selCo]);

  const disagreements = useMemo(()=>{
    const d=[];
    if(co.euAlign>60 && co.ftseGreen<30) d.push({type:'EU vs FTSE',desc:'EU Taxonomy aligned but low FTSE Green Revenue. Likely scope difference: EU includes capex plans, FTSE counts current revenue only.',severity:'high'});
    if(co.cbiClass==='Aligned' && co.euAlign<40) d.push({type:'CBI vs EU',desc:'CBI aligned but low EU Taxonomy score. CBI has broader green bond eligibility vs EU strict technical screening.',severity:'medium'});
    if(co.propScore>70 && co.ftseGreen<25) d.push({type:'Proprietary vs FTSE',desc:'High proprietary score but low FTSE Green Revenue. Proprietary model weights transition intent; FTSE is revenue-only.',severity:'medium'});
    if(co.euAlign<30 && co.propScore>65) d.push({type:'EU vs Proprietary',desc:'Low EU alignment but strong proprietary score. Company may operate in sectors not yet covered by EU Delegated Acts.',severity:'low'});
    if(d.length===0) d.push({type:'Consensus',desc:'All four taxonomies broadly agree on this company classification.',severity:'none'});
    return d;
  },[selCo]);

  const runWizard = useCallback(()=>{
    const totalPct = wizRevStreams.reduce((s,r)=>s+r.pct,0);
    const greenCats = ['clean_energy','energy_storage','green_hydrogen','nature_based','ev_transport'];
    const greenPct = wizRevStreams.filter(r=>greenCats.includes(r.cat)).reduce((s,r)=>s+r.pct,0);
    const eu = Math.round(greenPct * 0.85 + sr(777)*10);
    const cbi = greenPct>60?'Aligned':greenPct>30?'Partially Aligned':'Not Aligned';
    const ftse = Math.round(greenPct*0.9 + sr(888)*8);
    const prop = Math.round(greenPct*0.7 + 20 + sr(999)*10);
    setWizResult({eu:Math.min(eu,100),cbi,ftse:Math.min(ftse,100),prop:Math.min(prop,100),totalPct});
  },[wizRevStreams]);

  return (
    <div>
      <div style={{display:'flex',gap:16,flexWrap:'wrap',marginBottom:16}}>
        {kpi('Companies Classified','150','across 4 taxonomy systems')}
        {kpi('Avg EU Alignment',Math.round(COMPANIES.reduce((s,c)=>s+c.euAlign,0)/150)+'%','Delegated Act 2024',T.sage)}
        {kpi('Avg FTSE Green Rev',Math.round(COMPANIES.reduce((s,c)=>s+c.ftseGreen,0)/150)+'%','revenue-weighted',T.gold)}
        {kpi('Taxonomy Conflicts',COMPANIES.filter(c=>Math.abs(c.euAlign-c.ftseGreen)>40).length,'cross-taxonomy disagreements',T.red)}
      </div>

      <div style={{display:'flex',gap:16,marginBottom:16,alignItems:'center',flexWrap:'wrap'}}>
        <input value={searchQ} onChange={e=>setSearchQ(e.target.value)} placeholder="Search 150 companies..." style={{...select,flex:1,minWidth:200}} />
        <button style={btn(showWizard)} onClick={()=>setShowWizard(!showWizard)}>{showWizard?'Close Wizard':'\u2795 Classify New Company'}</button>
      </div>

      {showWizard && (
        <div style={{...card,background:T.surfaceH,border:`2px solid ${T.gold}`}}>
          <div style={{fontSize:15,fontWeight:700,color:T.navy,marginBottom:12}}>Classification Wizard</div>
          <div style={{fontSize:12,color:T.textSec,marginBottom:12}}>Define revenue streams to auto-classify against all 4 taxonomies</div>
          {wizRevStreams.map((rs,i)=>(
            <div key={i} style={{display:'flex',gap:8,alignItems:'center',marginBottom:8}}>
              <select value={rs.cat} onChange={e=>{const n=[...wizRevStreams];n[i].cat=e.target.value;setWizRevStreams(n);}} style={select}>
                {CATEGORIES.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <input type="number" value={rs.pct} min={0} max={100} onChange={e=>{const n=[...wizRevStreams];n[i].pct=parseInt(e.target.value)||0;setWizRevStreams(n);}} style={{...select,width:70}} />
              <span style={{fontSize:12,color:T.textMut}}>%</span>
              {wizRevStreams.length>1 && <button onClick={()=>setWizRevStreams(wizRevStreams.filter((_,j)=>j!==i))} style={{...btn(false),padding:'4px 10px',color:T.red,borderColor:T.red}}>X</button>}
            </div>
          ))}
          <div style={{display:'flex',gap:8,marginTop:8}}>
            <button onClick={()=>setWizRevStreams([...wizRevStreams,{cat:CATEGORIES[0].id,pct:10}])} style={btn(false)}>+ Add Stream</button>
            <button onClick={runWizard} style={btn(true)}>Run Classification</button>
          </div>
          {wizResult && (
            <div style={{marginTop:16,padding:16,background:T.surface,borderRadius:10,border:`1px solid ${T.border}`}}>
              <div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:8}}>Classification Results (Total: {wizResult.totalPct}% allocated)</div>
              <div style={{display:'flex',gap:16,flexWrap:'wrap'}}>
                <div style={badge(T.sage+'20',T.sage)}>EU Taxonomy: {wizResult.eu}%</div>
                <div style={badge(T.navyL+'20',T.navyL)}>CBI: {wizResult.cbi}</div>
                <div style={badge(T.gold+'20',T.gold)}>FTSE Green: {wizResult.ftse}%</div>
                <div style={badge(T.navy+'20',T.navy)}>Proprietary: {wizResult.prop}/100</div>
              </div>
            </div>
          )}
        </div>
      )}

      <div style={{display:'flex',gap:16,flexWrap:'wrap'}}>
        <div style={{...card,flex:'0 0 280px',maxHeight:500,overflowY:'auto'}}>
          <div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:8}}>Companies ({filtered.length})</div>
          {filtered.slice(0,50).map((c,i)=>(
            <div key={c.id} onClick={()=>setSelCo(c.id-1)} style={{padding:'8px 10px',borderRadius:8,cursor:'pointer',marginBottom:2,
              background:selCo===c.id-1?T.navy+'12':'transparent',borderLeft:selCo===c.id-1?`3px solid ${T.navy}`:'3px solid transparent',transition:'all 0.15s'}}>
              <div style={{fontSize:12,fontWeight:600,color:T.text}}>{c.name}</div>
              <div style={{fontSize:11,color:T.textMut}}>{c.sector} | EU {c.euAlign}% | Green {c.greenRevPct}%</div>
            </div>
          ))}
          {filtered.length>50 && <div style={{fontSize:11,color:T.textMut,padding:8}}>Showing 50 of {filtered.length}. Refine search.</div>}
        </div>

        <div style={{flex:1,minWidth:400}}>
          <div style={card}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
              <div>
                <div style={{fontSize:17,fontWeight:800,color:T.navy}}>{co.name}</div>
                <div style={{fontSize:12,color:T.textSec}}>{co.sector} | {co.country} | {co.employees.toLocaleString()} employees | Mkt Cap ${co.mktCap}M</div>
              </div>
              <div style={{display:'flex',gap:6}}>
                <span style={badge(co.euAlign>60?T.green+'18':co.euAlign>30?T.amber+'18':T.red+'18', co.euAlign>60?T.green:co.euAlign>30?T.amber:T.red)}>EU {co.euAlign}%</span>
                <span style={badge(T.navyL+'15',T.navyL)}>{co.cbiClass}</span>
                <span style={badge(T.gold+'15',T.gold)}>FTSE {co.ftseGreen}%</span>
                <span style={badge(T.sage+'15',T.sage)}>Score {co.propScore}</span>
              </div>
            </div>

            <div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:8}}>Revenue by Climate Solution Category</div>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={stackedData} layout="vertical" margin={{left:10,right:20}}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis type="number" domain={[0,100]} tick={{fontSize:11}} />
                <YAxis type="category" dataKey="name" hide />
                <Tooltip content={<CustomTooltip />} />
                {co.catIds.map((cid,i)=><Bar key={cid} dataKey={CAT_MAP[cid].name} stackId="a" fill={CAT_MAP[cid].color} radius={i===co.catIds.length-1?[0,6,6,0]:[0,0,0,0]} />)}
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div style={card}>
            <div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:8}}>Multi-Taxonomy Radar Comparison</div>
            <ResponsiveContainer width="100%" height={280}>
              <RadarChart data={radarMetrics}>
                <PolarGrid stroke={T.border} />
                <PolarAngleAxis dataKey="name" tick={{fontSize:11,fill:T.textSec}} />
                <PolarRadiusAxis angle={30} domain={[0,100]} tick={{fontSize:10}} />
                <Radar name={co.name} dataKey="val" stroke={T.navy} fill={T.navy} fillOpacity={0.2} strokeWidth={2} />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          <div style={card}>
            <div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:8}}>Taxonomy Disagreement Flags</div>
            {disagreements.map((d,i)=>(
              <div key={i} style={{padding:10,borderRadius:8,marginBottom:8,background:d.severity==='high'?T.red+'08':d.severity==='medium'?T.amber+'08':d.severity==='low'?T.gold+'08':T.green+'08',
                border:`1px solid ${d.severity==='high'?T.red+'30':d.severity==='medium'?T.amber+'30':d.severity==='low'?T.gold+'30':T.green+'30'}`}}>
                <div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}>
                  <span style={{fontSize:12,fontWeight:700,color:T.text}}>{d.type}</span>
                  <span style={badge(d.severity==='high'?T.red+'20':d.severity==='medium'?T.amber+'20':d.severity==='none'?T.green+'20':T.gold+'20',
                    d.severity==='high'?T.red:d.severity==='medium'?T.amber:d.severity==='none'?T.green:T.gold)}>{d.severity==='none'?'Aligned':d.severity}</span>
                </div>
                <div style={{fontSize:12,color:T.textSec}}>{d.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Tab 2: Solution Category Explorer ─── */
function TabCategoryExplorer(){
  const [selCat, setSelCat] = useState(null);
  const [sortBy, setSortBy] = useState('marketSize');

  const catStats = useMemo(()=> CATEGORIES.map((cat,ci)=>{
    const cos = COMPANIES.filter(c=>c.catIds.includes(cat.id));
    const avgGreen = cos.length? Math.round(cos.reduce((s,c)=>s+c.greenRevPct,0)/cos.length):0;
    const trlDist = Array(9).fill(0);
    cos.forEach(c=> trlDist[Math.min(c.trl-1,8)]++);
    return {...cat, companyCount:cos.length, avgGreen, trlDist, timeline:genTimeline(ci)};
  }),[]);

  const sorted = useMemo(()=>[...catStats].sort((a,b)=> sortBy==='growth'?b.growth-a.growth : sortBy==='companyCount'?b.companyCount-a.companyCount : b.marketSize-a.marketSize),[sortBy]);

  const comparisonData = useMemo(()=> catStats.map(c=>({name:c.name.length>15?c.name.slice(0,14)+'...':c.name, 'Market Size ($B)':c.marketSize, 'Growth Rate (%)':c.growth, Companies:c.companyCount})),[]);

  const detail = selCat!==null ? catStats[selCat] : null;

  return (
    <div>
      <div style={{display:'flex',gap:16,flexWrap:'wrap',marginBottom:16}}>
        {kpi('Total Market','$'+(catStats.reduce((s,c)=>s+c.marketSize,0)/1000).toFixed(1)+'T','across 12 categories')}
        {kpi('Avg Growth',catStats.reduce((s,c)=>s+c.growth,0)/12|0+'%','CAGR 2024-2035',T.sage)}
        {kpi('Fastest Growing',catStats.reduce((a,b)=>a.growth>b.growth?a:b).name,'',T.gold)}
        {kpi('Investment Required','$'+(catStats.reduce((s,c)=>s+c.investReq,0)/1000).toFixed(1)+'T','cumulative to 2035',T.navyL)}
      </div>

      <div style={{display:'flex',gap:8,marginBottom:16,alignItems:'center'}}>
        <span style={{fontSize:12,color:T.textMut,fontWeight:600}}>Sort by:</span>
        {['marketSize','growth','companyCount'].map(k=>(
          <button key={k} style={btn(sortBy===k)} onClick={()=>setSortBy(k)}>{k==='marketSize'?'Market Size':k==='growth'?'Growth Rate':'Company Count'}</button>
        ))}
      </div>

      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))',gap:12,marginBottom:20}}>
        {sorted.map((cat,i)=>(
          <div key={cat.id} onClick={()=>setSelCat(CATEGORIES.findIndex(c=>c.id===cat.id))} style={{...card,cursor:'pointer',borderColor:selCat===CATEGORIES.findIndex(c=>c.id===cat.id)?cat.color:T.border,
            borderWidth:selCat===CATEGORIES.findIndex(c=>c.id===cat.id)?2:1, transition:'all 0.2s',marginBottom:0}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
              <span style={{fontSize:22}}>{cat.icon}</span>
              <span style={badge(cat.color+'18',cat.color)}>{cat.growth}% CAGR</span>
            </div>
            <div style={{fontSize:14,fontWeight:700,color:T.navy,marginBottom:4}}>{cat.name}</div>
            <div style={{fontSize:12,color:T.textSec,marginBottom:8}}>{cat.companyCount} companies | Avg green rev {cat.avgGreen}%</div>
            <div style={{display:'flex',justifyContent:'space-between',fontSize:11,color:T.textMut}}>
              <span>Market: ${cat.marketSize}B</span>
              <span>Invest: ${cat.investReq}B</span>
            </div>
            <div style={{marginTop:8,height:4,borderRadius:2,background:T.border}}>
              <div style={{height:4,borderRadius:2,background:cat.color,width:Math.min(cat.growth*3,100)+'%',transition:'width 0.3s'}} />
            </div>
          </div>
        ))}
      </div>

      <div style={card}>
        <div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:8}}>Category Comparison</div>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={comparisonData} margin={{left:10,bottom:60}}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="name" tick={{fontSize:10,angle:-35,textAnchor:'end'}} interval={0} />
            <YAxis tick={{fontSize:11}} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{fontSize:11}} />
            <Bar dataKey="Market Size ($B)" fill={T.navy} radius={[4,4,0,0]} />
            <Bar dataKey="Growth Rate (%)" fill={T.sage} radius={[4,4,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {detail && (
        <div style={{...card,border:`2px solid ${detail.color}`}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
            <div>
              <div style={{fontSize:18,fontWeight:800,color:T.navy}}>{detail.icon} {detail.name}</div>
              <div style={{fontSize:12,color:T.textSec}}>Market Size: ${detail.marketSize}B | Growth: {detail.growth}% | {detail.companyCount} companies</div>
            </div>
            <button onClick={()=>setSelCat(null)} style={btn(false)}>Close</button>
          </div>

          <div style={{display:'flex',gap:16,flexWrap:'wrap',marginBottom:16}}>
            <div style={{flex:1,minWidth:200}}>
              <div style={{fontSize:12,fontWeight:700,color:T.textSec,marginBottom:8}}>Sub-Categories</div>
              {detail.subCats.map(sc=><div key={sc} style={{...badge(detail.color+'15',detail.color),marginBottom:6}}>{sc}</div>)}
            </div>
            <div style={{flex:1,minWidth:200}}>
              <div style={{fontSize:12,fontWeight:700,color:T.textSec,marginBottom:8}}>Key Technologies</div>
              {detail.keyTech.map(kt=><div key={kt} style={{...badge(T.navy+'12',T.navy),marginBottom:6}}>{kt}</div>)}
            </div>
            <div style={{flex:1,minWidth:200}}>
              <div style={{fontSize:12,fontWeight:700,color:T.textSec,marginBottom:8}}>Technology Readiness Distribution</div>
              {detail.trlDist.map((count,i)=> count>0 && (
                <div key={i} style={{display:'flex',alignItems:'center',gap:6,marginBottom:3}}>
                  <span style={{fontSize:11,color:T.textMut,width:40}}>TRL {i+1}</span>
                  <div style={{flex:1,height:12,borderRadius:4,background:T.border}}>
                    <div style={{height:12,borderRadius:4,background:detail.color,width:`${(count/detail.companyCount)*100}%`}} />
                  </div>
                  <span style={{fontSize:11,color:T.textSec,width:24,textAlign:'right'}}>{count}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{fontSize:12,fontWeight:700,color:T.textSec,marginBottom:8}}>Market Evolution (2020-2035)</div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={detail.timeline}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="year" tick={{fontSize:11}} />
              <YAxis tick={{fontSize:11}} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="value" stroke={detail.color} fill={detail.color} fillOpacity={0.15} strokeWidth={2} name="Market Size ($B)" />
            </AreaChart>
          </ResponsiveContainer>

          <div style={{fontSize:12,fontWeight:700,color:T.textSec,marginBottom:8,marginTop:12}}>Market Leaders</div>
          <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
            {COMPANIES.filter(c=>c.catIds.includes(detail.id)).sort((a,b)=>b.greenRevPct-a.greenRevPct).slice(0,8).map(c=>(
              <div key={c.id} style={{...badge(T.surface,T.text),border:`1px solid ${T.border}`,padding:'4px 10px'}}>
                {c.name} <span style={{color:T.sage,fontWeight:700}}>{c.greenRevPct}%</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Tab 3: Taxonomy Alignment Matrix ─── */
function TabAlignmentMatrix(){
  const [filterCat, setFilterCat] = useState('all');
  const [filterThreshold, setFilterThreshold] = useState(0);
  const [filterTax, setFilterTax] = useState('eu');
  const [selCell, setSelCell] = useState(null);
  const [showDisagreement, setShowDisagreement] = useState(false);

  const filteredCos = useMemo(()=>{
    let cos = COMPANIES;
    if(filterCat!=='all') cos = cos.filter(c=>c.catIds.includes(filterCat));
    if(filterThreshold>0){
      cos = cos.filter(c=>{
        if(filterTax==='eu') return c.euAlign>=filterThreshold;
        if(filterTax==='ftse') return c.ftseGreen>=filterThreshold;
        if(filterTax==='prop') return c.propScore>=filterThreshold;
        return c.euAlign>=filterThreshold;
      });
    }
    return cos;
  },[filterCat,filterThreshold,filterTax]);

  const disagreementCos = useMemo(()=> COMPANIES.filter(c=>{
    const scores = [c.euAlign, c.cbiClass==='Aligned'?85:c.cbiClass==='Partially Aligned'?50:c.cbiClass==='Under Review'?30:10, c.ftseGreen, c.propScore];
    const max = Math.max(...scores), min = Math.min(...scores);
    return max-min > 45;
  }).sort((a,b)=>{
    const da = [a.euAlign, a.ftseGreen, a.propScore];
    const db = [b.euAlign, b.ftseGreen, b.propScore];
    return (Math.max(...db)-Math.min(...db)) - (Math.max(...da)-Math.min(...da));
  }),[]);

  const versionUpdates = [
    {date:'2024-06',taxonomy:'EU Taxonomy',update:'Delegated Act amendment: added nuclear and gas transition activities with specific criteria'},
    {date:'2024-03',taxonomy:'CBI Taxonomy',update:'Version 4.0: updated cement, steel, and aluminum criteria; new shipping pathway'},
    {date:'2024-01',taxonomy:'FTSE Green Rev',update:'Classification 3.0: expanded to 10 tiers, added blue hydrogen distinction'},
    {date:'2023-11',taxonomy:'EU Taxonomy',update:'Environmental Delegated Act: water, circular economy, pollution, biodiversity objectives added'},
    {date:'2023-09',taxonomy:'Proprietary',update:'Model v2.5: integrated forward-looking capex alignment and transition pathway scoring'},
    {date:'2023-06',taxonomy:'CBI Taxonomy',update:'Added hydrogen criteria and updated forestry/land use pathways'},
  ];

  const heatColor = (val)=>{
    if(val>=80) return '#16a34a25';
    if(val>=60) return '#16a34a15';
    if(val>=40) return '#d9770615';
    if(val>=20) return '#d9770625';
    return '#dc262615';
  };

  const cbiNum = (c)=> c.cbiClass==='Aligned'?85:c.cbiClass==='Partially Aligned'?50:c.cbiClass==='Under Review'?30:10;

  return (
    <div>
      <div style={{display:'flex',gap:16,flexWrap:'wrap',marginBottom:16}}>
        {kpi('Matrix Size',`${filteredCos.length} x 4`,'companies x taxonomies')}
        {kpi('High Disagreement',disagreementCos.length,'companies with >45pt spread',T.red)}
        {kpi('Full Consensus',COMPANIES.filter(c=>{const s=[c.euAlign,cbiNum(c),c.ftseGreen,c.propScore];return Math.max(...s)-Math.min(...s)<20;}).length,'<20pt spread across all',T.green)}
        {kpi('Latest Update','Jun 2024','EU Delegated Act amendment',T.navyL)}
      </div>

      <div style={{display:'flex',gap:8,marginBottom:16,flexWrap:'wrap',alignItems:'center'}}>
        <select value={filterCat} onChange={e=>setFilterCat(e.target.value)} style={select}>
          <option value="all">All Categories</option>
          {CATEGORIES.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select value={filterTax} onChange={e=>setFilterTax(e.target.value)} style={select}>
          <option value="eu">EU Taxonomy</option>
          <option value="ftse">FTSE Green Rev</option>
          <option value="prop">Proprietary Score</option>
        </select>
        <span style={{fontSize:12,color:T.textMut}}>Min threshold:</span>
        <input type="range" min={0} max={100} value={filterThreshold} onChange={e=>setFilterThreshold(+e.target.value)} style={{width:120}} />
        <span style={{fontSize:12,color:T.text,fontFamily:T.mono}}>{filterThreshold}%</span>
        <button style={btn(showDisagreement)} onClick={()=>setShowDisagreement(!showDisagreement)}>
          {showDisagreement?'Show Matrix':'Show Disagreement Analysis'}
        </button>
      </div>

      {!showDisagreement ? (
        <div style={{...card,overflowX:'auto'}}>
          <div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:12}}>Alignment Heatmap ({filteredCos.length} companies)</div>
          <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
            <thead>
              <tr>
                <th style={{...th,minWidth:180}}>Company</th>
                <th style={{...th,width:90}}>Sector</th>
                <th style={{...th,width:100}}>EU Taxonomy</th>
                <th style={{...th,width:100}}>CBI Taxonomy</th>
                <th style={{...th,width:100}}>FTSE Green Rev</th>
                <th style={{...th,width:100}}>Proprietary</th>
                <th style={{...th,width:80}}>Spread</th>
              </tr>
            </thead>
            <tbody>
              {filteredCos.slice(0,60).map(c=>{
                const scores = [c.euAlign, cbiNum(c), c.ftseGreen, c.propScore];
                const spread = Math.max(...scores)-Math.min(...scores);
                return (
                  <tr key={c.id} onClick={()=>setSelCell(selCell===c.id?null:c.id)} style={{cursor:'pointer',background:selCell===c.id?T.surfaceH:'transparent'}}>
                    <td style={td}><span style={{fontWeight:600}}>{c.name}</span></td>
                    <td style={td}>{c.sector}</td>
                    <td style={{...td,background:heatColor(c.euAlign),textAlign:'center',fontWeight:600,fontFamily:T.mono}}>{c.euAlign}%</td>
                    <td style={{...td,background:heatColor(cbiNum(c)),textAlign:'center'}}>
                      <span style={badge(cbiNum(c)>60?T.green+'15':cbiNum(c)>35?T.amber+'15':T.red+'15', cbiNum(c)>60?T.green:cbiNum(c)>35?T.amber:T.red)}>{c.cbiClass}</span>
                    </td>
                    <td style={{...td,background:heatColor(c.ftseGreen),textAlign:'center',fontWeight:600,fontFamily:T.mono}}>{c.ftseGreen}%</td>
                    <td style={{...td,background:heatColor(c.propScore),textAlign:'center',fontWeight:600,fontFamily:T.mono}}>{c.propScore}/100</td>
                    <td style={{...td,textAlign:'center',fontWeight:700,color:spread>45?T.red:spread>25?T.amber:T.green,fontFamily:T.mono}}>{spread}pt</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filteredCos.length>60 && <div style={{fontSize:11,color:T.textMut,padding:8}}>Showing 60 of {filteredCos.length}. Apply filters to narrow.</div>}

          {selCell && (()=>{
            const c = COMPANIES.find(co=>co.id===selCell);
            if(!c) return null;
            return (
              <div style={{marginTop:16,padding:16,background:T.surfaceH,borderRadius:10,border:`1px solid ${T.border}`}}>
                <div style={{fontSize:14,fontWeight:700,color:T.navy,marginBottom:8}}>Detailed Assessment: {c.name}</div>
                <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))',gap:12}}>
                  <div style={{padding:12,background:T.surface,borderRadius:8,border:`1px solid ${T.border}`}}>
                    <div style={{fontSize:11,fontWeight:700,color:T.textMut,marginBottom:4}}>EU TAXONOMY</div>
                    <div style={{fontSize:22,fontWeight:800,color:c.euAlign>60?T.green:c.euAlign>30?T.amber:T.red,fontFamily:T.mono}}>{c.euAlign}%</div>
                    <div style={{fontSize:11,color:T.textSec,marginTop:4}}>Delegated Act 2024 | {c.euAlign>60?'Substantially contributing':'Partial/no contribution'}</div>
                  </div>
                  <div style={{padding:12,background:T.surface,borderRadius:8,border:`1px solid ${T.border}`}}>
                    <div style={{fontSize:11,fontWeight:700,color:T.textMut,marginBottom:4}}>CBI TAXONOMY</div>
                    <div style={{fontSize:16,fontWeight:800,color:T.navyL}}>{c.cbiClass}</div>
                    <div style={{fontSize:11,color:T.textSec,marginTop:4}}>Climate Bonds Standard v4.0 | {c.cbiClass==='Aligned'?'Eligible for green bond certification':'Review required'}</div>
                  </div>
                  <div style={{padding:12,background:T.surface,borderRadius:8,border:`1px solid ${T.border}`}}>
                    <div style={{fontSize:11,fontWeight:700,color:T.textMut,marginBottom:4}}>FTSE GREEN REVENUE</div>
                    <div style={{fontSize:22,fontWeight:800,color:c.ftseGreen>60?T.green:c.ftseGreen>30?T.amber:T.red,fontFamily:T.mono}}>{c.ftseGreen}%</div>
                    <div style={{fontSize:11,color:T.textSec,marginTop:4}}>Classification 3.0 | Tier {c.ftseGreen>80?1:c.ftseGreen>60?2:c.ftseGreen>40?3:c.ftseGreen>20?4:5}</div>
                  </div>
                  <div style={{padding:12,background:T.surface,borderRadius:8,border:`1px solid ${T.border}`}}>
                    <div style={{fontSize:11,fontWeight:700,color:T.textMut,marginBottom:4}}>PROPRIETARY SCORE</div>
                    <div style={{fontSize:22,fontWeight:800,color:c.propScore>70?T.green:c.propScore>40?T.amber:T.red,fontFamily:T.mono}}>{c.propScore}/100</div>
                    <div style={{fontSize:11,color:T.textSec,marginTop:4}}>Model v2.5 | Weights: revenue 40%, capex 30%, transition 30%</div>
                  </div>
                </div>
                <div style={{marginTop:12,fontSize:12,color:T.textSec}}>
                  <strong>Categories:</strong> {c.catIds.map(cid=>CAT_MAP[cid].name).join(', ')} | <strong>TRL:</strong> {c.trl} | <strong>Green Revenue:</strong> {c.greenRevPct}%
                </div>
              </div>
            );
          })()}
        </div>
      ) : (
        <div style={card}>
          <div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:12}}>Taxonomy Disagreement Analysis ({disagreementCos.length} companies with &gt;45pt spread)</div>
          <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
            <thead>
              <tr>
                <th style={th}>Company</th>
                <th style={th}>EU</th>
                <th style={th}>CBI</th>
                <th style={th}>FTSE</th>
                <th style={th}>Prop</th>
                <th style={th}>Spread</th>
                <th style={{...th,minWidth:200}}>Root Cause</th>
              </tr>
            </thead>
            <tbody>
              {disagreementCos.slice(0,30).map(c=>{
                const scores = [c.euAlign, cbiNum(c), c.ftseGreen, c.propScore];
                const spread = Math.max(...scores)-Math.min(...scores);
                const maxIdx = scores.indexOf(Math.max(...scores));
                const minIdx = scores.indexOf(Math.min(...scores));
                const taxNames = ['EU','CBI','FTSE','Proprietary'];
                let cause = 'Scope difference';
                if(maxIdx===0||minIdx===0) cause='EU Delegated Act coverage gaps';
                else if(maxIdx===3||minIdx===3) cause='Proprietary model weights transition intent differently';
                else if(maxIdx===2||minIdx===2) cause='FTSE revenue-only vs forward-looking assessments';
                else cause='Threshold calibration differences across taxonomies';
                return (
                  <tr key={c.id}>
                    <td style={{...td,fontWeight:600}}>{c.name}</td>
                    <td style={{...td,textAlign:'center',fontFamily:T.mono}}>{c.euAlign}%</td>
                    <td style={td}>{c.cbiClass}</td>
                    <td style={{...td,textAlign:'center',fontFamily:T.mono}}>{c.ftseGreen}%</td>
                    <td style={{...td,textAlign:'center',fontFamily:T.mono}}>{c.propScore}</td>
                    <td style={{...td,textAlign:'center',fontWeight:700,color:T.red,fontFamily:T.mono}}>{spread}pt</td>
                    <td style={{...td,fontSize:11,color:T.textSec}}>{taxNames[maxIdx]} highest ({scores[maxIdx]}), {taxNames[minIdx]} lowest ({scores[minIdx]}). {cause}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div style={card}>
        <div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:12}}>Taxonomy Version Tracker</div>
        <div style={{position:'relative',paddingLeft:20}}>
          {versionUpdates.map((v,i)=>(
            <div key={i} style={{display:'flex',gap:12,marginBottom:16,position:'relative'}}>
              <div style={{position:'absolute',left:-20,top:2,width:10,height:10,borderRadius:'50%',background:v.taxonomy.includes('EU')?T.navy:v.taxonomy.includes('CBI')?T.sage:v.taxonomy.includes('FTSE')?T.gold:T.navyL,
                border:`2px solid ${T.surface}`,zIndex:1}} />
              {i<versionUpdates.length-1 && <div style={{position:'absolute',left:-16,top:14,width:2,height:'calc(100% + 4px)',background:T.border}} />}
              <div>
                <div style={{display:'flex',gap:8,alignItems:'center',marginBottom:4}}>
                  <span style={{fontSize:12,fontWeight:700,color:T.navy,fontFamily:T.mono}}>{v.date}</span>
                  <span style={badge(v.taxonomy.includes('EU')?T.navy+'15':v.taxonomy.includes('CBI')?T.sage+'15':v.taxonomy.includes('FTSE')?T.gold+'15':T.navyL+'15',
                    v.taxonomy.includes('EU')?T.navy:v.taxonomy.includes('CBI')?T.sage:v.taxonomy.includes('FTSE')?T.gold:T.navyL)}>{v.taxonomy}</span>
                </div>
                <div style={{fontSize:12,color:T.textSec}}>{v.update}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Tab 4: Portfolio Solution Screening ─── */
function TabPortfolioScreening(){
  const [screenType, setScreenType] = useState('pure_play');
  const [customMinGreen, setCustomMinGreen] = useState(30);
  const [customCat, setCustomCat] = useState('all');
  const [customTax, setCustomTax] = useState('eu');
  const [customMinAlign, setCustomMinAlign] = useState(50);
  const [showBuilder, setShowBuilder] = useState(false);
  const [builderWeights, setBuilderWeights] = useState({greenRev:40,euAlign:25,propScore:20,trl:15});
  const [exportReady, setExportReady] = useState(false);

  const screens = {
    pure_play:{name:'Pure-Play Climate Solutions',desc:'Companies with >75% green revenue',filter:c=>c.greenRevPct>75},
    transition:{name:'Transition Leaders',desc:'Companies with 30-75% green revenue',filter:c=>c.greenRevPct>=30 && c.greenRevPct<=75},
    laggard:{name:'Climate Laggards',desc:'Companies with <10% green revenue',filter:c=>c.greenRevPct<10},
    custom:{name:'Custom Screen',desc:'User-defined criteria',filter:c=>{
      let pass = c.greenRevPct>=customMinGreen;
      if(customCat!=='all') pass = pass && c.catIds.includes(customCat);
      if(customTax==='eu') pass = pass && c.euAlign>=customMinAlign;
      if(customTax==='ftse') pass = pass && c.ftseGreen>=customMinAlign;
      if(customTax==='prop') pass = pass && c.propScore>=customMinAlign;
      return pass;
    }},
  };

  const screened = useMemo(()=> COMPANIES.filter(screens[screenType].filter).sort((a,b)=>b.greenRevPct-a.greenRevPct),[screenType,customMinGreen,customCat,customTax,customMinAlign]);

  const sectorBreakdown = useMemo(()=>{
    const map={};
    screened.forEach(c=>{ map[c.sector]=(map[c.sector]||0)+1; });
    return Object.entries(map).map(([name,value])=>({name,value})).sort((a,b)=>b.value-a.value);
  },[screened]);

  const catBreakdown = useMemo(()=>{
    const map={};
    screened.forEach(c=>c.catIds.forEach(cid=>{ map[cid]=(map[cid]||0)+1; }));
    return Object.entries(map).map(([id,value])=>({name:CAT_MAP[id]?.name||id,value,color:CAT_MAP[id]?.color||T.navy})).sort((a,b)=>b.value-a.value);
  },[screened]);

  const benchmarks = useMemo(()=>{
    const all = COMPANIES;
    const avgGreen = arr=>arr.length?Math.round(arr.reduce((s,c)=>s+c.greenRevPct,0)/arr.length):0;
    const avgEU = arr=>arr.length?Math.round(arr.reduce((s,c)=>s+c.euAlign,0)/arr.length):0;
    const avgProp = arr=>arr.length?Math.round(arr.reduce((s,c)=>s+c.propScore,0)/arr.length):0;
    return [
      {metric:'Green Revenue %', screened:avgGreen(screened), universe:avgGreen(all), diff:avgGreen(screened)-avgGreen(all)},
      {metric:'EU Taxonomy Alignment', screened:avgEU(screened), universe:avgEU(all), diff:avgEU(screened)-avgEU(all)},
      {metric:'Proprietary Score', screened:avgProp(screened), universe:avgProp(all), diff:avgProp(screened)-avgProp(all)},
      {metric:'Company Count', screened:screened.length, universe:all.length, diff:screened.length-all.length},
      {metric:'Avg Mkt Cap ($M)', screened:screened.length?Math.round(screened.reduce((s,c)=>s+c.mktCap,0)/screened.length):0, universe:Math.round(all.reduce((s,c)=>s+c.mktCap,0)/all.length), diff:0},
    ];
  },[screened]);

  const builderScored = useMemo(()=>{
    if(!showBuilder) return [];
    const w = builderWeights;
    const total = w.greenRev+w.euAlign+w.propScore+w.trl;
    return screened.map(c=>({
      ...c,
      compositeScore: Math.round(
        (c.greenRevPct*(w.greenRev/total)) + (c.euAlign*(w.euAlign/total)) + (c.propScore*(w.propScore/total)) + ((c.trl/9*100)*(w.trl/total))
      ),
    })).sort((a,b)=>b.compositeScore-a.compositeScore);
  },[screened,showBuilder,builderWeights]);

  const handleExport = useCallback(()=>{
    const headers = ['Name','Sector','Country','Green Rev %','EU Alignment','CBI Class','FTSE Green','Prop Score','TRL','Mkt Cap ($M)','Categories'];
    const rows = screened.map(c=>[c.name,c.sector,c.country,c.greenRevPct,c.euAlign,c.cbiClass,c.ftseGreen,c.propScore,c.trl,c.mktCap,c.catIds.map(id=>CAT_MAP[id]?.name).join(';')]);
    const csv = [headers.join(','), ...rows.map(r=>r.join(','))].join('\n');
    const blob = new Blob([csv],{type:'text/csv'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href=url; a.download=`climate_solution_screen_${screenType}_${Date.now()}.csv`; a.click();
    URL.revokeObjectURL(url);
    setExportReady(true);
    setTimeout(()=>setExportReady(false),3000);
  },[screened,screenType]);

  return (
    <div>
      <div style={{display:'flex',gap:16,flexWrap:'wrap',marginBottom:16}}>
        {kpi('Screened Companies',screened.length,`of 150 (${Math.round(screened.length/150*100)}%)`)}
        {kpi('Avg Green Revenue',screened.length?Math.round(screened.reduce((s,c)=>s+c.greenRevPct,0)/screened.length):0,'%',T.sage)}
        {kpi('Avg EU Alignment',screened.length?Math.round(screened.reduce((s,c)=>s+c.euAlign,0)/screened.length):0,'%',T.navyL)}
        {kpi('Sectors Covered',new Set(screened.map(c=>c.sector)).size,'of 10',T.gold)}
      </div>

      <div style={{display:'flex',gap:8,marginBottom:16,flexWrap:'wrap',alignItems:'center'}}>
        <span style={{fontSize:12,fontWeight:600,color:T.textMut}}>Pre-built screens:</span>
        {Object.entries(screens).map(([k,v])=>(
          <button key={k} style={btn(screenType===k)} onClick={()=>setScreenType(k)}>{v.name}</button>
        ))}
      </div>

      {screenType==='custom' && (
        <div style={{...card,background:T.surfaceH}}>
          <div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:12}}>Custom Screen Configuration</div>
          <div style={{display:'flex',gap:16,flexWrap:'wrap',alignItems:'center'}}>
            <div>
              <div style={{fontSize:11,color:T.textMut,marginBottom:4}}>Min Green Revenue %</div>
              <input type="range" min={0} max={100} value={customMinGreen} onChange={e=>setCustomMinGreen(+e.target.value)} style={{width:120}} />
              <span style={{fontSize:12,fontFamily:T.mono,marginLeft:8}}>{customMinGreen}%</span>
            </div>
            <div>
              <div style={{fontSize:11,color:T.textMut,marginBottom:4}}>Climate Solution Category</div>
              <select value={customCat} onChange={e=>setCustomCat(e.target.value)} style={select}>
                <option value="all">All Categories</option>
                {CATEGORIES.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <div style={{fontSize:11,color:T.textMut,marginBottom:4}}>Taxonomy</div>
              <select value={customTax} onChange={e=>setCustomTax(e.target.value)} style={select}>
                <option value="eu">EU Taxonomy</option>
                <option value="ftse">FTSE Green Rev</option>
                <option value="prop">Proprietary Score</option>
              </select>
            </div>
            <div>
              <div style={{fontSize:11,color:T.textMut,marginBottom:4}}>Min Alignment</div>
              <input type="range" min={0} max={100} value={customMinAlign} onChange={e=>setCustomMinAlign(+e.target.value)} style={{width:120}} />
              <span style={{fontSize:12,fontFamily:T.mono,marginLeft:8}}>{customMinAlign}%</span>
            </div>
          </div>
        </div>
      )}

      <div style={{display:'flex',gap:16,flexWrap:'wrap',marginBottom:16}}>
        <div style={{...card,flex:1,minWidth:300}}>
          <div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:8}}>Sector Distribution</div>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={sectorBreakdown} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({name,percent})=>`${name} ${(percent*100).toFixed(0)}%`} labelLine={false} style={{fontSize:10}}>
                {sectorBreakdown.map((_,i)=><Cell key={i} fill={PIE_COLORS[i%PIE_COLORS.length]} />)}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div style={{...card,flex:1,minWidth:300}}>
          <div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:8}}>Climate Solution Category Exposure</div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={catBreakdown.slice(0,8)} layout="vertical" margin={{left:100}}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis type="number" tick={{fontSize:11}} />
              <YAxis type="category" dataKey="name" tick={{fontSize:10}} width={95} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" name="Companies" radius={[0,6,6,0]}>
                {catBreakdown.slice(0,8).map((c,i)=><Cell key={i} fill={c.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={card}>
        <div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:8}}>Benchmark Comparison: Screened vs Universe</div>
        <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
          <thead>
            <tr>
              <th style={th}>Metric</th>
              <th style={th}>Screened Portfolio</th>
              <th style={th}>Full Universe</th>
              <th style={th}>Difference</th>
            </tr>
          </thead>
          <tbody>
            {benchmarks.map(b=>(
              <tr key={b.metric}>
                <td style={{...td,fontWeight:600}}>{b.metric}</td>
                <td style={{...td,textAlign:'center',fontFamily:T.mono,fontWeight:700,color:T.navy}}>{b.screened}</td>
                <td style={{...td,textAlign:'center',fontFamily:T.mono}}>{b.universe}</td>
                <td style={{...td,textAlign:'center',fontFamily:T.mono,fontWeight:700,color:b.diff>0?T.green:b.diff<0?T.red:T.textMut}}>
                  {b.diff>0?'+':''}{b.diff}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{display:'flex',gap:8,marginBottom:16}}>
        <button style={btn(showBuilder)} onClick={()=>setShowBuilder(!showBuilder)}>{showBuilder?'Hide Builder':'Portfolio Construction Tool'}</button>
        <button style={{...btn(false),borderColor:T.sage,color:T.sage}} onClick={handleExport}>
          {exportReady?'\u2705 Exported!':'Export Screened Portfolio CSV'}
        </button>
      </div>

      {showBuilder && (
        <div style={{...card,border:`2px solid ${T.navy}`}}>
          <div style={{fontSize:15,fontWeight:800,color:T.navy,marginBottom:12}}>Portfolio Construction Tool</div>
          <div style={{fontSize:12,color:T.textSec,marginBottom:16}}>Adjust scoring weights to optimize portfolio selection. Total weight: {builderWeights.greenRev+builderWeights.euAlign+builderWeights.propScore+builderWeights.trl}</div>

          <div style={{display:'flex',gap:16,flexWrap:'wrap',marginBottom:16}}>
            {Object.entries(builderWeights).map(([k,v])=>(
              <div key={k} style={{flex:1,minWidth:140}}>
                <div style={{fontSize:11,fontWeight:600,color:T.textMut,marginBottom:4}}>{k==='greenRev'?'Green Revenue':k==='euAlign'?'EU Alignment':k==='propScore'?'Proprietary Score':'Tech Readiness'}</div>
                <input type="range" min={0} max={100} value={v} onChange={e=>{setBuilderWeights({...builderWeights,[k]:+e.target.value});}} style={{width:'100%'}} />
                <div style={{fontSize:12,fontFamily:T.mono,textAlign:'center'}}>{v}%</div>
              </div>
            ))}
          </div>

          <div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:8}}>Top 20 Composite-Scored Companies</div>
          <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
            <thead>
              <tr>
                <th style={th}>#</th>
                <th style={th}>Company</th>
                <th style={th}>Sector</th>
                <th style={th}>Composite Score</th>
                <th style={th}>Green Rev %</th>
                <th style={th}>EU Align</th>
                <th style={th}>Prop Score</th>
                <th style={th}>TRL</th>
              </tr>
            </thead>
            <tbody>
              {builderScored.slice(0,20).map((c,i)=>(
                <tr key={c.id}>
                  <td style={{...td,fontFamily:T.mono,color:T.textMut}}>{i+1}</td>
                  <td style={{...td,fontWeight:600}}>{c.name}</td>
                  <td style={td}>{c.sector}</td>
                  <td style={{...td,textAlign:'center'}}>
                    <div style={{display:'flex',alignItems:'center',gap:6}}>
                      <div style={{flex:1,height:8,borderRadius:4,background:T.border}}>
                        <div style={{height:8,borderRadius:4,background:c.compositeScore>70?T.green:c.compositeScore>50?T.sage:T.amber,width:`${c.compositeScore}%`}} />
                      </div>
                      <span style={{fontFamily:T.mono,fontWeight:700,fontSize:12,minWidth:28}}>{c.compositeScore}</span>
                    </div>
                  </td>
                  <td style={{...td,textAlign:'center',fontFamily:T.mono}}>{c.greenRevPct}%</td>
                  <td style={{...td,textAlign:'center',fontFamily:T.mono}}>{c.euAlign}%</td>
                  <td style={{...td,textAlign:'center',fontFamily:T.mono}}>{c.propScore}</td>
                  <td style={{...td,textAlign:'center',fontFamily:T.mono}}>{c.trl}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div style={card}>
        <div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:12}}>Screened Companies ({screened.length})</div>
        <div style={{overflowX:'auto'}}>
          <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
            <thead>
              <tr>
                <th style={th}>Company</th>
                <th style={th}>Sector</th>
                <th style={th}>Country</th>
                <th style={th}>Green Rev %</th>
                <th style={th}>EU Align</th>
                <th style={th}>CBI Class</th>
                <th style={th}>FTSE Green</th>
                <th style={th}>Prop Score</th>
                <th style={th}>Categories</th>
              </tr>
            </thead>
            <tbody>
              {screened.slice(0,40).map(c=>(
                <tr key={c.id}>
                  <td style={{...td,fontWeight:600}}>{c.name}</td>
                  <td style={td}>{c.sector}</td>
                  <td style={td}>{c.country}</td>
                  <td style={{...td,textAlign:'center',fontWeight:700,color:c.greenRevPct>60?T.green:c.greenRevPct>30?T.amber:T.red,fontFamily:T.mono}}>{c.greenRevPct}%</td>
                  <td style={{...td,textAlign:'center',fontFamily:T.mono}}>{c.euAlign}%</td>
                  <td style={td}><span style={badge(c.cbiClass==='Aligned'?T.green+'15':c.cbiClass==='Partially Aligned'?T.amber+'15':T.red+'15',
                    c.cbiClass==='Aligned'?T.green:c.cbiClass==='Partially Aligned'?T.amber:T.red)}>{c.cbiClass}</span></td>
                  <td style={{...td,textAlign:'center',fontFamily:T.mono}}>{c.ftseGreen}%</td>
                  <td style={{...td,textAlign:'center',fontFamily:T.mono}}>{c.propScore}</td>
                  <td style={{...td,fontSize:11}}>{c.catIds.slice(0,2).map(id=>CAT_MAP[id]?.name).join(', ')}{c.catIds.length>2?` +${c.catIds.length-2}`:''}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {screened.length>40 && <div style={{fontSize:11,color:T.textMut,padding:8}}>Showing 40 of {screened.length}. Export for full list.</div>}
        </div>
      </div>
    </div>
  );
}

/* ─── Main Page ─── */
const TABS = [
  { id:'classifier', label:'Taxonomy Classifier', icon:'\ud83c\udf0d' },
  { id:'categories', label:'Solution Category Explorer', icon:'\ud83d\udcca' },
  { id:'matrix', label:'Taxonomy Alignment Matrix', icon:'\ud83d\uddd3' },
  { id:'screening', label:'Portfolio Solution Screening', icon:'\ud83d\udcbc' },
];

export default function ClimateSolutionTaxonomyPage(){
  const [tab, setTab] = useState('classifier');

  return (
    <div style={{fontFamily:T.font,background:T.bg,minHeight:'100vh',color:T.text}}>
      <div style={{maxWidth:1440,margin:'0 auto',padding:'24px 28px'}}>
        {/* Header */}
        <div style={{marginBottom:24}}>
          <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:6}}>
            <span style={{fontSize:28}}>🌍</span>
            <div>
              <h1 style={{margin:0,fontSize:22,fontWeight:800,color:T.navy}}>Climate Solution Taxonomy & Classification</h1>
              <p style={{margin:0,fontSize:13,color:T.textSec}}>
                EP-AO5 | Classify companies and products by climate solution contribution across EU Taxonomy, CBI Taxonomy, FTSE Green Revenue, and proprietary classification
              </p>
            </div>
          </div>
          <div style={{display:'flex',gap:6,marginTop:10,flexWrap:'wrap'}}>
            <span style={badge(T.navy+'12',T.navy)}>150 Companies</span>
            <span style={badge(T.sage+'12',T.sage)}>4 Taxonomy Systems</span>
            <span style={badge(T.gold+'12',T.gold)}>12 Solution Categories</span>
            <span style={badge(T.navyL+'12',T.navyL)}>8 Technology Readiness Levels</span>
          </div>
        </div>

        {/* Tab Bar */}
        <div style={{display:'flex',gap:4,marginBottom:20,borderBottom:`2px solid ${T.border}`,paddingBottom:0,overflowX:'auto'}}>
          {TABS.map(t=>(
            <button key={t.id} onClick={()=>setTab(t.id)} style={{
              padding:'10px 18px',border:'none',borderBottom:tab===t.id?`3px solid ${T.navy}`:'3px solid transparent',
              background:tab===t.id?T.surface:'transparent',color:tab===t.id?T.navy:T.textSec,
              fontSize:13,fontWeight:tab===t.id?700:500,cursor:'pointer',fontFamily:T.font,
              borderRadius:'8px 8px 0 0',transition:'all 0.2s',whiteSpace:'nowrap',
            }}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {tab==='classifier' && <TabClassifier />}
        {tab==='categories' && <TabCategoryExplorer />}
        {tab==='matrix' && <TabAlignmentMatrix />}
        {tab==='screening' && <TabPortfolioScreening />}

        {/* Footer */}
        <div style={{marginTop:32,paddingTop:16,borderTop:`1px solid ${T.border}`,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <div style={{fontSize:11,color:T.textMut}}>
            Climate Solution Taxonomy v1.0 | EU Taxonomy Delegated Act 2024 | CBI Standard v4.0 | FTSE Classification 3.0
          </div>
          <div style={{fontSize:11,color:T.textMut}}>
            Data as of Q1 2025 | 150 companies | 4 taxonomy systems | 12 categories
          </div>
        </div>
      </div>
    </div>
  );
}
