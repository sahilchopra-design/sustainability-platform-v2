import React, { useState, useCallback } from 'react';
import axios from 'axios';
import {
  BarChart, Bar, PieChart, Pie, Cell,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  RadialBarChart, RadialBar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';

const Section = ({title,children})=>(<div style={{marginBottom:24}}><h2 style={{fontSize:17,fontWeight:600,color:'#111827',marginBottom:12,borderBottom:'2px solid #059669',paddingBottom:4}}>{title}</h2>{children}</div>);
const KpiCard = ({label,value,sub})=>(<div style={{background:'#fff',border:'1px solid #e5e7eb',borderRadius:10,padding:16,borderLeft:'3px solid #059669'}}><div style={{fontSize:11,color:'#6b7280',marginBottom:4}}>{label}</div><div style={{fontSize:24,fontWeight:700,color:'#111827'}}>{value}</div>{sub&&<div style={{fontSize:11,color:'#059669',marginTop:4}}>{sub}</div>}</div>);
const Row = ({children})=>(<div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))',gap:12,marginBottom:16}}>{children}</div>);
const Inp = ({label,...p})=>(<div style={{display:'flex',flexDirection:'column',gap:4}}><label style={{fontSize:11,color:'#6b7280'}}>{label}</label><input style={{border:'1px solid #d1d5db',borderRadius:6,padding:'7px 12px',fontSize:13,outline:'none',width:'100%',boxSizing:'border-box'}} {...p}/></div>);
const Sel = ({label,children,...p})=>(<div style={{display:'flex',flexDirection:'column',gap:4}}><label style={{fontSize:11,color:'#6b7280'}}>{label}</label><select style={{border:'1px solid #d1d5db',borderRadius:6,padding:'7px 12px',fontSize:13,outline:'none',width:'100%',boxSizing:'border-box'}} {...p}>{children}</select></div>);
const Btn = ({children,...p})=>(<button style={{background:'#059669',color:'#fff',padding:'8px 16px',borderRadius:6,fontSize:13,fontWeight:500,border:'none',cursor:'pointer'}} {...p}>{children}</button>);
const Badge = ({children,color='green'})=>{ const c={green:{background:'#d1fae5',color:'#065f46'},red:{background:'#fee2e2',color:'#991b1b'},yellow:{background:'#fef3c7',color:'#92400e'},blue:{background:'#dbeafe',color:'#1e40af'},gray:{background:'#f3f4f6',color:'#374151'}}; const s=c[color]||c.green; return(<span style={{padding:'2px 8px',borderRadius:4,fontSize:11,fontWeight:600,...s}}>{children}</span>); };

const tblStyle={width:'100%',fontSize:13,borderCollapse:'collapse'};
const thStyle={border:'1px solid #e5e7eb',padding:'6px 8px',fontSize:11,textAlign:'left',fontWeight:500,color:'#6b7280',background:'#f9fafb'};
const tdStyle={border:'1px solid #e5e7eb',padding:'6px 8px'};
const errStyle={marginBottom:12,padding:'8px 12px',background:'#fffbeb',border:'1px solid #fde68a',borderRadius:6,fontSize:13,color:'#92400e'};

const seed = 116;
const rng = (i,s=seed) => Math.abs(Math.sin(i*9301+s*49297)*233280)%233280/233280;
const COLORS = ['#059669','#10b981','#34d399','#6ee7b7','#f59e0b','#0284c7','#7c3aed','#f97316'];
const SECTORS = ['Agriculture','Forestry','Mining','Energy','Real Estate','Food & Beverage','Tourism','Manufacturing'];
const ECOSYSTEMS = ['Tropical Forest','Temperate Forest','Wetland','Grassland','Marine Coast','Freshwater','Dryland/Desert','Montane'];
const TABS = ['SEEA Accounts','Ecosystem Services','TEV Breakdown','TNFD LEAP','SBTN Readiness'];

function Tab1({entityName,landArea,primaryEcosystem}) {
  const [result,setResult]=useState(null); const [loading,setLoading]=useState(false); const [error,setError]=useState(null);
  const la=parseFloat(landArea)||1000;
  const extentData=['Cropland','Pasture','Natural Forest','Plantation','Wetland','Urban','Bare/Degraded','Other'].map((t,i)=>({
    type:t, area: Math.round(la*[0.3,0.2,0.25,0.1,0.05,0.04,0.03,0.03][i]),
  }));
  const conditionDims=['Habitat Integrity','Water Quality','Soil Health','Biodiversity Intactness','Carbon Stock'].map((d,i)=>({dim:d,score:Math.round(30+rng(i+1)*65)}));
  const run=useCallback(async()=>{ setLoading(true); setError(null); try { const r=await axios.post('http://localhost:8001/api/v1/nature-capital-accounting/seea-accounts',{entity_name:entityName,land_area_ha:la,primary_ecosystem:primaryEcosystem}); setResult(r.data); } catch { setError('API unavailable — demo mode.'); setResult({}); } setLoading(false); },[entityName,la,primaryEcosystem]);
  return (
    <div>
      <Section title="SEEA EA Account Generation">
        {error&&<div style={errStyle}>{error}</div>}
        <Btn onClick={run} disabled={loading}>{loading?'Compiling…':'Generate SEEA Accounts'}</Btn>
      </Section>
      <Row>
        <KpiCard label="Total Land Area" value={`${la.toLocaleString()} ha`} sub={`${primaryEcosystem} primary`} />
        <KpiCard label="Natural Capital Value" value={`$${Math.round(la*850/1000)}M`} sub="SEEA EA total ecosystem extent" />
        <KpiCard label="Condition Index" value={`${Math.round(conditionDims.reduce((s,d)=>s+d.score,0)/conditionDims.length)}/100`} sub="Weighted condition composite" />
        <KpiCard label="Degraded Area" value={`${Math.round(la*0.08).toLocaleString()} ha`} sub="Land requiring restoration" />
      </Row>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:24}}>
        <Section title="Ecosystem Extent by Land Use Type (ha)">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={extentData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="type" tick={{fontSize:10}} angle={-15} textAnchor="end" height={50} />
              <YAxis unit=" ha" />
              <Tooltip formatter={v=>`${v} ha`} />
              <Bar dataKey="area" name="Area (ha)" fill="#059669">
                {extentData.map((_,i)=><Cell key={i} fill={COLORS[i%COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Section>
        <Section title="Ecosystem Condition Index Radar">
          <ResponsiveContainer width="100%" height={280}>
            <RadarChart data={conditionDims}>
              <PolarGrid stroke="#e5e7eb" />
              <PolarAngleAxis dataKey="dim" tick={{fontSize:10}} />
              <PolarRadiusAxis angle={90} domain={[0,100]} tick={{fontSize:9}} />
              <Radar name="Condition" dataKey="score" stroke="#059669" fill="#059669" fillOpacity={0.3} />
              <Tooltip />
            </RadarChart>
          </ResponsiveContainer>
        </Section>
      </div>
    </div>
  );
}

function Tab2({landArea}) {
  const la=parseFloat(landArea)||1000;
  const services=['Pollination','Water Regulation','Flood Attenuation','Carbon Sequestration','Soil Erosion Control','Nutrient Cycling','Timber Provision','Recreation & Tourism'].map((s,i)=>({
    service:s, value: Math.round(la*(50+rng(i+10)*450)), method: ['Market Price','Replace. Cost','Hedonic','Social Carbon','Benefit Transfer','Input Cost','Market Price','Travel Cost'][i],
  })).sort((a,b)=>b.value-a.value);
  const methodPie=[{name:'Market Price',value:35},{name:'Replace. Cost',value:28},{name:'Benefit Transfer',value:20},{name:'Hedonic',value:10},{name:'Travel Cost',value:7}];
  return (
    <div>
      <Row>
        <KpiCard label="Total Services Value" value={`$${Math.round(services.reduce((s,sv)=>s+sv.value,0)/1000)}k`} sub="Annual flow value" />
        <KpiCard label="Top Service" value={services[0].service} sub={`$${services[0].value.toLocaleString()} / yr`} />
        <KpiCard label="Valuation Methods" value={5} sub="Distinct methods applied" />
        <KpiCard label="Confidence Level" value={`${Math.round(60+rng(15)*30)}%`} sub="Weighted uncertainty estimate" />
      </Row>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:24}}>
        <Section title="Top 8 Ecosystem Services by Value ($/yr)">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={services} layout="vertical" margin={{left:150}}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis type="category" dataKey="service" tick={{fontSize:10}} />
              <Tooltip formatter={v=>`$${v.toLocaleString()}`} />
              <Bar dataKey="value" name="Value ($/yr)" fill="#059669" />
            </BarChart>
          </ResponsiveContainer>
        </Section>
        <Section title="Valuation Method Distribution">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={methodPie} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={({name,percent})=>`${(percent*100).toFixed(0)}%`}>
                {methodPie.map((_,i)=><Cell key={i} fill={COLORS[i%COLORS.length]} />)}
              </Pie>
              <Tooltip /><Legend />
            </PieChart>
          </ResponsiveContainer>
        </Section>
      </div>
    </div>
  );
}

function Tab3({landArea}) {
  const la=parseFloat(landArea)||1000;
  const directUse=Math.round(la*300);
  const indirectUse=Math.round(la*180);
  const optionVal=Math.round(la*80);
  const existenceVal=Math.round(la*60);
  const bequestVal=Math.round(la*40);
  const total=directUse+indirectUse+optionVal+existenceVal+bequestVal;
  const stackData=[{name:'TEV'},{name:'Use'},{name:'Non-Use'}].map((n,i)=>({
    category:n.name,
    direct_use: i===0||i===1?directUse:0,
    indirect_use: i===0||i===1?indirectUse:0,
    option_value: i===0||i===2?optionVal:0,
    existence: i===0||i===2?existenceVal:0,
    bequest: i===0||i===2?bequestVal:0,
  }));
  return (
    <div>
      <Row>
        <KpiCard label="Total Economic Value" value={`$${(total/1000).toFixed(0)}k`} sub="TEV — all components" />
        <KpiCard label="Use Values" value={`$${((directUse+indirectUse)/1000).toFixed(0)}k`} sub="Direct + indirect use" />
        <KpiCard label="Non-Use Values" value={`$${((optionVal+existenceVal+bequestVal)/1000).toFixed(0)}k`} sub="Option + existence + bequest" />
        <KpiCard label="Non-Use Share" value={`${((optionVal+existenceVal+bequestVal)/total*100).toFixed(0)}%`} sub="% of TEV" />
      </Row>
      <Section title="TEV Component Breakdown ($/yr)">
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={[{name:'Total Economic Value', direct_use:directUse, indirect_use:indirectUse, option_value:optionVal, existence:existenceVal, bequest:bequestVal}]}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip formatter={v=>`$${v.toLocaleString()}`} />
            <Legend />
            <Bar dataKey="direct_use" stackId="a" fill="#059669" name="Direct Use" />
            <Bar dataKey="indirect_use" stackId="a" fill="#10b981" name="Indirect Use" />
            <Bar dataKey="option_value" stackId="a" fill="#f59e0b" name="Option Value" />
            <Bar dataKey="existence" stackId="a" fill="#0284c7" name="Existence Value" />
            <Bar dataKey="bequest" stackId="a" fill="#7c3aed" name="Bequest Value" />
          </BarChart>
        </ResponsiveContainer>
      </Section>
    </div>
  );
}

function Tab4({entityName,sector}) {
  const steps=['L: Locate','E: Evaluate','A: Assess','P: Prepare'].map((s,i)=>({step:s,score:Math.round(40+rng(i+30)*55)}));
  const overall=Math.round(steps.reduce((s,d)=>s+d.score,0)/steps.length);
  const gaugeData=[{name:'TNFD Score',value:overall,fill:'#059669'}];
  const disclosures=['Nature-related risks identified (TNFD A3)','Ecosystem services dependencies disclosed','Location-specific biodiversity metrics (TNFD B5)','Financed nature impacts reported','SBTN target-setting initiated','Taskforce recommendations adopted'];
  return (
    <div>
      <Row>
        <KpiCard label="TNFD LEAP Score" value={`${overall}/100`} sub="4-step composite" />
        <KpiCard label="TNFD Status" value={overall>=75?'Advanced':overall>=50?'Progressing':'Initiated'} sub="Voluntary disclosure tier" />
        <KpiCard label="TNFD Adopter" value={rng(35)>0.4?'Yes':'Committed'} sub="TNFD v1.0 (Sept 2023)" />
        <KpiCard label="Priority Disclosures" value={disclosures.filter((_,i)=>rng(i+36)>0.5).length} sub="Ready for reporting" />
      </Row>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:24}}>
        <Section title="TNFD LEAP 4-Step Scores">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={steps} layout="vertical" margin={{left:20}}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" domain={[0,100]} />
              <YAxis type="category" dataKey="step" tick={{fontSize:11}} />
              <Tooltip />
              <Bar dataKey="score" fill="#059669">
                {steps.map((s,i)=><Cell key={i} fill={s.score>=70?'#059669':s.score>=50?'#f59e0b':'#ef4444'} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Section>
        <Section title="Overall TNFD Score Gauge">
          <ResponsiveContainer width="100%" height={260}>
            <RadialBarChart cx="50%" cy="50%" innerRadius="40%" outerRadius="80%" data={gaugeData} startAngle={180} endAngle={0}>
              <RadialBar background dataKey="value" label={{fill:'#111',fontSize:20,fontWeight:'bold'}} />
              <Tooltip formatter={v=>`${v}/100`} />
            </RadialBarChart>
          </ResponsiveContainer>
        </Section>
      </div>
      <Section title="Priority Disclosures Status">
        <div style={{display:'flex',flexDirection:'column',gap:8}}>
          {disclosures.map((d,i)=>{const ready=rng(i+40)>0.5; return(<div key={i} style={{display:'flex',alignItems:'center',gap:8,fontSize:13,padding:8,borderRadius:6,border:ready?'1px solid #bbf7d0':'1px solid #e5e7eb',background:ready?'#f0fdf4':'#f9fafb'}}><span>{ready?'✓':'○'}</span><span style={{flex:1}}>{d}</span><Badge color={ready?'green':'gray'}>{ready?'Ready':'In Progress'}</Badge></div>);})}
        </div>
      </Section>
    </div>
  );
}

function Tab5() {
  const sbtnSteps=['1: Assess','2: Interpret & Prioritise','3: Measure & Set Targets','4: Act','5: Track & Disclose'];
  const progress=sbtnSteps.map((s,i)=>({step:s, complete: rng(i+50)>0.4, pct:Math.round(20+rng(i+51)*80)}));
  const biomes=['Tropical & Subtropical Forests','Grasslands & Savannas','Freshwater','Marine & Coastal','Temperate Forests'].map((b,i)=>({
    biome:b, targets:Math.round(rng(i+55)>0.5?1+Math.round(rng(i+56)*3):0), completeness:Math.round(20+rng(i+57)*75),
  }));
  return (
    <div>
      <Row>
        <KpiCard label="SBTN Step Reached" value={`Step ${progress.findIndex(p=>!p.complete)+1||5}`} sub="Science Based Targets for Nature" />
        <KpiCard label="Targets Set" value={biomes.reduce((s,b)=>s+b.targets,0)} sub="Across priority biomes" />
        <KpiCard label="SBTN Committed" value={rng(60)>0.4?'Yes':'No'} sub="Corporate commitment status" />
        <KpiCard label="CBD GBF Target 15" value={`${Math.round(30+rng(61)*60)}%`} sub="Readiness to report sub-elements a-f" />
      </Row>
      <Section title="SBTN 5-Step Progress">
        <div style={{display:'flex',flexDirection:'column',gap:12}}>
          {progress.map((s,i)=>(<div key={i} style={{display:'flex',alignItems:'center',gap:16}}>
            <div style={{width:144,fontSize:12,color:'#6b7280',fontWeight:500}}>{s.step}</div>
            <div style={{flex:1,background:'#e5e7eb',borderRadius:9999,height:12}}>
              <div style={{background:'#10b981',height:12,borderRadius:9999,width:`${s.pct}%`}} />
            </div>
            <div style={{width:40,fontSize:12,color:'#6b7280',fontFamily:'monospace',textAlign:'right'}}>{s.pct}%</div>
            <Badge color={s.complete?'green':'yellow'}>{s.complete?'Done':'WIP'}</Badge>
          </div>))}
        </div>
      </Section>
      <Section title="Target Completeness by Biome">
        <table style={tblStyle}>
          <thead><tr>{['Biome','Targets Set','Completeness'].map(h=><th key={h} style={thStyle}>{h}</th>)}</tr></thead>
          <tbody>{biomes.map((b,i)=>(<tr key={i}>
            <td style={{...tdStyle,fontSize:12,fontWeight:500}}>{b.biome}</td>
            <td style={tdStyle}><Badge color={b.targets>0?'blue':'gray'}>{b.targets}</Badge></td>
            <td style={tdStyle}>
              <div style={{display:'flex',alignItems:'center',gap:8}}>
                <div style={{flex:1,background:'#e5e7eb',borderRadius:9999,height:8}}><div style={{background:'#10b981',height:8,borderRadius:9999,width:`${b.completeness}%`}} /></div>
                <span style={{fontSize:12,fontFamily:'monospace'}}>{b.completeness}%</span>
              </div>
            </td>
          </tr>))}</tbody>
        </table>
      </Section>
    </div>
  );
}

export default function NatureCapitalAccountingPage() {
  const [activeTab,setActiveTab]=useState(0);
  const [entityName,setEntityName]=useState('Forest Holdings Ltd');
  const [sector,setSector]=useState('Forestry');
  const [landArea,setLandArea]=useState('15000');
  const [primaryEcosystem,setPrimaryEcosystem]=useState('Temperate Forest');
  const panels=[<Tab1 entityName={entityName} landArea={landArea} primaryEcosystem={primaryEcosystem}/>,<Tab2 landArea={landArea}/>,<Tab3 landArea={landArea}/>,<Tab4 entityName={entityName} sector={sector}/>,<Tab5/>];
  return (
    <div style={{minHeight:'100vh',background:'#f9fafb',padding:24}}>
      <div style={{maxWidth:1200,margin:'0 auto'}}>
        <div style={{marginBottom:24}}>
          <h1 style={{fontSize:24,fontWeight:700,color:'#111827'}}>Nature Capital Accounting Engine</h1>
          <p style={{fontSize:13,color:'#6b7280',marginTop:4}}>SEEA EA · TNFD v1.0 LEAP · SBTN 5-Step · TEV Framework · CBD GBF Target 15 · ENCORE · E116</p>
        </div>
        <div style={{background:'white',border:'1px solid #e5e7eb',borderRadius:8,padding:16,marginBottom:24}}>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))',gap:16}}>
            <Inp label="Entity Name" value={entityName} onChange={e=>setEntityName(e.target.value)} />
            <Sel label="Sector" value={sector} onChange={e=>setSector(e.target.value)}>{SECTORS.map(o=><option key={o}>{o}</option>)}</Sel>
            <Inp label="Land Area (ha)" type="number" value={landArea} onChange={e=>setLandArea(e.target.value)} />
            <Sel label="Primary Ecosystem" value={primaryEcosystem} onChange={e=>setPrimaryEcosystem(e.target.value)}>{ECOSYSTEMS.map(o=><option key={o}>{o}</option>)}</Sel>
          </div>
        </div>
        <div style={{display:'flex',gap:8,marginBottom:24,borderBottom:'1px solid #e5e7eb',overflowX:'auto'}}>
          {TABS.map((t,i)=>(<button key={i} onClick={()=>setActiveTab(i)} style={{padding:'8px 16px',fontSize:13,fontWeight:500,whiteSpace:'nowrap',background:'none',border:'none',cursor:'pointer',borderBottom:activeTab===i?'2px solid #059669':'2px solid transparent',color:activeTab===i?'#059669':'#6b7280'}}>{t}</button>))}
        </div>
        <div style={{background:'white',borderRadius:12,border:'1px solid #e5e7eb',padding:24}}>{panels[activeTab]}</div>
      </div>
    </div>
  );
}
