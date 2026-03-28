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
  { id:'clean_energy', name:'Clean Energy Generation', icon:'\u2600\ufe0f', color:'#f59e0b',
    marketSize:1420, growth:14.2, investReq:890,
    subCats:['Solar PV','Onshore Wind','Offshore Wind','Geothermal','Tidal/Wave'],
    keyTech:['Perovskite tandem cells','Floating offshore turbines','Enhanced geothermal systems','Bifacial solar modules'],
    desc:'Power generation from renewable and zero-carbon sources including solar, wind, geothermal, and marine energy' },
  { id:'energy_storage', name:'Energy Storage', icon:'\u26a1', color:'#8b5cf6',
    marketSize:310, growth:22.5, investReq:420,
    subCats:['Li-ion batteries','Flow batteries','Pumped hydro','Compressed air','Thermal storage'],
    keyTech:['Solid-state batteries','Iron-air long-duration','Gravity-based storage','Vanadium redox flow'],
    desc:'Technologies for storing electricity and thermal energy to enable grid flexibility and renewable integration' },
  { id:'grid_infra', name:'Grid Infrastructure', icon:'\ud83d\udd0c', color:'#06b6d4',
    marketSize:580, growth:9.8, investReq:670,
    subCats:['Smart grids','HVDC transmission','Microgrids','Grid-scale inverters','Demand response'],
    keyTech:['AI grid management','Superconducting cables','Virtual power plants','Grid-forming inverters'],
    desc:'Infrastructure for electricity transmission, distribution, and grid modernization to support clean energy integration' },
  { id:'ev_transport', name:'EV & Clean Transport', icon:'\ud83d\ude97', color:'#10b981',
    marketSize:890, growth:18.6, investReq:750,
    subCats:['Passenger EVs','Commercial EVs','E-buses','Rail electrification','Maritime electrification'],
    keyTech:['Solid-state EV batteries','Autonomous EVs','Electric short-haul aviation','Hydrogen fuel-cell trucks'],
    desc:'Electric vehicles and zero-emission transport solutions across road, rail, maritime, and aviation sectors' },
  { id:'green_hydrogen', name:'Green Hydrogen', icon:'\ud83d\udca7', color:'#3b82f6',
    marketSize:180, growth:35.2, investReq:560,
    subCats:['Electrolysis','H2 fuel cells','H2 storage','H2 pipelines','Industrial H2 applications'],
    keyTech:['PEM electrolyzers at scale','Solid oxide electrolysis','Ammonia cracking for transport','Underground H2 storage'],
    desc:'Production, storage, transport, and end-use of green hydrogen from renewable-powered electrolysis' },
  { id:'ccus', name:'CCUS', icon:'\ud83c\udf2b\ufe0f', color:'#6366f1',
    marketSize:95, growth:28.4, investReq:340,
    subCats:['Point-source capture','Direct air capture','CO2 transport','Geological storage','CO2 utilization'],
    keyTech:['Amine solvent advances','Solid sorbent DAC','Mineral carbonation','CO2-to-fuels pathways'],
    desc:'Carbon capture, utilization, and storage across industrial point sources and atmospheric removal' },
  { id:'sust_ag', name:'Sustainable Agriculture', icon:'\ud83c\udf3e', color:'#84cc16',
    marketSize:420, growth:11.3, investReq:280,
    subCats:['Precision farming','Regenerative agriculture','Alternative proteins','Vertical farming','Biochar & soil carbon'],
    keyTech:['AI crop monitoring','Gene-edited drought-resistant crops','Methane inhibitor feed additives','Satellite-based MRV'],
    desc:'Agricultural practices and technologies that reduce emissions, enhance carbon sequestration, and improve resilience' },
  { id:'circular', name:'Circular Economy', icon:'\u267b\ufe0f', color:'#f97316',
    marketSize:340, growth:12.8, investReq:210,
    subCats:['Chemical recycling','Remanufacturing','Product-as-service','Waste-to-value','Industrial symbiosis'],
    keyTech:['AI-powered sorting','Enzymatic plastic recycling','Digital product passports','Advanced pyrolysis'],
    desc:'Systems and technologies enabling material reuse, recycling, and waste reduction across value chains' },
  { id:'water_tech', name:'Water Technology', icon:'\ud83d\udca7', color:'#0ea5e9',
    marketSize:260, growth:8.9, investReq:190,
    subCats:['Desalination','Water recycling','Smart water networks','Flood management','Water-energy nexus'],
    keyTech:['Graphene membranes','AI leak detection','Atmospheric water generation','Forward osmosis'],
    desc:'Water treatment, efficiency, and management technologies addressing scarcity and climate-related water risks' },
  { id:'nature_based', name:'Nature-Based Solutions', icon:'\ud83c\udf33', color:'#22c55e',
    marketSize:150, growth:16.7, investReq:120,
    subCats:['Reforestation','Mangrove restoration','Peatland restoration','Biodiversity credits','Ocean-based CDR'],
    keyTech:['LiDAR forest monitoring','eDNA biodiversity sampling','Satellite-based MRV','Biochar ocean alkalinity'],
    desc:'Ecosystem-based approaches to climate mitigation and adaptation including forestry, wetlands, and ocean systems' },
  { id:'green_buildings', name:'Green Buildings', icon:'\ud83c\udfe2', color:'#14b8a6',
    marketSize:530, growth:10.5, investReq:450,
    subCats:['Heat pumps','Smart HVAC','Green cement','Mass timber construction','Deep retrofits'],
    keyTech:['Digital twin building management','Phase-change thermal materials','Electrochromic smart glass','Cross-laminated timber'],
    desc:'Sustainable construction materials, energy-efficient building systems, and whole-building decarbonization approaches' },
  { id:'climate_adapt', name:'Climate Adaptation', icon:'\ud83d\udee1\ufe0f', color:'#ef4444',
    marketSize:190, growth:19.3, investReq:310,
    subCats:['Early warning systems','Resilient infrastructure','Climate insurance','Drought-resistant crops','Urban cooling'],
    keyTech:['AI climate risk modelling','Parametric insurance platforms','Heat-reflective coatings','Flood-resilient design'],
    desc:'Technologies and systems that help communities, infrastructure, and ecosystems adapt to physical climate impacts' },
];

const CAT_MAP = Object.fromEntries(CATEGORIES.map(c=>[c.id,c]));
const TAXONOMY_NAMES = ['EU Taxonomy','CBI Taxonomy','FTSE Green Rev','Proprietary'];
const PIE_COLORS = ['#1b3a5c','#2c5a8c','#5a8a6a','#c5a96a','#7ba67d','#d4be8a','#9aa3ae','#dc2626','#f59e0b','#8b5cf6','#06b6d4','#ef4444'];

/* ─── Generate 150 Companies ─── */
const COMPANIES = (()=>{
  const sectors = ['Utilities','Energy','Technology','Industrials','Materials','Consumer','Healthcare','Financials','Real Estate','Transport'];
  const prefixes = ['Apex','Nova','Terra','Solaris','Verdant','Quantum','Helios','Aqua','Zenith','Orion',
    'Vortex','Nexus','Atlas','Cirrus','Ember','Flux','Geo','Ion','Kai','Lux',
    'Aura','Bolt','Cryo','Dyne','Echo','Fern','Gaia','Halo','Iris','Jade'];
  const suffixes = ['Energy','Power','Tech','Green','Solutions','Systems','Corp','Holdings','Group','Industries',
    'Labs','Dynamics','Ventures','Capital','Networks','Global','Partners','Sciences','Works','Digital'];
  const countries = ['US','UK','DE','JP','CN','FR','KR','CA','AU','IN','NL','SG','CH','SE','DK','NO','ES','IT','BR','ZA'];
  const companies = [];
  for(let i=0;i<150;i++){
    const s1 = sr(i*7+3), s2 = sr(i*11+5);
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
      if(idx===catIds.length-1){ revBreakdown[cid]=Math.max(remPct,0); }
      else { const pct=Math.round(5+sr(i*37+idx*11)*(remPct-5*(catIds.length-idx-1))); revBreakdown[cid]=Math.min(Math.max(pct,0),remPct); remPct-=pct; }
    });
    const euAlign = Math.round(sr(i*41+3)*100);
    const cbiClass = ['Aligned','Partially Aligned','Not Aligned','Under Review'][Math.floor(sr(i*43+5)*4)];
    const ftseGreen = Math.round(sr(i*47+7)*100);
    const propScore = Math.round(20+sr(i*53+9)*80);
    const trl = 1+Math.floor(sr(i*59+11)*9);
    const greenRevPct = Math.round(catIds.reduce((sum,cid)=>sum+(revBreakdown[cid]||0),0) * (sr(i*61+1)*0.5+0.3));
    const revenue = Math.round(50 + sr(i*63+13)*9950);
    const founded = 1980 + Math.floor(sr(i*67+15)*43);
    companies.push({
      id:i+1,
      name:`${name} ${(i+1).toString().padStart(3,'0')}`,
      sector, mktCap, catIds, revBreakdown,
      euAlign, cbiClass, ftseGreen, propScore, trl,
      greenRevPct:Math.min(greenRevPct,98),
      country: countries[Math.floor(sr(i*69+3)*countries.length)],
      employees: Math.round(100+sr(i*71+5)*49900),
      revenue, founded,
      euActivities: Math.floor(1+sr(i*73+7)*6),
      cbiPathway: ['Mitigation','Adaptation','Both'][Math.floor(sr(i*77+9)*3)],
      ftseTier: Math.floor(1+sr(i*79+11)*5),
    });
  }
  return companies;
})();

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

const Kpi = ({label,value,sub,color})=>(
  <div style={{...card,textAlign:'center',flex:1,minWidth:155}}>
    <div style={{fontSize:11,color:T.textMut,fontWeight:600,textTransform:'uppercase',letterSpacing:0.5,marginBottom:6}}>{label}</div>
    <div style={{fontSize:26,fontWeight:800,color:color||T.navy,fontFamily:T.mono}}>{value}</div>
    {sub && <div style={{fontSize:12,color:T.textSec,marginTop:4}}>{sub}</div>}
  </div>
);

const CustomTooltip = ({active,payload,label})=>{
  if(!active||!payload?.length) return null;
  return (<div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:8,padding:'8px 12px',fontSize:12,boxShadow:'0 4px 12px rgba(0,0,0,0.08)'}}>
    <div style={{fontWeight:700,marginBottom:4}}>{label}</div>
    {payload.map((p,i)=><div key={i} style={{color:p.color||T.text}}>{p.name}: {typeof p.value==='number'?p.value.toLocaleString():p.value}{p.unit||''}</div>)}
  </div>);
};

const cbiNum = (c)=> c.cbiClass==='Aligned'?85:c.cbiClass==='Partially Aligned'?50:c.cbiClass==='Under Review'?30:10;

/* ═══════════════════════════════════════════════════════════════
   Tab 1: Taxonomy Classifier
   ═══════════════════════════════════════════════════════════════ */
function TabClassifier(){
  const [selCo, setSelCo] = useState(0);
  const [searchQ, setSearchQ] = useState('');
  const [showWizard, setShowWizard] = useState(false);
  const [wizRevStreams, setWizRevStreams] = useState([
    {cat:CATEGORIES[0].id, pct:50},
    {cat:CATEGORIES[3].id, pct:30},
    {cat:CATEGORIES[7].id, pct:20},
  ]);
  const [wizResult, setWizResult] = useState(null);
  const [sortField, setSortField] = useState('name');

  const filtered = useMemo(()=>{
    let cos = searchQ ? COMPANIES.filter(c=>c.name.toLowerCase().includes(searchQ.toLowerCase()) || c.sector.toLowerCase().includes(searchQ.toLowerCase())) : COMPANIES;
    if(sortField==='euAlign') cos = [...cos].sort((a,b)=>b.euAlign-a.euAlign);
    else if(sortField==='greenRev') cos = [...cos].sort((a,b)=>b.greenRevPct-a.greenRevPct);
    else if(sortField==='propScore') cos = [...cos].sort((a,b)=>b.propScore-a.propScore);
    return cos;
  }, [searchQ,sortField]);

  const co = COMPANIES[selCo];

  const stackedData = useMemo(()=>{
    return co.catIds.map(cid=>({
      name:CAT_MAP[cid].name,
      value:co.revBreakdown[cid]||0,
      fill:CAT_MAP[cid].color,
    }));
  },[selCo]);

  const radarMetrics = useMemo(()=>[
    {name:'EU Taxonomy', val:co.euAlign},
    {name:'CBI Score', val:cbiNum(co)},
    {name:'FTSE Green', val:co.ftseGreen},
    {name:'Proprietary', val:co.propScore},
    {name:'Tech Readiness', val:Math.round(co.trl/9*100)},
    {name:'Green Rev %', val:co.greenRevPct},
  ],[selCo]);

  const disagreements = useMemo(()=>{
    const d=[];
    if(co.euAlign>60 && co.ftseGreen<30) d.push({type:'EU vs FTSE', desc:'EU Taxonomy aligned but low FTSE Green Revenue. EU includes capex plans and transition activities; FTSE counts current revenue only.', severity:'high'});
    if(co.cbiClass==='Aligned' && co.euAlign<40) d.push({type:'CBI vs EU', desc:'CBI aligned but low EU Taxonomy score. CBI has broader green bond eligibility criteria vs EU strict technical screening criteria.', severity:'medium'});
    if(co.propScore>70 && co.ftseGreen<25) d.push({type:'Proprietary vs FTSE', desc:'High proprietary score but low FTSE Green Revenue. Proprietary model weights transition intent and capex trajectory; FTSE is backward-looking revenue-only.', severity:'medium'});
    if(co.euAlign<30 && co.propScore>65) d.push({type:'EU vs Proprietary', desc:'Low EU alignment but strong proprietary score. Company may operate in sectors not yet covered by EU Delegated Acts or have strong transition plans.', severity:'low'});
    if(co.ftseGreen>60 && co.euAlign<35) d.push({type:'FTSE vs EU', desc:'High FTSE green revenue but low EU alignment. FTSE may classify some activities as green that EU Taxonomy does not yet recognize.', severity:'medium'});
    if(d.length===0) d.push({type:'Consensus', desc:'All four taxonomies broadly agree on this company classification. Spread between highest and lowest scores is less than 20 points.', severity:'none'});
    return d;
  },[selCo]);

  const peerComparison = useMemo(()=>{
    const peers = COMPANIES.filter(c=>c.sector===co.sector && c.id!==co.id).slice(0,5);
    return [co,...peers].map(c=>({
      name:c.name.split(' ').slice(0,2).join(' '),
      'EU Align':c.euAlign, 'FTSE Green':c.ftseGreen, 'Prop Score':c.propScore, 'Green Rev':c.greenRevPct,
    }));
  },[selCo]);

  const runWizard = useCallback(()=>{
    const greenCats = ['clean_energy','energy_storage','green_hydrogen','nature_based','ev_transport','green_buildings'];
    const greenPct = wizRevStreams.filter(r=>greenCats.includes(r.cat)).reduce((s,r)=>s+r.pct,0);
    const totalPct = wizRevStreams.reduce((s,r)=>s+r.pct,0);
    const eu = Math.round(Math.min(greenPct * 0.85 + sr(777)*10, 100));
    const cbi = greenPct>60?'Aligned':greenPct>30?'Partially Aligned':'Not Aligned';
    const ftse = Math.round(Math.min(greenPct*0.9 + sr(888)*8, 100));
    const prop = Math.round(Math.min(greenPct*0.7 + 20 + sr(999)*10, 100));
    const conflicts = [];
    if(eu>60 && ftse<40) conflicts.push('EU Taxonomy recognizes transition capex that FTSE does not count as green revenue');
    if(greenPct>50 && greenPct<70) conflicts.push('Border-zone: CBI and EU may classify differently at this green revenue level');
    setWizResult({eu,cbi,ftse,prop,totalPct,conflicts});
  },[wizRevStreams]);

  return (
    <div>
      <div style={{display:'flex',gap:12,flexWrap:'wrap',marginBottom:16}}>
        <Kpi label="Companies Classified" value="150" sub="across 4 taxonomy systems" />
        <Kpi label="Avg EU Alignment" value={Math.round(COMPANIES.reduce((s,c)=>s+c.euAlign,0)/150)+'%'} sub="Delegated Act 2024" color={T.sage} />
        <Kpi label="Avg FTSE Green Rev" value={Math.round(COMPANIES.reduce((s,c)=>s+c.ftseGreen,0)/150)+'%'} sub="revenue-weighted basis" color={T.gold} />
        <Kpi label="Taxonomy Conflicts" value={COMPANIES.filter(c=>Math.abs(c.euAlign-c.ftseGreen)>40).length} sub="cross-taxonomy disagreements" color={T.red} />
      </div>

      <div style={{display:'flex',gap:8,marginBottom:16,alignItems:'center',flexWrap:'wrap'}}>
        <input value={searchQ} onChange={e=>setSearchQ(e.target.value)} placeholder="Search 150 companies by name or sector..." style={{...select,flex:1,minWidth:220}} />
        <select value={sortField} onChange={e=>setSortField(e.target.value)} style={select}>
          <option value="name">Sort: Name</option>
          <option value="euAlign">Sort: EU Alignment</option>
          <option value="greenRev">Sort: Green Revenue</option>
          <option value="propScore">Sort: Proprietary Score</option>
        </select>
        <button style={btn(showWizard)} onClick={()=>setShowWizard(!showWizard)}>{showWizard?'Close Wizard':'\u2795 Classify New Company'}</button>
      </div>

      {showWizard && (
        <div style={{...card,background:T.surfaceH,border:`2px solid ${T.gold}`}}>
          <div style={{fontSize:15,fontWeight:700,color:T.navy,marginBottom:4}}>Classification Wizard</div>
          <div style={{fontSize:12,color:T.textSec,marginBottom:12}}>Define revenue streams to auto-classify against all 4 taxonomy systems simultaneously</div>
          {wizRevStreams.map((rs,i)=>(
            <div key={i} style={{display:'flex',gap:8,alignItems:'center',marginBottom:8}}>
              <select value={rs.cat} onChange={e=>{const n=[...wizRevStreams];n[i].cat=e.target.value;setWizRevStreams(n);}} style={{...select,flex:1}}>
                {CATEGORIES.map(c=><option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
              </select>
              <input type="number" value={rs.pct} min={0} max={100} onChange={e=>{const n=[...wizRevStreams];n[i].pct=parseInt(e.target.value)||0;setWizRevStreams(n);}} style={{...select,width:70}} />
              <span style={{fontSize:12,color:T.textMut}}>%</span>
              {wizRevStreams.length>1 && <button onClick={()=>setWizRevStreams(wizRevStreams.filter((_,j)=>j!==i))} style={{...btn(false),padding:'4px 10px',color:T.red,borderColor:T.red}}>Remove</button>}
            </div>
          ))}
          <div style={{display:'flex',gap:8,marginTop:8}}>
            <button onClick={()=>setWizRevStreams([...wizRevStreams,{cat:CATEGORIES[0].id,pct:10}])} style={btn(false)}>+ Add Revenue Stream</button>
            <button onClick={runWizard} style={btn(true)}>Run Classification</button>
          </div>
          {wizResult && (
            <div style={{marginTop:16,padding:16,background:T.surface,borderRadius:10,border:`1px solid ${T.border}`}}>
              <div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:8}}>Classification Results (Revenue allocated: {wizResult.totalPct}%)</div>
              <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(150px,1fr))',gap:12,marginBottom:12}}>
                <div style={{padding:10,borderRadius:8,background:T.sage+'10',textAlign:'center'}}>
                  <div style={{fontSize:11,color:T.textMut}}>EU Taxonomy</div>
                  <div style={{fontSize:20,fontWeight:800,color:T.sage,fontFamily:T.mono}}>{wizResult.eu}%</div>
                </div>
                <div style={{padding:10,borderRadius:8,background:T.navyL+'10',textAlign:'center'}}>
                  <div style={{fontSize:11,color:T.textMut}}>CBI Taxonomy</div>
                  <div style={{fontSize:16,fontWeight:800,color:T.navyL}}>{wizResult.cbi}</div>
                </div>
                <div style={{padding:10,borderRadius:8,background:T.gold+'10',textAlign:'center'}}>
                  <div style={{fontSize:11,color:T.textMut}}>FTSE Green Rev</div>
                  <div style={{fontSize:20,fontWeight:800,color:T.gold,fontFamily:T.mono}}>{wizResult.ftse}%</div>
                </div>
                <div style={{padding:10,borderRadius:8,background:T.navy+'10',textAlign:'center'}}>
                  <div style={{fontSize:11,color:T.textMut}}>Proprietary</div>
                  <div style={{fontSize:20,fontWeight:800,color:T.navy,fontFamily:T.mono}}>{wizResult.prop}/100</div>
                </div>
              </div>
              {wizResult.conflicts.length>0 && (
                <div style={{padding:10,borderRadius:8,background:T.amber+'08',border:`1px solid ${T.amber}30`}}>
                  <div style={{fontSize:11,fontWeight:700,color:T.amber,marginBottom:4}}>Taxonomy Conflicts Detected</div>
                  {wizResult.conflicts.map((c,i)=><div key={i} style={{fontSize:12,color:T.textSec,marginBottom:2}}>{'\u26a0\ufe0f'} {c}</div>)}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <div style={{display:'flex',gap:16,flexWrap:'wrap'}}>
        {/* Company List Panel */}
        <div style={{...card,flex:'0 0 290px',maxHeight:620,overflowY:'auto',padding:12}}>
          <div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:8}}>Companies ({filtered.length})</div>
          {filtered.slice(0,60).map(c=>(
            <div key={c.id} onClick={()=>setSelCo(c.id-1)} style={{padding:'8px 10px',borderRadius:8,cursor:'pointer',marginBottom:2,
              background:selCo===c.id-1?T.navy+'12':'transparent',borderLeft:selCo===c.id-1?`3px solid ${T.navy}`:'3px solid transparent',transition:'all 0.15s'}}>
              <div style={{fontSize:12,fontWeight:600,color:T.text}}>{c.name}</div>
              <div style={{display:'flex',gap:6,marginTop:2}}>
                <span style={{fontSize:10,color:T.textMut}}>{c.sector}</span>
                <span style={{fontSize:10,color:c.euAlign>60?T.green:c.euAlign>30?T.amber:T.red}}>EU {c.euAlign}%</span>
                <span style={{fontSize:10,color:T.sage}}>Green {c.greenRevPct}%</span>
              </div>
            </div>
          ))}
          {filtered.length>60 && <div style={{fontSize:11,color:T.textMut,padding:8}}>Showing 60 of {filtered.length}. Refine search.</div>}
        </div>

        {/* Detail Panel */}
        <div style={{flex:1,minWidth:400}}>
          <div style={card}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:14,flexWrap:'wrap',gap:8}}>
              <div>
                <div style={{fontSize:18,fontWeight:800,color:T.navy}}>{co.name}</div>
                <div style={{fontSize:12,color:T.textSec}}>{co.sector} | {co.country} | Founded {co.founded} | {co.employees.toLocaleString()} employees</div>
                <div style={{fontSize:12,color:T.textSec}}>Revenue ${co.revenue}M | Mkt Cap ${co.mktCap.toLocaleString()}M | TRL {co.trl}</div>
              </div>
              <div style={{display:'flex',gap:4,flexWrap:'wrap'}}>
                <span style={badge(co.euAlign>60?T.green+'18':co.euAlign>30?T.amber+'18':T.red+'18', co.euAlign>60?T.green:co.euAlign>30?T.amber:T.red)}>EU {co.euAlign}%</span>
                <span style={badge(T.navyL+'15',T.navyL)}>{co.cbiClass}</span>
                <span style={badge(T.gold+'15',T.gold)}>FTSE {co.ftseGreen}%</span>
                <span style={badge(T.sage+'15',T.sage)}>Score {co.propScore}</span>
              </div>
            </div>

            <div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:8}}>Revenue Breakdown by Climate Solution Category</div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={stackedData} margin={{left:10,right:20,bottom:40}}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="name" tick={{fontSize:10,angle:-25,textAnchor:'end'}} interval={0} />
                <YAxis tick={{fontSize:11}} label={{value:'Revenue %',angle:-90,position:'insideLeft',style:{fontSize:11}}} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" name="Revenue %" radius={[6,6,0,0]}>
                  {stackedData.map((d,i)=><Cell key={i} fill={d.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div style={{display:'flex',gap:6,flexWrap:'wrap',marginTop:8}}>
              {co.catIds.map(cid=>(
                <span key={cid} style={badge(CAT_MAP[cid].color+'15',CAT_MAP[cid].color)}>
                  {CAT_MAP[cid].icon} {CAT_MAP[cid].name}: {co.revBreakdown[cid]}%
                </span>
              ))}
            </div>
          </div>

          <div style={{display:'flex',gap:16,flexWrap:'wrap'}}>
            <div style={{...card,flex:1,minWidth:300}}>
              <div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:8}}>Multi-Taxonomy Radar Comparison</div>
              <ResponsiveContainer width="100%" height={260}>
                <RadarChart data={radarMetrics}>
                  <PolarGrid stroke={T.border} />
                  <PolarAngleAxis dataKey="name" tick={{fontSize:10,fill:T.textSec}} />
                  <PolarRadiusAxis angle={30} domain={[0,100]} tick={{fontSize:9}} />
                  <Radar name={co.name} dataKey="val" stroke={T.navy} fill={T.navy} fillOpacity={0.15} strokeWidth={2} />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            <div style={{...card,flex:1,minWidth:300}}>
              <div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:8}}>Sector Peer Comparison</div>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={peerComparison} margin={{bottom:30}}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="name" tick={{fontSize:9,angle:-20,textAnchor:'end'}} interval={0} />
                  <YAxis domain={[0,100]} tick={{fontSize:10}} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{fontSize:10}} />
                  <Bar dataKey="EU Align" fill={T.navy} radius={[3,3,0,0]} />
                  <Bar dataKey="FTSE Green" fill={T.gold} radius={[3,3,0,0]} />
                  <Bar dataKey="Prop Score" fill={T.sage} radius={[3,3,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div style={card}>
            <div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:8}}>Taxonomy Disagreement Flags</div>
            {disagreements.map((d,i)=>(
              <div key={i} style={{padding:12,borderRadius:10,marginBottom:8,
                background:d.severity==='high'?T.red+'08':d.severity==='medium'?T.amber+'08':d.severity==='low'?T.gold+'08':T.green+'08',
                border:`1px solid ${d.severity==='high'?T.red+'30':d.severity==='medium'?T.amber+'30':d.severity==='low'?T.gold+'30':T.green+'30'}`}}>
                <div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}>
                  <span style={{fontSize:12,fontWeight:700,color:T.text}}>{d.type}</span>
                  <span style={badge(
                    d.severity==='high'?T.red+'20':d.severity==='medium'?T.amber+'20':d.severity==='none'?T.green+'20':T.gold+'20',
                    d.severity==='high'?T.red:d.severity==='medium'?T.amber:d.severity==='none'?T.green:T.gold,
                  )}>{d.severity==='none'?'Aligned':d.severity}</span>
                </div>
                <div style={{fontSize:12,color:T.textSec,lineHeight:1.5}}>{d.desc}</div>
              </div>
            ))}
          </div>

          <div style={card}>
            <div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:8}}>Detailed Taxonomy Assessment</div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))',gap:12}}>
              <div style={{padding:14,borderRadius:10,background:T.navy+'06',border:`1px solid ${T.navy}15`}}>
                <div style={{fontSize:11,fontWeight:700,color:T.textMut,marginBottom:6}}>EU TAXONOMY</div>
                <div style={{fontSize:24,fontWeight:800,color:co.euAlign>60?T.green:co.euAlign>30?T.amber:T.red,fontFamily:T.mono}}>{co.euAlign}%</div>
                <div style={{fontSize:11,color:T.textSec,marginTop:6}}>Eligible activities: {co.euActivities}</div>
                <div style={{fontSize:11,color:T.textSec}}>DNSH assessment: {co.euAlign>50?'Pass':'Partial'}</div>
                <div style={{fontSize:11,color:T.textSec}}>Social safeguards: {co.euAlign>40?'Compliant':'Under review'}</div>
              </div>
              <div style={{padding:14,borderRadius:10,background:T.sage+'06',border:`1px solid ${T.sage}15`}}>
                <div style={{fontSize:11,fontWeight:700,color:T.textMut,marginBottom:6}}>CBI TAXONOMY</div>
                <div style={{fontSize:18,fontWeight:800,color:T.navyL}}>{co.cbiClass}</div>
                <div style={{fontSize:11,color:T.textSec,marginTop:6}}>Pathway: {co.cbiPathway}</div>
                <div style={{fontSize:11,color:T.textSec}}>Standard: v4.0 (2024)</div>
                <div style={{fontSize:11,color:T.textSec}}>Bond eligibility: {co.cbiClass==='Aligned'?'Yes':'Conditional'}</div>
              </div>
              <div style={{padding:14,borderRadius:10,background:T.gold+'06',border:`1px solid ${T.gold}15`}}>
                <div style={{fontSize:11,fontWeight:700,color:T.textMut,marginBottom:6}}>FTSE GREEN REVENUE</div>
                <div style={{fontSize:24,fontWeight:800,color:co.ftseGreen>60?T.green:co.ftseGreen>30?T.amber:T.red,fontFamily:T.mono}}>{co.ftseGreen}%</div>
                <div style={{fontSize:11,color:T.textSec,marginTop:6}}>Tier: {co.ftseTier} of 5</div>
                <div style={{fontSize:11,color:T.textSec}}>Classification: 3.0 (2024)</div>
                <div style={{fontSize:11,color:T.textSec}}>Revenue basis: Current FY</div>
              </div>
              <div style={{padding:14,borderRadius:10,background:T.sage+'06',border:`1px solid ${T.sage}15`}}>
                <div style={{fontSize:11,fontWeight:700,color:T.textMut,marginBottom:6}}>PROPRIETARY SCORE</div>
                <div style={{fontSize:24,fontWeight:800,color:co.propScore>70?T.green:co.propScore>40?T.amber:T.red,fontFamily:T.mono}}>{co.propScore}/100</div>
                <div style={{fontSize:11,color:T.textSec,marginTop:6}}>Model: v2.5</div>
                <div style={{fontSize:11,color:T.textSec}}>Weights: Rev 40% | Capex 30% | Transition 30%</div>
                <div style={{fontSize:11,color:T.textSec}}>Confidence: {co.propScore>60?'High':'Medium'}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Tab 2: Solution Category Explorer
   ═══════════════════════════════════════════════════════════════ */
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

  const comparisonData = useMemo(()=> catStats.map(c=>({name:c.name.length>16?c.name.slice(0,15)+'\u2026':c.name, 'Market ($B)':c.marketSize, 'Growth (%)':c.growth, Companies:c.companyCount})),[]);

  const detail = selCat!==null ? catStats[selCat] : null;

  return (
    <div>
      <div style={{display:'flex',gap:12,flexWrap:'wrap',marginBottom:16}}>
        <Kpi label="Total Market" value={`$${(catStats.reduce((s,c)=>s+c.marketSize,0)/1000).toFixed(1)}T`} sub="across 12 categories" />
        <Kpi label="Avg Growth" value={(catStats.reduce((s,c)=>s+c.growth,0)/12).toFixed(1)+'%'} sub="CAGR 2024-2035" color={T.sage} />
        <Kpi label="Fastest Growing" value={catStats.reduce((a,b)=>a.growth>b.growth?a:b).name} sub={catStats.reduce((a,b)=>a.growth>b.growth?a:b).growth+'% CAGR'} color={T.gold} />
        <Kpi label="Investment Needed" value={`$${(catStats.reduce((s,c)=>s+c.investReq,0)/1000).toFixed(1)}T`} sub="cumulative to 2035" color={T.navyL} />
      </div>

      <div style={{display:'flex',gap:8,marginBottom:16,alignItems:'center'}}>
        <span style={{fontSize:12,color:T.textMut,fontWeight:600}}>Sort by:</span>
        {['marketSize','growth','companyCount'].map(k=>(
          <button key={k} style={btn(sortBy===k)} onClick={()=>setSortBy(k)}>{k==='marketSize'?'Market Size':k==='growth'?'Growth Rate':'Company Count'}</button>
        ))}
      </div>

      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))',gap:12,marginBottom:20}}>
        {sorted.map(cat=>{
          const idx = CATEGORIES.findIndex(c=>c.id===cat.id);
          const isActive = selCat===idx;
          return (
            <div key={cat.id} onClick={()=>setSelCat(isActive?null:idx)} style={{...card,cursor:'pointer',
              borderColor:isActive?cat.color:T.border, borderWidth:isActive?2:1, transition:'all 0.2s',marginBottom:0}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
                <span style={{fontSize:22}}>{cat.icon}</span>
                <span style={badge(cat.color+'18',cat.color)}>{cat.growth}% CAGR</span>
              </div>
              <div style={{fontSize:14,fontWeight:700,color:T.navy,marginBottom:4}}>{cat.name}</div>
              <div style={{fontSize:12,color:T.textSec,marginBottom:4}}>{cat.companyCount} companies | Avg green rev {cat.avgGreen}%</div>
              <div style={{fontSize:11,color:T.textMut,marginBottom:8}}>{cat.desc?.slice(0,80)}{cat.desc?.length>80?'\u2026':''}</div>
              <div style={{display:'flex',justifyContent:'space-between',fontSize:11,color:T.textMut}}>
                <span>Market: ${cat.marketSize}B</span>
                <span>Invest: ${cat.investReq}B</span>
              </div>
              <div style={{marginTop:8,height:4,borderRadius:2,background:T.border}}>
                <div style={{height:4,borderRadius:2,background:cat.color,width:`${Math.min(cat.growth*3,100)}%`,transition:'width 0.3s'}} />
              </div>
            </div>
          );
        })}
      </div>

      <div style={card}>
        <div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:8}}>Category Comparison</div>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={comparisonData} margin={{left:10,bottom:60}}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="name" tick={{fontSize:9,angle:-35,textAnchor:'end'}} interval={0} />
            <YAxis tick={{fontSize:11}} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{fontSize:11}} />
            <Bar dataKey="Market ($B)" fill={T.navy} radius={[4,4,0,0]} />
            <Bar dataKey="Growth (%)" fill={T.sage} radius={[4,4,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {detail && (
        <div style={{...card,border:`2px solid ${detail.color}`}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
            <div>
              <div style={{fontSize:18,fontWeight:800,color:T.navy}}>{detail.icon} {detail.name}</div>
              <div style={{fontSize:12,color:T.textSec}}>{detail.desc}</div>
              <div style={{fontSize:12,color:T.textSec,marginTop:4}}>Market Size: ${detail.marketSize}B | Growth: {detail.growth}% CAGR | {detail.companyCount} companies | Avg Green Rev: {detail.avgGreen}%</div>
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
            <div style={{flex:1,minWidth:220}}>
              <div style={{fontSize:12,fontWeight:700,color:T.textSec,marginBottom:8}}>Technology Readiness Distribution</div>
              {detail.trlDist.map((count,i)=> count>0 && (
                <div key={i} style={{display:'flex',alignItems:'center',gap:6,marginBottom:4}}>
                  <span style={{fontSize:11,color:T.textMut,width:42,fontFamily:T.mono}}>TRL {i+1}</span>
                  <div style={{flex:1,height:14,borderRadius:4,background:T.border}}>
                    <div style={{height:14,borderRadius:4,background:detail.color,width:`${Math.max((count/Math.max(...detail.trlDist))*100,8)}%`,transition:'width 0.3s'}} />
                  </div>
                  <span style={{fontSize:11,color:T.textSec,width:28,textAlign:'right',fontFamily:T.mono}}>{count}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{fontSize:12,fontWeight:700,color:T.textSec,marginBottom:8}}>Category Evolution Timeline (2020-2035)</div>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={detail.timeline}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="year" tick={{fontSize:11}} />
              <YAxis tick={{fontSize:11}} label={{value:'Market Size ($B)',angle:-90,position:'insideLeft',style:{fontSize:10}}} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="value" stroke={detail.color} fill={detail.color} fillOpacity={0.12} strokeWidth={2} name="Market Size ($B)" />
            </AreaChart>
          </ResponsiveContainer>

          <div style={{fontSize:12,fontWeight:700,color:T.textSec,marginBottom:8,marginTop:16}}>Market Leaders (by Green Revenue %)</div>
          <div style={{overflowX:'auto'}}>
            <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
              <thead><tr><th style={th}>Company</th><th style={th}>Sector</th><th style={th}>Country</th><th style={th}>Green Rev %</th><th style={th}>EU Align</th><th style={th}>Prop Score</th></tr></thead>
              <tbody>
                {COMPANIES.filter(c=>c.catIds.includes(detail.id)).sort((a,b)=>b.greenRevPct-a.greenRevPct).slice(0,10).map(c=>(
                  <tr key={c.id}>
                    <td style={{...td,fontWeight:600}}>{c.name}</td>
                    <td style={td}>{c.sector}</td>
                    <td style={td}>{c.country}</td>
                    <td style={{...td,fontWeight:700,color:T.green,fontFamily:T.mono,textAlign:'center'}}>{c.greenRevPct}%</td>
                    <td style={{...td,fontFamily:T.mono,textAlign:'center'}}>{c.euAlign}%</td>
                    <td style={{...td,fontFamily:T.mono,textAlign:'center'}}>{c.propScore}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{marginTop:16,padding:14,borderRadius:10,background:T.surfaceH}}>
            <div style={{fontSize:12,fontWeight:700,color:T.navy,marginBottom:8}}>Investment & Policy Context</div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))',gap:12}}>
              <div><div style={{fontSize:11,color:T.textMut}}>Cumulative Investment Required</div><div style={{fontSize:16,fontWeight:700,color:T.navy,fontFamily:T.mono}}>${detail.investReq}B</div></div>
              <div><div style={{fontSize:11,color:T.textMut}}>Annual Growth Rate</div><div style={{fontSize:16,fontWeight:700,color:T.sage,fontFamily:T.mono}}>{detail.growth}%</div></div>
              <div><div style={{fontSize:11,color:T.textMut}}>2035 Projected Market</div><div style={{fontSize:16,fontWeight:700,color:T.gold,fontFamily:T.mono}}>${detail.timeline[detail.timeline.length-1].value}B</div></div>
              <div><div style={{fontSize:11,color:T.textMut}}>Avg Technology Maturity</div><div style={{fontSize:16,fontWeight:700,color:T.navyL}}>TRL {Math.round(detail.trlDist.reduce((s,c,i)=>s+c*(i+1),0)/Math.max(detail.trlDist.reduce((s,c)=>s+c,0),1))}</div></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Tab 3: Taxonomy Alignment Matrix
   ═══════════════════════════════════════════════════════════════ */
function TabAlignmentMatrix(){
  const [filterCat, setFilterCat] = useState('all');
  const [filterThreshold, setFilterThreshold] = useState(0);
  const [filterTax, setFilterTax] = useState('eu');
  const [selCell, setSelCell] = useState(null);
  const [showDisagreement, setShowDisagreement] = useState(false);
  const [matrixSort, setMatrixSort] = useState('spread');

  const filteredCos = useMemo(()=>{
    let cos = [...COMPANIES];
    if(filterCat!=='all') cos = cos.filter(c=>c.catIds.includes(filterCat));
    if(filterThreshold>0){
      cos = cos.filter(c=>{
        if(filterTax==='eu') return c.euAlign>=filterThreshold;
        if(filterTax==='ftse') return c.ftseGreen>=filterThreshold;
        if(filterTax==='prop') return c.propScore>=filterThreshold;
        return c.euAlign>=filterThreshold;
      });
    }
    if(matrixSort==='spread') cos.sort((a,b)=>{const sa=[a.euAlign,cbiNum(a),a.ftseGreen,a.propScore],sb=[b.euAlign,cbiNum(b),b.ftseGreen,b.propScore];return(Math.max(...sb)-Math.min(...sb))-(Math.max(...sa)-Math.min(...sa));});
    else if(matrixSort==='eu') cos.sort((a,b)=>b.euAlign-a.euAlign);
    else if(matrixSort==='ftse') cos.sort((a,b)=>b.ftseGreen-a.ftseGreen);
    else if(matrixSort==='prop') cos.sort((a,b)=>b.propScore-a.propScore);
    return cos;
  },[filterCat,filterThreshold,filterTax,matrixSort]);

  const disagreementCos = useMemo(()=> COMPANIES.filter(c=>{
    const scores = [c.euAlign, cbiNum(c), c.ftseGreen, c.propScore];
    return Math.max(...scores)-Math.min(...scores) > 45;
  }).sort((a,b)=>{
    const sa=[a.euAlign,cbiNum(a),a.ftseGreen,a.propScore],sb=[b.euAlign,cbiNum(b),b.ftseGreen,b.propScore];
    return(Math.max(...sb)-Math.min(...sb))-(Math.max(...sa)-Math.min(...sa));
  }),[]);

  const versionUpdates = [
    {date:'2024-06',taxonomy:'EU Taxonomy',update:'Delegated Act amendment: added nuclear and gas transition activities with specific criteria and sunset clauses',color:T.navy},
    {date:'2024-03',taxonomy:'CBI Taxonomy',update:'Version 4.0: updated cement, steel, and aluminum criteria; new shipping pathway; hydrogen thresholds revised',color:T.sage},
    {date:'2024-01',taxonomy:'FTSE Green Rev',update:'Classification 3.0: expanded to 10 tiers, added blue hydrogen distinction, updated EV supply chain criteria',color:T.gold},
    {date:'2023-11',taxonomy:'EU Taxonomy',update:'Environmental Delegated Act: water, circular economy, pollution prevention, biodiversity objectives criteria published',color:T.navy},
    {date:'2023-09',taxonomy:'Proprietary',update:'Model v2.5: integrated forward-looking capex alignment, transition pathway scoring, and stranded asset risk factors',color:T.navyL},
    {date:'2023-06',taxonomy:'CBI Taxonomy',update:'Added hydrogen production criteria, updated forestry/land use pathways, new waste management sector',color:T.sage},
    {date:'2023-03',taxonomy:'FTSE Green Rev',update:'Added climate adaptation revenues, expanded nature-based solutions definition, new data centre efficiency tier',color:T.gold},
    {date:'2022-12',taxonomy:'EU Taxonomy',update:'Platform on Sustainable Finance extended taxonomy recommendations including transition and amber categories',color:T.navy},
  ];

  const heatColor = (val)=>{
    if(val>=80) return '#16a34a22';
    if(val>=60) return '#16a34a12';
    if(val>=40) return '#d9770612';
    if(val>=20) return '#d9770620';
    return '#dc262612';
  };

  return (
    <div>
      <div style={{display:'flex',gap:12,flexWrap:'wrap',marginBottom:16}}>
        <Kpi label="Matrix Size" value={`${filteredCos.length} \u00d7 4`} sub="companies x taxonomies" />
        <Kpi label="High Disagreement" value={disagreementCos.length} sub="companies with >45pt spread" color={T.red} />
        <Kpi label="Full Consensus" value={COMPANIES.filter(c=>{const s=[c.euAlign,cbiNum(c),c.ftseGreen,c.propScore];return Math.max(...s)-Math.min(...s)<20;}).length} sub="<20pt spread" color={T.green} />
        <Kpi label="Latest Update" value="Jun 2024" sub="EU Delegated Act amendment" color={T.navyL} />
      </div>

      <div style={{display:'flex',gap:8,marginBottom:16,flexWrap:'wrap',alignItems:'center'}}>
        <select value={filterCat} onChange={e=>setFilterCat(e.target.value)} style={select}>
          <option value="all">All Categories</option>
          {CATEGORIES.map(c=><option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
        </select>
        <select value={filterTax} onChange={e=>setFilterTax(e.target.value)} style={select}>
          <option value="eu">EU Taxonomy</option><option value="ftse">FTSE Green Rev</option><option value="prop">Proprietary Score</option>
        </select>
        <span style={{fontSize:12,color:T.textMut}}>Min:</span>
        <input type="range" min={0} max={100} value={filterThreshold} onChange={e=>setFilterThreshold(+e.target.value)} style={{width:100}} />
        <span style={{fontSize:12,color:T.text,fontFamily:T.mono,minWidth:32}}>{filterThreshold}%</span>
        <select value={matrixSort} onChange={e=>setMatrixSort(e.target.value)} style={select}>
          <option value="spread">Sort: Spread</option><option value="eu">Sort: EU</option><option value="ftse">Sort: FTSE</option><option value="prop">Sort: Proprietary</option>
        </select>
        <button style={btn(showDisagreement)} onClick={()=>setShowDisagreement(!showDisagreement)}>
          {showDisagreement?'Show Matrix':'Disagreement Analysis'}
        </button>
      </div>

      {!showDisagreement ? (
        <div style={{...card,overflowX:'auto'}}>
          <div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:12}}>Alignment Heatmap ({filteredCos.length} companies)</div>
          <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
            <thead>
              <tr>
                <th style={{...th,minWidth:180}}>Company</th>
                <th style={{...th,width:80}}>Sector</th>
                <th style={{...th,width:95}}>EU Taxonomy</th>
                <th style={{...th,width:105}}>CBI Taxonomy</th>
                <th style={{...th,width:95}}>FTSE Green</th>
                <th style={{...th,width:90}}>Proprietary</th>
                <th style={{...th,width:70}}>Spread</th>
              </tr>
            </thead>
            <tbody>
              {filteredCos.slice(0,60).map(c=>{
                const scores = [c.euAlign, cbiNum(c), c.ftseGreen, c.propScore];
                const spread = Math.max(...scores)-Math.min(...scores);
                return (
                  <tr key={c.id} onClick={()=>setSelCell(selCell===c.id?null:c.id)} style={{cursor:'pointer',background:selCell===c.id?T.surfaceH:'transparent',transition:'background 0.15s'}}>
                    <td style={td}><span style={{fontWeight:600}}>{c.name}</span></td>
                    <td style={{...td,fontSize:11}}>{c.sector}</td>
                    <td style={{...td,background:heatColor(c.euAlign),textAlign:'center',fontWeight:600,fontFamily:T.mono}}>{c.euAlign}%</td>
                    <td style={{...td,background:heatColor(cbiNum(c)),textAlign:'center'}}>
                      <span style={badge(cbiNum(c)>60?T.green+'15':cbiNum(c)>35?T.amber+'15':T.red+'15', cbiNum(c)>60?T.green:cbiNum(c)>35?T.amber:T.red)}>{c.cbiClass}</span>
                    </td>
                    <td style={{...td,background:heatColor(c.ftseGreen),textAlign:'center',fontWeight:600,fontFamily:T.mono}}>{c.ftseGreen}%</td>
                    <td style={{...td,background:heatColor(c.propScore),textAlign:'center',fontWeight:600,fontFamily:T.mono}}>{c.propScore}</td>
                    <td style={{...td,textAlign:'center',fontWeight:700,color:spread>45?T.red:spread>25?T.amber:T.green,fontFamily:T.mono}}>{spread}pt</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filteredCos.length>60 && <div style={{fontSize:11,color:T.textMut,padding:8}}>Showing 60 of {filteredCos.length}. Apply filters to narrow results.</div>}

          {selCell && (()=>{
            const c = COMPANIES.find(co=>co.id===selCell);
            if(!c) return null;
            const scores=[c.euAlign,cbiNum(c),c.ftseGreen,c.propScore];
            const taxLabels=['EU Taxonomy','CBI Taxonomy','FTSE Green Rev','Proprietary'];
            return (
              <div style={{marginTop:16,padding:16,background:T.surfaceH,borderRadius:10,border:`1px solid ${T.border}`}}>
                <div style={{fontSize:14,fontWeight:700,color:T.navy,marginBottom:12}}>Detailed Assessment: {c.name}</div>
                <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))',gap:12,marginBottom:12}}>
                  {taxLabels.map((tl,i)=>(
                    <div key={tl} style={{padding:12,background:T.surface,borderRadius:8,border:`1px solid ${T.border}`}}>
                      <div style={{fontSize:11,fontWeight:700,color:T.textMut,marginBottom:4}}>{tl.toUpperCase()}</div>
                      <div style={{fontSize:22,fontWeight:800,color:scores[i]>60?T.green:scores[i]>30?T.amber:T.red,fontFamily:T.mono}}>
                        {i===1?c.cbiClass:scores[i]+(i===3?'/100':'%')}
                      </div>
                      <div style={{fontSize:11,color:T.textSec,marginTop:4}}>
                        {i===0?`${c.euActivities} eligible activities | DNSH: ${c.euAlign>50?'Pass':'Partial'}`:
                         i===1?`Pathway: ${c.cbiPathway} | Standard v4.0`:
                         i===2?`Tier ${c.ftseTier}/5 | Classification 3.0`:
                         `Model v2.5 | Confidence: ${c.propScore>60?'High':'Medium'}`}
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{fontSize:12,color:T.textSec}}>
                  <strong>Categories:</strong> {c.catIds.map(cid=>CAT_MAP[cid]?.name).join(', ')} |
                  <strong> Green Revenue:</strong> {c.greenRevPct}% |
                  <strong> TRL:</strong> {c.trl} |
                  <strong> Max-Min Spread:</strong> <span style={{fontWeight:700,color:T.red}}>{Math.max(...scores)-Math.min(...scores)}pt</span>
                </div>
              </div>
            );
          })()}
        </div>
      ) : (
        <div style={card}>
          <div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:12}}>Taxonomy Disagreement Analysis ({disagreementCos.length} companies with &gt;45pt spread)</div>
          <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
            <thead><tr>
              <th style={th}>Company</th><th style={th}>EU</th><th style={th}>CBI</th><th style={th}>FTSE</th><th style={th}>Prop</th><th style={th}>Spread</th><th style={{...th,minWidth:220}}>Root Cause</th>
            </tr></thead>
            <tbody>
              {disagreementCos.slice(0,35).map(c=>{
                const scores=[c.euAlign,cbiNum(c),c.ftseGreen,c.propScore];
                const spread=Math.max(...scores)-Math.min(...scores);
                const maxIdx=scores.indexOf(Math.max(...scores));
                const minIdx=scores.indexOf(Math.min(...scores));
                const taxNames=['EU','CBI','FTSE','Proprietary'];
                let cause='Threshold calibration differences';
                if(maxIdx===0&&minIdx===2) cause='EU includes capex plans; FTSE counts revenue only';
                else if(maxIdx===3&&minIdx===1) cause='Proprietary weights transition intent; CBI has strict bond criteria';
                else if(maxIdx===2&&minIdx===0) cause='FTSE broader green definitions vs EU strict technical screening';
                else if(maxIdx===0) cause='EU Delegated Act coverage may include transition activities others exclude';
                else if(minIdx===0) cause='Sector not yet covered by EU Delegated Acts';
                return (
                  <tr key={c.id}>
                    <td style={{...td,fontWeight:600,fontSize:11}}>{c.name}</td>
                    <td style={{...td,textAlign:'center',fontFamily:T.mono}}>{c.euAlign}%</td>
                    <td style={{...td,fontSize:11}}>{c.cbiClass}</td>
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
        <div style={{position:'relative',paddingLeft:24}}>
          {versionUpdates.map((v,i)=>(
            <div key={i} style={{display:'flex',gap:12,marginBottom:18,position:'relative'}}>
              <div style={{position:'absolute',left:-24,top:3,width:12,height:12,borderRadius:'50%',background:v.color,border:`2px solid ${T.surface}`,zIndex:1}} />
              {i<versionUpdates.length-1 && <div style={{position:'absolute',left:-19,top:16,width:2,height:'calc(100% + 6px)',background:T.border}} />}
              <div>
                <div style={{display:'flex',gap:8,alignItems:'center',marginBottom:4}}>
                  <span style={{fontSize:12,fontWeight:700,color:T.navy,fontFamily:T.mono}}>{v.date}</span>
                  <span style={badge(v.color+'15',v.color)}>{v.taxonomy}</span>
                </div>
                <div style={{fontSize:12,color:T.textSec,lineHeight:1.5}}>{v.update}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Tab 4: Portfolio Solution Screening
   ═══════════════════════════════════════════════════════════════ */
function TabPortfolioScreening(){
  const [screenType, setScreenType] = useState('pure_play');
  const [customMinGreen, setCustomMinGreen] = useState(30);
  const [customCat, setCustomCat] = useState('all');
  const [customTax, setCustomTax] = useState('eu');
  const [customMinAlign, setCustomMinAlign] = useState(50);
  const [showBuilder, setShowBuilder] = useState(false);
  const [builderWeights, setBuilderWeights] = useState({greenRev:40,euAlign:25,propScore:20,trl:15});
  const [exportReady, setExportReady] = useState(false);
  const [sortCol, setSortCol] = useState('greenRevPct');

  const screens = {
    pure_play:{name:'Pure-Play Climate Solutions',desc:'Companies with >75% green revenue \u2014 deep climate solution providers',filter:c=>c.greenRevPct>75},
    transition:{name:'Transition Leaders',desc:'Companies with 30-75% green revenue \u2014 actively transitioning business models',filter:c=>c.greenRevPct>=30 && c.greenRevPct<=75},
    laggard:{name:'Climate Laggards',desc:'Companies with <10% green revenue \u2014 minimal climate solution exposure',filter:c=>c.greenRevPct<10},
    custom:{name:'Custom Screen',desc:'User-defined multi-criteria screening with taxonomy alignment thresholds',filter:c=>{
      let pass = c.greenRevPct>=customMinGreen;
      if(customCat!=='all') pass = pass && c.catIds.includes(customCat);
      if(customTax==='eu') pass = pass && c.euAlign>=customMinAlign;
      if(customTax==='ftse') pass = pass && c.ftseGreen>=customMinAlign;
      if(customTax==='prop') pass = pass && c.propScore>=customMinAlign;
      return pass;
    }},
  };

  const screened = useMemo(()=>{
    let cos = COMPANIES.filter(screens[screenType].filter);
    if(sortCol==='euAlign') cos.sort((a,b)=>b.euAlign-a.euAlign);
    else if(sortCol==='propScore') cos.sort((a,b)=>b.propScore-a.propScore);
    else if(sortCol==='mktCap') cos.sort((a,b)=>b.mktCap-a.mktCap);
    else cos.sort((a,b)=>b.greenRevPct-a.greenRevPct);
    return cos;
  },[screenType,customMinGreen,customCat,customTax,customMinAlign,sortCol]);

  const sectorBreakdown = useMemo(()=>{
    const map={};
    screened.forEach(c=>{map[c.sector]=(map[c.sector]||0)+1;});
    return Object.entries(map).map(([name,value])=>({name,value})).sort((a,b)=>b.value-a.value);
  },[screened]);

  const catBreakdown = useMemo(()=>{
    const map={};
    screened.forEach(c=>c.catIds.forEach(cid=>{map[cid]=(map[cid]||0)+1;}));
    return Object.entries(map).map(([id,value])=>({name:CAT_MAP[id]?.name||id,value,color:CAT_MAP[id]?.color||T.navy})).sort((a,b)=>b.value-a.value);
  },[screened]);

  const countryBreakdown = useMemo(()=>{
    const map={};
    screened.forEach(c=>{map[c.country]=(map[c.country]||0)+1;});
    return Object.entries(map).map(([name,value])=>({name,value})).sort((a,b)=>b.value-a.value).slice(0,10);
  },[screened]);

  const benchmarks = useMemo(()=>{
    const all = COMPANIES;
    const avg = (arr,fn)=>arr.length?Math.round(arr.reduce((s,c)=>s+fn(c),0)/arr.length):0;
    return [
      {metric:'Green Revenue %', screened:avg(screened,c=>c.greenRevPct), universe:avg(all,c=>c.greenRevPct)},
      {metric:'EU Taxonomy Alignment', screened:avg(screened,c=>c.euAlign), universe:avg(all,c=>c.euAlign)},
      {metric:'FTSE Green Revenue', screened:avg(screened,c=>c.ftseGreen), universe:avg(all,c=>c.ftseGreen)},
      {metric:'Proprietary Score', screened:avg(screened,c=>c.propScore), universe:avg(all,c=>c.propScore)},
      {metric:'Avg TRL', screened:avg(screened,c=>c.trl), universe:avg(all,c=>c.trl)},
      {metric:'Company Count', screened:screened.length, universe:all.length},
      {metric:'Avg Mkt Cap ($M)', screened:avg(screened,c=>c.mktCap), universe:avg(all,c=>c.mktCap)},
    ].map(b=>({...b,diff:b.screened-b.universe}));
  },[screened]);

  const builderScored = useMemo(()=>{
    if(!showBuilder) return [];
    const w = builderWeights;
    const total = w.greenRev+w.euAlign+w.propScore+w.trl;
    if(total===0) return screened.map(c=>({...c,compositeScore:0}));
    return screened.map(c=>({
      ...c,
      compositeScore: Math.round(
        (c.greenRevPct*(w.greenRev/total)) + (c.euAlign*(w.euAlign/total)) + (c.propScore*(w.propScore/total)) + ((c.trl/9*100)*(w.trl/total))
      ),
    })).sort((a,b)=>b.compositeScore-a.compositeScore);
  },[screened,showBuilder,builderWeights]);

  const handleExport = useCallback(()=>{
    const headers = ['Name','Sector','Country','Green Rev %','EU Alignment %','CBI Class','FTSE Green %','Prop Score','TRL','Mkt Cap ($M)','Revenue ($M)','Employees','Founded','Categories'];
    const rows = screened.map(c=>[c.name,c.sector,c.country,c.greenRevPct,c.euAlign,c.cbiClass,c.ftseGreen,c.propScore,c.trl,c.mktCap,c.revenue,c.employees,c.founded,c.catIds.map(id=>CAT_MAP[id]?.name).join(';')]);
    const csv = [headers.join(','), ...rows.map(r=>r.map(v=>typeof v==='string'&&v.includes(',')?`"${v}"`:v).join(','))].join('\n');
    const blob = new Blob([csv],{type:'text/csv'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href=url; a.download=`climate_solution_screen_${screenType}_${Date.now()}.csv`; a.click();
    URL.revokeObjectURL(url);
    setExportReady(true);
    setTimeout(()=>setExportReady(false),3000);
  },[screened,screenType]);

  return (
    <div>
      <div style={{display:'flex',gap:12,flexWrap:'wrap',marginBottom:16}}>
        <Kpi label="Screened Companies" value={screened.length} sub={`of 150 (${Math.round(screened.length/150*100)}% pass rate)`} />
        <Kpi label="Avg Green Revenue" value={screened.length?Math.round(screened.reduce((s,c)=>s+c.greenRevPct,0)/screened.length):0} sub="% of revenue" color={T.sage} />
        <Kpi label="Avg EU Alignment" value={screened.length?Math.round(screened.reduce((s,c)=>s+c.euAlign,0)/screened.length):0} sub="% aligned" color={T.navyL} />
        <Kpi label="Sectors Covered" value={new Set(screened.map(c=>c.sector)).size} sub="of 10 sectors" color={T.gold} />
      </div>

      <div style={{display:'flex',gap:6,marginBottom:16,flexWrap:'wrap',alignItems:'center'}}>
        <span style={{fontSize:12,fontWeight:600,color:T.textMut}}>Pre-built screens:</span>
        {Object.entries(screens).map(([k,v])=>(
          <button key={k} style={btn(screenType===k)} onClick={()=>setScreenType(k)}>{v.name}</button>
        ))}
      </div>
      <div style={{fontSize:12,color:T.textSec,marginBottom:12,fontStyle:'italic'}}>{screens[screenType].desc}</div>

      {screenType==='custom' && (
        <div style={{...card,background:T.surfaceH}}>
          <div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:12}}>Custom Screen Configuration</div>
          <div style={{display:'flex',gap:20,flexWrap:'wrap',alignItems:'flex-start'}}>
            <div style={{minWidth:160}}>
              <div style={{fontSize:11,color:T.textMut,marginBottom:4}}>Min Green Revenue %</div>
              <div style={{display:'flex',alignItems:'center',gap:8}}>
                <input type="range" min={0} max={100} value={customMinGreen} onChange={e=>setCustomMinGreen(+e.target.value)} style={{width:120}} />
                <span style={{fontSize:13,fontFamily:T.mono,fontWeight:600}}>{customMinGreen}%</span>
              </div>
            </div>
            <div style={{minWidth:160}}>
              <div style={{fontSize:11,color:T.textMut,marginBottom:4}}>Climate Solution Category</div>
              <select value={customCat} onChange={e=>setCustomCat(e.target.value)} style={select}>
                <option value="all">All Categories</option>
                {CATEGORIES.map(c=><option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
              </select>
            </div>
            <div style={{minWidth:140}}>
              <div style={{fontSize:11,color:T.textMut,marginBottom:4}}>Taxonomy System</div>
              <select value={customTax} onChange={e=>setCustomTax(e.target.value)} style={select}>
                <option value="eu">EU Taxonomy</option><option value="ftse">FTSE Green Rev</option><option value="prop">Proprietary Score</option>
              </select>
            </div>
            <div style={{minWidth:160}}>
              <div style={{fontSize:11,color:T.textMut,marginBottom:4}}>Min Taxonomy Alignment</div>
              <div style={{display:'flex',alignItems:'center',gap:8}}>
                <input type="range" min={0} max={100} value={customMinAlign} onChange={e=>setCustomMinAlign(+e.target.value)} style={{width:120}} />
                <span style={{fontSize:13,fontFamily:T.mono,fontWeight:600}}>{customMinAlign}%</span>
              </div>
            </div>
          </div>
        </div>
      )}

      <div style={{display:'flex',gap:16,flexWrap:'wrap',marginBottom:16}}>
        <div style={{...card,flex:1,minWidth:280}}>
          <div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:8}}>Sector Distribution</div>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={sectorBreakdown} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={75}
                label={({name,percent})=> percent>0.05?`${name} ${(percent*100).toFixed(0)}%`:''} labelLine={false} style={{fontSize:10}}>
                {sectorBreakdown.map((_,i)=><Cell key={i} fill={PIE_COLORS[i%PIE_COLORS.length]} />)}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div style={{...card,flex:1,minWidth:280}}>
          <div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:8}}>Solution Category Exposure</div>
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

        <div style={{...card,flex:1,minWidth:280}}>
          <div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:8}}>Geographic Distribution</div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={countryBreakdown} margin={{bottom:20}}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="name" tick={{fontSize:11}} />
              <YAxis tick={{fontSize:11}} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" name="Companies" fill={T.navyL} radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={card}>
        <div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:8}}>Benchmark Comparison: Screened Portfolio vs Full Universe</div>
        <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
          <thead><tr><th style={th}>Metric</th><th style={th}>Screened Portfolio</th><th style={th}>Full Universe (150)</th><th style={th}>Difference</th></tr></thead>
          <tbody>
            {benchmarks.map(b=>(
              <tr key={b.metric}>
                <td style={{...td,fontWeight:600}}>{b.metric}</td>
                <td style={{...td,textAlign:'center',fontFamily:T.mono,fontWeight:700,color:T.navy}}>{b.screened.toLocaleString()}</td>
                <td style={{...td,textAlign:'center',fontFamily:T.mono}}>{b.universe.toLocaleString()}</td>
                <td style={{...td,textAlign:'center',fontFamily:T.mono,fontWeight:700,color:b.diff>0?T.green:b.diff<0?T.red:T.textMut}}>
                  {b.diff>0?'+':''}{b.diff.toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{display:'flex',gap:8,marginBottom:16,flexWrap:'wrap'}}>
        <button style={btn(showBuilder)} onClick={()=>setShowBuilder(!showBuilder)}>
          {showBuilder?'Hide Construction Tool':'Portfolio Construction Tool'}
        </button>
        <button style={{...btn(false),borderColor:T.sage,color:T.sage}} onClick={handleExport}>
          {exportReady?'\u2705 CSV Exported Successfully!':'Export Screened Portfolio as CSV'}
        </button>
        <span style={{fontSize:11,color:T.textMut,alignSelf:'center'}}>{screened.length} companies will be exported</span>
      </div>

      {showBuilder && (
        <div style={{...card,border:`2px solid ${T.navy}`}}>
          <div style={{fontSize:15,fontWeight:800,color:T.navy,marginBottom:4}}>Portfolio Construction Tool</div>
          <div style={{fontSize:12,color:T.textSec,marginBottom:16}}>Adjust scoring weights to optimize company selection. Companies are scored on a composite basis and ranked.</div>

          <div style={{display:'flex',gap:20,flexWrap:'wrap',marginBottom:16}}>
            {Object.entries(builderWeights).map(([k,v])=>(
              <div key={k} style={{flex:1,minWidth:140}}>
                <div style={{fontSize:11,fontWeight:600,color:T.textMut,marginBottom:4}}>
                  {k==='greenRev'?'Green Revenue %':k==='euAlign'?'EU Alignment':k==='propScore'?'Proprietary Score':'Tech Readiness (TRL)'}
                </div>
                <input type="range" min={0} max={100} value={v} onChange={e=>setBuilderWeights({...builderWeights,[k]:+e.target.value})} style={{width:'100%'}} />
                <div style={{fontSize:13,fontFamily:T.mono,textAlign:'center',fontWeight:600}}>{v}%</div>
              </div>
            ))}
          </div>

          <div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:8}}>Top 25 Composite-Scored Companies</div>
          <div style={{overflowX:'auto'}}>
            <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
              <thead><tr>
                <th style={th}>#</th><th style={th}>Company</th><th style={th}>Sector</th><th style={th}>Composite</th>
                <th style={th}>Green Rev</th><th style={th}>EU Align</th><th style={th}>Prop Score</th><th style={th}>TRL</th><th style={th}>Mkt Cap</th>
              </tr></thead>
              <tbody>
                {builderScored.slice(0,25).map((c,i)=>(
                  <tr key={c.id} style={{background:i<3?T.green+'06':'transparent'}}>
                    <td style={{...td,fontFamily:T.mono,color:i<3?T.green:T.textMut,fontWeight:i<3?700:400}}>{i+1}</td>
                    <td style={{...td,fontWeight:600}}>{c.name}</td>
                    <td style={{...td,fontSize:11}}>{c.sector}</td>
                    <td style={{...td,textAlign:'center'}}>
                      <div style={{display:'flex',alignItems:'center',gap:6}}>
                        <div style={{flex:1,height:8,borderRadius:4,background:T.border}}>
                          <div style={{height:8,borderRadius:4,background:c.compositeScore>70?T.green:c.compositeScore>50?T.sage:T.amber,width:`${c.compositeScore}%`,transition:'width 0.3s'}} />
                        </div>
                        <span style={{fontFamily:T.mono,fontWeight:700,fontSize:12,minWidth:28}}>{c.compositeScore}</span>
                      </div>
                    </td>
                    <td style={{...td,textAlign:'center',fontFamily:T.mono}}>{c.greenRevPct}%</td>
                    <td style={{...td,textAlign:'center',fontFamily:T.mono}}>{c.euAlign}%</td>
                    <td style={{...td,textAlign:'center',fontFamily:T.mono}}>{c.propScore}</td>
                    <td style={{...td,textAlign:'center',fontFamily:T.mono}}>{c.trl}</td>
                    <td style={{...td,textAlign:'right',fontFamily:T.mono,fontSize:11}}>${c.mktCap.toLocaleString()}M</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div style={card}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
          <div style={{fontSize:13,fontWeight:700,color:T.navy}}>Screened Companies ({screened.length})</div>
          <div style={{display:'flex',gap:6}}>
            <span style={{fontSize:11,color:T.textMut}}>Sort:</span>
            {[['greenRevPct','Green Rev'],['euAlign','EU Align'],['propScore','Prop Score'],['mktCap','Mkt Cap']].map(([k,l])=>(
              <button key={k} onClick={()=>setSortCol(k)} style={{...btn(sortCol===k),padding:'4px 10px',fontSize:11}}>{l}</button>
            ))}
          </div>
        </div>
        <div style={{overflowX:'auto'}}>
          <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
            <thead><tr>
              <th style={th}>Company</th><th style={th}>Sector</th><th style={th}>Country</th><th style={th}>Green Rev %</th>
              <th style={th}>EU Align</th><th style={th}>CBI Class</th><th style={th}>FTSE Green</th><th style={th}>Prop Score</th>
              <th style={th}>TRL</th><th style={th}>Categories</th>
            </tr></thead>
            <tbody>
              {screened.slice(0,45).map(c=>(
                <tr key={c.id}>
                  <td style={{...td,fontWeight:600}}>{c.name}</td>
                  <td style={{...td,fontSize:11}}>{c.sector}</td>
                  <td style={td}>{c.country}</td>
                  <td style={{...td,textAlign:'center'}}>
                    <div style={{display:'flex',alignItems:'center',gap:4}}>
                      <div style={{width:40,height:6,borderRadius:3,background:T.border}}>
                        <div style={{height:6,borderRadius:3,background:c.greenRevPct>60?T.green:c.greenRevPct>30?T.amber:T.red,width:`${c.greenRevPct}%`}} />
                      </div>
                      <span style={{fontFamily:T.mono,fontWeight:700,color:c.greenRevPct>60?T.green:c.greenRevPct>30?T.amber:T.red}}>{c.greenRevPct}%</span>
                    </div>
                  </td>
                  <td style={{...td,textAlign:'center',fontFamily:T.mono}}>{c.euAlign}%</td>
                  <td style={td}><span style={badge(c.cbiClass==='Aligned'?T.green+'15':c.cbiClass==='Partially Aligned'?T.amber+'15':T.red+'15',
                    c.cbiClass==='Aligned'?T.green:c.cbiClass==='Partially Aligned'?T.amber:T.red)}>{c.cbiClass}</span></td>
                  <td style={{...td,textAlign:'center',fontFamily:T.mono}}>{c.ftseGreen}%</td>
                  <td style={{...td,textAlign:'center',fontFamily:T.mono}}>{c.propScore}</td>
                  <td style={{...td,textAlign:'center',fontFamily:T.mono}}>{c.trl}</td>
                  <td style={{...td,fontSize:10}}>{c.catIds.slice(0,2).map(id=>CAT_MAP[id]?.name).join(', ')}{c.catIds.length>2?` +${c.catIds.length-2}`:''}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {screened.length>45 && <div style={{fontSize:11,color:T.textMut,padding:8}}>Showing 45 of {screened.length}. Export CSV for full dataset.</div>}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Main Page Component
   ═══════════════════════════════════════════════════════════════ */
const TABS = [
  { id:'classifier', label:'Taxonomy Classifier', icon:'\ud83c\udf0d' },
  { id:'categories', label:'Solution Category Explorer', icon:'\ud83d\udcca' },
  { id:'matrix', label:'Taxonomy Alignment Matrix', icon:'\ud83d\uddd3\ufe0f' },
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
            <span style={{fontSize:28}}>{'\ud83c\udf0d'}</span>
            <div>
              <h1 style={{margin:0,fontSize:22,fontWeight:800,color:T.navy,letterSpacing:'-0.3px'}}>Climate Solution Taxonomy & Classification</h1>
              <p style={{margin:'4px 0 0',fontSize:13,color:T.textSec,lineHeight:1.5}}>
                EP-AO5 | Classify companies and products by climate solution contribution across EU Taxonomy, CBI Taxonomy, FTSE Green Revenue, and proprietary classification systems
              </p>
            </div>
          </div>
          <div style={{display:'flex',gap:6,marginTop:10,flexWrap:'wrap'}}>
            <span style={badge(T.navy+'12',T.navy)}>150 Companies Classified</span>
            <span style={badge(T.sage+'12',T.sage)}>4 Taxonomy Systems</span>
            <span style={badge(T.gold+'12',T.gold)}>12 Climate Solution Categories</span>
            <span style={badge(T.navyL+'12',T.navyL)}>9 Technology Readiness Levels</span>
            <span style={badge(T.red+'10',T.red)}>Real-Time Disagreement Flags</span>
          </div>
        </div>

        {/* Tab Bar */}
        <div style={{display:'flex',gap:4,marginBottom:20,borderBottom:`2px solid ${T.border}`,paddingBottom:0,overflowX:'auto'}}>
          {TABS.map(t=>(
            <button key={t.id} onClick={()=>setTab(t.id)} style={{
              padding:'10px 20px', border:'none',
              borderBottom:tab===t.id?`3px solid ${T.navy}`:'3px solid transparent',
              background:tab===t.id?T.surface:'transparent',
              color:tab===t.id?T.navy:T.textSec,
              fontSize:13, fontWeight:tab===t.id?700:500,
              cursor:'pointer', fontFamily:T.font,
              borderRadius:'8px 8px 0 0', transition:'all 0.2s', whiteSpace:'nowrap',
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
        <div style={{marginTop:32,paddingTop:16,borderTop:`1px solid ${T.border}`,display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:8}}>
          <div style={{fontSize:11,color:T.textMut}}>
            Climate Solution Taxonomy v1.0 | EU Taxonomy Delegated Act 2024 | CBI Standard v4.0 | FTSE Green Revenue Classification 3.0 | Proprietary Model v2.5
          </div>
          <div style={{fontSize:11,color:T.textMut}}>
            Data as of Q1 2025 | 150 companies | 4 taxonomy systems | 12 solution categories | 20 countries
          </div>
        </div>
      </div>
    </div>
  );
}
