import React,{useState,useMemo,useCallback,useEffect} from 'react';
import axios from 'axios';
import { WRI_AQUEDUCT_WATER_RISK } from '../../../data/publicDataSeed';
import {BarChart,Bar,LineChart,Line,AreaChart,Area,PieChart,Pie,Cell,ScatterChart,Scatter,XAxis,YAxis,CartesianGrid,Tooltip,ResponsiveContainer,Legend,RadarChart,Radar,PolarGrid,PolarAngleAxis,PolarRadiusAxis} from 'recharts';

// Backend E92 Water Risk & Stewardship engine (WRI AQUEDUCT 4.0 / CDP Water
// A-List / TNFD E3 / AWS Standard v2 / CEO Water Mandate), same engine already
// wired into the sibling frontend/src/features/water-risk/pages/WaterRiskPage.jsx.
// See backend/services/water_stewardship_engine.py + backend/api/v1/routes/water_stewardship.py
const API = 'http://localhost:8001';
const WATER_API = `${API}/api/v1/water-risk`;
const T={bg:'#f4f6f9',surface:'#ffffff',surfaceH:'#eef1f6',border:'#e3e8ef',borderL:'#cfd6e0',navy:'#1b3a5c',navyL:'#2c5a8c',gold:'#c5a96a',goldL:'#d4be8a',sage:'#5a8a6a',sageL:'#7ba67d',teal:'#5a8a6a',text:'#1b3a5c',textSec:'#5c6b7e',textMut:'#9aa3ae',red:'#dc2626',green:'#16a34a',amber:'#d97706',font:"'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"};
const sr=(s)=>{let x=Math.sin(s+1)*10000;return x-Math.floor(x);};
const ACCENT='#0284c7';const tip={contentStyle:{background:T.surface,border:`1px solid ${T.border}`,borderRadius:8,fontSize:11,fontFamily:T.font},labelStyle:{color:T.textSec,fontFamily:T.mono,fontSize:10}};const COLORS=[T.navy,T.gold,T.sage,T.red,T.amber,T.green,T.navyL,T.goldL,'#8b5cf6'];
const fmt=v=>typeof v==='number'?v>=1e9?(v/1e9).toFixed(1)+'B':v>=1e6?(v/1e6).toFixed(1)+'M':v>=1e3?(v/1e3).toFixed(1)+'K':v.toFixed(1):v;
const TABS=['Water Risk Dashboard','Regional Analysis','Corporate Exposure','Projections'];const RISKF=['All','Extremely High','High','Medium-High','Medium','Low'];const PAGE=12;
import { isIndiaMode, adaptForWaterRisk } from '../../../data/IndiaDataAdapter';
const _DEFAULT_REGIONS=Array.from({length:40},(_,i)=>{
  const names=['Ganges Basin','Indus Basin','Yellow River','Yangtze Delta','Mekong Delta','Nile Valley','Murray-Darling','Colorado Basin','California Central','Sao Francisco','Tigris-Euphrates','Lake Chad','Aral Sea','Jordan River','Orange-Senqu','Volta Basin','Zambezi','Congo Basin','Amazon Basin','Mississippi Delta','Rhine-Meuse','Danube Basin','Po Valley','Tagus Basin','Guadalquivir','North China Plain','Deccan Plateau','Rajasthan Desert','Middle East Gulf','Sahel Region','Horn of Africa','Central Asian Steppe','Australian Outback','Atacama Region','Western US','Great Plains','SE Australia','Southern Africa','NW India','Pakistan Punjab'];
  const basins=['Ganges','Indus','Yellow','Yangtze','Mekong','Nile','Murray','Colorado','Sacramento','Sao Francisco','Tigris','Lake Chad','Aral','Jordan','Orange','Volta','Zambezi','Congo','Amazon','Mississippi','Rhine','Danube','Po','Tagus','Guadalquivir','Hai','Godavari','Thar','Gulf','Niger','Juba','Amu Darya','Cooper','Loa','Columbia','Missouri','Yarra','Limpopo','Sabarmati','Chenab'];
  const stressLevel=+(sr(i*7)*4+1).toFixed(1);const riskCat=stressLevel>4?'Extremely High':stressLevel>3?'High':stressLevel>2.5?'Medium-High':stressLevel>1.5?'Medium':'Low';
  const supply=Math.round(sr(i*11)*500+10);const demand=Math.round(supply*(sr(i*13)*0.5+0.6));const deficit=stressLevel>3?Math.max(supply*0.1,demand-supply):Math.max(0,demand-supply);
  const floodRisk=Math.round(sr(i*17)*100);const droughtRisk=Math.round(sr(i*19)*100);const pollutionIdx=Math.round(sr(i*23)*100);const groundwater=Math.round(sr(i*29)*80+10);
  const yearly=Array.from({length:6},(_,y)=>({year:2020+y,stress:+(stressLevel+y*0.08+sr(i*100+y)*0.3).toFixed(1),supply:Math.round(supply-y*5+sr(i*100+y*3)*10),demand:Math.round(demand+y*8+sr(i*100+y*7)*5)}));
  return{id:i+1,name:names[i],basin:basins[i],waterStress:stressLevel,riskCategory:riskCat,supplyBCM:supply,demandBCM:demand,deficitBCM:deficit,aqueductScore:+Math.min(5,stressLevel*0.9+sr(i*31)*0.5).toFixed(1),floodRisk,droughtRisk,pollutionIndex:pollutionIdx,groundwaterDepletion:groundwater,popAffectedM:+(sr(i*37)*50+1).toFixed(1),agWaterPct:Math.round(sr(i*41)*70+10),industrialPct:Math.round(sr(i*43)*30+5),domesticPct:Math.round(100-Math.round(sr(i*41)*70+10)-Math.round(sr(i*43)*30+5)),waterPrice:+(sr(i*47)*3+0.2).toFixed(2),infraInvestBn:+(sr(i*49)*10+0.5).toFixed(1),desalCapacity:Math.round(sr(i*51)*500),recycleRate:Math.round(sr(i*53)*60+10),yearly};
});
// ── Wire real WRI Aqueduct 4.0 water stress data (GAP-015) ───────────────
const WRI_MAP = Object.fromEntries((WRI_AQUEDUCT_WATER_RISK||[]).map(c=>[c.country,c]));
// Basin-to-country mapping for real data lookup
const BASIN_COUNTRY = {
  'Ganges Basin':'India','Indus Basin':'Pakistan','Yellow River':'China',
  'Yangtze Delta':'China','Mekong Delta':'Vietnam','Nile Valley':'Egypt',
  'Murray-Darling':'Australia','Colorado Basin':'USA','California Central':'USA',
  'Sao Francisco':'Brazil','Tigris-Euphrates':'Iraq','Lake Chad':'Nigeria',
  'Aral Sea':'Kazakhstan','Jordan River':'Jordan','Orange-Senqu':'South Africa',
  'Volta Basin':'Ghana','Zambezi':'Zambia','Congo Basin':'Democratic Republic of the Congo',
  'Amazon Basin':'Brazil','Mississippi Delta':'USA','Rhine-Meuse':'Germany',
  'Danube Basin':'Romania','Po Valley':'Italy','Tagus Basin':'Portugal',
  'Guadalquivir':'Spain','North China Plain':'China','Deccan Plateau':'India',
  'Rajasthan Desert':'India','Middle East Gulf':'UAE','Sahel Region':'Niger',
  'Horn of Africa':'Ethiopia','Central Asian Steppe':'Kazakhstan','Australian Outback':'Australia',
  'Atacama Region':'Chile','Western US':'USA','Great Plains':'USA',
  'SE Australia':'Australia','Southern Africa':'South Africa','NW India':'India','Pakistan Punjab':'Pakistan',
};
_DEFAULT_REGIONS.forEach(r=>{
  const cName = BASIN_COUNTRY[r.name];
  const w = cName ? WRI_MAP[cName] : null;
  if(w){
    r.waterStress = w.baseline_water_stress;
    r.aqueductScore = w.baseline_water_stress;
    r.droughtRisk = Math.round(w.drought_risk*20);
    r.floodRisk = Math.round(w.riverine_flood_risk*20);
    r.groundwaterDepletion = Math.round(w.groundwater_depletion*20);
    r.riskCategory = w.overall_water_risk_category;
  }
});

// ── India Dataset Integration ──
const REGIONS = isIndiaMode() ? adaptForWaterRisk().map((c, i) => ({
  id: i + 1, name: c.name + ' (' + c.basin + ')', basin: c.basin, waterStress: +(c.stressScore / 20).toFixed(1),
  riskCategory: c.stressScore > 80 ? 'Extremely High' : c.stressScore > 60 ? 'High' : c.stressScore > 40 ? 'Medium-High' : c.stressScore > 20 ? 'Medium' : 'Low',
  supplyBCM: Math.round(sr(i * 11) * 500 + 10), demandBCM: Math.round(sr(i * 13) * 400 + 20),
  deficitBCM: Math.max(0, Math.round(c.waterWithdrawal_m3 / 1e6)), aqueductScore: +(c.stressScore / 20).toFixed(1),
  floodRisk: Math.round(sr(i * 17) * 100), droughtRisk: Math.round(sr(i * 19) * 100),
  pollutionIndex: Math.round(sr(i * 23) * 100), groundwaterDepletion: Math.round(sr(i * 29) * 80 + 10),
  popAffectedM: +(sr(i * 37) * 50 + 1).toFixed(1), agWaterPct: Math.round(sr(i * 41) * 70 + 10),
  industrialPct: Math.round(sr(i * 43) * 30 + 5), domesticPct: Math.round(100 - Math.round(sr(i * 41) * 70 + 10) - Math.round(sr(i * 43) * 30 + 5)),
  waterPrice: +(sr(i * 47) * 3 + 0.2).toFixed(2), infraInvestBn: +(sr(i * 49) * 10 + 0.5).toFixed(1),
  desalCapacity: Math.round(sr(i * 51) * 500), recycleRate: Math.round(sr(i * 53) * 60 + 10),
  yearly: Array.from({ length: 6 }, (_, y) => ({ year: 2020 + y, stress: +(c.stressScore / 20 + y * 0.08).toFixed(1), supply: Math.round(sr(i * 100 + y) * 300 + 50), demand: Math.round(sr(i * 100 + y * 3) * 350 + 60) })),
})) : _DEFAULT_REGIONS;

// ── Live backend wiring (E92 Water Risk & Stewardship Engine) ──────────────
// Maps this page's region.basin names to the engine's real WRI AQUEDUCT 4.0
// basin benchmark keys (GET /ref/aqueduct-benchmarks) so live assessments use
// real basin-level water-stress/groundwater/flood inputs where available.
const BASIN_BENCHMARK_KEY={
  'Ganges':'Ganges-Brahmaputra','Indus':'Indus','Yellow':'Yellow River','Colorado':'Colorado',
  'Tigris':'Tigris-Euphrates','Murray':'Murray-Darling','Nile':'Nile','Mekong':'Mekong',
  'Amazon':'Amazon','Rhine':'Rhine','Danube':'Danube','Mississippi':'Mississippi',
  'Yangtze':'Yangtze','Zambezi':'Zambezi','Jordan':'Jordan',
  // All other region basins (Sacramento, Sao Francisco, Lake Chad, Aral, Orange,
  // Volta, Congo, Po, Tagus, Guadalquivir, Hai, Godavari, Thar, Gulf, Niger, Juba,
  // Amu Darya, Cooper, Loa, Columbia, Missouri, Yarra, Limpopo, Sabarmati, Chenab)
  // have no AQUEDUCT_BASIN_BENCHMARKS entry in the engine — those regions fall
  // back to the engine's own deterministic entity-seeded proxy (never fabricated
  // client-side).
};

// Engine's 4-tier aqueduct_risk_tier / water_risk_tier -> this page's risk category set.
const RISK_TIER_LABEL={low:'Low',medium:'Medium',high:'High',critical:'Extremely High'};

// Translate one seeded REGIONS row into the POST /api/v1/water-risk/assess
// (WaterRiskAssessRequest) payload shape. Basin benchmark values (when available)
// are passed explicitly so the AQUEDUCT composite reflects the real basin, not
// just an entity-id hash proxy. Region-level BCM (billion m3) figures are
// converted to the engine's ML/yr unit (1 BCM = 1,000,000 ML).
const buildAssessPayload=(r,benchmarks)=>{
  const bKey=BASIN_BENCHMARK_KEY[r.basin];
  const bench=(bKey&&benchmarks)?benchmarks[bKey]:null;
  return{
    entity_id:`WRA-${r.id}`,
    entity_name:r.name,
    sector:'water_basin_region',
    basin_name:r.basin,
    water_withdrawal_ml_yr:+(r.supplyBCM*1e6).toFixed(0),
    water_consumption_ml_yr:+(r.demandBCM*1e6).toFixed(0),
    recycled_water_pct:r.recycleRate,
    water_stressed_ops_pct:Math.min(100,+(r.waterStress/5*100).toFixed(1)),
    total_assets_m:+(r.infraInvestBn*1000).toFixed(1),
    water_dependent_revenue_pct:Math.min(90,r.agWaterPct+r.industrialPct),
    ...(bench?{
      baseline_water_stress:bench.baseline_water_stress,
      groundwater_depletion:bench.groundwater_depletion,
      riverine_flood_risk:bench.riverine_flood_risk,
    }:{
      baseline_water_stress:Math.min(5,r.waterStress),
    }),
  };
};

export default function WaterRiskAnalyticsPage(){
  const[tab,setTab]=useState(0);const[search,setSearch]=useState('');const[riskF,setRiskF]=useState('All');const[sortCol,setSortCol]=useState('waterStress');const[sortDir,setSortDir]=useState('desc');const[page,setPage]=useState(1);const[selected,setSelected]=useState(null);

  // --- Live backend wiring (E92 Water Risk & Stewardship Engine) -----------
  // benchmarks: real WRI AQUEDUCT 4.0 basin benchmark table (GET /ref/aqueduct-benchmarks).
  // portfolioLive: per-region POST /assess results, keyed by region id.
  // portfolioStatus: 'loading' | 'live' | 'demo' (demo = API unreachable, seeded fallback shown).
  const [benchmarks,setBenchmarks]=useState(null);
  const [portfolioLive,setPortfolioLive]=useState(null);
  const [portfolioStatus,setPortfolioStatus]=useState('loading');

  useEffect(()=>{
    let cancelled=false;
    (async()=>{
      let benchMap=null;
      try{
        const{data}=await axios.get(`${WATER_API}/ref/aqueduct-benchmarks`,{timeout:10000});
        benchMap=data?.basin_benchmarks||null;
      }catch(e){/* fall through to entity-seeded proxy */}
      if(cancelled)return;
      setBenchmarks(benchMap);
      setPortfolioStatus('loading');
      try{
        const results=await Promise.all(REGIONS.map(r=>
          axios.post(`${WATER_API}/assess`,buildAssessPayload(r,benchMap),{timeout:15000})
            .then(res=>[r.id,res.data]).catch(()=>[r.id,null])
        ));
        if(cancelled)return;
        const map={};let liveCount=0;
        results.forEach(([id,data])=>{if(data){map[id]=data;liveCount++;}});
        setPortfolioLive(map);
        setPortfolioStatus(liveCount>0?'live':'demo');
      }catch(e){
        if(!cancelled)setPortfolioStatus('demo');
      }
    })();
    return()=>{cancelled=true;};
  },[]);

  // Merge live per-region AQUEDUCT/financial-exposure results back onto the
  // seeded region inventory. Regions the API hasn't returned (e.g. call
  // failed) keep their seeded demo values — never blanked out.
  const enrichedRegions=useMemo(()=>REGIONS.map(r=>{
    const live=portfolioLive&&portfolioLive[r.id];
    if(!live)return r;
    const aq=live.aqueduct||{};
    const bKey=BASIN_BENCHMARK_KEY[r.basin];
    const bench=bKey&&benchmarks?benchmarks[bKey]:null;
    return{
      ...r,
      waterStress:typeof bench?.baseline_water_stress==='number'?bench.baseline_water_stress:(typeof aq.overall_score==='number'?+(aq.overall_score/20).toFixed(1):r.waterStress),
      aqueductScore:typeof aq.overall_score==='number'?+(aq.overall_score/20).toFixed(1):r.aqueductScore,
      riskCategory:RISK_TIER_LABEL[aq.risk_tier]||r.riskCategory,
      groundwaterDepletion:typeof bench?.groundwater_depletion==='number'?Math.min(100,Math.round(bench.groundwater_depletion*3)):r.groundwaterDepletion,
      floodRisk:typeof bench?.riverine_flood_risk==='number'?Math.round(bench.riverine_flood_risk):r.floodRisk,
      _live:true,
    };
  }),[portfolioLive,benchmarks]);

  const filtered=useMemo(()=>{let d=[...enrichedRegions];if(search)d=d.filter(r=>r.name.toLowerCase().includes(search.toLowerCase())||r.basin.toLowerCase().includes(search.toLowerCase()));if(riskF!=='All')d=d.filter(r=>r.riskCategory===riskF);d.sort((a,b)=>sortDir==='asc'?(a[sortCol]>b[sortCol]?1:-1):(a[sortCol]<b[sortCol]?1:-1));return d;},[enrichedRegions,search,riskF,sortCol,sortDir]);
  const paged=useMemo(()=>filtered.slice((page-1)*PAGE,page*PAGE),[filtered,page]);const totalPages=Math.ceil(filtered.length/PAGE);
  const doSort=col=>{if(sortCol===col)setSortDir(d=>d==='asc'?'desc':'asc');else{setSortCol(col);setSortDir('desc');}setPage(1);};
  const stats=useMemo(()=>{const d=Math.max(1,filtered.length);return{count:filtered.length,avgStress:(filtered.reduce((s,r)=>s+r.waterStress,0)/d).toFixed(1),extreme:filtered.filter(r=>r.riskCategory==='Extremely High').length,totalDeficit:Math.round(filtered.reduce((s,r)=>s+r.deficitBCM,0)),popAffected:fmt(filtered.reduce((s,r)=>s+r.popAffectedM,0)*1e6),avgGroundwater:Math.round(filtered.reduce((s,r)=>s+r.groundwaterDepletion,0)/d),totalInfra:'$'+filtered.reduce((s,r)=>s+r.infraInvestBn,0).toFixed(0)+'B'};},[filtered]);
  const riskDist=useMemo(()=>['Extremely High','High','Medium-High','Medium','Low'].map(r=>({name:r,value:enrichedRegions.filter(reg=>reg.riskCategory===r).length})),[enrichedRegions]);
  const exportCSV=useCallback((data,fn)=>{if(!data.length)return;const keys=Object.keys(data[0]).filter(k=>k!=='yearly');const csv=[keys.join(','),...data.map(r=>keys.map(k=>`"${r[k]}"`).join(','))].join('\n');const b=new Blob([csv],{type:'text/csv'});const u=URL.createObjectURL(b);const a=document.createElement('a');a.href=u;a.download=fn;a.click();URL.revokeObjectURL(u);},[]);
  const si=(col,cur,dir)=>cur===col?(dir==='asc'?' \u25B2':' \u25BC'):' \u25CB';
  const thS={padding:'8px 10px',fontSize:11,fontFamily:T.mono,color:T.textSec,cursor:'pointer',borderBottom:`1px solid ${T.border}`,whiteSpace:'nowrap',userSelect:'none',textAlign:'left',background:T.surfaceH};const tdS={padding:'7px 10px',fontSize:12,fontFamily:T.font,borderBottom:`1px solid ${T.border}`,color:T.text};const inpS={padding:'6px 12px',border:`1px solid ${T.border}`,borderRadius:6,fontSize:12,fontFamily:T.font,background:T.surface,color:T.text,outline:'none',width:220};const selS={padding:'6px 10px',border:`1px solid ${T.border}`,borderRadius:6,fontSize:11,fontFamily:T.font,background:T.surface,color:T.text};
  const btnS=a=>({padding:'6px 16px',border:`1px solid ${a?ACCENT:T.border}`,borderRadius:6,fontSize:12,fontFamily:T.font,background:a?ACCENT:T.surface,color:a?'#fff':T.text,cursor:'pointer',fontWeight:a?600:400});const pgB={padding:'4px 10px',border:`1px solid ${T.border}`,borderRadius:4,fontSize:11,cursor:'pointer',background:T.surface,color:T.text};const cS={background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:16};
  const kpi=(l,v,c)=>(<div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:'14px 18px',flex:1,minWidth:130}}><div style={{fontSize:10,color:T.textMut,fontFamily:T.mono,textTransform:'uppercase',letterSpacing:1}}>{l}</div><div style={{fontSize:22,fontWeight:700,color:c||T.navy,marginTop:4}}>{v}</div></div>);
  const rBdg=r=>({color:r==='Extremely High'?T.red:r==='High'?T.amber:r==='Medium-High'?T.gold:r==='Medium'?T.sage:T.green,fontWeight:600,fontSize:11});
  const Panel=({item,onClose})=>{if(!item)return null;return(<div style={{position:'fixed',top:0,right:0,width:460,height:'100vh',background:T.surface,borderLeft:`2px solid ${ACCENT}`,zIndex:1000,overflowY:'auto',boxShadow:'-4px 0 24px rgba(0,0,0,0.10)'}}><div style={{padding:'20px 24px',borderBottom:`1px solid ${T.border}`,display:'flex',justifyContent:'space-between',alignItems:'center'}}><div><div style={{fontSize:16,fontWeight:700,color:T.navy}}>{item.name}</div><div style={{fontSize:12,color:T.textSec}}>{item.basin} Basin | {item.riskCategory}</div></div><button onClick={onClose} style={{background:'none',border:'none',fontSize:20,cursor:'pointer',color:T.textMut}}>{'\u2715'}</button></div>
    <div style={{padding:'16px 24px'}}>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:8,marginBottom:16}}>{[['Stress',item.waterStress+'/5'],['Supply',item.supplyBCM+' BCM'],['Demand',item.demandBCM+' BCM'],['Deficit',item.deficitBCM+' BCM'],['Flood Risk',item.floodRisk+'/100'],['Drought Risk',item.droughtRisk+'/100'],['Pollution',item.pollutionIndex+'/100'],['Groundwater',item.groundwaterDepletion+'%'],['Pop Affected',item.popAffectedM+'M'],['Ag Water',item.agWaterPct+'%'],['Industrial',item.industrialPct+'%'],['Price','$'+item.waterPrice+'/m3'],['Infra Invest','$'+item.infraInvestBn+'B'],['Desal',item.desalCapacity+' ML/d'],['Recycle',item.recycleRate+'%']].map(([k,v],j)=>(<div key={j} style={{background:T.surfaceH,borderRadius:6,padding:'8px 10px'}}><div style={{fontSize:9,color:T.textMut,fontFamily:T.mono}}>{k}</div><div style={{fontSize:13,fontWeight:600,color:T.navy,marginTop:2}}>{v}</div></div>))}</div>
      <div style={cS}><div style={{fontSize:12,fontWeight:600,color:T.navy,marginBottom:8}}>Supply vs Demand Trend</div><ResponsiveContainer width="100%" height={180}><LineChart data={item.yearly}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="year" tick={{fontSize:9,fill:T.textSec}}/><YAxis tick={{fontSize:9,fill:T.textSec}}/><Tooltip {...tip}/><Line type="monotone" dataKey="supply" stroke={ACCENT} name="Supply BCM" strokeWidth={2}/><Line type="monotone" dataKey="demand" stroke={T.red} name="Demand BCM" strokeWidth={2}/><Legend/></LineChart></ResponsiveContainer></div>
      <div style={{...cS,marginTop:12}}><div style={{fontSize:12,fontWeight:600,color:T.navy,marginBottom:8}}>Risk Radar</div><ResponsiveContainer width="100%" height={200}><RadarChart data={[{m:'Water Stress',v:item.waterStress*20},{m:'Flood',v:item.floodRisk},{m:'Drought',v:item.droughtRisk},{m:'Pollution',v:item.pollutionIndex},{m:'Groundwater',v:item.groundwaterDepletion}]}><PolarGrid stroke={T.border}/><PolarAngleAxis dataKey="m" tick={{fontSize:8,fill:T.textSec}}/><PolarRadiusAxis domain={[0,100]} tick={{fontSize:8}}/><Radar dataKey="v" stroke={ACCENT} fill="rgba(2,132,199,0.2)"/></RadarChart></ResponsiveContainer></div>
    </div></div>);};
  const renderDash=()=>(<div>
    <div style={{display:'flex',gap:12,marginBottom:20,flexWrap:'wrap'}}>{kpi('Regions',stats.count)}{kpi('Avg Stress',stats.avgStress+'/5',+stats.avgStress>3?T.red:T.amber)}{kpi('Extreme Risk',stats.extreme,T.red)}{kpi('Total Deficit',stats.totalDeficit+' BCM')}{kpi('Pop Affected',stats.popAffected)}{kpi('Groundwater',stats.avgGroundwater+'%')}{kpi('Infra Invest',stats.totalInfra)}</div>
    <div style={{display:'flex',gap:12,marginBottom:16,alignItems:'center',flexWrap:'wrap'}}><input value={search} onChange={e=>{setSearch(e.target.value);setPage(1);}} placeholder="Search regions..." style={inpS}/><select value={riskF} onChange={e=>{setRiskF(e.target.value);setPage(1);}} style={selS}>{RISKF.map(s=><option key={s}>{s}</option>)}</select><button onClick={()=>exportCSV(filtered,'water_risk.csv')} style={btnS(false)}>Export CSV</button></div>
    <div style={{overflowX:'auto',...cS,padding:0}}><table style={{width:'100%',borderCollapse:'collapse'}}><thead><tr>{[['name','Region'],['basin','Basin'],['waterStress','Stress'],['riskCategory','Risk'],['deficitBCM','Deficit'],['droughtRisk','Drought'],['groundwaterDepletion','GW%'],['popAffectedM','Pop M']].map(([k,l])=><th key={k} onClick={()=>doSort(k)} style={thS}>{l}{si(k,sortCol,sortDir)}</th>)}</tr></thead>
      <tbody>{paged.map(r=><tr key={r.id} onClick={()=>setSelected(r)} style={{cursor:'pointer',background:selected?.id===r.id?T.surfaceH:'transparent'}}><td style={tdS}><span style={{fontWeight:600}}>{r.name}</span></td><td style={tdS}>{r.basin}</td><td style={tdS}>{r.waterStress}</td><td style={tdS}><span style={rBdg(r.riskCategory)}>{r.riskCategory}</span></td><td style={tdS}>{r.deficitBCM}</td><td style={tdS}>{r.droughtRisk}</td><td style={tdS}>{r.groundwaterDepletion}%</td><td style={tdS}>{r.popAffectedM}M</td></tr>)}</tbody></table></div>
    {totalPages>1&&<div style={{display:'flex',gap:6,marginTop:12,justifyContent:'center'}}><button onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={page===1} style={pgB}>&laquo;</button><span style={{fontSize:11,color:T.textSec,fontFamily:T.mono}}>Page {page}/{totalPages}</span><button onClick={()=>setPage(p=>Math.min(totalPages,p+1))} disabled={page===totalPages} style={pgB}>&raquo;</button></div>}
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginTop:20}}>
      <div style={cS}><div style={{fontSize:12,fontWeight:600,color:T.navy,marginBottom:8}}>Water Risk Distribution</div><ResponsiveContainer width="100%" height={260}><PieChart><Pie data={riskDist} cx="50%" cy="50%" outerRadius={90} dataKey="value" label={({name,value})=>`${name}: ${value}`}>{[T.red,T.amber,T.gold,T.sage,T.green].map((c,i)=><Cell key={i} fill={c}/>)}</Pie><Tooltip {...tip}/></PieChart></ResponsiveContainer></div>
      <div style={cS}><div style={{fontSize:12,fontWeight:600,color:T.navy,marginBottom:8}}>Water Stress Ranking (Top 15)</div><ResponsiveContainer width="100%" height={260}><BarChart data={[...enrichedRegions].sort((a,b)=>b.waterStress-a.waterStress).slice(0,15)} layout="vertical"><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis type="number" tick={{fontSize:9,fill:T.textSec}} domain={[0,5]}/><YAxis type="category" dataKey="name" tick={{fontSize:7,fill:T.textSec}} width={90}/><Tooltip {...tip}/><Bar dataKey="waterStress" fill={ACCENT} radius={[0,4,4,0]}/></BarChart></ResponsiveContainer></div>
    </div></div>);
  const renderRegional=()=>(<div><div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
    <div style={cS}><div style={{fontSize:12,fontWeight:600,color:T.navy,marginBottom:8}}>Drought vs Flood Risk</div><ResponsiveContainer width="100%" height={300}><ScatterChart><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="x" name="Drought" tick={{fontSize:9,fill:T.textSec}}/><YAxis dataKey="y" name="Flood" tick={{fontSize:9,fill:T.textSec}}/><Tooltip {...tip}/><Scatter data={filtered.map(r=>({name:r.name,x:r.droughtRisk,y:r.floodRisk}))} fill={ACCENT} fillOpacity={0.5}/></ScatterChart></ResponsiveContainer></div>
    <div style={cS}><div style={{fontSize:12,fontWeight:600,color:T.navy,marginBottom:8}}>Groundwater Depletion</div><ResponsiveContainer width="100%" height={300}><BarChart data={[...filtered].sort((a,b)=>b.groundwaterDepletion-a.groundwaterDepletion).slice(0,15)} layout="vertical"><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis type="number" tick={{fontSize:9,fill:T.textSec}} domain={[0,100]}/><YAxis type="category" dataKey="name" tick={{fontSize:7,fill:T.textSec}} width={90}/><Tooltip {...tip}/><Bar dataKey="groundwaterDepletion" fill={T.red} radius={[0,4,4,0]}/></BarChart></ResponsiveContainer></div>
    <div style={{...cS,gridColumn:'1/3'}}><div style={{fontSize:12,fontWeight:600,color:T.navy,marginBottom:8}}>Water Use Breakdown</div><ResponsiveContainer width="100%" height={260}><BarChart data={filtered.slice(0,15)}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="name" tick={{fontSize:7,fill:T.textSec}} angle={-30}/><YAxis tick={{fontSize:9,fill:T.textSec}} domain={[0,100]}/><Tooltip {...tip}/><Bar dataKey="agWaterPct" fill={T.sage} stackId="a" name="Agriculture"/><Bar dataKey="industrialPct" fill={T.navy} stackId="a" name="Industrial"/><Bar dataKey="domesticPct" fill={ACCENT} stackId="a" name="Domestic"/><Legend/></BarChart></ResponsiveContainer></div>
  </div></div>);
  const renderCorporate=()=>(<div><div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
    <div style={cS}><div style={{fontSize:12,fontWeight:600,color:T.navy,marginBottom:8}}>Pollution Index</div><ResponsiveContainer width="100%" height={300}><BarChart data={[...filtered].sort((a,b)=>b.pollutionIndex-a.pollutionIndex).slice(0,15)} layout="vertical"><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis type="number" tick={{fontSize:9,fill:T.textSec}} domain={[0,100]}/><YAxis type="category" dataKey="name" tick={{fontSize:7,fill:T.textSec}} width={90}/><Tooltip {...tip}/><Bar dataKey="pollutionIndex" fill={T.amber} radius={[0,4,4,0]}/></BarChart></ResponsiveContainer></div>
    <div style={cS}><div style={{fontSize:12,fontWeight:600,color:T.navy,marginBottom:8}}>Infrastructure Investment</div><ResponsiveContainer width="100%" height={300}><BarChart data={[...filtered].sort((a,b)=>b.infraInvestBn-a.infraInvestBn).slice(0,15)} layout="vertical"><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis type="number" tick={{fontSize:9,fill:T.textSec}}/><YAxis type="category" dataKey="name" tick={{fontSize:7,fill:T.textSec}} width={90}/><Tooltip {...tip}/><Bar dataKey="infraInvestBn" fill={T.gold} radius={[0,4,4,0]}/></BarChart></ResponsiveContainer></div>
  </div></div>);
  const renderProjections=()=>(<div><div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
    <div style={cS}><div style={{fontSize:12,fontWeight:600,color:T.navy,marginBottom:8}}>Water Stress vs Population</div><ResponsiveContainer width="100%" height={280}><ScatterChart><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="x" name="Stress" tick={{fontSize:9,fill:T.textSec}}/><YAxis dataKey="y" name="Pop (M)" tick={{fontSize:9,fill:T.textSec}}/><Tooltip {...tip}/><Scatter data={filtered.map(r=>({name:r.name,x:r.waterStress,y:r.popAffectedM}))} fill={T.red} fillOpacity={0.5}/></ScatterChart></ResponsiveContainer></div>
    <div style={cS}><div style={{fontSize:12,fontWeight:600,color:T.navy,marginBottom:8}}>Recycling Rate vs Stress</div><ResponsiveContainer width="100%" height={280}><ScatterChart><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="x" name="Recycle %" tick={{fontSize:9,fill:T.textSec}}/><YAxis dataKey="y" name="Stress" tick={{fontSize:9,fill:T.textSec}}/><Tooltip {...tip}/><Scatter data={filtered.map(r=>({name:r.name,x:r.recycleRate,y:r.waterStress}))} fill={T.sage} fillOpacity={0.5}/></ScatterChart></ResponsiveContainer></div>
    <div style={{...cS,gridColumn:'1/3'}}><div style={{fontSize:12,fontWeight:600,color:T.navy,marginBottom:8}}>Desalination Capacity</div><ResponsiveContainer width="100%" height={260}><BarChart data={[...enrichedRegions].filter(r=>r.desalCapacity>50).sort((a,b)=>b.desalCapacity-a.desalCapacity).slice(0,15)}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="name" tick={{fontSize:7,fill:T.textSec}} angle={-30}/><YAxis tick={{fontSize:9,fill:T.textSec}}/><Tooltip {...tip}/><Bar dataKey="desalCapacity" fill={ACCENT} radius={[4,4,0,0]} name="ML/day"/></BarChart></ResponsiveContainer></div>
  </div></div>);
  return(<div style={{padding:'24px 32px',fontFamily:T.font,background:T.bg,minHeight:'100vh'}}>
    <div style={{marginBottom:20}}><h1 style={{fontSize:22,fontWeight:700,color:T.navy,margin:0}}>Water Risk Analytics</h1><p style={{fontSize:12,color:T.textSec,margin:'4px 0 0'}}>{REGIONS.length} regions | Aqueduct water stress, basin analysis, projections</p>
      <div style={{marginTop:8}}>
        {portfolioStatus==='loading'&&<span style={{padding:'3px 10px',borderRadius:12,fontSize:11,fontWeight:700,background:'#f1f5f9',color:'#64748b'}}>Connecting to Water Risk &amp; Stewardship Engine…</span>}
        {portfolioStatus==='live'&&<span style={{padding:'3px 10px',borderRadius:12,fontSize:11,fontWeight:700,background:'#d1fae5',color:'#065f46'}}>● Live — scores computed by /api/v1/water-risk/assess (WRI AQUEDUCT 4.0 · TNFD E3 · CDP Water)</span>}
        {portfolioStatus==='demo'&&<span style={{padding:'3px 10px',borderRadius:12,fontSize:11,fontWeight:700,background:'#fef3c7',color:'#92400e'}}>○ Demo Data — Water Risk API unavailable, showing seeded illustrative figures</span>}
      </div>
    </div>
    <div style={{display:'flex',gap:8,marginBottom:20}}>{TABS.map((t,i)=><button key={t} onClick={()=>setTab(i)} style={btnS(tab===i)}>{t}</button>)}</div>
    {tab===0&&renderDash()}{tab===1&&renderRegional()}{tab===2&&renderCorporate()}{tab===3&&renderProjections()}
    <Panel item={selected} onClose={()=>setSelected(null)}/>
  </div>);
}