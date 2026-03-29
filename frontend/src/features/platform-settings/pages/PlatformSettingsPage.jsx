import React, { useState, useMemo, useCallback } from 'react';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';

/* ─── Theme ─── */
const T={bg:'#f6f4f0',surface:'#ffffff',surfaceH:'#f0ede7',border:'#e5e0d8',borderL:'#d5cfc5',navy:'#1b3a5c',navyL:'#2c5a8c',gold:'#c5a96a',goldL:'#d4be8a',sage:'#5a8a6a',sageL:'#7ba67d',teal:'#5a8a6a',text:'#1b3a5c',textSec:'#5c6b7e',textMut:'#9aa3ae',red:'#dc2626',green:'#16a34a',amber:'#d97706',font:"'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"};

/* ─── Deterministic seed ─── */
const sr=(s)=>{let x=Math.sin(s+1)*10000;return x-Math.floor(x);};
const rng=(min,max,s)=>min+sr(s)*(max-min);
const rngI=(min,max,s)=>Math.floor(rng(min,max,s));

/* ─── Tabs ─── */
const TABS = ['General Settings','Integration Settings','Feature Flags','System Health'];

/* ─── Feature Flags ─── */
const FEATURE_FLAGS = [
  {id:'newDashboardDesign',name:'New Dashboard Design',desc:'Enable the Bloomberg-tier redesigned dashboard UI',category:'UI',enabled:true,lastToggled:'2026-03-25T10:30:00Z',toggledBy:'admin@riskanalytics.com'},
  {id:'codeSplitting',name:'Code Splitting',desc:'Enable lazy-loading of route modules for faster initial load',category:'Performance',enabled:true,lastToggled:'2026-03-20T08:15:00Z',toggledBy:'devops@riskanalytics.com'},
  {id:'darkMode',name:'Dark Mode',desc:'Enable dark theme option in user preferences',category:'UI',enabled:false,lastToggled:'2026-03-15T14:00:00Z',toggledBy:'admin@riskanalytics.com'},
  {id:'betaModules',name:'Beta Modules',desc:'Show beta/experimental modules in navigation',category:'Features',enabled:true,lastToggled:'2026-03-22T09:45:00Z',toggledBy:'admin@riskanalytics.com'},
  {id:'debugMode',name:'Debug Mode',desc:'Enable verbose console logging and debug panels',category:'Development',enabled:false,lastToggled:'2026-03-18T16:30:00Z',toggledBy:'dev@riskanalytics.com'},
  {id:'auditTrailVerbose',name:'Audit Trail Verbose',desc:'Log all user actions including read operations',category:'Security',enabled:true,lastToggled:'2026-03-10T11:00:00Z',toggledBy:'compliance@riskanalytics.com'},
  {id:'realTimeSync',name:'Real-Time Sync',desc:'Enable WebSocket real-time data synchronization',category:'Performance',enabled:false,lastToggled:'2026-03-12T13:20:00Z',toggledBy:'devops@riskanalytics.com'},
  {id:'aiAssistant',name:'AI Assistant',desc:'Enable AI-powered analysis assistant in modules',category:'Features',enabled:false,lastToggled:'2026-03-08T10:00:00Z',toggledBy:'admin@riskanalytics.com'},
  {id:'exportPDF',name:'Export PDF',desc:'Enable PDF export functionality for reports and dashboards',category:'Features',enabled:true,lastToggled:'2026-03-05T09:30:00Z',toggledBy:'admin@riskanalytics.com'},
  {id:'bulkImport',name:'Bulk Import',desc:'Enable CSV/Excel bulk data import functionality',category:'Features',enabled:true,lastToggled:'2026-03-01T14:15:00Z',toggledBy:'admin@riskanalytics.com'},
  {id:'subscriptionGating',name:'Subscription Gating',desc:'Gate premium features behind subscription tiers',category:'Business',enabled:false,lastToggled:'2026-02-28T11:45:00Z',toggledBy:'admin@riskanalytics.com'},
  {id:'maintenanceMode',name:'Maintenance Mode',desc:'Show maintenance banner and restrict write operations',category:'Operations',enabled:false,lastToggled:'2026-02-25T08:00:00Z',toggledBy:'devops@riskanalytics.com'},
  {id:'demoData',name:'Demo Data',desc:'Load synthetic demo data for presentations and trials',category:'Development',enabled:true,lastToggled:'2026-03-24T10:00:00Z',toggledBy:'admin@riskanalytics.com'},
  {id:'apiRateLimiting',name:'API Rate Limiting',desc:'Enforce rate limits on API endpoints (100 req/min)',category:'Security',enabled:true,lastToggled:'2026-03-15T09:00:00Z',toggledBy:'devops@riskanalytics.com'},
  {id:'webhookNotifications',name:'Webhook Notifications',desc:'Send webhook notifications for alerts and events',category:'Features',enabled:true,lastToggled:'2026-03-20T16:00:00Z',toggledBy:'devops@riskanalytics.com'},
  {id:'advancedCharts',name:'Advanced Charts',desc:'Enable Recharts advanced visualization components',category:'UI',enabled:true,lastToggled:'2026-03-22T08:30:00Z',toggledBy:'dev@riskanalytics.com'},
  {id:'customBranding',name:'Custom Branding',desc:'Allow white-label branding customization',category:'Business',enabled:false,lastToggled:'2026-02-20T14:00:00Z',toggledBy:'admin@riskanalytics.com'},
  {id:'multiCurrency',name:'Multi-Currency',desc:'Support multiple base currencies (USD, EUR, GBP, INR)',category:'Features',enabled:true,lastToggled:'2026-03-18T10:30:00Z',toggledBy:'admin@riskanalytics.com'},
  {id:'multiLanguage',name:'Multi-Language',desc:'Enable multi-language UI (EN, DE, FR, ES, JA)',category:'Features',enabled:false,lastToggled:'2026-02-15T12:00:00Z',toggledBy:'admin@riskanalytics.com'},
  {id:'betaEngines',name:'Beta Engines',desc:'Enable experimental calculation engines (E-031+)',category:'Development',enabled:false,lastToggled:'2026-03-10T15:30:00Z',toggledBy:'dev@riskanalytics.com'},
];

/* ─── Integration configs ─── */
const INTEGRATIONS = [
  {id:'backend_api',name:'Backend API',url:'http://localhost:8001',status:'connected',type:'REST API',lastTest:'2026-03-29T08:00:00Z',latency:12},
  {id:'supabase',name:'Supabase PostgreSQL',url:'postgresql://postgres.xxxx:5432/postgres',status:'connected',type:'Database',lastTest:'2026-03-29T07:55:00Z',latency:45,masked:true},
  {id:'eodhd',name:'EODHD Financial Data',url:'https://eodhd.com/api/v1',status:'connected',type:'REST API',lastTest:'2026-03-29T06:30:00Z',latency:230,apiKey:'eodhd_***************'},
  {id:'alpha_vantage',name:'Alpha Vantage',url:'https://www.alphavantage.co/query',status:'degraded',type:'REST API',lastTest:'2026-03-29T05:00:00Z',latency:1850,apiKey:'av_***************'},
  {id:'msci',name:'MSCI ESG API',url:'https://api.msci.com/esg/v3',status:'disconnected',type:'REST API',lastTest:'2026-03-28T22:00:00Z',latency:null,apiKey:'msci_***************'},
  {id:'cdp',name:'CDP Climate API',url:'https://api.cdp.net/v2',status:'connected',type:'REST API',lastTest:'2026-03-29T04:00:00Z',latency:340},
  {id:'refinitiv',name:'LSEG/Refinitiv',url:'https://api.refinitiv.com/esg',status:'connected',type:'REST API',lastTest:'2026-03-29T07:00:00Z',latency:180,apiKey:'ref_***************'},
  {id:'smtp',name:'SMTP Email (SendGrid)',url:'smtp.sendgrid.net:587',status:'connected',type:'SMTP',lastTest:'2026-03-29T08:10:00Z',latency:95},
];

/* ─── Webhook configs ─── */
const WEBHOOKS = [
  {id:'wh-001',name:'Slack - Risk Alerts',url:'https://hooks.slack.com/services/T****/B****/xxxx',events:['critical_alert','engine_error'],status:'active'},
  {id:'wh-002',name:'Teams - Daily Summary',url:'https://outlook.office.com/webhook/xxxx',events:['daily_summary','report_generated'],status:'active'},
  {id:'wh-003',name:'Email - Compliance',url:'compliance@riskanalytics.com',events:['regulatory_deadline','compliance_breach'],status:'active'},
  {id:'wh-004',name:'Slack - Deployments',url:'https://hooks.slack.com/services/T****/B****/yyyy',events:['deployment','engine_config_change'],status:'paused'},
];

/* ─── System health data ─── */
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

/* ─── Styles ─── */
const sty = {
  page:{fontFamily:T.font,background:T.bg,minHeight:'100vh',padding:'24px 32px',color:T.text},
  header:{marginBottom:24},
  title:{fontSize:28,fontWeight:700,color:T.navy,margin:0,letterSpacing:'-0.5px'},
  subtitle:{fontSize:13,color:T.textMut,marginTop:4,fontFamily:T.mono},
  tabBar:{display:'flex',gap:2,background:T.surface,borderRadius:8,padding:3,border:`1px solid ${T.border}`,marginBottom:24,flexWrap:'wrap'},
  tab:(a)=>({padding:'10px 20px',borderRadius:6,border:'none',cursor:'pointer',fontSize:13,fontWeight:a?600:400,fontFamily:T.font,background:a?T.navy:'transparent',color:a?'#fff':T.textSec,transition:'all 0.2s'}),
  card:{background:T.surface,borderRadius:10,border:`1px solid ${T.border}`,padding:20,marginBottom:16},
  cardTitle:{fontSize:15,fontWeight:600,color:T.navy,margin:'0 0 12px 0'},
  grid2:{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16},
  grid3:{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:16},
  grid4:{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12},
  stat:{textAlign:'center',padding:16,background:T.surfaceH,borderRadius:8,border:`1px solid ${T.borderL}`},
  statVal:{fontSize:28,fontWeight:700,fontFamily:T.mono},
  statLbl:{fontSize:11,color:T.textMut,marginTop:4,textTransform:'uppercase',letterSpacing:'0.5px'},
  badge:(c)=>({display:'inline-block',padding:'2px 8px',borderRadius:4,fontSize:11,fontWeight:600,background:c+'18',color:c,fontFamily:T.mono}),
  tbl:{width:'100%',borderCollapse:'collapse',fontSize:12},
  th:{textAlign:'left',padding:'8px 10px',borderBottom:`2px solid ${T.border}`,color:T.textMut,fontWeight:600,fontSize:11,textTransform:'uppercase',letterSpacing:'0.5px',fontFamily:T.mono},
  td:{padding:'8px 10px',borderBottom:`1px solid ${T.borderL}`,fontFamily:T.mono,fontSize:12},
  btn:(primary)=>({padding:'8px 16px',borderRadius:6,border:primary?'none':`1px solid ${T.border}`,background:primary?T.navy:T.surface,color:primary?'#fff':T.text,fontSize:12,fontWeight:600,cursor:'pointer',fontFamily:T.font}),
  input:{padding:'8px 12px',borderRadius:6,border:`1px solid ${T.border}`,fontSize:12,fontFamily:T.mono,background:T.surface,color:T.text,width:'100%',boxSizing:'border-box'},
  select:{padding:'8px 12px',borderRadius:6,border:`1px solid ${T.border}`,fontSize:12,fontFamily:T.mono,background:T.surface,color:T.text},
  mono:{fontFamily:T.mono,fontSize:12},
  tag:(color)=>({display:'inline-block',padding:'1px 6px',borderRadius:3,fontSize:10,fontWeight:600,background:color+'15',color}),
  toggle:(on)=>({width:40,height:22,borderRadius:11,background:on?T.green:T.borderL,position:'relative',cursor:'pointer',transition:'background 0.2s',border:'none',padding:0}),
  toggleDot:(on)=>({position:'absolute',top:2,left:on?20:2,width:18,height:18,borderRadius:9,background:'#fff',transition:'left 0.2s',boxShadow:'0 1px 3px rgba(0,0,0,0.2)'}),
  fieldRow:{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'12px 0',borderBottom:`1px solid ${T.borderL}`},
  fieldLabel:{fontSize:13,fontWeight:500,color:T.text},
  fieldDesc:{fontSize:11,color:T.textMut,marginTop:2},
  gauge:(pct,color)=>({position:'relative',width:80,height:80}),
  statusDot:(color)=>({display:'inline-block',width:8,height:8,borderRadius:'50%',background:color,marginRight:6}),
  pbar:(pct,color)=>({height:6,borderRadius:3,background:T.borderL,position:'relative',overflow:'hidden',width:'100%'}),
  pbarFill:(pct,color)=>({position:'absolute',left:0,top:0,height:'100%',width:`${Math.min(100,pct)}%`,borderRadius:3,background:color,transition:'width 0.5s'}),
};

const timeAgo = (iso) => { const m=Math.floor((Date.now()-new Date(iso).getTime())/60000); return m<60?`${m}m ago`:m<1440?`${Math.floor(m/60)}h ago`:`${Math.floor(m/1440)}d ago`; };
const fmtDate = (iso) => new Date(iso).toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'});
const statusColor = (s) => s==='connected'?T.green:s==='degraded'?T.amber:T.red;
const PIE_COLORS = [T.green,T.sage,T.gold,T.amber,T.red,T.navyL,T.teal,'#7c3aed','#0d9488','#2563eb'];

/* ─── Gauge component ─── */
function Gauge({value, max=100, label, color, size=90}) {
  const pct = Math.min(100, (value/max)*100);
  const angle = (pct/100)*270;
  const rad = (a) => (a-135)*Math.PI/180;
  const r = size/2-8;
  const cx = size/2, cy = size/2;
  const x1 = cx + r*Math.cos(rad(0));
  const y1 = cy + r*Math.sin(rad(0));
  const x2 = cx + r*Math.cos(rad(angle));
  const y2 = cy + r*Math.sin(rad(angle));
  const large = angle > 180 ? 1 : 0;
  return (
    <div style={{textAlign:'center'}}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={T.borderL} strokeWidth={6} strokeDasharray="212 80" strokeDashoffset={-40} strokeLinecap="round"/>
        {pct > 0 && <path d={`M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`} fill="none" stroke={color} strokeWidth={6} strokeLinecap="round"/>}
        <text x={cx} y={cy-2} textAnchor="middle" fontSize={16} fontWeight={700} fontFamily={T.mono} fill={color}>{value}{typeof max==='number'&&max===100?'%':''}</text>
        <text x={cx} y={cy+12} textAnchor="middle" fontSize={8} fill={T.textMut}>{label}</text>
      </svg>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────── */
export default function PlatformSettingsPage() {
  const [tab, setTab] = useState(0);

  /* General settings state */
  const [platformName, setPlatformName] = useState('Risk Analytics Platform');
  const [theme, setTheme] = useState('light');
  const [currency, setCurrency] = useState('USD');
  const [dateFormat, setDateFormat] = useState('DD/MM/YYYY');
  const [numberFormat, setNumberFormat] = useState('1,234.56');
  const [timezone, setTimezone] = useState('UTC');
  const [language, setLanguage] = useState('en');
  const [demoMode, setDemoMode] = useState(true);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [welcomeMsg, setWelcomeMsg] = useState('Welcome to the Risk Analytics Platform. Navigate using the sidebar to explore 265+ ESG and climate risk modules.');
  const [footerText, setFooterText] = useState('Risk Analytics Platform v2.0 | Built with FastAPI + React | Data powered by EODHD, MSCI, CDP');
  const [bannerEnabled, setBannerEnabled] = useState(true);
  const [bannerText, setBannerText] = useState('DEMO MODE: Synthetic data for demonstration purposes. Press D to dismiss.');

  /* Feature flags state */
  const [flags, setFlags] = useState(FEATURE_FLAGS);
  const [flagFilter, setFlagFilter] = useState('all');
  const [flagSearch, setFlagSearch] = useState('');

  /* Integration test states */
  const [testingIntegration, setTestingIntegration] = useState(null);
  const [testResults, setTestResults] = useState({});

  /* System health */
  const [logLevel, setLogLevel] = useState('INFO');

  /* Toggle flag */
  const toggleFlag = useCallback((flagId) => {
    setFlags(prev => prev.map(f => f.id===flagId ? {...f, enabled:!f.enabled, lastToggled:new Date().toISOString(), toggledBy:'admin@riskanalytics.com'} : f));
  },[]);

  /* Filtered flags */
  const filteredFlags = useMemo(()=>{
    let arr = [...flags];
    if(flagFilter !== 'all') {
      if(flagFilter === 'enabled') arr = arr.filter(f=>f.enabled);
      else if(flagFilter === 'disabled') arr = arr.filter(f=>!f.enabled);
      else arr = arr.filter(f=>f.category===flagFilter);
    }
    if(flagSearch) arr = arr.filter(f=>f.name.toLowerCase().includes(flagSearch.toLowerCase()) || f.desc.toLowerCase().includes(flagSearch.toLowerCase()));
    return arr;
  },[flags, flagFilter, flagSearch]);

  /* Test integration */
  const testIntegration = useCallback((id)=>{
    setTestingIntegration(id);
    setTimeout(()=>{
      setTestResults(prev=>({...prev,[id]:{success:sr(id.charCodeAt(0)*31)>0.2, latency:rngI(10,2000,id.charCodeAt(0)*37), timestamp:new Date().toISOString()}}));
      setTestingIntegration(null);
    },1500+sr(id.charCodeAt(0)*41)*1500);
  },[]);

  /* System health metrics */
  const healthMetrics = useMemo(()=>({
    cpu: 24 + sr(1001)*30,
    memory: 45 + sr(1003)*25,
    dbConnections: {active:rngI(5,25,1005), max:50},
    uptime: '14d 7h 23m',
    uptimePct: 99.97,
    bgJobs: {queued:rngI(0,8,1007), running:rngI(1,5,1009), failed:rngI(0,3,1011)},
    cacheHitRate: 85 + sr(1013)*12,
    errorRate: 0.02 + sr(1015)*0.08,
    activeSessions: rngI(3,25,1017),
    storage: {used:rngI(2,18,1019), total:50},
    buildVersion: 'v2.67.0-alpha',
    buildDate: '2026-03-28T14:30:00Z',
    environment: 'development',
    nodeVersion: 'v20.11.0',
    reactVersion: '18.2.0',
    fastapiVersion: '0.109.0',
  }),[]);

  /* Error rate trend */
  const errorTrend = useMemo(()=>{
    return MONTHS.map((m,mi)=>({
      month:m,
      errorRate: 0.01 + sr(mi*1101)*0.1,
      requestCount: rngI(5000,50000,mi*1103),
    }));
  },[]);

  /* Active sessions trend */
  const sessionTrend = useMemo(()=>{
    return Array.from({length:24},(_, h)=>({
      hour:`${String(h).padStart(2,'0')}:00`,
      sessions: rngI(1,30,h*1201),
    }));
  },[]);

  /* Environment variables (masked) */
  const envVars = [
    {key:'DATABASE_URL',value:'postgresql://postgres.****:5432/postgres',sensitive:true},
    {key:'EODHD_API_KEY',value:'********************************',sensitive:true},
    {key:'ALPHA_VANTAGE_KEY',value:'****************',sensitive:true},
    {key:'SUPABASE_URL',value:'https://****.supabase.co',sensitive:true},
    {key:'SUPABASE_KEY',value:'eyJ****...****',sensitive:true},
    {key:'REQUIRE_AUTH',value:'false',sensitive:false},
    {key:'CORS_ORIGINS',value:'http://localhost:3000',sensitive:false},
    {key:'LOG_LEVEL',value:'INFO',sensitive:false},
    {key:'REDIS_URL',value:'redis://localhost:6379',sensitive:false},
    {key:'SMTP_HOST',value:'smtp.sendgrid.net',sensitive:false},
    {key:'SMTP_PORT',value:'587',sensitive:false},
    {key:'SMTP_USER',value:'apikey',sensitive:true},
    {key:'SENTRY_DSN',value:'https://****@sentry.io/****',sensitive:true},
  ];

  return (
    <div style={sty.page}>
      <div style={sty.header}>
        <h1 style={sty.title}>Platform Settings</h1>
        <div style={sty.subtitle}>PLATFORM ADMINISTRATION :: CONFIGURATION MANAGEMENT :: {flags.filter(f=>f.enabled).length}/{flags.length} FLAGS ENABLED</div>
      </div>

      <div style={sty.tabBar}>
        {TABS.map((t,i)=><button key={t} style={sty.tab(tab===i)} onClick={()=>setTab(i)}>{t}</button>)}
      </div>

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/*  TAB 0 — GENERAL SETTINGS                                          */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      {tab===0 && (
        <div>
          {/* System health indicators */}
          <div style={sty.grid4}>
            <div style={sty.stat}><div style={{...sty.statVal,color:T.green}}>{healthMetrics.uptimePct}%</div><div style={sty.statLbl}>Uptime</div></div>
            <div style={sty.stat}><div style={{...sty.statVal,color:T.navy}}>{healthMetrics.activeSessions}</div><div style={sty.statLbl}>Active Sessions</div></div>
            <div style={sty.stat}><div style={{...sty.statVal,color:T.sage}}>{healthMetrics.buildVersion}</div><div style={sty.statLbl}>Build Version</div></div>
            <div style={sty.stat}><div style={{...sty.statVal,color:demoMode?T.amber:T.green}}>{demoMode?'DEMO':'LIVE'}</div><div style={sty.statLbl}>Mode</div></div>
          </div>

          <div style={sty.grid2}>
            {/* Basic settings */}
            <div style={sty.card}>
              <h3 style={sty.cardTitle}>Platform Identity</h3>
              <div style={sty.fieldRow}>
                <div><div style={sty.fieldLabel}>Platform Name</div></div>
                <input style={{...sty.input,width:280}} value={platformName} onChange={e=>setPlatformName(e.target.value)}/>
              </div>
              <div style={sty.fieldRow}>
                <div><div style={sty.fieldLabel}>Theme</div><div style={sty.fieldDesc}>Visual appearance of the platform</div></div>
                <select style={sty.select} value={theme} onChange={e=>setTheme(e.target.value)}>
                  <option value="light">Light (Bloomberg Cream)</option>
                  <option value="dark">Dark (Terminal)</option>
                  <option value="custom">Custom</option>
                </select>
              </div>
              <div style={sty.fieldRow}>
                <div><div style={sty.fieldLabel}>Default Currency</div></div>
                <select style={sty.select} value={currency} onChange={e=>setCurrency(e.target.value)}>
                  {['USD','EUR','GBP','INR','JPY','CHF','AUD','CAD'].map(c=><option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div style={sty.fieldRow}>
                <div><div style={sty.fieldLabel}>Date Format</div></div>
                <select style={sty.select} value={dateFormat} onChange={e=>setDateFormat(e.target.value)}>
                  {['DD/MM/YYYY','MM/DD/YYYY','YYYY-MM-DD','DD-MMM-YYYY'].map(f=><option key={f} value={f}>{f}</option>)}
                </select>
              </div>
              <div style={sty.fieldRow}>
                <div><div style={sty.fieldLabel}>Number Format</div></div>
                <select style={sty.select} value={numberFormat} onChange={e=>setNumberFormat(e.target.value)}>
                  {['1,234.56','1.234,56','1 234.56','1234.56'].map(f=><option key={f} value={f}>{f}</option>)}
                </select>
              </div>
              <div style={sty.fieldRow}>
                <div><div style={sty.fieldLabel}>Timezone</div></div>
                <select style={sty.select} value={timezone} onChange={e=>setTimezone(e.target.value)}>
                  {['UTC','America/New_York','Europe/London','Europe/Berlin','Asia/Mumbai','Asia/Tokyo','Asia/Singapore','Australia/Sydney'].map(tz=><option key={tz} value={tz}>{tz}</option>)}
                </select>
              </div>
              <div style={sty.fieldRow}>
                <div><div style={sty.fieldLabel}>Language</div></div>
                <select style={sty.select} value={language} onChange={e=>setLanguage(e.target.value)}>
                  {[['en','English'],['de','Deutsch'],['fr','Francais'],['es','Espanol'],['ja','Japanese']].map(([k,v])=><option key={k} value={k}>{v}</option>)}
                </select>
              </div>
            </div>

            {/* Mode toggles */}
            <div style={sty.card}>
              <h3 style={sty.cardTitle}>Operational Modes</h3>
              <div style={sty.fieldRow}>
                <div>
                  <div style={sty.fieldLabel}>Demo Mode</div>
                  <div style={sty.fieldDesc}>Load synthetic data for demonstrations and trials</div>
                </div>
                <button style={sty.toggle(demoMode)} onClick={()=>setDemoMode(!demoMode)}><div style={sty.toggleDot(demoMode)}/></button>
              </div>
              <div style={sty.fieldRow}>
                <div>
                  <div style={sty.fieldLabel}>Maintenance Mode</div>
                  <div style={sty.fieldDesc}>Restrict write operations and show maintenance banner</div>
                </div>
                <button style={sty.toggle(maintenanceMode)} onClick={()=>setMaintenanceMode(!maintenanceMode)}><div style={sty.toggleDot(maintenanceMode)}/></button>
              </div>

              <h3 style={{...sty.cardTitle,marginTop:20}}>Global Banner Configuration</h3>
              <div style={sty.fieldRow}>
                <div><div style={sty.fieldLabel}>Banner Enabled</div><div style={sty.fieldDesc}>Show amber sticky banner (GlobalDemoBanner)</div></div>
                <button style={sty.toggle(bannerEnabled)} onClick={()=>setBannerEnabled(!bannerEnabled)}><div style={sty.toggleDot(bannerEnabled)}/></button>
              </div>
              <div style={{padding:'12px 0'}}>
                <div style={{fontSize:11,color:T.textMut,marginBottom:4}}>Banner Text</div>
                <input style={sty.input} value={bannerText} onChange={e=>setBannerText(e.target.value)}/>
              </div>

              {bannerEnabled && (
                <div style={{padding:'10px 16px',background:T.amber+'15',border:`1px solid ${T.amber}40`,borderRadius:6,fontSize:12,color:T.amber,fontWeight:600,marginTop:8}}>
                  PREVIEW: {bannerText}
                </div>
              )}
            </div>
          </div>

          {/* Welcome message + footer */}
          <div style={sty.grid2}>
            <div style={sty.card}>
              <h3 style={sty.cardTitle}>Welcome Message</h3>
              <textarea style={{...sty.input,height:100,resize:'vertical'}} value={welcomeMsg} onChange={e=>setWelcomeMsg(e.target.value)}/>
              <div style={{fontSize:10,color:T.textMut,marginTop:4}}>Shown on the landing page for new sessions</div>
            </div>
            <div style={sty.card}>
              <h3 style={sty.cardTitle}>Footer Customization</h3>
              <textarea style={{...sty.input,height:100,resize:'vertical'}} value={footerText} onChange={e=>setFooterText(e.target.value)}/>
              <div style={{fontSize:10,color:T.textMut,marginTop:4}}>Displayed at the bottom of every page</div>
            </div>
          </div>

          {/* Save */}
          <div style={{...sty.card,display:'flex',gap:12,justifyContent:'flex-end'}}>
            <button style={sty.btn(false)}>Reset to Defaults</button>
            <button style={sty.btn(true)}>Save Settings</button>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/*  TAB 1 — INTEGRATION SETTINGS                                      */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      {tab===1 && (
        <div>
          {/* Integration status */}
          <div style={sty.grid4}>
            <div style={sty.stat}><div style={{...sty.statVal,color:T.green}}>{INTEGRATIONS.filter(i=>i.status==='connected').length}</div><div style={sty.statLbl}>Connected</div></div>
            <div style={sty.stat}><div style={{...sty.statVal,color:T.amber}}>{INTEGRATIONS.filter(i=>i.status==='degraded').length}</div><div style={sty.statLbl}>Degraded</div></div>
            <div style={sty.stat}><div style={{...sty.statVal,color:T.red}}>{INTEGRATIONS.filter(i=>i.status==='disconnected').length}</div><div style={sty.statLbl}>Disconnected</div></div>
            <div style={sty.stat}><div style={{...sty.statVal,color:T.navy}}>{INTEGRATIONS.length}</div><div style={sty.statLbl}>Total Integrations</div></div>
          </div>

          {/* Integration cards */}
          <div style={sty.card}>
            <h3 style={sty.cardTitle}>Data Source Integrations</h3>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
              {INTEGRATIONS.map(intg=>{
                const isTest = testingIntegration===intg.id;
                const result = testResults[intg.id];
                return (
                  <div key={intg.id} style={{padding:16,borderRadius:8,border:`1px solid ${intg.status==='connected'?T.green+'40':intg.status==='degraded'?T.amber+'40':T.red+'40'}`,background:T.surface}}>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
                      <div style={{display:'flex',alignItems:'center',gap:8}}>
                        <span style={sty.statusDot(statusColor(intg.status))}/>
                        <span style={{fontSize:14,fontWeight:600}}>{intg.name}</span>
                      </div>
                      <span style={sty.badge(statusColor(intg.status))}>{intg.status.toUpperCase()}</span>
                    </div>
                    <div style={{fontSize:11,marginBottom:8}}>
                      <div><span style={{color:T.textMut}}>URL:</span> <span style={sty.mono}>{intg.url}</span></div>
                      <div><span style={{color:T.textMut}}>Type:</span> <span style={sty.mono}>{intg.type}</span></div>
                      {intg.apiKey && <div><span style={{color:T.textMut}}>API Key:</span> <span style={sty.mono}>{intg.apiKey}</span></div>}
                      {intg.latency && <div><span style={{color:T.textMut}}>Latency:</span> <span style={{...sty.mono,color:intg.latency<100?T.green:intg.latency<500?T.sage:T.amber}}>{intg.latency}ms</span></div>}
                      <div><span style={{color:T.textMut}}>Last Test:</span> <span style={sty.mono}>{timeAgo(intg.lastTest)}</span></div>
                    </div>
                    <div style={{display:'flex',gap:8}}>
                      <button style={sty.btn(false)} onClick={()=>testIntegration(intg.id)} disabled={isTest}>{isTest?'Testing...':'Test Connection'}</button>
                      <button style={sty.btn(false)}>Configure</button>
                    </div>
                    {result && (
                      <div style={{marginTop:8,padding:8,borderRadius:4,background:result.success?T.green+'10':T.red+'10',fontSize:11,border:`1px solid ${result.success?T.green:T.red}30`}}>
                        <span style={{color:result.success?T.green:T.red,fontWeight:600}}>{result.success?'Connection successful':'Connection failed'}</span>
                        {result.success && <span style={{marginLeft:8,color:T.textMut}}>Latency: {result.latency}ms</span>}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Webhooks */}
          <div style={sty.card}>
            <h3 style={sty.cardTitle}>Webhook Configuration</h3>
            <table style={sty.tbl}>
              <thead>
                <tr><th style={sty.th}>Name</th><th style={sty.th}>URL</th><th style={sty.th}>Events</th><th style={sty.th}>Status</th><th style={sty.th}>Actions</th></tr>
              </thead>
              <tbody>
                {WEBHOOKS.map(wh=>(
                  <tr key={wh.id}>
                    <td style={{...sty.td,fontWeight:600,fontFamily:T.font}}>{wh.name}</td>
                    <td style={sty.td}>{wh.url.slice(0,40)}...</td>
                    <td style={sty.td}><div style={{display:'flex',flexWrap:'wrap',gap:4}}>{wh.events.map(e=><span key={e} style={sty.tag(T.navyL)}>{e}</span>)}</div></td>
                    <td style={sty.td}><span style={sty.badge(wh.status==='active'?T.green:T.amber)}>{wh.status}</span></td>
                    <td style={sty.td}><button style={{...sty.btn(false),padding:'3px 8px',fontSize:10}}>Edit</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{marginTop:12}}><button style={sty.btn(false)}>Add Webhook</button></div>
          </div>

          {/* SSO/SAML + SMTP */}
          <div style={sty.grid2}>
            <div style={sty.card}>
              <h3 style={sty.cardTitle}>SSO / SAML Configuration</h3>
              <div style={sty.fieldRow}>
                <div style={sty.fieldLabel}>SSO Provider</div>
                <select style={sty.select}><option>None (Email/Password)</option><option>Okta</option><option>Azure AD</option><option>Auth0</option><option>Google Workspace</option></select>
              </div>
              <div style={sty.fieldRow}>
                <div style={sty.fieldLabel}>SAML Entity ID</div>
                <input style={{...sty.input,width:200}} placeholder="https://idp.example.com/saml"/>
              </div>
              <div style={sty.fieldRow}>
                <div style={sty.fieldLabel}>SAML SSO URL</div>
                <input style={{...sty.input,width:200}} placeholder="https://idp.example.com/sso"/>
              </div>
              <div style={sty.fieldRow}>
                <div style={sty.fieldLabel}>SAML Certificate</div>
                <button style={sty.btn(false)}>Upload Certificate</button>
              </div>
            </div>

            <div style={sty.card}>
              <h3 style={sty.cardTitle}>SMTP / Email Settings</h3>
              <div style={sty.fieldRow}>
                <div style={sty.fieldLabel}>SMTP Host</div>
                <input style={{...sty.input,width:200}} value="smtp.sendgrid.net" readOnly/>
              </div>
              <div style={sty.fieldRow}>
                <div style={sty.fieldLabel}>SMTP Port</div>
                <input style={{...sty.input,width:100}} value="587" readOnly/>
              </div>
              <div style={sty.fieldRow}>
                <div style={sty.fieldLabel}>SMTP Username</div>
                <input style={{...sty.input,width:200}} value="apikey" readOnly/>
              </div>
              <div style={sty.fieldRow}>
                <div style={sty.fieldLabel}>From Address</div>
                <input style={{...sty.input,width:200}} value="alerts@riskanalytics.com"/>
              </div>
              <div style={{marginTop:12}}><button style={sty.btn(false)}>Send Test Email</button></div>
            </div>
          </div>

          {/* OAuth */}
          <div style={sty.card}>
            <h3 style={sty.cardTitle}>OAuth Client Configuration</h3>
            <table style={sty.tbl}>
              <thead><tr><th style={sty.th}>Client</th><th style={sty.th}>Client ID</th><th style={sty.th}>Redirect URI</th><th style={sty.th}>Scopes</th><th style={sty.th}>Status</th></tr></thead>
              <tbody>
                {[
                  {client:'Frontend SPA',id:'ra-frontend-***',redirect:'http://localhost:3000/callback',scopes:'read,write',status:'active'},
                  {client:'API Client',id:'ra-api-***',redirect:'http://localhost:8001/auth/callback',scopes:'read,write,admin',status:'active'},
                  {client:'Mobile App',id:'ra-mobile-***',redirect:'com.riskanalytics://callback',scopes:'read',status:'inactive'},
                ].map((c,i)=>(
                  <tr key={i}>
                    <td style={{...sty.td,fontWeight:600,fontFamily:T.font}}>{c.client}</td>
                    <td style={sty.td}>{c.id}</td>
                    <td style={sty.td}>{c.redirect}</td>
                    <td style={sty.td}>{c.scopes.split(',').map(s=><span key={s} style={{...sty.tag(T.navyL),marginRight:4}}>{s}</span>)}</td>
                    <td style={sty.td}><span style={sty.badge(c.status==='active'?T.green:T.textMut)}>{c.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/*  TAB 2 — FEATURE FLAGS                                             */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      {tab===2 && (
        <div>
          <div style={sty.grid4}>
            <div style={sty.stat}><div style={{...sty.statVal,color:T.navy}}>{flags.length}</div><div style={sty.statLbl}>Total Flags</div></div>
            <div style={sty.stat}><div style={{...sty.statVal,color:T.green}}>{flags.filter(f=>f.enabled).length}</div><div style={sty.statLbl}>Enabled</div></div>
            <div style={sty.stat}><div style={{...sty.statVal,color:T.textMut}}>{flags.filter(f=>!f.enabled).length}</div><div style={sty.statLbl}>Disabled</div></div>
            <div style={sty.stat}><div style={{...sty.statVal,color:T.gold}}>{[...new Set(flags.map(f=>f.category))].length}</div><div style={sty.statLbl}>Categories</div></div>
          </div>

          {/* Filters */}
          <div style={{...sty.card,display:'flex',gap:8,padding:12,flexWrap:'wrap',alignItems:'center'}}>
            {['all','enabled','disabled'].map(f=>(
              <button key={f} style={sty.btn(flagFilter===f)} onClick={()=>setFlagFilter(f)}>
                {f.charAt(0).toUpperCase()+f.slice(1)}
              </button>
            ))}
            <div style={{width:1,height:20,background:T.borderL}}/>
            {[...new Set(flags.map(f=>f.category))].map(cat=>(
              <button key={cat} style={sty.btn(flagFilter===cat)} onClick={()=>setFlagFilter(flagFilter===cat?'all':cat)}>
                {cat}
              </button>
            ))}
            <input style={{...sty.input,width:200,marginLeft:'auto'}} placeholder="Search flags..." value={flagSearch} onChange={e=>setFlagSearch(e.target.value)}/>
          </div>

          {/* Flags by category */}
          <div style={sty.card}>
            <h3 style={sty.cardTitle}>Feature Flags ({filteredFlags.length})</h3>
            <div style={{maxHeight:600,overflowY:'auto'}}>
              {filteredFlags.map(flag=>(
                <div key={flag.id} style={{...sty.fieldRow,padding:'14px 0'}}>
                  <div style={{flex:1}}>
                    <div style={{display:'flex',alignItems:'center',gap:8}}>
                      <span style={{fontSize:14,fontWeight:600}}>{flag.name}</span>
                      <span style={sty.tag(T.navyL)}>{flag.category}</span>
                      <code style={{fontSize:10,fontFamily:T.mono,color:T.textMut,background:T.surfaceH,padding:'1px 4px',borderRadius:3}}>{flag.id}</code>
                    </div>
                    <div style={{fontSize:12,color:T.textSec,marginTop:3}}>{flag.desc}</div>
                    <div style={{fontSize:10,color:T.textMut,marginTop:3}}>
                      Last toggled: {timeAgo(flag.lastToggled)} by {flag.toggledBy}
                    </div>
                  </div>
                  <button style={sty.toggle(flag.enabled)} onClick={()=>toggleFlag(flag.id)}>
                    <div style={sty.toggleDot(flag.enabled)}/>
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Flag distribution */}
          <div style={sty.grid2}>
            <div style={sty.card}>
              <h3 style={sty.cardTitle}>Flags by Category</h3>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={[...new Set(flags.map(f=>f.category))].map(cat=>({
                    name:cat, value:flags.filter(f=>f.category===cat).length,
                  }))} cx="50%" cy="50%" innerRadius={50} outerRadius={85} dataKey="value" label={({name,value})=>`${name} (${value})`} labelLine={false}>
                    {[...new Set(flags.map(f=>f.category))].map((_,i)=><Cell key={i} fill={PIE_COLORS[i]}/>)}
                  </Pie>
                  <Tooltip contentStyle={{fontSize:11,fontFamily:T.mono,borderRadius:6}}/>
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div style={sty.card}>
              <h3 style={sty.cardTitle}>Enabled vs Disabled</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={[...new Set(flags.map(f=>f.category))].map(cat=>({
                  category:cat,
                  enabled:flags.filter(f=>f.category===cat&&f.enabled).length,
                  disabled:flags.filter(f=>f.category===cat&&!f.enabled).length,
                }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/>
                  <XAxis dataKey="category" tick={{fontSize:9,fill:T.textMut}} stroke={T.borderL}/>
                  <YAxis tick={{fontSize:10,fill:T.textMut}} stroke={T.borderL}/>
                  <Tooltip contentStyle={{fontSize:11,fontFamily:T.mono,borderRadius:6}}/>
                  <Bar dataKey="enabled" fill={T.green} stackId="a" name="Enabled" radius={[0,0,0,0]}/>
                  <Bar dataKey="disabled" fill={T.borderL} stackId="a" name="Disabled" radius={[4,4,0,0]}/>
                  <Legend wrapperStyle={{fontSize:10}}/>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/*  TAB 3 — SYSTEM HEALTH                                             */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      {tab===3 && (
        <div>
          {/* Gauges */}
          <div style={{...sty.card,display:'flex',justifyContent:'space-around',flexWrap:'wrap',gap:12}}>
            <Gauge value={healthMetrics.cpu.toFixed(0)} label="CPU" color={healthMetrics.cpu<50?T.green:healthMetrics.cpu<80?T.amber:T.red}/>
            <Gauge value={healthMetrics.memory.toFixed(0)} label="MEMORY" color={healthMetrics.memory<60?T.green:healthMetrics.memory<85?T.amber:T.red}/>
            <Gauge value={healthMetrics.dbConnections.active} max={healthMetrics.dbConnections.max} label="DB POOL" color={T.navyL}/>
            <Gauge value={healthMetrics.cacheHitRate.toFixed(0)} label="CACHE HIT" color={T.sage}/>
            <Gauge value={(healthMetrics.storage.used/healthMetrics.storage.total*100).toFixed(0)} label="STORAGE" color={T.gold}/>
          </div>

          <div style={sty.grid4}>
            <div style={sty.stat}><div style={{...sty.statVal,color:T.green}}>{healthMetrics.uptime}</div><div style={sty.statLbl}>API Uptime</div></div>
            <div style={sty.stat}><div style={{...sty.statVal,color:T.navyL}}>{healthMetrics.activeSessions}</div><div style={sty.statLbl}>Active Sessions</div></div>
            <div style={sty.stat}><div style={{...sty.statVal,color:healthMetrics.errorRate<0.05?T.green:T.amber}}>{(healthMetrics.errorRate*100).toFixed(2)}%</div><div style={sty.statLbl}>Error Rate</div></div>
            <div style={sty.stat}><div style={{...sty.statVal,color:T.sage}}>{healthMetrics.storage.used}/{healthMetrics.storage.total} GB</div><div style={sty.statLbl}>Storage</div></div>
          </div>

          <div style={sty.grid2}>
            {/* Error rate trend */}
            <div style={sty.card}>
              <h3 style={sty.cardTitle}>Error Rate Trend</h3>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={errorTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/>
                  <XAxis dataKey="month" tick={{fontSize:10,fill:T.textMut}} stroke={T.borderL}/>
                  <YAxis tick={{fontSize:10,fill:T.textMut}} stroke={T.borderL} domain={[0,0.15]}/>
                  <Tooltip contentStyle={{fontSize:11,fontFamily:T.mono,borderRadius:6}}/>
                  <Area type="monotone" dataKey="errorRate" stroke={T.red} fill={T.red} fillOpacity={0.15} strokeWidth={2} name="Error %"/>
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Active sessions */}
            <div style={sty.card}>
              <h3 style={sty.cardTitle}>Active Sessions (24h)</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={sessionTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderL}/>
                  <XAxis dataKey="hour" tick={{fontSize:9,fill:T.textMut}} stroke={T.borderL} interval={2}/>
                  <YAxis tick={{fontSize:10,fill:T.textMut}} stroke={T.borderL}/>
                  <Tooltip contentStyle={{fontSize:11,fontFamily:T.mono,borderRadius:6}}/>
                  <Bar dataKey="sessions" fill={T.navyL} radius={[4,4,0,0]} name="Sessions"/>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Background jobs */}
          <div style={sty.grid3}>
            <div style={sty.card}>
              <h3 style={sty.cardTitle}>Background Job Queue</h3>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:12,textAlign:'center'}}>
                <div><div style={{fontSize:24,fontWeight:700,fontFamily:T.mono,color:T.amber}}>{healthMetrics.bgJobs.queued}</div><div style={{fontSize:10,color:T.textMut}}>QUEUED</div></div>
                <div><div style={{fontSize:24,fontWeight:700,fontFamily:T.mono,color:T.navyL}}>{healthMetrics.bgJobs.running}</div><div style={{fontSize:10,color:T.textMut}}>RUNNING</div></div>
                <div><div style={{fontSize:24,fontWeight:700,fontFamily:T.mono,color:T.red}}>{healthMetrics.bgJobs.failed}</div><div style={{fontSize:10,color:T.textMut}}>FAILED</div></div>
              </div>
            </div>

            <div style={sty.card}>
              <h3 style={sty.cardTitle}>DB Connection Pool</h3>
              <div style={{textAlign:'center',marginBottom:8}}>
                <span style={{fontSize:24,fontWeight:700,fontFamily:T.mono,color:T.navyL}}>{healthMetrics.dbConnections.active}</span>
                <span style={{fontSize:14,color:T.textMut}}> / {healthMetrics.dbConnections.max}</span>
              </div>
              <div style={sty.pbar(healthMetrics.dbConnections.active/healthMetrics.dbConnections.max*100, T.navyL)}>
                <div style={sty.pbarFill(healthMetrics.dbConnections.active/healthMetrics.dbConnections.max*100, T.navyL)}/>
              </div>
              <div style={{fontSize:10,color:T.textMut,marginTop:4,textAlign:'center'}}>Active connections</div>
            </div>

            <div style={sty.card}>
              <h3 style={sty.cardTitle}>Cache Performance</h3>
              <div style={{textAlign:'center',marginBottom:8}}>
                <span style={{fontSize:24,fontWeight:700,fontFamily:T.mono,color:T.sage}}>{healthMetrics.cacheHitRate.toFixed(1)}%</span>
              </div>
              <div style={sty.pbar(healthMetrics.cacheHitRate, T.sage)}>
                <div style={sty.pbarFill(healthMetrics.cacheHitRate, T.sage)}/>
              </div>
              <div style={{fontSize:10,color:T.textMut,marginTop:4,textAlign:'center'}}>Hit rate (Redis)</div>
            </div>
          </div>

          {/* Build & deployment */}
          <div style={sty.card}>
            <h3 style={sty.cardTitle}>Build & Deployment Information</h3>
            <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:16}}>
              {[
                {label:'Build Version',value:healthMetrics.buildVersion},
                {label:'Build Date',value:fmtDate(healthMetrics.buildDate)},
                {label:'Environment',value:healthMetrics.environment},
                {label:'Node.js',value:healthMetrics.nodeVersion},
                {label:'React',value:healthMetrics.reactVersion},
                {label:'FastAPI',value:healthMetrics.fastapiVersion},
                {label:'Database',value:'PostgreSQL 15.4'},
                {label:'Cache',value:'Redis 7.2'},
              ].map((info,i)=>(
                <div key={i} style={{padding:10,background:T.surfaceH,borderRadius:6,border:`1px solid ${T.borderL}`}}>
                  <div style={{fontSize:10,color:T.textMut,textTransform:'uppercase',marginBottom:2}}>{info.label}</div>
                  <div style={{fontSize:13,fontWeight:600,fontFamily:T.mono}}>{info.value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Environment variables */}
          <div style={sty.card}>
            <h3 style={sty.cardTitle}>Environment Variables (Masked)</h3>
            <div style={{maxHeight:350,overflowY:'auto'}}>
              <table style={sty.tbl}>
                <thead>
                  <tr><th style={sty.th}>Key</th><th style={sty.th}>Value</th><th style={sty.th}>Sensitive</th></tr>
                </thead>
                <tbody>
                  {envVars.map((ev,i)=>(
                    <tr key={i}>
                      <td style={{...sty.td,fontWeight:600}}>{ev.key}</td>
                      <td style={sty.td}>{ev.sensitive ? <span style={{color:T.textMut}}>{'*'.repeat(Math.min(30, ev.value.length))}</span> : ev.value}</td>
                      <td style={sty.td}>{ev.sensitive ? <span style={sty.badge(T.amber)}>MASKED</span> : <span style={{color:T.textMut}}>public</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Log level + perf benchmarks */}
          <div style={sty.grid2}>
            <div style={sty.card}>
              <h3 style={sty.cardTitle}>Log Level Selector</h3>
              <div style={{display:'flex',gap:8,marginBottom:12}}>
                {['DEBUG','INFO','WARNING','ERROR','CRITICAL'].map(level=>(
                  <button key={level} style={sty.btn(logLevel===level)} onClick={()=>setLogLevel(level)}>{level}</button>
                ))}
              </div>
              <div style={{fontSize:11,color:T.textMut}}>
                Current level: <span style={{fontWeight:600,color:T.navy}}>{logLevel}</span>. All logs at this level and above will be captured.
                {logLevel === 'DEBUG' && <span style={{color:T.amber,display:'block',marginTop:4}}>Warning: DEBUG mode generates high log volume and may impact performance.</span>}
              </div>
            </div>

            <div style={sty.card}>
              <h3 style={sty.cardTitle}>Performance Benchmarks</h3>
              <table style={sty.tbl}>
                <thead><tr><th style={sty.th}>Metric</th><th style={sty.th}>Current</th><th style={sty.th}>Target</th><th style={sty.th}>Status</th></tr></thead>
                <tbody>
                  {[
                    {metric:'API Response (P50)',current:'45ms',target:'<100ms',ok:true},
                    {metric:'API Response (P95)',current:'230ms',target:'<500ms',ok:true},
                    {metric:'Page Load Time',current:'1.8s',target:'<3s',ok:true},
                    {metric:'Bundle Size',current:'3.63MB',target:'<5MB',ok:true},
                    {metric:'DB Query (P95)',current:'120ms',target:'<200ms',ok:true},
                    {metric:'Engine Throughput',current:'850/s',target:'>500/s',ok:true},
                    {metric:'WebSocket Latency',current:'35ms',target:'<50ms',ok:true},
                    {metric:'Memory Leak Rate',current:'0.02MB/h',target:'<0.1MB/h',ok:true},
                  ].map((b,i)=>(
                    <tr key={i}>
                      <td style={{...sty.td,fontFamily:T.font,fontWeight:500}}>{b.metric}</td>
                      <td style={{...sty.td,fontWeight:600}}>{b.current}</td>
                      <td style={sty.td}>{b.target}</td>
                      <td style={sty.td}><span style={sty.badge(b.ok?T.green:T.red)}>{b.ok?'PASS':'FAIL'}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
