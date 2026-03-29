import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, Cell } from 'recharts';
import { GLOBAL_COMPANY_MASTER } from '../../../data/globalCompanyMaster';

/* ══════════════════════════════════════════════════════════════
   THEME
   ══════════════════════════════════════════════════════════════ */
const T = { bg:'#f6f4f0', surface:'#ffffff', surfaceH:'#f0ede7', border:'#e5e0d8', borderL:'#d5cfc5', navy:'#1b3a5c', navyL:'#2c5a8c', gold:'#c5a96a', goldL:'#d4be8a', sage:'#5a8a6a', sageL:'#7ba67d', text:'#1b3a5c', textSec:'#5c6b7e', textMut:'#9aa3ae', red:'#dc2626', green:'#16a34a', amber:'#d97706', font:"'Inter','SF Pro Display',system-ui,-apple-system,sans-serif" };

const sr=(s)=>{let x=Math.sin(s+1)*10000;return x-Math.floor(x);};
let _sc=1000;

const loadLS = (k) => { try { return JSON.parse(localStorage.getItem(k)) || null; } catch { return null; } };
const saveLS = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };
const LS_PORTFOLIO = 'ra_portfolio_v1';
const LS_FEED_CFG = 'ra_feed_config_v1';
const LS_FEED_LOG = 'ra_feed_log_v1';
const LS_FEED_KEYS = 'ra_feed_api_keys_v1';
const coverageColor = v => v >= 75 ? T.green : v >= 55 ? T.sage : v >= 40 ? T.amber : T.red;
const statusColor = s => s === 'active' ? T.green : s === 'error' ? T.red : T.amber;

/* ══════════════════════════════════════════════════════════════
   EXCHANGE FEEDS — 14 exchanges
   ══════════════════════════════════════════════════════════════ */
const EXCHANGE_FEEDS = [
  { exchange:'NSE/BSE', country:'India', eodhd_code:'NSE', av_suffix:'.BSE', companies:30, status:'active', last_update:'2025-03-25', update_frequency:'Daily', data_source:'BRSR + EODHD', fields_covered:28, fields_total:35, coverage_pct:80, brsr_integrated:true },
  { exchange:'NYSE/NASDAQ', country:'USA', eodhd_code:'US', av_suffix:'', companies:108, status:'active', last_update:'2025-03-25', update_frequency:'Daily', data_source:'EODHD + Alpha Vantage', fields_covered:22, fields_total:35, coverage_pct:63, brsr_integrated:false },
  { exchange:'LSE', country:'UK', eodhd_code:'LSE', av_suffix:'.LON', companies:70, status:'active', last_update:'2025-03-24', update_frequency:'Daily', data_source:'EODHD', fields_covered:20, fields_total:35, coverage_pct:57, brsr_integrated:false },
  { exchange:'XETRA', country:'Germany', eodhd_code:'XETRA', av_suffix:'.DEX', companies:53, status:'active', last_update:'2025-03-24', update_frequency:'Daily', data_source:'EODHD', fields_covered:20, fields_total:35, coverage_pct:57, brsr_integrated:false },
  { exchange:'Euronext', country:'France', eodhd_code:'PA', av_suffix:'.PAR', companies:50, status:'active', last_update:'2025-03-24', update_frequency:'Daily', data_source:'EODHD', fields_covered:19, fields_total:35, coverage_pct:54, brsr_integrated:false },
  { exchange:'TSE', country:'Japan', eodhd_code:'TSE', av_suffix:'.TYO', companies:57, status:'active', last_update:'2025-03-23', update_frequency:'Daily', data_source:'EODHD', fields_covered:18, fields_total:35, coverage_pct:51, brsr_integrated:false },
  { exchange:'HKEX', country:'Hong Kong', eodhd_code:'HK', av_suffix:'.HKG', companies:37, status:'active', last_update:'2025-03-23', update_frequency:'Daily', data_source:'EODHD', fields_covered:18, fields_total:35, coverage_pct:51, brsr_integrated:false },
  { exchange:'ASX', country:'Australia', eodhd_code:'AU', av_suffix:'.AX', companies:35, status:'active', last_update:'2025-03-23', update_frequency:'Daily', data_source:'EODHD', fields_covered:17, fields_total:35, coverage_pct:49, brsr_integrated:false },
  { exchange:'SGX', country:'Singapore', eodhd_code:'SG', av_suffix:'.SI', companies:30, status:'active', last_update:'2025-03-23', update_frequency:'Daily', data_source:'EODHD', fields_covered:17, fields_total:35, coverage_pct:49, brsr_integrated:false },
  { exchange:'KRX', country:'S. Korea', eodhd_code:'KO', av_suffix:'.KS', companies:35, status:'active', last_update:'2025-03-22', update_frequency:'Daily', data_source:'EODHD', fields_covered:16, fields_total:35, coverage_pct:46, brsr_integrated:false },
  { exchange:'SSE/SZSE', country:'China', eodhd_code:'SHG', av_suffix:'.SHH', companies:56, status:'active', last_update:'2025-03-22', update_frequency:'Daily', data_source:'EODHD', fields_covered:16, fields_total:35, coverage_pct:46, brsr_integrated:false },
  { exchange:'B3', country:'Brazil', eodhd_code:'SA', av_suffix:'.SAO', companies:30, status:'active', last_update:'2025-03-22', update_frequency:'Daily', data_source:'EODHD', fields_covered:15, fields_total:35, coverage_pct:43, brsr_integrated:false },
  { exchange:'JSE', country:'S. Africa', eodhd_code:'JSE', av_suffix:'.JNB', companies:30, status:'active', last_update:'2025-03-21', update_frequency:'Daily', data_source:'EODHD', fields_covered:15, fields_total:35, coverage_pct:43, brsr_integrated:false },
  { exchange:'TSX', country:'Canada', eodhd_code:'TO', av_suffix:'.TRT', companies:35, status:'active', last_update:'2025-03-21', update_frequency:'Daily', data_source:'EODHD', fields_covered:16, fields_total:35, coverage_pct:46, brsr_integrated:false },
];

/* ══════════════════════════════════════════════════════════════
   EODHD / ALPHA VANTAGE ENDPOINTS
   ══════════════════════════════════════════════════════════════ */
const EODHD_ENDPOINTS = {
  fundamentals: { url:'https://eodhd.com/api/fundamentals/{ticker}.{exchange}?api_token={key}&fmt=json', fields:['General','Highlights','Valuation','SharesStats','Technicals','ESGScores'], rate:'20/day (free), 100K/day (paid)' },
  eod_prices: { url:'https://eodhd.com/api/eod/{ticker}.{exchange}?api_token={key}&fmt=json', fields:['close','high','low','volume','adjusted_close'], rate:'Same' },
  bulk: { url:'https://eodhd.com/api/eod-bulk-last-day/{exchange}?api_token={key}&fmt=json', fields:['All tickers for exchange in one call'], rate:'1 call = entire exchange' },
  live: { url:'https://eodhd.com/api/real-time/{ticker}.{exchange}?api_token={key}&fmt=json', fields:['open','high','low','close','volume','timestamp'], rate:'Delayed 15min (free)' },
};

const AV_ENDPOINTS = {
  daily: { url:'https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol={ticker}{suffix}&apikey={key}', fields:['open','high','low','close','volume'] },
  sma: { url:'https://www.alphavantage.co/query?function=SMA&symbol={ticker}{suffix}&interval=daily&time_period={period}&series_type=close&apikey={key}', fields:['SMA'] },
  overview: { url:'https://www.alphavantage.co/query?function=OVERVIEW&symbol={ticker}{suffix}&apikey={key}', fields:['MarketCap','EBITDA','PERatio','DividendYield','52WeekHigh','52WeekLow'] },
};

/* Coverage gap fields */
const COVERAGE_FIELDS = ['ESG Score','Scope 1','Scope 2','Revenue','Market Cap','Sector','Net Zero','SBTi','Board Diversity','Transition Risk'];

const FIELD_MAPPING = [
  { platform_field:'esg_score', eodhd_field:'ESGScores.totalEsg', source:'Fundamentals API', transform:'Normalize 0-100', availability:'~40% coverage' },
  { platform_field:'market_cap_usd_mn', eodhd_field:'Highlights.MarketCapitalization', source:'Fundamentals API', transform:'/ 1,000,000 to Mn', availability:'95%' },
  { platform_field:'revenue_usd_mn', eodhd_field:'Highlights.Revenue', source:'Fundamentals API', transform:'/ 1,000,000 + FX', availability:'90%' },
  { platform_field:'pe_ratio', eodhd_field:'Highlights.PERatio', source:'Fundamentals API', transform:'Direct', availability:'85%' },
  { platform_field:'dividend_yield', eodhd_field:'Highlights.DividendYield', source:'Fundamentals API', transform:'× 100 to %', availability:'80%' },
  { platform_field:'52w_high', eodhd_field:'Technicals.52WeekHigh', source:'Fundamentals API', transform:'Direct', availability:'95%' },
  { platform_field:'52w_low', eodhd_field:'Technicals.52WeekLow', source:'Fundamentals API', transform:'Direct', availability:'95%' },
  { platform_field:'close_price', eodhd_field:'adjusted_close', source:'EOD Prices API', transform:'FX to USD', availability:'99%' },
  { platform_field:'volume', eodhd_field:'volume', source:'EOD Prices API', transform:'Direct', availability:'99%' },
  { platform_field:'shares_outstanding', eodhd_field:'SharesStats.SharesOutstanding', source:'Fundamentals API', transform:'Direct', availability:'85%' },
  { platform_field:'beta', eodhd_field:'Technicals.Beta', source:'Fundamentals API', transform:'Direct', availability:'75%' },
  { platform_field:'sector', eodhd_field:'General.Sector', source:'Fundamentals API', transform:'Map to GICS', availability:'95%' },
  { platform_field:'country', eodhd_field:'General.CountryISO', source:'Fundamentals API', transform:'ISO 3166-1 alpha-2', availability:'98%' },
  { platform_field:'exchange', eodhd_field:'General.Exchange', source:'Fundamentals API', transform:'Map to standard codes', availability:'99%' },
  { platform_field:'currency', eodhd_field:'General.CurrencyCode', source:'Fundamentals API', transform:'ISO 4217', availability:'99%' },
  { platform_field:'ebitda_usd_mn', eodhd_field:'Highlights.EBITDA', source:'Fundamentals API', transform:'/ 1,000,000 + FX', availability:'82%' },
  { platform_field:'roe_pct', eodhd_field:'Highlights.ReturnOnEquityTTM', source:'Fundamentals API', transform:'× 100 to %', availability:'78%' },
  { platform_field:'debt_equity', eodhd_field:'Highlights.DebtToEquity', source:'Fundamentals API', transform:'Direct ratio', availability:'75%' },
  { platform_field:'profit_margin', eodhd_field:'Highlights.ProfitMargin', source:'Fundamentals API', transform:'× 100 to %', availability:'80%' },
  { platform_field:'esg_env', eodhd_field:'ESGScores.environmentScore', source:'Fundamentals API', transform:'Normalize 0-100', availability:'~35%' },
  { platform_field:'esg_soc', eodhd_field:'ESGScores.socialScore', source:'Fundamentals API', transform:'Normalize 0-100', availability:'~35%' },
  { platform_field:'esg_gov', eodhd_field:'ESGScores.governanceScore', source:'Fundamentals API', transform:'Normalize 0-100', availability:'~35%' },
  { platform_field:'sma_50', eodhd_field:'Technicals.50DayMA', source:'Fundamentals API', transform:'Direct', availability:'90%' },
  { platform_field:'sma_200', eodhd_field:'Technicals.200DayMA', source:'Fundamentals API', transform:'Direct', availability:'90%' },
];

/* ══════════════════════════════════════════════════════════════
   UI PRIMITIVES
   ══════════════════════════════════════════════════════════════ */
const Card = ({ children, style, onClick }) => (
  <div onClick={onClick} style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:10, padding:20, cursor:onClick?'pointer':'default', transition:'box-shadow .15s', ...style }}
    onMouseEnter={e => { if(onClick) e.currentTarget.style.boxShadow='0 4px 16px rgba(27,58,92,.10)'; }}
    onMouseLeave={e => { e.currentTarget.style.boxShadow='none'; }}>
    {children}
  </div>
);
const Badge = ({ children, color = T.navy, bg }) => (
  <span style={{ display:'inline-block', padding:'3px 10px', borderRadius:20, fontSize:11, fontWeight:600, color, background:bg || (color + '18'), whiteSpace:'nowrap', letterSpacing:'.3px' }}>{children}</span>
);
const Btn = ({ children, onClick, primary, small, disabled, style }) => (
  <button disabled={disabled} onClick={onClick} style={{ padding:small?'5px 12px':'8px 18px', borderRadius:7, border:primary?'none':`1px solid ${T.border}`, background:primary?T.navy:T.surface, color:primary?'#fff':T.text, fontSize:small?11:13, fontWeight:600, cursor:disabled?'not-allowed':'pointer', opacity:disabled?.5:1, fontFamily:T.font, transition:'all .15s', ...style }}>{children}</button>
);
const SortIcon = ({ col, sortCol, sortDir }) => col === sortCol ? (sortDir === 'asc' ? ' \u25B2' : ' \u25BC') : ' \u25BD';

/* ══════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ══════════════════════════════════════════════════════════════ */
export default function LiveFeedManagerPage() {
  const navigate = useNavigate();
  const portfolio = useMemo(() => loadLS(LS_PORTFOLIO) || [], []);
  const companies = useMemo(() => GLOBAL_COMPANY_MASTER || [], []);

  /* Sort state */
  const [sortCol, setSortCol] = useState('exchange');
  const [sortDir, setSortDir] = useState('asc');
  const toggleSort = col => { setSortDir(sortCol === col && sortDir === 'asc' ? 'desc' : 'asc'); setSortCol(col); };

  /* Feed config (persisted) */
  const defaultCfg = useMemo(() => EXCHANGE_FEEDS.reduce((a, f) => { a[f.exchange] = { enabled:true, frequency:'daily', time:'06:00' }; return a; }, {}), []);
  const [feedCfg, setFeedCfg] = useState(() => loadLS(LS_FEED_CFG) || defaultCfg);
  useEffect(() => { saveLS(LS_FEED_CFG, feedCfg); }, [feedCfg]);
  const updateCfg = (exch, key, val) => setFeedCfg(prev => ({ ...prev, [exch]: { ...prev[exch], [key]:val } }));

  /* API keys (persisted, masked) */
  const [apiKeys, setApiKeys] = useState(() => loadLS(LS_FEED_KEYS) || { eodhd:'', av:'', supabase:'' });
  useEffect(() => { saveLS(LS_FEED_KEYS, apiKeys); }, [apiKeys]);
  const [showKey, setShowKey] = useState({ eodhd:false, av:false, supabase:false });
  const maskKey = (k) => k ? k.slice(0,4) + '****' + k.slice(-4) : '';

  /* Simulated connection tests */
  const [eodhdStatus, setEodhdStatus] = useState(null);
  const [avStatus, setAvStatus] = useState(null);
  const [supabaseStatus, setSupabaseStatus] = useState(null);
  const testConnection = (type) => {
    const setter = type === 'eodhd' ? setEodhdStatus : type === 'av' ? setAvStatus : setSupabaseStatus;
    setter('testing');
    setTimeout(() => setter(apiKeys[type] ? 'connected' : 'error'), 1200);
  };

  /* Selected endpoint for preview */
  const [selEndpoint, setSelEndpoint] = useState('fundamentals');
  const [selAvEndpoint, setSelAvEndpoint] = useState('daily');
  const [avPeriod, setAvPeriod] = useState(50);

  /* Feed execution log */
  const [feedLog, setFeedLog] = useState(() => loadLS(LS_FEED_LOG) || generateInitialLog());
  useEffect(() => { saveLS(LS_FEED_LOG, feedLog.slice(0, 200)); }, [feedLog]);

  /* Refresh simulation */
  const [refreshing, setRefreshing] = useState({});
  const [bulkRefreshing, setBulkRefreshing] = useState(false);
  const [bulkProgress, setBulkProgress] = useState(0);

  const simulateRefresh = (exch) => {
    setRefreshing(prev => ({ ...prev, [exch]:true }));
    setTimeout(() => {
      setRefreshing(prev => ({ ...prev, [exch]:false }));
      setFeedLog(prev => [{ timestamp:new Date().toISOString(), exchange:exch, records:Math.floor(sr(_sc++)*50)+10, duration:`${(sr(_sc++)*3+0.5).toFixed(1)}s`, status:'success' }, ...prev]);
    }, 2000);
  };

  const simulateBulkRefresh = () => {
    setBulkRefreshing(true); setBulkProgress(0);
    let i = 0;
    const interval = setInterval(() => {
      i++;
      setBulkProgress(Math.round((i / EXCHANGE_FEEDS.length) * 100));
      if (i >= EXCHANGE_FEEDS.length) {
        clearInterval(interval);
        setBulkRefreshing(false);
        setFeedLog(prev => [{ timestamp:new Date().toISOString(), exchange:'ALL (Bulk)', records:EXCHANGE_FEEDS.reduce((s,f) => s+f.companies,0), duration:'18.4s', status:'success' }, ...prev]);
      }
    }, 400);
  };

  /* Error / retry state */
  const [errors, setErrors] = useState([
    { exchange:'JSE', error:'Timeout after 30s', retries:2, last_attempt:'2025-03-24 14:22:00' },
    { exchange:'B3', error:'Rate limit exceeded (429)', retries:1, last_attempt:'2025-03-24 13:50:00' },
  ]);
  const retryFeed = (exch) => {
    setErrors(prev => prev.filter(e => e.exchange !== exch));
    simulateRefresh(exch);
  };

  /* BRSR table info */
  const BRSR_TABLES = [
    { table:'brsr_core_metrics', rows:1323, last_sync:'2025-03-23', status:'synced' },
    { table:'brsr_ghg_emissions', rows:1180, last_sync:'2025-03-23', status:'synced' },
    { table:'brsr_water_waste', rows:987, last_sync:'2025-03-22', status:'synced' },
    { table:'brsr_social_indicators', rows:1102, last_sync:'2025-03-22', status:'synced' },
    { table:'brsr_governance', rows:890, last_sync:'2025-03-21', status:'stale' },
    { table:'brsr_crosswalk', rows:245, last_sync:'2025-03-20', status:'sparse' },
  ];

  /* Heatmap data generation */
  const heatmapData = useMemo(() => {
    const fieldCoverage = {
      'NSE/BSE':[95,90,85,92,95,98,75,60,80,70], 'NYSE/NASDAQ':[60,45,40,95,98,99,55,50,65,50],
      'LSE':[55,40,35,90,95,98,50,45,60,45], 'XETRA':[50,38,32,88,92,95,48,42,55,40],
      'Euronext':[48,35,30,85,90,93,45,40,50,38], 'TSE':[45,30,25,90,92,95,40,35,45,35],
      'HKEX':[45,32,28,88,90,93,38,32,42,32], 'ASX':[42,28,22,85,88,90,35,30,40,30],
      'SGX':[40,25,20,82,85,88,32,28,38,28], 'KRX':[38,22,18,85,88,90,30,25,35,25],
      'SSE/SZSE':[35,20,15,80,85,88,28,22,30,22], 'B3':[32,18,12,78,82,85,25,20,28,20],
      'JSE':[30,15,10,75,80,82,22,18,25,18], 'TSX':[38,22,18,85,88,92,30,25,35,25],
    };
    return EXCHANGE_FEEDS.map(f => ({ exchange:f.exchange, fields:fieldCoverage[f.exchange] || Array(10).fill(30) }));
  }, []);

  /* EODHD rate limit gauge */
  const eodhdCallsToday = 47;
  const eodhdCallsMax = 100000;
  const avCallsToday = 12;
  const avCallsMax = 500;

  /* ── Sorted exchange data ── */
  const sortedExchanges = useMemo(() => {
    const data = EXCHANGE_FEEDS.map(f => ({ ...f, coverage_pct:f.coverage_pct || Math.round((f.fields_covered||15)/(f.fields_total||35)*100) }));
    return [...data].sort((a, b) => {
      let va = a[sortCol], vb = b[sortCol];
      if (typeof va === 'string') { va = va.toLowerCase(); vb = (vb||'').toLowerCase(); }
      if (va < vb) return sortDir === 'asc' ? -1 : 1;
      if (va > vb) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
  }, [sortCol, sortDir]);

  /* ── KPIs ── */
  const totalCompanies = EXCHANGE_FEEDS.reduce((s,f) => s + f.companies, 0);
  const avgCoverage = Math.round(EXCHANGE_FEEDS.reduce((s,f) => s + (f.coverage_pct||50), 0) / EXCHANGE_FEEDS.length);
  const brsrCount = EXCHANGE_FEEDS.filter(f => f.brsr_integrated).length;
  const lastGlobalUpdate = '2025-03-25 06:00 UTC';
  const freshness = useMemo(() => {
    const now = new Date('2025-03-25T18:00:00Z');
    return EXCHANGE_FEEDS.map(f => {
      const d = new Date(f.last_update + 'T06:00:00Z');
      return { exchange:f.exchange, hours:Math.round((now - d) / 3600000) };
    });
  }, []);
  const avgFreshness = Math.round(freshness.reduce((s,f) => s + f.hours, 0) / freshness.length);
  const pendingUpdates = EXCHANGE_FEEDS.filter(f => {
    const h = freshness.find(x => x.exchange === f.exchange);
    return h && h.hours > 24;
  }).length;

  /* ── Exports ── */
  const exportCSV = (rows, filename) => {
    if (!rows.length) return;
    const keys = Object.keys(rows[0]);
    const csv = [keys.join(','), ...rows.map(r => keys.map(k => `"${r[k]??''}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type:'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = filename; a.click(); URL.revokeObjectURL(url);
  };
  const exportJSON = (data, filename) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type:'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = filename; a.click(); URL.revokeObjectURL(url);
  };
  const printPage = () => window.print();

  /* ══════════════════════════════════════════════════════════════
     RENDER
     ══════════════════════════════════════════════════════════════ */
  const thStyle = { padding:'10px 12px', textAlign:'left', borderBottom:`2px solid ${T.border}`, fontSize:12, fontWeight:700, color:T.textSec, cursor:'pointer', userSelect:'none', whiteSpace:'nowrap' };
  const tdStyle = { padding:'10px 12px', borderBottom:`1px solid ${T.border}`, fontSize:13 };

  return (
    <div style={{ fontFamily:T.font, background:T.bg, minHeight:'100vh', padding:'24px 32px', color:T.text }}>
      {/* ── S1: Header ── */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:28 }}>
        <div>
          <h1 style={{ fontSize:28, fontWeight:700, color:T.navy, margin:0 }}>Live Feed Manager</h1>
          <p style={{ color:T.textSec, fontSize:13, margin:'4px 0 0' }}>Real-time & scheduled data feeds across global exchanges</p>
        </div>
        <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}>
          <Badge color={T.navy}>14 Exchanges</Badge>
          <Badge color={T.sage}>EODHD</Badge>
          <Badge color={T.gold} bg={T.gold+'20'}>Alpha Vantage</Badge>
          <Badge color={T.green}>BRSR</Badge>
          <Btn small onClick={() => exportCSV(EXCHANGE_FEEDS, 'exchange_feeds.csv')}>CSV</Btn>
          <Btn small onClick={() => exportJSON(EXCHANGE_FEEDS, 'exchange_feeds.json')}>JSON</Btn>
          <Btn small onClick={printPage}>Print</Btn>
        </div>
      </div>

      {/* ── S2: KPI Cards ── */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(170px,1fr))', gap:14, marginBottom:28 }}>
        {[
          { label:'Exchanges Connected', value:EXCHANGE_FEEDS.length, color:T.navy },
          { label:'Companies Covered', value:totalCompanies.toLocaleString(), color:T.sage },
          { label:'Avg Coverage %', value:`${avgCoverage}%`, color:coverageColor(avgCoverage) },
          { label:'Last Global Update', value:'Mar 25, 06:00', color:T.navy, small:true },
          { label:'BRSR-Integrated', value:`${brsrCount} / ${EXCHANGE_FEEDS.length}`, color:T.green },
          { label:'EODHD Calls Today', value:eodhdCallsToday, color:T.navyL },
          { label:'AV Calls Today', value:avCallsToday, color:T.gold },
          { label:'Data Freshness (avg)', value:`${avgFreshness}h`, color:avgFreshness > 36 ? T.red : T.sage },
          { label:'Pending Updates', value:pendingUpdates, color:pendingUpdates > 3 ? T.red : T.amber },
          { label:'Error Count', value:errors.length, color:errors.length > 0 ? T.red : T.green },
        ].map((kpi, i) => (
          <Card key={i} style={{ padding:16, textAlign:'center' }}>
            <div style={{ fontSize:kpi.small?16:24, fontWeight:700, color:kpi.color }}>{kpi.value}</div>
            <div style={{ fontSize:11, color:T.textMut, marginTop:4 }}>{kpi.label}</div>
          </Card>
        ))}
      </div>

      {/* ── S3: Exchange Status Table ── */}
      <Card style={{ marginBottom:28, overflowX:'auto' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
          <h2 style={{ fontSize:16, fontWeight:700, margin:0 }}>Exchange Status</h2>
          <Btn small primary onClick={simulateBulkRefresh} disabled={bulkRefreshing}>{bulkRefreshing ? `Refreshing ${bulkProgress}%` : 'Refresh All'}</Btn>
        </div>
        {bulkRefreshing && <div style={{ height:4, background:T.border, borderRadius:2, marginBottom:12 }}><div style={{ height:4, background:T.sage, borderRadius:2, width:`${bulkProgress}%`, transition:'width .3s' }}/></div>}
        <table style={{ width:'100%', borderCollapse:'collapse' }}>
          <thead>
            <tr>
              {['exchange','country','companies','status','last_update','coverage_pct','data_source','brsr_integrated'].map(col => (
                <th key={col} style={thStyle} onClick={() => toggleSort(col)}>
                  {col.replace(/_/g,' ').replace(/\b\w/g,c=>c.toUpperCase())}<SortIcon col={col} sortCol={sortCol} sortDir={sortDir}/>
                </th>
              ))}
              <th style={{...thStyle, cursor:'default'}}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {sortedExchanges.map((f, i) => (
              <tr key={i} style={{ background:i%2===0?'transparent':T.surfaceH }}>
                <td style={{...tdStyle, fontWeight:600}}>{f.exchange}</td>
                <td style={tdStyle}>{f.country}</td>
                <td style={{...tdStyle, textAlign:'center'}}>{f.companies}</td>
                <td style={tdStyle}><Badge color={statusColor(f.status)}>{f.status}</Badge></td>
                <td style={tdStyle}>{f.last_update}</td>
                <td style={tdStyle}>
                  <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                    <div style={{ width:60, height:6, background:T.border, borderRadius:3 }}>
                      <div style={{ width:`${f.coverage_pct}%`, height:6, background:coverageColor(f.coverage_pct), borderRadius:3 }}/>
                    </div>
                    <span style={{ fontSize:12, color:coverageColor(f.coverage_pct), fontWeight:600 }}>{f.coverage_pct}%</span>
                  </div>
                </td>
                <td style={{...tdStyle, fontSize:11}}>{f.data_source || 'EODHD'}</td>
                <td style={{...tdStyle, textAlign:'center'}}>{f.brsr_integrated ? <span style={{color:T.green}}>Yes</span> : <span style={{color:T.textMut}}>--</span>}</td>
                <td style={tdStyle}><Btn small onClick={() => simulateRefresh(f.exchange)} disabled={refreshing[f.exchange]}>{refreshing[f.exchange] ? 'Refreshing...' : 'Refresh'}</Btn></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {/* ── S4: Coverage Gap Heatmap ── */}
      <Card style={{ marginBottom:28, overflowX:'auto' }}>
        <h2 style={{ fontSize:16, fontWeight:700, margin:'0 0 14px' }}>Coverage Gap Heatmap</h2>
        <table style={{ width:'100%', borderCollapse:'collapse', fontSize:11 }}>
          <thead>
            <tr>
              <th style={{...thStyle, fontSize:11, minWidth:80}}>Exchange</th>
              {COVERAGE_FIELDS.map(f => <th key={f} style={{...thStyle, fontSize:10, textAlign:'center', padding:'8px 4px', minWidth:65}}>{f}</th>)}
            </tr>
          </thead>
          <tbody>
            {heatmapData.map((row, ri) => (
              <tr key={ri}>
                <td style={{...tdStyle, fontWeight:600, fontSize:11}}>{row.exchange}</td>
                {row.fields.map((v, ci) => (
                  <td key={ci} style={{ ...tdStyle, textAlign:'center', padding:'6px 4px', background:v >= 75 ? T.green+'22' : v >= 50 ? T.sage+'18' : v >= 30 ? T.amber+'18' : T.red+'18', color:coverageColor(v), fontWeight:600, fontSize:11 }}>{v}%</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ display:'flex', gap:16, marginTop:10, fontSize:11, color:T.textMut }}>
          <span><span style={{ display:'inline-block', width:12, height:12, background:T.green+'22', borderRadius:2, marginRight:4, verticalAlign:'middle' }}/> 75%+</span>
          <span><span style={{ display:'inline-block', width:12, height:12, background:T.sage+'18', borderRadius:2, marginRight:4, verticalAlign:'middle' }}/> 50-74%</span>
          <span><span style={{ display:'inline-block', width:12, height:12, background:T.amber+'18', borderRadius:2, marginRight:4, verticalAlign:'middle' }}/> 30-49%</span>
          <span><span style={{ display:'inline-block', width:12, height:12, background:T.red+'18', borderRadius:2, marginRight:4, verticalAlign:'middle' }}/> &lt;30%</span>
        </div>
      </Card>

      {/* ── S5: EODHD Integration Panel ── */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20, marginBottom:28 }}>
        <Card>
          <h2 style={{ fontSize:16, fontWeight:700, margin:'0 0 14px' }}>EODHD Integration</h2>
          <div style={{ marginBottom:12 }}>
            <label style={{ fontSize:12, fontWeight:600, color:T.textSec }}>API Key</label>
            <div style={{ display:'flex', gap:8, marginTop:4 }}>
              <input type={showKey.eodhd ? 'text' : 'password'} value={apiKeys.eodhd} onChange={e => setApiKeys(p => ({...p, eodhd:e.target.value}))} placeholder="Enter EODHD API key..." style={{ flex:1, padding:'8px 12px', border:`1px solid ${T.border}`, borderRadius:6, fontSize:13, fontFamily:'monospace' }}/>
              <Btn small onClick={() => setShowKey(p => ({...p, eodhd:!p.eodhd}))}>{showKey.eodhd ? 'Hide' : 'Show'}</Btn>
              <Btn small primary onClick={() => testConnection('eodhd')}>Test</Btn>
            </div>
            {eodhdStatus && <div style={{ marginTop:6, fontSize:12, color:eodhdStatus==='connected'?T.green:eodhdStatus==='error'?T.red:T.amber }}>{eodhdStatus==='testing' ? 'Testing connection...' : eodhdStatus==='connected' ? 'Connected successfully' : 'Connection failed - check API key'}</div>}
          </div>
          <div style={{ marginBottom:12 }}>
            <label style={{ fontSize:12, fontWeight:600, color:T.textSec }}>Endpoint</label>
            <select value={selEndpoint} onChange={e => setSelEndpoint(e.target.value)} style={{ display:'block', marginTop:4, padding:'6px 10px', border:`1px solid ${T.border}`, borderRadius:6, fontSize:12, width:'100%' }}>
              {Object.keys(EODHD_ENDPOINTS).map(k => <option key={k} value={k}>{k}</option>)}
            </select>
          </div>
          <div style={{ background:T.surfaceH, borderRadius:6, padding:12, fontSize:11, fontFamily:'monospace', overflowX:'auto' }}>
            <div style={{ color:T.textSec, marginBottom:4 }}>URL Template:</div>
            <div style={{ color:T.navy, wordBreak:'break-all' }}>{EODHD_ENDPOINTS[selEndpoint].url}</div>
            <div style={{ color:T.textSec, marginTop:8 }}>Fields: {EODHD_ENDPOINTS[selEndpoint].fields.join(', ')}</div>
            <div style={{ color:T.textSec, marginTop:4 }}>Rate: {EODHD_ENDPOINTS[selEndpoint].rate}</div>
          </div>
          <div style={{ marginTop:12 }}>
            <label style={{ fontSize:12, fontWeight:600, color:T.textSec }}>Rate Limit Usage</label>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginTop:4 }}>
              <div style={{ flex:1, height:8, background:T.border, borderRadius:4 }}>
                <div style={{ height:8, background:eodhdCallsToday/eodhdCallsMax > 0.8 ? T.red : T.sage, borderRadius:4, width:`${Math.min((eodhdCallsToday/eodhdCallsMax)*100,100)}%` }}/>
              </div>
              <span style={{ fontSize:11, color:T.textSec }}>{eodhdCallsToday}/{eodhdCallsMax.toLocaleString()}</span>
            </div>
          </div>
        </Card>

        {/* ── S6: Alpha Vantage Integration Panel ── */}
        <Card>
          <h2 style={{ fontSize:16, fontWeight:700, margin:'0 0 14px' }}>Alpha Vantage Integration</h2>
          <div style={{ marginBottom:12 }}>
            <label style={{ fontSize:12, fontWeight:600, color:T.textSec }}>API Key</label>
            <div style={{ display:'flex', gap:8, marginTop:4 }}>
              <input type={showKey.av ? 'text' : 'password'} value={apiKeys.av} onChange={e => setApiKeys(p => ({...p, av:e.target.value}))} placeholder="Enter Alpha Vantage key..." style={{ flex:1, padding:'8px 12px', border:`1px solid ${T.border}`, borderRadius:6, fontSize:13, fontFamily:'monospace' }}/>
              <Btn small onClick={() => setShowKey(p => ({...p, av:!p.av}))}>{showKey.av ? 'Hide' : 'Show'}</Btn>
              <Btn small primary onClick={() => testConnection('av')}>Test</Btn>
            </div>
            {avStatus && <div style={{ marginTop:6, fontSize:12, color:avStatus==='connected'?T.green:avStatus==='error'?T.red:T.amber }}>{avStatus==='testing' ? 'Testing...' : avStatus==='connected' ? 'Connected' : 'Failed'}</div>}
          </div>
          <div style={{ marginBottom:12 }}>
            <label style={{ fontSize:12, fontWeight:600, color:T.textSec }}>Endpoint</label>
            <select value={selAvEndpoint} onChange={e => setSelAvEndpoint(e.target.value)} style={{ display:'block', marginTop:4, padding:'6px 10px', border:`1px solid ${T.border}`, borderRadius:6, fontSize:12, width:'100%' }}>
              {Object.keys(AV_ENDPOINTS).map(k => <option key={k} value={k}>{k}</option>)}
            </select>
          </div>
          {selAvEndpoint === 'sma' && (
            <div style={{ marginBottom:12 }}>
              <label style={{ fontSize:12, fontWeight:600, color:T.textSec }}>SMA Period: {avPeriod} days</label>
              <input type="range" min={10} max={200} value={avPeriod} onChange={e => setAvPeriod(+e.target.value)} style={{ width:'100%', marginTop:4 }}/>
              <div style={{ display:'flex', justifyContent:'space-between', fontSize:10, color:T.textMut }}><span>10d</span><span>50d</span><span>100d</span><span>200d</span></div>
            </div>
          )}
          <div style={{ background:T.surfaceH, borderRadius:6, padding:12, fontSize:11, fontFamily:'monospace', overflowX:'auto' }}>
            <div style={{ color:T.textSec, marginBottom:4 }}>URL Template:</div>
            <div style={{ color:T.navy, wordBreak:'break-all' }}>{AV_ENDPOINTS[selAvEndpoint].url.replace('{period}', avPeriod)}</div>
            <div style={{ color:T.textSec, marginTop:8 }}>Fields: {AV_ENDPOINTS[selAvEndpoint].fields.join(', ')}</div>
          </div>
          <div style={{ marginTop:12 }}>
            <label style={{ fontSize:12, fontWeight:600, color:T.textSec }}>Rate Limit</label>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginTop:4 }}>
              <div style={{ flex:1, height:8, background:T.border, borderRadius:4 }}>
                <div style={{ height:8, background:avCallsToday/avCallsMax > 0.8 ? T.red : T.gold, borderRadius:4, width:`${Math.min((avCallsToday/avCallsMax)*100,100)}%` }}/>
              </div>
              <span style={{ fontSize:11, color:T.textSec }}>{avCallsToday}/{avCallsMax}</span>
            </div>
          </div>
        </Card>
      </div>

      {/* ── S7: BRSR Supabase Bridge Panel ── */}
      <Card style={{ marginBottom:28 }}>
        <h2 style={{ fontSize:16, fontWeight:700, margin:'0 0 14px' }}>BRSR Supabase Bridge</h2>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
          <div>
            <label style={{ fontSize:12, fontWeight:600, color:T.textSec }}>Supabase URL</label>
            <div style={{ display:'flex', gap:8, marginTop:4 }}>
              <input type={showKey.supabase ? 'text' : 'password'} value={apiKeys.supabase} onChange={e => setApiKeys(p => ({...p, supabase:e.target.value}))} placeholder="https://your-project.supabase.co" style={{ flex:1, padding:'8px 12px', border:`1px solid ${T.border}`, borderRadius:6, fontSize:12, fontFamily:'monospace' }}/>
              <Btn small onClick={() => setShowKey(p => ({...p, supabase:!p.supabase}))}>{showKey.supabase ? 'Hide' : 'Show'}</Btn>
              <Btn small primary onClick={() => testConnection('supabase')}>Test</Btn>
            </div>
            {supabaseStatus && <div style={{ marginTop:6, fontSize:12, color:supabaseStatus==='connected'?T.green:supabaseStatus==='error'?T.red:T.amber }}>{supabaseStatus==='testing' ? 'Testing...' : supabaseStatus==='connected' ? 'Connected (6 tables found)' : 'Failed'}</div>}
          </div>
          <div>
            <label style={{ fontSize:12, fontWeight:600, color:T.textSec }}>Tables & Row Counts</label>
            <table style={{ width:'100%', borderCollapse:'collapse', marginTop:4 }}>
              <thead><tr>{['Table','Rows','Last Sync','Status'].map(h => <th key={h} style={{...thStyle, fontSize:10, padding:'6px 8px'}}>{h}</th>)}</tr></thead>
              <tbody>
                {BRSR_TABLES.map((t,i) => (
                  <tr key={i} style={{ background:i%2===0?'transparent':T.surfaceH }}>
                    <td style={{...tdStyle, fontSize:11, fontFamily:'monospace', padding:'6px 8px'}}>{t.table}</td>
                    <td style={{...tdStyle, fontSize:11, textAlign:'right', padding:'6px 8px'}}>{t.rows.toLocaleString()}</td>
                    <td style={{...tdStyle, fontSize:11, padding:'6px 8px'}}>{t.last_sync}</td>
                    <td style={{...tdStyle, padding:'6px 8px'}}><Badge color={t.status==='synced'?T.green:t.status==='stale'?T.amber:T.red}>{t.status}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Card>

      {/* ── S8: Scheduled Refresh Configuration ── */}
      <Card style={{ marginBottom:28 }}>
        <h2 style={{ fontSize:16, fontWeight:700, margin:'0 0 14px' }}>Scheduled Refresh Configuration</h2>
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead>
              <tr>
                {['Exchange','Enabled','Frequency','Time of Day','Next Run'].map(h => (
                  <th key={h} style={{...thStyle, fontSize:11}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {EXCHANGE_FEEDS.map((f, i) => {
                const cfg = feedCfg[f.exchange] || { enabled:true, frequency:'daily', time:'06:00' };
                return (
                  <tr key={i} style={{ background:i%2===0?'transparent':T.surfaceH }}>
                    <td style={{...tdStyle, fontWeight:600, fontSize:12}}>{f.exchange}</td>
                    <td style={tdStyle}>
                      <label style={{ display:'flex', alignItems:'center', gap:6, cursor:'pointer' }}>
                        <input type="checkbox" checked={cfg.enabled} onChange={e => updateCfg(f.exchange,'enabled',e.target.checked)} style={{ accentColor:T.sage }}/>
                        <span style={{ fontSize:11 }}>{cfg.enabled ? 'On' : 'Off'}</span>
                      </label>
                    </td>
                    <td style={tdStyle}>
                      <select value={cfg.frequency} onChange={e => updateCfg(f.exchange,'frequency',e.target.value)} style={{ padding:'4px 8px', border:`1px solid ${T.border}`, borderRadius:4, fontSize:11 }}>
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                      </select>
                    </td>
                    <td style={tdStyle}>
                      <input type="time" value={cfg.time} onChange={e => updateCfg(f.exchange,'time',e.target.value)} style={{ padding:'4px 8px', border:`1px solid ${T.border}`, borderRadius:4, fontSize:11 }}/>
                    </td>
                    <td style={{...tdStyle, fontSize:11, color:T.textMut}}>{cfg.enabled ? `Tomorrow ${cfg.time} UTC` : 'Disabled'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* ── S9: Feed Execution Log ── */}
      <Card style={{ marginBottom:28 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
          <h2 style={{ fontSize:16, fontWeight:700, margin:0 }}>Feed Execution Log</h2>
          <div style={{ display:'flex', gap:8 }}>
            <Btn small onClick={() => exportCSV(feedLog, 'feed_log.csv')}>Export Log</Btn>
            <Btn small onClick={() => setFeedLog([])}>Clear</Btn>
          </div>
        </div>
        <div style={{ maxHeight:260, overflowY:'auto', border:`1px solid ${T.border}`, borderRadius:6 }}>
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead style={{ position:'sticky', top:0, background:T.surface }}>
              <tr>{['Timestamp','Exchange','Records','Duration','Status'].map(h => <th key={h} style={{...thStyle, fontSize:10, padding:'8px 10px'}}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {feedLog.slice(0, 50).map((l, i) => (
                <tr key={i} style={{ background:i%2===0?'transparent':T.surfaceH }}>
                  <td style={{...tdStyle, fontSize:11, fontFamily:'monospace', padding:'6px 10px'}}>{new Date(l.timestamp).toLocaleString()}</td>
                  <td style={{...tdStyle, fontSize:11, fontWeight:600, padding:'6px 10px'}}>{l.exchange}</td>
                  <td style={{...tdStyle, fontSize:11, textAlign:'right', padding:'6px 10px'}}>{l.records}</td>
                  <td style={{...tdStyle, fontSize:11, padding:'6px 10px'}}>{l.duration}</td>
                  <td style={{...tdStyle, padding:'6px 10px'}}><Badge color={l.status==='success'?T.green:T.red}>{l.status}</Badge></td>
                </tr>
              ))}
              {feedLog.length === 0 && <tr><td colSpan={5} style={{...tdStyle, textAlign:'center', color:T.textMut}}>No feed executions yet</td></tr>}
            </tbody>
          </table>
        </div>
      </Card>

      {/* ── S10: Data Freshness BarChart ── */}
      <Card style={{ marginBottom:28 }}>
        <h2 style={{ fontSize:16, fontWeight:700, margin:'0 0 14px' }}>Data Freshness by Exchange</h2>
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={freshness} margin={{ top:10, right:20, bottom:40, left:10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
            <XAxis dataKey="exchange" tick={{ fontSize:10, fill:T.textSec }} angle={-35} textAnchor="end" height={60}/>
            <YAxis tick={{ fontSize:11, fill:T.textSec }} label={{ value:'Hours Since Update', angle:-90, position:'insideLeft', style:{ fontSize:11, fill:T.textSec } }}/>
            <Tooltip contentStyle={{ borderRadius:8, border:`1px solid ${T.border}`, fontSize:12 }} formatter={(v) => [`${v} hours`, 'Age']}/>
            <Bar dataKey="hours" radius={[4,4,0,0]}>
              {freshness.map((f, i) => <Cell key={i} fill={f.hours > 48 ? T.red : f.hours > 24 ? T.amber : T.sage}/>)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <div style={{ display:'flex', gap:16, fontSize:11, color:T.textMut, marginTop:4 }}>
          <span><span style={{ display:'inline-block', width:10, height:10, background:T.sage, borderRadius:2, marginRight:4, verticalAlign:'middle' }}/> &lt;24h (Fresh)</span>
          <span><span style={{ display:'inline-block', width:10, height:10, background:T.amber, borderRadius:2, marginRight:4, verticalAlign:'middle' }}/> 24-48h (Aging)</span>
          <span><span style={{ display:'inline-block', width:10, height:10, background:T.red, borderRadius:2, marginRight:4, verticalAlign:'middle' }}/> &gt;48h (Stale)</span>
        </div>
      </Card>

      {/* ── S11: EODHD Field Mapping ── */}
      <Card style={{ marginBottom:28, overflowX:'auto' }}>
        <h2 style={{ fontSize:16, fontWeight:700, margin:'0 0 14px' }}>EODHD Field Mapping</h2>
        <table style={{ width:'100%', borderCollapse:'collapse' }}>
          <thead>
            <tr>{['Platform Field','EODHD Field','Source Endpoint','Transformation','Availability'].map(h => <th key={h} style={{...thStyle, fontSize:11}}>{h}</th>)}</tr>
          </thead>
          <tbody>
            {FIELD_MAPPING.map((m, i) => (
              <tr key={i} style={{ background:i%2===0?'transparent':T.surfaceH }}>
                <td style={{...tdStyle, fontFamily:'monospace', fontSize:12, fontWeight:600}}>{m.platform_field}</td>
                <td style={{...tdStyle, fontFamily:'monospace', fontSize:11, color:T.navyL}}>{m.eodhd_field}</td>
                <td style={{...tdStyle, fontSize:11}}>{m.source}</td>
                <td style={{...tdStyle, fontSize:11, color:T.textSec}}>{m.transform}</td>
                <td style={tdStyle}><Badge color={parseInt(m.availability)>=90?T.green:parseInt(m.availability)>=70?T.sage:T.amber}>{m.availability}</Badge></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {/* ── S12: Bulk Update Panel ── */}
      <Card style={{ marginBottom:28 }}>
        <h2 style={{ fontSize:16, fontWeight:700, margin:'0 0 14px' }}>Bulk Update Panel</h2>
        <div style={{ display:'flex', gap:20, alignItems:'center' }}>
          <Btn primary onClick={simulateBulkRefresh} disabled={bulkRefreshing}>{bulkRefreshing ? `Refreshing... ${bulkProgress}%` : 'Refresh All Exchanges'}</Btn>
          <div style={{ flex:1 }}>
            {bulkRefreshing && (
              <div>
                <div style={{ height:8, background:T.border, borderRadius:4 }}>
                  <div style={{ height:8, background:T.sage, borderRadius:4, width:`${bulkProgress}%`, transition:'width .3s' }}/>
                </div>
                <div style={{ fontSize:11, color:T.textMut, marginTop:4 }}>Processing {Math.round(bulkProgress/100*EXCHANGE_FEEDS.length)}/{EXCHANGE_FEEDS.length} exchanges... Est. ~20s remaining</div>
              </div>
            )}
          </div>
          <div style={{ textAlign:'right', fontSize:12, color:T.textSec }}>
            <div>Total companies: <strong>{totalCompanies}</strong></div>
            <div>Estimated time: <strong>~18s</strong></div>
          </div>
        </div>
      </Card>

      {/* ── S13: Error & Retry Management ── */}
      <Card style={{ marginBottom:28 }}>
        <h2 style={{ fontSize:16, fontWeight:700, margin:'0 0 14px', color:errors.length > 0 ? T.red : T.text }}>Error & Retry Management {errors.length > 0 && `(${errors.length})`}</h2>
        {errors.length === 0 ? (
          <div style={{ textAlign:'center', padding:24, color:T.textMut }}>No errors. All feeds operational.</div>
        ) : (
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead><tr>{['Exchange','Error','Retries','Last Attempt','Action'].map(h => <th key={h} style={{...thStyle, fontSize:11}}>{h}</th>)}</tr></thead>
            <tbody>
              {errors.map((e, i) => (
                <tr key={i} style={{ background:T.red+'08' }}>
                  <td style={{...tdStyle, fontWeight:600}}>{e.exchange}</td>
                  <td style={{...tdStyle, fontSize:12, color:T.red, fontFamily:'monospace'}}>{e.error}</td>
                  <td style={{...tdStyle, textAlign:'center'}}>{e.retries}</td>
                  <td style={{...tdStyle, fontSize:11}}>{e.last_attempt}</td>
                  <td style={tdStyle}><Btn small primary onClick={() => retryFeed(e.exchange)}>Retry Now</Btn></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      {/* ── S14: API Rate Limit Dashboard ── */}
      <Card style={{ marginBottom:28 }}>
        <h2 style={{ fontSize:16, fontWeight:700, margin:'0 0 14px' }}>API Rate Limit Dashboard</h2>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:16 }}>
          {[
            { name:'EODHD Fundamentals', used:47, limit:100000, reset:'24h', tier:'Paid', color:T.sage },
            { name:'EODHD EOD Prices', used:14, limit:100000, reset:'24h', tier:'Paid', color:T.sage },
            { name:'EODHD Bulk', used:3, limit:100000, reset:'24h', tier:'Paid', color:T.sage },
            { name:'EODHD Live/Delayed', used:22, limit:100000, reset:'24h', tier:'Paid', color:T.sage },
            { name:'Alpha Vantage Standard', used:12, limit:500, reset:'24h', tier:'Free', color:T.gold },
            { name:'Alpha Vantage Premium', used:0, limit:75, reset:'1min', tier:'Premium', color:T.gold },
          ].map((api, i) => {
            const pct = (api.used / api.limit) * 100;
            return (
              <div key={i} style={{ padding:14, background:T.surfaceH, borderRadius:8, border:`1px solid ${T.border}` }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
                  <span style={{ fontSize:12, fontWeight:600 }}>{api.name}</span>
                  <Badge color={api.color}>{api.tier}</Badge>
                </div>
                <div style={{ height:6, background:T.border, borderRadius:3, marginBottom:6 }}>
                  <div style={{ height:6, background:pct > 80 ? T.red : pct > 50 ? T.amber : api.color, borderRadius:3, width:`${Math.min(pct, 100)}%`, transition:'width .3s' }}/>
                </div>
                <div style={{ display:'flex', justifyContent:'space-between', fontSize:10, color:T.textMut }}>
                  <span>{api.used.toLocaleString()} / {api.limit.toLocaleString()}</span>
                  <span>Resets: {api.reset}</span>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* ── S15: Exchange Data Summary per Country ── */}
      <Card style={{ marginBottom:28, overflowX:'auto' }}>
        <h2 style={{ fontSize:16, fontWeight:700, margin:'0 0 14px' }}>Exchange Data Summary by Region</h2>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))', gap:14 }}>
          {[
            { region:'Asia-Pacific', exchanges:['NSE/BSE','TSE','HKEX','SGX','KRX','SSE/SZSE','ASX'], color:T.sage },
            { region:'Americas', exchanges:['NYSE/NASDAQ','TSX','B3'], color:T.navy },
            { region:'EMEA', exchanges:['LSE','XETRA','Euronext','JSE'], color:T.gold },
          ].map((r, ri) => {
            const exData = EXCHANGE_FEEDS.filter(f => r.exchanges.includes(f.exchange));
            const totalCo = exData.reduce((s,f) => s + f.companies, 0);
            const avgCov = Math.round(exData.reduce((s,f) => s + (f.coverage_pct||50), 0) / exData.length);
            return (
              <div key={ri} style={{ padding:16, border:`2px solid ${r.color}30`, borderRadius:10, background:r.color+'06' }}>
                <div style={{ fontSize:14, fontWeight:700, color:r.color, marginBottom:10 }}>{r.region}</div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:10 }}>
                  <div style={{ textAlign:'center' }}>
                    <div style={{ fontSize:20, fontWeight:700, color:T.text }}>{exData.length}</div>
                    <div style={{ fontSize:10, color:T.textMut }}>Exchanges</div>
                  </div>
                  <div style={{ textAlign:'center' }}>
                    <div style={{ fontSize:20, fontWeight:700, color:T.text }}>{totalCo}</div>
                    <div style={{ fontSize:10, color:T.textMut }}>Companies</div>
                  </div>
                </div>
                <div style={{ marginBottom:8 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, marginBottom:3 }}>
                    <span style={{ color:T.textSec }}>Avg Coverage</span>
                    <span style={{ fontWeight:600, color:coverageColor(avgCov) }}>{avgCov}%</span>
                  </div>
                  <div style={{ height:6, background:T.border, borderRadius:3 }}>
                    <div style={{ height:6, background:coverageColor(avgCov), borderRadius:3, width:`${avgCov}%` }}/>
                  </div>
                </div>
                <div style={{ display:'flex', flexWrap:'wrap', gap:4 }}>
                  {exData.map((e, ei) => (
                    <span key={ei} style={{ fontSize:10, padding:'2px 6px', background:r.color+'15', borderRadius:4, color:r.color }}>{e.exchange}</span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* ── S16: Data Pipeline Health Monitor ── */}
      <Card style={{ marginBottom:28 }}>
        <h2 style={{ fontSize:16, fontWeight:700, margin:'0 0 14px' }}>Data Pipeline Health Monitor</h2>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))', gap:12 }}>
          {[
            { stage:'Ingestion', status:'healthy', latency:'1.2s avg', throughput:'850 rec/min', last_error:null, uptime:'99.97%' },
            { stage:'FX Conversion', status:'healthy', latency:'0.3s avg', throughput:'2,100 rec/min', last_error:null, uptime:'99.99%' },
            { stage:'Normalization', status:'healthy', latency:'0.8s avg', throughput:'1,400 rec/min', last_error:null, uptime:'99.95%' },
            { stage:'Quality Check', status:'warning', latency:'2.1s avg', throughput:'650 rec/min', last_error:'Slow response from validation service', uptime:'99.82%' },
            { stage:'Enrichment', status:'healthy', latency:'1.5s avg', throughput:'700 rec/min', last_error:null, uptime:'99.91%' },
            { stage:'Storage (Supabase)', status:'healthy', latency:'0.4s avg', throughput:'3,200 rec/min', last_error:null, uptime:'99.99%' },
          ].map((p, i) => (
            <div key={i} style={{ padding:14, border:`1px solid ${p.status==='healthy' ? T.green+'40' : p.status==='warning' ? T.amber+'40' : T.red+'40'}`, borderRadius:8, background:p.status==='healthy' ? T.green+'05' : p.status==='warning' ? T.amber+'05' : T.red+'05' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
                <span style={{ fontSize:13, fontWeight:600 }}>{p.stage}</span>
                <span style={{ width:10, height:10, borderRadius:'50%', background:p.status==='healthy' ? T.green : p.status==='warning' ? T.amber : T.red }}/>
              </div>
              <div style={{ fontSize:11, color:T.textSec, marginBottom:4 }}>Latency: <strong style={{ color:T.text }}>{p.latency}</strong></div>
              <div style={{ fontSize:11, color:T.textSec, marginBottom:4 }}>Throughput: <strong style={{ color:T.text }}>{p.throughput}</strong></div>
              <div style={{ fontSize:11, color:T.textSec }}>Uptime: <strong style={{ color:T.green }}>{p.uptime}</strong></div>
              {p.last_error && <div style={{ fontSize:10, color:T.amber, marginTop:6, fontStyle:'italic' }}>{p.last_error}</div>}
            </div>
          ))}
        </div>
      </Card>

      {/* ── S17: Feed Configuration Presets ── */}
      <Card style={{ marginBottom:28 }}>
        <h2 style={{ fontSize:16, fontWeight:700, margin:'0 0 14px' }}>Feed Configuration Presets</h2>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(240px,1fr))', gap:14 }}>
          {[
            { name:'Conservative', desc:'Daily updates for active markets, weekly for smaller exchanges', schedule:'Daily 06:00 UTC (major), Weekly Sunday (minor)', exchanges:6, apiCalls:'~50/day', recommended:'Low API budget' },
            { name:'Standard', desc:'Daily updates for all exchanges during market hours', schedule:'Daily 06:00 UTC (all exchanges)', exchanges:14, apiCalls:'~200/day', recommended:'Default for most users' },
            { name:'Aggressive', desc:'Intraday updates for major exchanges, daily for rest', schedule:'Every 4h (major), Daily (minor)', exchanges:14, apiCalls:'~800/day', recommended:'Real-time monitoring' },
            { name:'BRSR Focus', desc:'Prioritize Indian exchange data with BRSR integration', schedule:'Daily 05:30 IST (NSE/BSE), Weekly (others)', exchanges:14, apiCalls:'~100/day', recommended:'India-focused portfolios' },
          ].map((preset, i) => (
            <div key={i} style={{ padding:16, border:`1px solid ${T.border}`, borderRadius:8, cursor:'pointer', transition:'all .15s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = T.navy; e.currentTarget.style.background = T.surfaceH; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.background = 'transparent'; }}>
              <div style={{ fontSize:14, fontWeight:700, color:T.navy, marginBottom:6 }}>{preset.name}</div>
              <div style={{ fontSize:11, color:T.textSec, marginBottom:8 }}>{preset.desc}</div>
              <div style={{ fontSize:10, color:T.textMut, marginBottom:3 }}>Schedule: {preset.schedule}</div>
              <div style={{ fontSize:10, color:T.textMut, marginBottom:3 }}>Exchanges: {preset.exchanges} | API Calls: {preset.apiCalls}</div>
              <div style={{ fontSize:10, color:T.sage, fontStyle:'italic' }}>Recommended: {preset.recommended}</div>
              <Btn small primary style={{ marginTop:8, width:'100%' }} onClick={() => {
                const newCfg = {...feedCfg};
                EXCHANGE_FEEDS.forEach(f => { newCfg[f.exchange] = { ...newCfg[f.exchange], enabled:true, frequency:preset.name==='Conservative'&&f.companies<40?'weekly':'daily', time:preset.name==='BRSR Focus'?'00:00':'06:00' }; });
                setFeedCfg(newCfg);
              }}>Apply Preset</Btn>
            </div>
          ))}
        </div>
      </Card>

      {/* ── S18: Historical Feed Performance ── */}
      <Card style={{ marginBottom:28 }}>
        <h2 style={{ fontSize:16, fontWeight:700, margin:'0 0 14px' }}>Historical Feed Performance (Last 7 Days)</h2>
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead>
              <tr>
                <th style={{...thStyle, fontSize:11}}>Exchange</th>
                {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d => <th key={d} style={{...thStyle, fontSize:10, textAlign:'center', padding:'8px 6px'}}>{d}</th>)}
                <th style={{...thStyle, fontSize:11, textAlign:'center'}}>Success %</th>
              </tr>
            </thead>
            <tbody>
              {EXCHANGE_FEEDS.map((f, i) => {
                const days = Array(7).fill(0).map(() => sr(_sc++) > 0.08 ? 'ok' : sr(_sc++) > 0.5 ? 'slow' : 'fail');
                const successPct = Math.round(days.filter(d => d === 'ok').length / 7 * 100);
                return (
                  <tr key={i} style={{ background:i%2===0?'transparent':T.surfaceH }}>
                    <td style={{...tdStyle, fontWeight:600, fontSize:12}}>{f.exchange}</td>
                    {days.map((d, di) => (
                      <td key={di} style={{...tdStyle, textAlign:'center', padding:'6px'}}>
                        <span style={{ display:'inline-block', width:14, height:14, borderRadius:'50%', background:d==='ok'?T.green:d==='slow'?T.amber:T.red }} title={d}/>
                      </td>
                    ))}
                    <td style={{...tdStyle, textAlign:'center', fontWeight:600, color:successPct >= 90 ? T.green : successPct >= 70 ? T.amber : T.red, fontSize:12}}>{successPct}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div style={{ display:'flex', gap:16, marginTop:10, fontSize:11, color:T.textMut }}>
          <span><span style={{ display:'inline-block', width:10, height:10, borderRadius:'50%', background:T.green, marginRight:4, verticalAlign:'middle' }}/> Success</span>
          <span><span style={{ display:'inline-block', width:10, height:10, borderRadius:'50%', background:T.amber, marginRight:4, verticalAlign:'middle' }}/> Slow</span>
          <span><span style={{ display:'inline-block', width:10, height:10, borderRadius:'50%', background:T.red, marginRight:4, verticalAlign:'middle' }}/> Failed</span>
        </div>
      </Card>

      {/* ── S19: Data Source Comparison Matrix ── */}
      <Card style={{ marginBottom:28, overflowX:'auto' }}>
        <h2 style={{ fontSize:16, fontWeight:700, margin:'0 0 14px' }}>Data Source Comparison</h2>
        <table style={{ width:'100%', borderCollapse:'collapse' }}>
          <thead>
            <tr>{['Feature','EODHD','Alpha Vantage','BRSR Supabase','Manual Override'].map(h => <th key={h} style={{...thStyle, fontSize:11}}>{h}</th>)}</tr>
          </thead>
          <tbody>
            {[
              { feature:'Coverage (companies)', eodhd:'691 (14 exchanges)', av:'~500 (US focus)', brsr:'1,323 (India)', manual:'Any' },
              { feature:'Update Frequency', eodhd:'Daily + Intraday', av:'Daily (free), Realtime (paid)', brsr:'Quarterly filings', manual:'Ad-hoc' },
              { feature:'ESG Data', eodhd:'Basic ESG scores', av:'None', brsr:'Comprehensive (SEBI)', manual:'Override' },
              { feature:'Financial Data', eodhd:'Full fundamentals', av:'Financials + Technicals', brsr:'Revenue, assets', manual:'Override' },
              { feature:'Emissions Data', eodhd:'Limited', av:'None', brsr:'Scope 1/2/3 (India)', manual:'Override' },
              { feature:'API Cost', eodhd:'$79.99/mo (All World)', av:'Free (limited), $49.99/mo', brsr:'Supabase plan', manual:'N/A' },
              { feature:'Rate Limits', eodhd:'100K/day', av:'500/day (free)', brsr:'Unlimited (DB)', manual:'N/A' },
              { feature:'Data Quality', eodhd:'High (structured)', av:'High (structured)', brsr:'Variable (filing quality)', manual:'Verified' },
            ].map((row, i) => (
              <tr key={i} style={{ background:i%2===0?'transparent':T.surfaceH }}>
                <td style={{...tdStyle, fontWeight:600, fontSize:12}}>{row.feature}</td>
                <td style={{...tdStyle, fontSize:11}}>{row.eodhd}</td>
                <td style={{...tdStyle, fontSize:11}}>{row.av}</td>
                <td style={{...tdStyle, fontSize:11}}>{row.brsr}</td>
                <td style={{...tdStyle, fontSize:11}}>{row.manual}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {/* ── S20: Sample API Response Preview ── */}
      <Card style={{ marginBottom:28 }}>
        <h2 style={{ fontSize:16, fontWeight:700, margin:'0 0 14px' }}>Sample API Response Preview</h2>
        <p style={{ fontSize:12, color:T.textSec, margin:'0 0 12px' }}>Preview of typical EODHD Fundamentals API response structure for platform integration.</p>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
          <div>
            <div style={{ fontSize:12, fontWeight:600, color:T.textSec, marginBottom:6 }}>EODHD Fundamentals Response (sample)</div>
            <pre style={{ background:T.surfaceH, borderRadius:8, padding:14, fontSize:10, fontFamily:'monospace', overflow:'auto', maxHeight:280, border:`1px solid ${T.border}`, lineHeight:1.5, margin:0 }}>
{`{
  "General": {
    "Code": "RELIANCE",
    "Exchange": "NSE",
    "Name": "Reliance Industries Ltd",
    "Sector": "Energy",
    "Industry": "Oil & Gas Refining",
    "CountryISO": "IN",
    "CurrencyCode": "INR"
  },
  "Highlights": {
    "MarketCapitalization": 19280000000000,
    "Revenue": 8920000000000,
    "EBITDA": 1680000000000,
    "PERatio": 28.4,
    "DividendYield": 0.0032,
    "ReturnOnEquityTTM": 0.095
  },
  "Valuation": {
    "EnterpriseValue": 21450000000000,
    "PriceBookMRQ": 2.8,
    "PriceSalesTTM": 2.16
  },
  "SharesStats": {
    "SharesOutstanding": 6765000000,
    "SharesFloat": 3280000000
  },
  "Technicals": {
    "Beta": 0.82,
    "52WeekHigh": 3025,
    "52WeekLow": 2220,
    "50DayMA": 2850,
    "200DayMA": 2720
  },
  "ESGScores": {
    "totalEsg": 42.5,
    "environmentScore": 38.2,
    "socialScore": 45.8,
    "governanceScore": 48.1
  }
}`}
            </pre>
          </div>
          <div>
            <div style={{ fontSize:12, fontWeight:600, color:T.textSec, marginBottom:6 }}>Alpha Vantage SMA Response (sample)</div>
            <pre style={{ background:T.surfaceH, borderRadius:8, padding:14, fontSize:10, fontFamily:'monospace', overflow:'auto', maxHeight:280, border:`1px solid ${T.border}`, lineHeight:1.5, margin:0 }}>
{`{
  "Meta Data": {
    "Symbol": "AAPL",
    "Indicator": "Simple Moving Average",
    "Time Period": ${avPeriod},
    "Series Type": "close",
    "Time Zone": "US/Eastern"
  },
  "Technical Analysis: SMA": {
    "2025-03-25": { "SMA": "178.42" },
    "2025-03-24": { "SMA": "178.15" },
    "2025-03-21": { "SMA": "177.88" },
    "2025-03-20": { "SMA": "177.62" },
    "2025-03-19": { "SMA": "177.35" }
  }
}

// Alpha Vantage Company Overview
{
  "Symbol": "AAPL",
  "MarketCapitalization": "2840000000000",
  "EBITDA": "130541000000",
  "PERatio": "28.92",
  "DividendYield": "0.0055",
  "52WeekHigh": "199.62",
  "52WeekLow": "155.98",
  "Beta": "1.24",
  "Sector": "Technology",
  "Industry": "Consumer Electronics"
}`}
            </pre>
          </div>
        </div>
      </Card>

      {/* ── S21: Exchange Market Hours Reference ── */}
      <Card style={{ marginBottom:28, overflowX:'auto' }}>
        <h2 style={{ fontSize:16, fontWeight:700, margin:'0 0 14px' }}>Exchange Market Hours Reference</h2>
        <table style={{ width:'100%', borderCollapse:'collapse' }}>
          <thead>
            <tr>{['Exchange','Country','Local Open','Local Close','UTC Open','UTC Close','Trading Days','Timezone'].map(h => <th key={h} style={{...thStyle, fontSize:10}}>{h}</th>)}</tr>
          </thead>
          <tbody>
            {[
              { exchange:'NSE/BSE', country:'India', localOpen:'09:15', localClose:'15:30', utcOpen:'03:45', utcClose:'10:00', days:'Mon-Fri', tz:'IST (UTC+5:30)' },
              { exchange:'NYSE/NASDAQ', country:'USA', localOpen:'09:30', localClose:'16:00', utcOpen:'14:30', utcClose:'21:00', days:'Mon-Fri', tz:'EST (UTC-5)' },
              { exchange:'LSE', country:'UK', localOpen:'08:00', localClose:'16:30', utcOpen:'08:00', utcClose:'16:30', days:'Mon-Fri', tz:'GMT (UTC+0)' },
              { exchange:'XETRA', country:'Germany', localOpen:'09:00', localClose:'17:30', utcOpen:'08:00', utcClose:'16:30', days:'Mon-Fri', tz:'CET (UTC+1)' },
              { exchange:'Euronext', country:'France', localOpen:'09:00', localClose:'17:30', utcOpen:'08:00', utcClose:'16:30', days:'Mon-Fri', tz:'CET (UTC+1)' },
              { exchange:'TSE', country:'Japan', localOpen:'09:00', localClose:'15:00', utcOpen:'00:00', utcClose:'06:00', days:'Mon-Fri', tz:'JST (UTC+9)' },
              { exchange:'HKEX', country:'Hong Kong', localOpen:'09:30', localClose:'16:00', utcOpen:'01:30', utcClose:'08:00', days:'Mon-Fri', tz:'HKT (UTC+8)' },
              { exchange:'ASX', country:'Australia', localOpen:'10:00', localClose:'16:00', utcOpen:'00:00', utcClose:'06:00', days:'Mon-Fri', tz:'AEST (UTC+10)' },
              { exchange:'SGX', country:'Singapore', localOpen:'09:00', localClose:'17:00', utcOpen:'01:00', utcClose:'09:00', days:'Mon-Fri', tz:'SGT (UTC+8)' },
              { exchange:'KRX', country:'S. Korea', localOpen:'09:00', localClose:'15:30', utcOpen:'00:00', utcClose:'06:30', days:'Mon-Fri', tz:'KST (UTC+9)' },
              { exchange:'SSE/SZSE', country:'China', localOpen:'09:30', localClose:'15:00', utcOpen:'01:30', utcClose:'07:00', days:'Mon-Fri', tz:'CST (UTC+8)' },
              { exchange:'B3', country:'Brazil', localOpen:'10:00', localClose:'17:00', utcOpen:'13:00', utcClose:'20:00', days:'Mon-Fri', tz:'BRT (UTC-3)' },
              { exchange:'JSE', country:'S. Africa', localOpen:'09:00', localClose:'17:00', utcOpen:'07:00', utcClose:'15:00', days:'Mon-Fri', tz:'SAST (UTC+2)' },
              { exchange:'TSX', country:'Canada', localOpen:'09:30', localClose:'16:00', utcOpen:'14:30', utcClose:'21:00', days:'Mon-Fri', tz:'EST (UTC-5)' },
            ].map((row, i) => (
              <tr key={i} style={{ background:i%2===0?'transparent':T.surfaceH }}>
                <td style={{...tdStyle, fontWeight:600, fontSize:11}}>{row.exchange}</td>
                <td style={{...tdStyle, fontSize:11}}>{row.country}</td>
                <td style={{...tdStyle, fontSize:11, fontFamily:'monospace'}}>{row.localOpen}</td>
                <td style={{...tdStyle, fontSize:11, fontFamily:'monospace'}}>{row.localClose}</td>
                <td style={{...tdStyle, fontSize:11, fontFamily:'monospace', color:T.navyL}}>{row.utcOpen}</td>
                <td style={{...tdStyle, fontSize:11, fontFamily:'monospace', color:T.navyL}}>{row.utcClose}</td>
                <td style={{...tdStyle, fontSize:11}}>{row.days}</td>
                <td style={{...tdStyle, fontSize:10, color:T.textMut}}>{row.tz}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {/* ── S22: Cross-Navigation ── */}
      <Card style={{ marginBottom:28 }}>
        <h2 style={{ fontSize:16, fontWeight:700, margin:'0 0 14px' }}>Related Modules</h2>
        <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
          {[
            { label:'API Orchestration', path:'/api-orchestration', desc:'Manage API endpoints & rate limits' },
            { label:'Data Quality Engine', path:'/data-quality', desc:'Quality checks & validation rules' },
            { label:'Data Enrichment', path:'/data-enrichment', desc:'Field enrichment & gap filling' },
            { label:'Data Lineage', path:'/data-lineage', desc:'Trace data from source to output' },
            { label:'Portfolio Manager', path:'/portfolio', desc:'Portfolio holdings & weights' },
          ].map((m, i) => (
            <div key={i} onClick={() => navigate(m.path)} style={{ flex:'1 1 180px', padding:14, border:`1px solid ${T.border}`, borderRadius:8, cursor:'pointer', transition:'all .15s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = T.navy; e.currentTarget.style.background = T.surfaceH; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.background = 'transparent'; }}>
              <div style={{ fontSize:13, fontWeight:600, color:T.navy }}>{m.label}</div>
              <div style={{ fontSize:11, color:T.textMut, marginTop:4 }}>{m.desc}</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

/* ── Helper: generate initial log entries ── */
function generateInitialLog() {
  const exchanges = EXCHANGE_FEEDS.map(f => f.exchange);
  const log = [];
  const baseDate = new Date('2025-03-25T06:00:00Z');
  for (let i = 0; i < 30; i++) {
    const d = new Date(baseDate.getTime() - i * 3600000 * (sr(_sc++) * 4 + 1));
    log.push({
      timestamp: d.toISOString(),
      exchange: exchanges[Math.floor(sr(_sc++) * exchanges.length)],
      records: Math.floor(sr(_sc++) * 80) + 5,
      duration: `${(sr(_sc++) * 4 + 0.3).toFixed(1)}s`,
      status: sr(_sc++) > 0.1 ? 'success' : 'error',
    });
  }
  return log.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
}
