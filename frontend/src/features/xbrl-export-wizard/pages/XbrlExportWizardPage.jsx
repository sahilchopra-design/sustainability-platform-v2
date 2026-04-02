import React,{useState,useMemo} from 'react';
import {BarChart,Bar,XAxis,YAxis,CartesianGrid,Tooltip,ResponsiveContainer,PieChart,Pie,Cell,Legend} from 'recharts';

const T={bg:'#f6f4f0',surface:'#ffffff',surfaceH:'#f0ede7',border:'#e5e0d8',borderL:'#d5cfc5',navy:'#1b3a5c',navyL:'#2c5a8c',gold:'#c5a96a',goldL:'#d4be8a',text:'#1b3a5c',textSec:'#5c6b7e',textMut:'#9aa3ae',red:'#dc2626',green:'#16a34a',amber:'#d97706',purple:'#7c3aed',teal:'#0e7490',font:"'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"};
const sr=(s)=>{let x=Math.sin(s+1)*10000;return x-Math.floor(x);};

// ESRS XBRL taxonomy concepts (subset)
const XBRL_CONCEPTS=[
  {id:'E1-6_scope1',concept:'esrs:GrossScope1GHGEmissions',esrs:'E1',dr:'E1-6',para:'44(a)',label:'Gross Scope 1 GHG emissions',unit:'tCO2e',type:'decimal',period:'duration',value:12450,status:'tagged'},
  {id:'E1-6_scope2_loc',concept:'esrs:GrossScope2GHGEmissionsLocationBased',esrs:'E1',dr:'E1-6',para:'44(b)',label:'Scope 2 GHG (location-based)',unit:'tCO2e',type:'decimal',period:'duration',value:8320,status:'tagged'},
  {id:'E1-6_scope2_mkt',concept:'esrs:GrossScope2GHGEmissionsMarketBased',esrs:'E1',dr:'E1-6',para:'44(c)',label:'Scope 2 GHG (market-based)',unit:'tCO2e',type:'decimal',period:'duration',value:6180,status:'tagged'},
  {id:'E1-6_scope3',concept:'esrs:TotalScope3GHGEmissions',esrs:'E1',dr:'E1-6',para:'51',label:'Total Scope 3 GHG emissions',unit:'tCO2e',type:'decimal',period:'duration',value:84200,status:'tagged'},
  {id:'E1-6_total',concept:'esrs:TotalGHGEmissions',esrs:'E1',dr:'E1-6',para:'44',label:'Total GHG emissions (S1+S2+S3)',unit:'tCO2e',type:'decimal',period:'duration',value:104970,status:'tagged'},
  {id:'E1-5_nren_energy',concept:'esrs:NonRenewableEnergyConsumption',esrs:'E1',dr:'E1-5',para:'37(a)',label:'Non-renewable energy consumption',unit:'MWh',type:'decimal',period:'duration',value:45200,status:'tagged'},
  {id:'E1-5_ren_energy',concept:'esrs:RenewableEnergyConsumption',esrs:'E1',dr:'E1-5',para:'37(b)',label:'Renewable energy consumption',unit:'MWh',type:'decimal',period:'duration',value:18900,status:'tagged'},
  {id:'E1-4_nz_target',concept:'esrs:NetZeroTargetYear',esrs:'E1',dr:'E1-4',para:'34(a)',label:'Net-zero target year',unit:'yr',type:'integer',period:'instant',value:2050,status:'tagged'},
  {id:'E1-4_interim_target',concept:'esrs:InterimGHGReductionTarget',esrs:'E1',dr:'E1-4',para:'34(c)',label:'Interim GHG reduction target (%)',unit:'%',type:'decimal',period:'instant',value:50,status:'review'},
  {id:'E3-1_water_consump',concept:'esrs:TotalWaterConsumption',esrs:'E3',dr:'E3-1',para:'28(a)',label:'Total water consumption',unit:'m³',type:'decimal',period:'duration',value:125000,status:'review'},
  {id:'G1-4_bribery',concept:'esrs:NumberOfConvictionsForBribery',esrs:'G1',dr:'G1-4',para:'26(a)',label:'Convictions for bribery/corruption',unit:'#',type:'integer',period:'duration',value:0,status:'tagged'},
  {id:'G1-6_payment',concept:'esrs:AveragePaymentPeriod',esrs:'G1',dr:'G1-6',para:'36',label:'Average payment period (days)',unit:'days',type:'decimal',period:'duration',value:42,status:'tagged'},
  {id:'S1-7_emp_total',concept:'esrs:TotalEmployees',esrs:'S1',dr:'S1-7',para:'50(a)',label:'Total number of employees',unit:'#',type:'integer',period:'instant',value:8420,status:'tagged'},
  {id:'S1-7_female_pct',concept:'esrs:PercentageOfFemaleEmployees',esrs:'S1',dr:'S1-7',para:'50(d)',label:'% female employees',unit:'%',type:'decimal',period:'instant',value:42.3,status:'tagged'},
  {id:'S1-16_pay_gap',concept:'esrs:UnadjustedGenderPayGap',esrs:'S1',dr:'S1-16',para:'97(a)',label:'Unadjusted gender pay gap (%)',unit:'%',type:'decimal',period:'duration',value:12.1,status:'gap'},
  {id:'E2-4_hazardous',concept:'esrs:TotalHazardousWaste',esrs:'E2',dr:'E2-4',para:'28(c)',label:'Total hazardous waste (tonnes)',unit:'t',type:'decimal',period:'duration',value:38.5,status:'gap'},
  {id:'E1-3_capex_aligned',concept:'esrs:CapExInClimateRelatedActions',esrs:'E1',dr:'E1-3',para:'29(b)',label:'CapEx in climate-related actions (€)',unit:'EUR',type:'monetary',period:'duration',value:12500000,status:'review'},
  {id:'E4-5_biodiversity',concept:'esrs:OperationsSitesInBiodiversitySensitiveAreas',esrs:'E4',dr:'E4-5',para:'50(a)',label:'Sites in biodiversity-sensitive areas',unit:'#',type:'integer',period:'instant',value:3,status:'gap'},
];

const VALIDATION_RULES=[
  {rule:'ESEF-001',desc:'All monetary values must use iso4217:EUR unit',severity:'Error',affected:XBRL_CONCEPTS.filter(c=>c.unit==='EUR').length,passing:true},
  {rule:'ESEF-002',desc:'Decimal values must use xbrli:pure unit for tCO2e/MWh/m³',severity:'Error',affected:XBRL_CONCEPTS.filter(c=>['tCO2e','MWh','m³'].includes(c.unit)).length,passing:true},
  {rule:'ESEF-003',desc:'All mandatory ESRS DPs must be tagged or omitted with justification',severity:'Error',affected:12,passing:false},
  {rule:'ESEF-004',desc:'Period context must match financial reporting period',severity:'Error',affected:XBRL_CONCEPTS.length,passing:true},
  {rule:'ESEF-005',desc:'Entity identifier must use LEI scheme',severity:'Error',affected:1,passing:true},
  {rule:'ESEF-006',desc:'iXBRL transformation rules for inline tagging',severity:'Warning',affected:XBRL_CONCEPTS.length,passing:true},
  {rule:'ESMA-001',desc:'Taxonomy version must be EFRAG ESRS 2024 or later',severity:'Error',affected:1,passing:true},
  {rule:'ESMA-002',desc:'Scope 1+2+3 total must equal sum of components (E1-6)',severity:'Error',affected:1,passing:true},
  {rule:'ESMA-003',desc:'Net-zero target year must be ≥ current reporting year',severity:'Warning',affected:1,passing:true},
  {rule:'ESMA-004',desc:'Female employees % must be between 0-100',severity:'Error',affected:1,passing:true},
  {rule:'ESMA-005',desc:'All S1-7 employee headcount must be non-negative integers',severity:'Error',affected:1,passing:true},
  {rule:'ESMA-006',desc:'Missing mandatory data points without omission justification',severity:'Error',affected:3,passing:false},
  {rule:'WARN-001',desc:'Comparative prior period values recommended for all KPIs',severity:'Warning',affected:8,passing:false},
  {rule:'WARN-002',desc:'ESRS E4 biodiversity indicators — consider sector-specific tagging',severity:'Warning',affected:2,passing:false},
];

const pill=(color,text,sm)=>({display:'inline-block',padding:sm?'1px 7px':'2px 10px',borderRadius:10,fontSize:sm?10:11,fontWeight:600,background:color+'18',color,border:`1px solid ${color}30`});
const statusColor=(s)=>s==='tagged'?T.green:s==='review'?T.amber:T.red;
const statusLabel=(s)=>s==='tagged'?'Tagged':s==='review'?'Under Review':'Gap';
const sevColor=(s)=>s==='Error'?T.red:T.amber;

export default function XbrlExportWizardPage(){
  const [tab,setTab]=useState(0);
  const TABS=['Data Mapping','Taxonomy Browser','Validation Report','Export Preview'];

  return(
    <div style={{fontFamily:T.font,background:T.bg,minHeight:'100vh',padding:24,color:T.text}}>
      <div style={{maxWidth:1440,margin:'0 auto'}}>
        <div style={{marginBottom:24}}>
          <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:6}}>
            <span style={{fontFamily:T.mono,fontSize:11,color:T.gold,fontWeight:700,background:T.navy,padding:'3px 10px',borderRadius:4}}>EP-AZ3</span>
            <span style={{fontFamily:T.mono,fontSize:11,color:T.textMut}}>CSRD iXBRL · EFRAG ESRS XBRL TAXONOMY 2024 · ESEF REG 2019/815 · ESMA FILING RULES</span>
          </div>
          <h1 style={{fontSize:26,fontWeight:700,color:T.navy,margin:0}}>XBRL Export Wizard</h1>
          <p style={{color:T.textSec,fontSize:14,margin:'4px 0 0'}}>iXBRL tagging, EFRAG ESRS taxonomy mapping, ESEF validation & regulatory filing export</p>
        </div>
        <div style={{display:'flex',gap:4,marginBottom:24,background:T.surface,borderRadius:10,padding:4,border:`1px solid ${T.border}`}}>
          {TABS.map((t,i)=>(
            <button key={i} onClick={()=>setTab(i)} style={{flex:1,padding:'10px 16px',borderRadius:8,border:'none',cursor:'pointer',fontSize:13,fontWeight:tab===i?700:500,background:tab===i?T.navy:'transparent',color:tab===i?'#fff':T.textSec,transition:'all 0.2s'}}>
              {t}
            </button>
          ))}
        </div>
        {tab===0&&<DataMapping/>}
        {tab===1&&<TaxonomyBrowser/>}
        {tab===2&&<ValidationReport/>}
        {tab===3&&<ExportPreview/>}
      </div>
    </div>
  );
}

/* ===== TAB 1: DATA MAPPING ===== */
function DataMapping(){
  const [search,setSearch]=useState('');
  const [filterESRS,setFilterESRS]=useState('All');
  const [filterStatus,setFilterStatus]=useState('All');

  const filtered=useMemo(()=>XBRL_CONCEPTS.filter(c=>{
    if(filterESRS!=='All'&&c.esrs!==filterESRS)return false;
    if(filterStatus!=='All'&&c.status!==filterStatus)return false;
    if(search&&!c.label.toLowerCase().includes(search.toLowerCase())&&!c.concept.toLowerCase().includes(search.toLowerCase()))return false;
    return true;
  }),[search,filterESRS,filterStatus]);

  const tagged=XBRL_CONCEPTS.filter(c=>c.status==='tagged').length;
  const review=XBRL_CONCEPTS.filter(c=>c.status==='review').length;
  const gap=XBRL_CONCEPTS.filter(c=>c.status==='gap').length;

  const byEsrs=['E1','E2','E3','E4','G1','S1'].map(e=>({esrs:e,count:XBRL_CONCEPTS.filter(c=>c.esrs===e).length,tagged:XBRL_CONCEPTS.filter(c=>c.esrs===e&&c.status==='tagged').length}));

  return(
    <div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:16,marginBottom:24}}>
        {[
          {label:'Total Data Points',value:XBRL_CONCEPTS.length,sub:'Mapped to EFRAG taxonomy'},
          {label:'Tagged',value:tagged,sub:'iXBRL tag applied',color:T.green},
          {label:'Under Review',value:review,sub:'Value pending confirmation',color:T.amber},
          {label:'Gaps',value:gap,sub:'No data available',color:T.red},
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
              {['E1','E2','E3','E4','G1','S1'].map(e=><option key={e}>{e}</option>)}
            </select>
            <select value={filterStatus} onChange={e=>setFilterStatus(e.target.value)} style={{padding:'7px 10px',borderRadius:8,border:`1px solid ${T.border}`,fontSize:12,fontFamily:T.font}}>
              <option value="All">All Statuses</option>
              {['tagged','review','gap'].map(s=><option key={s}>{s}</option>)}
            </select>
            <span style={{marginLeft:'auto',fontSize:11,color:T.textMut,fontFamily:T.mono}}>{filtered.length}/{XBRL_CONCEPTS.length}</span>
          </div>
          <table style={{width:'100%',borderCollapse:'collapse',fontSize:11}}>
            <thead>
              <tr style={{borderBottom:`2px solid ${T.border}`}}>
                {['ESRS','DR Ref','XBRL Concept','Label','Unit','Type','Value','Status'].map(h=>(
                  <th key={h} style={{padding:'7px 10px',textAlign:'left',fontSize:10,fontWeight:700,color:T.textMut,textTransform:'uppercase',letterSpacing:0.4}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((c,i)=>(
                <tr key={c.id} style={{borderBottom:`1px solid ${T.borderL}`}}>
                  <td style={{padding:'8px 10px',fontFamily:T.mono,fontWeight:700,color:T.navy,fontSize:11}}>{c.esrs}</td>
                  <td style={{padding:'8px 10px',fontFamily:T.mono,fontSize:10,color:T.gold}}>{c.dr}</td>
                  <td style={{padding:'8px 10px',fontFamily:T.mono,fontSize:10,color:T.textSec,maxWidth:200,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{c.concept}</td>
                  <td style={{padding:'8px 10px',fontSize:12,color:T.text}}>{c.label}</td>
                  <td style={{padding:'8px 10px',fontFamily:T.mono,fontSize:10,color:T.textMut}}>{c.unit}</td>
                  <td style={{padding:'8px 10px',fontFamily:T.mono,fontSize:10,color:T.textMut}}>{c.type}</td>
                  <td style={{padding:'8px 10px',fontFamily:T.mono,fontWeight:700,color:T.navy,fontSize:12}}>{typeof c.value==='number'?c.value.toLocaleString():c.value}</td>
                  <td style={{padding:'8px 10px'}}><span style={pill(statusColor(c.status),statusLabel(c.status),true)}>{statusLabel(c.status)}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
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
              <Bar dataKey="tagged" name="Tagged" fill={T.green} radius={[0,4,4,0]}/>
              <Bar dataKey="count" name="Total" fill={T.borderL} radius={[0,4,4,0]}/>
            </BarChart>
          </ResponsiveContainer>
          <div style={{marginTop:16}}>
            <div style={{fontSize:11,fontWeight:700,color:T.textMut,marginBottom:8}}>TAGGING PROGRESS</div>
            <div style={{height:8,background:T.borderL,borderRadius:4,overflow:'hidden',marginBottom:6}}>
              <div style={{width:(tagged/XBRL_CONCEPTS.length*100)+'%',height:'100%',background:T.green,borderRadius:4}}/>
            </div>
            <div style={{display:'flex',justifyContent:'space-between',fontSize:11,fontFamily:T.mono}}>
              <span style={{color:T.green}}>{tagged} tagged</span>
              <span style={{color:T.navy,fontWeight:700}}>{Math.round(tagged/XBRL_CONCEPTS.length*100)}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ===== TAB 2: TAXONOMY BROWSER ===== */
function TaxonomyBrowser(){
  const [selEsrs,setSelEsrs]=useState('E1');

  const namespaces=[
    {prefix:'esrs',uri:'https://xbrl.efrag.org/taxonomy/esrs/2024',desc:'EFRAG ESRS XBRL Taxonomy 2024'},
    {prefix:'xbrli',uri:'http://www.xbrl.org/2003/instance',desc:'XBRL Instance Document'},
    {prefix:'iso4217',uri:'http://www.xbrl.org/2003/iso4217',desc:'ISO 4217 Currency Codes'},
    {prefix:'link',uri:'http://www.xbrl.org/2003/linkbase',desc:'XBRL Linkbase'},
    {prefix:'xlink',uri:'http://www.w3.org/1999/xlink',desc:'XLink Specification'},
    {prefix:'esef',uri:'http://www.esma.europa.eu/xbrl/esef/role',desc:'ESMA ESEF Filing Roles'},
    {prefix:'ifrs-full',uri:'https://xbrl.ifrs.org/taxonomy/2024-01-01/ifrs-full',desc:'IFRS Full Taxonomy'},
  ];

  const esrsConcepts=XBRL_CONCEPTS.filter(c=>c.esrs===selEsrs);
  const allEsrs=['E1','E2','E3','E4','G1','S1'];

  const dataTypes=[
    {type:'decimalItemType',desc:'Numeric decimal — GHG tCO2e, energy MWh, percentages',count:XBRL_CONCEPTS.filter(c=>c.type==='decimal').length},
    {type:'integerItemType',desc:'Non-negative integer — headcounts, incident counts',count:XBRL_CONCEPTS.filter(c=>c.type==='integer').length},
    {type:'monetaryItemType',desc:'Currency amount — CapEx, OpEx in EUR',count:XBRL_CONCEPTS.filter(c=>c.type==='monetary').length},
    {type:'stringItemType',desc:'Text — policies, descriptions (not machine-readable)',count:0},
  ];

  return(
    <div>
      <div style={{display:'grid',gridTemplateColumns:'280px 1fr',gap:20,marginBottom:20}}>
        <div>
          <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:12,padding:20,marginBottom:16}}>
            <div style={{fontSize:12,fontWeight:700,color:T.textMut,marginBottom:10}}>ESRS STANDARD</div>
            {allEsrs.map(e=>(
              <div key={e} onClick={()=>setSelEsrs(e)} style={{padding:'9px 12px',borderRadius:8,cursor:'pointer',background:selEsrs===e?T.navy:'transparent',marginBottom:3,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <span style={{fontFamily:T.mono,fontWeight:700,color:selEsrs===e?T.gold:T.navy,fontSize:13}}>{e}</span>
                <span style={{fontSize:11,color:selEsrs===e?'#fff':T.textMut}}>{XBRL_CONCEPTS.filter(c=>c.esrs===e).length} concepts</span>
              </div>
            ))}
          </div>
          <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:12,padding:20}}>
            <div style={{fontSize:12,fontWeight:700,color:T.textMut,marginBottom:12}}>XBRL DATA TYPES</div>
            {dataTypes.map((dt,i)=>(
              <div key={i} style={{marginBottom:12,padding:'10px 12px',background:T.surfaceH,borderRadius:8,border:`1px solid ${T.borderL}`}}>
                <div style={{fontFamily:T.mono,fontSize:11,fontWeight:700,color:T.navy,marginBottom:4}}>{dt.type}</div>
                <div style={{fontSize:11,color:T.textSec}}>{dt.desc}</div>
                <div style={{fontSize:10,fontFamily:T.mono,color:T.textMut,marginTop:3}}>{dt.count} concepts</div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:12,padding:20,marginBottom:16}}>
            <div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:4}}>EFRAG ESRS XBRL Taxonomy — {selEsrs} Concepts</div>
            <div style={{fontSize:12,color:T.textSec,marginBottom:16}}>EFRAG ESRS XBRL Taxonomy 2024 · Namespace: https://xbrl.efrag.org/taxonomy/esrs/2024</div>
            <div style={{display:'flex',flexDirection:'column',gap:8}}>
              {esrsConcepts.map((c,i)=>(
                <div key={c.id} style={{background:T.surfaceH,borderRadius:10,padding:'12px 16px',border:`1px solid ${T.borderL}`,fontFamily:T.mono}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:6}}>
                    <div>
                      <span style={{fontSize:10,color:T.teal,marginRight:8}}>esrs:</span>
                      <span style={{fontSize:12,fontWeight:700,color:T.navy}}>{c.concept.replace('esrs:','')}</span>
                    </div>
                    <div style={{display:'flex',gap:6}}>
                      <span style={pill(T.purple,c.type,true)}>{c.type}</span>
                      <span style={pill(c.period==='duration'?T.teal:T.gold,c.period,true)}>{c.period}</span>
                    </div>
                  </div>
                  <div style={{fontFamily:T.font,fontSize:12,color:T.textSec,marginBottom:6}}>{c.label}</div>
                  <div style={{display:'flex',gap:16,fontSize:10,color:T.textMut}}>
                    <span>DR: <strong style={{color:T.gold}}>{c.dr}</strong></span>
                    <span>Para: <strong style={{color:T.navy}}>§{c.para}</strong></span>
                    <span>Unit: <strong style={{color:T.navy}}>{c.unit}</strong></span>
                    <span>Value: <strong style={{color:T.navy,fontSize:11}}>{typeof c.value==='number'?c.value.toLocaleString():c.value}</strong></span>
                    <span style={{marginLeft:'auto'}}><span style={pill(statusColor(c.status),statusLabel(c.status),true)}>{statusLabel(c.status)}</span></span>
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

/* ===== TAB 3: VALIDATION REPORT ===== */
function ValidationReport(){
  const [filterSev,setFilterSev]=useState('All');

  const errors=VALIDATION_RULES.filter(r=>!r.passing&&r.severity==='Error').length;
  const warnings=VALIDATION_RULES.filter(r=>!r.passing&&r.severity==='Warning').length;
  const passing=VALIDATION_RULES.filter(r=>r.passing).length;
  const readyToFile=errors===0;

  const filtered=filterSev==='All'?VALIDATION_RULES:filterSev==='Error'?VALIDATION_RULES.filter(r=>r.severity==='Error'):VALIDATION_RULES.filter(r=>r.severity==='Warning');

  const pieData=[
    {name:'Passing',value:passing,color:T.green},
    {name:'Errors',value:errors,color:T.red},
    {name:'Warnings',value:warnings,color:T.amber},
  ];

  return(
    <div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:16,marginBottom:24}}>
        {[
          {label:'Total Rules Checked',value:VALIDATION_RULES.length,sub:'ESEF + ESMA + EFRAG'},
          {label:'Errors',value:errors,sub:'Must fix before filing',color:T.red},
          {label:'Warnings',value:warnings,sub:'Review recommended',color:T.amber},
          {label:'Filing Ready',value:readyToFile?'YES':'NO',sub:readyToFile?'All errors resolved':'Fix errors first',color:readyToFile?T.green:T.red},
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
            <div style={{fontWeight:700,color:T.red,fontSize:14}}>Filing Blocked — {errors} Critical Error{errors>1?'s':''}</div>
            <div style={{fontSize:12,color:T.textSec,marginTop:2}}>Resolve all ESEF/ESMA errors before submitting to ESAP or national filing portal. Missing mandatory DPs require either data or documented omission justification (ESRS 1 §31-35).</div>
          </div>
        </div>
      )}

      <div style={{display:'grid',gridTemplateColumns:'1fr 280px',gap:20}}>
        <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:12,padding:20}}>
          <div style={{display:'flex',gap:8,marginBottom:16,alignItems:'center'}}>
            <div style={{fontSize:13,fontWeight:700,color:T.navy}}>Validation Results</div>
            {['All','Error','Warning'].map(s=>(
              <button key={s} onClick={()=>setFilterSev(s)} style={{padding:'5px 12px',borderRadius:6,border:'none',cursor:'pointer',fontSize:11,fontWeight:filterSev===s?700:400,background:filterSev===s?T.navy:'transparent',color:filterSev===s?'#fff':T.textSec}}>
                {s}
              </button>
            ))}
          </div>
          <div style={{display:'flex',flexDirection:'column',gap:8}}>
            {filtered.map((rule,i)=>(
              <div key={rule.rule} style={{padding:'12px 16px',background:rule.passing?T.green+'08':rule.severity==='Error'?T.red+'08':T.amber+'08',borderRadius:10,border:`1px solid ${rule.passing?T.green:sevColor(rule.severity)}20`,display:'flex',gap:12,alignItems:'flex-start'}}>
                <span style={{fontSize:16,color:rule.passing?T.green:sevColor(rule.severity),flexShrink:0,marginTop:1}}>{rule.passing?'✓':'✗'}</span>
                <div style={{flex:1}}>
                  <div style={{display:'flex',gap:8,alignItems:'center',marginBottom:4}}>
                    <span style={{fontFamily:T.mono,fontSize:11,fontWeight:700,color:T.navy}}>{rule.rule}</span>
                    <span style={pill(sevColor(rule.severity),rule.severity,true)}>{rule.severity}</span>
                    <span style={{fontSize:11,color:T.textMut,marginLeft:'auto'}}>{rule.affected} item{rule.affected!==1?'s':''} affected</span>
                  </div>
                  <div style={{fontSize:12,color:T.text}}>{rule.desc}</div>
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
            <div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:12}}>Filing Checklist</div>
            {[
              {item:'iXBRL tagging complete',done:true},
              {item:'EFRAG taxonomy 2024 referenced',done:true},
              {item:'Entity LEI registered (GLEIF)',done:true},
              {item:'Period contexts validated',done:true},
              {item:'Mandatory DPs covered or justified',done:false},
              {item:'Comparative prior period data',done:false},
              {item:'External assurance obtained',done:false},
              {item:'ESAP account registered',done:true},
            ].map((c,i)=>(
              <div key={i} style={{display:'flex',gap:10,alignItems:'center',padding:'7px 10px',background:i%2===0?T.surfaceH:'transparent',borderRadius:6,marginBottom:2}}>
                <span style={{fontSize:14,color:c.done?T.green:T.red}}>{c.done?'✓':'○'}</span>
                <span style={{fontSize:12,color:c.done?T.text:T.textSec}}>{c.item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ===== TAB 4: EXPORT PREVIEW ===== */
function ExportPreview(){
  const [exportFormat,setExportFormat]=useState('ixbrl');
  const [copied,setCopied]=useState(false);

  const entity={name:'Apex Sustainability Corp SE',lei:'LEI-9FGHIJ0KLMNO1234PQ56',period:'2024-01-01/2024-12-31',currency:'EUR'};

  const ixbrlSnippet=`<?xml version="1.0" encoding="UTF-8"?>
<html xmlns="http://www.w3.org/1999/xhtml"
  xmlns:ix="http://www.xbrl.org/2013/inlineXBRL"
  xmlns:esrs="https://xbrl.efrag.org/taxonomy/esrs/2024"
  xmlns:xbrli="http://www.xbrl.org/2003/instance"
  xmlns:iso4217="http://www.xbrl.org/2003/iso4217">
<head>
  <ix:header>
    <ix:hidden>
      <ix:nonNumeric contextRef="ctx_2024" name="esrs:EntityName">
        ${entity.name}
      </ix:nonNumeric>
    </ix:hidden>
    <ix:references>
      <link:schemaRef
        xlink:href="https://xbrl.efrag.org/taxonomy/esrs/2024/esrs-all.xsd"
        xlink:type="simple"/>
    </ix:references>
    <ix:resources>
      <xbrli:context id="ctx_2024">
        <xbrli:entity>
          <xbrli:identifier scheme="http://standards.iso.org/iso/17442">
            ${entity.lei}
          </xbrli:identifier>
        </xbrli:entity>
        <xbrli:period>
          <xbrli:startDate>2024-01-01</xbrli:startDate>
          <xbrli:endDate>2024-12-31</xbrli:endDate>
        </xbrli:period>
      </xbrli:context>
      <xbrli:unit id="tCO2e">
        <xbrli:measure>xbrli:pure</xbrli:measure>
      </xbrli:unit>
    </ix:resources>
  </ix:header>
</head>
<body>
  <!-- E1-6 GHG Emissions -->
  <p>Gross Scope 1 GHG Emissions:
    <ix:nonFraction name="esrs:GrossScope1GHGEmissions"
      contextRef="ctx_2024" unitRef="tCO2e"
      decimals="0" format="ixt:num-dot-decimal">
      12,450
    </ix:nonFraction> tCO2e
  </p>
  <p>Total GHG Emissions:
    <ix:nonFraction name="esrs:TotalGHGEmissions"
      contextRef="ctx_2024" unitRef="tCO2e"
      decimals="0" format="ixt:num-dot-decimal">
      104,970
    </ix:nonFraction> tCO2e
  </p>
  <!-- S1-7 Employees -->
  <p>Total Employees:
    <ix:nonFraction name="esrs:TotalEmployees"
      contextRef="ctx_2024_instant" unitRef="pure"
      decimals="0" format="ixt:num-dot-decimal">
      8,420
    </ix:nonFraction>
  </p>
</body>
</html>`;

  const xbrlInstanceSnippet=`<?xml version="1.0" encoding="UTF-8"?>
<xbrli:xbrl
  xmlns:xbrli="http://www.xbrl.org/2003/instance"
  xmlns:esrs="https://xbrl.efrag.org/taxonomy/esrs/2024"
  xmlns:link="http://www.xbrl.org/2003/linkbase"
  xmlns:iso4217="http://www.xbrl.org/2003/iso4217">

  <link:schemaRef
    xlink:href="https://xbrl.efrag.org/taxonomy/esrs/2024/esrs-all.xsd"
    xlink:type="simple" xmlns:xlink="http://www.w3.org/1999/xlink"/>

  <xbrli:context id="ctx_duration_2024">
    <xbrli:entity>
      <xbrli:identifier scheme="http://standards.iso.org/iso/17442">
        ${entity.lei}
      </xbrli:identifier>
    </xbrli:entity>
    <xbrli:period>
      <xbrli:startDate>2024-01-01</xbrli:startDate>
      <xbrli:endDate>2024-12-31</xbrli:endDate>
    </xbrli:period>
  </xbrli:context>

  <xbrli:unit id="tCO2e">
    <xbrli:measure>xbrli:pure</xbrli:measure>
  </xbrli:unit>

  <!-- E1-6 GHG Emissions -->
  <esrs:GrossScope1GHGEmissions
    contextRef="ctx_duration_2024" unitRef="tCO2e" decimals="0">
    12450
  </esrs:GrossScope1GHGEmissions>

  <esrs:TotalGHGEmissions
    contextRef="ctx_duration_2024" unitRef="tCO2e" decimals="0">
    104970
  </esrs:TotalGHGEmissions>

</xbrli:xbrl>`;

  const snippet=exportFormat==='ixbrl'?ixbrlSnippet:xbrlInstanceSnippet;

  const handleCopy=()=>{setCopied(true);setTimeout(()=>setCopied(false),2000);};

  const exportFiles=[
    {name:`${entity.lei}_ESRS_2024.html`,type:'iXBRL HTML',size:'284 KB',status:'Ready'},
    {name:`${entity.lei}_ESRS_2024.xbrl`,type:'XBRL Instance',size:'48 KB',status:'Ready'},
    {name:`${entity.lei}_ESRS_2024_viewer.html`,type:'Human-readable',size:'1.2 MB',status:'Ready'},
    {name:`validation_report_2024.json`,type:'Validation Log',size:'12 KB',status:'Warning'},
    {name:`taxonomy_extension_2024.xsd`,type:'Extension Schema',size:'8 KB',status:'Ready'},
  ];

  return(
    <div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 320px',gap:20}}>
        <div>
          <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:12,padding:20,marginBottom:16}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
              <div>
                <div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:2}}>Export Preview</div>
                <div style={{fontSize:12,color:T.textSec}}>Entity: {entity.name} · LEI: {entity.lei.slice(0,20)}</div>
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
            <div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:16}}>Export Package</div>
            <div style={{display:'flex',flexDirection:'column',gap:8}}>
              {exportFiles.map((f,i)=>(
                <div key={i} style={{padding:'10px 14px',background:T.surfaceH,borderRadius:8,border:`1px solid ${T.borderL}`}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:3}}>
                    <span style={{fontSize:12,fontWeight:600,color:T.navy,fontFamily:T.mono,fontSize:11}}>{f.name}</span>
                    <span style={pill(f.status==='Ready'?T.green:T.amber,f.status,true)}>{f.status}</span>
                  </div>
                  <div style={{display:'flex',justifyContent:'space-between',fontSize:11,color:T.textMut}}>
                    <span>{f.type}</span>
                    <span style={{fontFamily:T.mono}}>{f.size}</span>
                  </div>
                </div>
              ))}
            </div>
            <button style={{width:'100%',marginTop:16,padding:'12px',borderRadius:8,background:T.navy,color:'#fff',border:'none',cursor:'pointer',fontSize:13,fontWeight:700}}>
              Download Export Package (.zip)
            </button>
          </div>

          <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:12,padding:20}}>
            <div style={{fontSize:13,fontWeight:700,color:T.navy,marginBottom:12}}>Filing Destinations</div>
            {[
              {platform:'ESAP (EU)',url:'esap.europa.eu',status:'Configured',color:T.green},
              {platform:'UK FCA XBRL Portal',url:'fca.org.uk/xbrl',status:'Not Configured',color:T.textMut},
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
