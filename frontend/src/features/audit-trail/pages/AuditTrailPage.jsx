import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { GLOBAL_COMPANY_MASTER } from '../../../data/globalCompanyMaster';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Legend, BarChart, Bar,
} from 'recharts';

/* ─── Theme ─── */
const T={bg:'#f6f4f0',surface:'#ffffff',surfaceH:'#f0ede7',border:'#e5e0d8',borderL:'#d5cfc5',navy:'#1b3a5c',navyL:'#2c5a8c',gold:'#c5a96a',goldL:'#d4be8a',sage:'#5a8a6a',sageL:'#7ba67d',teal:'#5a8a6a',text:'#1b3a5c',textSec:'#5c6b7e',textMut:'#9aa3ae',red:'#dc2626',green:'#16a34a',amber:'#d97706',font:"'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"};

/* ─── Audit Categories ─── */
const AUDIT_CATEGORIES = [
  { id:'data_change', name:'Data Change', icon:'📊', color:'#2563eb', description:'Any modification to company data, manual overrides, enrichment updates', examples:['ESG score override','Manual emission entry','BRSR data sync','Enrichment refresh'] },
  { id:'model_run', name:'Model Execution', icon:'🔬', color:'#7c3aed', description:'Computation engine executions — PD, VaR, DMI, Monte Carlo, ITR, scenarios', examples:['MC VaR simulation (10K iterations)','PD calculation (Merton DD)','DMI portfolio assessment'] },
  { id:'portfolio_action', name:'Portfolio Action', icon:'💼', color:'#0d9488', description:'Portfolio creation, holding changes, weight adjustments, rebalancing', examples:['Add holding: RELIANCE.NS','Remove holding: SHELL.L','Rebalance to equal weight','Apply optimized weights'] },
  { id:'report_generation', name:'Report Generated', icon:'📄', color:'#d97706', description:'Any report export — TCFD, SFDR, CSRD, client quarterly, custom', examples:['TCFD HTML report','SFDR PAI CSV export','Client quarterly Q1-2025'] },
  { id:'alert_action', name:'Alert Action', icon:'🔔', color:'#dc2626', description:'Alert acknowledgment, resolution, escalation, dismissal', examples:['Acknowledge Critical alert','Resolve Elevated alert','Dismiss Watch alert'] },
  { id:'engagement', name:'Engagement Logged', icon:'🤝', color:'#16a34a', description:'Stewardship engagement records — letters, meetings, escalations', examples:['Log engagement: Tata Steel climate targets','Escalate: Shell emissions (Level 4)'] },
  { id:'config_change', name:'Configuration Change', icon:'⚙️', color:'#6b7280', description:'Settings, thresholds, API keys, pipeline configs, template changes', examples:['Update materiality threshold: 50→60','Change SFDR classification criteria','Add API key: EODHD'] },
  { id:'compliance', name:'Compliance Event', icon:'🛡️', color:'#991b1b', description:'Regulatory submissions, compliance checks, gap resolutions, filing updates', examples:['Submit SFDR PAI Statement','Mark CSRD E1 as complete','Resolve regulatory gap'] },
];
const catMap = Object.fromEntries(AUDIT_CATEGORIES.map(c => [c.id, c]));

const STORAGE_KEY = 'ra_audit_log_v1';
const MAX_EVENTS = 500;

const MODULES = ['Portfolio Manager','PD Engine','Monte Carlo VaR','DMI Assessment','SFDR PAI','CSRD iXBRL','TCFD Report','Stewardship Tracker','Regulatory Gap','Scenario Stress Test','ESG Screener','Copula Tail Risk','ITR Regression','Greenium Signal','CRREM','Sentiment Pipeline'];
const SEVERITIES = ['info','warning','critical'];
const DATE_RANGES = [{l:'7d',d:7},{l:'30d',d:30},{l:'90d',d:90},{l:'All',d:9999}];

/* ─── Helpers ─── */
const hash = s => { let h=0; for(let i=0;i<s.length;i++) h=Math.imul(31,h)+s.charCodeAt(i)|0; return Math.abs(h); };
const sRand = seed => { let x=Math.sin(seed*9301+49297)*233280; return x-Math.floor(x); };
const fmtDate = d => new Date(d).toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'});
const fmtTime = d => new Date(d).toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit',second:'2-digit'});
const daysBetween = (a,b) => Math.floor((new Date(b)-new Date(a))/(86400000));

/* ─── Synthetic Event Generator ─── */
function generateSyntheticEvents(companies) {
  const events = [];
  const now = Date.now();
  const catIds = AUDIT_CATEGORIES.map(c=>c.id);

  // Scan localStorage keys for real data
  const scanKeys = ['ra_portfolio_v1','ra_manual_overrides','ra_materiality_assessment_v1','ra_report_history_v1','ra_stewardship_v1','ra_compliance_actions_v1','ra_sfdr_assessments_v1','ra_scenario_results_v1','ra_pd_results_v1'];
  let seedOffset = 0;
  scanKeys.forEach(key => {
    try {
      const raw = localStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw);
        const entries = Array.isArray(parsed) ? parsed : (typeof parsed === 'object' ? Object.keys(parsed) : []);
        entries.slice(0,5).forEach((e,i) => {
          const ts = now - (seedOffset+i)*3600000*2;
          const catIdx = hash(key+i) % catIds.length;
          events.push({ id:`AUD-${ts}`, timestamp: new Date(ts).toISOString(), category: catIds[catIdx], action:`Sync from ${key.replace('ra_','').replace(/_/g,' ')}`, detail:`Detected ${typeof e==='string'?e:JSON.stringify(e).slice(0,60)} in ${key}`, module: MODULES[hash(key)%MODULES.length], entity: companies[hash(key+i)%companies.length]?.name||'System', user:'System', before_value:null, after_value:'synced', reversible:false, severity:SEVERITIES[hash(key+i)%3] });
          seedOffset++;
        });
      }
    } catch(e) { /* skip */ }
  });

  // Generate synthetic platform activity events covering last 90 days
  const actions = {
    data_change: ['ESG score manual override','BRSR data refresh','Emission data correction','Enrichment update applied','Manual GHG entry','Scope 3 data sync','ISIN mapping update','Sector reclassification'],
    model_run: ['PD Exponential recalculation','Merton DD execution','Monte Carlo VaR (10K)','DMI portfolio assessment','ITR regression computation','Copula tail risk simulation','NGFS scenario PD run','Greenium signal generation'],
    portfolio_action: ['Holding added','Holding removed','Weight adjusted','Portfolio rebalanced','New portfolio created','Benchmark changed','Optimization applied','Holding weight override'],
    report_generation: ['TCFD Climate Report exported','SFDR PAI Statement generated','CSRD E1 disclosure compiled','Client Quarterly Q1-2025','Custom ESG report','Regulatory filing package','Board risk summary','Stewardship report'],
    alert_action: ['Critical alert acknowledged','Elevated alert resolved','Watch alert dismissed','Threshold breach escalated','Alert rule updated','False positive marked','Alert forwarded to committee','Alert auto-resolved'],
    engagement: ['Engagement letter sent','Meeting logged: climate targets','Escalation to Level 3','Proxy vote recorded','Collaborative engagement joined','Follow-up scheduled','Resolution confirmed','Annual review completed'],
    config_change: ['Materiality threshold updated','SFDR classification rule changed','API key rotated','Pipeline schedule modified','Alert threshold adjusted','Report template updated','User role changed','Data source priority reordered'],
    compliance: ['SFDR PAI statement submitted','CSRD E1 marked complete','Regulatory gap resolved','EU Taxonomy alignment updated','BRSR compliance check passed','Audit evidence packaged','Filing deadline acknowledged','Remediation plan approved'],
  };

  for(let day=0; day<90; day++) {
    const eventsPerDay = Math.floor(sRand(day*7+42)*6)+2;
    for(let j=0; j<eventsPerDay; j++) {
      const catIdx = Math.floor(sRand(day*13+j*7)*catIds.length);
      const cat = catIds[catIdx];
      const actList = actions[cat];
      const act = actList[Math.floor(sRand(day*19+j*3)*actList.length)];
      const co = companies[Math.floor(sRand(day*23+j*11)*companies.length)];
      const ts = now - day*86400000 - Math.floor(sRand(day+j)*86400000);
      const sev = sRand(day*31+j) < 0.1 ? 'critical' : sRand(day*31+j) < 0.35 ? 'warning' : 'info';
      events.push({
        id:`AUD-${ts}-${day}-${j}`,
        timestamp: new Date(ts).toISOString(),
        category: cat,
        action: act,
        detail: `${act} for ${co?.name||'System'} via ${MODULES[Math.floor(sRand(day*37+j)*MODULES.length)]}`,
        module: MODULES[Math.floor(sRand(day*37+j)*MODULES.length)],
        entity: co?.name||'System',
        user: sRand(day*41+j) < 0.3 ? 'Manual' : 'System',
        before_value: sRand(day*43+j)<0.5 ? `Score: ${(sRand(day+j)*100).toFixed(1)}` : null,
        after_value: sRand(day*43+j)<0.5 ? `Score: ${(sRand(day+j+1)*100).toFixed(1)}` : 'completed',
        reversible: sRand(day*47+j) < 0.6,
        severity: sev,
      });
    }
  }

  events.sort((a,b)=>new Date(b.timestamp)-new Date(a.timestamp));
  return events.slice(0, MAX_EVENTS);
}

/* ─── Shared UI Components ─── */
const KpiCard = ({label,value,sub,color}) => (
  <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:'14px 18px',minWidth:130,borderTop:`3px solid ${color||T.gold}`}}>
    <div style={{fontSize:11,color:T.textMut,fontWeight:600,textTransform:'uppercase',letterSpacing:0.5}}>{label}</div>
    <div style={{fontSize:22,fontWeight:700,color:T.navy,marginTop:4}}>{value}</div>
    {sub && <div style={{fontSize:11,color:T.textSec,marginTop:2}}>{sub}</div>}
  </div>
);

const Btn = ({children,onClick,active,small,color}) => (
  <button onClick={onClick} style={{padding:small?'4px 10px':'7px 16px',borderRadius:6,border:`1px solid ${active?color||T.navy:T.border}`,background:active?color||T.navy:'transparent',color:active?'#fff':T.text,fontWeight:600,fontSize:small?11:13,cursor:'pointer',fontFamily:T.font,transition:'all .15s'}}>{children}</button>
);

const Badge = ({text,color,bg}) => (
  <span style={{display:'inline-block',padding:'2px 8px',borderRadius:10,fontSize:10,fontWeight:700,color:color||'#fff',background:bg||T.navy,letterSpacing:0.3}}>{text}</span>
);

const SevBadge = ({sev}) => {
  const m = {info:{c:'#2563eb',b:'#dbeafe'},warning:{c:'#d97706',b:'#fef3c7'},critical:{c:'#dc2626',b:'#fee2e2'}};
  const s = m[sev]||m.info;
  return <Badge text={sev.toUpperCase()} color={s.c} bg={s.b}/>;
};

const Section = ({title,badge,children}) => (
  <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:12,padding:24,marginBottom:20}}>
    <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:16}}>
      <h3 style={{margin:0,fontSize:16,fontWeight:700,color:T.navy}}>{title}</h3>
      {badge && <Badge text={badge} bg={T.gold} color={T.navy}/>}
    </div>
    {children}
  </div>
);

/* ─── Main Component ─── */
export default function AuditTrailPage() {
  const navigate = useNavigate();
  const companies = useMemo(()=>(GLOBAL_COMPANY_MASTER||[]).slice(0,80),[]);

  // Portfolio read (wrapped format)
  const portfolio = useMemo(()=>{
    try {
      const raw = JSON.parse(localStorage.getItem('ra_portfolio_v1')||'{}');
      const portfolios = raw.portfolios || {};
      const active = raw.activePortfolio || Object.keys(portfolios)[0] || '';
      return { portfolios, activePortfolio: active, holdings: portfolios[active]?.holdings || [] };
    } catch { return { portfolios:{}, activePortfolio:'', holdings:[] }; }
  },[]);

  // Audit log state
  const [events, setEvents] = useState(()=>{
    try {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)||'[]');
      if (stored.length > 10) return stored;
    } catch {}
    const synth = generateSyntheticEvents(companies);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(synth));
    return synth;
  });

  const saveEvents = useCallback((evts)=>{
    const trimmed = evts.slice(0,MAX_EVENTS);
    setEvents(trimmed);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  },[]);

  // Filters
  const [activeCats, setActiveCats] = useState(new Set(AUDIT_CATEGORIES.map(c=>c.id)));
  const [activeSevs, setActiveSevs] = useState(new Set(SEVERITIES));
  const [searchText, setSearchText] = useState('');
  const [dateRange, setDateRange] = useState(30);
  const [tab, setTab] = useState('timeline');
  const [selectedEntity, setSelectedEntity] = useState('');

  // Manual event form
  const [manualCat, setManualCat] = useState('data_change');
  const [manualAction, setManualAction] = useState('');
  const [manualDetail, setManualDetail] = useState('');
  const [manualEntity, setManualEntity] = useState('');
  const [manualSev, setManualSev] = useState('info');

  // Retention
  const [purgeDays, setPurgeDays] = useState(90);
  const [showPurgeConfirm, setShowPurgeConfirm] = useState(false);

  // Filtered events
  const filtered = useMemo(()=>{
    const cutoff = Date.now() - dateRange*86400000;
    return events.filter(e => {
      if (!activeCats.has(e.category)) return false;
      if (!activeSevs.has(e.severity)) return false;
      if (new Date(e.timestamp).getTime() < cutoff && dateRange < 9999) return false;
      if (searchText) {
        const q = searchText.toLowerCase();
        if (!((e.action||'').toLowerCase().includes(q) || (e.detail||'').toLowerCase().includes(q) || (e.entity||'').toLowerCase().includes(q) || (e.module||'').toLowerCase().includes(q))) return false;
      }
      return true;
    });
  },[events,activeCats,activeSevs,searchText,dateRange]);

  // KPI calculations
  const kpis = useMemo(()=>{
    const today = new Date().toDateString();
    const todayEvts = events.filter(e=>new Date(e.timestamp).toDateString()===today);
    const byCat = {};
    AUDIT_CATEGORIES.forEach(c=>byCat[c.id]=0);
    events.forEach(e=>byCat[e.category]=(byCat[e.category]||0)+1);
    return {
      total: events.length,
      today: todayEvts.length,
      dataChanges: byCat.data_change||0,
      modelRuns: byCat.model_run||0,
      portfolioActions: byCat.portfolio_action||0,
      reports: byCat.report_generation||0,
      alerts: byCat.alert_action||0,
      configs: byCat.config_change||0,
      compliance: byCat.compliance||0,
      engagements: byCat.engagement||0,
    };
  },[events]);

  // Category distribution for pie
  const catDist = useMemo(()=>AUDIT_CATEGORIES.map(c=>({ name:c.name, value:filtered.filter(e=>e.category===c.id).length, color:c.color })).filter(d=>d.value>0),[filtered]);

  // Activity trend (last 30 days stacked)
  const activityTrend = useMemo(()=>{
    const days = [];
    for(let i=29; i>=0; i--) {
      const d = new Date(Date.now()-i*86400000);
      const ds = d.toDateString();
      const dayData = { date: d.toLocaleDateString('en-GB',{day:'2-digit',month:'short'}) };
      AUDIT_CATEGORIES.forEach(c=>{
        dayData[c.name] = events.filter(e=>new Date(e.timestamp).toDateString()===ds && e.category===c.id).length;
      });
      days.push(dayData);
    }
    return days;
  },[events]);

  // Module heatmap
  const moduleHeatmap = useMemo(()=>{
    const map = {};
    MODULES.forEach(m=>{
      map[m] = {};
      AUDIT_CATEGORIES.forEach(c=>map[m][c.id]=0);
    });
    events.forEach(e=>{
      if(map[e.module]) map[e.module][e.category]=(map[e.module][e.category]||0)+1;
    });
    return MODULES.map(m=>({module:m,...map[m], total:Object.values(map[m]).reduce((a,b)=>a+b,0)})).sort((a,b)=>b.total-a.total);
  },[events]);

  // Entity activity
  const entityActivity = useMemo(()=>{
    const map = {};
    events.forEach(e=>{
      if(!e.entity||e.entity==='System') return;
      if(!map[e.entity]) map[e.entity]={entity:e.entity,count:0,categories:new Set(),lastEvent:e.timestamp};
      map[e.entity].count++;
      map[e.entity].categories.add(e.category);
    });
    return Object.values(map).map(e=>({...e,categories:e.categories.size})).sort((a,b)=>b.count-a.count).slice(0,30);
  },[events]);

  // Entity history
  const entityHistory = useMemo(()=>{
    if(!selectedEntity) return [];
    return events.filter(e=>e.entity===selectedEntity);
  },[events,selectedEntity]);

  // Compliance evidence
  const complianceEvents = useMemo(()=>events.filter(e=>e.category==='compliance'||e.severity==='critical'||e.category==='report_generation'),[events]);

  // Data integrity check
  const integrityIssues = useMemo(()=>{
    const issues = [];
    try {
      const overrides = JSON.parse(localStorage.getItem('ra_manual_overrides')||'{}');
      if(typeof overrides==='object' && Object.keys(overrides).length>0) {
        const coNames = companies.map(c=>c.name);
        Object.keys(overrides).forEach(k=>{
          if(!coNames.some(n=>k.includes(n))) issues.push({type:'Orphaned Override',detail:`Override key "${k}" does not match any known company`,severity:'warning'});
        });
      }
    } catch { issues.push({type:'Parse Error',detail:'ra_manual_overrides is corrupt',severity:'critical'}); }
    try {
      const p = JSON.parse(localStorage.getItem('ra_portfolio_v1')||'{}');
      if(p.portfolios) {
        Object.entries(p.portfolios).forEach(([name,pf])=>{
          if(!pf.holdings||pf.holdings.length===0) issues.push({type:'Empty Portfolio',detail:`Portfolio "${name}" has no holdings`,severity:'warning'});
        });
      }
    } catch { issues.push({type:'Parse Error',detail:'ra_portfolio_v1 is corrupt',severity:'critical'}); }
    if(issues.length===0) issues.push({type:'All Clear',detail:'No data integrity issues detected',severity:'info'});
    return issues;
  },[companies]);

  // Toggle helpers
  const toggleCat = id => {
    const s = new Set(activeCats);
    s.has(id) ? s.delete(id) : s.add(id);
    setActiveCats(s);
  };
  const toggleSev = s => {
    const ss = new Set(activeSevs);
    ss.has(s) ? ss.delete(s) : ss.add(s);
    setActiveSevs(ss);
  };

  // Add manual event
  const addManualEvent = () => {
    if(!manualAction.trim()) return;
    const ev = {
      id:`AUD-${Date.now()}`,
      timestamp: new Date().toISOString(),
      category: manualCat,
      action: manualAction,
      detail: manualDetail || manualAction,
      module: 'Manual Entry',
      entity: manualEntity || 'System',
      user: 'Manual',
      before_value: null,
      after_value: 'recorded',
      reversible: false,
      severity: manualSev,
    };
    saveEvents([ev,...events]);
    setManualAction(''); setManualDetail(''); setManualEntity('');
  };

  // Purge
  const purgeOld = () => {
    const cutoff = Date.now() - purgeDays*86400000;
    const kept = events.filter(e=>new Date(e.timestamp).getTime()>=cutoff);
    saveEvents(kept);
    setShowPurgeConfirm(false);
  };

  // Export functions
  const exportCSV = () => {
    const headers = ['ID','Timestamp','Category','Action','Detail','Module','Entity','User','Severity','Before','After','Reversible'];
    const rows = filtered.map(e=>[e.id,e.timestamp,e.category,e.action,`"${(e.detail||'').replace(/"/g,"'")}"`,e.module,e.entity,e.user,e.severity,e.before_value||'',e.after_value||'',e.reversible]);
    const csv = [headers.join(','),...rows.map(r=>r.join(','))].join('\n');
    const blob = new Blob([csv],{type:'text/csv'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href=url; a.download=`audit_trail_${new Date().toISOString().slice(0,10)}.csv`; a.click(); URL.revokeObjectURL(url);
  };

  const exportJSON = () => {
    const pkg = { exported: new Date().toISOString(), platform:'Risk Analytics v6.0', evidence_type:'Compliance Audit Trail', total_events: complianceEvents.length, events: complianceEvents.map(e=>({...e})) };
    const blob = new Blob([JSON.stringify(pkg,null,2)],{type:'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href=url; a.download=`evidence_package_${new Date().toISOString().slice(0,10)}.json`; a.click(); URL.revokeObjectURL(url);
  };

  const exportPrint = () => window.print();

  // Unique entities for dropdown
  const entityList = useMemo(()=>[...new Set(events.map(e=>e.entity).filter(Boolean))].sort(),[events]);

  // Empty state
  if(events.length===0) return (
    <div style={{fontFamily:T.font,background:T.bg,minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center'}}>
      <div style={{textAlign:'center',padding:60,background:T.surface,borderRadius:16,border:`1px solid ${T.border}`}}>
        <div style={{fontSize:48,marginBottom:16}}>📋</div>
        <h2 style={{color:T.navy,margin:'0 0 8px'}}>No Audit Events Yet</h2>
        <p style={{color:T.textSec}}>Platform activity will be logged here automatically. Use the Manual Logger to add offline decisions.</p>
      </div>
    </div>
  );

  const TABS = [{id:'timeline',l:'Timeline'},{id:'analytics',l:'Analytics'},{id:'compliance',l:'Compliance'},{id:'entity',l:'Entity History'},{id:'integrity',l:'Data Integrity'},{id:'manual',l:'Manual Logger'},{id:'retention',l:'Retention'}];

  return (
    <div style={{fontFamily:T.font,background:T.bg,minHeight:'100vh',padding:'24px 32px',color:T.text}}>
      {/* ── 1. Header ── */}
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:24}}>
        <div>
          <div style={{display:'flex',alignItems:'center',gap:12}}>
            <h1 style={{margin:0,fontSize:26,fontWeight:800,color:T.navy}}>Decision Audit Trail</h1>
            <Badge text="8 Categories" bg={T.gold} color={T.navy}/>
            <Badge text="Immutable" bg={T.sage} color="#fff"/>
            <Badge text="Regulatory-Ready" bg={T.navy}/>
          </div>
          <p style={{margin:'6px 0 0',fontSize:13,color:T.textSec}}>Comprehensive activity log for governance, compliance evidence, and regulatory audit readiness</p>
        </div>
        <div style={{display:'flex',gap:8}}>
          <Btn onClick={exportCSV} color={T.sage}>CSV Export</Btn>
          <Btn onClick={exportJSON} color={T.navyL}>Evidence JSON</Btn>
          <Btn onClick={exportPrint}>Print</Btn>
        </div>
      </div>

      {/* ── 2. KPI Cards ── */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:12,marginBottom:20}}>
        <KpiCard label="Total Events" value={kpis.total.toLocaleString()} sub={`Max ${MAX_EVENTS} FIFO`} color={T.navy}/>
        <KpiCard label="Events Today" value={kpis.today} sub={new Date().toLocaleDateString('en-GB')} color={T.gold}/>
        <KpiCard label="Data Changes" value={kpis.dataChanges} color="#2563eb"/>
        <KpiCard label="Model Runs" value={kpis.modelRuns} color="#7c3aed"/>
        <KpiCard label="Portfolio Actions" value={kpis.portfolioActions} color="#0d9488"/>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:12,marginBottom:24}}>
        <KpiCard label="Reports Generated" value={kpis.reports} color="#d97706"/>
        <KpiCard label="Alerts Actioned" value={kpis.alerts} color="#dc2626"/>
        <KpiCard label="Config Changes" value={kpis.configs} color="#6b7280"/>
        <KpiCard label="Compliance Events" value={kpis.compliance} color="#991b1b"/>
        <KpiCard label="Engagements Logged" value={kpis.engagements} color="#16a34a"/>
      </div>

      {/* ── 4. Category Filter Bar ── */}
      <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:'12px 16px',marginBottom:12,display:'flex',alignItems:'center',gap:8,flexWrap:'wrap'}}>
        {AUDIT_CATEGORIES.map(c=>(
          <button key={c.id} onClick={()=>toggleCat(c.id)} style={{display:'flex',alignItems:'center',gap:4,padding:'5px 12px',borderRadius:20,border:`1px solid ${activeCats.has(c.id)?c.color:T.border}`,background:activeCats.has(c.id)?c.color+'18':'transparent',color:activeCats.has(c.id)?c.color:T.textMut,fontSize:12,fontWeight:600,cursor:'pointer',fontFamily:T.font,transition:'all .15s'}}>
            <span>{c.icon}</span>{c.name}
          </button>
        ))}
        <div style={{flex:1}}/>
        <input value={searchText} onChange={e=>setSearchText(e.target.value)} placeholder="Search events..." style={{padding:'6px 12px',border:`1px solid ${T.border}`,borderRadius:6,fontSize:13,fontFamily:T.font,width:200,background:T.surface}}/>
        <div style={{display:'flex',gap:4}}>
          {DATE_RANGES.map(r=>(
            <Btn key={r.l} small active={dateRange===r.d} onClick={()=>setDateRange(r.d)}>{r.l}</Btn>
          ))}
        </div>
      </div>

      {/* ── 5. Severity Filter ── */}
      <div style={{display:'flex',gap:6,marginBottom:20}}>
        {SEVERITIES.map(s=>{
          const cs = {info:{c:'#2563eb',l:'Info'},warning:{c:'#d97706',l:'Warning'},critical:{c:'#dc2626',l:'Critical'}};
          return <Btn key={s} small active={activeSevs.has(s)} color={cs[s].c} onClick={()=>toggleSev(s)}>{cs[s].l}</Btn>;
        })}
        <span style={{fontSize:12,color:T.textMut,alignSelf:'center',marginLeft:8}}>{filtered.length} events shown</span>
      </div>

      {/* ── Tab Nav ── */}
      <div style={{display:'flex',gap:4,marginBottom:20,borderBottom:`2px solid ${T.border}`,paddingBottom:0}}>
        {TABS.map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)} style={{padding:'8px 18px',border:'none',borderBottom:tab===t.id?`3px solid ${T.navy}`:'3px solid transparent',background:'transparent',color:tab===t.id?T.navy:T.textMut,fontWeight:tab===t.id?700:500,fontSize:13,cursor:'pointer',fontFamily:T.font}}>{t.l}</button>
        ))}
      </div>

      {/* ── 3. Timeline Tab ── */}
      {tab==='timeline' && (
        <Section title="Audit Log Timeline" badge={`${filtered.length} events`}>
          <div style={{maxHeight:600,overflowY:'auto',paddingRight:8}}>
            {filtered.slice(0,100).map((e,i)=>{
              const cat = catMap[e.category]||AUDIT_CATEGORIES[0];
              return (
                <div key={e.id+i} style={{display:'flex',gap:12,padding:'10px 0',borderBottom:`1px solid ${T.border}22`,alignItems:'flex-start'}}>
                  <div style={{width:36,height:36,borderRadius:8,background:cat.color+'18',display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,flexShrink:0}}>{cat.icon}</div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{display:'flex',alignItems:'center',gap:8,flexWrap:'wrap'}}>
                      <Badge text={cat.name} bg={cat.color} color="#fff"/>
                      <SevBadge sev={e.severity}/>
                      <span style={{fontSize:11,color:T.textMut}}>{fmtDate(e.timestamp)} {fmtTime(e.timestamp)}</span>
                      {e.user==='Manual' && <Badge text="MANUAL" bg={T.amber} color="#fff"/>}
                    </div>
                    <div style={{fontSize:13,fontWeight:600,color:T.navy,marginTop:4}}>{e.action}</div>
                    <div style={{fontSize:12,color:T.textSec,marginTop:2}}>{e.detail}</div>
                    <div style={{display:'flex',gap:16,marginTop:4,fontSize:11,color:T.textMut}}>
                      <span>Module: {e.module}</span>
                      <span>Entity: {e.entity}</span>
                      {e.before_value && <span>Before: {e.before_value}</span>}
                      {e.after_value && <span>After: {e.after_value}</span>}
                      {e.reversible && <span style={{color:T.sage}}>Reversible</span>}
                    </div>
                  </div>
                </div>
              );
            })}
            {filtered.length > 100 && <div style={{textAlign:'center',padding:16,color:T.textMut,fontSize:12}}>Showing 100 of {filtered.length} events. Narrow filters to see more.</div>}
          </div>
        </Section>
      )}

      {/* ── Analytics Tab ── */}
      {tab==='analytics' && (<>
        {/* 6. Category Distribution Pie */}
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:20,marginBottom:20}}>
          <Section title="Category Distribution">
            {catDist.length>0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={catDist} cx="50%" cy="50%" outerRadius={100} innerRadius={50} dataKey="value" nameKey="name" label={({name,percent})=>`${name} ${(percent*100).toFixed(0)}%`} labelLine={false} style={{fontSize:10}}>
                    {catDist.map((d,i)=><Cell key={i} fill={d.color}/>)}
                  </Pie>
                  <Tooltip/>
                </PieChart>
              </ResponsiveContainer>
            ) : <div style={{textAlign:'center',padding:40,color:T.textMut}}>No events in selected range</div>}
          </Section>

          {/* 7. Activity Trend Area */}
          <Section title="Activity Trend (30 Days)">
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={activityTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
                <XAxis dataKey="date" tick={{fontSize:10}} interval={4}/>
                <YAxis tick={{fontSize:10}}/>
                <Tooltip/>
                {AUDIT_CATEGORIES.slice(0,5).map(c=>(
                  <Area key={c.id} type="monotone" dataKey={c.name} stackId="1" fill={c.color} stroke={c.color} fillOpacity={0.6}/>
                ))}
              </AreaChart>
            </ResponsiveContainer>
          </Section>
        </div>

        {/* 8. Module Activity Heatmap */}
        <Section title="Module Activity Heatmap" badge={`${MODULES.length} modules`}>
          <div style={{overflowX:'auto'}}>
            <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
              <thead>
                <tr style={{background:T.surfaceH}}>
                  <th style={{textAlign:'left',padding:'8px 12px',fontWeight:700,color:T.navy,borderBottom:`2px solid ${T.border}`}}>Module</th>
                  {AUDIT_CATEGORIES.map(c=><th key={c.id} style={{padding:'8px 6px',fontWeight:600,color:c.color,borderBottom:`2px solid ${T.border}`,fontSize:10,textAlign:'center'}}>{c.icon}</th>)}
                  <th style={{padding:'8px 12px',fontWeight:700,color:T.navy,borderBottom:`2px solid ${T.border}`,textAlign:'center'}}>Total</th>
                </tr>
              </thead>
              <tbody>
                {moduleHeatmap.slice(0,12).map((row,i)=>(
                  <tr key={row.module} style={{background:i%2===0?'transparent':T.surfaceH}}>
                    <td style={{padding:'6px 12px',fontWeight:600,color:T.navy}}>{row.module}</td>
                    {AUDIT_CATEGORIES.map(c=>{
                      const v = row[c.id]||0;
                      const maxV = Math.max(...moduleHeatmap.map(r=>r[c.id]||0),1);
                      const intensity = v/maxV;
                      return <td key={c.id} style={{textAlign:'center',padding:'6px',background:`${c.color}${Math.round(intensity*40).toString(16).padStart(2,'0')}`,color:intensity>0.5?c.color:T.textMut,fontWeight:intensity>0.5?700:400}}>{v||'-'}</td>;
                    })}
                    <td style={{textAlign:'center',padding:'6px',fontWeight:700,color:T.navy}}>{row.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>

        {/* 9. Entity Activity Table */}
        <Section title="Entity Activity" badge={`Top ${entityActivity.length}`}>
          <div style={{overflowX:'auto',maxHeight:350,overflowY:'auto'}}>
            <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
              <thead>
                <tr style={{background:T.surfaceH,position:'sticky',top:0}}>
                  <th style={{textAlign:'left',padding:'8px 12px',fontWeight:700,color:T.navy}}>Entity</th>
                  <th style={{textAlign:'center',padding:'8px',fontWeight:700,color:T.navy}}>Events</th>
                  <th style={{textAlign:'center',padding:'8px',fontWeight:700,color:T.navy}}>Categories</th>
                  <th style={{textAlign:'left',padding:'8px',fontWeight:700,color:T.navy}}>Last Event</th>
                  <th style={{textAlign:'center',padding:'8px',fontWeight:700,color:T.navy}}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {entityActivity.map((e,i)=>(
                  <tr key={e.entity} style={{borderBottom:`1px solid ${T.border}22`,background:i%2?T.surfaceH:'transparent'}}>
                    <td style={{padding:'6px 12px',fontWeight:600,color:T.navy}}>{e.entity}</td>
                    <td style={{textAlign:'center',fontWeight:700}}>{e.count}</td>
                    <td style={{textAlign:'center'}}>{e.categories}</td>
                    <td style={{fontSize:11,color:T.textSec}}>{fmtDate(e.lastEvent)}</td>
                    <td style={{textAlign:'center'}}><Btn small onClick={()=>{setSelectedEntity(e.entity);setTab('entity')}}>View</Btn></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>
      </>)}

      {/* ── Compliance Tab ── */}
      {tab==='compliance' && (
        <Section title="Compliance Evidence Panel" badge={`${complianceEvents.length} evidence events`}>
          <div style={{marginBottom:12}}>
            <Btn onClick={exportJSON} color={T.sage} active>Export Evidence Package (JSON)</Btn>
          </div>
          <div style={{maxHeight:500,overflowY:'auto'}}>
            {complianceEvents.slice(0,80).map((e,i)=>{
              const cat = catMap[e.category]||AUDIT_CATEGORIES[0];
              return (
                <div key={e.id+i} style={{display:'flex',gap:10,padding:'8px 0',borderBottom:`1px solid ${T.border}22`}}>
                  <span style={{fontSize:16}}>{cat.icon}</span>
                  <div style={{flex:1}}>
                    <div style={{display:'flex',gap:6,alignItems:'center'}}>
                      <Badge text={cat.name} bg={cat.color}/>
                      <SevBadge sev={e.severity}/>
                      <span style={{fontSize:11,color:T.textMut}}>{fmtDate(e.timestamp)} {fmtTime(e.timestamp)}</span>
                    </div>
                    <div style={{fontSize:13,fontWeight:600,color:T.navy,marginTop:2}}>{e.action}</div>
                    <div style={{fontSize:11,color:T.textSec}}>{e.detail}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </Section>
      )}

      {/* ── Entity History Tab ── */}
      {tab==='entity' && (
        <Section title="Change History per Entity">
          <div style={{marginBottom:16}}>
            <select value={selectedEntity} onChange={e=>setSelectedEntity(e.target.value)} style={{padding:'8px 12px',border:`1px solid ${T.border}`,borderRadius:6,fontSize:13,fontFamily:T.font,minWidth:300}}>
              <option value="">Select an entity...</option>
              {entityList.map(e=><option key={e} value={e}>{e}</option>)}
            </select>
          </div>
          {selectedEntity ? (
            entityHistory.length > 0 ? (
              <div style={{maxHeight:500,overflowY:'auto'}}>
                {entityHistory.slice(0,60).map((e,i)=>{
                  const cat = catMap[e.category]||AUDIT_CATEGORIES[0];
                  return (
                    <div key={e.id+i} style={{display:'flex',gap:10,padding:'8px 0',borderBottom:`1px solid ${T.border}22`}}>
                      <div style={{width:60,fontSize:10,color:T.textMut,textAlign:'right',paddingTop:2,flexShrink:0}}>{fmtDate(e.timestamp)}<br/>{fmtTime(e.timestamp)}</div>
                      <div style={{width:3,background:cat.color,borderRadius:2,flexShrink:0}}/>
                      <div style={{flex:1}}>
                        <div style={{display:'flex',gap:6,alignItems:'center'}}>
                          <Badge text={cat.name} bg={cat.color}/>
                          <SevBadge sev={e.severity}/>
                        </div>
                        <div style={{fontSize:13,fontWeight:600,color:T.navy,marginTop:2}}>{e.action}</div>
                        <div style={{fontSize:11,color:T.textSec}}>{e.detail}</div>
                        {(e.before_value||e.after_value) && (
                          <div style={{fontSize:11,marginTop:2}}>
                            {e.before_value && <span style={{color:T.red}}>Before: {e.before_value}</span>}
                            {e.before_value && e.after_value && <span style={{margin:'0 6px',color:T.textMut}}>→</span>}
                            {e.after_value && <span style={{color:T.green}}>After: {e.after_value}</span>}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : <div style={{textAlign:'center',padding:30,color:T.textMut}}>No events found for {selectedEntity}</div>
          ) : <div style={{textAlign:'center',padding:40,color:T.textMut}}>Select an entity above to view its complete change history</div>}
        </Section>
      )}

      {/* ── Data Integrity Tab ── */}
      {tab==='integrity' && (
        <Section title="Data Integrity Check" badge={`${integrityIssues.length} items`}>
          <p style={{fontSize:12,color:T.textSec,marginBottom:16}}>Scans localStorage for orphaned overrides, empty portfolios, missing references, and corrupt data.</p>
          {integrityIssues.map((issue,i)=>(
            <div key={i} style={{display:'flex',gap:10,padding:'10px 14px',background:issue.severity==='critical'?'#fee2e2':issue.severity==='warning'?'#fef3c7':'#f0fdf4',borderRadius:8,marginBottom:8,alignItems:'center'}}>
              <span style={{fontSize:18}}>{issue.severity==='critical'?'🔴':issue.severity==='warning'?'🟡':'🟢'}</span>
              <div>
                <div style={{fontSize:13,fontWeight:600,color:T.navy}}>{issue.type}</div>
                <div style={{fontSize:12,color:T.textSec}}>{issue.detail}</div>
              </div>
            </div>
          ))}
        </Section>
      )}

      {/* ── Manual Logger Tab ── */}
      {tab==='manual' && (
        <Section title="Manual Event Logger" badge="Record offline decisions">
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,maxWidth:700}}>
            <div>
              <label style={{fontSize:12,fontWeight:600,color:T.navy,display:'block',marginBottom:4}}>Category</label>
              <select value={manualCat} onChange={e=>setManualCat(e.target.value)} style={{width:'100%',padding:'8px 12px',border:`1px solid ${T.border}`,borderRadius:6,fontSize:13,fontFamily:T.font}}>
                {AUDIT_CATEGORIES.map(c=><option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
              </select>
            </div>
            <div>
              <label style={{fontSize:12,fontWeight:600,color:T.navy,display:'block',marginBottom:4}}>Severity</label>
              <select value={manualSev} onChange={e=>setManualSev(e.target.value)} style={{width:'100%',padding:'8px 12px',border:`1px solid ${T.border}`,borderRadius:6,fontSize:13,fontFamily:T.font}}>
                {SEVERITIES.map(s=><option key={s} value={s}>{s.charAt(0).toUpperCase()+s.slice(1)}</option>)}
              </select>
            </div>
            <div style={{gridColumn:'1/-1'}}>
              <label style={{fontSize:12,fontWeight:600,color:T.navy,display:'block',marginBottom:4}}>Action *</label>
              <input value={manualAction} onChange={e=>setManualAction(e.target.value)} placeholder="Short action description..." style={{width:'100%',padding:'8px 12px',border:`1px solid ${T.border}`,borderRadius:6,fontSize:13,fontFamily:T.font,boxSizing:'border-box'}}/>
            </div>
            <div style={{gridColumn:'1/-1'}}>
              <label style={{fontSize:12,fontWeight:600,color:T.navy,display:'block',marginBottom:4}}>Detail</label>
              <textarea value={manualDetail} onChange={e=>setManualDetail(e.target.value)} placeholder="Full detail text..." rows={3} style={{width:'100%',padding:'8px 12px',border:`1px solid ${T.border}`,borderRadius:6,fontSize:13,fontFamily:T.font,boxSizing:'border-box',resize:'vertical'}}/>
            </div>
            <div>
              <label style={{fontSize:12,fontWeight:600,color:T.navy,display:'block',marginBottom:4}}>Entity</label>
              <input value={manualEntity} onChange={e=>setManualEntity(e.target.value)} placeholder="Company or portfolio name..." style={{width:'100%',padding:'8px 12px',border:`1px solid ${T.border}`,borderRadius:6,fontSize:13,fontFamily:T.font,boxSizing:'border-box'}}/>
            </div>
            <div style={{display:'flex',alignItems:'flex-end'}}>
              <Btn onClick={addManualEvent} active color={T.sage}>Add Audit Event</Btn>
            </div>
          </div>
        </Section>
      )}

      {/* ── Retention Tab ── */}
      {tab==='retention' && (
        <Section title="Retention Management">
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:16,marginBottom:20}}>
            <KpiCard label="Total Events" value={events.length} sub={`Max ${MAX_EVENTS}`} color={T.navy}/>
            <KpiCard label="Storage Used" value={`${(JSON.stringify(events).length/1024).toFixed(1)} KB`} sub="localStorage" color={T.gold}/>
            <KpiCard label="Oldest Event" value={events.length?fmtDate(events[events.length-1].timestamp):'N/A'} color={T.sage}/>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:16,marginTop:12}}>
            <label style={{fontSize:13,fontWeight:600,color:T.navy}}>Purge events older than:</label>
            <input type="range" min={7} max={365} value={purgeDays} onChange={e=>setPurgeDays(Number(e.target.value))} style={{flex:1,maxWidth:300}}/>
            <span style={{fontSize:14,fontWeight:700,color:T.navy,minWidth:60}}>{purgeDays} days</span>
            <Btn onClick={()=>setShowPurgeConfirm(true)} color={T.red}>Purge</Btn>
          </div>
          {showPurgeConfirm && (
            <div style={{marginTop:16,padding:16,background:'#fee2e2',borderRadius:8,border:'1px solid #fca5a5'}}>
              <p style={{fontSize:13,fontWeight:600,color:'#991b1b',margin:'0 0 8px'}}>Are you sure? This will permanently remove events older than {purgeDays} days.</p>
              <div style={{display:'flex',gap:8}}>
                <Btn onClick={purgeOld} active color={T.red}>Confirm Purge</Btn>
                <Btn onClick={()=>setShowPurgeConfirm(false)}>Cancel</Btn>
              </div>
            </div>
          )}
        </Section>
      )}

      {/* ── 15. Export Audit Report ── */}
      <Section title="Export Audit Report">
        <p style={{fontSize:12,color:T.textSec,marginBottom:12}}>Generate a comprehensive regulatory audit report covering all events in the current filter range, categorized by type with full entity cross-reference.</p>
        <div style={{display:'flex',gap:8}}>
          <Btn onClick={exportCSV} active color={T.navy}>Full Log CSV</Btn>
          <Btn onClick={exportJSON} active color={T.sage}>Evidence Package JSON</Btn>
          <Btn onClick={exportPrint} active color={T.gold}>Print Report</Btn>
        </div>
      </Section>

      {/* ── 16. Cross-Navigation ── */}
      <div style={{display:'flex',gap:12,marginTop:8}}>
        <button onClick={()=>navigate('/model-governance')} style={{padding:'10px 20px',borderRadius:8,border:`1px solid ${T.border}`,background:T.surface,cursor:'pointer',fontFamily:T.font,fontSize:13,fontWeight:600,color:T.navy}}>Model Governance →</button>
        <button onClick={()=>navigate('/regulatory-gap')} style={{padding:'10px 20px',borderRadius:8,border:`1px solid ${T.border}`,background:T.surface,cursor:'pointer',fontFamily:T.font,fontSize:13,fontWeight:600,color:T.navy}}>Regulatory Gap →</button>
        <button onClick={()=>navigate('/csrd-ixbrl')} style={{padding:'10px 20px',borderRadius:8,border:`1px solid ${T.border}`,background:T.surface,cursor:'pointer',fontFamily:T.font,fontSize:13,fontWeight:600,color:T.navy}}>CSRD Compliance →</button>
        <button onClick={()=>navigate('/quant-dashboard')} style={{padding:'10px 20px',borderRadius:8,border:`1px solid ${T.border}`,background:T.surface,cursor:'pointer',fontFamily:T.font,fontSize:13,fontWeight:600,color:T.navy}}>Quant Dashboard →</button>
      </div>
    </div>
  );
}
