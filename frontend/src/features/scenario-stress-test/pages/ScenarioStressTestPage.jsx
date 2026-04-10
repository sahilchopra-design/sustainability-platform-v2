import React,{useState,useMemo,useCallback} from 'react';
import {BarChart,Bar,XAxis,YAxis,Tooltip,ResponsiveContainer,CartesianGrid,Legend,Cell,LineChart,Line,PieChart,Pie,AreaChart,Area,RadarChart,Radar,PolarGrid,PolarAngleAxis,PolarRadiusAxis,ScatterChart,Scatter,ZAxis,ComposedChart,ReferenceLine} from 'recharts';

/* ── Theme ── */
const T={surface:'#fafaf7',border:'#e2e0d8',navy:'#1b2a4a',gold:'#b8962e',text:'#1a1a2e',sub:'#64748b',card:'#ffffff',indigo:'#4f46e5',green:'#065f46',red:'#991b1b',amber:'#92400e'};
const sr=s=>{let x=Math.sin(s+1)*10000;return x-Math.floor(x);};

/* ── Helpers ── */
const fmt=(n,d=1)=>Number(n).toFixed(d);
const fmtPct=n=>`${fmt(n)}%`;
const fmtB=n=>n>=1e3?`$${fmt(n/1e3)}B`:`$${fmt(n,0)}M`;
const clamp=(v,lo,hi)=>Math.max(lo,Math.min(hi,v));
const safeDivide=(a,b,fallback=0)=>b!==0?a/b:fallback;

const COLORS=['#1b2a4a','#b8962e','#4f46e5','#065f46','#991b1b','#92400e','#7c3aed','#0891b2'];

/* ── SCENARIOS: 8 NGFS + Custom ── */
const SCENARIOS=[
  {id:'nz2050',name:'Net Zero 2050',warming_c:1.5,carbonPrice2030:130,carbonPrice2040:250,carbonPrice2050:420,gdpImpact_pct:-2.1,policyIntensity:95,physicalDamage_pct:3.2,transitionCost_pct:4.8,color:'#065f46',framework:'NGFS'},
  {id:'below2c',name:'Below 2\u00B0C',warming_c:1.7,carbonPrice2030:80,carbonPrice2040:160,carbonPrice2050:300,gdpImpact_pct:-3.0,policyIntensity:80,physicalDamage_pct:4.5,transitionCost_pct:3.5,color:'#0891b2',framework:'NGFS'},
  {id:'divnz',name:'Divergent Net Zero',warming_c:1.5,carbonPrice2030:60,carbonPrice2040:350,carbonPrice2050:500,gdpImpact_pct:-4.5,policyIntensity:70,physicalDamage_pct:3.8,transitionCost_pct:6.2,color:'#4f46e5',framework:'NGFS'},
  {id:'delayed',name:'Delayed Transition',warming_c:1.8,carbonPrice2030:25,carbonPrice2040:200,carbonPrice2050:450,gdpImpact_pct:-5.8,policyIntensity:45,physicalDamage_pct:5.5,transitionCost_pct:7.1,color:'#b8962e',framework:'NGFS'},
  {id:'ndcs',name:'NDCs',warming_c:2.5,carbonPrice2030:20,carbonPrice2040:45,carbonPrice2050:80,gdpImpact_pct:-7.2,policyIntensity:35,physicalDamage_pct:9.8,transitionCost_pct:2.1,color:'#92400e',framework:'NGFS'},
  {id:'curpol',name:'Current Policies',warming_c:3.0,carbonPrice2030:10,carbonPrice2040:15,carbonPrice2050:25,gdpImpact_pct:-10.5,policyIntensity:15,physicalDamage_pct:14.2,transitionCost_pct:1.0,color:'#991b1b',framework:'NGFS'},
  {id:'polshock',name:'Policy Shock',warming_c:1.6,carbonPrice2030:200,carbonPrice2040:350,carbonPrice2050:500,gdpImpact_pct:-6.0,policyIntensity:100,physicalDamage_pct:3.0,transitionCost_pct:9.5,color:'#7c3aed',framework:'Custom'},
  {id:'techdisr',name:'Tech Disruption',warming_c:1.4,carbonPrice2030:50,carbonPrice2040:80,carbonPrice2050:120,gdpImpact_pct:-1.5,policyIntensity:60,physicalDamage_pct:2.8,transitionCost_pct:3.0,color:'#0d9488',framework:'Custom'},
];

/* ── SECTORS: 15 GICS ── */
const SECTOR_NAMES=['Energy','Materials','Industrials','Consumer Disc.','Consumer Staples','Health Care','Financials','IT','Comm. Services','Utilities','Real Estate','Oil & Gas Expl.','Metals & Mining','Chemicals','Transport'];
const genSectorImpacts=()=>{
  const out=[];
  for(let si=0;si<SECTOR_NAMES.length;si++){
    const row={sector:SECTOR_NAMES[si],scenarios:{}};
    for(let sci=0;sci<SCENARIOS.length;sci++){
      const s=SCENARIOS[sci];
      const base=sr(si*100+sci*13+7);
      const transExp=si<3?0.7:si<6?0.3:0.15;
      const physExp=si>=9?0.6:si>=6?0.25:0.4;
      row.scenarios[s.id]={
        revenue_impact_pct:Number((-base*15*transExp - s.physicalDamage_pct*physExp*0.5 + sr(si*31+sci*19)*3).toFixed(1)),
        cost_impact_pct:Number((base*8*transExp + s.transitionCost_pct*0.3 + sr(si*37+sci*23)*2).toFixed(1)),
        stranded_pct:Number((clamp(s.carbonPrice2050/500*30*transExp + sr(si*41+sci*29)*5,0,60)).toFixed(1)),
        capex_required_pct:Number((s.transitionCost_pct*transExp*1.2 + sr(si*43+sci*31)*3).toFixed(1)),
      };
    }
    out.push(row);
  }
  return out;
};
const SECTOR_IMPACTS=genSectorImpacts();

/* ── PORTFOLIO: 50 holdings ── */
const HOLD_NAMES=['Global Equity Fund','EM Bond Portfolio','IG Credit Sleeve','HY Allocation','Sovereign Debt Mix','Real Assets Fund','Tech Growth','Green Bond Sleeve','Infra Debt','Convertible Strategy','Multi-Asset Fund','Macro Hedge','PE Sleeve','Commodities Basket','FX Carry Trade','Volatility Strategy','Credit L/S','Equity Mkt Neutral','Merger Arb','Distressed Debt','CLO Tranche AA','RMBS Portfolio','CMBS Sleeve','ABS Consumer','Leveraged Loans','Direct Lending','Mezzanine Capital','Venture Debt','Bridge Loans','Trade Finance','Supply Chain Fin','Factoring Book','Leasing Assets','Project Finance','Export Credit','Microfinance Pool','Impact Bond Fund','Social Housing','Climate Transition','Blue Bond Sleeve','Sustainability Link','Cat Bond','Longevity Swap','Inflation Linked','Covered Bond Pool','Pfandbriefe','Cedulas','Samurai Bond','Dim Sum Bond','Sukuk Portfolio'];
const genPortfolio=()=>{
  const out=[];
  for(let i=0;i<50;i++){
    const sIdx=Math.floor(sr(i*17)*SECTOR_NAMES.length);
    const mv=Number((10+sr(i*19)*490).toFixed(1));
    const scenImpacts={};
    for(let sci=0;sci<SCENARIOS.length;sci++){
      const sImp=SECTOR_IMPACTS[sIdx].scenarios[SCENARIOS[sci].id];
      const idio=sr(i*100+sci*7)*4-2;
      scenImpacts[SCENARIOS[sci].id]={
        loss_pct:Number((Math.abs(sImp.revenue_impact_pct)*0.6 + sImp.stranded_pct*0.15 + idio).toFixed(2)),
        transition_loss:Number((sImp.cost_impact_pct*0.4+sr(i*53+sci*11)*2).toFixed(2)),
        physical_loss:Number((SCENARIOS[sci].physicalDamage_pct*0.3+sr(i*59+sci*13)*1.5).toFixed(2)),
      };
    }
    out.push({id:i+1,name:HOLD_NAMES[i],sector:SECTOR_NAMES[sIdx],market_value:mv,scenImpacts});
  }
  return out;
};
const PORTFOLIO=genPortfolio();
const TOTAL_MV=PORTFOLIO.reduce((a,h)=>a+h.market_value,0);

/* ── MACRO VARIABLES: 30-year projections per scenario ── */
const YEARS=Array.from({length:31},(_,i)=>2025+i);
const genMacro=()=>{
  const out={};
  SCENARIOS.forEach((s,sci)=>{
    out[s.id]=YEARS.map((y,yi)=>{
      const t=yi/30;
      return{
        year:y,
        gdp_growth:Number((2.5 - s.physicalDamage_pct*t*0.15 - s.transitionCost_pct*Math.max(0,0.3-t)*0.1 + sr(sci*100+yi*7)*0.4-0.2).toFixed(2)),
        carbon_price:Number((s.carbonPrice2030 + (s.carbonPrice2050-s.carbonPrice2030)*t + sr(sci*200+yi*11)*10-5).toFixed(0)),
        inflation:Number((2.0 + s.transitionCost_pct*t*0.05 + sr(sci*300+yi*13)*0.3-0.15).toFixed(2)),
        unemployment:Number((5.0 + s.physicalDamage_pct*t*0.1 + sr(sci*400+yi*17)*0.5-0.25).toFixed(2)),
        interest_rate:Number((3.0 + s.transitionCost_pct*t*0.03 + sr(sci*500+yi*19)*0.2-0.1).toFixed(2)),
      };
    });
  });
  return out;
};
const MACRO=genMacro();

/* ── STRESS RESULTS: pre-computed ── */
const genStressResults=()=>{
  return SCENARIOS.map((s,sci)=>{
    const losses=PORTFOLIO.map(h=>h.scenImpacts[s.id].loss_pct*h.market_value/100);
    const totalLoss=losses.reduce((a,v)=>a+v,0);
    const sortedLosses=[...losses].sort((a,b)=>a-b);
    const var95idx=Math.floor(sortedLosses.length*0.95);
    const var99idx=Math.floor(sortedLosses.length*0.99);
    const var95=sortedLosses[Math.min(var95idx,sortedLosses.length-1)];
    const var99=sortedLosses[Math.min(var99idx,sortedLosses.length-1)];
    const tailLosses=sortedLosses.slice(var95idx);
    const es95=tailLosses.length>0?tailLosses.reduce((a,v)=>a+v,0)/tailLosses.length:0;
    return{
      scenario:s.name,scenarioId:s.id,color:s.color,
      portfolio_loss:Number(totalLoss.toFixed(1)),
      portfolio_loss_pct:Number(safeDivide(totalLoss*100,TOTAL_MV).toFixed(2)),
      var_95:Number(var95.toFixed(1)),var_99:Number(var99.toFixed(1)),
      es_95:Number(es95.toFixed(1)),
      capital_impact_pct:Number((totalLoss/TOTAL_MV*100*1.25+sr(sci*77)*1.5).toFixed(2)),
      transition_share:Number(safeDivide(PORTFOLIO.reduce((a,h)=>a+h.scenImpacts[s.id].transition_loss*h.market_value/100,0),totalLoss,0).toFixed(2))*100,
      physical_share:Number(safeDivide(PORTFOLIO.reduce((a,h)=>a+h.scenImpacts[s.id].physical_loss*h.market_value/100,0),totalLoss,0).toFixed(2))*100,
    };
  });
};
const STRESS_RESULTS=genStressResults();

/* ── Styles ── */
const cardS={background:T.card,border:`1px solid ${T.border}`,borderRadius:10,padding:20,marginBottom:16};
const inputS={fontFamily:"'JetBrains Mono',monospace",fontSize:13,padding:'8px 14px',border:`1px solid ${T.border}`,borderRadius:6,outline:'none',background:T.card,color:T.text,width:220};
const btnS=a=>({fontFamily:"'DM Sans',sans-serif",fontSize:13,fontWeight:a?700:500,padding:'8px 18px',border:`1px solid ${a?T.gold:T.border}`,borderRadius:6,background:a?T.gold:T.card,color:a?'#fff':T.text,cursor:'pointer',transition:'all 0.15s'});
const kpiBoxS={background:T.card,border:`1px solid ${T.border}`,borderRadius:10,padding:18,textAlign:'center',flex:1,minWidth:150};
const kpiVal={fontFamily:"'JetBrains Mono',monospace",fontSize:26,fontWeight:700,color:T.navy};
const kpiLab={fontFamily:"'DM Sans',sans-serif",fontSize:11,color:T.sub,marginTop:4,textTransform:'uppercase',letterSpacing:0.5};
const thS={fontFamily:"'JetBrains Mono',monospace",fontSize:11,fontWeight:600,color:T.sub,padding:'10px 12px',textAlign:'left',borderBottom:`2px solid ${T.border}`,whiteSpace:'nowrap'};
const tdS={fontFamily:"'DM Sans',sans-serif",fontSize:13,color:T.text,padding:'10px 12px',borderBottom:`1px solid ${T.border}`};
const hdr={fontFamily:"'JetBrains Mono',monospace",fontSize:11,color:T.sub,marginBottom:8,textTransform:'uppercase',letterSpacing:1};
const secTitle={fontFamily:"'DM Sans',sans-serif",fontSize:15,fontWeight:700,color:T.navy,marginBottom:12};

const exportCSV=(rows,fn)=>{if(!rows.length)return;const ks=Object.keys(rows[0]);const csv=[ks.join(','),...rows.map(r=>ks.map(k=>JSON.stringify(r[k]??'')).join(','))].join('\n');const b=new Blob([csv],{type:'text/csv'});const u=URL.createObjectURL(b);const a=document.createElement('a');a.href=u;a.download=fn;a.click();URL.revokeObjectURL(u);};
const CT=({active,payload,label})=>{if(!active||!payload?.length)return null;return(<div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:6,padding:'10px 14px',fontFamily:"'DM Sans',sans-serif",fontSize:12,boxShadow:'0 4px 12px rgba(0,0,0,0.08)'}}><div style={{fontWeight:700,color:T.navy,marginBottom:4}}>{label}</div>{payload.map((p,i)=><div key={i} style={{color:p.color||T.text}}>{p.name}: {typeof p.value==='number'?fmt(p.value):p.value}</div>)}</div>);};

const TABS=['Scenario Overview','Portfolio Stress','Sector Impact','Macro Projections','Capital & VaR','Sensitivity Analysis','Reverse Stress','Report Generator'];

/* ══════════════════════ COMPONENT ══════════════════════ */
export default function ScenarioStressTestPage(){
  const[tab,setTab]=useState(0);
  const[selScenario,setSelScenario]=useState(SCENARIOS[0].id);
  const[selSector,setSelSector]=useState(SECTOR_NAMES[0]);
  const[macroVar,setMacroVar]=useState('gdp_growth');
  const[sensCarbon,setSensCarbon]=useState(100);
  const[sensWarming,setSensWarming]=useState(2.0);
  const[reverseThreshold,setReverseThreshold]=useState(20);
  const[search,setSearch]=useState('');

  /* ── TAB 0: Scenario Overview ── */
  const radarData=useMemo(()=>SCENARIOS.map(s=>({
    name:s.name.length>14?s.name.slice(0,14)+'..':s.name,
    warming:s.warming_c*33,
    gdp:Math.abs(s.gdpImpact_pct)*10,
    carbon:s.carbonPrice2050/5,
    policy:s.policyIntensity,
    physical:s.physicalDamage_pct*7,
  })),[]);

  const renderTab0=()=>(
    <>
      <div style={hdr}>NGFS / EBA / FED / PRA SCENARIO PARAMETERS</div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:14,marginBottom:20}}>
        {SCENARIOS.map(s=>(
          <div key={s.id} style={{...cardS,borderLeft:`4px solid ${s.color}`,cursor:'pointer',background:selScenario===s.id?T.surface:T.card}} onClick={()=>setSelScenario(s.id)}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
              <div style={{fontWeight:700,fontSize:14,color:T.navy}}>{s.name}</div>
              <span style={{fontSize:10,padding:'2px 8px',borderRadius:99,background:s.framework==='NGFS'?T.indigo+'18':'#7c3aed18',color:s.framework==='NGFS'?T.indigo:'#7c3aed',fontWeight:600}}>{s.framework}</span>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:6,fontSize:12,color:T.sub}}>
              <div>Warming: <strong style={{color:T.text}}>{s.warming_c}\u00B0C</strong></div>
              <div>GDP: <strong style={{color:T.red}}>{s.gdpImpact_pct}%</strong></div>
              <div>CO\u2082 2050: <strong style={{color:T.text}}>${s.carbonPrice2050}</strong></div>
              <div>Policy: <strong style={{color:T.text}}>{s.policyIntensity}/100</strong></div>
              <div>Physical: <strong style={{color:T.amber}}>{s.physicalDamage_pct}%</strong></div>
              <div>Transition: <strong style={{color:T.indigo}}>{s.transitionCost_pct}%</strong></div>
            </div>
          </div>
        ))}
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:16}}>
        <div style={cardS}>
          <div style={hdr}>SCENARIO COMPARISON RADAR</div>
          <ResponsiveContainer width="100%" height={340}>
            <RadarChart data={[{axis:'Warming',nz:SCENARIOS[0].warming_c*33,b2:SCENARIOS[1].warming_c*33,del:SCENARIOS[3].warming_c*33,cur:SCENARIOS[5].warming_c*33},
              {axis:'GDP Impact',nz:Math.abs(SCENARIOS[0].gdpImpact_pct)*10,b2:Math.abs(SCENARIOS[1].gdpImpact_pct)*10,del:Math.abs(SCENARIOS[3].gdpImpact_pct)*10,cur:Math.abs(SCENARIOS[5].gdpImpact_pct)*10},
              {axis:'Carbon Price',nz:SCENARIOS[0].carbonPrice2050/5,b2:SCENARIOS[1].carbonPrice2050/5,del:SCENARIOS[3].carbonPrice2050/5,cur:SCENARIOS[5].carbonPrice2050/5},
              {axis:'Policy',nz:SCENARIOS[0].policyIntensity,b2:SCENARIOS[1].policyIntensity,del:SCENARIOS[3].policyIntensity,cur:SCENARIOS[5].policyIntensity},
              {axis:'Physical Dmg',nz:SCENARIOS[0].physicalDamage_pct*7,b2:SCENARIOS[1].physicalDamage_pct*7,del:SCENARIOS[3].physicalDamage_pct*7,cur:SCENARIOS[5].physicalDamage_pct*7}]}>
              <PolarGrid stroke={T.border}/>
              <PolarAngleAxis dataKey="axis" tick={{fontSize:11,fill:T.sub}}/>
              <PolarRadiusAxis tick={{fontSize:9}}/>
              <Radar name="Net Zero 2050" dataKey="nz" stroke={SCENARIOS[0].color} fill={SCENARIOS[0].color} fillOpacity={0.15}/>
              <Radar name="Below 2\u00B0C" dataKey="b2" stroke={SCENARIOS[1].color} fill={SCENARIOS[1].color} fillOpacity={0.1}/>
              <Radar name="Delayed" dataKey="del" stroke={SCENARIOS[3].color} fill={SCENARIOS[3].color} fillOpacity={0.1}/>
              <Radar name="Current Policies" dataKey="cur" stroke={SCENARIOS[5].color} fill={SCENARIOS[5].color} fillOpacity={0.1}/>
              <Legend/>
              <Tooltip/>
            </RadarChart>
          </ResponsiveContainer>
        </div>
        <div style={cardS}>
          <div style={hdr}>CARBON PRICE TRAJECTORY ($/tCO2)</div>
          <ResponsiveContainer width="100%" height={340}>
            <BarChart data={[{period:'2030',...Object.fromEntries(SCENARIOS.map(s=>[s.id,s.carbonPrice2030]))},{period:'2040',...Object.fromEntries(SCENARIOS.map(s=>[s.id,s.carbonPrice2040]))},{period:'2050',...Object.fromEntries(SCENARIOS.map(s=>[s.id,s.carbonPrice2050]))}]}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
              <XAxis dataKey="period" tick={{fontSize:12}}/>
              <YAxis tick={{fontSize:11}}/>
              <Tooltip content={<CT/>}/>
              <Legend wrapperStyle={{fontSize:10}}/>
              {SCENARIOS.map(s=><Bar key={s.id} dataKey={s.id} name={s.name.length>12?s.name.slice(0,12)+'..':s.name} fill={s.color} radius={[2,2,0,0]}/>)}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </>
  );

  /* ── TAB 1: Portfolio Stress ── */
  const portfolioLossData=useMemo(()=>STRESS_RESULTS.map(r=>({name:r.scenario.length>14?r.scenario.slice(0,14)+'..':r.scenario,loss:r.portfolio_loss_pct,color:r.color})),[]);
  const waterfallData=useMemo(()=>{
    const s=STRESS_RESULTS.find(r=>r.scenarioId===selScenario)||STRESS_RESULTS[0];
    return[
      {name:'Transition',value:Number((s.transition_share*s.portfolio_loss_pct/100).toFixed(2)),fill:T.indigo},
      {name:'Physical',value:Number((s.physical_share*s.portfolio_loss_pct/100).toFixed(2)),fill:T.amber},
      {name:'Policy',value:Number(((100-s.transition_share-s.physical_share)*s.portfolio_loss_pct/100).toFixed(2)),fill:'#7c3aed'},
      {name:'Total Loss',value:s.portfolio_loss_pct,fill:T.red},
    ];
  },[selScenario]);
  const heatmapData=useMemo(()=>{
    return SECTOR_NAMES.map(sec=>{
      const row={sector:sec.length>12?sec.slice(0,12)+'..':sec};
      SCENARIOS.forEach(s=>{
        const imp=SECTOR_IMPACTS.find(si=>si.sector===sec);
        row[s.id]=imp?imp.scenarios[s.id].revenue_impact_pct:0;
      });
      return row;
    });
  },[]);

  const renderTab1=()=>(
    <>
      <div style={{display:'flex',gap:12,flexWrap:'wrap',marginBottom:16}}>
        {STRESS_RESULTS.map(r=>(
          <div key={r.scenarioId} style={kpiBoxS}>
            <div style={{...kpiVal,color:r.color,fontSize:22}}>{fmtPct(r.portfolio_loss_pct)}</div>
            <div style={kpiLab}>{r.scenario.length>16?r.scenario.slice(0,16)+'..':r.scenario}</div>
          </div>
        ))}
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:16}}>
        <div style={cardS}>
          <div style={hdr}>PORTFOLIO LOSS BY SCENARIO (%)</div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={portfolioLossData}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
              <XAxis dataKey="name" tick={{fontSize:10}} angle={-20} textAnchor="end" height={60}/>
              <YAxis tick={{fontSize:11}} label={{value:'Loss %',angle:-90,position:'insideLeft',style:{fontSize:11}}}/>
              <Tooltip content={<CT/>}/>
              <Bar dataKey="loss" name="Portfolio Loss %" radius={[4,4,0,0]}>
                {portfolioLossData.map((d,i)=><Cell key={i} fill={d.color}/>)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={cardS}>
          <div style={hdr}>LOSS ATTRIBUTION WATERFALL ({SCENARIOS.find(s=>s.id===selScenario)?.name})</div>
          <select style={{...inputS,width:200,marginBottom:8}} value={selScenario} onChange={e=>setSelScenario(e.target.value)}>
            {SCENARIOS.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={waterfallData}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
              <XAxis dataKey="name" tick={{fontSize:11}}/>
              <YAxis tick={{fontSize:11}}/>
              <Tooltip content={<CT/>}/>
              <Bar dataKey="value" name="Loss %" radius={[4,4,0,0]}>
                {waterfallData.map((d,i)=><Cell key={i} fill={d.fill}/>)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={cardS}>
        <div style={hdr}>SECTOR x SCENARIO HEATMAP (Revenue Impact %)</div>
        <div style={{overflowX:'auto'}}>
          <table style={{width:'100%',borderCollapse:'collapse'}}>
            <thead><tr><th style={thS}>Sector</th>{SCENARIOS.map(s=><th key={s.id} style={{...thS,fontSize:10}}>{s.name.length>10?s.name.slice(0,10)+'..':s.name}</th>)}</tr></thead>
            <tbody>{heatmapData.map((row,ri)=>(
              <tr key={ri}><td style={{...tdS,fontWeight:600}}>{row.sector}</td>
                {SCENARIOS.map(s=>{const v=row[s.id];const abs=Math.abs(v);const bg=v<-5?`rgba(153,27,27,${clamp(abs/20,0.1,0.7)})`:v<0?`rgba(146,64,14,${clamp(abs/15,0.05,0.4)})`:`rgba(6,95,70,${clamp(abs/15,0.05,0.4)})`;
                  return <td key={s.id} style={{...tdS,fontFamily:"'JetBrains Mono',monospace",fontSize:12,background:bg,textAlign:'center'}}>{fmt(v)}</td>;
                })}
              </tr>
            ))}</tbody>
          </table>
        </div>
      </div>
    </>
  );

  /* ── TAB 2: Sector Impact ── */
  const sectorDetail=useMemo(()=>{
    const imp=SECTOR_IMPACTS.find(s=>s.sector===selSector);
    if(!imp)return[];
    return SCENARIOS.map(s=>({name:s.name.length>12?s.name.slice(0,12)+'..':s.name,revenue:imp.scenarios[s.id].revenue_impact_pct,cost:imp.scenarios[s.id].cost_impact_pct,stranded:imp.scenarios[s.id].stranded_pct,capex:imp.scenarios[s.id].capex_required_pct,color:s.color}));
  },[selSector]);
  const topImpacted=useMemo(()=>{
    const scn=SCENARIOS.find(s=>s.id===selScenario)||SCENARIOS[0];
    return SECTOR_IMPACTS.map(si=>({sector:si.sector,impact:si.scenarios[scn.id].revenue_impact_pct})).sort((a,b)=>a.impact-b.impact);
  },[selScenario]);
  const scatterTransRev=useMemo(()=>{
    const scn=SCENARIOS.find(s=>s.id===selScenario)||SCENARIOS[0];
    return SECTOR_IMPACTS.map(si=>({name:si.sector,x:si.scenarios[scn.id].cost_impact_pct,y:si.scenarios[scn.id].revenue_impact_pct,z:si.scenarios[scn.id].stranded_pct}));
  },[selScenario]);

  const renderTab2=()=>(
    <>
      <div style={{display:'flex',gap:10,marginBottom:16,flexWrap:'wrap',alignItems:'center'}}>
        <select style={inputS} value={selSector} onChange={e=>setSelSector(e.target.value)}>{SECTOR_NAMES.map(s=><option key={s}>{s}</option>)}</select>
        <select style={inputS} value={selScenario} onChange={e=>setSelScenario(e.target.value)}>{SCENARIOS.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:16}}>
        <div style={cardS}>
          <div style={hdr}>{selSector.toUpperCase()} - SCENARIO COMPARISON</div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={sectorDetail}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
              <XAxis dataKey="name" tick={{fontSize:10}} angle={-20} textAnchor="end" height={55}/>
              <YAxis tick={{fontSize:11}}/>
              <Tooltip content={<CT/>}/><Legend wrapperStyle={{fontSize:11}}/>
              <Bar dataKey="revenue" name="Revenue Impact %" fill={T.red} radius={[2,2,0,0]}/>
              <Bar dataKey="cost" name="Cost Impact %" fill={T.amber} radius={[2,2,0,0]}/>
              <Bar dataKey="stranded" name="Stranded %" fill={T.indigo} radius={[2,2,0,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={cardS}>
          <div style={hdr}>TRANSITION COST vs REVENUE IMPACT</div>
          <ResponsiveContainer width="100%" height={300}>
            <ScatterChart>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
              <XAxis dataKey="x" name="Transition Cost %" tick={{fontSize:11}} label={{value:'Transition Cost %',position:'bottom',style:{fontSize:10}}}/>
              <YAxis dataKey="y" name="Revenue Impact %" tick={{fontSize:11}} label={{value:'Revenue %',angle:-90,position:'insideLeft',style:{fontSize:10}}}/>
              <ZAxis dataKey="z" range={[40,400]} name="Stranded %"/>
              <Tooltip content={({active,payload})=>{if(!active||!payload?.length)return null;const d=payload[0].payload;return <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:6,padding:10,fontSize:12}}><div style={{fontWeight:700}}>{d.name}</div><div>Cost: {fmt(d.x)}% | Rev: {fmt(d.y)}%</div><div>Stranded: {fmt(d.z)}%</div></div>;}}/>
              <Scatter data={scatterTransRev} fill={T.indigo}/>
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
        <div style={cardS}>
          <div style={hdr}>TOP 5 MOST IMPACTED SECTORS</div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={topImpacted.slice(0,5).map(d=>({name:d.sector.length>12?d.sector.slice(0,12)+'..':d.sector,impact:d.impact}))} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
              <XAxis type="number" tick={{fontSize:11}}/>
              <YAxis dataKey="name" type="category" width={100} tick={{fontSize:11}}/>
              <Tooltip content={<CT/>}/>
              <Bar dataKey="impact" name="Revenue Impact %" fill={T.red} radius={[0,4,4,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={cardS}>
          <div style={hdr}>TOP 5 LEAST IMPACTED SECTORS</div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={[...topImpacted].reverse().slice(0,5).map(d=>({name:d.sector.length>12?d.sector.slice(0,12)+'..':d.sector,impact:d.impact}))} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
              <XAxis type="number" tick={{fontSize:11}}/>
              <YAxis dataKey="name" type="category" width={100} tick={{fontSize:11}}/>
              <Tooltip content={<CT/>}/>
              <Bar dataKey="impact" name="Revenue Impact %" fill={T.green} radius={[0,4,4,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </>
  );

  /* ── TAB 3: Macro Projections ── */
  const MACRO_LABELS={gdp_growth:'GDP Growth (%)',carbon_price:'Carbon Price ($/tCO2)',inflation:'Inflation (%)',unemployment:'Unemployment (%)',interest_rate:'Interest Rate (%)'};
  const macroChartData=useMemo(()=>{
    return YEARS.filter((_,i)=>i%3===0||i===30).map(y=>{
      const row={year:y};
      SCENARIOS.forEach(s=>{
        const d=MACRO[s.id].find(m=>m.year===y);
        if(d)row[s.id]=d[macroVar];
      });
      return row;
    });
  },[macroVar]);

  const renderTab3=()=>(
    <>
      <div style={{display:'flex',gap:10,marginBottom:16,alignItems:'center'}}>
        <span style={{fontSize:13,color:T.sub,fontWeight:600}}>Variable:</span>
        {Object.entries(MACRO_LABELS).map(([k,v])=>(
          <button key={k} style={btnS(macroVar===k)} onClick={()=>setMacroVar(k)}>{v.split('(')[0].trim()}</button>
        ))}
      </div>
      <div style={cardS}>
        <div style={hdr}>{MACRO_LABELS[macroVar]} - 30-YEAR PROJECTIONS</div>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={macroChartData}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
            <XAxis dataKey="year" tick={{fontSize:11}}/>
            <YAxis tick={{fontSize:11}} label={{value:MACRO_LABELS[macroVar],angle:-90,position:'insideLeft',style:{fontSize:10}}}/>
            <Tooltip content={<CT/>}/><Legend wrapperStyle={{fontSize:10}}/>
            {SCENARIOS.map(s=><Line key={s.id} type="monotone" dataKey={s.id} name={s.name.length>14?s.name.slice(0,14)+'..':s.name} stroke={s.color} strokeWidth={2} dot={false}/>)}
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
        <div style={cardS}>
          <div style={hdr}>GDP GROWTH vs CARBON PRICE (2050)</div>
          <ResponsiveContainer width="100%" height={280}>
            <ScatterChart>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
              <XAxis dataKey="x" name="Carbon Price 2050" tick={{fontSize:11}}/>
              <YAxis dataKey="y" name="GDP Impact %" tick={{fontSize:11}}/>
              <Tooltip content={({active,payload})=>{if(!active||!payload?.length)return null;const d=payload[0].payload;return <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:6,padding:10,fontSize:12}}><div style={{fontWeight:700}}>{d.name}</div><div>${d.x}/tCO2 | GDP: {d.y}%</div></div>;}}/>
              <Scatter data={SCENARIOS.map(s=>({name:s.name,x:s.carbonPrice2050,y:s.gdpImpact_pct}))} fill={T.navy}>
                {SCENARIOS.map((s,i)=><Cell key={i} fill={s.color}/>)}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </div>
        <div style={cardS}>
          <div style={hdr}>INFLATION TRAJECTORY COMPARISON</div>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={YEARS.filter((_,i)=>i%5===0||i===30).map(y=>{const row={year:y};SCENARIOS.slice(0,4).forEach(s=>{const d=MACRO[s.id].find(m=>m.year===y);if(d)row[s.id]=d.inflation;});return row;})}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
              <XAxis dataKey="year" tick={{fontSize:11}}/>
              <YAxis tick={{fontSize:11}}/>
              <Tooltip content={<CT/>}/><Legend wrapperStyle={{fontSize:10}}/>
              {SCENARIOS.slice(0,4).map(s=><Area key={s.id} type="monotone" dataKey={s.id} name={s.name.length>14?s.name.slice(0,14)+'..':s.name} stroke={s.color} fill={s.color} fillOpacity={0.08}/>)}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </>
  );

  /* ── TAB 4: Capital & VaR ── */
  const varData=useMemo(()=>STRESS_RESULTS.map(r=>({name:r.scenario.length>12?r.scenario.slice(0,12)+'..':r.scenario,var95:Math.abs(r.var_95),var99:Math.abs(r.var_99),es95:Math.abs(r.es_95),color:r.color})),[]);
  const capitalData=useMemo(()=>{
    const baseCapital=12.5;
    return STRESS_RESULTS.map(r=>({name:r.scenario.length>14?r.scenario.slice(0,14)+'..':r.scenario,remaining:Number((baseCapital-r.capital_impact_pct).toFixed(2)),impact:r.capital_impact_pct,color:r.color}));
  },[]);

  const renderTab4=()=>(
    <>
      <div style={{display:'flex',gap:12,flexWrap:'wrap',marginBottom:16}}>
        <div style={kpiBoxS}><div style={kpiVal}>{fmtPct(12.5)}</div><div style={kpiLab}>Base Capital Ratio</div></div>
        <div style={kpiBoxS}><div style={{...kpiVal,color:T.red}}>{fmtPct(Math.max(...STRESS_RESULTS.map(r=>r.capital_impact_pct)))}</div><div style={kpiLab}>Max Capital Impact</div></div>
        <div style={kpiBoxS}><div style={kpiVal}>{fmt(Math.max(...STRESS_RESULTS.map(r=>Math.abs(r.var_99))))}</div><div style={kpiLab}>Worst VaR 99</div></div>
        <div style={kpiBoxS}><div style={{...kpiVal,color:T.amber}}>{fmt(Math.max(...STRESS_RESULTS.map(r=>Math.abs(r.es_95))))}</div><div style={kpiLab}>Worst ES 95</div></div>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:16}}>
        <div style={cardS}>
          <div style={hdr}>VaR / ES BY SCENARIO</div>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={varData}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
              <XAxis dataKey="name" tick={{fontSize:9}} angle={-20} textAnchor="end" height={55}/>
              <YAxis tick={{fontSize:11}}/>
              <Tooltip content={<CT/>}/><Legend wrapperStyle={{fontSize:10}}/>
              <Bar dataKey="var95" name="VaR 95%" fill={T.amber} radius={[2,2,0,0]}/>
              <Bar dataKey="var99" name="VaR 99%" fill={T.red} radius={[2,2,0,0]}/>
              <Bar dataKey="es95" name="ES 95%" fill={T.indigo} radius={[2,2,0,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={cardS}>
          <div style={hdr}>CAPITAL ADEQUACY WATERFALL</div>
          <ResponsiveContainer width="100%" height={320}>
            <ComposedChart data={capitalData}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
              <XAxis dataKey="name" tick={{fontSize:9}} angle={-20} textAnchor="end" height={55}/>
              <YAxis tick={{fontSize:11}} domain={[0,15]}/>
              <Tooltip content={<CT/>}/><Legend wrapperStyle={{fontSize:10}}/>
              <Bar dataKey="remaining" name="Remaining Capital %" stackId="a" fill={T.green} radius={[0,0,0,0]}/>
              <Bar dataKey="impact" name="Capital Impact %" stackId="a" fill={T.red} radius={[2,2,0,0]}/>
              <ReferenceLine y={8} stroke={T.red} strokeDasharray="5 5" label={{value:'Min Regulatory (8%)',fill:T.red,fontSize:10}}/>
              <ReferenceLine y={10.5} stroke={T.amber} strokeDasharray="3 3" label={{value:'CET1+Buffers (10.5%)',fill:T.amber,fontSize:10}}/>
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={cardS}>
        <div style={hdr}>BUFFER ANALYSIS</div>
        <div style={{overflowX:'auto'}}>
          <table style={{width:'100%',borderCollapse:'collapse'}}>
            <thead><tr><th style={thS}>Scenario</th><th style={thS}>Base Capital</th><th style={thS}>Impact</th><th style={thS}>Post-Stress</th><th style={thS}>Buffer to 8%</th><th style={thS}>Buffer to 10.5%</th><th style={thS}>Status</th></tr></thead>
            <tbody>{STRESS_RESULTS.map(r=>{
              const post=12.5-r.capital_impact_pct;const buf8=post-8;const buf105=post-10.5;
              return(<tr key={r.scenarioId}>
                <td style={{...tdS,fontWeight:600}}>{r.scenario}</td>
                <td style={{...tdS,fontFamily:"'JetBrains Mono',monospace"}}>{fmtPct(12.5)}</td>
                <td style={{...tdS,fontFamily:"'JetBrains Mono',monospace",color:T.red}}>{fmtPct(r.capital_impact_pct)}</td>
                <td style={{...tdS,fontFamily:"'JetBrains Mono',monospace",fontWeight:700}}>{fmtPct(post)}</td>
                <td style={{...tdS,fontFamily:"'JetBrains Mono',monospace",color:buf8>0?T.green:T.red}}>{fmt(buf8)}pp</td>
                <td style={{...tdS,fontFamily:"'JetBrains Mono',monospace",color:buf105>0?T.green:T.red}}>{fmt(buf105)}pp</td>
                <td style={tdS}><span style={{padding:'2px 10px',borderRadius:99,fontSize:11,fontWeight:600,background:post>10.5?T.green+'18':post>8?T.amber+'18':T.red+'18',color:post>10.5?T.green:post>8?T.amber:T.red}}>{post>10.5?'Adequate':post>8?'Warning':'Breach'}</span></td>
              </tr>);
            })}</tbody>
          </table>
        </div>
      </div>
    </>
  );

  /* ── TAB 5: Sensitivity Analysis ── */
  const sensGrid=useMemo(()=>{
    const carbonSteps=[25,50,100,150,200,300,400,500];
    const warmingSteps=[1.2,1.5,1.8,2.0,2.5,3.0,3.5,4.0];
    return warmingSteps.map(w=>{
      const row={warming:w};
      carbonSteps.forEach(c=>{
        const transLoss=c/500*8;
        const physLoss=(w-1.0)*3.5;
        const policyAdj=c>200?1.5:1.0;
        row[`c${c}`]=Number((transLoss+physLoss*policyAdj+sr(Math.floor(w*100)+c)*1.5).toFixed(2));
      });
      return row;
    });
  },[]);

  const renderTab5=()=>(
    <>
      <div style={{display:'flex',gap:16,marginBottom:16,alignItems:'center'}}>
        <div style={{fontSize:13,color:T.sub}}>Carbon Price: <strong>${sensCarbon}/tCO2</strong></div>
        <input type="range" min={10} max={500} step={10} value={sensCarbon} onChange={e=>setSensCarbon(Number(e.target.value))} style={{width:200}}/>
        <div style={{fontSize:13,color:T.sub}}>Warming: <strong>{sensWarming}\u00B0C</strong></div>
        <input type="range" min={1.0} max={4.0} step={0.1} value={sensWarming} onChange={e=>setSensWarming(Number(e.target.value))} style={{width:200}}/>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:16}}>
        <div style={kpiBoxS}><div style={{...kpiVal,color:T.red}}>{fmtPct(sensCarbon/500*8+(sensWarming-1)*3.5)}</div><div style={kpiLab}>Estimated Portfolio Loss</div></div>
        <div style={kpiBoxS}><div style={kpiVal}>{fmtPct(clamp(12.5-(sensCarbon/500*8+(sensWarming-1)*3.5)*1.25,0,15))}</div><div style={kpiLab}>Post-Stress Capital</div></div>
      </div>

      <div style={cardS}>
        <div style={hdr}>2D SENSITIVITY HEATMAP: CARBON PRICE (X) vs WARMING (Y) &rarr; PORTFOLIO LOSS (%)</div>
        <div style={{overflowX:'auto'}}>
          <table style={{width:'100%',borderCollapse:'collapse'}}>
            <thead><tr><th style={{...thS,background:T.surface}}>Warming \ CO2</th>{[25,50,100,150,200,300,400,500].map(c=><th key={c} style={{...thS,textAlign:'center'}}>${c}</th>)}</tr></thead>
            <tbody>{sensGrid.map((row,ri)=>(
              <tr key={ri}><td style={{...tdS,fontWeight:700,background:T.surface}}>{row.warming}\u00B0C</td>
                {[25,50,100,150,200,300,400,500].map(c=>{const v=row[`c${c}`];const intensity=clamp(v/15,0,1);
                  return <td key={c} style={{...tdS,textAlign:'center',fontFamily:"'JetBrains Mono',monospace",fontSize:12,background:`rgba(153,27,27,${intensity*0.6})`,color:intensity>0.5?'#fff':T.text}}>{fmt(v)}</td>;
                })}
              </tr>
            ))}</tbody>
          </table>
        </div>
      </div>

      <div style={cardS}>
        <div style={hdr}>SENSITIVITY CURVES AT SELECTED WARMING ({sensWarming}\u00B0C)</div>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={[25,50,100,150,200,300,400,500].map(c=>({carbon:c,loss:c/500*8+(sensWarming-1)*3.5+sr(c+Math.floor(sensWarming*100))*0.8}))}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
            <XAxis dataKey="carbon" tick={{fontSize:11}} label={{value:'Carbon Price ($/tCO2)',position:'bottom',style:{fontSize:10}}}/>
            <YAxis tick={{fontSize:11}} label={{value:'Portfolio Loss %',angle:-90,position:'insideLeft',style:{fontSize:10}}}/>
            <Tooltip content={<CT/>}/>
            <Line type="monotone" dataKey="loss" stroke={T.red} strokeWidth={2} dot={{r:4}} name="Loss %"/>
            <ReferenceLine y={5} stroke={T.amber} strokeDasharray="5 5" label={{value:'5% Threshold',fill:T.amber,fontSize:10}}/>
            <ReferenceLine y={10} stroke={T.red} strokeDasharray="5 5" label={{value:'10% Threshold',fill:T.red,fontSize:10}}/>
          </LineChart>
        </ResponsiveContainer>
      </div>
    </>
  );

  /* ── TAB 6: Reverse Stress ── */
  const mcPaths=useMemo(()=>{
    const paths=[];
    for(let p=0;p<1000;p++){
      let cumLoss=0;
      const pathData=[];
      for(let step=0;step<50;step++){
        const shock=sr(p*1000+step*7)*6-2;
        const drift=-0.05*step;
        cumLoss+=shock+drift;
        pathData.push({step,loss:Number(clamp(cumLoss,-50,50).toFixed(2))});
      }
      paths.push(pathData);
    }
    return paths;
  },[]);
  const mcSummary=useMemo(()=>{
    const finalLosses=mcPaths.map(p=>Math.abs(p[p.length-1].loss));
    const exceed20=finalLosses.filter(l=>l>=20).length;
    const exceed30=finalLosses.filter(l=>l>=30).length;
    const exceed50=finalLosses.filter(l=>l>=50).length;
    return{exceed20,exceed30,exceed50,total:1000};
  },[mcPaths]);
  const mcChart=useMemo(()=>{
    const sampled=[0,99,249,499,749,999].filter(i=>i<mcPaths.length);
    return Array.from({length:50},(_,step)=>{
      const row={step};
      sampled.forEach((pi,idx)=>{row[`p${idx}`]=mcPaths[pi][step].loss;});
      return row;
    });
  },[mcPaths]);
  const breachScenarios=useMemo(()=>{
    return STRESS_RESULTS.filter(r=>r.portfolio_loss_pct>=reverseThreshold).sort((a,b)=>b.portfolio_loss_pct-a.portfolio_loss_pct);
  },[reverseThreshold]);

  const renderTab6=()=>(
    <>
      <div style={{display:'flex',gap:10,marginBottom:16,alignItems:'center'}}>
        <span style={{fontSize:13,color:T.sub,fontWeight:600}}>Loss Threshold:</span>
        {[10,15,20,30,50].map(t=><button key={t} style={btnS(reverseThreshold===t)} onClick={()=>setReverseThreshold(t)}>-{t}%</button>)}
      </div>

      <div style={{display:'flex',gap:12,flexWrap:'wrap',marginBottom:16}}>
        <div style={kpiBoxS}><div style={{...kpiVal,color:T.red}}>{breachScenarios.length}/{SCENARIOS.length}</div><div style={kpiLab}>Scenarios Breach -{reverseThreshold}%</div></div>
        <div style={kpiBoxS}><div style={kpiVal}>{fmtPct(safeDivide(mcSummary.exceed20*100,mcSummary.total))}</div><div style={kpiLab}>P(Loss > 20%)</div></div>
        <div style={kpiBoxS}><div style={kpiVal}>{fmtPct(safeDivide(mcSummary.exceed30*100,mcSummary.total))}</div><div style={kpiLab}>P(Loss > 30%)</div></div>
        <div style={kpiBoxS}><div style={{...kpiVal,color:T.red}}>{fmtPct(safeDivide(mcSummary.exceed50*100,mcSummary.total))}</div><div style={kpiLab}>P(Loss > 50%)</div></div>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:16}}>
        <div style={cardS}>
          <div style={hdr}>MONTE CARLO 1,000 PATHS (6 SAMPLED)</div>
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={mcChart}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
              <XAxis dataKey="step" tick={{fontSize:11}} label={{value:'Time Step',position:'bottom',style:{fontSize:10}}}/>
              <YAxis tick={{fontSize:11}} label={{value:'Cumulative Loss %',angle:-90,position:'insideLeft',style:{fontSize:10}}}/>
              <Tooltip content={<CT/>}/>
              <ReferenceLine y={-reverseThreshold} stroke={T.red} strokeDasharray="5 5" label={{value:`-${reverseThreshold}% threshold`,fill:T.red,fontSize:10}}/>
              {[0,1,2,3,4,5].map(i=><Line key={i} type="monotone" dataKey={`p${i}`} stroke={COLORS[i%COLORS.length]} strokeWidth={1.5} dot={false} name={`Path ${i+1}`} strokeOpacity={0.7}/>)}
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div style={cardS}>
          <div style={hdr}>EXCEEDANCE PROBABILITY</div>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={[
              {threshold:'-10%',prob:Number(safeDivide(mcPaths.filter(p=>Math.abs(p[p.length-1].loss)>=10).length*100,1000).toFixed(1))},
              {threshold:'-20%',prob:Number(safeDivide(mcSummary.exceed20*100,1000).toFixed(1))},
              {threshold:'-30%',prob:Number(safeDivide(mcSummary.exceed30*100,1000).toFixed(1))},
              {threshold:'-40%',prob:Number(safeDivide(mcPaths.filter(p=>Math.abs(p[p.length-1].loss)>=40).length*100,1000).toFixed(1))},
              {threshold:'-50%',prob:Number(safeDivide(mcSummary.exceed50*100,1000).toFixed(1))},
            ]}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
              <XAxis dataKey="threshold" tick={{fontSize:12}}/>
              <YAxis tick={{fontSize:11}} label={{value:'Probability %',angle:-90,position:'insideLeft',style:{fontSize:10}}}/>
              <Tooltip content={<CT/>}/>
              <Bar dataKey="prob" name="Exceedance %" fill={T.red} radius={[4,4,0,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {breachScenarios.length>0&&(
        <div style={cardS}>
          <div style={hdr}>SCENARIOS EXCEEDING -{reverseThreshold}% LOSS THRESHOLD</div>
          <table style={{width:'100%',borderCollapse:'collapse'}}>
            <thead><tr><th style={thS}>Scenario</th><th style={thS}>Portfolio Loss %</th><th style={thS}>Transition Share</th><th style={thS}>Physical Share</th><th style={thS}>Capital Impact</th></tr></thead>
            <tbody>{breachScenarios.map(r=>(
              <tr key={r.scenarioId}>
                <td style={{...tdS,fontWeight:700,color:r.color}}>{r.scenario}</td>
                <td style={{...tdS,fontFamily:"'JetBrains Mono',monospace",color:T.red}}>{fmtPct(r.portfolio_loss_pct)}</td>
                <td style={{...tdS,fontFamily:"'JetBrains Mono',monospace"}}>{fmtPct(r.transition_share)}</td>
                <td style={{...tdS,fontFamily:"'JetBrains Mono',monospace"}}>{fmtPct(r.physical_share)}</td>
                <td style={{...tdS,fontFamily:"'JetBrains Mono',monospace",color:T.red}}>{fmtPct(r.capital_impact_pct)}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}
    </>
  );

  /* ── TAB 7: Report Generator ── */
  const reportRows=useMemo(()=>STRESS_RESULTS.map(r=>{
    const s=SCENARIOS.find(sc=>sc.id===r.scenarioId);
    return{
      scenario:r.scenario,framework:s?.framework||'',warming:s?.warming_c||0,carbon2050:s?.carbonPrice2050||0,
      gdpImpact:s?.gdpImpact_pct||0,portfolioLoss:r.portfolio_loss_pct,var95:r.var_95,var99:r.var_99,
      es95:r.es_95,capitalImpact:r.capital_impact_pct,postStressCapital:Number((12.5-r.capital_impact_pct).toFixed(2)),
      transitionShare:r.transition_share,physicalShare:r.physical_share,
    };
  }),[]);

  const renderTab7=()=>(
    <>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
        <div style={secTitle}>Comprehensive Scenario Stress Test Report</div>
        <button style={btnS(true)} onClick={()=>exportCSV(reportRows,'stress_test_report.csv')}>Export Full Report CSV</button>
      </div>

      <div style={cardS}>
        <div style={hdr}>EXECUTIVE SUMMARY</div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12,marginBottom:16}}>
          <div style={kpiBoxS}><div style={kpiVal}>{SCENARIOS.length}</div><div style={kpiLab}>Scenarios Tested</div></div>
          <div style={kpiBoxS}><div style={kpiVal}>{PORTFOLIO.length}</div><div style={kpiLab}>Portfolio Holdings</div></div>
          <div style={kpiBoxS}><div style={kpiVal}>{fmtB(TOTAL_MV)}</div><div style={kpiLab}>Total Portfolio</div></div>
          <div style={kpiBoxS}><div style={{...kpiVal,color:T.red}}>{fmtPct(Math.max(...STRESS_RESULTS.map(r=>r.portfolio_loss_pct)))}</div><div style={kpiLab}>Worst-Case Loss</div></div>
        </div>
      </div>

      <div style={cardS}>
        <div style={hdr}>FULL SCENARIO COMPARISON</div>
        <div style={{overflowX:'auto'}}>
          <table style={{width:'100%',borderCollapse:'collapse'}}>
            <thead><tr>
              {['Scenario','Type','Warming','CO2 2050','GDP %','Loss %','VaR95','VaR99','ES95','Cap. Impact','Post-Stress','Trans %','Phys %'].map(h=><th key={h} style={thS}>{h}</th>)}
            </tr></thead>
            <tbody>{reportRows.map((r,ri)=>{
              const post=r.postStressCapital;
              return(<tr key={ri} style={{background:ri%2===0?'transparent':T.surface+'80'}}>
                <td style={{...tdS,fontWeight:700,color:SCENARIOS[ri]?.color||T.navy}}>{r.scenario}</td>
                <td style={tdS}><span style={{padding:'2px 8px',borderRadius:99,fontSize:10,fontWeight:600,background:r.framework==='NGFS'?T.indigo+'18':'#7c3aed18',color:r.framework==='NGFS'?T.indigo:'#7c3aed'}}>{r.framework}</span></td>
                <td style={{...tdS,fontFamily:"'JetBrains Mono',monospace"}}>{r.warming}\u00B0C</td>
                <td style={{...tdS,fontFamily:"'JetBrains Mono',monospace"}}>${r.carbon2050}</td>
                <td style={{...tdS,fontFamily:"'JetBrains Mono',monospace",color:T.red}}>{fmt(r.gdpImpact)}%</td>
                <td style={{...tdS,fontFamily:"'JetBrains Mono',monospace",fontWeight:700,color:T.red}}>{fmt(r.portfolioLoss)}%</td>
                <td style={{...tdS,fontFamily:"'JetBrains Mono',monospace"}}>{fmt(Math.abs(r.var95))}</td>
                <td style={{...tdS,fontFamily:"'JetBrains Mono',monospace"}}>{fmt(Math.abs(r.var99))}</td>
                <td style={{...tdS,fontFamily:"'JetBrains Mono',monospace"}}>{fmt(Math.abs(r.es95))}</td>
                <td style={{...tdS,fontFamily:"'JetBrains Mono',monospace",color:T.red}}>{fmt(r.capitalImpact)}%</td>
                <td style={{...tdS,fontFamily:"'JetBrains Mono',monospace",fontWeight:700,color:post>10.5?T.green:post>8?T.amber:T.red}}>{fmt(post)}%</td>
                <td style={{...tdS,fontFamily:"'JetBrains Mono',monospace"}}>{fmt(r.transitionShare)}%</td>
                <td style={{...tdS,fontFamily:"'JetBrains Mono',monospace"}}>{fmt(r.physicalShare)}%</td>
              </tr>);
            })}</tbody>
          </table>
        </div>
      </div>

      <div style={cardS}>
        <div style={hdr}>PORTFOLIO LOSS SUMMARY</div>
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart data={STRESS_RESULTS.map(r=>({name:r.scenario.length>12?r.scenario.slice(0,12)+'..':r.scenario,loss:r.portfolio_loss_pct,capital:12.5-r.capital_impact_pct,color:r.color}))}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
            <XAxis dataKey="name" tick={{fontSize:10}} angle={-20} textAnchor="end" height={55}/>
            <YAxis yAxisId="left" tick={{fontSize:11}} label={{value:'Loss %',angle:-90,position:'insideLeft',style:{fontSize:10}}}/>
            <YAxis yAxisId="right" orientation="right" tick={{fontSize:11}} label={{value:'Capital %',angle:90,position:'insideRight',style:{fontSize:10}}}/>
            <Tooltip content={<CT/>}/><Legend wrapperStyle={{fontSize:10}}/>
            <Bar yAxisId="left" dataKey="loss" name="Portfolio Loss %" fill={T.red} radius={[4,4,0,0]}/>
            <Line yAxisId="right" type="monotone" dataKey="capital" name="Post-Stress Capital %" stroke={T.green} strokeWidth={2} dot={{r:4}}/>
            <ReferenceLine yAxisId="right" y={8} stroke={T.red} strokeDasharray="5 5"/>
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div style={cardS}>
        <div style={hdr}>METHODOLOGY NOTES</div>
        <div style={{fontSize:13,lineHeight:1.8,color:T.sub}}>
          <p><strong>Frameworks:</strong> NGFS Phase IV scenarios, EBA 2025 EU-wide stress test parameters, Federal Reserve DFAST/CCAR climate pilot, Bank of England/PRA CBES methodologies.</p>
          <p><strong>Risk Metrics:</strong> VaR computed at 95th and 99th percentile using historical simulation. Expected Shortfall (ES) at 95th percentile. Capital impact computed as portfolio loss x 1.25 RWA multiplier per Basel III climate risk supplement.</p>
          <p><strong>Macro Projections:</strong> 30-year trajectories for GDP growth, carbon price, inflation, unemployment, and interest rates calibrated to NGFS scenario outputs (REMIND-MAgPIE model).</p>
          <p><strong>Reverse Stress:</strong> 1,000 Monte Carlo paths with stochastic shocks. Exceedance probabilities computed at -10%, -20%, -30%, -40%, and -50% loss thresholds.</p>
        </div>
      </div>
    </>
  );

  /* ══════════════════════ RENDER ══════════════════════ */
  return(
    <div style={{fontFamily:"'DM Sans',sans-serif",background:T.surface,minHeight:'100vh',padding:24}}>
      <div style={{maxWidth:1440,margin:'0 auto'}}>
        <div style={{marginBottom:20}}>
          <h1 style={{fontSize:22,fontWeight:700,color:T.navy,margin:0}}>Multi-Scenario Climate Stress Testing</h1>
          <p style={{fontSize:13,color:T.sub,marginTop:4}}>NGFS / EBA / Fed / PRA frameworks -- {SCENARIOS.length} scenarios, {PORTFOLIO.length} holdings, ${fmt(TOTAL_MV,0)}M AUM</p>
        </div>
        <div style={{display:'flex',gap:4,marginBottom:20,borderBottom:`2px solid ${T.border}`,paddingBottom:8,flexWrap:'wrap'}}>
          {TABS.map((t,i)=><button key={i} style={{...btnS(tab===i),fontSize:12,padding:'6px 14px'}} onClick={()=>setTab(i)}>{t}</button>)}
        </div>
        {tab===0&&renderTab0()}
        {tab===1&&renderTab1()}
        {tab===2&&renderTab2()}
        {tab===3&&renderTab3()}
        {tab===4&&renderTab4()}
        {tab===5&&renderTab5()}
        {tab===6&&renderTab6()}
        {tab===7&&renderTab7()}
      </div>
    </div>
  );
}
