import React,{useState,useMemo,useCallback,useRef,useEffect} from 'react';
import {BarChart,Bar,LineChart,Line,XAxis,YAxis,Tooltip,ResponsiveContainer,PieChart,Pie,Cell,AreaChart,Area} from 'recharts';

const T={bg:'#f6f4f0',surface:'#ffffff',surfaceH:'#f0ede7',border:'#e5e0d8',borderL:'#d5cfc5',navy:'#1b3a5c',navyL:'#2c5a8c',gold:'#c5a96a',goldL:'#d4be8a',sage:'#5a8a6a',sageL:'#7ba67d',teal:'#5a8a6a',text:'#1b3a5c',textSec:'#5c6b7e',textMut:'#9aa3ae',red:'#dc2626',green:'#16a34a',amber:'#d97706',font:"'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"};
const sr=(s)=>{let x=Math.sin(s+1)*10000;return x-Math.floor(x);};

/* ─── DATA SOURCES ─── */
const SOURCES=[
  {id:'eodhd',name:'EODHD Financial Data',type:'REST API',status:'active',fields:42,endpoints:8,lastSync:'2026-03-29T08:15:00Z',rateLimit:{used:1240,max:5000},baseUrl:'https://eodhd.com/api',authType:'API Key',description:'End-of-day historical data, fundamentals, ETFs'},
  {id:'alphavantage',name:'Alpha Vantage',type:'REST API',status:'active',fields:38,endpoints:12,lastSync:'2026-03-29T07:30:00Z',rateLimit:{used:340,max:500},baseUrl:'https://www.alphavantage.co',authType:'API Key',description:'Real-time & historical stock data, forex, crypto'},
  {id:'climatetrace',name:'Climate TRACE',type:'REST API',status:'active',fields:28,endpoints:5,lastSync:'2026-03-28T22:00:00Z',rateLimit:{used:80,max:1000},baseUrl:'https://api.climatetrace.org',authType:'None',description:'Global greenhouse gas emissions inventory'},
  {id:'worldbank',name:'World Bank Open Data',type:'REST API',status:'active',fields:35,endpoints:6,lastSync:'2026-03-29T06:00:00Z',rateLimit:{used:150,max:10000},baseUrl:'https://api.worldbank.org',authType:'None',description:'Global development indicators, climate data'},
  {id:'secedgar',name:'SEC EDGAR',type:'REST API',status:'active',fields:52,endpoints:9,lastSync:'2026-03-29T09:00:00Z',rateLimit:{used:45,max:120},baseUrl:'https://data.sec.gov',authType:'User-Agent',description:'Company filings, XBRL data, financial statements'},
  {id:'ecb',name:'ECB Statistical Data',type:'REST API',status:'warning',fields:24,endpoints:4,lastSync:'2026-03-28T18:00:00Z',rateLimit:{used:890,max:1000},baseUrl:'https://data-api.ecb.europa.eu',authType:'None',description:'European Central Bank statistical warehouse'},
  {id:'unpri',name:'UN PRI Signatory Data',type:'CSV/Bulk',status:'active',fields:31,endpoints:2,lastSync:'2026-03-27T12:00:00Z',rateLimit:{used:5,max:100},baseUrl:'https://www.unpri.org/api',authType:'Bearer Token',description:'PRI signatory scores, commitment data'},
  {id:'cdp',name:'CDP Disclosure System',type:'REST API',status:'inactive',fields:45,endpoints:7,lastSync:'2026-03-20T00:00:00Z',rateLimit:{used:0,max:2000},baseUrl:'https://api.cdp.net',authType:'OAuth2',description:'Corporate environmental disclosure data'},
  {id:'msci',name:'MSCI ESG Ratings',type:'REST API',status:'active',fields:58,endpoints:10,lastSync:'2026-03-29T05:00:00Z',rateLimit:{used:2100,max:3000},baseUrl:'https://api.msci.com/esg',authType:'OAuth2',description:'ESG ratings, controversies, climate data'},
  {id:'bloomberg',name:'Bloomberg B-PIPE',type:'WebSocket',status:'active',fields:120,endpoints:3,lastSync:'2026-03-29T09:30:00Z',rateLimit:{used:45000,max:100000},baseUrl:'wss://bpipe.bloomberg.com',authType:'Certificate',description:'Real-time market data, reference data, analytics'},
];

/* ─── SOURCE FIELDS ─── */
const SOURCE_FIELDS={
  eodhd:[
    {name:'General.Code',type:'string',sample:'AAPL.US'},{name:'General.Name',type:'string',sample:'Apple Inc'},
    {name:'General.Exchange',type:'string',sample:'NASDAQ'},{name:'General.Sector',type:'string',sample:'Technology'},
    {name:'General.Industry',type:'string',sample:'Consumer Electronics'},{name:'General.MarketCapitalization',type:'number',sample:'2840000000000'},
    {name:'General.EBITDA',type:'number',sample:'129187000000'},{name:'General.PERatio',type:'number',sample:'28.45'},
    {name:'General.DividendYield',type:'number',sample:'0.0055'},{name:'General.EarningsShare',type:'number',sample:'6.42'},
    {name:'Highlights.Revenue',type:'number',sample:'394328000000'},{name:'Highlights.GrossProfit',type:'number',sample:'170782000000'},
    {name:'Highlights.OperatingMargin',type:'number',sample:'0.298'},{name:'Highlights.ReturnOnEquity',type:'number',sample:'1.601'},
    {name:'General.IPODate',type:'string',sample:'1980-12-12'},{name:'General.CountryISO',type:'string',sample:'US'},
    {name:'Highlights.BookValue',type:'number',sample:'4.38'},{name:'Highlights.EPS_EstimateCurrentYear',type:'number',sample:'6.70'},
  ],
  alphavantage:[
    {name:'Symbol',type:'string',sample:'MSFT'},{name:'Name',type:'string',sample:'Microsoft Corporation'},
    {name:'Exchange',type:'string',sample:'NASDAQ'},{name:'Sector',type:'string',sample:'TECHNOLOGY'},
    {name:'Industry',type:'string',sample:'SERVICES-PREPACKAGED SOFTWARE'},{name:'MarketCapitalization',type:'number',sample:'3020000000000'},
    {name:'EBITDA',type:'number',sample:'125563000000'},{name:'PERatio',type:'number',sample:'35.2'},
    {name:'DividendYield',type:'number',sample:'0.0072'},{name:'EPS',type:'number',sample:'11.53'},
    {name:'Revenue',type:'number',sample:'227583000000'},{name:'GrossProfit',type:'number',sample:'157045000000'},
    {name:'OperatingMargin',type:'number',sample:'0.425'},{name:'ReturnOnEquity',type:'number',sample:'0.389'},
    {name:'52WeekHigh',type:'number',sample:'468.35'},{name:'52WeekLow',type:'number',sample:'365.20'},
  ],
  climatetrace:[
    {name:'country',type:'string',sample:'USA'},{name:'year',type:'number',sample:'2024'},
    {name:'sector',type:'string',sample:'electricity-generation'},{name:'subsector',type:'string',sample:'coal'},
    {name:'emissions_co2',type:'number',sample:'1450000000'},{name:'emissions_ch4',type:'number',sample:'28500000'},
    {name:'emissions_n2o',type:'number',sample:'4200000'},{name:'total_co2e',type:'number',sample:'1580000000'},
    {name:'data_source',type:'string',sample:'satellite'},{name:'confidence',type:'number',sample:'0.92'},
  ],
  worldbank:[
    {name:'country.id',type:'string',sample:'US'},{name:'country.value',type:'string',sample:'United States'},
    {name:'indicator.id',type:'string',sample:'NY.GDP.MKTP.CD'},{name:'indicator.value',type:'string',sample:'GDP (current US$)'},
    {name:'date',type:'string',sample:'2024'},{name:'value',type:'number',sample:'28780000000000'},
    {name:'unit',type:'string',sample:'USD'},{name:'decimal',type:'number',sample:'0'},
  ],
  secedgar:[
    {name:'cik',type:'string',sample:'0000320193'},{name:'entityName',type:'string',sample:'Apple Inc'},
    {name:'facts.us-gaap.Revenue',type:'number',sample:'394328000000'},{name:'facts.us-gaap.NetIncome',type:'number',sample:'97000000000'},
    {name:'facts.us-gaap.TotalAssets',type:'number',sample:'352583000000'},{name:'facts.us-gaap.TotalLiabilities',type:'number',sample:'290437000000'},
    {name:'facts.us-gaap.StockholdersEquity',type:'number',sample:'62146000000'},{name:'facts.dei.EntityCommonStockSharesOutstanding',type:'number',sample:'15460000000'},
    {name:'filingDate',type:'string',sample:'2025-11-01'},{name:'form',type:'string',sample:'10-K'},
  ],
  ecb:[
    {name:'series_key',type:'string',sample:'EXR.D.USD.EUR.SP00.A'},{name:'obs_value',type:'number',sample:'1.0842'},
    {name:'time_period',type:'string',sample:'2026-03-28'},{name:'title',type:'string',sample:'Euro/US dollar exchange rate'},
    {name:'unit',type:'string',sample:'USD'},{name:'decimals',type:'number',sample:'4'},
  ],
  unpri:[
    {name:'signatory_name',type:'string',sample:'BlackRock'},{name:'signatory_type',type:'string',sample:'Investment Manager'},
    {name:'aum_usd',type:'number',sample:'9500000000000'},{name:'score_strategy',type:'number',sample:'85'},
    {name:'score_governance',type:'number',sample:'92'},{name:'country',type:'string',sample:'US'},
    {name:'signed_date',type:'string',sample:'2008-02-01'},
  ],
  cdp:[
    {name:'organization',type:'string',sample:'Shell plc'},{name:'score_climate',type:'string',sample:'A-'},
    {name:'score_water',type:'string',sample:'B'},{name:'score_forests',type:'string',sample:'B-'},
    {name:'scope1_emissions',type:'number',sample:'68000000'},{name:'scope2_emissions',type:'number',sample:'12000000'},
    {name:'scope3_emissions',type:'number',sample:'1250000000'},{name:'year',type:'number',sample:'2024'},
  ],
  msci:[
    {name:'issuer_name',type:'string',sample:'Apple Inc'},{name:'esg_rating',type:'string',sample:'AA'},
    {name:'esg_score',type:'number',sample:'7.8'},{name:'environment_score',type:'number',sample:'6.9'},
    {name:'social_score',type:'number',sample:'5.4'},{name:'governance_score',type:'number',sample:'8.1'},
    {name:'controversy_flag',type:'boolean',sample:'false'},{name:'industry',type:'string',sample:'Technology Hardware'},
  ],
  bloomberg:[
    {name:'TICKER',type:'string',sample:'AAPL US Equity'},{name:'PX_LAST',type:'number',sample:'245.12'},
    {name:'MARKET_CAP',type:'number',sample:'2840000000000'},{name:'PE_RATIO',type:'number',sample:'28.45'},
    {name:'EQY_DVD_YLD_IND',type:'number',sample:'0.55'},{name:'CUR_MKT_CAP',type:'number',sample:'2840'},
    {name:'BEST_EPS',type:'number',sample:'6.70'},{name:'TOT_DEBT_TO_TOT_EQY',type:'number',sample:'1.81'},
    {name:'WACC',type:'number',sample:'9.2'},{name:'ESG_DISCLOSURE_SCORE',type:'number',sample:'62.4'},
  ],
};

/* ─── TARGET TABLES ─── */
const TARGET_TABLES={
  company_profiles:[
    {name:'ticker',type:'string',required:true},{name:'company_name',type:'string',required:true},
    {name:'exchange',type:'string',required:false},{name:'sector',type:'string',required:false},
    {name:'industry',type:'string',required:false},{name:'market_cap',type:'number',required:false},
    {name:'ebitda',type:'number',required:false},{name:'pe_ratio',type:'number',required:false},
    {name:'dividend_yield',type:'number',required:false},{name:'eps',type:'number',required:false},
    {name:'revenue',type:'number',required:false},{name:'gross_profit',type:'number',required:false},
    {name:'operating_margin',type:'number',required:false},{name:'roe',type:'number',required:false},
    {name:'ipo_date',type:'date',required:false},{name:'country_code',type:'string',required:false},
  ],
  emissions_data:[
    {name:'entity_name',type:'string',required:true},{name:'country_code',type:'string',required:true},
    {name:'year',type:'number',required:true},{name:'sector',type:'string',required:false},
    {name:'scope1_co2e',type:'number',required:false},{name:'scope2_co2e',type:'number',required:false},
    {name:'scope3_co2e',type:'number',required:false},{name:'total_co2e',type:'number',required:false},
    {name:'data_source',type:'string',required:false},{name:'confidence_score',type:'number',required:false},
  ],
  esg_scores:[
    {name:'entity_name',type:'string',required:true},{name:'provider',type:'string',required:true},
    {name:'overall_score',type:'number',required:false},{name:'e_score',type:'number',required:false},
    {name:'s_score',type:'number',required:false},{name:'g_score',type:'number',required:false},
    {name:'rating',type:'string',required:false},{name:'controversy_flag',type:'boolean',required:false},
    {name:'assessment_date',type:'date',required:false},
  ],
  price_data:[
    {name:'ticker',type:'string',required:true},{name:'date',type:'date',required:true},
    {name:'open',type:'number',required:false},{name:'high',type:'number',required:false},
    {name:'low',type:'number',required:false},{name:'close',type:'number',required:true},
    {name:'volume',type:'number',required:false},{name:'adjusted_close',type:'number',required:false},
  ],
  macro_indicators:[
    {name:'country_code',type:'string',required:true},{name:'indicator_code',type:'string',required:true},
    {name:'indicator_name',type:'string',required:false},{name:'year',type:'number',required:true},
    {name:'value',type:'number',required:true},{name:'unit',type:'string',required:false},
  ],
};

/* ─── TEST SCENARIOS ─── */
const TEST_SCENARIOS=[
  {id:'eodhd_fundamentals',source:'eodhd',name:'EODHD Fundamentals',method:'GET',path:'/fundamentals/AAPL.US',params:[{key:'api_token',value:'demo',editable:true},{key:'fmt',value:'json',editable:false}],description:'Company fundamental data'},
  {id:'av_overview',source:'alphavantage',name:'Alpha Vantage Overview',method:'GET',path:'/query',params:[{key:'function',value:'OVERVIEW',editable:false},{key:'symbol',value:'MSFT',editable:true},{key:'apikey',value:'demo',editable:true}],description:'Company overview & financials'},
  {id:'ct_emissions',source:'climatetrace',name:'Climate TRACE Emissions',method:'GET',path:'/v6/country/emissions',params:[{key:'country',value:'USA',editable:true},{key:'year',value:'2024',editable:true}],description:'Country-level emissions data'},
  {id:'wb_gdp',source:'worldbank',name:'World Bank GDP',method:'GET',path:'/v2/country/US/indicator/NY.GDP.MKTP.CD',params:[{key:'format',value:'json',editable:false},{key:'date',value:'2020:2025',editable:true}],description:'GDP indicator data'},
  {id:'sec_apple',source:'secedgar',name:'SEC EDGAR Apple',method:'GET',path:'/api/xbrl/companyfacts/CIK0000320193.json',params:[],description:'Apple Inc XBRL company facts'},
];

/* ─── ENGINE LINEAGE ─── */
const ENGINE_LINEAGE=[
  {engine:'E1 \u2014 Portfolio Analyzer',tables:['company_profiles','price_data'],sources:['eodhd','alphavantage','bloomberg']},
  {engine:'E3 \u2014 Carbon Footprint',tables:['emissions_data','company_profiles'],sources:['climatetrace','cdp','secedgar']},
  {engine:'E5 \u2014 ESG Scorer',tables:['esg_scores','company_profiles'],sources:['msci','unpri','cdp']},
  {engine:'E7 \u2014 Climate Risk',tables:['emissions_data','macro_indicators'],sources:['climatetrace','worldbank','ecb']},
  {engine:'E12 \u2014 Regulatory Compliance',tables:['company_profiles','esg_scores'],sources:['secedgar','msci']},
  {engine:'E18 \u2014 Sovereign Risk',tables:['macro_indicators','emissions_data'],sources:['worldbank','ecb','climatetrace']},
  {engine:'E24 \u2014 SFDR Reporter',tables:['esg_scores','emissions_data','company_profiles'],sources:['msci','cdp','eodhd']},
  {engine:'E31 \u2014 Transition Planner',tables:['emissions_data','company_profiles','esg_scores'],sources:['climatetrace','secedgar','msci']},
];

/* ─── TRANSFORMS ─── */
const TRANSFORM_TYPES=['none','uppercase','lowercase','divide_1e6','divide_1e9','multiply_100','iso_date','boolean','enum_map','unit_convert','concatenate','trim','parse_number','round_2','percentage'];

/* ─── PIPELINE TEMPLATES ─── */
const PIPELINE_TEMPLATES=[
  {id:'eodhd_to_profiles',name:'EODHD Fundamentals \u2192 company_profiles',source:'eodhd',target:'company_profiles',stages:[
    {type:'Extract',config:'Select 16 fields from /fundamentals endpoint'},
    {type:'Transform',config:'MarketCap \u00f7 1e9, PERatio round(2), DividendYield \u00d7 100'},
    {type:'Load',config:'Upsert into company_profiles on ticker'},
    {type:'Validate',config:'Required: ticker, company_name; Range: pe_ratio 0\u2013500'},
  ]},
  {id:'ct_to_emissions',name:'Climate TRACE \u2192 emissions_data',source:'climatetrace',target:'emissions_data',stages:[
    {type:'Extract',config:'Select emissions by country and sector'},
    {type:'Transform',config:'CO2e \u00f7 1e6 (to Mt), confidence round(2)'},
    {type:'Load',config:'Insert into emissions_data partitioned by year'},
    {type:'Validate',config:'Required: entity_name, year; Range: confidence 0\u20131'},
  ]},
  {id:'msci_to_esg',name:'MSCI Ratings \u2192 esg_scores',source:'msci',target:'esg_scores',stages:[
    {type:'Extract',config:'Select issuer, scores, rating, controversy'},
    {type:'Transform',config:'Score normalization 0\u201310, boolean controversy_flag'},
    {type:'Load',config:'Upsert into esg_scores on entity+provider'},
    {type:'Validate',config:'Required: entity_name, provider; Range: scores 0\u201310'},
  ]},
];

/* ─── HELPER FUNCTIONS ─── */
const fmtNum=(n)=>{if(typeof n!=='number')n=Number(n);if(isNaN(n))return String(n);if(n>=1e12)return(n/1e12).toFixed(1)+'T';if(n>=1e9)return(n/1e9).toFixed(1)+'B';if(n>=1e6)return(n/1e6).toFixed(1)+'M';if(n>=1e3)return(n/1e3).toFixed(1)+'K';return n%1===0?String(n):n.toFixed(2);};
const fmtDate=(iso)=>{if(!iso)return'\u2014';const d=new Date(iso);return d.toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'})+' '+d.toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'});};
const timeSince=(iso)=>{const s=Math.floor((new Date()-new Date(iso))/1000);if(s<60)return s+'s ago';if(s<3600)return Math.floor(s/60)+'m ago';if(s<86400)return Math.floor(s/3600)+'h ago';return Math.floor(s/86400)+'d ago';};

const levenshtein=(a,b)=>{const m=a.length,n=b.length;const d=Array.from({length:m+1},(_,i)=>Array.from({length:n+1},(_,j)=>i===0?j:j===0?i:0));for(let i=1;i<=m;i++)for(let j=1;j<=n;j++)d[i][j]=Math.min(d[i-1][j]+1,d[i][j-1]+1,d[i-1][j-1]+(a[i-1]!==b[j-1]?1:0));return d[m][n];};
const similarity=(a,b)=>{const al=a.toLowerCase().replace(/[^a-z0-9]/g,''),bl=b.toLowerCase().replace(/[^a-z0-9]/g,'');const maxLen=Math.max(al.length,bl.length);if(maxLen===0)return 1;return Math.round((1-levenshtein(al,bl)/maxLen)*100);};
const typeCompat=(src,tgt)=>{if(src===tgt)return'valid';if(src==='number'&&tgt==='string')return'valid';if(src==='string'&&tgt==='number')return'warning';if(src==='string'&&tgt==='date')return'warning';if(src==='boolean'&&tgt==='string')return'valid';return'warning';};

const StatusBadge=({status})=>{const colors={active:{bg:T.green+'18',color:T.green,label:'Active'},warning:{bg:T.amber+'18',color:T.amber,label:'Warning'},inactive:{bg:T.red+'18',color:T.red,label:'Inactive'},testing:{bg:T.navyL+'18',color:T.navyL,label:'Testing'}};const c=colors[status]||colors.inactive;return <span style={{padding:'2px 10px',borderRadius:9999,fontSize:11,fontWeight:600,fontFamily:T.mono,background:c.bg,color:c.color}}>{c.label}</span>;};

/* ================================================================== */
/* === MAIN COMPONENT =============================================== */
/* ================================================================== */
export default function DataSourceManagerPage(){
  const[tab,setTab]=useState(0);
  const tabs=['Source Registry','Visual Field Mapper','Live API Tester','Transform Pipeline','Engine Lineage','Sync Monitor'];

  return(
    <div style={{fontFamily:T.font,background:T.bg,minHeight:'100vh',color:T.text}}>
      {/* HEADER */}
      <div style={{background:T.surface,borderBottom:`1px solid ${T.border}`,padding:'18px 28px 0'}}>
        <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:14}}>
          <div style={{width:36,height:36,borderRadius:8,background:`linear-gradient(135deg,${T.navy},${T.navyL})`,display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontSize:16,fontWeight:700}}>DS</div>
          <div>
            <div style={{fontSize:20,fontWeight:700,color:T.navy}}>Data Source Manager</div>
            <div style={{fontSize:12,fontFamily:T.mono,color:T.textMut}}>PLATFORM / DATA-INFRASTRUCTURE / SOURCE-MANAGEMENT</div>
          </div>
          <div style={{marginLeft:'auto',display:'flex',gap:8,alignItems:'center'}}>
            <span style={{fontFamily:T.mono,fontSize:11,color:T.textMut}}>{SOURCES.filter(s=>s.status==='active').length}/{SOURCES.length} sources active</span>
            <span style={{width:8,height:8,borderRadius:4,background:T.green,display:'inline-block'}}/>
          </div>
        </div>
        <div style={{display:'flex',gap:0,borderBottom:`2px solid ${T.border}`}}>
          {tabs.map((t,i)=>(
            <button key={i} onClick={()=>setTab(i)} style={{padding:'10px 20px',fontSize:13,fontWeight:tab===i?700:500,color:tab===i?T.navy:T.textSec,background:'none',border:'none',borderBottom:tab===i?`2px solid ${T.gold}`:'2px solid transparent',marginBottom:-2,cursor:'pointer',fontFamily:T.font,transition:'all 0.15s'}}>{t}</button>
          ))}
        </div>
      </div>
      {/* BODY */}
      <div style={{padding:'20px 28px'}}>
        {tab===0&&<SourceRegistryTab/>}
        {tab===1&&<VisualFieldMapperTab/>}
        {tab===2&&<LiveApiTesterTab/>}
        {tab===3&&<TransformPipelineTab/>}
        {tab===4&&<EngineLineageTab/>}
        {tab===5&&<SyncMonitorTab/>}
      </div>
    </div>
  );
}

/* ================================================================== */
/* === TAB 1: SOURCE REGISTRY ====================================== */
/* ================================================================== */
function SourceRegistryTab(){
  const[testingId,setTestingId]=useState(null);
  const[testResults,setTestResults]=useState({});
  const[showAddWizard,setShowAddWizard]=useState(false);
  const[wizardStep,setWizardStep]=useState(0);
  const[wizardData,setWizardData]=useState({name:'',type:'REST API',baseUrl:'',authType:'API Key'});
  const[expandedLogs,setExpandedLogs]=useState(null);

  const handleTest=useCallback((id)=>{
    setTestingId(id);
    setTestResults(p=>({...p,[id]:{status:'testing',message:'Connecting...'}}));
    setTimeout(()=>{
      setTestResults(p=>({...p,[id]:{status:'testing',message:'Authenticating...'}}));
    },700);
    setTimeout(()=>{
      setTestResults(p=>({...p,[id]:{status:'testing',message:'Fetching sample...'}}));
    },1400);
    setTimeout(()=>{
      const ok=sr(SOURCES.findIndex(s=>s.id===id)*7+3)>0.15;
      setTestResults(p=>({...p,[id]:{status:ok?'success':'error',message:ok?'Connection successful \u2014 42ms response, 3 sample records retrieved':'Connection timeout \u2014 check API key and endpoint URL'}}));
      setTestingId(null);
    },2200);
  },[]);

  const generateLogEntries=useCallback((sourceId)=>{
    const base=SOURCES.findIndex(s=>s.id===sourceId)*13;
    return Array.from({length:8},(_,i)=>{
      const severity=sr(base+i*7)>0.7?'ERROR':sr(base+i*7)>0.3?'WARN':'INFO';
      const msgs=['Sync completed successfully','Rate limit approaching threshold','Field schema changed \u2014 2 new fields detected','Authentication token refreshed','Retry attempt 2/3 for batch 14','Response timeout \u2014 falling back to cache','Data validation: 3 records skipped (null required fields)','Incremental sync: 847 new records'];
      return{time:`2026-03-${29-i<10?'0'+(29-i):(29-i)}T${String(8+i).padStart(2,'0')}:${String(Math.floor(sr(base+i*3)*60)).padStart(2,'0')}:00Z`,severity,message:msgs[i%msgs.length]};
    });
  },[]);

  return(
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
        <div style={{fontSize:14,fontWeight:600}}>Registered Data Sources ({SOURCES.length})</div>
        <button onClick={()=>{setShowAddWizard(true);setWizardStep(0);}} style={{padding:'8px 18px',background:`linear-gradient(135deg,${T.navy},${T.navyL})`,color:'#fff',border:'none',borderRadius:6,fontSize:12,fontWeight:600,cursor:'pointer',fontFamily:T.font}}>+ Add New Source</button>
      </div>

      {/* ADD WIZARD MODAL */}
      {showAddWizard&&(
        <div style={{position:'fixed',top:0,left:0,right:0,bottom:0,background:'rgba(0,0,0,0.4)',zIndex:1000,display:'flex',alignItems:'center',justifyContent:'center'}}>
          <div style={{background:T.surface,borderRadius:12,padding:28,width:520,boxShadow:'0 20px 60px rgba(0,0,0,0.2)'}}>
            <div style={{display:'flex',justifyContent:'space-between',marginBottom:20}}>
              <div style={{fontSize:16,fontWeight:700}}>Add New Data Source</div>
              <button onClick={()=>setShowAddWizard(false)} style={{background:'none',border:'none',fontSize:18,cursor:'pointer',color:T.textMut}}>\u00d7</button>
            </div>
            <div style={{display:'flex',gap:8,marginBottom:20}}>
              {['Details','Authentication','Fields','Confirm'].map((s,i)=>(
                <div key={i} style={{flex:1,height:4,borderRadius:2,background:i<=wizardStep?T.gold:T.border}}/>
              ))}
            </div>
            {wizardStep===0&&(
              <div style={{display:'flex',flexDirection:'column',gap:12}}>
                <label style={{fontSize:12,fontWeight:600}}>Source Name
                  <input value={wizardData.name} onChange={e=>setWizardData(p=>({...p,name:e.target.value}))} placeholder="e.g., Refinitiv ESG" style={{width:'100%',padding:'8px 12px',border:`1px solid ${T.border}`,borderRadius:6,marginTop:4,fontFamily:T.font,fontSize:13,boxSizing:'border-box'}}/>
                </label>
                <label style={{fontSize:12,fontWeight:600}}>Type
                  <select value={wizardData.type} onChange={e=>setWizardData(p=>({...p,type:e.target.value}))} style={{width:'100%',padding:'8px 12px',border:`1px solid ${T.border}`,borderRadius:6,marginTop:4,fontFamily:T.font,fontSize:13}}>
                    <option>REST API</option><option>WebSocket</option><option>CSV/Bulk</option><option>GraphQL</option><option>SFTP</option>
                  </select>
                </label>
                <label style={{fontSize:12,fontWeight:600}}>Base URL
                  <input value={wizardData.baseUrl} onChange={e=>setWizardData(p=>({...p,baseUrl:e.target.value}))} placeholder="https://api.example.com" style={{width:'100%',padding:'8px 12px',border:`1px solid ${T.border}`,borderRadius:6,marginTop:4,fontFamily:T.font,fontSize:13,boxSizing:'border-box'}}/>
                </label>
              </div>
            )}
            {wizardStep===1&&(
              <div style={{display:'flex',flexDirection:'column',gap:12}}>
                <label style={{fontSize:12,fontWeight:600}}>Auth Type
                  <select value={wizardData.authType} onChange={e=>setWizardData(p=>({...p,authType:e.target.value}))} style={{width:'100%',padding:'8px 12px',border:`1px solid ${T.border}`,borderRadius:6,marginTop:4,fontFamily:T.font,fontSize:13}}>
                    <option>API Key</option><option>Bearer Token</option><option>OAuth2</option><option>Certificate</option><option>None</option>
                  </select>
                </label>
                <label style={{fontSize:12,fontWeight:600}}>API Key / Token
                  <input type="password" placeholder="sk-..." style={{width:'100%',padding:'8px 12px',border:`1px solid ${T.border}`,borderRadius:6,marginTop:4,fontFamily:T.mono,fontSize:12,boxSizing:'border-box'}}/>
                </label>
              </div>
            )}
            {wizardStep===2&&(
              <div style={{fontSize:13,color:T.textSec,lineHeight:1.6}}>
                <p style={{margin:'0 0 12px'}}>After saving, the system will auto-detect available fields by making a sample API call. You can also manually define fields in the Visual Field Mapper tab.</p>
                <div style={{background:T.surfaceH,borderRadius:8,padding:12}}>
                  <div style={{fontFamily:T.mono,fontSize:11,color:T.textMut}}>Estimated fields: 15\u201325 (based on typical {wizardData.type} source)</div>
                </div>
              </div>
            )}
            {wizardStep===3&&(
              <div style={{fontSize:13,color:T.textSec,lineHeight:1.6}}>
                <div style={{background:T.surfaceH,borderRadius:8,padding:16}}>
                  <div style={{fontSize:12,fontWeight:600,marginBottom:8}}>Configuration Summary</div>
                  <div style={{fontFamily:T.mono,fontSize:11}}><strong>Name:</strong> {wizardData.name||'(unnamed)'}</div>
                  <div style={{fontFamily:T.mono,fontSize:11}}><strong>Type:</strong> {wizardData.type}</div>
                  <div style={{fontFamily:T.mono,fontSize:11}}><strong>URL:</strong> {wizardData.baseUrl||'(not set)'}</div>
                  <div style={{fontFamily:T.mono,fontSize:11}}><strong>Auth:</strong> {wizardData.authType}</div>
                </div>
              </div>
            )}
            <div style={{display:'flex',justifyContent:'flex-end',gap:8,marginTop:20}}>
              {wizardStep>0&&<button onClick={()=>setWizardStep(p=>p-1)} style={{padding:'8px 16px',background:T.surfaceH,border:`1px solid ${T.border}`,borderRadius:6,fontSize:12,cursor:'pointer',fontFamily:T.font}}>Back</button>}
              {wizardStep<3?<button onClick={()=>setWizardStep(p=>p+1)} style={{padding:'8px 16px',background:T.navy,color:'#fff',border:'none',borderRadius:6,fontSize:12,fontWeight:600,cursor:'pointer',fontFamily:T.font}}>Next</button>
              :<button onClick={()=>setShowAddWizard(false)} style={{padding:'8px 16px',background:T.green,color:'#fff',border:'none',borderRadius:6,fontSize:12,fontWeight:600,cursor:'pointer',fontFamily:T.font}}>Save Source</button>}
            </div>
          </div>
        </div>
      )}

      {/* SOURCE CARDS */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(460px,1fr))',gap:14}}>
        {SOURCES.map((src)=>(
          <div key={src.id} style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:16,transition:'box-shadow 0.15s'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:10}}>
              <div>
                <div style={{fontSize:14,fontWeight:700}}>{src.name}</div>
                <div style={{fontSize:11,fontFamily:T.mono,color:T.textMut,marginTop:2}}>{src.type} \u00b7 {src.authType} \u00b7 {src.baseUrl}</div>
              </div>
              <StatusBadge status={src.status}/>
            </div>
            <div style={{fontSize:11,color:T.textSec,marginBottom:10}}>{src.description}</div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:8,marginBottom:10}}>
              <div style={{background:T.surfaceH,borderRadius:6,padding:'6px 8px',textAlign:'center'}}>
                <div style={{fontSize:16,fontWeight:700,color:T.navy}}>{src.fields}</div>
                <div style={{fontSize:10,color:T.textMut}}>Fields</div>
              </div>
              <div style={{background:T.surfaceH,borderRadius:6,padding:'6px 8px',textAlign:'center'}}>
                <div style={{fontSize:16,fontWeight:700,color:T.navy}}>{src.endpoints}</div>
                <div style={{fontSize:10,color:T.textMut}}>Endpoints</div>
              </div>
              <div style={{background:T.surfaceH,borderRadius:6,padding:'6px 8px',textAlign:'center'}}>
                <div style={{fontSize:16,fontWeight:700,color:T.navyL}}>{timeSince(src.lastSync)}</div>
                <div style={{fontSize:10,color:T.textMut}}>Last Sync</div>
              </div>
              <div style={{background:T.surfaceH,borderRadius:6,padding:'6px 8px',textAlign:'center'}}>
                <div style={{fontSize:16,fontWeight:700,color:src.rateLimit.used/src.rateLimit.max>0.8?T.amber:T.green}}>{Math.round(src.rateLimit.used/src.rateLimit.max*100)}%</div>
                <div style={{fontSize:10,color:T.textMut}}>Rate Limit</div>
              </div>
            </div>
            {/* Rate limit bar */}
            <div style={{height:4,background:T.surfaceH,borderRadius:2,marginBottom:10,overflow:'hidden'}}>
              <div style={{height:'100%',width:`${(src.rateLimit.used/src.rateLimit.max)*100}%`,background:src.rateLimit.used/src.rateLimit.max>0.8?T.amber:T.green,borderRadius:2,transition:'width 0.3s'}}/>
            </div>
            <div style={{fontFamily:T.mono,fontSize:10,color:T.textMut,marginBottom:10}}>{fmtNum(src.rateLimit.used)} / {fmtNum(src.rateLimit.max)} requests</div>

            {/* Test result */}
            {testResults[src.id]&&(
              <div style={{padding:'8px 12px',borderRadius:6,marginBottom:10,fontSize:11,fontFamily:T.mono,
                background:testResults[src.id].status==='success'?T.green+'12':testResults[src.id].status==='error'?T.red+'12':T.gold+'12',
                color:testResults[src.id].status==='success'?T.green:testResults[src.id].status==='error'?T.red:T.gold,
                display:'flex',alignItems:'center',gap:6}}>
                {testResults[src.id].status==='testing'&&<span style={{display:'inline-block',width:10,height:10,border:`2px solid ${T.gold}`,borderTopColor:'transparent',borderRadius:'50%',animation:'dsm-spin 0.8s linear infinite'}}/>}
                {testResults[src.id].status==='success'&&<span>\u2713</span>}
                {testResults[src.id].status==='error'&&<span>\u2717</span>}
                {testResults[src.id].message}
              </div>
            )}

            {/* Actions */}
            <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
              {[{label:'Test',color:T.navy,action:()=>handleTest(src.id),disabled:testingId===src.id},{label:'Sync Now',color:T.sage},{label:'Edit Config',color:T.textSec},{label:'View Logs',color:T.textSec,action:()=>setExpandedLogs(expandedLogs===src.id?null:src.id)},{label:src.status==='inactive'?'Enable':'Disable',color:src.status==='inactive'?T.green:T.red}].map((a,i)=>(
                <button key={i} onClick={a.action} disabled={a.disabled} style={{padding:'5px 12px',fontSize:11,fontWeight:600,color:a.color,background:a.color+'10',border:`1px solid ${a.color}30`,borderRadius:5,cursor:a.disabled?'not-allowed':'pointer',fontFamily:T.font,opacity:a.disabled?0.5:1}}>{a.label}</button>
              ))}
            </div>

            {/* Expanded logs */}
            {expandedLogs===src.id&&(
              <div style={{marginTop:10,background:T.navy,borderRadius:6,padding:10,maxHeight:180,overflowY:'auto'}}>
                {generateLogEntries(src.id).map((log,li)=>(
                  <div key={li} style={{fontFamily:T.mono,fontSize:10,color:log.severity==='ERROR'?'#ff6b6b':log.severity==='WARN'?T.goldL:'#a0d0a0',marginBottom:3}}>
                    <span style={{color:'#667'}}>{fmtDate(log.time)}</span>{' '}
                    <span style={{fontWeight:700}}>[{log.severity}]</span>{' '}
                    {log.message}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
      <style>{`@keyframes dsm-spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

/* ================================================================== */
/* === TAB 2: VISUAL FIELD MAPPER ================================== */
/* ================================================================== */
function VisualFieldMapperTab(){
  const[selectedSource,setSelectedSource]=useState('eodhd');
  const[selectedTarget,setSelectedTarget]=useState('company_profiles');
  const[mappings,setMappings]=useState([]);
  const[dragFrom,setDragFrom]=useState(null);
  const[hoveredPort,setHoveredPort]=useState(null);
  const[editingMapping,setEditingMapping]=useState(null);
  const[validationResults,setValidationResults]=useState(null);
  const canvasRef=useRef(null);
  const sourceRefs=useRef({});
  const targetRefs=useRef({});
  const[portPositions,setPortPositions]=useState({src:{},tgt:{}});

  const srcFields=useMemo(()=>SOURCE_FIELDS[selectedSource]||[],[selectedSource]);
  const tgtFields=useMemo(()=>TARGET_TABLES[selectedTarget]||[],[selectedTarget]);

  const mappedSrc=useMemo(()=>new Set(mappings.map(m=>m.sourceField)),[mappings]);
  const mappedTgt=useMemo(()=>new Set(mappings.map(m=>m.targetField)),[mappings]);

  const stats=useMemo(()=>{
    const mapped=mappings.length;
    const unmappedSrc=srcFields.length-mappedSrc.size;
    const unmappedTgt=tgtFields.length-mappedTgt.size;
    const coverage=tgtFields.length>0?Math.round(mappedTgt.size/tgtFields.length*100):0;
    return{mapped,unmappedSrc,unmappedTgt,coverage};
  },[mappings,srcFields,tgtFields,mappedSrc,mappedTgt]);

  const updatePositions=useCallback(()=>{
    if(!canvasRef.current)return;
    const canvasRect=canvasRef.current.getBoundingClientRect();
    const newSrc={},newTgt={};
    Object.entries(sourceRefs.current).forEach(([k,el])=>{
      if(el){const r=el.getBoundingClientRect();newSrc[k]={x:r.right-canvasRect.left,y:r.top+r.height/2-canvasRect.top};}
    });
    Object.entries(targetRefs.current).forEach(([k,el])=>{
      if(el){const r=el.getBoundingClientRect();newTgt[k]={x:r.left-canvasRect.left,y:r.top+r.height/2-canvasRect.top};}
    });
    setPortPositions({src:newSrc,tgt:newTgt});
  },[]);

  useEffect(()=>{
    updatePositions();
    const t=setTimeout(updatePositions,150);
    return()=>clearTimeout(t);
  },[selectedSource,selectedTarget,mappings,updatePositions]);

  const handleSourcePortClick=useCallback((fieldName)=>{
    if(dragFrom===fieldName){setDragFrom(null);return;}
    setDragFrom(fieldName);
  },[dragFrom]);

  const handleTargetPortClick=useCallback((fieldName)=>{
    if(!dragFrom)return;
    const existing=mappings.find(m=>m.targetField===fieldName);
    if(existing){
      setMappings(p=>p.map(m=>m.targetField===fieldName?{...m,sourceField:dragFrom,confidence:100}:m));
    }else{
      setMappings(p=>[...p,{sourceField:dragFrom,targetField:fieldName,transform:'none',confidence:100}]);
    }
    setDragFrom(null);
    setTimeout(updatePositions,50);
  },[dragFrom,mappings,updatePositions]);

  const removeMapping=useCallback((targetField)=>{
    setMappings(p=>p.filter(m=>m.targetField!==targetField));
    setTimeout(updatePositions,50);
  },[updatePositions]);

  const autoMap=useCallback(()=>{
    const newMappings=[];
    tgtFields.forEach(tf=>{
      let bestMatch=null,bestScore=0;
      srcFields.forEach(sf=>{
        const score=similarity(sf.name,tf.name);
        if(score>bestScore){bestScore=score;bestMatch=sf.name;}
      });
      if(bestScore>=40&&bestMatch){
        newMappings.push({sourceField:bestMatch,targetField:tf.name,transform:'none',confidence:bestScore});
      }
    });
    setMappings(newMappings);
    setTimeout(updatePositions,50);
  },[srcFields,tgtFields,updatePositions]);

  const validateMappings=useCallback(()=>{
    const results=[];
    mappings.forEach(m=>{
      const sf=srcFields.find(f=>f.name===m.sourceField);
      const tf=tgtFields.find(f=>f.name===m.targetField);
      if(sf&&tf){
        const compat=typeCompat(sf.type,tf.type);
        results.push({source:m.sourceField,target:m.targetField,status:compat==='valid'?'valid':'warning',message:compat==='valid'?`${sf.type} \u2192 ${tf.type}`:`Type mismatch: ${sf.type} \u2192 ${tf.type} (needs conversion)`});
      }
    });
    tgtFields.filter(tf=>tf.required&&!mappedTgt.has(tf.name)).forEach(tf=>{
      results.push({source:null,target:tf.name,status:'error',message:`Required field "${tf.name}" has no mapping`});
    });
    setValidationResults(results);
  },[mappings,srcFields,tgtFields,mappedTgt]);

  const exportConfig=useCallback(()=>{
    const config={source:selectedSource,target:selectedTarget,mappings:mappings.map(m=>({source_field:m.sourceField,target_column:m.targetField,transform:m.transform,confidence:m.confidence})),created_at:new Date().toISOString()};
    const blob=new Blob([JSON.stringify(config,null,2)],{type:'application/json'});
    const url=URL.createObjectURL(blob);
    const a=document.createElement('a');a.href=url;a.download=`mapping_${selectedSource}_to_${selectedTarget}.json`;a.click();URL.revokeObjectURL(url);
  },[selectedSource,selectedTarget,mappings]);

  return(
    <div>
      {/* Stats bar */}
      <div style={{display:'flex',gap:12,marginBottom:16}}>
        {[{label:'Mapped',value:stats.mapped,color:T.green},{label:'Unmapped Source',value:stats.unmappedSrc,color:T.amber},{label:'Unmapped Target',value:stats.unmappedTgt,color:T.textMut},{label:'Coverage',value:stats.coverage+'%',color:stats.coverage>=80?T.green:stats.coverage>=50?T.amber:T.red}].map((s,i)=>(
          <div key={i} style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:8,padding:'10px 18px',flex:1,textAlign:'center'}}>
            <div style={{fontSize:22,fontWeight:700,color:s.color}}>{s.value}</div>
            <div style={{fontSize:11,color:T.textMut}}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14,flexWrap:'wrap',gap:8}}>
        <div style={{display:'flex',gap:12,alignItems:'center'}}>
          <label style={{fontSize:12,fontWeight:600}}>Source:
            <select value={selectedSource} onChange={e=>{setSelectedSource(e.target.value);setMappings([]);setValidationResults(null);setDragFrom(null);}} style={{marginLeft:6,padding:'6px 10px',border:`1px solid ${T.border}`,borderRadius:6,fontFamily:T.font,fontSize:12}}>
              {SOURCES.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </label>
          <span style={{fontSize:18,color:T.gold,fontWeight:700}}>\u2192</span>
          <label style={{fontSize:12,fontWeight:600}}>Target:
            <select value={selectedTarget} onChange={e=>{setSelectedTarget(e.target.value);setMappings([]);setValidationResults(null);setDragFrom(null);}} style={{marginLeft:6,padding:'6px 10px',border:`1px solid ${T.border}`,borderRadius:6,fontFamily:T.font,fontSize:12}}>
              {Object.keys(TARGET_TABLES).map(t=><option key={t} value={t}>{t}</option>)}
            </select>
          </label>
        </div>
        <div style={{display:'flex',gap:8}}>
          <button onClick={autoMap} style={{padding:'7px 16px',background:`linear-gradient(135deg,${T.gold},${T.goldL})`,color:T.navy,border:'none',borderRadius:6,fontSize:12,fontWeight:700,cursor:'pointer',fontFamily:T.font}}>Auto-Map</button>
          <button onClick={validateMappings} style={{padding:'7px 16px',background:T.navy,color:'#fff',border:'none',borderRadius:6,fontSize:12,fontWeight:600,cursor:'pointer',fontFamily:T.font}}>Validate All</button>
          <button onClick={exportConfig} style={{padding:'7px 16px',background:T.surfaceH,border:`1px solid ${T.border}`,borderRadius:6,fontSize:12,fontWeight:600,cursor:'pointer',fontFamily:T.font,color:T.text}}>Export JSON</button>
          <button onClick={()=>{setMappings([]);setValidationResults(null);}} style={{padding:'7px 16px',background:T.red+'10',border:`1px solid ${T.red}30`,borderRadius:6,fontSize:12,fontWeight:600,cursor:'pointer',fontFamily:T.font,color:T.red}}>Clear All</button>
        </div>
      </div>

      {/* Drag instruction */}
      {dragFrom&&(
        <div style={{background:T.gold+'18',border:`1px solid ${T.gold}40`,borderRadius:8,padding:'8px 14px',marginBottom:12,fontSize:12,color:T.navy,fontWeight:600}}>
          Connecting from: <span style={{fontFamily:T.mono}}>{dragFrom}</span> \u2014 Click a target port to complete the mapping, or click the source port again to cancel.
        </div>
      )}

      {/* Canvas */}
      <div ref={canvasRef} style={{position:'relative',display:'flex',gap:0,background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,overflow:'hidden',minHeight:500}}>
        {/* SVG Connection Lines */}
        <svg style={{position:'absolute',top:0,left:0,width:'100%',height:'100%',pointerEvents:'none',zIndex:5}}>
          {mappings.map((m,mi)=>{
            const sp=portPositions.src[m.sourceField];
            const tp=portPositions.tgt[m.targetField];
            if(!sp||!tp)return null;
            const midX=(sp.x+tp.x)/2;
            const sf=srcFields.find(f=>f.name===m.sourceField);
            const tf=tgtFields.find(f=>f.name===m.targetField);
            const compat=sf&&tf?typeCompat(sf.type,tf.type):'valid';
            const lineColor=compat==='valid'?T.green:T.amber;
            return(
              <g key={mi}>
                <path d={`M${sp.x},${sp.y} C${midX},${sp.y} ${midX},${tp.y} ${tp.x},${tp.y}`} stroke={lineColor} strokeWidth={2} fill="none" strokeDasharray={compat==='warning'?'6,3':'none'} opacity={0.7}/>
                <circle cx={sp.x} cy={sp.y} r={4} fill={lineColor}/>
                <circle cx={tp.x} cy={tp.y} r={4} fill={lineColor}/>
                {m.confidence<100&&(
                  <text x={midX} y={(sp.y+tp.y)/2-6} textAnchor="middle" fontSize={9} fill={T.textMut} fontFamily={T.mono}>{m.confidence}%</text>
                )}
              </g>
            );
          })}
        </svg>

        {/* LEFT: Source Fields */}
        <div style={{flex:1,padding:16,borderRight:`2px dashed ${T.border}`,overflowY:'auto',maxHeight:600}}>
          <div style={{fontSize:13,fontWeight:700,marginBottom:10,color:T.navy}}>Source Fields ({srcFields.length})</div>
          {srcFields.map((f,fi)=>{
            const isMapped=mappedSrc.has(f.name);
            const isActive=dragFrom===f.name;
            return(
              <div key={fi} style={{display:'flex',alignItems:'center',gap:8,marginBottom:6}}>
                <div style={{flex:1,background:isActive?T.gold+'20':isMapped?T.green+'08':T.surfaceH,border:`1px solid ${isActive?T.gold:isMapped?T.green+'40':T.border}`,borderRadius:7,padding:'8px 12px',transition:'all 0.15s'}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                    <div>
                      <div style={{fontSize:12,fontWeight:600,fontFamily:T.mono}}>{f.name}</div>
                      <div style={{fontSize:10,color:T.textMut}}>{f.type} \u00b7 <span style={{color:T.textSec}}>e.g. {String(f.sample).substring(0,25)}</span></div>
                    </div>
                    {isMapped&&<span style={{fontSize:10,color:T.green,fontWeight:600}}>MAPPED</span>}
                  </div>
                </div>
                {/* Source port */}
                <div ref={el=>{sourceRefs.current[f.name]=el;}} onClick={()=>handleSourcePortClick(f.name)} style={{width:18,height:18,borderRadius:9,border:`2px solid ${isActive?T.gold:isMapped?T.green:T.border}`,background:isActive?T.gold:isMapped?T.green:'transparent',cursor:'pointer',transition:'all 0.15s',flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center'}}>
                  {isActive&&<div style={{width:6,height:6,borderRadius:3,background:'#fff'}}/>}
                </div>
              </div>
            );
          })}
        </div>

        {/* RIGHT: Target Fields */}
        <div style={{flex:1,padding:16,overflowY:'auto',maxHeight:600}}>
          <div style={{fontSize:13,fontWeight:700,marginBottom:10,color:T.navy}}>Target Columns ({tgtFields.length})</div>
          {tgtFields.map((f,fi)=>{
            const isMapped=mappedTgt.has(f.name);
            const mapping=mappings.find(m=>m.targetField===f.name);
            const isHovered=hoveredPort===f.name;
            const isDropTarget=dragFrom&&!isMapped;
            return(
              <div key={fi} style={{display:'flex',alignItems:'center',gap:8,marginBottom:6}}>
                {/* Target port */}
                <div ref={el=>{targetRefs.current[f.name]=el;}} onClick={()=>handleTargetPortClick(f.name)}
                  onMouseEnter={()=>setHoveredPort(f.name)} onMouseLeave={()=>setHoveredPort(null)}
                  style={{width:18,height:18,borderRadius:9,border:`2px solid ${isMapped?T.green:isDropTarget?T.gold+'80':T.border}`,background:isMapped?T.green:isHovered&&dragFrom?T.gold:'transparent',cursor:dragFrom?'pointer':'default',transition:'all 0.15s',flexShrink:0,boxShadow:isDropTarget?`0 0 6px ${T.gold}40`:'none'}}>
                </div>
                <div style={{flex:1,background:isMapped?T.green+'08':T.surfaceH,border:`1px solid ${isMapped?T.green+'40':isDropTarget?T.gold+'40':T.border}`,borderRadius:7,padding:'8px 12px',transition:'all 0.15s',position:'relative'}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                    <div>
                      <div style={{fontSize:12,fontWeight:600,fontFamily:T.mono}}>
                        {f.name}{f.required&&<span style={{color:T.red,marginLeft:4}}>*</span>}
                      </div>
                      <div style={{fontSize:10,color:T.textMut}}>{f.type}</div>
                    </div>
                    <div style={{display:'flex',gap:4,alignItems:'center'}}>
                      {mapping&&(
                        <>
                          <button onClick={(e)=>{e.stopPropagation();setEditingMapping(editingMapping===f.name?null:f.name);}} style={{fontSize:9,padding:'2px 6px',background:T.navy+'10',border:`1px solid ${T.navy}20`,borderRadius:4,cursor:'pointer',fontFamily:T.mono,color:T.navy}}>{mapping.transform==='none'?'fx':'fx:'+mapping.transform}</button>
                          <button onClick={(e)=>{e.stopPropagation();removeMapping(f.name);}} style={{fontSize:12,padding:'0 4px',background:'none',border:'none',cursor:'pointer',color:T.red}}>\u00d7</button>
                        </>
                      )}
                    </div>
                  </div>
                  {mapping&&<div style={{fontSize:10,color:T.green,marginTop:2,fontFamily:T.mono}}>\u2190 {mapping.sourceField}</div>}
                  {/* Hover tooltip */}
                  {isHovered&&dragFrom&&!isMapped&&(
                    <div style={{position:'absolute',top:-32,left:20,background:T.navy,color:'#fff',padding:'4px 10px',borderRadius:5,fontSize:10,fontFamily:T.mono,whiteSpace:'nowrap',zIndex:20}}>
                      Will map: {dragFrom} \u2192 {f.name} (type: {f.type})
                    </div>
                  )}
                  {/* Transform editor */}
                  {editingMapping===f.name&&mapping&&(
                    <div style={{marginTop:8,padding:10,background:T.surfaceH,borderRadius:6,border:`1px solid ${T.border}`}}>
                      <div style={{fontSize:11,fontWeight:600,marginBottom:6}}>Transform Configuration</div>
                      <select value={mapping.transform} onChange={e=>{setMappings(p=>p.map(m=>m.targetField===f.name?{...m,transform:e.target.value}:m));}} style={{width:'100%',padding:'6px 8px',border:`1px solid ${T.border}`,borderRadius:4,fontFamily:T.mono,fontSize:11}}>
                        {TRANSFORM_TYPES.map(tt=><option key={tt} value={tt}>{tt}</option>)}
                      </select>
                      <div style={{fontSize:10,color:T.textMut,marginTop:4}}>
                        {mapping.transform==='divide_1e6'&&'Divides value by 1,000,000 (millions)'}
                        {mapping.transform==='divide_1e9'&&'Divides value by 1,000,000,000 (billions)'}
                        {mapping.transform==='multiply_100'&&'Multiplies by 100 (e.g., 0.05 \u2192 5.0%)'}
                        {mapping.transform==='iso_date'&&'Parses string to ISO 8601 date format'}
                        {mapping.transform==='parse_number'&&'Converts string to numeric type'}
                        {mapping.transform==='uppercase'&&'Converts text to UPPERCASE'}
                        {mapping.transform==='round_2'&&'Rounds to 2 decimal places'}
                        {mapping.transform==='none'&&'No transformation \u2014 pass through as-is'}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Validation results */}
      {validationResults&&(
        <div style={{marginTop:16,background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:16}}>
          <div style={{fontSize:13,fontWeight:700,marginBottom:10}}>Validation Results ({validationResults.length} checks)</div>
          <div style={{display:'grid',gap:4}}>
            {validationResults.map((vr,i)=>(
              <div key={i} style={{display:'flex',alignItems:'center',gap:10,padding:'6px 10px',borderRadius:5,background:vr.status==='valid'?T.green+'06':vr.status==='warning'?T.amber+'06':T.red+'06',border:`1px solid ${vr.status==='valid'?T.green+'20':vr.status==='warning'?T.amber+'20':T.red+'20'}`}}>
                <span style={{fontSize:14,fontWeight:700,color:vr.status==='valid'?T.green:vr.status==='warning'?T.amber:T.red}}>{vr.status==='valid'?'\u2713':vr.status==='warning'?'\u26A0':'\u2717'}</span>
                <span style={{fontFamily:T.mono,fontSize:11,color:T.text}}>{vr.source?`${vr.source} \u2192 ${vr.target}`:vr.target}</span>
                <span style={{fontSize:11,color:T.textSec,marginLeft:'auto'}}>{vr.message}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ================================================================== */
/* === TAB 3: LIVE API TESTER ====================================== */
/* ================================================================== */
function LiveApiTesterTab(){
  const[selectedScenario,setSelectedScenario]=useState(TEST_SCENARIOS[0].id);
  const[params,setParams]=useState({});
  const[loading,setLoading]=useState(false);
  const[response,setResponse]=useState(null);
  const[history,setHistory]=useState([]);
  const[showHeaders,setShowHeaders]=useState(false);
  const[collapsedKeys,setCollapsedKeys]=useState(new Set());

  const scenario=useMemo(()=>TEST_SCENARIOS.find(s=>s.id===selectedScenario),[selectedScenario]);
  const currentParams=useMemo(()=>{
    if(params[selectedScenario])return params[selectedScenario];
    return scenario?scenario.params.reduce((acc,p)=>({...acc,[p.key]:p.value}),{}):{};
  },[selectedScenario,scenario,params]);

  const buildUrl=useCallback(()=>{
    if(!scenario)return'';
    const src=SOURCES.find(s=>s.id===scenario.source);
    const paramEntries=Object.entries(currentParams);
    const qs=paramEntries.length>0?paramEntries.map(([k,v])=>`${k}=${encodeURIComponent(v)}`).join('&'):'';
    return `${src?src.baseUrl:''}${scenario.path}${qs?'?'+qs:''}`;
  },[scenario,currentParams]);

  const generateResponse=useCallback((scenarioId)=>{
    const base=scenarioId.split('').reduce((a,c)=>a+c.charCodeAt(0),0);
    const statusCode=sr(base*3)>0.85?500:sr(base*7)>0.9?400:200;
    const responseTime=Math.floor(40+sr(base*11)*350);

    let body={};
    if(scenarioId==='eodhd_fundamentals'){
      body={General:{Code:'AAPL.US',Type:'Common Stock',Name:'Apple Inc',Exchange:'NASDAQ',CurrencyCode:'USD',CurrencyName:'US Dollar',CountryISO:'US',Sector:'Technology',Industry:'Consumer Electronics',MarketCapitalization:2840000000000,EBITDA:129187000000,PERatio:28.45,DividendYield:0.0055,IPODate:'1980-12-12'},Highlights:{Revenue:394328000000,GrossProfit:170782000000,OperatingMargin:0.298,ReturnOnEquity:1.601,EarningsShare:6.42,BookValue:4.38}};
    }else if(scenarioId==='av_overview'){
      body={Symbol:'MSFT',AssetType:'Common Stock',Name:'Microsoft Corporation',Exchange:'NASDAQ',Sector:'TECHNOLOGY',Industry:'SERVICES-PREPACKAGED SOFTWARE',MarketCapitalization:'3020000000000',EBITDA:'125563000000',PERatio:'35.2',DividendYield:'0.0072',EPS:'11.53','52WeekHigh':'468.35','52WeekLow':'365.20',AnalystTargetPrice:'480.00',Revenue:'227583000000'};
    }else if(scenarioId==='ct_emissions'){
      body={data:[{country:'USA',year:2024,sector:'electricity-generation',emissions:{co2:1450000000,ch4:28500000,n2o:4200000},total_co2e:1580000000,confidence:0.92},{country:'USA',year:2024,sector:'transportation',emissions:{co2:1680000000,ch4:5200000,n2o:8100000},total_co2e:1720000000,confidence:0.88}],meta:{source:'Climate TRACE',version:'v6',generated:'2026-03-29'}};
    }else if(scenarioId==='wb_gdp'){
      body=[{page:1,pages:1,per_page:50,total:6},[{indicator:{id:'NY.GDP.MKTP.CD',value:'GDP (current US$)'},country:{id:'US',value:'United States'},date:'2024',value:28780000000000},{indicator:{id:'NY.GDP.MKTP.CD',value:'GDP (current US$)'},country:{id:'US',value:'United States'},date:'2023',value:27360000000000},{indicator:{id:'NY.GDP.MKTP.CD',value:'GDP (current US$)'},country:{id:'US',value:'United States'},date:'2022',value:25460000000000}]];
    }else if(scenarioId==='sec_apple'){
      body={cik:'0000320193',entityName:'Apple Inc',facts:{'us-gaap':{Revenue:{units:{USD:[{end:'2024-09-28',val:394328000000,form:'10-K'},{end:'2023-09-30',val:383285000000,form:'10-K'}]}},NetIncome:{units:{USD:[{end:'2024-09-28',val:97000000000,form:'10-K'}]}},TotalAssets:{units:{USD:[{end:'2024-09-28',val:352583000000,form:'10-K'}]}}}}};
    }

    const headers={'Content-Type':'application/json','X-RateLimit-Remaining':String(Math.floor(sr(base*13)*500)),'X-RateLimit-Limit':'1000','X-Request-Id':'req_'+String(base).padStart(8,'0'),'Cache-Control':'max-age=300'};

    return{statusCode,responseTime,body:statusCode===200?body:{error:{code:statusCode,message:statusCode===400?'Bad Request: Invalid parameter':'Internal Server Error'}},headers,timestamp:new Date().toISOString()};
  },[]);

  const sendRequest=useCallback(()=>{
    setLoading(true);
    setResponse(null);
    const delay=800+sr(selectedScenario.length)*1200;
    setTimeout(()=>{
      const resp=generateResponse(selectedScenario);
      setResponse(resp);
      setHistory(p=>[{id:Date.now(),scenario:scenario?scenario.name:'',url:buildUrl(),statusCode:resp.statusCode,responseTime:resp.responseTime,timestamp:resp.timestamp},...p].slice(0,10));
      setLoading(false);
    },delay);
  },[selectedScenario,scenario,buildUrl,generateResponse]);

  const updateParam=useCallback((key,value)=>{
    setParams(p=>({...p,[selectedScenario]:{...currentParams,[key]:value}}));
  },[selectedScenario,currentParams]);

  const toggleCollapse=useCallback((key)=>{
    setCollapsedKeys(p=>{const n=new Set(p);n.has(key)?n.delete(key):n.add(key);return n;});
  },[]);

  const renderJsonNode=useCallback((obj,depth,parentKey)=>{
    if(obj===null)return <span style={{color:T.textMut}}>null</span>;
    if(typeof obj==='boolean')return <span style={{color:T.sage}}>{String(obj)}</span>;
    if(typeof obj==='number')return <span style={{color:T.navyL}}>{fmtNum(obj)}</span>;
    if(typeof obj==='string')return <span style={{color:T.gold}}>"{obj.length>60?obj.substring(0,60)+'...':obj}"</span>;
    if(Array.isArray(obj)){
      const key=parentKey+'[]';
      const collapsed=collapsedKeys.has(key);
      return(
        <span>
          <span onClick={()=>toggleCollapse(key)} style={{cursor:'pointer',color:T.textMut}}>[{collapsed?`...${obj.length} items`:''}</span>
          {!collapsed&&obj.map((item,i)=>(
            <div key={i} style={{paddingLeft:16}}>{renderJsonNode(item,depth+1,parentKey+'.'+i)}{i<obj.length-1?',':''}</div>
          ))}
          {!collapsed&&<span style={{color:T.textMut}}>]</span>}
          {collapsed&&<span style={{color:T.textMut}}>]</span>}
        </span>
      );
    }
    if(typeof obj==='object'){
      const entries=Object.entries(obj);
      const key=parentKey+'{}';
      const collapsed=collapsedKeys.has(key);
      return(
        <span>
          <span onClick={()=>toggleCollapse(key)} style={{cursor:'pointer',color:T.textMut}}>{'{'}{collapsed?`...${entries.length} keys`:''}</span>
          {!collapsed&&entries.map(([k,v],i)=>(
            <div key={k} style={{paddingLeft:16}}>
              <span style={{color:'#e06c75'}}>"{k}"</span>: {renderJsonNode(v,depth+1,parentKey+'.'+k)}{i<entries.length-1?',':''}
            </div>
          ))}
          {!collapsed&&<span style={{color:T.textMut}}>{'}'}</span>}
          {collapsed&&<span style={{color:T.textMut}}>{'}'}</span>}
        </span>
      );
    }
    return <span>{String(obj)}</span>;
  },[collapsedKeys,toggleCollapse]);

  const extractFields=useCallback(()=>{
    if(!response||response.statusCode!==200)return[];
    const extract=(obj,prefix)=>{
      const fields=[];
      if(typeof obj!=='object'||obj===null)return fields;
      if(Array.isArray(obj)){if(obj.length>0)return extract(obj[0],prefix);}
      else{Object.entries(obj).forEach(([k,v])=>{
        const path=prefix?`${prefix}.${k}`:k;
        if(v===null)fields.push({name:path,type:'null',sample:'null'});
        else if(typeof v==='object'&&!Array.isArray(v))fields.push(...extract(v,path));
        else if(Array.isArray(v))fields.push({name:path,type:'array',sample:`[${v.length} items]`});
        else fields.push({name:path,type:typeof v,sample:String(v).substring(0,30)});
      });}
      return fields;
    };
    return extract(response.body,'');
  },[response]);

  return(
    <div>
      <div style={{display:'flex',gap:16}}>
        {/* Left panel */}
        <div style={{flex:'0 0 340px',display:'flex',flexDirection:'column',gap:12}}>
          {/* Scenario selector */}
          <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:16}}>
            <div style={{fontSize:13,fontWeight:700,marginBottom:10}}>Test Scenario</div>
            <select value={selectedScenario} onChange={e=>{setSelectedScenario(e.target.value);setResponse(null);}} style={{width:'100%',padding:'8px 10px',border:`1px solid ${T.border}`,borderRadius:6,fontFamily:T.font,fontSize:12,marginBottom:10}}>
              {TEST_SCENARIOS.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            {scenario&&(
              <>
                <div style={{fontSize:11,color:T.textSec,marginBottom:8}}>{scenario.description}</div>
                <div style={{fontFamily:T.mono,fontSize:10,color:T.textMut,padding:'6px 8px',background:T.surfaceH,borderRadius:4,wordBreak:'break-all'}}>
                  <span style={{color:T.green,fontWeight:700}}>{scenario.method}</span>{' '}{buildUrl()}
                </div>
              </>
            )}
          </div>

          {/* Parameters */}
          {scenario&&scenario.params.length>0&&(
            <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:16}}>
              <div style={{fontSize:13,fontWeight:700,marginBottom:10}}>Parameters</div>
              {scenario.params.map((p,pi)=>(
                <label key={pi} style={{display:'block',marginBottom:8}}>
                  <div style={{fontSize:11,fontWeight:600,marginBottom:3}}>{p.key}{!p.editable&&<span style={{color:T.textMut,fontWeight:400}}> (fixed)</span>}</div>
                  <input value={currentParams[p.key]||''} onChange={e=>updateParam(p.key,e.target.value)} readOnly={!p.editable} style={{width:'100%',padding:'6px 10px',border:`1px solid ${T.border}`,borderRadius:5,fontFamily:T.mono,fontSize:11,background:p.editable?'#fff':T.surfaceH,boxSizing:'border-box'}}/>
                </label>
              ))}
            </div>
          )}

          {/* Send button */}
          <button onClick={sendRequest} disabled={loading} style={{padding:'12px 20px',background:loading?T.textMut:`linear-gradient(135deg,${T.navy},${T.navyL})`,color:'#fff',border:'none',borderRadius:8,fontSize:13,fontWeight:700,cursor:loading?'not-allowed':'pointer',fontFamily:T.font,display:'flex',alignItems:'center',justifyContent:'center',gap:8}}>
            {loading&&<span style={{display:'inline-block',width:14,height:14,border:'2px solid rgba(255,255,255,0.3)',borderTopColor:'#fff',borderRadius:'50%',animation:'dsm-spin 0.8s linear infinite'}}/>}
            {loading?'Sending...':'Send Request'}
          </button>

          {/* Request History */}
          {history.length>0&&(
            <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:16}}>
              <div style={{fontSize:13,fontWeight:700,marginBottom:10}}>Request History ({history.length})</div>
              {history.map((h,hi)=>(
                <div key={h.id} onClick={()=>{const sc=TEST_SCENARIOS.find(s=>s.name===h.scenario);if(sc)setSelectedScenario(sc.id);}} style={{display:'flex',alignItems:'center',gap:8,padding:'6px 8px',borderRadius:5,cursor:'pointer',marginBottom:3,background:hi===0?T.surfaceH:'transparent'}}>
                  <span style={{fontFamily:T.mono,fontSize:10,fontWeight:700,color:h.statusCode===200?T.green:h.statusCode===400?T.amber:T.red}}>{h.statusCode}</span>
                  <span style={{fontSize:11,flex:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{h.scenario}</span>
                  <span style={{fontFamily:T.mono,fontSize:10,color:T.textMut}}>{h.responseTime}ms</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right panel: Response */}
        <div style={{flex:1,minWidth:0}}>
          {!response&&!loading&&(
            <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:40,textAlign:'center',color:T.textMut}}>
              <div style={{fontSize:36,marginBottom:12,opacity:0.3,fontFamily:T.mono}}>{'{ }'}</div>
              <div style={{fontSize:14,fontWeight:600}}>No Response Yet</div>
              <div style={{fontSize:12,marginTop:4}}>Select a test scenario and click "Send Request" to see the API response</div>
            </div>
          )}

          {loading&&(
            <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:40,textAlign:'center'}}>
              <div style={{width:32,height:32,border:`3px solid ${T.border}`,borderTopColor:T.navy,borderRadius:'50%',animation:'dsm-spin 0.8s linear infinite',margin:'0 auto 12px'}}/>
              <div style={{fontSize:13,color:T.textSec}}>Sending request...</div>
            </div>
          )}

          {response&&!loading&&(
            <div style={{display:'flex',flexDirection:'column',gap:12}}>
              {/* Status bar */}
              <div style={{display:'flex',gap:12,alignItems:'center',background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:'12px 16px',flexWrap:'wrap'}}>
                <span style={{padding:'4px 14px',borderRadius:6,fontFamily:T.mono,fontSize:13,fontWeight:700,background:response.statusCode===200?T.green+'18':response.statusCode===400?T.amber+'18':T.red+'18',color:response.statusCode===200?T.green:response.statusCode===400?T.amber:T.red}}>{response.statusCode} {response.statusCode===200?'OK':response.statusCode===400?'Bad Request':'Server Error'}</span>
                <span style={{fontFamily:T.mono,fontSize:12,color:T.textSec}}>{response.responseTime}ms</span>
                <span style={{fontFamily:T.mono,fontSize:11,color:T.textMut,marginLeft:'auto'}}>{new Date(response.timestamp).toLocaleTimeString()}</span>
                <span style={{fontFamily:T.mono,fontSize:11,color:T.textMut}}>Rate: {response.headers['X-RateLimit-Remaining']}/{response.headers['X-RateLimit-Limit']}</span>
              </div>

              {/* Tab toggle */}
              <div style={{display:'flex',gap:8}}>
                <button onClick={()=>setShowHeaders(false)} style={{padding:'6px 14px',fontSize:12,fontWeight:showHeaders?500:700,background:showHeaders?'transparent':T.surfaceH,border:`1px solid ${showHeaders?'transparent':T.border}`,borderRadius:6,cursor:'pointer',fontFamily:T.font}}>Response Body</button>
                <button onClick={()=>setShowHeaders(true)} style={{padding:'6px 14px',fontSize:12,fontWeight:showHeaders?700:500,background:showHeaders?T.surfaceH:'transparent',border:`1px solid ${showHeaders?T.border:'transparent'}`,borderRadius:6,cursor:'pointer',fontFamily:T.font}}>Headers ({Object.keys(response.headers).length})</button>
              </div>

              {/* Body */}
              {!showHeaders&&(
                <div style={{background:'#1a1a2e',borderRadius:10,padding:16,maxHeight:400,overflowY:'auto'}}>
                  <pre style={{fontFamily:T.mono,fontSize:11,lineHeight:1.6,margin:0,color:'#e0e0e0'}}>
                    {renderJsonNode(response.body,0,'root')}
                  </pre>
                </div>
              )}

              {/* Headers */}
              {showHeaders&&(
                <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:16}}>
                  {Object.entries(response.headers).map(([k,v])=>(
                    <div key={k} style={{display:'flex',gap:12,padding:'4px 0',borderBottom:`1px solid ${T.border}08`,fontFamily:T.mono,fontSize:11}}>
                      <span style={{fontWeight:700,color:T.navy,minWidth:180}}>{k}</span>
                      <span style={{color:T.textSec}}>{v}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Detected fields */}
              {response.statusCode===200&&(
                <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:16}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
                    <div style={{fontSize:13,fontWeight:700}}>Detected Fields ({extractFields().length})</div>
                    <button style={{padding:'6px 14px',background:T.gold+'18',border:`1px solid ${T.gold}40`,borderRadius:6,fontSize:11,fontWeight:600,cursor:'pointer',fontFamily:T.font,color:T.navy}}>Map Response Fields \u2192</button>
                  </div>
                  <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))',gap:6}}>
                    {extractFields().slice(0,12).map((f,fi)=>(
                      <div key={fi} style={{padding:'6px 10px',background:T.surfaceH,borderRadius:5,fontFamily:T.mono,fontSize:10}}>
                        <div style={{fontWeight:600,color:T.navy}}>{f.name}</div>
                        <div style={{color:T.textMut}}>{f.type}: {f.sample}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Sample data preview */}
              {response.statusCode===200&&(
                <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:16}}>
                  <div style={{fontSize:13,fontWeight:700,marginBottom:10}}>Sample Data Preview</div>
                  <div style={{overflowX:'auto'}}>
                    <table style={{width:'100%',borderCollapse:'collapse',fontFamily:T.mono,fontSize:10}}>
                      <thead>
                        <tr>{extractFields().slice(0,6).map((f,i)=><th key={i} style={{padding:'6px 10px',textAlign:'left',borderBottom:`2px solid ${T.border}`,fontWeight:700,color:T.navy,whiteSpace:'nowrap'}}>{f.name.split('.').pop()}</th>)}</tr>
                      </thead>
                      <tbody>
                        {[0,1,2].map(ri=>(
                          <tr key={ri} style={{background:ri%2===0?'transparent':T.surfaceH}}>
                            {extractFields().slice(0,6).map((f,fi)=>{
                              const val=ri===0?f.sample:f.type==='number'?String(Number(Number(f.sample)*(1+sr(ri*fi+3)*0.2-0.1)).toFixed(2)):f.sample;
                              return <td key={fi} style={{padding:'5px 10px',borderBottom:`1px solid ${T.border}30`,color:T.textSec,whiteSpace:'nowrap'}}>{String(val).substring(0,20)}</td>;
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      <style>{`@keyframes dsm-spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

/* ================================================================== */
/* === TAB 4: TRANSFORM PIPELINE =================================== */
/* ================================================================== */
function TransformPipelineTab(){
  const[selectedPipeline,setSelectedPipeline]=useState(PIPELINE_TEMPLATES[0].id);
  const[running,setRunning]=useState(false);
  const[currentStage,setCurrentStage]=useState(-1);
  const[stageResults,setStageResults]=useState({});
  const[expandedStage,setExpandedStage]=useState(null);
  const timersRef=useRef([]);

  const pipeline=useMemo(()=>PIPELINE_TEMPLATES.find(p=>p.id===selectedPipeline),[selectedPipeline]);

  const runPipeline=useCallback(()=>{
    setRunning(true);setCurrentStage(0);setStageResults({});
    timersRef.current.forEach(clearTimeout);
    timersRef.current=[];
    const stages=pipeline?pipeline.stages:[];
    stages.forEach((_s,i)=>{
      const t1=setTimeout(()=>{
        setCurrentStage(i);
        setStageResults(p=>({...p,[i]:{status:'running',records:0}}));
      },i*1200);
      const t2=setTimeout(()=>{
        const records=Math.floor(40+sr(i*7+selectedPipeline.length)*160);
        const errors=Math.floor(sr(i*13)*4);
        setStageResults(p=>({...p,[i]:{status:'complete',records,errors,duration:Math.floor(200+sr(i*11)*800)+'ms'}}));
        if(i===stages.length-1){setRunning(false);setCurrentStage(-1);}
      },i*1200+1000);
      timersRef.current.push(t1,t2);
    });
  },[pipeline,selectedPipeline]);

  useEffect(()=>{return()=>{timersRef.current.forEach(clearTimeout);};},[]);

  const sampleTransformData=useMemo(()=>{
    if(selectedPipeline==='eodhd_to_profiles'){
      return[
        {stage:'Extract',field:'MarketCapitalization',value:'2840000000000'},
        {stage:'Transform (\u00f71e9)',field:'market_cap',value:'2840.0'},
        {stage:'Transform (round)',field:'market_cap',value:'2840.00'},
        {stage:'Load',field:'company_profiles.market_cap',value:'2840.00'},
        {stage:'Validate',field:'market_cap',value:'PASS (number, range OK)'},
      ];
    }
    if(selectedPipeline==='ct_to_emissions'){
      return[
        {stage:'Extract',field:'total_co2e',value:'1580000000'},
        {stage:'Transform (\u00f71e6)',field:'total_co2e_mt',value:'1580.0'},
        {stage:'Transform (round)',field:'total_co2e_mt',value:'1580.00'},
        {stage:'Load',field:'emissions_data.total_co2e',value:'1580.00'},
        {stage:'Validate',field:'total_co2e',value:'PASS (number, range OK)'},
      ];
    }
    return[
      {stage:'Extract',field:'esg_score',value:'7.8'},
      {stage:'Transform (norm)',field:'overall_score',value:'7.80'},
      {stage:'Transform (bool)',field:'controversy_flag',value:'false'},
      {stage:'Load',field:'esg_scores.overall_score',value:'7.80'},
      {stage:'Validate',field:'overall_score',value:'PASS (0\u201310 range)'},
    ];
  },[selectedPipeline]);

  const stageColors={Extract:T.navyL,Transform:T.gold,Load:T.sage,Validate:T.teal};

  return(
    <div>
      {/* Pipeline selector */}
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16,flexWrap:'wrap',gap:8}}>
        <div style={{display:'flex',gap:12,alignItems:'center'}}>
          <div style={{fontSize:14,fontWeight:700}}>Transform Pipeline</div>
          <select value={selectedPipeline} onChange={e=>{setSelectedPipeline(e.target.value);setStageResults({});setCurrentStage(-1);}} style={{padding:'6px 12px',border:`1px solid ${T.border}`,borderRadius:6,fontFamily:T.font,fontSize:12}}>
            {PIPELINE_TEMPLATES.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        <button onClick={runPipeline} disabled={running} style={{padding:'8px 20px',background:running?T.textMut:`linear-gradient(135deg,${T.green},${T.sage})`,color:'#fff',border:'none',borderRadius:6,fontSize:12,fontWeight:700,cursor:running?'not-allowed':'pointer',fontFamily:T.font,display:'flex',alignItems:'center',gap:6}}>
          {running&&<span style={{display:'inline-block',width:12,height:12,border:'2px solid rgba(255,255,255,0.3)',borderTopColor:'#fff',borderRadius:'50%',animation:'dsm-spin 0.8s linear infinite'}}/>}
          {running?'Running...':'Run Pipeline'}
        </button>
      </div>

      {/* Visual pipeline flow */}
      <div style={{display:'flex',alignItems:'flex-start',gap:0,marginBottom:20,overflowX:'auto',paddingBottom:8}}>
        {pipeline&&pipeline.stages.map((stage,si)=>{
          const color=stageColors[stage.type]||T.navy;
          const result=stageResults[si];
          const isActive=currentStage===si;
          return(
            <React.Fragment key={si}>
              {si>0&&(
                <div style={{display:'flex',alignItems:'center',padding:'0 4px',minWidth:40,alignSelf:'center'}}>
                  <div style={{height:2,flex:1,background:result&&result.status==='complete'?T.green:T.border}}/>
                  <div style={{fontSize:16,color:result&&result.status==='complete'?T.green:T.textMut}}>\u2192</div>
                  <div style={{height:2,flex:1,background:result&&result.status==='complete'?T.green:T.border}}/>
                </div>
              )}
              <div onClick={()=>setExpandedStage(expandedStage===si?null:si)} style={{background:T.surface,border:`2px solid ${isActive?color:result&&result.status==='complete'?T.green:T.border}`,borderRadius:10,padding:16,minWidth:180,cursor:'pointer',boxShadow:isActive?`0 0 12px ${color}30`:'none',transition:'all 0.2s'}}>
                <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:8}}>
                  <div style={{width:28,height:28,borderRadius:6,background:color+'18',display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:700,color}}>
                    {si+1}
                  </div>
                  <div style={{fontSize:13,fontWeight:700,color}}>{stage.type}</div>
                  {isActive&&<span style={{display:'inline-block',width:10,height:10,border:`2px solid ${color}`,borderTopColor:'transparent',borderRadius:'50%',animation:'dsm-spin 0.8s linear infinite'}}/>}
                  {result&&result.status==='complete'&&<span style={{color:T.green,fontWeight:700,fontSize:12}}>\u2713</span>}
                </div>
                <div style={{fontSize:11,color:T.textSec,lineHeight:1.4}}>{stage.config}</div>
                {result&&result.status==='complete'&&(
                  <div style={{marginTop:8,padding:'6px 8px',background:T.green+'08',borderRadius:5,fontFamily:T.mono,fontSize:10}}>
                    <div>{result.records} records processed</div>
                    <div style={{color:result.errors>0?T.amber:T.green}}>{result.errors} errors | {result.duration}</div>
                  </div>
                )}
              </div>
            </React.Fragment>
          );
        })}
      </div>

      {/* Data flow preview */}
      <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:16,marginBottom:16}}>
        <div style={{fontSize:13,fontWeight:700,marginBottom:12}}>Data Flow Preview</div>
        <div style={{overflowX:'auto'}}>
          <table style={{width:'100%',borderCollapse:'collapse',fontFamily:T.mono,fontSize:11}}>
            <thead>
              <tr>
                <th style={{padding:'8px 12px',textAlign:'left',borderBottom:`2px solid ${T.border}`,fontWeight:700,color:T.navy}}>Stage</th>
                <th style={{padding:'8px 12px',textAlign:'left',borderBottom:`2px solid ${T.border}`,fontWeight:700,color:T.navy}}>Field</th>
                <th style={{padding:'8px 12px',textAlign:'left',borderBottom:`2px solid ${T.border}`,fontWeight:700,color:T.navy}}>Value</th>
              </tr>
            </thead>
            <tbody>
              {sampleTransformData.map((row,ri)=>{
                const stageKey=row.stage.split(' ')[0];
                const color=stageColors[stageKey]||T.navy;
                return(
                  <tr key={ri} style={{background:ri%2===0?'transparent':T.surfaceH}}>
                    <td style={{padding:'6px 12px',borderBottom:`1px solid ${T.border}15`}}>
                      <span style={{padding:'2px 8px',borderRadius:4,background:color+'15',color,fontSize:10,fontWeight:600}}>{row.stage}</span>
                    </td>
                    <td style={{padding:'6px 12px',borderBottom:`1px solid ${T.border}15`,fontWeight:600}}>{row.field}</td>
                    <td style={{padding:'6px 12px',borderBottom:`1px solid ${T.border}15`,color:T.textSec}}>{row.value}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Expanded stage detail */}
      {expandedStage!==null&&pipeline&&pipeline.stages[expandedStage]&&(
        <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:16}}>
          <div style={{fontSize:13,fontWeight:700,marginBottom:10}}>Stage {expandedStage+1} Detail: {pipeline.stages[expandedStage].type}</div>
          <div style={{fontSize:12,color:T.textSec,lineHeight:1.6}}>{pipeline.stages[expandedStage].config}</div>
          <div style={{marginTop:12,padding:12,background:T.navy,borderRadius:8}}>
            <pre style={{fontFamily:T.mono,fontSize:10,color:'#a0d0a0',margin:0}}>
{`# ${pipeline.stages[expandedStage].type} Stage Config
source: ${pipeline.source}
target: ${pipeline.target}
mode: ${expandedStage===0?'field_selection':expandedStage===1?'transformation_chain':expandedStage===2?'upsert':'validation'}
error_handling: ${expandedStage===3?'skip_invalid':'retry_3x'}
batch_size: 500
timeout_ms: 30000`}
            </pre>
          </div>
        </div>
      )}
      <style>{`@keyframes dsm-spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

/* ================================================================== */
/* === TAB 5: ENGINE LINEAGE ======================================= */
/* ================================================================== */
function EngineLineageTab(){
  const[selectedNode,setSelectedNode]=useState(null);
  const[nodeType,setNodeType]=useState(null);
  const[impactSource,setImpactSource]=useState(null);

  const allSources=useMemo(()=>[...new Set(ENGINE_LINEAGE.flatMap(e=>e.sources))],[]);
  const allTables=useMemo(()=>[...new Set(ENGINE_LINEAGE.flatMap(e=>e.tables))],[]);

  const isHighlighted=useCallback((type,name)=>{
    if(!selectedNode)return false;
    if(nodeType==='source'){
      if(type==='source')return name===selectedNode;
      const engines=ENGINE_LINEAGE.filter(e=>e.sources.includes(selectedNode));
      if(type==='table')return engines.some(e=>e.tables.includes(name));
      if(type==='engine')return engines.some(e=>e.engine===name);
      return false;
    }
    if(nodeType==='table'){
      if(type==='table')return name===selectedNode;
      const engines=ENGINE_LINEAGE.filter(e=>e.tables.includes(selectedNode));
      if(type==='engine')return engines.some(e=>e.engine===name);
      if(type==='source'){
        const sourcesForTable=ENGINE_LINEAGE.filter(e=>e.tables.includes(selectedNode)).flatMap(e=>e.sources);
        return sourcesForTable.includes(name);
      }
      return false;
    }
    if(nodeType==='engine'){
      if(type==='engine')return name===selectedNode;
      const eng=ENGINE_LINEAGE.find(e=>e.engine===selectedNode);
      if(!eng)return false;
      if(type==='table')return eng.tables.includes(name);
      if(type==='source')return eng.sources.includes(name);
      return false;
    }
    return false;
  },[selectedNode,nodeType]);

  const handleClick=useCallback((type,name)=>{
    if(selectedNode===name&&nodeType===type){setSelectedNode(null);setNodeType(null);}
    else{setSelectedNode(name);setNodeType(type);}
  },[selectedNode,nodeType]);

  const impactAnalysis=useMemo(()=>{
    if(!impactSource)return null;
    const affected=ENGINE_LINEAGE.filter(e=>e.sources.includes(impactSource));
    const tables=[...new Set(affected.flatMap(e=>e.tables))];
    return{source:impactSource,engines:affected.map(e=>e.engine),tables};
  },[impactSource]);

  const qualityData=useMemo(()=>{
    return allTables.map((t,i)=>({
      table:t,
      freshness:Math.floor(80+sr(i*7)*20),
      completeness:Math.floor(85+sr(i*11)*15),
      nullRate:Number((sr(i*13)*8).toFixed(1)),
    }));
  },[allTables]);

  return(
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16,flexWrap:'wrap',gap:8}}>
        <div style={{fontSize:14,fontWeight:700}}>Engine Data Lineage</div>
        <div style={{display:'flex',gap:8,alignItems:'center'}}>
          <label style={{fontSize:12,fontWeight:600}}>Impact Analysis:
            <select value={impactSource||''} onChange={e=>setImpactSource(e.target.value||null)} style={{marginLeft:6,padding:'6px 10px',border:`1px solid ${T.border}`,borderRadius:6,fontFamily:T.font,fontSize:12}}>
              <option value="">Select source...</option>
              {allSources.map(s=><option key={s} value={s}>{SOURCES.find(src=>src.id===s)?.name||s}</option>)}
            </select>
          </label>
        </div>
      </div>

      {/* Impact analysis result */}
      {impactAnalysis&&(
        <div style={{background:T.red+'08',border:`1px solid ${T.red}30`,borderRadius:10,padding:16,marginBottom:16}}>
          <div style={{fontSize:13,fontWeight:700,color:T.red,marginBottom:8}}>Impact Analysis: {SOURCES.find(s=>s.id===impactAnalysis.source)?.name} goes down</div>
          <div style={{display:'flex',gap:24,flexWrap:'wrap'}}>
            <div>
              <div style={{fontSize:11,fontWeight:600,marginBottom:4}}>Affected Engines ({impactAnalysis.engines.length})</div>
              {impactAnalysis.engines.map((e,i)=><div key={i} style={{fontFamily:T.mono,fontSize:11,color:T.red,marginBottom:2}}>{e}</div>)}
            </div>
            <div>
              <div style={{fontSize:11,fontWeight:600,marginBottom:4}}>Affected Tables ({impactAnalysis.tables.length})</div>
              {impactAnalysis.tables.map((t,i)=><div key={i} style={{fontFamily:T.mono,fontSize:11,color:T.amber,marginBottom:2}}>{t}</div>)}
            </div>
          </div>
        </div>
      )}

      {/* Lineage flow */}
      <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:20,marginBottom:16}}>
        <div style={{display:'flex',gap:24,alignItems:'flex-start'}}>
          {/* Sources column */}
          <div style={{flex:1}}>
            <div style={{fontSize:12,fontWeight:700,color:T.textMut,marginBottom:10,textTransform:'uppercase',letterSpacing:1}}>Sources</div>
            {allSources.map((s)=>{
              const src=SOURCES.find(x=>x.id===s);
              const hl=isHighlighted('source',s);
              return(
                <div key={s} onClick={()=>handleClick('source',s)} style={{padding:'8px 12px',marginBottom:4,borderRadius:6,border:`1px solid ${hl?T.navyL:T.border}`,background:hl?T.navyL+'15':T.surfaceH,cursor:'pointer',transition:'all 0.15s'}}>
                  <div style={{fontSize:11,fontWeight:600,color:hl?T.navy:T.text}}>{src?.name||s}</div>
                  <div style={{fontSize:9,fontFamily:T.mono,color:T.textMut}}>{src?.type||'API'}</div>
                </div>
              );
            })}
          </div>

          {/* Arrow */}
          <div style={{display:'flex',alignItems:'center',fontSize:20,color:T.gold,alignSelf:'center'}}>\u2192</div>

          {/* Tables column */}
          <div style={{flex:1}}>
            <div style={{fontSize:12,fontWeight:700,color:T.textMut,marginBottom:10,textTransform:'uppercase',letterSpacing:1}}>Tables</div>
            {allTables.map((t)=>{
              const hl=isHighlighted('table',t);
              const cols=TARGET_TABLES[t]?.length||0;
              return(
                <div key={t} onClick={()=>handleClick('table',t)} style={{padding:'8px 12px',marginBottom:4,borderRadius:6,border:`1px solid ${hl?T.sage:T.border}`,background:hl?T.sage+'15':T.surfaceH,cursor:'pointer',transition:'all 0.15s'}}>
                  <div style={{fontSize:11,fontWeight:600,fontFamily:T.mono,color:hl?T.sage:T.text}}>{t}</div>
                  <div style={{fontSize:9,color:T.textMut}}>{cols} columns</div>
                </div>
              );
            })}
          </div>

          {/* Arrow */}
          <div style={{display:'flex',alignItems:'center',fontSize:20,color:T.gold,alignSelf:'center'}}>\u2192</div>

          {/* Engines column */}
          <div style={{flex:1.5}}>
            <div style={{fontSize:12,fontWeight:700,color:T.textMut,marginBottom:10,textTransform:'uppercase',letterSpacing:1}}>Engines</div>
            {ENGINE_LINEAGE.map((e)=>{
              const hl=isHighlighted('engine',e.engine);
              return(
                <div key={e.engine} onClick={()=>handleClick('engine',e.engine)} style={{padding:'8px 12px',marginBottom:4,borderRadius:6,border:`1px solid ${hl?T.gold:T.border}`,background:hl?T.gold+'15':T.surfaceH,cursor:'pointer',transition:'all 0.15s'}}>
                  <div style={{fontSize:11,fontWeight:600,color:hl?T.navy:T.text}}>{e.engine}</div>
                  <div style={{fontSize:9,color:T.textMut}}>{e.tables.length} tables, {e.sources.length} sources</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Data quality */}
      <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:16}}>
        <div style={{fontSize:13,fontWeight:700,marginBottom:12}}>Field-Level Data Quality</div>
        <div style={{overflowX:'auto'}}>
          <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
            <thead>
              <tr>
                {['Table','Freshness','Completeness','Null Rate','Status'].map(h=>(
                  <th key={h} style={{padding:'8px 12px',textAlign:'left',borderBottom:`2px solid ${T.border}`,fontWeight:700,color:T.navy,fontSize:11}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {qualityData.map((q,qi)=>(
                <tr key={qi} style={{background:qi%2===0?'transparent':T.surfaceH}}>
                  <td style={{padding:'6px 12px',fontFamily:T.mono,fontSize:11,fontWeight:600}}>{q.table}</td>
                  <td style={{padding:'6px 12px'}}>
                    <div style={{display:'flex',alignItems:'center',gap:6}}>
                      <div style={{width:60,height:5,background:T.surfaceH,borderRadius:3,overflow:'hidden'}}>
                        <div style={{width:`${q.freshness}%`,height:'100%',background:q.freshness>90?T.green:q.freshness>70?T.amber:T.red,borderRadius:3}}/>
                      </div>
                      <span style={{fontFamily:T.mono,fontSize:10}}>{q.freshness}%</span>
                    </div>
                  </td>
                  <td style={{padding:'6px 12px'}}>
                    <div style={{display:'flex',alignItems:'center',gap:6}}>
                      <div style={{width:60,height:5,background:T.surfaceH,borderRadius:3,overflow:'hidden'}}>
                        <div style={{width:`${q.completeness}%`,height:'100%',background:q.completeness>90?T.green:T.amber,borderRadius:3}}/>
                      </div>
                      <span style={{fontFamily:T.mono,fontSize:10}}>{q.completeness}%</span>
                    </div>
                  </td>
                  <td style={{padding:'6px 12px',fontFamily:T.mono,fontSize:11,color:q.nullRate>5?T.amber:T.green}}>{q.nullRate}%</td>
                  <td style={{padding:'6px 12px'}}><StatusBadge status={q.freshness>85&&q.completeness>90?'active':q.freshness>70?'warning':'inactive'}/></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ================================================================== */
/* === TAB 6: SYNC MONITOR ========================================= */
/* ================================================================== */
function SyncMonitorTab(){
  const[syncingId,setSyncingId]=useState(null);
  const[syncProgress,setSyncProgress]=useState(0);
  const intervalRef=useRef(null);

  useEffect(()=>{return()=>{if(intervalRef.current)clearInterval(intervalRef.current);};},[]);

  const syncHistory=useMemo(()=>{
    return SOURCES.map((src,si)=>{
      return{
        ...src,
        sparkline:Array.from({length:14},(_,i)=>({day:i,records:Math.floor(100+sr(si*14+i)*900),errors:Math.floor(sr(si*14+i+7)*5)})),
        schedule:sr(si*3)>0.5?'Every 6 hours':'Daily at 06:00 UTC',
        nextSync:new Date(Date.now()+Math.floor(sr(si*5)*86400000)).toISOString(),
        avgDuration:Math.floor(5+sr(si*9)*55)+'s',
      };
    });
  },[]);

  const errorLog=useMemo(()=>{
    return Array.from({length:12},(_,i)=>{
      const sourceIdx=Math.floor(sr(i*7)*SOURCES.length);
      const typeIdx=Math.floor(sr(i*11)*6);
      const types=['timeout','rate_limit','auth_expired','parse_error','schema_change','network_error'];
      const messages=['Request timeout after 30s','Rate limit exceeded (429)','OAuth token expired','JSON parse error at position 1842','Unexpected field "new_metric" detected','Connection refused (ECONNREFUSED)'];
      return{
        timestamp:new Date(Date.now()-i*3600000*Math.floor(1+sr(i*3)*12)).toISOString(),
        source:SOURCES[sourceIdx].name,
        type:types[typeIdx],
        message:messages[typeIdx],
        retries:Math.floor(sr(i*13)*4),
        resolved:sr(i*17)>0.3,
      };
    });
  },[]);

  const handleSyncNow=useCallback((id)=>{
    setSyncingId(id);setSyncProgress(0);
    if(intervalRef.current)clearInterval(intervalRef.current);
    let prog=0;
    intervalRef.current=setInterval(()=>{
      prog+=Math.floor(5+sr(prog)*15);
      if(prog>=100){
        clearInterval(intervalRef.current);
        intervalRef.current=null;
        setSyncProgress(100);
        setTimeout(()=>{setSyncingId(null);setSyncProgress(0);},600);
      }else{
        setSyncProgress(prog);
      }
    },300);
  },[]);

  const calendarWeeks=useMemo(()=>{
    const weeks=[];
    for(let w=0;w<4;w++){
      const days=[];
      for(let d=0;d<7;d++){
        const dayNum=w*7+d+1;
        const syncs=Math.floor(sr(dayNum*3)*5);
        days.push({day:dayNum>31?null:dayNum,syncs,hasError:sr(dayNum*7)>0.85});
      }
      weeks.push(days);
    }
    return weeks;
  },[]);

  return(
    <div>
      {/* Source sync status */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(480px,1fr))',gap:12,marginBottom:20}}>
        {syncHistory.map((src)=>(
          <div key={src.id} style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:14}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
              <div>
                <div style={{fontSize:13,fontWeight:700}}>{src.name}</div>
                <div style={{fontSize:10,fontFamily:T.mono,color:T.textMut}}>{src.schedule} \u00b7 Avg: {src.avgDuration}</div>
              </div>
              <StatusBadge status={src.status}/>
            </div>

            {/* Sparkline */}
            <div style={{height:50,marginBottom:8}}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={src.sparkline}>
                  <Area type="monotone" dataKey="records" stroke={T.navyL} fill={T.navyL+'20'} strokeWidth={1.5}/>
                  <Tooltip contentStyle={{fontFamily:T.mono,fontSize:10,padding:'4px 8px',borderRadius:4,background:T.surface,border:`1px solid ${T.border}`}} formatter={(v)=>[fmtNum(v),'Records']}/>
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Rate limit gauge */}
            <div style={{display:'flex',gap:12,alignItems:'center',marginBottom:8}}>
              <div style={{flex:1}}>
                <div style={{fontSize:10,color:T.textMut,marginBottom:3}}>Rate Limit</div>
                <div style={{height:6,background:T.surfaceH,borderRadius:3,overflow:'hidden'}}>
                  <div style={{width:`${(src.rateLimit.used/src.rateLimit.max)*100}%`,height:'100%',background:src.rateLimit.used/src.rateLimit.max>0.9?T.red:src.rateLimit.used/src.rateLimit.max>0.7?T.amber:T.green,borderRadius:3,transition:'width 0.3s'}}/>
                </div>
              </div>
              <span style={{fontFamily:T.mono,fontSize:10,color:T.textMut}}>{fmtNum(src.rateLimit.used)}/{fmtNum(src.rateLimit.max)}</span>
            </div>

            {/* Next sync */}
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <span style={{fontSize:10,color:T.textMut}}>Next: {fmtDate(src.nextSync)}</span>
              {syncingId===src.id?(
                <div style={{display:'flex',alignItems:'center',gap:8,flex:'0 0 160px'}}>
                  <div style={{flex:1,height:6,background:T.surfaceH,borderRadius:3,overflow:'hidden'}}>
                    <div style={{width:`${Math.min(syncProgress,100)}%`,height:'100%',background:T.green,borderRadius:3,transition:'width 0.2s'}}/>
                  </div>
                  <span style={{fontFamily:T.mono,fontSize:10,color:T.green}}>{Math.min(syncProgress,100)}%</span>
                </div>
              ):(
                <button onClick={()=>handleSyncNow(src.id)} disabled={src.status==='inactive'} style={{padding:'4px 12px',fontSize:10,fontWeight:600,background:T.navy+'10',border:`1px solid ${T.navy}20`,borderRadius:4,cursor:src.status==='inactive'?'not-allowed':'pointer',fontFamily:T.font,color:T.navy,opacity:src.status==='inactive'?0.4:1}}>Sync Now</button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Error log */}
      <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:16,marginBottom:16}}>
        <div style={{fontSize:13,fontWeight:700,marginBottom:12}}>Error Log (Last 48h)</div>
        <div style={{maxHeight:280,overflowY:'auto'}}>
          <table style={{width:'100%',borderCollapse:'collapse',fontSize:11}}>
            <thead>
              <tr>
                {['Time','Source','Type','Message','Retries','Status'].map(h=>(
                  <th key={h} style={{padding:'6px 10px',textAlign:'left',borderBottom:`2px solid ${T.border}`,fontWeight:700,color:T.navy,fontSize:10,position:'sticky',top:0,background:T.surface}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {errorLog.map((err,ei)=>(
                <tr key={ei} style={{background:ei%2===0?'transparent':T.surfaceH}}>
                  <td style={{padding:'5px 10px',fontFamily:T.mono,fontSize:10,color:T.textMut,whiteSpace:'nowrap'}}>{timeSince(err.timestamp)}</td>
                  <td style={{padding:'5px 10px',fontSize:11,fontWeight:600}}>{err.source}</td>
                  <td style={{padding:'5px 10px'}}><span style={{padding:'1px 6px',borderRadius:3,fontSize:9,fontFamily:T.mono,background:T.amber+'15',color:T.amber}}>{err.type}</span></td>
                  <td style={{padding:'5px 10px',color:T.textSec,maxWidth:200,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{err.message}</td>
                  <td style={{padding:'5px 10px',fontFamily:T.mono,fontSize:10}}>{err.retries}/3</td>
                  <td style={{padding:'5px 10px'}}><span style={{fontSize:10,fontWeight:600,color:err.resolved?T.green:T.red}}>{err.resolved?'Resolved':'Open'}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Sync calendar */}
      <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:16}}>
        <div style={{fontSize:13,fontWeight:700,marginBottom:12}}>Sync Calendar \u2014 March 2026</div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:4}}>
          {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d=>(
            <div key={d} style={{textAlign:'center',fontSize:10,fontWeight:700,color:T.textMut,padding:4}}>{d}</div>
          ))}
          {calendarWeeks.flat().map((d,di)=>(
            <div key={di} style={{padding:8,borderRadius:6,background:d.day?d.hasError?T.red+'08':d.syncs>3?T.green+'08':T.surfaceH:'transparent',border:`1px solid ${d.day?d.hasError?T.red+'30':T.border:'transparent'}`,textAlign:'center',minHeight:44}}>
              {d.day&&(
                <>
                  <div style={{fontSize:12,fontWeight:600,color:d.day===29?T.gold:T.text}}>{d.day}</div>
                  <div style={{fontSize:9,color:d.hasError?T.red:T.textMut,fontFamily:T.mono}}>{d.syncs} syncs{d.hasError?' (err)':''}</div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
