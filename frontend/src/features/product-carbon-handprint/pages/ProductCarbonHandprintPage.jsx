import React,{useState,useMemo,useCallback} from 'react';
import {BarChart,Bar,XAxis,YAxis,CartesianGrid,Tooltip,ResponsiveContainer,LineChart,Line,AreaChart,Area,Cell,Legend,PieChart,Pie,RadarChart,Radar,PolarGrid,PolarAngleAxis,PolarRadiusAxis} from 'recharts';
import { GWP_VALUES, EMISSION_FACTORS } from '../../../data/referenceData';

const T={bg:'#f6f4f0',surface:'#ffffff',surfaceH:'#f0ede7',border:'#e5e0d8',borderL:'#d5cfc5',navy:'#1b3a5c',navyL:'#2c5a8c',gold:'#c5a96a',goldL:'#d4be8a',sage:'#5a8a6a',sageL:'#7ba67d',teal:'#5a8a6a',text:'#1b3a5c',textSec:'#5c6b7e',textMut:'#9aa3ae',red:'#dc2626',green:'#16a34a',amber:'#d97706',font:"'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"};
const sr=(s)=>{let x=Math.sin(s+1)*10000;return x-Math.floor(x);};

const STAGES=['Raw Materials','Manufacturing','Distribution','Use Phase','End-of-Life','Recycling'];
const STAGE_COLORS=[T.navy,'#4a7a9c',T.gold,T.sage,'#a67a5a','#5aaa7a'];
const CATEGORIES=['Electronics','Automotive','Textiles','Packaging','Construction','Chemicals','Food & Bev','Energy Equipment','Pharmaceuticals','Home Appliances'];
const IMPACT_CATS=['GWP','ODP','AP','EP-freshwater','EP-marine','EP-terrestrial','POCP','ADP-minerals','ADP-fossil','WDP','IRP','LU'];
const COMPANIES=['Siemens','BASF','Unilever','Samsung','Toyota','Vestas','Tesla','Patagonia','Interface','Schneider','Philips','3M','Dow','Nestl\u00e9','Bosch','LG','Henkel','ABB','Danone','IKEA','Sony','Panasonic','Johnson Controls','Eaton','Kingspan','Rockwool','Daikin','Mitsubishi','Hitachi','Toshiba'];

const genProducts=()=>{
  const prods=[];
  const names=[
    ['Smart Thermostat','LED Panel 60W','Solar Inverter 5kW','EV Charger L2','Battery Pack 10kWh','Heat Pump 12kW','Wind Turbine Ctrl','Energy Monitor','Power Optimizer','Smart Grid Relay'],
    ['EV Sedan Model X','Hybrid SUV Pro','E-Bike Urban','Fuel Cell Truck','Regen Brake Kit','Lightweight Frame','EV Motor 200kW','Hybrid Transaxle','Carbon Fiber Hood','Aero Wing Kit'],
    ['Recycled Polyester','Organic Cotton Tee','Hemp Jacket','Bio-Nylon Fiber','Tencel Blend Shirt','Wool Insulation','Bamboo Fabric','Recycled Denim','Lyocell Dress','Bio-Leather Belt'],
    ['Bio-PLA Container','Mushroom Packaging','Seaweed Wrap','Recycled HDPE Box','Compostable Mailer','Paper Pulp Tray','Algae Film Wrap','Bagasse Bowl','Cellulose Pouch','Cork Stopper'],
    ['Green Concrete Mix','CLT Beam 6m','Recycled Steel Bar','Low-E Glass Panel','Hempcrete Block','Geopolymer Brick','Bamboo Laminate','Aerogel Insulation','Phase Change Tile','Solar Roof Tile'],
    ['Bio-Solvent A1','Green Catalyst X','Recycled Polymer R','Bio-Adhesive G','Eco-Surfactant','Plant Resin','Bio-Lubricant','Green Pigment','Enzyme Cleaner','Algae Bioplastic'],
    ['Plant Protein Bar','Oat Milk 1L','Lab-Grown Chicken','Fermented Alt-Cheese','Vertical Farm Lettuce','Insect Protein Flour','Algae Spirulina','Precision Coffee','Cell-Cultured Fish','Bio-Fortified Rice'],
    ['Solar Panel 400W','Wind Blade 80m','Li-Ion Cell 21700','Green H2 Electrolyzer','Solid-State Battery','Perovskite Module','Flow Battery Stack','Tidal Turbine','Geothermal Pump','Biogas Generator'],
    ['Green Inhaler','Bio-Syringe','Plant Capsule Shell','Eco Blister Pack','Recycled Vial','Bio-Coated Tablet','Green IV Bag','Cellulose Bandage','Plant Suture','Enzyme Drug Carrier'],
    ['Inverter AC Unit','Heat Pump Dryer','Induction Cooktop','Smart Fridge A+++','Robot Vacuum Pro','Air Purifier HEPA','Tankless Water Heat','Smart Washer','Dehumidifier Pro','LED Ceiling Light']
  ];
  for(let c=0;c<10;c++){
    for(let p=0;p<10;p++){
      const idx=c*10+p;
      const s=sr(idx*7+3);
      const baseFootprint=50+s*400;
      const stages=STAGES.map((_,si)=>{
        const w=sr(idx*13+si*7);
        const weights=[0.25,0.2,0.1,0.3,0.1,0.05];
        return +(baseFootprint*weights[si]*(0.6+w*0.8)).toFixed(1);
      });
      stages[5]= -(stages[5]);
      const totalFP=stages.reduce((a,v)=>a+v,0);
      const baselineMulti=1.2+sr(idx*19)*0.8;
      const baseline=+(totalFP*baselineMulti).toFixed(1);
      const handprint=+(baseline-totalFP).toFixed(1);
      prods.push({
        id:idx,name:names[c][p],category:CATEGORIES[c],
        company:COMPANIES[idx%30],
        stages,totalFootprint:+totalFP.toFixed(1),baseline,handprint,
        impactScores:IMPACT_CATS.map((_,i)=>+(sr(idx*31+i*11)*100).toFixed(1)),
        year:2020+Math.floor(sr(idx*41)*6),
        rdInvestM:+(0.5+sr(idx*53)*15).toFixed(1),
        attributionFactor:+(0.6+sr(idx*61)*0.35).toFixed(2),
        usePhaseYears:Math.ceil(1+sr(idx*71)*14),
        certLevel:['Gold','Silver','Bronze','Pending'][Math.floor(sr(idx*83)*4)],
        marketShare:+(sr(idx*91)*25).toFixed(1),
        materialMix:{steel:+(sr(idx*101)*30).toFixed(1),aluminum:+(sr(idx*103)*20).toFixed(1),plastic:+(sr(idx*107)*25).toFixed(1),other:+(sr(idx*109)*25).toFixed(1)},
      });
    }
  }
  return prods;
};
const PRODUCTS=genProducts();

const ISO_CHECKLIST=[
  {id:1,text:'System boundary defined per ISO 14067 Clause 6.3',section:'Scope'},
  {id:2,text:'Functional unit clearly specified with reference flow',section:'Scope'},
  {id:3,text:'Cut-off criteria documented (<1% mass/energy)',section:'Scope'},
  {id:4,text:'Data quality requirements met (DQR score)',section:'Data'},
  {id:5,text:'Primary data collected for foreground system',section:'Data'},
  {id:6,text:'Secondary data sources documented and justified',section:'Data'},
  {id:7,text:'Allocation procedures comply with Clause 6.4.6',section:'Methodology'},
  {id:8,text:'Biogenic carbon accounting per Clause 6.4.9',section:'Methodology'},
  {id:9,text:'Land use change emissions included',section:'Methodology'},
  {id:10,text:'Baseline scenario selection justified and documented',section:'Handprint'},
  {id:11,text:'Avoided emissions calculation methodology transparent',section:'Handprint'},
  {id:12,text:'Attribution factor applied with rationale',section:'Handprint'},
  {id:13,text:'Sensitivity analysis performed on key assumptions',section:'Verification'},
  {id:14,text:'Uncertainty assessment documented',section:'Verification'},
  {id:15,text:'Third-party critical review completed',section:'Verification'},
];

const MATERIALS=['Steel','Aluminum','Copper','Plastic-ABS','Plastic-PP','Glass','Silicon','Rubber','Lithium','Concrete','Carbon Fiber','Titanium'];

const card={background:T.surface,borderRadius:12,border:`1px solid ${T.border}`,padding:20,marginBottom:16};
const hdr={fontSize:13,fontWeight:600,color:T.textSec,textTransform:'uppercase',letterSpacing:0.5,marginBottom:12};
const kpiStyle={fontSize:28,fontWeight:700,color:T.navy,fontFamily:T.font};
const badge=(c)=>({display:'inline-block',padding:'2px 10px',borderRadius:10,fontSize:11,fontWeight:600,background:c+'18',color:c});
const btn=(primary)=>({padding:'8px 18px',borderRadius:8,border:primary?'none':`1px solid ${T.border}`,background:primary?T.navy:T.surface,color:primary?'#fff':T.text,fontSize:13,fontWeight:600,cursor:'pointer',fontFamily:T.font});
const inp={padding:'6px 10px',borderRadius:6,border:`1px solid ${T.border}`,fontSize:13,fontFamily:T.mono,width:80,textAlign:'right'};
const sel={padding:'6px 12px',borderRadius:6,border:`1px solid ${T.border}`,fontSize:13,fontFamily:T.font,background:T.surface,cursor:'pointer'};

const CustomTooltip=({active,payload,label})=>{
  if(!active||!payload?.length)return null;
  return(<div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:8,padding:10,fontSize:12,fontFamily:T.font,boxShadow:'0 2px 8px rgba(0,0,0,0.08)'}}>
    <div style={{fontWeight:600,marginBottom:4,color:T.navy}}>{label}</div>
    {payload.map((p,i)=><div key={i} style={{color:p.color||T.text,marginBottom:2}}>{p.name}: {typeof p.value==='number'?p.value.toFixed(1):p.value}</div>)}
  </div>);
};

const MiniKPI=({label,value,color,sub})=>(
  <div style={card}>
    <div style={hdr}>{label}</div>
    <div style={{...kpiStyle,color:color||T.navy,fontSize:22}}>{value}</div>
    {sub&&<div style={{fontSize:11,color:T.textMut,marginTop:2}}>{sub}</div>}
  </div>
);

/* ======= TAB 1: Handprint Calculator ======= */
const HandprintCalculator=()=>{
  const [selId,setSelId]=useState(0);
  const [compId,setCompId]=useState(null);
  const [edits,setEdits]=useState({});
  const [attrSlider,setAttrSlider]=useState(null);
  const [useYears,setUseYears]=useState(null);
  const [calculated,setCalculated]=useState(false);
  const [catFilter,setCatFilter]=useState('All');
  const [showSensitivity,setShowSensitivity]=useState(false);
  const [scenarioName,setScenarioName]=useState('');
  const [savedScenarios,setSavedScenarios]=useState([]);

  const prod=PRODUCTS[selId];
  const comp=compId!==null?PRODUCTS[compId]:null;

  const getStages=(p)=>STAGES.map((_,i)=>{
    const key=`${p.id}_${i}`;
    return edits[key]!==undefined?edits[key]:p.stages[i];
  });
  const af=attrSlider!==null?attrSlider:prod.attributionFactor;
  const uy=useYears!==null?useYears:prod.usePhaseYears;

  const stagesA=getStages(prod);
  const totalA=stagesA.reduce((a,v)=>a+v,0);
  const baseA=prod.baseline;
  const handA=+((baseA-totalA)*af).toFixed(1);

  const stagesB=comp?getStages(comp):null;
  const totalB=comp?stagesB.reduce((a,v)=>a+v,0):0;
  const handB=comp?+((comp.baseline-totalB)*(attrSlider||comp.attributionFactor)).toFixed(1):0;

  const waterfall=STAGES.map((name,i)=>({name:name.length>12?name.slice(0,12)+'..':name,value:stagesA[i],fill:STAGE_COLORS[i]}));
  waterfall.push({name:'Total',value:+totalA.toFixed(1),fill:T.navy});

  const compBar=[{name:prod.name.slice(0,18),Footprint:+totalA.toFixed(1),Baseline:baseA,Handprint:handA>0?handA:0}];
  if(comp)compBar.push({name:comp.name.slice(0,18),Footprint:+totalB.toFixed(1),Baseline:comp.baseline,Handprint:handB>0?handB:0});

  const filteredProds=catFilter==='All'?PRODUCTS:PRODUCTS.filter(p=>p.category===catFilter);

  const doCalc=useCallback(()=>setCalculated(true),[]);

  const saveScenario=useCallback(()=>{
    if(!scenarioName)return;
    setSavedScenarios(prev=>[...prev,{name:scenarioName,product:prod.name,total:totalA.toFixed(1),handprint:handA,af,uy,timestamp:new Date().toLocaleTimeString()}]);
    setScenarioName('');
  },[scenarioName,prod.name,totalA,handA,af,uy]);

  const sensitivityData=useMemo(()=>{
    const factors=[0.5,0.6,0.7,0.8,0.9,1.0];
    return factors.map(f=>({
      factor:`${(f*100).toFixed(0)}%`,
      Handprint:+((baseA-totalA)*f).toFixed(1),
      'Annual Avoided':+((baseA-totalA)*f/uy).toFixed(1),
    }));
  },[baseA,totalA,uy]);

  const stageContribPie=STAGES.map((st,i)=>({name:st,value:Math.abs(stagesA[i]),fill:STAGE_COLORS[i]}));

  return(<div>
    <div style={{display:'flex',gap:12,marginBottom:16,flexWrap:'wrap',alignItems:'center'}}>
      <select style={sel} value={catFilter} onChange={e=>setCatFilter(e.target.value)}>
        <option value="All">All Categories ({PRODUCTS.length})</option>
        {CATEGORIES.map(c=><option key={c} value={c}>{c} ({PRODUCTS.filter(p=>p.category===c).length})</option>)}
      </select>
      <select style={{...sel,minWidth:240}} value={selId} onChange={e=>{setSelId(+e.target.value);setCalculated(false);setEdits({});setAttrSlider(null);setUseYears(null);}}>
        {filteredProds.map(p=><option key={p.id} value={p.id}>{p.name} ({p.company})</option>)}
      </select>
      <span style={{fontSize:12,color:T.textMut}}>Compare with:</span>
      <select style={{...sel,minWidth:200}} value={compId??''} onChange={e=>setCompId(e.target.value?+e.target.value:null)}>
        <option value="">No comparison</option>
        {filteredProds.filter(p=>p.id!==selId).map(p=><option key={p.id} value={p.id}>{p.name}</option>)}
      </select>
    </div>

    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr 1fr 1fr',gap:12,marginBottom:16}}>
      <MiniKPI label="Product Footprint" value={`${totalA.toFixed(1)}`} color={T.navy} sub="kgCO2e total"/>
      <MiniKPI label="Baseline Alternative" value={`${baseA}`} color={T.amber} sub="kgCO2e conventional"/>
      <MiniKPI label="Net Handprint" value={`${handA>0?'+':''}${handA}`} color={handA>0?T.green:T.red} sub="kgCO2e avoided"/>
      <MiniKPI label="Attribution Factor" value={`${(af*100).toFixed(0)}%`} color={T.gold} sub={`${uy}-yr use phase`}/>
      <MiniKPI label="HP/FP Ratio" value={`${(handA/Math.max(totalA,1)).toFixed(2)}x`} color={T.sage} sub="handprint to footprint"/>
    </div>

    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:16}}>
      <div style={card}>
        <div style={hdr}>Lifecycle Stage Waterfall (kgCO2e)</div>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={waterfall}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
            <XAxis dataKey="name" tick={{fontSize:10,fill:T.textSec}} interval={0} angle={-20} textAnchor="end" height={50}/>
            <YAxis tick={{fontSize:10,fill:T.textSec}}/>
            <Tooltip content={<CustomTooltip/>}/>
            <Bar dataKey="value" radius={[4,4,0,0]}>{waterfall.map((d,i)=><Cell key={i} fill={d.fill}/>)}</Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div style={card}>
        <div style={hdr}>Footprint vs Baseline vs Handprint</div>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={compBar}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
            <XAxis dataKey="name" tick={{fontSize:10,fill:T.textSec}}/>
            <YAxis tick={{fontSize:10,fill:T.textSec}}/>
            <Tooltip content={<CustomTooltip/>}/><Legend wrapperStyle={{fontSize:11}}/>
            <Bar dataKey="Footprint" fill={T.navy} radius={[4,4,0,0]}/>
            <Bar dataKey="Baseline" fill={T.amber} radius={[4,4,0,0]}/>
            <Bar dataKey="Handprint" fill={T.green} radius={[4,4,0,0]}/>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>

    <div style={{display:'grid',gridTemplateColumns:'2fr 1fr',gap:16,marginBottom:16}}>
      <div style={card}>
        <div style={hdr}>Editable Stage Inputs (kgCO2e)</div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(6,1fr)',gap:8,marginBottom:12}}>
          {STAGES.map((st,i)=>(
            <div key={i}>
              <div style={{fontSize:11,color:T.textSec,marginBottom:4}}>{st}</div>
              <input type="number" style={inp} value={edits[`${prod.id}_${i}`]??prod.stages[i]}
                onChange={e=>{setEdits(prev=>({...prev,[`${prod.id}_${i}`]:+e.target.value}));setCalculated(false);}}/>
              <div style={{fontSize:9,color:T.textMut,marginTop:2}}>{((Math.abs(stagesA[i])/Math.max(totalA,1))*100).toFixed(0)}% share</div>
            </div>
          ))}
        </div>
        <div style={{display:'flex',gap:20,alignItems:'center',marginBottom:12,flexWrap:'wrap'}}>
          <div>
            <div style={{fontSize:11,color:T.textSec,marginBottom:4}}>Attribution Factor: {(af*100).toFixed(0)}%</div>
            <input type="range" min={0} max={100} value={Math.round(af*100)}
              onChange={e=>{setAttrSlider(+e.target.value/100);setCalculated(false);}}
              style={{width:200,accentColor:T.gold}}/>
          </div>
          <div>
            <div style={{fontSize:11,color:T.textSec,marginBottom:4}}>Use-Phase Years</div>
            <input type="number" style={inp} value={uy} onChange={e=>{setUseYears(+e.target.value);setCalculated(false);}} min={1} max={30}/>
          </div>
          <div>
            <div style={{fontSize:11,color:T.textSec,marginBottom:4}}>Baseline Multiplier</div>
            <input type="number" style={inp} value={(baseA/totalA).toFixed(2)} disabled/>
          </div>
        </div>
        <div style={{display:'flex',gap:8,alignItems:'center'}}>
          <button style={btn(true)} onClick={doCalc}>Calculate Handprint</button>
          <button style={btn(false)} onClick={()=>setShowSensitivity(!showSensitivity)}>
            {showSensitivity?'Hide':'Show'} Sensitivity
          </button>
          <input style={{...inp,width:140,textAlign:'left'}} placeholder="Scenario name..." value={scenarioName} onChange={e=>setScenarioName(e.target.value)}/>
          <button style={btn(false)} onClick={saveScenario}>Save</button>
        </div>
        {calculated&&(
          <div style={{marginTop:16,padding:16,background:handA>0?T.green+'10':T.red+'10',borderRadius:8,border:`1px solid ${handA>0?T.green:T.red}30`}}>
            <div style={{fontSize:15,fontWeight:700,color:handA>0?T.green:T.red}}>
              {handA>0?`Positive Handprint: +${handA} kgCO2e avoided`:`Negative Handprint: ${handA} kgCO2e additional emissions`}
            </div>
            <div style={{fontSize:12,color:T.textSec,marginTop:4}}>
              Based on {uy}-year use phase, {(af*100).toFixed(0)}% attribution | Baseline: {baseA} kgCO2e | Product: {totalA.toFixed(1)} kgCO2e
            </div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12,marginTop:8}}>
              <div><div style={{fontSize:10,color:T.textMut}}>Annual Avoided</div><div style={{fontFamily:T.mono,fontWeight:600}}>{(handA/uy).toFixed(1)} kgCO2e/yr</div></div>
              <div><div style={{fontSize:10,color:T.textMut}}>HP/FP Ratio</div><div style={{fontFamily:T.mono,fontWeight:600}}>{(handA/Math.max(totalA,1)).toFixed(2)}x</div></div>
              <div><div style={{fontSize:10,color:T.textMut}}>Reduction %</div><div style={{fontFamily:T.mono,fontWeight:600}}>{((handA/baseA)*100).toFixed(1)}%</div></div>
              <div><div style={{fontSize:10,color:T.textMut}}>Carbon Payback</div><div style={{fontFamily:T.mono,fontWeight:600}}>{handA>0?(totalA/handA*uy).toFixed(1)+' yrs':'N/A'}</div></div>
            </div>
          </div>
        )}
      </div>
      <div style={card}>
        <div style={hdr}>Stage Contribution</div>
        <ResponsiveContainer width="100%" height={200}>
          <PieChart><Pie data={stageContribPie} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} innerRadius={35}>
            {stageContribPie.map((d,i)=><Cell key={i} fill={d.fill}/>)}
          </Pie><Tooltip content={<CustomTooltip/>}/><Legend wrapperStyle={{fontSize:9}}/></PieChart>
        </ResponsiveContainer>
        {showSensitivity&&(
          <div style={{marginTop:8}}>
            <div style={{fontSize:11,fontWeight:600,color:T.navy,marginBottom:4}}>Attribution Sensitivity</div>
            <ResponsiveContainer width="100%" height={120}>
              <BarChart data={sensitivityData}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
                <XAxis dataKey="factor" tick={{fontSize:9,fill:T.textSec}}/>
                <YAxis tick={{fontSize:9,fill:T.textSec}}/>
                <Bar dataKey="Handprint" fill={T.green} radius={[3,3,0,0]}/>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>

    {savedScenarios.length>0&&(
      <div style={card}>
        <div style={hdr}>Saved Scenarios ({savedScenarios.length})</div>
        <table style={{width:'100%',fontSize:12,borderCollapse:'collapse'}}>
          <thead><tr style={{borderBottom:`2px solid ${T.border}`}}>
            {['Scenario','Product','Footprint','Handprint','AF','Use Yrs','Time'].map(h=><th key={h} style={{padding:'6px 8px',textAlign:'left',color:T.textSec,fontWeight:600}}>{h}</th>)}
          </tr></thead>
          <tbody>{savedScenarios.map((s,i)=>(
            <tr key={i} style={{borderBottom:`1px solid ${T.border}08`}}>
              <td style={{padding:'6px 8px',fontWeight:600}}>{s.name}</td>
              <td style={{padding:'6px 8px'}}>{s.product}</td>
              <td style={{padding:'6px 8px',fontFamily:T.mono}}>{s.total}</td>
              <td style={{padding:'6px 8px',fontFamily:T.mono,color:s.handprint>0?T.green:T.red}}>{s.handprint>0?'+':''}{s.handprint}</td>
              <td style={{padding:'6px 8px',fontFamily:T.mono}}>{(s.af*100).toFixed(0)}%</td>
              <td style={{padding:'6px 8px',fontFamily:T.mono}}>{s.uy}</td>
              <td style={{padding:'6px 8px',color:T.textMut}}>{s.timestamp}</td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    )}

    {comp&&(
      <div style={card}>
        <div style={hdr}>Side-by-Side Comparison: {prod.name} vs {comp.name}</div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:16}}>
          {[{p:prod,s:stagesA,t:totalA,h:handA},{p:comp,s:stagesB,t:totalB,h:handB}].map(({p,s,t,h},idx)=>(
            <div key={idx} style={{background:T.surfaceH,borderRadius:8,padding:12}}>
              <div style={{fontSize:14,fontWeight:700,color:T.navy,marginBottom:8}}>{p.name} ({p.company})</div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:4,fontSize:12}}>
                {STAGES.map((st,i)=>(
                  <div key={i} style={{display:'flex',justifyContent:'space-between'}}>
                    <span style={{color:T.textSec}}>{st}:</span>
                    <span style={{fontFamily:T.mono}}>{s[i].toFixed(1)}</span>
                  </div>
                ))}
                <div style={{gridColumn:'1/-1',borderTop:`1px solid ${T.border}`,paddingTop:4,marginTop:4,display:'flex',justifyContent:'space-between',fontWeight:700}}>
                  <span>Handprint:</span>
                  <span style={{color:h>0?T.green:T.red}}>{h>0?'+':''}{h} kgCO2e</span>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div style={hdr}>Comparison Chart</div>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={STAGES.map((st,i)=>({name:st,[prod.name.slice(0,14)]:stagesA[i],[comp.name.slice(0,14)]:stagesB[i]}))}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
            <XAxis dataKey="name" tick={{fontSize:9,fill:T.textSec}} interval={0}/>
            <YAxis tick={{fontSize:10,fill:T.textSec}}/>
            <Tooltip content={<CustomTooltip/>}/><Legend wrapperStyle={{fontSize:10}}/>
            <Bar dataKey={prod.name.slice(0,14)} fill={T.navy} radius={[3,3,0,0]}/>
            <Bar dataKey={comp.name.slice(0,14)} fill={T.gold} radius={[3,3,0,0]}/>
          </BarChart>
        </ResponsiveContainer>
      </div>
    )}

    {/* Top 10 Products by Handprint */}
    <div style={card}>
      <div style={hdr}>Top 10 Products by Handprint (Filtered: {catFilter})</div>
      <table style={{width:'100%',fontSize:12,borderCollapse:'collapse'}}>
        <thead><tr style={{borderBottom:`2px solid ${T.border}`}}>
          {['#','Product','Category','Company','Footprint','Baseline','Handprint','Attribution','Use Yrs','HP/FP'].map(h=>
            <th key={h} style={{padding:'6px 8px',textAlign:'left',color:T.textSec,fontWeight:600}}>{h}</th>
          )}
        </tr></thead>
        <tbody>{filteredProds.sort((a,b)=>b.handprint-a.handprint).slice(0,10).map((p,i)=>(
          <tr key={p.id} style={{borderBottom:`1px solid ${T.border}08`,background:i<3?T.green+'06':'transparent',cursor:'pointer'}} onClick={()=>{setSelId(p.id);setCalculated(false);}}>
            <td style={{padding:'6px 8px',fontWeight:700,color:i<3?T.green:T.text}}>{i+1}</td>
            <td style={{padding:'6px 8px',fontWeight:500}}>{p.name}</td>
            <td style={{padding:'6px 8px',color:T.textSec}}>{p.category}</td>
            <td style={{padding:'6px 8px',color:T.textSec}}>{p.company}</td>
            <td style={{padding:'6px 8px',fontFamily:T.mono}}>{p.totalFootprint}</td>
            <td style={{padding:'6px 8px',fontFamily:T.mono}}>{p.baseline}</td>
            <td style={{padding:'6px 8px',fontFamily:T.mono,fontWeight:600,color:p.handprint>0?T.green:T.red}}>{p.handprint>0?'+':''}{p.handprint}</td>
            <td style={{padding:'6px 8px',fontFamily:T.mono}}>{(p.attributionFactor*100).toFixed(0)}%</td>
            <td style={{padding:'6px 8px',fontFamily:T.mono}}>{p.usePhaseYears}</td>
            <td style={{padding:'6px 8px',fontFamily:T.mono}}>{(p.handprint/Math.max(p.totalFootprint,1)).toFixed(2)}x</td>
          </tr>
        ))}</tbody>
      </table>
    </div>
  </div>);
};

/* ======= TAB 2: Lifecycle Deep-Dive ======= */
const LifecycleDeepDive=()=>{
  const [selId,setSelId]=useState(0);
  const [edits,setEdits]=useState({});
  const [matSwap,setMatSwap]=useState(null);
  const [improvePct,setImprovePct]=useState(10);
  const [showImpact,setShowImpact]=useState(false);

  const prod=PRODUCTS[selId];
  const getVal=(i)=>edits[`${prod.id}_${i}`]??prod.stages[i];
  const stages=STAGES.map((_,i)=>getVal(i));
  const total=stages.reduce((a,v)=>a+v,0);
  const hotIdx=stages.indexOf(Math.max(...stages.filter(v=>v>0)));

  const sankeyData=STAGES.map((st,i)=>({
    name:st,
    'Raw Input':+(stages[i]*sr(selId*3+i*5+1)*0.4).toFixed(1),
    'Process Energy':+(stages[i]*sr(selId*3+i*5+2)*0.35).toFixed(1),
    'Waste & Loss':+(stages[i]*sr(selId*3+i*5+3)*0.25).toFixed(1),
  }));

  const matData=MATERIALS.map((m,i)=>({
    name:m,
    current:+(5+sr(selId*7+i*13)*40).toFixed(1),
    alternative:+(3+sr(selId*7+i*13+1)*30).toFixed(1),
    savings:+(2+sr(selId*7+i*13)*10).toFixed(1),
    substituteTo:['Recycled Steel','Bio-Al','Optical Fiber','Bio-PLA','rPP','Recycled Glass','Gallium','Bio-Rubber','Sodium','Geopolymer','Flax Fiber','Stainless'][i],
  }));

  const benchmarks=STAGES.map((st,i)=>{
    const catProds=PRODUCTS.filter(p=>p.category===prod.category);
    const vals=catProds.map(p=>Math.abs(p.stages[i]));
    return {name:st,Product:Math.abs(stages[i]),CatAvg:+(vals.reduce((a,v)=>a+v,0)/ Math.max(1, vals.length)).toFixed(1),BestInClass:+Math.min(...vals).toFixed(1)};
  });

  const improveSim=STAGES.map((st,i)=>({
    name:st,
    Current:stages[i],
    [`-${improvePct}%`]:+(stages[i]*(1-improvePct/100)).toFixed(1),
    [`-${improvePct*2}%`]:+(stages[i]*(1-improvePct*2/100)).toFixed(1),
  }));

  const impactRadar=IMPACT_CATS.map((cat,i)=>({subject:cat,Product:prod.impactScores[i],CategoryAvg:50+sr(i*23+selId)*30}));

  const annualTimeline=[2020,2021,2022,2023,2024,2025].map(y=>({
    year:y,
    Footprint:+(total*(1-0.03*(y-2020))+sr(y*selId)*10).toFixed(1),
    Handprint:+(prod.handprint*(1+0.05*(y-2020))+sr(y*selId+1)*5).toFixed(1),
  }));

  return(<div>
    <div style={{display:'flex',gap:12,marginBottom:16,alignItems:'center',flexWrap:'wrap'}}>
      <select style={{...sel,minWidth:300}} value={selId} onChange={e=>{setSelId(+e.target.value);setEdits({});}}>
        {PRODUCTS.map(p=><option key={p.id} value={p.id}>{p.name} - {p.category} ({p.company})</option>)}
      </select>
      <span style={badge(T.sage)}>Total: {total.toFixed(1)} kgCO2e</span>
      <span style={badge(STAGE_COLORS[hotIdx])}>Hot-spot: {STAGES[hotIdx]}</span>
      <span style={badge(T.gold)}>Cert: {prod.certLevel}</span>
      <button style={btn(false)} onClick={()=>setShowImpact(!showImpact)}>{showImpact?'Hide':'Show'} Impact Profile</button>
    </div>

    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:16}}>
      <div style={card}>
        <div style={hdr}>Stage Breakdown with Editable Emission Factors</div>
        <table style={{width:'100%',fontSize:12,borderCollapse:'collapse'}}>
          <thead><tr style={{borderBottom:`1px solid ${T.border}`}}>
            {['Stage','kgCO2e','Share','Edit','Intensity/yr','vs Avg'].map(h=><th key={h} style={{padding:'6px 8px',textAlign:'left',color:T.textSec,fontWeight:600}}>{h}</th>)}
          </tr></thead>
          <tbody>{STAGES.map((st,i)=>{
            const v=getVal(i);
            const pct=((Math.abs(v)/Math.max(Math.abs(total),1))*100).toFixed(1);
            const isHot=i===hotIdx;
            const catAvg=benchmarks[i].CatAvg;
            const diff=((Math.abs(v)-catAvg)/catAvg*100).toFixed(0);
            return(<tr key={i} style={{borderBottom:`1px solid ${T.border}08`,background:isHot?T.red+'08':'transparent'}}>
              <td style={{padding:'6px 8px',fontWeight:isHot?700:400,color:isHot?T.red:T.text}}>{st}{isHot?' (Hot-spot)':''}</td>
              <td style={{padding:'6px 8px',fontFamily:T.mono}}>{v.toFixed(1)}</td>
              <td style={{padding:'6px 8px'}}><div style={{display:'flex',alignItems:'center',gap:6}}>
                <div style={{width:50,height:6,background:T.border,borderRadius:3}}><div style={{width:`${Math.min(Math.abs(+pct),100)}%`,height:6,background:STAGE_COLORS[i],borderRadius:3}}/></div>
                <span style={{fontFamily:T.mono,fontSize:11}}>{pct}%</span>
              </div></td>
              <td style={{padding:'6px 8px'}}><input type="number" style={{...inp,width:60}} value={v}
                onChange={e=>setEdits(prev=>({...prev,[`${prod.id}_${i}`]:+e.target.value}))}/></td>
              <td style={{padding:'6px 8px',fontFamily:T.mono,fontSize:11}}>{(v/(prod.usePhaseYears||1)).toFixed(2)}</td>
              <td style={{padding:'6px 8px'}}><span style={badge(+diff<=0?T.green:T.red)}>{+diff>0?'+':''}{diff}%</span></td>
            </tr>);
          })}</tbody>
        </table>
      </div>
      <div style={card}>
        <div style={hdr}>Flow Visualization (Input / Process / Waste)</div>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={sankeyData}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
            <XAxis dataKey="name" tick={{fontSize:9,fill:T.textSec}} interval={0} angle={-15} textAnchor="end" height={50}/>
            <YAxis tick={{fontSize:10,fill:T.textSec}}/>
            <Tooltip content={<CustomTooltip/>}/><Legend wrapperStyle={{fontSize:11}}/>
            <Bar dataKey="Raw Input" stackId="a" fill={T.navy}/>
            <Bar dataKey="Process Energy" stackId="a" fill={T.gold}/>
            <Bar dataKey="Waste & Loss" stackId="a" fill={T.red+'aa'} radius={[4,4,0,0]}/>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>

    {showImpact&&(
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:16}}>
        <div style={card}>
          <div style={hdr}>12-Category Environmental Impact Radar</div>
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={impactRadar}><PolarGrid stroke={T.border}/>
              <PolarAngleAxis dataKey="subject" tick={{fontSize:8,fill:T.textSec}}/>
              <PolarRadiusAxis tick={{fontSize:8,fill:T.textMut}}/>
              <Radar name="Product" dataKey="Product" stroke={T.navy} fill={T.navy} fillOpacity={0.2}/>
              <Radar name="Category Avg" dataKey="CategoryAvg" stroke={T.gold} fill={T.gold} fillOpacity={0.1}/>
              <Legend wrapperStyle={{fontSize:11}}/><Tooltip/>
            </RadarChart>
          </ResponsiveContainer>
        </div>
        <div style={card}>
          <div style={hdr}>Footprint & Handprint Trend (2020-2025)</div>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={annualTimeline}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
              <XAxis dataKey="year" tick={{fontSize:10,fill:T.textSec}}/>
              <YAxis tick={{fontSize:10,fill:T.textSec}}/>
              <Tooltip content={<CustomTooltip/>}/><Legend wrapperStyle={{fontSize:11}}/>
              <Area type="monotone" dataKey="Footprint" stroke={T.navy} fill={T.navy+'20'}/>
              <Area type="monotone" dataKey="Handprint" stroke={T.green} fill={T.green+'20'}/>
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    )}

    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:16}}>
      <div style={card}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',...hdr}}>
          <span>Improvement Simulator</span>
          <div style={{display:'flex',gap:4,alignItems:'center'}}>
            <span style={{fontSize:11}}>Reduction:</span>
            {[5,10,15,25].map(p=>(
              <button key={p} style={{...btn(improvePct===p),fontSize:10,padding:'2px 8px'}} onClick={()=>setImprovePct(p)}>{p}%</button>
            ))}
          </div>
        </div>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={improveSim}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
            <XAxis dataKey="name" tick={{fontSize:9,fill:T.textSec}} interval={0}/>
            <YAxis tick={{fontSize:10,fill:T.textSec}}/>
            <Tooltip content={<CustomTooltip/>}/><Legend wrapperStyle={{fontSize:10}}/>
            <Bar dataKey="Current" fill={T.navy}/>
            <Bar dataKey={`-${improvePct}%`} fill={T.gold}/>
            <Bar dataKey={`-${improvePct*2}%`} fill={T.green}/>
          </BarChart>
        </ResponsiveContainer>
        <div style={{fontSize:11,color:T.textSec,marginTop:4}}>
          {improvePct*2}% reduction: {(total*(1-improvePct*2/100)).toFixed(1)} kgCO2e | Additional handprint: +{(total*improvePct*2/100*prod.attributionFactor).toFixed(1)} kgCO2e
        </div>
      </div>
      <div style={card}>
        <div style={hdr}>Material Substitution Analyzer</div>
        <div style={{display:'flex',gap:6,marginBottom:8,flexWrap:'wrap'}}>
          {MATERIALS.map((m,i)=>(
            <button key={m} style={{...btn(matSwap===i),fontSize:10,padding:'3px 8px'}} onClick={()=>setMatSwap(matSwap===i?null:i)}>{m}</button>
          ))}
        </div>
        {matSwap!==null&&(
          <div style={{background:T.surfaceH,borderRadius:8,padding:12,marginBottom:8}}>
            <div style={{fontSize:13,fontWeight:600,color:T.navy,marginBottom:4}}>{MATERIALS[matSwap]} &rarr; {matData[matSwap].substituteTo}</div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:8,marginTop:8}}>
              <div><div style={{fontSize:10,color:T.textMut}}>Current</div><div style={{fontFamily:T.mono,fontSize:14,fontWeight:600}}>{matData[matSwap].current} kgCO2e</div></div>
              <div><div style={{fontSize:10,color:T.textMut}}>Alternative</div><div style={{fontFamily:T.mono,fontSize:14,fontWeight:600,color:T.green}}>{matData[matSwap].alternative} kgCO2e</div></div>
              <div><div style={{fontSize:10,color:T.textMut}}>Savings</div><div style={{fontFamily:T.mono,fontSize:14,fontWeight:600,color:T.green}}>-{matData[matSwap].savings} kgCO2e</div></div>
            </div>
            <div style={{fontSize:11,color:T.textSec,marginTop:6}}>
              Estimated handprint improvement: +{(matData[matSwap].savings*prod.attributionFactor).toFixed(1)} kgCO2e after attribution
            </div>
          </div>
        )}
        <div style={hdr}>Carbon Intensity Benchmarks per Stage</div>
        <ResponsiveContainer width="100%" height={matSwap!==null?140:200}>
          <BarChart data={benchmarks}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
            <XAxis dataKey="name" tick={{fontSize:9,fill:T.textSec}} interval={0}/>
            <YAxis tick={{fontSize:10,fill:T.textSec}}/>
            <Tooltip content={<CustomTooltip/>}/><Legend wrapperStyle={{fontSize:10}}/>
            <Bar dataKey="Product" fill={T.navy}/>
            <Bar dataKey="CatAvg" fill={T.gold}/>
            <Bar dataKey="BestInClass" fill={T.green}/>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>

    {/* Detailed Impact Category Table */}
    <div style={card}>
      <div style={hdr}>Environmental Impact Assessment (12 Categories)</div>
      <table style={{width:'100%',fontSize:12,borderCollapse:'collapse'}}>
        <thead><tr style={{borderBottom:`2px solid ${T.border}`}}>
          {['Impact Category','Unit','Product Score','Category Avg','Deviation','Rating'].map(h=>
            <th key={h} style={{padding:'6px 8px',textAlign:'left',color:T.textSec,fontWeight:600}}>{h}</th>
          )}
        </tr></thead>
        <tbody>{IMPACT_CATS.map((cat,i)=>{
          const score=prod.impactScores[i];
          const avg=50+sr(i*23+selId)*30;
          const dev=((score-avg)/avg*100).toFixed(1);
          const rating=+dev<-10?'Excellent':+dev<0?'Good':+dev<10?'Average':'Below Avg';
          const rColor=+dev<-10?T.green:+dev<0?T.sage:+dev<10?T.amber:T.red;
          return(<tr key={i} style={{borderBottom:`1px solid ${T.border}08`}}>
            <td style={{padding:'6px 8px',fontWeight:500}}>{cat}</td>
            <td style={{padding:'6px 8px',color:T.textMut,fontFamily:T.mono,fontSize:11}}>
              {['kgCO2e','kgCFC11e','molH+e','kgPe','kgNe','molNe','kgNMVOCe','kgSbe','MJ','m3','kBqU235e','Pt'][i]}
            </td>
            <td style={{padding:'6px 8px',fontFamily:T.mono}}>{score.toFixed(1)}</td>
            <td style={{padding:'6px 8px',fontFamily:T.mono,color:T.textSec}}>{avg.toFixed(1)}</td>
            <td style={{padding:'6px 8px',fontFamily:T.mono,color:+dev<0?T.green:T.red}}>{+dev>0?'+':''}{dev}%</td>
            <td style={{padding:'6px 8px'}}><span style={badge(rColor)}>{rating}</span></td>
          </tr>);
        })}</tbody>
      </table>
    </div>

    {/* Material Composition Pie */}
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:16}}>
      <div style={card}>
        <div style={hdr}>Material Composition Breakdown</div>
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie data={[
              {name:'Steel',value:prod.materialMix.steel,fill:T.navy},
              {name:'Aluminum',value:prod.materialMix.aluminum,fill:T.gold},
              {name:'Plastic',value:prod.materialMix.plastic,fill:T.sage},
              {name:'Other',value:prod.materialMix.other,fill:T.textMut},
            ]} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={75} innerRadius={40}>
              {[T.navy,T.gold,T.sage,T.textMut].map((c,i)=><Cell key={i} fill={c}/>)}
            </Pie>
            <Tooltip content={<CustomTooltip/>}/><Legend wrapperStyle={{fontSize:10}}/>
          </PieChart>
        </ResponsiveContainer>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:4,fontSize:11,marginTop:8}}>
          {Object.entries(prod.materialMix).map(([k,v])=>(
            <div key={k} style={{display:'flex',justifyContent:'space-between',padding:'2px 0'}}>
              <span style={{color:T.textSec,textTransform:'capitalize'}}>{k}</span>
              <span style={{fontFamily:T.mono,fontWeight:600}}>{v}%</span>
            </div>
          ))}
        </div>
      </div>
      <div style={card}>
        <div style={hdr}>Cumulative Emissions by Stage</div>
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={STAGES.map((st,i)=>{
            const cumul=stages.slice(0,i+1).reduce((a,v)=>a+v,0);
            return {name:st,Cumulative:+cumul.toFixed(1),Stage:stages[i]};
          })}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
            <XAxis dataKey="name" tick={{fontSize:9,fill:T.textSec}} interval={0}/>
            <YAxis tick={{fontSize:10,fill:T.textSec}}/>
            <Tooltip content={<CustomTooltip/>}/><Legend wrapperStyle={{fontSize:10}}/>
            <Area type="monotone" dataKey="Cumulative" stroke={T.navy} fill={T.navy+'20'}/>
            <Line type="monotone" dataKey="Stage" stroke={T.gold} strokeWidth={2}/>
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  </div>);
};

/* ======= TAB 3: Category Benchmarks ======= */
const CategoryBenchmarks=()=>{
  const [selCat,setSelCat]=useState(null);
  const [sortBy,setSortBy]=useState('handprint');
  const [showDist,setShowDist]=useState(false);

  const catStats=useMemo(()=>CATEGORIES.map((cat,ci)=>{
    const prods=PRODUCTS.filter(p=>p.category===cat);
    const hps=prods.map(p=>p.handprint);
    const avg=+(hps.reduce((a,v)=>a+v,0)/ Math.max(1, hps.length)).toFixed(1);
    const best=+Math.max(...hps).toFixed(1);
    const worst=+Math.min(...hps).toFixed(1);
    const median=+hps.sort((a,b)=>a-b)[Math.floor(hps.length/2)].toFixed(1);
    const totalAvoided=+(hps.reduce((a,v)=>a+(v>0?v:0),0)).toFixed(1);
    const avgRD=+(prods.reduce((a,p)=>a+p.rdInvestM,0)/ Math.max(1, prods.length)).toFixed(1);
    const avgFP=+(prods.reduce((a,p)=>a+p.totalFootprint,0)/ Math.max(1, prods.length)).toFixed(1);
    return {name:cat,avg,best,worst,median,totalAvoided,avgRD,avgFP,count:prods.length,idx:ci};
  }),[]);

  const catCompare=catStats.map(c=>({name:c.name.length>14?c.name.slice(0,14)+'..':c.name,Average:c.avg,Best:c.best,Worst:c.worst,Median:c.median}));

  const yearlyCat=useMemo(()=>{
    const years=[2020,2021,2022,2023,2024,2025];
    return years.map(y=>{
      const row={year:y};
      CATEGORIES.forEach(cat=>{
        const prods=PRODUCTS.filter(p=>p.category===cat&&p.year<=y);
        if(prods.length)row[cat.slice(0,10)]=+(prods.reduce((a,p)=>a+p.handprint,0)/ Math.max(1, prods.length)).toFixed(1);
      });
      return row;
    });
  },[]);

  const rdCorr=catStats.map(c=>({name:c.name.slice(0,10),RD_Investment:c.avgRD,Avg_Handprint:c.avg}));
  const marketPotential=catStats.map(c=>({name:c.name.slice(0,12),'Avoided Emissions':c.totalAvoided,'Market Potential':+(c.totalAvoided*sr(c.idx*97)*5).toFixed(0)}));

  const catProds=selCat!==null?PRODUCTS.filter(p=>p.category===CATEGORIES[selCat]).sort((a,b)=>{
    if(sortBy==='handprint')return b.handprint-a.handprint;
    if(sortBy==='footprint')return a.totalFootprint-b.totalFootprint;
    if(sortBy==='rd')return b.rdInvestM-a.rdInvestM;
    return b.handprint/Math.max(b.totalFootprint,1)-a.handprint/Math.max(a.totalFootprint,1);
  }):[];

  const distData=selCat!==null?catProds.map(p=>({name:p.name.slice(0,15),Handprint:p.handprint,Footprint:p.totalFootprint})):[];

  return(<div>
    <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:12,marginBottom:16}}>
      <MiniKPI label="Total Categories" value="10" color={T.navy} sub="product groups"/>
      <MiniKPI label="Avg Handprint" value={`${(catStats.reduce((a,c)=>a+c.avg,0)/10).toFixed(1)}`} color={T.green} sub="kgCO2e across all"/>
      <MiniKPI label="Best Category" value={catStats.sort((a,b)=>b.avg-a.avg)[0]?.name||''} color={T.gold} sub={`avg ${catStats.sort((a,b)=>b.avg-a.avg)[0]?.avg} kgCO2e`}/>
      <MiniKPI label="Total Avoided" value={`${catStats.reduce((a,c)=>a+c.totalAvoided,0).toFixed(0)}`} color={T.sage} sub="kgCO2e all positive"/>
      <MiniKPI label="Products Analyzed" value="80" color={T.navyL} sub="across 30 companies"/>
    </div>

    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:16}}>
      <div style={card}>
        <div style={hdr}>Category Handprint Comparison (kgCO2e)</div>
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={catCompare} layout="vertical"><CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
            <XAxis type="number" tick={{fontSize:10,fill:T.textSec}}/>
            <YAxis dataKey="name" type="category" tick={{fontSize:10,fill:T.textSec}} width={100}/>
            <Tooltip content={<CustomTooltip/>}/><Legend wrapperStyle={{fontSize:11}}/>
            <Bar dataKey="Best" fill={T.green}/>
            <Bar dataKey="Average" fill={T.gold}/>
            <Bar dataKey="Median" fill={T.navyL}/>
            <Bar dataKey="Worst" fill={T.red+'aa'}/>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div style={card}>
        <div style={hdr}>Handprint Trend by Category (2020-2025)</div>
        <ResponsiveContainer width="100%" height={320}>
          <LineChart data={yearlyCat}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
            <XAxis dataKey="year" tick={{fontSize:10,fill:T.textSec}}/>
            <YAxis tick={{fontSize:10,fill:T.textSec}}/>
            <Tooltip content={<CustomTooltip/>}/><Legend wrapperStyle={{fontSize:9}}/>
            {CATEGORIES.slice(0,6).map((cat,i)=><Line key={cat} type="monotone" dataKey={cat.slice(0,10)} stroke={STAGE_COLORS[i%6]} strokeWidth={2} dot={{r:2}}/>)}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>

    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:16}}>
      <div style={card}>
        <div style={hdr}>Market-Level Avoided Emissions Potential</div>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={marketPotential}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
            <XAxis dataKey="name" tick={{fontSize:9,fill:T.textSec}} interval={0} angle={-20} textAnchor="end" height={50}/>
            <YAxis tick={{fontSize:10,fill:T.textSec}}/>
            <Tooltip content={<CustomTooltip/>}/><Legend wrapperStyle={{fontSize:11}}/>
            <Bar dataKey="Avoided Emissions" fill={T.green} radius={[4,4,0,0]}/>
            <Bar dataKey="Market Potential" fill={T.gold} radius={[4,4,0,0]}/>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div style={card}>
        <div style={hdr}>R&D Investment vs Handprint Correlation</div>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={rdCorr}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
            <XAxis dataKey="name" tick={{fontSize:9,fill:T.textSec}} interval={0} angle={-20} textAnchor="end" height={50}/>
            <YAxis yAxisId="left" tick={{fontSize:10,fill:T.textSec}}/>
            <YAxis yAxisId="right" orientation="right" tick={{fontSize:10,fill:T.gold}}/>
            <Tooltip content={<CustomTooltip/>}/><Legend wrapperStyle={{fontSize:11}}/>
            <Bar yAxisId="left" dataKey="Avg_Handprint" fill={T.green} radius={[4,4,0,0]}/>
            <Bar yAxisId="right" dataKey="RD_Investment" fill={T.gold} radius={[4,4,0,0]}/>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>

    <div style={card}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12,flexWrap:'wrap',gap:8}}>
        <div style={hdr}>Category Drill-Down</div>
        <div style={{display:'flex',gap:4,flexWrap:'wrap'}}>
          {CATEGORIES.map((cat,i)=>(
            <button key={cat} style={{...btn(selCat===i),fontSize:10,padding:'3px 8px'}} onClick={()=>setSelCat(selCat===i?null:i)}>{cat.slice(0,10)}</button>
          ))}
        </div>
      </div>
      {selCat!==null&&(<>
        <div style={{display:'flex',gap:8,marginBottom:10,alignItems:'center'}}>
          {[['handprint','Handprint'],['footprint','Footprint'],['rd','R&D'],['ratio','HP/FP Ratio']].map(([k,l])=>(
            <button key={k} style={{...btn(sortBy===k),fontSize:11,padding:'4px 10px'}} onClick={()=>setSortBy(k)}>Sort: {l}</button>
          ))}
          <button style={btn(showDist)} onClick={()=>setShowDist(!showDist)}>Distribution Chart</button>
        </div>
        {showDist&&(
          <div style={{marginBottom:12}}>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={distData}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
                <XAxis dataKey="name" tick={{fontSize:8,fill:T.textSec}} interval={0} angle={-30} textAnchor="end" height={50}/>
                <YAxis tick={{fontSize:10,fill:T.textSec}}/>
                <Tooltip content={<CustomTooltip/>}/><Legend wrapperStyle={{fontSize:10}}/>
                <Bar dataKey="Handprint" fill={T.green}/>
                <Bar dataKey="Footprint" fill={T.navy}/>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
        <table style={{width:'100%',fontSize:12,borderCollapse:'collapse'}}>
          <thead><tr style={{borderBottom:`2px solid ${T.border}`}}>
            {['Rank','Product','Company','Footprint','Baseline','Handprint','HP/FP','R&D ($M)','Year','Cert'].map(h=><th key={h} style={{padding:'6px 8px',textAlign:'left',color:T.textSec,fontWeight:600}}>{h}</th>)}
          </tr></thead>
          <tbody>{catProds.map((p,i)=>(
            <tr key={p.id} style={{borderBottom:`1px solid ${T.border}08`,background:i===0?T.green+'08':i===catProds.length-1?T.red+'08':'transparent'}}>
              <td style={{padding:'6px 8px',fontWeight:600}}>{i+1}</td>
              <td style={{padding:'6px 8px',fontWeight:500}}>{p.name}</td>
              <td style={{padding:'6px 8px',color:T.textSec}}>{p.company}</td>
              <td style={{padding:'6px 8px',fontFamily:T.mono}}>{p.totalFootprint}</td>
              <td style={{padding:'6px 8px',fontFamily:T.mono}}>{p.baseline}</td>
              <td style={{padding:'6px 8px',fontFamily:T.mono,fontWeight:600,color:p.handprint>0?T.green:T.red}}>{p.handprint>0?'+':''}{p.handprint}</td>
              <td style={{padding:'6px 8px',fontFamily:T.mono}}>{(p.handprint/Math.max(p.totalFootprint,1)).toFixed(2)}x</td>
              <td style={{padding:'6px 8px',fontFamily:T.mono}}>{p.rdInvestM}</td>
              <td style={{padding:'6px 8px'}}>{p.year}</td>
              <td style={{padding:'6px 8px'}}><span style={badge(p.certLevel==='Gold'?T.gold:p.certLevel==='Silver'?T.textSec:p.certLevel==='Bronze'?T.amber:T.textMut)}>{p.certLevel}</span></td>
            </tr>
          ))}</tbody>
        </table>
      </>)}
    </div>

    {/* Category Summary Table */}
    <div style={card}>
      <div style={hdr}>Category Summary Statistics</div>
      <table style={{width:'100%',fontSize:12,borderCollapse:'collapse'}}>
        <thead><tr style={{borderBottom:`2px solid ${T.border}`}}>
          {['Category','Products','Avg Footprint','Avg Handprint','Best','Worst','Median','Total Avoided','Avg R&D ($M)'].map(h=>
            <th key={h} style={{padding:'6px 8px',textAlign:'left',color:T.textSec,fontWeight:600}}>{h}</th>
          )}
        </tr></thead>
        <tbody>{catStats.map((c,i)=>(
          <tr key={i} style={{borderBottom:`1px solid ${T.border}08`,cursor:'pointer',background:selCat===c.idx?T.surfaceH:'transparent'}} onClick={()=>setSelCat(selCat===c.idx?null:c.idx)}>
            <td style={{padding:'6px 8px',fontWeight:600}}>{c.name}</td>
            <td style={{padding:'6px 8px',fontFamily:T.mono}}>{c.count}</td>
            <td style={{padding:'6px 8px',fontFamily:T.mono}}>{c.avgFP}</td>
            <td style={{padding:'6px 8px',fontFamily:T.mono,color:c.avg>0?T.green:T.red}}>{c.avg>0?'+':''}{c.avg}</td>
            <td style={{padding:'6px 8px',fontFamily:T.mono,color:T.green}}>+{c.best}</td>
            <td style={{padding:'6px 8px',fontFamily:T.mono,color:T.red}}>{c.worst}</td>
            <td style={{padding:'6px 8px',fontFamily:T.mono}}>{c.median}</td>
            <td style={{padding:'6px 8px',fontFamily:T.mono,fontWeight:600}}>{c.totalAvoided}</td>
            <td style={{padding:'6px 8px',fontFamily:T.mono}}>{c.avgRD}</td>
          </tr>
        ))}</tbody>
      </table>
    </div>

    {/* Company Leaderboard */}
    <div style={card}>
      <div style={hdr}>Company Leaderboard - Top 15 by Avg Handprint</div>
      <table style={{width:'100%',fontSize:12,borderCollapse:'collapse'}}>
        <thead><tr style={{borderBottom:`2px solid ${T.border}`}}>
          {['Rank','Company','Products','Avg Handprint','Total Avoided','Avg Footprint','Best Product','Avg R&D'].map(h=>
            <th key={h} style={{padding:'6px 8px',textAlign:'left',color:T.textSec,fontWeight:600}}>{h}</th>
          )}
        </tr></thead>
        <tbody>{COMPANIES.map(co=>{
          const prods=PRODUCTS.filter(p=>p.company===co);
          if(!prods.length)return null;
          const avgHP=+(prods.reduce((a,p)=>a+p.handprint,0)/ Math.max(1, prods.length)).toFixed(1);
          const totalAv=+(prods.reduce((a,p)=>a+(p.handprint>0?p.handprint:0),0)).toFixed(1);
          const avgFP=+(prods.reduce((a,p)=>a+p.totalFootprint,0)/ Math.max(1, prods.length)).toFixed(1);
          const best=prods.reduce((a,p)=>p.handprint>a.handprint?p:a,prods[0]);
          const avgRD=+(prods.reduce((a,p)=>a+p.rdInvestM,0)/ Math.max(1, prods.length)).toFixed(1);
          return {co,count:prods.length,avgHP,totalAv,avgFP,best:best.name,avgRD};
        }).filter(Boolean).sort((a,b)=>b.avgHP-a.avgHP).slice(0,15).map((c,i)=>(
          <tr key={i} style={{borderBottom:`1px solid ${T.border}08`,background:i<3?T.green+'06':'transparent'}}>
            <td style={{padding:'6px 8px',fontWeight:700,color:i<3?T.green:T.text}}>{i+1}</td>
            <td style={{padding:'6px 8px',fontWeight:600}}>{c.co}</td>
            <td style={{padding:'6px 8px',fontFamily:T.mono}}>{c.count}</td>
            <td style={{padding:'6px 8px',fontFamily:T.mono,color:c.avgHP>0?T.green:T.red}}>{c.avgHP>0?'+':''}{c.avgHP}</td>
            <td style={{padding:'6px 8px',fontFamily:T.mono}}>{c.totalAv}</td>
            <td style={{padding:'6px 8px',fontFamily:T.mono}}>{c.avgFP}</td>
            <td style={{padding:'6px 8px',fontSize:11}}>{c.best}</td>
            <td style={{padding:'6px 8px',fontFamily:T.mono}}>${c.avgRD}M</td>
          </tr>
        ))}</tbody>
      </table>
    </div>

    {/* Innovation Timeline */}
    <div style={card}>
      <div style={hdr}>Innovation Impact: Category Footprint Reduction Over Time</div>
      <ResponsiveContainer width="100%" height={240}>
        <AreaChart data={[2020,2021,2022,2023,2024,2025].map(y=>{
          const row={year:y};
          CATEGORIES.slice(0,5).forEach(cat=>{
            const prods=PRODUCTS.filter(p=>p.category===cat&&p.year<=y);
            row[cat.slice(0,8)]=prods.length?+(prods.reduce((a,p)=>a+p.totalFootprint,0)/prods.length).toFixed(1):0;
          });
          return row;
        })}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
          <XAxis dataKey="year" tick={{fontSize:10,fill:T.textSec}}/>
          <YAxis tick={{fontSize:10,fill:T.textSec}}/>
          <Tooltip content={<CustomTooltip/>}/><Legend wrapperStyle={{fontSize:10}}/>
          {CATEGORIES.slice(0,5).map((cat,i)=><Area key={cat} type="monotone" dataKey={cat.slice(0,8)} stroke={STAGE_COLORS[i]} fill={STAGE_COLORS[i]+'15'} strokeWidth={2}/>)}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  </div>);
};

/* ======= TAB 4: Reporting & Claims ======= */
const ReportingClaims=()=>{
  const [checks,setChecks]=useState(()=>{const m={};ISO_CHECKLIST.forEach(c=>{m[c.id]=sr(c.id*37)>0.4;});return m;});
  const [selProd,setSelProd]=useState(0);
  const [claimType,setClaimType]=useState('product');
  const [verStep,setVerStep]=useState(0);
  const [showTemplate,setShowTemplate]=useState(false);
  const [exportFmt,setExportFmt]=useState('csv');

  const prod=PRODUCTS[selProd];
  const completedCount=Object.values(checks).filter(Boolean).length;
  const compliancePct=+((completedCount/15)*100).toFixed(0);

  const sectionGroups={};
  ISO_CHECKLIST.forEach(c=>{if(!sectionGroups[c.section])sectionGroups[c.section]=[];sectionGroups[c.section].push(c);});

  const pefItems=[
    {name:'Product Category Rules (PCR) alignment',status:sr(selProd*3)>0.3,note:'EN 15804 or sector-specific'},
    {name:'Environmental Footprint (EF) method applied',status:sr(selProd*3+1)>0.4,note:'EF 3.1 characterization factors'},
    {name:'16 impact categories assessed',status:sr(selProd*3+2)>0.35,note:'Climate, ozone, acidification, etc.'},
    {name:'Benchmark comparison performed',status:sr(selProd*3+3)>0.5,note:'Against category average'},
    {name:'Data quality rating (DQR) calculated',status:sr(selProd*3+4)>0.45,note:'TeR, GR, TiR, C, P scores'},
    {name:'Communication vehicle selected',status:sr(selProd*3+5)>0.55,note:'B2B or B2C format'},
    {name:'Normalization and weighting applied',status:sr(selProd*3+6)>0.42,note:'PEF recommended practice'},
    {name:'Comparability assessment completed',status:sr(selProd*3+7)>0.48,note:'Same PCR and functional unit'},
  ];

  const verSteps=['Initial Submission','Desk Review','Data Verification','Methodology Audit','Claim Validation','Final Certification'];
  const greenClaimsItems=[
    {rule:'Substantiation requirement (Art. 3)',compliant:sr(selProd*11)>0.3},
    {rule:'Life cycle perspective (Art. 3.1)',compliant:sr(selProd*11+1)>0.35},
    {rule:'Primary data preference (Art. 3.4)',compliant:sr(selProd*11+2)>0.4},
    {rule:'No misleading environmental claims',compliant:sr(selProd*11+3)>0.45},
    {rule:'Comparison fairness (Art. 4)',compliant:sr(selProd*11+4)>0.5},
    {rule:'Third-party verification (Art. 10)',compliant:sr(selProd*11+5)>0.55},
    {rule:'Durability information (Art. 5)',compliant:sr(selProd*11+6)>0.38},
    {rule:'No carbon neutral claims (Art. 6)',compliant:true},
  ];

  const claimTemplates={
    product:`PRODUCT CLIMATE BENEFIT STATEMENT\n\nProduct: ${prod.name}\nCategory: ${prod.category}\nCompany: ${prod.company}\n\nLifecycle Carbon Footprint: ${prod.totalFootprint} kgCO2e\nBaseline Alternative Footprint: ${prod.baseline} kgCO2e\nAvoided Emissions (Handprint): ${prod.handprint>0?'+':''}${prod.handprint} kgCO2e\nAttribution Factor: ${(prod.attributionFactor*100).toFixed(0)}%\n\nMethodology: ISO 14067:2018, Clause 6.5.4\nFunctional Unit: 1 unit over ${prod.usePhaseYears}-year lifetime\nSystem Boundary: Cradle-to-grave\nData Quality: Primary data for foreground; ecoinvent 3.9 for background\n\nThis claim has been verified by [Verifier Name] per ISO 14067 requirements.`,
    portfolio:`PORTFOLIO AVOIDED EMISSIONS REPORT\n\nCompany: ${prod.company}\nReporting Period: 2025\nProducts Assessed: ${PRODUCTS.filter(p=>p.company===prod.company).length}\n\nTotal Portfolio Footprint: ${PRODUCTS.filter(p=>p.company===prod.company).reduce((a,p)=>a+p.totalFootprint,0).toFixed(0)} kgCO2e\nTotal Avoided Emissions: ${PRODUCTS.filter(p=>p.company===prod.company).reduce((a,p)=>a+(p.handprint>0?p.handprint:0),0).toFixed(0)} kgCO2e\nAvg Attribution Factor: ${(PRODUCTS.filter(p=>p.company===prod.company).reduce((a,p)=>a+p.attributionFactor,0)/Math.max(PRODUCTS.filter(p=>p.company===prod.company).length,1)*100).toFixed(0)}%\n\nMethodology: ISO 14067 + WBCSD Avoided Emissions Guidance\nVerification: [Pending/Complete]`,
    comparative:`COMPARATIVE HANDPRINT ANALYSIS\n\nProduct: ${prod.name}\nCategory: ${prod.category}\nCategory Avg Footprint: ${(PRODUCTS.filter(p=>p.category===prod.category).reduce((a,p)=>a+p.totalFootprint,0)/10).toFixed(1)} kgCO2e\nProduct Footprint: ${prod.totalFootprint} kgCO2e\nRelative Performance: ${((1-prod.totalFootprint/(PRODUCTS.filter(p=>p.category===prod.category).reduce((a,p)=>a+p.totalFootprint,0)/10))*100).toFixed(1)}% below category average\n\nBased on ISO 14067 methodology with ${(prod.attributionFactor*100).toFixed(0)}% attribution factor.`
  };

  const doExport=useCallback(()=>{
    const rows=[['Product','Category','Company','Footprint_kgCO2e','Baseline_kgCO2e','Handprint_kgCO2e','Attribution_%','Use_Phase_Yrs','Cert_Level',...STAGES,...IMPACT_CATS]];
    PRODUCTS.forEach(p=>{rows.push([p.name,p.category,p.company,p.totalFootprint,p.baseline,p.handprint,(p.attributionFactor*100).toFixed(0),p.usePhaseYears,p.certLevel,...p.stages,...p.impactScores]);});
    const csv=rows.map(r=>r.join(',')).join('\n');
    const blob=new Blob([csv],{type:'text/csv'});
    const url=URL.createObjectURL(blob);
    const a=document.createElement('a');a.href=url;a.download=`product_handprint_report.${exportFmt}`;a.click();
    URL.revokeObjectURL(url);
  },[exportFmt]);

  const radarData=IMPACT_CATS.map((cat,i)=>({subject:cat,Score:prod.impactScores[i],Benchmark:50+sr(i*23)*30}));

  const companyProds=PRODUCTS.filter(p=>p.company===prod.company);
  const companyData=companyProds.map(p=>({name:p.name.slice(0,14),Handprint:p.handprint,Footprint:p.totalFootprint}));

  return(<div>
    <div style={{display:'flex',gap:12,marginBottom:16,alignItems:'center',flexWrap:'wrap'}}>
      <select style={{...sel,minWidth:280}} value={selProd} onChange={e=>setSelProd(+e.target.value)}>
        {PRODUCTS.map(p=><option key={p.id} value={p.id}>{p.name} ({p.company})</option>)}
      </select>
      <span style={badge(compliancePct>=80?T.green:compliancePct>=50?T.amber:T.red)}>ISO Compliance: {compliancePct}%</span>
      <span style={badge(prod.certLevel==='Gold'?T.gold:T.textSec)}>{prod.certLevel}</span>
      <select style={sel} value={exportFmt} onChange={e=>setExportFmt(e.target.value)}>
        <option value="csv">CSV</option><option value="json">JSON</option>
      </select>
      <button style={btn(true)} onClick={doExport}>Export Report</button>
    </div>

    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:16}}>
      <div style={card}>
        <div style={hdr}>ISO 14067 Compliance Checklist ({completedCount}/15)</div>
        <div style={{width:'100%',height:8,background:T.border,borderRadius:4,marginBottom:12}}>
          <div style={{width:`${compliancePct}%`,height:8,background:compliancePct>=80?T.green:compliancePct>=50?T.amber:T.red,borderRadius:4,transition:'width 0.3s'}}/>
        </div>
        {Object.entries(sectionGroups).map(([section,items])=>(
          <div key={section} style={{marginBottom:12}}>
            <div style={{fontSize:12,fontWeight:700,color:T.navy,marginBottom:6,display:'flex',justifyContent:'space-between'}}>
              <span>{section}</span>
              <span style={{fontSize:10,color:T.textMut}}>{items.filter(i=>checks[i.id]).length}/{items.length}</span>
            </div>
            {items.map(item=>(
              <label key={item.id} style={{display:'flex',alignItems:'flex-start',gap:8,padding:'4px 0',cursor:'pointer',fontSize:12}}>
                <input type="checkbox" checked={checks[item.id]||false} onChange={()=>setChecks(prev=>({...prev,[item.id]:!prev[item.id]}))}
                  style={{marginTop:2,accentColor:T.green}}/>
                <span style={{color:checks[item.id]?T.text:T.textMut}}>{item.text}</span>
              </label>
            ))}
          </div>
        ))}
      </div>
      <div style={card}>
        <div style={hdr}>Environmental Impact Profile (12 Categories)</div>
        <ResponsiveContainer width="100%" height={320}>
          <RadarChart data={radarData}><PolarGrid stroke={T.border}/>
            <PolarAngleAxis dataKey="subject" tick={{fontSize:8,fill:T.textSec}}/>
            <PolarRadiusAxis tick={{fontSize:8,fill:T.textMut}}/>
            <Radar name="Product" dataKey="Score" stroke={T.navy} fill={T.navy} fillOpacity={0.2}/>
            <Radar name="Benchmark" dataKey="Benchmark" stroke={T.gold} fill={T.gold} fillOpacity={0.1}/>
            <Legend wrapperStyle={{fontSize:11}}/>
            <Tooltip content={<CustomTooltip/>}/>
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>

    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:16}}>
      <div style={card}>
        <div style={hdr}>PEF Alignment Status</div>
        <table style={{width:'100%',fontSize:12,borderCollapse:'collapse'}}>
          <thead><tr style={{borderBottom:`1px solid ${T.border}`}}>
            {['Requirement','Status','Notes'].map(h=><th key={h} style={{padding:'6px 8px',textAlign:'left',color:T.textSec,fontWeight:600}}>{h}</th>)}
          </tr></thead>
          <tbody>{pefItems.map((item,i)=>(
            <tr key={i} style={{borderBottom:`1px solid ${T.border}08`}}>
              <td style={{padding:'6px 8px'}}>{item.name}</td>
              <td style={{padding:'6px 8px'}}><span style={badge(item.status?T.green:T.amber)}>{item.status?'Aligned':'Pending'}</span></td>
              <td style={{padding:'6px 8px',color:T.textMut,fontSize:11}}>{item.note}</td>
            </tr>
          ))}</tbody>
        </table>
      </div>
      <div style={card}>
        <div style={hdr}>EU Green Claims Directive Compliance</div>
        <div style={{marginBottom:8}}>
          <div style={{display:'flex',justifyContent:'space-between',fontSize:11,color:T.textSec,marginBottom:4}}>
            <span>Compliance Score</span>
            <span>{greenClaimsItems.filter(i=>i.compliant).length}/{greenClaimsItems.length}</span>
          </div>
          <div style={{width:'100%',height:6,background:T.border,borderRadius:3}}>
            <div style={{width:`${(greenClaimsItems.filter(i=>i.compliant).length/ Math.max(1, greenClaimsItems.length)*100)}%`,height:6,background:T.green,borderRadius:3}}/>
          </div>
        </div>
        <table style={{width:'100%',fontSize:12,borderCollapse:'collapse'}}>
          <thead><tr style={{borderBottom:`1px solid ${T.border}`}}>
            {['Rule','Compliant'].map(h=><th key={h} style={{padding:'6px 8px',textAlign:'left',color:T.textSec,fontWeight:600}}>{h}</th>)}
          </tr></thead>
          <tbody>{greenClaimsItems.map((item,i)=>(
            <tr key={i} style={{borderBottom:`1px solid ${T.border}08`}}>
              <td style={{padding:'6px 8px'}}>{item.rule}</td>
              <td style={{padding:'6px 8px'}}><span style={badge(item.compliant?T.green:T.red)}>{item.compliant?'Yes':'No'}</span></td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </div>

    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:16}}>
      <div style={card}>
        <div style={hdr}>Claim Verification Workflow</div>
        <div style={{display:'flex',gap:4,marginBottom:16}}>
          {verSteps.map((step,i)=>(
            <div key={i} style={{flex:1,textAlign:'center',cursor:'pointer'}} onClick={()=>setVerStep(i)}>
              <div style={{width:28,height:28,borderRadius:'50%',background:i<=verStep?T.green:T.border,color:i<=verStep?'#fff':T.textMut,
                display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:600,margin:'0 auto 4px'}}>{i+1}</div>
              <div style={{fontSize:9,color:i<=verStep?T.text:T.textMut,lineHeight:1.2}}>{step}</div>
            </div>
          ))}
        </div>
        <div style={{background:T.surfaceH,borderRadius:8,padding:12,fontSize:12}}>
          <div style={{fontWeight:600,color:T.navy,marginBottom:4}}>Step {verStep+1}: {verSteps[verStep]}</div>
          <div style={{color:T.textSec,lineHeight:1.6}}>
            {verStep===0&&'Submit product handprint data package including LCA report, data quality assessment, and methodology documentation. Include system boundary diagram and functional unit definition.'}
            {verStep===1&&'Reviewer checks completeness of submission: system boundaries, functional unit, data sources, allocation procedures. Preliminary DQR scoring performed.'}
            {verStep===2&&'Verification of primary and secondary data against source documents. Activity data cross-referenced with production records. DQR gap analysis completed.'}
            {verStep===3&&'Independent audit of calculation methodology, baseline selection rationale, and attribution factor justification. Sensitivity analysis reviewed.'}
            {verStep===4&&'Validation of avoided emissions claims against ISO 14067 Clause 6.5.4 and WBCSD guidance. Communication language reviewed for accuracy.'}
            {verStep===5&&'Final certification issued. Claim statement approved for public communication with specified validity period of 3 years. Annual surveillance required.'}
          </div>
          <div style={{display:'flex',gap:8,marginTop:10}}>
            <button style={btn(false)} onClick={()=>setVerStep(Math.max(0,verStep-1))} disabled={verStep===0}>Previous</button>
            <button style={btn(true)} onClick={()=>setVerStep(Math.min(5,verStep+1))} disabled={verStep===5}>Next Step</button>
            <span style={{fontSize:11,color:T.textMut,alignSelf:'center'}}>Step {verStep+1} of 6</span>
          </div>
        </div>
      </div>
      <div style={card}>
        <div style={hdr}>Claim Template Generator</div>
        <div style={{display:'flex',gap:8,marginBottom:12}}>
          {[['product','Product Claim'],['portfolio','Portfolio Report'],['comparative','Comparative']].map(([t,l])=>(
            <button key={t} style={btn(claimType===t)} onClick={()=>setClaimType(t)}>{l}</button>
          ))}
          <button style={btn(false)} onClick={()=>setShowTemplate(!showTemplate)}>{showTemplate?'Hide':'Show'}</button>
        </div>
        {showTemplate&&(
          <pre style={{background:T.surfaceH,borderRadius:8,padding:12,fontSize:10,fontFamily:T.mono,whiteSpace:'pre-wrap',
            maxHeight:260,overflow:'auto',border:`1px solid ${T.border}`,lineHeight:1.5}}>
            {claimTemplates[claimType]}
          </pre>
        )}
        <div style={{marginTop:12,fontSize:12,color:T.textSec}}>
          <div style={{fontWeight:600,marginBottom:4}}>Communication Guidelines:</div>
          <ul style={{margin:0,paddingLeft:16,lineHeight:1.8}}>
            <li>Always specify functional unit and system boundary</li>
            <li>Disclose baseline scenario and attribution methodology</li>
            <li>Include uncertainty range for avoided emissions</li>
            <li>Reference third-party verification status</li>
            <li>Avoid absolute claims ("carbon neutral", "zero emissions")</li>
            <li>Use comparative language: "X% lower footprint than..."</li>
            <li>Update claims annually with new data</li>
          </ul>
        </div>
      </div>
    </div>

    <div style={card}>
      <div style={hdr}>Company Portfolio Overview: {prod.company} ({companyProds.length} products)</div>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={companyData}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
          <XAxis dataKey="name" tick={{fontSize:9,fill:T.textSec}} interval={0} angle={-25} textAnchor="end" height={55}/>
          <YAxis tick={{fontSize:10,fill:T.textSec}}/>
          <Tooltip content={<CustomTooltip/>}/><Legend wrapperStyle={{fontSize:11}}/>
          <Bar dataKey="Footprint" fill={T.navy} radius={[4,4,0,0]}/>
          <Bar dataKey="Handprint" fill={T.green} radius={[4,4,0,0]}/>
        </BarChart>
      </ResponsiveContainer>
    </div>

    {/* Methodology Reference Panel */}
    <div style={card}>
      <div style={hdr}>Methodology Reference & Data Quality</div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:16}}>
        <div style={{background:T.surfaceH,borderRadius:8,padding:12}}>
          <div style={{fontSize:12,fontWeight:700,color:T.navy,marginBottom:8}}>ISO 14067 Framework</div>
          <div style={{fontSize:11,color:T.textSec,lineHeight:1.7}}>
            <div>Clause 6.3: System boundary definition</div>
            <div>Clause 6.4.6: Allocation procedures</div>
            <div>Clause 6.4.9: Biogenic carbon accounting</div>
            <div>Clause 6.5.4: Avoided emissions</div>
            <div>Clause 7: Communication requirements</div>
            <div>Annex A: Reporting template</div>
          </div>
        </div>
        <div style={{background:T.surfaceH,borderRadius:8,padding:12}}>
          <div style={{fontSize:12,fontWeight:700,color:T.navy,marginBottom:8}}>Data Quality Indicators</div>
          <div style={{fontSize:11,color:T.textSec,lineHeight:1.7}}>
            {[['Technological Repr.',sr(selProd*17)*5],['Geographical Repr.',sr(selProd*19)*5],['Time-related Repr.',sr(selProd*23)*5],['Completeness',sr(selProd*29)*5],['Precision',sr(selProd*31)*5]].map(([label,score],i)=>(
              <div key={i} style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <span>{label}</span>
                <div style={{display:'flex',gap:2}}>
                  {[1,2,3,4,5].map(s=>(
                    <div key={s} style={{width:8,height:8,borderRadius:'50%',background:s<=Math.ceil(score)?T.green:T.border}}/>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div style={{background:T.surfaceH,borderRadius:8,padding:12}}>
          <div style={{fontSize:12,fontWeight:700,color:T.navy,marginBottom:8}}>Complementary Standards</div>
          <div style={{fontSize:11,color:T.textSec,lineHeight:1.7}}>
            <div>ISO 14040/14044: LCA framework</div>
            <div>ISO 14046: Water footprint</div>
            <div>GHG Protocol: Product standard</div>
            <div>PAS 2050: Product carbon footprint</div>
            <div>EU PEF: Product Environmental Footprint</div>
            <div>WBCSD: Avoided Emissions Guidance</div>
          </div>
        </div>
      </div>
    </div>

    {/* Cross-Company Certification Summary */}
    <div style={card}>
      <div style={hdr}>Certification Status Across All Products</div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12,marginBottom:12}}>
        {['Gold','Silver','Bronze','Pending'].map((level)=>{
          const count=PRODUCTS.filter(p=>p.certLevel===level).length;
          const color=level==='Gold'?T.gold:level==='Silver'?T.textSec:level==='Bronze'?T.amber:T.textMut;
          const avgHP=PRODUCTS.filter(p=>p.certLevel===level).reduce((a,p)=>a+p.handprint,0)/Math.max(count,1);
          return(
            <div key={level} style={{background:color+'10',borderRadius:8,padding:12,textAlign:'center',border:`1px solid ${color}30`}}>
              <div style={{fontSize:22,fontWeight:700,color}}>{count}</div>
              <div style={{fontSize:12,fontWeight:600,color}}>{level}</div>
              <div style={{fontSize:10,color:T.textMut,marginTop:4}}>Avg HP: {avgHP.toFixed(1)} kgCO2e</div>
            </div>
          );
        })}
      </div>
      <ResponsiveContainer width="100%" height={180}>
        <PieChart>
          <Pie data={[
            {name:'Gold',value:PRODUCTS.filter(p=>p.certLevel==='Gold').length,fill:T.gold},
            {name:'Silver',value:PRODUCTS.filter(p=>p.certLevel==='Silver').length,fill:T.textSec},
            {name:'Bronze',value:PRODUCTS.filter(p=>p.certLevel==='Bronze').length,fill:T.amber},
            {name:'Pending',value:PRODUCTS.filter(p=>p.certLevel==='Pending').length,fill:T.textMut},
          ]} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={65} innerRadius={35}>
            {[T.gold,T.textSec,T.amber,T.textMut].map((c,i)=><Cell key={i} fill={c}/>)}
          </Pie>
          <Tooltip content={<CustomTooltip/>}/><Legend wrapperStyle={{fontSize:10}}/>
        </PieChart>
      </ResponsiveContainer>
    </div>
  </div>);
};

/* ======= MAIN PAGE ======= */
const TABS=['Handprint Calculator','Lifecycle Deep-Dive','Category Benchmarks','Reporting & Claims'];

export default function ProductCarbonHandprintPage(){
  const [tab,setTab]=useState(0);

  const summaryStats=useMemo(()=>{
    const posHP=PRODUCTS.filter(p=>p.handprint>0);
    const totalAvoided=posHP.reduce((a,p)=>a+p.handprint,0);
    const avgHP=totalAvoided/Math.max(posHP.length,1);
    const bestProd=PRODUCTS.reduce((a,p)=>p.handprint>a.handprint?p:a,PRODUCTS[0]);
    const avgFP=PRODUCTS.reduce((a,p)=>a+p.totalFootprint,0)/80;
    const goldCount=PRODUCTS.filter(p=>p.certLevel==='Gold').length;
    return {totalAvoided:+totalAvoided.toFixed(0),avgHP:+avgHP.toFixed(1),posCount:posHP.length,bestProd,avgFP:+avgFP.toFixed(1),goldCount};
  },[]);

  return(
    <div style={{fontFamily:T.font,background:T.bg,minHeight:'100vh',padding:24,color:T.text}}>
      <div style={{maxWidth:1400,margin:'0 auto'}}>
        <div style={{marginBottom:24}}>
          <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:8}}>
            <h1 style={{fontSize:22,fontWeight:700,color:T.navy,margin:0}}>Product Carbon Handprint</h1>
            <span style={badge(T.sage)}>EP-AO2</span>
            <span style={badge(T.navy)}>ISO 14067</span>
          </div>
          <p style={{fontSize:13,color:T.textSec,margin:0,maxWidth:800}}>
            Positive climate impact measurement using ISO 14067 handprint methodology. Comparing product lifecycle emissions to baseline alternatives across 80 products, 10 categories, 30 companies, 6 lifecycle stages, and 12 environmental impact categories.
          </p>
        </div>

        <div style={{display:'grid',gridTemplateColumns:'repeat(6,1fr)',gap:12,marginBottom:20}}>
          <MiniKPI label="Products" value="80" color={T.navy} sub="across 10 categories"/>
          <MiniKPI label="Positive Handprints" value={`${summaryStats.posCount}`} color={T.green} sub={`of 80 products`}/>
          <MiniKPI label="Total Avoided" value={`${summaryStats.totalAvoided}`} color={T.sage} sub="kgCO2e"/>
          <MiniKPI label="Avg Handprint" value={`${summaryStats.avgHP}`} color={T.gold} sub="kgCO2e per product"/>
          <MiniKPI label="Best Product" value={summaryStats.bestProd.name.slice(0,16)} color={T.green} sub={`+${summaryStats.bestProd.handprint} kgCO2e`}/>
          <MiniKPI label="Gold Certified" value={`${summaryStats.goldCount}`} color={T.gold} sub="ISO 14067 verified"/>
        </div>

        <div style={{display:'flex',gap:0,marginBottom:20,borderBottom:`2px solid ${T.border}`}}>
          {TABS.map((t,i)=>(
            <button key={t} onClick={()=>setTab(i)} style={{
              padding:'10px 20px',fontSize:13,fontWeight:tab===i?700:500,
              color:tab===i?T.navy:T.textMut,background:'none',border:'none',
              borderBottom:tab===i?`2px solid ${T.navy}`:'2px solid transparent',
              cursor:'pointer',fontFamily:T.font,marginBottom:-2,
              transition:'all 0.15s',
            }}>{t}</button>
          ))}
        </div>

        {tab===0&&<HandprintCalculator/>}
        {tab===1&&<LifecycleDeepDive/>}
        {tab===2&&<CategoryBenchmarks/>}
        {tab===3&&<ReportingClaims/>}
      </div>
    </div>
  );
}
