import React,{useState,useMemo,useEffect} from 'react';
import {BarChart,Bar,XAxis,YAxis,CartesianGrid,Tooltip,ResponsiveContainer,PieChart,Pie,Cell,Legend} from 'recharts';

const API='http://localhost:8001';

const T={bg:'#f4f6f9',surface:'#ffffff',surfaceH:'#eef1f6',border:'#e3e8ef',borderL:'#cfd6e0',navy:'#1b3a5c',navyL:'#2c5a8c',gold:'#c5a96a',goldL:'#d4be8a',text:'#1b3a5c',textSec:'#5c6b7e',textMut:'#9aa3ae',red:'#dc2626',green:'#16a34a',amber:'#d97706',purple:'#7c3aed',teal:'#0e7490',font:"'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"};

// Sensible starter values for a first-run demo export. These are only the
// *default form values* — the real facts, iXBRL/XBRL output and ESEF
// validation results always come from the live backend engine
// (services/xbrl_export_engine.py), never fabricated client-side.
const DEFAULT_VALUES={
  'E1-6_scope1_gross':12450,'E1-6_scope2_location':8320,'E1-6_scope2_market':6180,
  'E1-6_scope3_total':84200,'E1-6_total_ghg':104970,'E1-6_ghg_intensity_revenue':1.25,
  'E1-5_energy_consumption_total':64100,'E1-5_renewable_share':29.5,
  'E1-9_internal_carbon_price':85,'E1-9_transition_risk_amount':4200000,'E1-9_physical_risk_amount':1800000,
  'E2-4_pollutants_air':12.4,'E3-4_water_consumption':125000,'E4-5_land_use_change':3.2,
  'E5-5_waste_generated':980,'S2_scope1_ghg':12450,'S2_scope2_ghg':8320,
};

const pill=(color,text,sm)=>({display:'inline-block',padding:sm?'1px 7px':'2px 10px',borderRadius:10,fontSize:sm?10:11,fontWeight:600,background:color+'18',color,border:`1px solid ${color}30`});
const sevColor=(s)=>s==='Error'?T.red:T.amber;

async function postJSON(path,body){
  const r=await fetch(`${API}${path}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
  if(!r.ok){
    let detail=`HTTP ${r.status}`;
    try{const j=await r.json();if(j.detail)detail=typeof j.detail==='string'?j.detail:JSON.stringify(j.detail);}catch(_e){/* ignore */}
    throw new Error(detail);
  }
  return r.json();
}

export default function XbrlExportWizardPage(){
  const [tab,setTab]=useState(0);
  const TABS=['Data Mapping','Taxonomy Browser','Validation Report','Export Preview'];

  // Real reference data, loaded once from the backend engine.
  const [taxonomy,setTaxonomy]=useState({});          // ESRS_XBRL_TAXONOMY
  const [validationRules,setValidationRules]=useState([]); // ESEF_VALIDATION_RULES
  const [refLoading,setRefLoading]=useState(true);
  const [refError,setRefError]=useState(null);

  // Filing entity + data-point form state.
  const [entityName,setEntityName]=useState('Demo Industrials SE');
  const [entityLei,setEntityLei]=useState('529900T8BM49AURSDO55');
  const [periodStart,setPeriodStart]=useState('2024-01-01');
  const [periodEnd,setPeriodEnd]=useState('2024-12-31');
  const [currency,setCurrency]=useState('EUR');
  const [decimals,setDecimals]=useState(0);
  const [values,setValues]=useState(DEFAULT_VALUES);

  // Real export result from POST /api/v1/xbrl/export.
  const [exportResult,setExportResult]=useState(null);
  const [exportLoading,setExportLoading]=useState(false);
  const [exportError,setExportError]=useState(null);

  useEffect(()=>{
    let cancelled=false;
    (async()=>{
      try{
        const [tax,rules]=await Promise.all([
          fetch(`${API}/api/v1/xbrl/ref/taxonomy`).then(r=>r.ok?r.json():{}),
          fetch(`${API}/api/v1/xbrl/ref/validation-rules`).then(r=>r.ok?r.json():[]),
        ]);
        if(!cancelled){setTaxonomy(tax);setValidationRules(rules);}
      }catch(e){
        if(!cancelled)setRefError(`Could not reach XBRL export API at ${API}. Is the backend running (backend/server.py, port 8001)?`);
      }finally{
        if(!cancelled)setRefLoading(false);
      }
    })();
    return ()=>{cancelled=true;};
  },[]);

  const dpIds=useMemo(()=>Object.keys(taxonomy),[taxonomy]);

  const runExport=async()=>{
    setExportLoading(true);setExportError(null);
    try{
      const data_points=Object.entries(values)
        .filter(([dpId,v])=>dpIds.includes(dpId)&&v!==''&&v!==null&&!Number.isNaN(Number(v)))
        .map(([dp_id,v])=>({dp_id,value:Number(v)}));
      const result=await postJSON('/api/v1/xbrl/export',{
        entity_name:entityName,entity_lei:entityLei,
        period_start:periodStart,period_end:periodEnd,
        data_points,currency,decimals:Number(decimals),
      });
      setExportResult(result);
      setTab(2); // jump to Validation Report so the real ESMA rejection-reason results are visible
    }catch(e){
      setExportError(e.message||'Export failed');
    }finally{
      setExportLoading(false);
    }
  };

  return(
    <div style={{fontFamily:T.font,background:T.bg,minHeight:'100vh',padding:24,color:T.text}}>
      <div style={{maxWidth:1440,margin:'0 auto'}}>
        <div style={{marginBottom:24}}>
          <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:6}}>
            <span style={{fontFamily:T.mono,fontSize:11,color:T.gold,fontWeight:700,background:T.navy,padding:'3px 10px',borderRadius:4}}>EP-AZ3</span>
            <span style={{fontFamily:T.mono,fontSize:11,color:T.textMut}}>CSRD iXBRL · EFRAG ESRS XBRL TAXONOMY 2024 · ESEF REG 2019/815 · ESMA FILING RULES</span>
            <span style={pill(T.green,'LIVE ENGINE',true)}>LIVE ENGINE</span>
          </div>
          <h1 style={{fontSize:26,fontWeight:700,color:T.navy,margin:0}}>XBRL Export Wizard</h1>
          <p style={{color:T.textSec,fontSize:14,margin:'4px 0 0'}}>iXBRL tagging, EFRAG ESRS taxonomy mapping, ESEF validation & regulatory filing export — wired to services/xbrl_export_engine.py (XBRLExportEngine)</p>
        </div>
        {refError&&(
          <div style={{background:T.red+'0a',border:`1px solid ${T.red}30`,borderRadius:10,padding:'12px 16px',marginBottom:16,color:T.red,fontSize:13}}>{refError}</div>
        )}
        <div style={{display:'flex',gap:4,marginBottom:24,background:T.surface,borderRadius:10,padding:4,border:`1px solid ${T.border}`}}>
          {TABS.map((t,i)=>(
            <button key={i} onClick={()=>setTab(i)} style={{flex:1,padding:'10px 16px',borderRadius:8,border:'none',cursor:'pointer',fontSize:13,fontWeight:tab===i?700:500,background:tab===i?T.navy:'transparent',color:tab===i?'#fff':T.textSec,transition:'all 0.2s'}}>
              {t}
            </button>
          ))}
        </div>
        {tab===0&&<DataMapping
          taxonomy={taxonomy} dpIds={dpIds} refLoading={refLoading}
          entityName={entityName} setEntityName={setEntityName}
          entityLei={entityLei} setEntityLei={setEntityLei}
          periodStart={periodStart} setPeriodStart={setPeriodStart}
          periodEnd={periodEnd} setPeriodEnd={setPeriodEnd}
          currency={currency} setCurrency={setCurrency}
          decimals={decimals} setDecimals={setDecimals}
          values={values} setValues={setValues}
          runExport={runExport} exportLoading={exportLoading} exportError={exportError}
        />}
        {tab===1&&<TaxonomyBrowser taxonomy={taxonomy} refLoading={refLoading}/>}
        {tab===2&&<ValidationReport exportResult={exportResult} validationRules={validationRules}/>}
        {tab===3&&<ExportPreview exportResult={exportResult} entityName={entityName} entityLei={entityLei}/>}
      </div>
    </div>
  );
}

/* ===== TAB 1: DATA MAPPING (real taxonomy + live export call) ===== */
function DataMapping({taxonomy,dpIds,refLoading,entityName,setEntityName,entityLei,setEntityLei,periodStart,setPeriodStart,periodEnd,setPeriodEnd,currency,setCurrency,decimals,setDecimals,values,setValues,runExport,exportLoading,exportError}){
  const [search,setSearch]=useState('');
  const [filterESRS,setFilterESRS]=useState('All');

  const rows=useMemo(()=>dpIds.map(id=>({id,...taxonomy[id]})),[dpIds,taxonomy]);
  const esrsGroups=useMemo(()=>Array.from(new Set(rows.map(r=>r.esrs))).sort(),[rows]);

  const filtered=useMemo(()=>rows.filter(r=>{
    if(filterESRS!=='All'&&r.esrs!==filterESRS)return false;
    if(search&&!r.label.toLowerCase().includes(search.toLowerCase())&&!r.concept.toLowerCase().includes(search.toLowerCase()))return false;
    return true;
  }),[rows,search,filterESRS]);

  const tagged=rows.filter(r=>values[r.id]!==undefined&&values[r.id]!==''&&values[r.id]!==null).length;
  const gap=rows.length-tagged;

  const byEsrs=esrsGroups.map(e=>({esrs:e,count:rows.filter(r=>r.esrs===e).length,tagged:rows.filter(r=>r.esrs===e&&values[r.id]!==undefined&&values[r.id]!=='').length}));

  const setVal=(id,v)=>setValues(prev=>({...prev,[id]:v}));

  return(
    <div>
      <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:12,padding:20,marginBottom:20}}>
        <div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:12}}>Filing Entity</div>
        <div style={{display:'grid',gridTemplateColumns:'2fr 2fr 1fr 1fr 1fr 1fr',gap:12,alignItems:'end'}}>
          <label style={{fontSize:11,color:T.textSec}}>Entity Name
            <input value={entityName} onChange={e=>setEntityName(e.target.value)} style={{display:'block',width:'100%',marginTop:4,padding:'7px 10px',borderRadius:8,border:`1px solid ${T.border}`,fontSize:12,fontFamily:T.font,boxSizing:'border-box'}}/>
          </label>
          <label style={{fontSize:11,color:T.textSec}}>Entity LEI (20 chars)
            <input value={entityLei} onChange={e=>setEntityLei(e.target.value)} maxLength={20} style={{display:'block',width:'100%',marginTop:4,padding:'7px 10px',borderRadius:8,border:`1px solid ${T.border}`,fontSize:12,fontFamily:T.mono,boxSizing:'border-box'}}/>
          </label>
          <label style={{fontSize:11,color:T.textSec}}>Period Start
            <input type="date" value={periodStart} onChange={e=>setPeriodStart(e.target.value)} style={{display:'block',width:'100%',marginTop:4,padding:'6px 8px',borderRadius:8,border:`1px solid ${T.border}`,fontSize:12,fontFamily:T.mono,boxSizing:'border-box'}}/>
          </label>
          <label style={{fontSize:11,color:T.textSec}}>Period End
            <input type="date" value={periodEnd} onChange={e=>setPeriodEnd(e.target.value)} style={{display:'block',width:'100%',marginTop:4,padding:'6px 8px',borderRadius:8,border:`1px solid ${T.border}`,fontSize:12,fontFamily:T.mono,boxSizing:'border-box'}}/>
          </label>
          <label style={{fontSize:11,color:T.textSec}}>Currency
            <input value={currency} onChange={e=>setCurrency(e.target.value)} style={{display:'block',width:'100%',marginTop:4,padding:'7px 10px',borderRadius:8,border:`1px solid ${T.border}`,fontSize:12,fontFamily:T.mono,boxSizing:'border-box'}}/>
          </label>
          <label style={{fontSize:11,color:T.textSec}}>Decimals
            <input type="number" value={decimals} onChange={e=>setDecimals(e.target.value)} style={{display:'block',width:'100%',marginTop:4,padding:'7px 10px',borderRadius:8,border:`1px solid ${T.border}`,fontSize:12,fontFamily:T.mono,boxSizing:'border-box'}}/>
          </label>
        </div>
        {exportError&&<div style={{marginTop:12,padding:'10px 14px',borderRadius:8,background:T.red+'0a',border:`1px solid ${T.red}30`,color:T.red,fontSize:12}}>{exportError}</div>}
        <button onClick={runExport} disabled={exportLoading||refLoading} style={{marginTop:14,padding:'10px 24px',borderRadius:8,background:exportLoading?T.textMut:T.navy,color:'#fff',border:'none',cursor:exportLoading?'default':'pointer',fontSize:13,fontWeight:700}}>
          {exportLoading?'Generating iXBRL / XBRL…':'Generate XBRL Export'}
        </button>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:16,marginBottom:24}}>
        {[
          {label:'Total Data Points',value:rows.length,sub:'From live EFRAG ESRS taxonomy'},
          {label:'Values Entered',value:tagged,sub:'Will be tagged on export',color:T.green},
          {label:'Not Entered',value:gap,sub:'Omitted from this export',color:T.amber},
          {label:'ESRS Standards Covered',value:esrsGroups.length,sub:esrsGroups.join(', ')||'—'},
        ].map((kpi,i)=>(
          <div key={i} style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:12,padding:'16px 20px'}}>
            <div style={{fontSize:11,fontWeight:600,color:T.textMut,textTransform:'uppercase',letterSpacing:0.5,marginBottom:6}}>{kpi.label}</div>
            <div style={{fontSize:26,fontWeight:700,color:kpi.color||T.navy,fontFamily:T.mono}}>{kpi.value}</div>
            <div style={{fontSize:12,color:T.textSec,marginTop:2}}>{kpi.sub}</div>
          </div>
        ))}
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1fr 280px',gap:20,marginBottom:20}}>
        <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:12,padding:20}}>
          <div style={{display:'flex',gap:12,marginBottom:16,flexWrap:'wrap',alignItems:'center'}}>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search concept or label…" style={{padding:'7px 12px',borderRadius:8,border:`1px solid ${T.border}`,fontSize:12,width:220,fontFamily:T.font}}/>
            <select value={filterESRS} onChange={e=>setFilterESRS(e.target.value)} style={{padding:'7px 10px',borderRadius:8,border:`1px solid ${T.border}`,fontSize:12,fontFamily:T.font}}>
              <option value="All">All ESRS</option>
              {esrsGroups.map(e=><option key={e}>{e}</option>)}
            </select>
            <span style={{marginLeft:'auto',fontSize:11,color:T.textMut,fontFamily:T.mono}}>{filtered.length}/{rows.length}</span>
          </div>
          {refLoading?(
            <div style={{padding:'24px 10px',textAlign:'center',color:T.textMut,fontSize:13}}>Loading live taxonomy from backend…</div>
          ):(
          <table style={{width:'100%',borderCollapse:'collapse',fontSize:11}}>
            <thead>
              <tr style={{borderBottom:`2px solid ${T.border}`}}>
                {['ESRS','DR Ref','XBRL Concept','Label','Unit','Value'].map(h=>(
                  <th key={h} style={{padding:'7px 10px',textAlign:'left',fontSize:10,fontWeight:700,color:T.textMut,textTransform:'uppercase',letterSpacing:0.4}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((c)=>(
                <tr key={c.id} style={{borderBottom:`1px solid ${T.borderL}`}}>
                  <td style={{padding:'8px 10px',fontFamily:T.mono,fontWeight:700,color:T.navy,fontSize:11}}>{c.esrs}</td>
                  <td style={{padding:'8px 10px',fontFamily:T.mono,fontSize:10,color:T.gold}}>{c.dr}</td>
                  <td style={{padding:'8px 10px',fontFamily:T.mono,fontSize:10,color:T.textSec,maxWidth:200,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{c.concept}</td>
                  <td style={{padding:'8px 10px',fontSize:12,color:T.text}}>{c.label}</td>
                  <td style={{padding:'8px 10px',fontFamily:T.mono,fontSize:10,color:T.textMut}}>{c.unit}</td>
                  <td style={{padding:'8px 10px'}}>
                    <input value={values[c.id]??''} onChange={e=>setVal(c.id,e.target.value)} placeholder="—" style={{width:100,padding:'5px 8px',borderRadius:6,border:`1px solid ${T.border}`,fontSize:11,fontFamily:T.mono}}/>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          )}
        </div>

        <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:12,padding:20}}>
          <div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:16}}>Coverage by ESRS</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={byEsrs} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/>
              <XAxis type="number" style={{fontSize:9}}/>
              <YAxis type="category" dataKey="esrs" width={30} style={{fontSize:11}}/>
              <Tooltip/>
              <Legend/>
              <Bar dataKey="tagged" name="Entered" fill={T.green} radius={[0,4,4,0]}/>
              <Bar dataKey="count" name="Total" fill={T.borderL} radius={[0,4,4,0]}/>
            </BarChart>
          </ResponsiveContainer>
          <div style={{marginTop:16}}>
            <div style={{fontSize:11,fontWeight:700,color:T.textMut,marginBottom:8}}>TAGGING PROGRESS</div>
            <div style={{height:8,background:T.borderL,borderRadius:4,overflow:'hidden',marginBottom:6}}>
              <div style={{width:(rows.length?tagged/rows.length*100:0)+'%',height:'100%',background:T.green,borderRadius:4}}/>
            </div>
            <div style={{display:'flex',justifyContent:'space-between',fontSize:11,fontFamily:T.mono}}>
              <span style={{color:T.green}}>{tagged} entered</span>
              <span style={{color:T.navy,fontWeight:700}}>{rows.length?Math.round(tagged/rows.length*100):0}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ===== TAB 2: TAXONOMY BROWSER (real ESRS_XBRL_TAXONOMY) ===== */
function TaxonomyBrowser({taxonomy,refLoading}){
  const rows=useMemo(()=>Object.entries(taxonomy).map(([id,v])=>({id,...v})),[taxonomy]);
  const allEsrs=useMemo(()=>Array.from(new Set(rows.map(r=>r.esrs))).sort(),[rows]);
  const [selEsrs,setSelEsrs]=useState(null);
  const activeEsrs=selEsrs||allEsrs[0];

  const namespaces=[
    {prefix:'esrs',uri:'http://xbrl.efrag.org/taxonomy/esrs/2024',desc:'EFRAG ESRS XBRL Taxonomy 2024'},
    {prefix:'ifrs-s2',uri:'http://xbrl.ifrs.org/taxonomy/ifrs-s2/2024',desc:'ISSB IFRS S2 Climate Taxonomy 2024'},
    {prefix:'xbrli',uri:'http://www.xbrl.org/2003/instance',desc:'XBRL Instance Document'},
    {prefix:'iso4217',uri:'http://www.xbrl.org/2003/iso4217',desc:'ISO 4217 Currency Codes'},
    {prefix:'xlink',uri:'http://www.w3.org/1999/xlink',desc:'XLink Specification'},
  ];

  const esrsConcepts=rows.filter(c=>c.esrs===activeEsrs);

  const dataTypes=useMemo(()=>{
    const counts={};
    rows.forEach(r=>{counts[r.data_type]=(counts[r.data_type]||0)+1;});
    return Object.entries(counts).map(([type,count])=>({type,count}));
  },[rows]);

  if(refLoading)return <div style={{padding:'24px 10px',textAlign:'center',color:T.textMut,fontSize:13}}>Loading live taxonomy from backend…</div>;

  return(
    <div>
      <div style={{display:'grid',gridTemplateColumns:'280px 1fr',gap:20,marginBottom:20}}>
        <div>
          <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:12,padding:20,marginBottom:16}}>
            <div style={{fontSize:12,fontWeight:700,color:T.textMut,marginBottom:10}}>ESRS STANDARD</div>
            {allEsrs.map(e=>(
              <div key={e} onClick={()=>setSelEsrs(e)} style={{padding:'9px 12px',borderRadius:8,cursor:'pointer',background:activeEsrs===e?T.navy:'transparent',marginBottom:3,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <span style={{fontFamily:T.mono,fontWeight:700,color:activeEsrs===e?T.gold:T.navy,fontSize:13}}>{e}</span>
                <span style={{fontSize:11,color:activeEsrs===e?'#fff':T.textMut}}>{rows.filter(c=>c.esrs===e).length} concepts</span>
              </div>
            ))}
          </div>
          <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:12,padding:20}}>
            <div style={{fontSize:12,fontWeight:700,color:T.textMut,marginBottom:12}}>XBRL DATA TYPES (live count)</div>
            {dataTypes.map((dt,i)=>(
              <div key={i} style={{marginBottom:12,padding:'10px 12px',background:T.surfaceH,borderRadius:8,border:`1px solid ${T.borderL}`}}>
                <div style={{fontFamily:T.mono,fontSize:11,fontWeight:700,color:T.navy,marginBottom:4}}>{dt.type}</div>
                <div style={{fontSize:10,fontFamily:T.mono,color:T.textMut,marginTop:3}}>{dt.count} concepts</div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:12,padding:20,marginBottom:16}}>
            <div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:4}}>EFRAG ESRS XBRL Taxonomy — {activeEsrs} Concepts</div>
            <div style={{fontSize:12,color:T.textSec,marginBottom:16}}>Live from GET /api/v1/xbrl/ref/taxonomy · Namespace: http://xbrl.efrag.org/taxonomy/esrs/2024</div>
            <div style={{display:'flex',flexDirection:'column',gap:8}}>
              {esrsConcepts.map((c)=>(
                <div key={c.id} style={{background:T.surfaceH,borderRadius:10,padding:'12px 16px',border:`1px solid ${T.borderL}`,fontFamily:T.mono}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:6}}>
                    <div>
                      <span style={{fontSize:10,color:T.teal,marginRight:8}}>{c.concept.split(':')[0]}:</span>
                      <span style={{fontSize:12,fontWeight:700,color:T.navy}}>{c.concept.split(':').slice(1).join(':')}</span>
                    </div>
                    <div style={{display:'flex',gap:6}}>
                      <span style={pill(T.purple,c.data_type,true)}>{c.data_type}</span>
                      <span style={pill(c.period_type==='duration'?T.teal:T.gold,c.period_type,true)}>{c.period_type}</span>
                    </div>
                  </div>
                  <div style={{fontFamily:T.font,fontSize:12,color:T.textSec,marginBottom:6}}>{c.label}</div>
                  <div style={{display:'flex',gap:16,fontSize:10,color:T.textMut,flexWrap:'wrap'}}>
                    <span>DR: <strong style={{color:T.gold}}>{c.dr}</strong></span>
                    <span>Para: <strong style={{color:T.navy}}>§{c.paragraph}</strong></span>
                    <span>Unit: <strong style={{color:T.navy}}>{c.unit}</strong></span>
                    <span>XBRL Unit: <strong style={{color:T.navy}}>{c.xbrl_unit}</strong></span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:12,padding:20}}>
            <div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:12}}>Namespace Declarations</div>
            <div style={{background:T.navy,borderRadius:8,padding:16,fontFamily:T.mono,fontSize:11,color:'#e2e8f0',overflow:'auto'}}>
              {namespaces.map((ns,i)=>(
                <div key={i} style={{marginBottom:4}}>
                  <span style={{color:T.gold}}>xmlns:</span>
                  <span style={{color:'#93c5fd'}}>{ns.prefix}</span>
                  <span style={{color:'#e2e8f0'}}>="</span>
                  <span style={{color:'#86efac'}}>{ns.uri}</span>
                  <span style={{color:'#e2e8f0'}}>"</span>
                  <span style={{color:'#64748b'}}> {/* {ns.desc} */}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ===== TAB 3: VALIDATION REPORT (real ESEF rules + real per-export validation_results) ===== */
function ValidationReport({exportResult,validationRules}){
  const [filterSev,setFilterSev]=useState('All');

  if(!exportResult){
    return(
      <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:12,padding:40,textAlign:'center'}}>
        <div style={{fontSize:14,color:T.textSec,marginBottom:16}}>No export has been generated yet. Go to <strong>Data Mapping</strong> and click <strong>Generate XBRL Export</strong> to run the real ESEF validation engine.</div>
        {validationRules.length>0&&(
          <div style={{textAlign:'left',marginTop:20}}>
            <div style={{fontSize:12,fontWeight:700,color:T.navy,marginBottom:10}}>ESEF Rule Catalog (live from GET /ref/validation-rules)</div>
            {validationRules.map(r=>(
              <div key={r.id} style={{padding:'8px 12px',background:T.surfaceH,borderRadius:8,marginBottom:6,fontSize:12}}>
                <span style={{fontFamily:T.mono,fontWeight:700,color:T.navy,marginRight:8}}>{r.id}</span>{r.desc}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  const results=exportResult.validation_results||[];
  const errors=exportResult.errors_count;
  const warnings=exportResult.warnings_count;
  const passing=results.filter(r=>r.passed).length;
  const readyToFile=exportResult.validation_passed;

  const filtered=filterSev==='All'?results:filterSev==='Failing'?results.filter(r=>!r.passed):results.filter(r=>r.passed);

  const pieData=[
    {name:'Passing',value:passing,color:T.green},
    {name:'Failing',value:results.length-passing,color:T.red},
  ];

  return(
    <div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:16,marginBottom:24}}>
        {[
          {label:'Total Checks Run',value:results.length,sub:`ESEF rules × ${exportResult.fact_count} facts`},
          {label:'Errors',value:errors,sub:'Must fix before filing',color:T.red},
          {label:'Warnings',value:warnings,sub:'Review recommended',color:T.amber},
          {label:'Filing Ready',value:readyToFile?'YES':'NO',sub:readyToFile?'All ESEF checks passed':'Fix errors first',color:readyToFile?T.green:T.red},
        ].map((kpi,i)=>(
          <div key={i} style={{background:T.surface,border:`2px solid ${(kpi.color||T.border)}30`,borderRadius:12,padding:'16px 20px'}}>
            <div style={{fontSize:11,fontWeight:600,color:T.textMut,textTransform:'uppercase',letterSpacing:0.5,marginBottom:6}}>{kpi.label}</div>
            <div style={{fontSize:26,fontWeight:700,color:kpi.color||T.navy,fontFamily:T.mono}}>{kpi.value}</div>
            <div style={{fontSize:12,color:T.textSec,marginTop:2}}>{kpi.sub}</div>
          </div>
        ))}
      </div>

      {!readyToFile&&(
        <div style={{background:T.red+'0a',border:`1px solid ${T.red}30`,borderRadius:10,padding:'14px 20px',marginBottom:20,display:'flex',gap:12,alignItems:'center'}}>
          <span style={{fontSize:20}}>⚠️</span>
          <div>
            <div style={{fontWeight:700,color:T.red,fontSize:14}}>Filing Blocked — {errors} Failing Check{errors!==1?'s':''}</div>
            <div style={{fontSize:12,color:T.textSec,marginTop:2}}>Real ESMA/ESEF rejection reasons from XBRLExportEngine._validate(). Resolve all failing checks before submitting to ESAP or a national filing portal.</div>
          </div>
        </div>
      )}

      <div style={{display:'grid',gridTemplateColumns:'1fr 280px',gap:20}}>
        <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:12,padding:20}}>
          <div style={{display:'flex',gap:8,marginBottom:16,alignItems:'center'}}>
            <div style={{fontSize:13,fontWeight:700,color:T.navy}}>Validation Results (live from this export)</div>
            {['All','Passing','Failing'].map(s=>(
              <button key={s} onClick={()=>setFilterSev(s)} style={{padding:'5px 12px',borderRadius:6,border:'none',cursor:'pointer',fontSize:11,fontWeight:filterSev===s?700:400,background:filterSev===s?T.navy:'transparent',color:filterSev===s?'#fff':T.textSec}}>
                {s}
              </button>
            ))}
          </div>
          <div style={{display:'flex',flexDirection:'column',gap:8,maxHeight:460,overflowY:'auto'}}>
            {filtered.map((rule,i)=>(
              <div key={i} style={{padding:'12px 16px',background:rule.passed?T.green+'08':T.red+'08',borderRadius:10,border:`1px solid ${rule.passed?T.green:T.red}20`,display:'flex',gap:12,alignItems:'flex-start'}}>
                <span style={{fontSize:16,color:rule.passed?T.green:T.red,flexShrink:0,marginTop:1}}>{rule.passed?'✓':'✗'}</span>
                <div style={{flex:1}}>
                  <div style={{display:'flex',gap:8,alignItems:'center',marginBottom:4}}>
                    <span style={{fontFamily:T.mono,fontSize:11,fontWeight:700,color:T.navy}}>{rule.rule_id}</span>
                  </div>
                  <div style={{fontSize:12,color:T.text}}>{rule.description}</div>
                  <div style={{fontSize:11,color:T.textMut,marginTop:2,fontFamily:T.mono}}>{rule.details}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:12,padding:20,marginBottom:16}}>
            <div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:16}}>Validation Summary</div>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value" label={({name,value})=>`${name}: ${value}`} labelLine={false}>
                  {pieData.map((e,i)=><Cell key={i} fill={e.color}/>)}
                </Pie>
                <Tooltip/>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:12,padding:20}}>
            <div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:12}}>Coverage by ESRS (this export)</div>
            {Object.entries(exportResult.coverage_by_esrs||{}).map(([esrs,count])=>(
              <div key={esrs} style={{display:'flex',justifyContent:'space-between',padding:'6px 10px',fontSize:12}}>
                <span style={{fontFamily:T.mono,fontWeight:700,color:T.navy}}>{esrs}</span>
                <span style={{color:T.textSec}}>{count} fact{count!==1?'s':''}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ===== TAB 4: EXPORT PREVIEW (real ixbrl_html / xbrl_xml from the engine) ===== */
function ExportPreview({exportResult,entityName,entityLei}){
  const [exportFormat,setExportFormat]=useState('ixbrl');
  const [copied,setCopied]=useState(false);

  if(!exportResult){
    return(
      <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:12,padding:40,textAlign:'center'}}>
        <div style={{fontSize:14,color:T.textSec}}>No export has been generated yet. Go to <strong>Data Mapping</strong> and click <strong>Generate XBRL Export</strong> to produce real iXBRL HTML and XBRL XML from XBRLExportEngine.</div>
      </div>
    );
  }

  const snippet=exportFormat==='ixbrl'?exportResult.ixbrl_html:exportResult.xbrl_xml;

  const handleCopy=()=>{
    if(navigator.clipboard)navigator.clipboard.writeText(snippet).catch(()=>{});
    setCopied(true);setTimeout(()=>setCopied(false),2000);
  };

  const handleDownload=()=>{
    const blob=new Blob([snippet],{type:exportFormat==='ixbrl'?'text/html':'application/xml'});
    const url=URL.createObjectURL(blob);
    const a=document.createElement('a');
    a.href=url;
    a.download=exportFormat==='ixbrl'?`${entityLei}_ESRS_${exportResult.reporting_period.slice(0,4)}.html`:`${entityLei}_ESRS_${exportResult.reporting_period.slice(0,4)}.xbrl`;
    document.body.appendChild(a);a.click();a.remove();
    URL.revokeObjectURL(url);
  };

  return(
    <div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 320px',gap:20}}>
        <div>
          <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:12,padding:20,marginBottom:16}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
              <div>
                <div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:2}}>Export Preview — real generated output</div>
                <div style={{fontSize:12,color:T.textSec}}>Entity: {exportResult.entity_name} · LEI: {exportResult.entity_lei} · Period: {exportResult.reporting_period}</div>
              </div>
              <div style={{display:'flex',gap:8,alignItems:'center'}}>
                <select value={exportFormat} onChange={e=>setExportFormat(e.target.value)} style={{padding:'7px 12px',borderRadius:8,border:`1px solid ${T.border}`,fontSize:12,fontFamily:T.font}}>
                  <option value="ixbrl">iXBRL (ESEF filing)</option>
                  <option value="xbrl">XBRL Instance Document</option>
                </select>
                <button onClick={handleCopy} style={{padding:'7px 16px',borderRadius:8,background:T.navy,color:'#fff',border:'none',cursor:'pointer',fontSize:12,fontWeight:600}}>
                  {copied?'Copied!':'Copy'}
                </button>
              </div>
            </div>
            <div style={{background:'#0f172a',borderRadius:10,padding:20,fontFamily:T.mono,fontSize:11,color:'#e2e8f0',overflow:'auto',maxHeight:420,lineHeight:1.6,whiteSpace:'pre'}}>
              {snippet.split('\n').map((line,i)=>{
                const isComment=line.trim().startsWith('<!--');
                const isTag=line.trim().startsWith('<');
                const isAttr=line.includes('xmlns:')||line.includes('xlink:')||line.includes('contextRef')||line.includes('unitRef')||line.includes('decimals');
                return(
                  <div key={i} style={{color:isComment?'#64748b':isAttr?'#93c5fd':isTag?'#86efac':'#e2e8f0'}}>
                    {line}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div>
          <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:12,padding:20,marginBottom:16}}>
            <div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:16}}>Export Summary</div>
            <div style={{display:'flex',flexDirection:'column',gap:8}}>
              <div style={{padding:'10px 14px',background:T.surfaceH,borderRadius:8,border:`1px solid ${T.borderL}`,fontSize:12}}>
                <div style={{display:'flex',justifyContent:'space-between'}}><span>Facts tagged</span><strong style={{fontFamily:T.mono}}>{exportResult.fact_count}</strong></div>
              </div>
              <div style={{padding:'10px 14px',background:T.surfaceH,borderRadius:8,border:`1px solid ${T.borderL}`,fontSize:12}}>
                <div style={{display:'flex',justifyContent:'space-between'}}><span>Taxonomy version</span><strong style={{fontFamily:T.mono}}>{exportResult.taxonomy_version}</strong></div>
              </div>
              <div style={{padding:'10px 14px',background:T.surfaceH,borderRadius:8,border:`1px solid ${T.borderL}`,fontSize:12}}>
                <div style={{display:'flex',justifyContent:'space-between'}}><span>Validation</span><span style={pill(exportResult.validation_passed?T.green:T.red,exportResult.validation_passed?'PASSED':'FAILED',true)}>{exportResult.validation_passed?'PASSED':'FAILED'}</span></div>
              </div>
            </div>
            <button onClick={handleDownload} style={{width:'100%',marginTop:16,padding:'12px',borderRadius:8,background:T.navy,color:'#fff',border:'none',cursor:'pointer',fontSize:13,fontWeight:700}}>
              Download {exportFormat==='ixbrl'?'iXBRL HTML':'XBRL Instance'}
            </button>
          </div>

          <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:12,padding:20}}>
            <div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:12}}>Filing Destinations (reference)</div>
            {[
              {platform:'ESAP (EU)',url:'esap.europa.eu',status:'Manual Submission',color:T.amber},
              {platform:'ESMA ESEF Viewer',url:'esef.esma.europa.eu',status:'Preview Only',color:T.amber},
              {platform:'National Register',url:'Jurisdiction Specific',status:'Manual',color:T.amber},
            ].map((dest,i)=>(
              <div key={i} style={{display:'flex',justifyContent:'space-between',padding:'8px 10px',background:i%2===0?T.surfaceH:'transparent',borderRadius:6,marginBottom:2}}>
                <div>
                  <div style={{fontSize:12,fontWeight:600,color:T.navy}}>{dest.platform}</div>
                  <div style={{fontSize:10,fontFamily:T.mono,color:T.textMut}}>{dest.url}</div>
                </div>
                <span style={pill(dest.color,dest.status,true)}>{dest.status}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
