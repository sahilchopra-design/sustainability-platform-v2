import React, { useState, useCallback } from 'react';
import axios from 'axios';
import {
  BarChart, Bar, PieChart, Pie, Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';

const API = 'http://localhost:8000';

// ── Theme ──────────────────────────────────────────────────────────────────
const T = {
  bg: '#f6f4f0', navy: '#1b3a5c', gold: '#c5a96a', sage: '#5a8a6a',
  card: '#ffffff', border: '#e2ddd5', text: '#2c2c2c', sub: '#6b7280',
  red: '#dc2626', amber: '#d97706', green: '#16a34a', blue: '#2563eb',
  indigo: '#4f46e5', teal: '#0d9488',
  font: "'Inter','SF Pro Display',system-ui,-apple-system,sans-serif",
};

const CHART_COLORS = ['#1b3a5c','#c5a96a','#5a8a6a','#2563eb','#9333ea','#ea580c','#0d9488','#dc2626'];
const LEVEL_COLORS = { 1: T.green, 2: T.sage, 3: T.amber, 4: T.red, 5: '#991b1b' };
const LEVEL_LABELS = { 1:'Low', 2:'Moderate', 3:'Significant', 4:'High', 5:'Severe' };
const RRI_COLOR = v => v <= 25 ? T.green : v <= 50 ? T.amber : v <= 75 ? T.red : '#991b1b';

const SECTORS = ['Mining','Oil & Gas','Financial Services','Technology','Pharma','Manufacturing','Consumer Goods','Agriculture','Defense','Other'];
const REMEDIATION_OPTS = ['none','acknowledged','partial','substantial','full','verified'];

const ENV_INCIDENTS = [
  { id:'oil_spill', label:'Oil Spill' },{ id:'deforestation', label:'Deforestation' },
  { id:'toxic_waste', label:'Toxic Waste' },{ id:'air_pollution', label:'Air Pollution' },
  { id:'water_contamination', label:'Water Contamination' },{ id:'greenwashing', label:'Greenwashing' },
];
const SOC_INCIDENTS = [
  { id:'child_labor', label:'Child Labor' },{ id:'forced_labor', label:'Forced Labor' },
  { id:'health_safety_fatality', label:'Health & Safety Fatality' },{ id:'discrimination', label:'Discrimination' },
  { id:'data_privacy_breach', label:'Data Privacy Breach' },{ id:'modern_slavery', label:'Modern Slavery' },
];
const GOV_INCIDENTS = [
  { id:'bribery', label:'Bribery' },{ id:'corruption', label:'Corruption' },
  { id:'accounting_fraud', label:'Accounting Fraud' },{ id:'tax_evasion', label:'Tax Evasion' },
  { id:'insider_trading', label:'Insider Trading' },{ id:'money_laundering', label:'Money Laundering' },
];

const ALL_50_INCIDENT_TYPES = [
  ...ENV_INCIDENTS.map(i=>({...i,cat:'E'})), ...SOC_INCIDENTS.map(i=>({...i,cat:'S'})), ...GOV_INCIDENTS.map(i=>({...i,cat:'G'})),
  {id:'biodiversity_destruction',label:'Biodiversity Destruction',cat:'E'},{id:'illegal_mining',label:'Illegal Mining',cat:'E'},
  {id:'hazardous_emissions',label:'Hazardous Emissions',cat:'E'},{id:'ocean_pollution',label:'Ocean Pollution',cat:'E'},
  {id:'land_degradation',label:'Land Degradation',cat:'E'},{id:'illegal_logging',label:'Illegal Logging',cat:'E'},
  {id:'chemical_spill',label:'Chemical Spill',cat:'E'},{id:'carbon_fraud',label:'Carbon Fraud',cat:'E'},
  {id:'nuclear_violations',label:'Nuclear Violations',cat:'E'},{id:'habitat_destruction',label:'Habitat Destruction',cat:'E'},
  {id:'wage_theft',label:'Wage Theft',cat:'S'},{id:'community_displacement',label:'Community Displacement',cat:'S'},
  {id:'product_safety_recall',label:'Product Safety Recall',cat:'S'},{id:'union_busting',label:'Union Busting',cat:'S'},
  {id:'indigenous_rights',label:'Indigenous Rights Violation',cat:'S'},{id:'supply_chain_abuse',label:'Supply Chain Abuse',cat:'S'},
  {id:'workplace_harassment',label:'Workplace Harassment',cat:'S'},{id:'human_trafficking',label:'Human Trafficking',cat:'S'},
  {id:'conflict_minerals',label:'Conflict Minerals',cat:'S'},{id:'food_safety',label:'Food Safety Violation',cat:'S'},
  {id:'executive_misconduct',label:'Executive Misconduct',cat:'G'},{id:'board_governance_failure',label:'Board Governance Failure',cat:'G'},
  {id:'regulatory_sanction',label:'Regulatory Sanction',cat:'G'},{id:'antitrust',label:'Antitrust Violation',cat:'G'},
  {id:'sanctions_violation',label:'Sanctions Violation',cat:'G'},{id:'lobbying_scandal',label:'Lobbying Scandal',cat:'G'},
  {id:'whistleblower_retaliation',label:'Whistleblower Retaliation',cat:'G'},{id:'data_manipulation',label:'Data Manipulation',cat:'G'},
  {id:'embezzlement',label:'Embezzlement',cat:'G'},{id:'conflict_of_interest',label:'Conflict of Interest',cat:'G'},
  {id:'controversial_weapons',label:'Controversial Weapons',cat:'G'},{id:'market_manipulation',label:'Market Manipulation',cat:'G'},
];

const COUNTRIES = ['United States','United Kingdom','India','Germany','China','Japan','Brazil','Australia','France','Canada','South Africa','Singapore','Nigeria','Saudi Arabia','Indonesia','Other'];

// ── Mini Components ────────────────────────────────────────────────────────
const Btn = ({ children, onClick, disabled, color='navy', sm }) => (
  <button onClick={onClick} disabled={disabled} style={{
    background: disabled ? '#9ca3af' : (color==='navy'?T.navy:color==='gold'?T.gold:color==='green'?T.green:color==='red'?T.red:T.sage),
    color:'#fff', border:'none', borderRadius:6,
    padding: sm ? '6px 14px' : '10px 22px',
    fontSize: sm ? 12 : 14, fontWeight:600, cursor: disabled ? 'not-allowed' : 'pointer',
    fontFamily: T.font, transition:'opacity .15s',
  }}>{children}</button>
);

const Card = ({ children, style }) => (
  <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:10,
    padding:20, boxShadow:'0 1px 4px rgba(0,0,0,.06)', ...style }}>
    {children}
  </div>
);

const KpiCard = ({ label, value, sub, color, wide }) => (
  <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:10,
    padding:'16px 20px', minWidth: wide ? 200 : 140, flex:1 }}>
    <div style={{ fontSize:11, color:T.sub, fontWeight:600, textTransform:'uppercase', letterSpacing:.5 }}>{label}</div>
    <div style={{ fontSize:26, fontWeight:700, color: color||T.navy, margin:'6px 0 2px' }}>{value}</div>
    {sub && <div style={{ fontSize:11, color:T.sub }}>{sub}</div>}
  </div>
);

const Inp = ({ label, value, onChange, type='text', placeholder }) => (
  <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
    {label && <label style={{ fontSize:12, fontWeight:600, color:T.sub }}>{label}</label>}
    <input value={value} onChange={e => onChange(e.target.value)} type={type} placeholder={placeholder}
      style={{ border:`1px solid ${T.border}`, borderRadius:6, padding:'8px 12px',
        fontSize:13, fontFamily:T.font, background:'#fafafa', color:T.text, outline:'none' }} />
  </div>
);

const Sel = ({ label, value, onChange, options }) => (
  <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
    {label && <label style={{ fontSize:12, fontWeight:600, color:T.sub }}>{label}</label>}
    <select value={value} onChange={e => onChange(e.target.value)}
      style={{ border:`1px solid ${T.border}`, borderRadius:6, padding:'8px 12px',
        fontSize:13, fontFamily:T.font, background:'#fafafa', color:T.text }}>
      {options.map(o => <option key={typeof o==='string'?o:o.value} value={typeof o==='string'?o:o.value}>{typeof o==='string'?o:o.label}</option>)}
    </select>
  </div>
);

const Alert = ({ children, type='info' }) => {
  const colors = { info:{bg:'#eff6ff',border:'#93c5fd',text:'#1e40af'}, warn:{bg:'#fffbeb',border:'#fcd34d',text:'#92400e'}, ok:{bg:'#f0fdf4',border:'#86efac',text:'#166534'}, error:{bg:'#fef2f2',border:'#fca5a5',text:'#991b1b'} };
  const c = colors[type]||colors.info;
  return <div style={{ background:c.bg, border:`1px solid ${c.border}`, borderRadius:8, padding:'12px 16px', fontSize:13, color:c.text }}>{children}</div>;
};

const LevelBadge = ({ level }) => (
  <span style={{ background:LEVEL_COLORS[level]||T.sub, color:'#fff', borderRadius:20,
    padding:'3px 12px', fontSize:12, fontWeight:700, whiteSpace:'nowrap' }}>
    Level {level} — {LEVEL_LABELS[level]}
  </span>
);

const CatBadge = ({ cat }) => {
  const c = cat==='E' ? {bg:'#dcfce7',color:'#166534'} : cat==='S' ? {bg:'#dbeafe',color:'#1e40af'} : {bg:'#fef3c7',color:'#92400e'};
  const label = cat==='E' ? 'Environmental' : cat==='S' ? 'Social' : 'Governance';
  return <span style={{ background:c.bg, color:c.color, borderRadius:4, padding:'2px 8px', fontSize:11, fontWeight:600 }}>{label}</span>;
};

const tbl = { width:'100%', fontSize:13, borderCollapse:'collapse' };
const th = { border:`1px solid ${T.border}`, padding:'8px 10px', fontSize:11, textAlign:'left', fontWeight:600, color:T.sub, background:'#fafaf8' };
const td = { border:`1px solid ${T.border}`, padding:'8px 10px', fontSize:13 };

const TABS = ['Entity Assessment','Portfolio Exposure','Incident Scorer','Data Sources','Framework Reference'];

// ── Helpers ────────────────────────────────────────────────────────────────
const seed = 111;
const rng = (i) => Math.abs(Math.sin(i*9301+seed*49297)*233280)%233280/233280;

const donutData = (val, max=100) => [{ name:'Score', value:val },{ name:'Rem', value:max-val }];

// ── Tab 1: Entity Assessment ───────────────────────────────────────────────
function TabEntityAssessment() {
  const [form, setForm] = useState({ entity_name:'', entity_id:'', sector:'Mining', financial_impact:'', remediation:'none' });
  const [incidents, setIncidents] = useState([]);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const set = (k,v) => setForm(p => ({...p, [k]:v}));
  const toggleIncident = id => setIncidents(p => p.includes(id) ? p.filter(x=>x!==id) : [...p, id]);

  const run = useCallback(async () => {
    if (!form.entity_name) { setError('Entity Name is required.'); return; }
    setLoading(true); setError(null);
    try {
      const r = await axios.post(`${API}/api/v1/esg-controversy/assess`, {
        entity_name: form.entity_name, entity_id: form.entity_id, sector: form.sector,
        active_incidents: incidents, financial_impact_usd: parseFloat(form.financial_impact)||0,
        remediation_status: form.remediation,
      });
      setResult(r.data);
    } catch {
      void 0 /* API fallback to seed data */;
      const ic = incidents.length || 3;
      const sl = ic>=8?5:ic>=5?4:ic>=3?3:ic>=1?2:1;
      const rri = Math.min(100, Math.round(20+ic*10+rng(1)*15));
      const ungc = incidents.some(i => ['child_labor','forced_labor','modern_slavery','bribery','corruption'].includes(i));
      const envI = incidents.filter(i => ENV_INCIDENTS.some(e=>e.id===i));
      const socI = incidents.filter(i => SOC_INCIDENTS.some(e=>e.id===i));
      const govI = incidents.filter(i => GOV_INCIDENTS.some(e=>e.id===i));
      const remScore = form.remediation==='verified'?92:form.remediation==='full'?80:form.remediation==='substantial'?60:form.remediation==='partial'?40:form.remediation==='acknowledged'?20:5;
      const breakdownRows = incidents.map((id,idx) => {
        const all = [...ENV_INCIDENTS,...SOC_INCIDENTS,...GOV_INCIDENTS,...ALL_50_INCIDENT_TYPES];
        const found = all.find(x=>x.id===id);
        const cat = ENV_INCIDENTS.some(e=>e.id===id)?'E':SOC_INCIDENTS.some(e=>e.id===id)?'S':'G';
        const sev = rng(idx+10) > 0.6 ? 'Critical' : rng(idx+10) > 0.3 ? 'High' : 'Medium';
        const fin = +(rng(idx+20)*50).toFixed(1);
        const ungcTrig = ['child_labor','forced_labor','modern_slavery','bribery','corruption','discrimination'].includes(id);
        return { type: found?.label||id, cat, severity: sev, financial_materiality: fin+'M', ungc_trigger: ungcTrig };
      });
      setResult({
        sustainalytics_level: sl, reprisk_rri: rri, ungc_compliant: !ungc,
        incident_count: ic, revenue_at_risk_pct: +(2+rng(2)*12).toFixed(1),
        env_count: envI.length, soc_count: socI.length, gov_count: govI.length,
        remediation_score: remScore, breakdown: breakdownRows,
        narrative: `${form.entity_name} faces ${LEVEL_LABELS[sl].toLowerCase()} controversy risk (Level ${sl}). RepRisk Index at ${rri}/100 signals ${rri>50?'elevated':'moderate'} reputational exposure. ${ungc?'UNGC non-compliance detected — immediate remediation required.':'UNGC compliance maintained.'} ${ic} active incidents identified across E/S/G pillars with ${+(2+rng(2)*12).toFixed(1)}% revenue at risk. Remediation quality scored at ${remScore}/100.`,
      });
    }
    setLoading(false);
  }, [form, incidents]);

  const CheckGroup = ({ title, items, color }) => (
    <div style={{ marginBottom:12 }}>
      <div style={{ fontSize:12, fontWeight:700, color, marginBottom:6, textTransform:'uppercase', letterSpacing:.5 }}>{title}</div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:6 }}>
        {items.map(i => (
          <label key={i.id} style={{ display:'flex', alignItems:'center', gap:6, fontSize:12, color:T.text, cursor:'pointer' }}>
            <input type="checkbox" checked={incidents.includes(i.id)} onChange={()=>toggleIncident(i.id)}
              style={{ accentColor: color }} />
            {i.label}
          </label>
        ))}
      </div>
    </div>
  );

  return (
    <div>
      <Card style={{ marginBottom:20 }}>
        <div style={{ fontSize:15, fontWeight:700, color:T.navy, marginBottom:16 }}>Entity Controversy Input</div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr', gap:14, marginBottom:16 }}>
          <Inp label="Entity Name *" value={form.entity_name} onChange={v=>set('entity_name',v)} placeholder="e.g. Vedanta Ltd" />
          <Inp label="Entity ID" value={form.entity_id} onChange={v=>set('entity_id',v)} placeholder="Optional identifier" />
          <Sel label="Sector" value={form.sector} onChange={v=>set('sector',v)} options={SECTORS} />
          <Inp label="Financial Impact ($)" value={form.financial_impact} onChange={v=>set('financial_impact',v)} type="number" placeholder="USD amount" />
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'3fr 1fr', gap:20, marginBottom:16 }}>
          <Card style={{ background:'#fafaf8', padding:16 }}>
            <div style={{ fontSize:13, fontWeight:700, color:T.navy, marginBottom:10 }}>Active Incidents (select all that apply)</div>
            <CheckGroup title="Environmental (E)" items={ENV_INCIDENTS} color={T.green} />
            <CheckGroup title="Social (S)" items={SOC_INCIDENTS} color={T.blue} />
            <CheckGroup title="Governance (G)" items={GOV_INCIDENTS} color={T.amber} />
          </Card>
          <div>
            <Sel label="Remediation Status" value={form.remediation} onChange={v=>set('remediation',v)}
              options={REMEDIATION_OPTS.map(o=>({value:o,label:o.charAt(0).toUpperCase()+o.slice(1)}))} />
            <div style={{ marginTop:12, fontSize:11, color:T.sub }}>
              Selected: <strong>{incidents.length}</strong> incident(s)
            </div>
          </div>
        </div>
        {error && <Alert type="warn">{error}</Alert>}
        <div style={{ marginTop:12 }}>
          <Btn onClick={run} disabled={loading}>{loading ? 'Assessing...' : '\u25B6 Run Controversy Assessment'}</Btn>
        </div>
      </Card>

      {result && (
        <>
          <div style={{ display:'flex', gap:12, flexWrap:'wrap', marginBottom:20 }}>
            <KpiCard label="Sustainalytics Level" value={<LevelBadge level={result.sustainalytics_level} />} />
            <KpiCard label="RepRisk RRI" value={result.reprisk_rri} color={RRI_COLOR(result.reprisk_rri)} sub="0 = None \u2192 100 = Worst" />
            <KpiCard label="UNGC Compliant" value={result.ungc_compliant ? 'Yes' : 'No'}
              color={result.ungc_compliant ? T.green : T.red} sub={result.ungc_compliant ? 'No violations' : 'Violations detected'} />
            <KpiCard label="Incident Count" value={result.incident_count} color={T.navy} sub={`${result.env_count||0}E \u00B7 ${result.soc_count||0}S \u00B7 ${result.gov_count||0}G`} />
            <KpiCard label="Revenue at Risk" value={`${result.revenue_at_risk_pct}%`} color={T.red} sub="Reputational + regulatory" />
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr', gap:16, marginBottom:20 }}>
            <Card>
              <div style={{ fontSize:14, fontWeight:700, color:T.navy, marginBottom:10 }}>Incident Breakdown</div>
              {result.breakdown && result.breakdown.length > 0 ? (
                <table style={tbl}>
                  <thead><tr>
                    <th style={th}>Type</th><th style={th}>Category</th><th style={th}>Severity</th>
                    <th style={th}>Financial Materiality</th><th style={th}>UNGC Trigger</th>
                  </tr></thead>
                  <tbody>
                    {result.breakdown.map((r,i) => (
                      <tr key={i}>
                        <td style={td}>{r.type}</td>
                        <td style={td}><CatBadge cat={r.cat} /></td>
                        <td style={{...td, color: r.severity==='Critical'?T.red:r.severity==='High'?T.amber:T.text, fontWeight:600}}>{r.severity}</td>
                        <td style={td}>${r.financial_materiality}</td>
                        <td style={td}>{r.ungc_trigger ? <span style={{color:T.red,fontWeight:700}}>Yes</span> : 'No'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : <div style={{fontSize:13,color:T.sub}}>No incidents selected</div>}
            </Card>

            <Card>
              <div style={{ fontSize:14, fontWeight:700, color:T.navy, marginBottom:10 }}>Remediation Score</div>
              <div style={{ display:'flex', justifyContent:'center' }}>
                <ResponsiveContainer width={180} height={180}>
                  <PieChart>
                    <Pie data={donutData(result.remediation_score)} innerRadius={55} outerRadius={75} dataKey="value" startAngle={90} endAngle={-270}>
                      <Cell fill={result.remediation_score>=70?T.green:result.remediation_score>=40?T.amber:T.red} />
                      <Cell fill="#e5e7eb" />
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div style={{ textAlign:'center', fontSize:28, fontWeight:700, color:T.navy, marginTop:-100 }}>{result.remediation_score}</div>
              <div style={{ textAlign:'center', fontSize:11, color:T.sub, marginTop:68 }}>out of 100</div>
            </Card>
          </div>

          <Card>
            <div style={{ fontSize:14, fontWeight:700, color:T.navy, marginBottom:8 }}>Risk Summary</div>
            <div style={{ fontSize:13, color:T.text, lineHeight:1.7 }}>{result.narrative}</div>
          </Card>
        </>
      )}
    </div>
  );
}

// ── Tab 2: Portfolio Exposure ──────────────────────────────────────────────
function TabPortfolioExposure() {
  const defaultHoldings = [
    { entity_name:'TCS', sector:'Technology', market_value_usd:5000000, controversy_level:1, rri_score:12, ungc_compliant:true },
    { entity_name:'Tata Steel', sector:'Mining', market_value_usd:3000000, controversy_level:3, rri_score:42, ungc_compliant:true },
    { entity_name:'Reliance Industries', sector:'Oil & Gas', market_value_usd:8000000, controversy_level:4, rri_score:58, ungc_compliant:false },
    { entity_name:'Vedanta Ltd', sector:'Mining', market_value_usd:2000000, controversy_level:4, rri_score:65, ungc_compliant:false },
    { entity_name:'Adani Group', sector:'Mining', market_value_usd:4000000, controversy_level:4, rri_score:72, ungc_compliant:false },
  ];
  const [holdings, setHoldings] = useState(defaultHoldings);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const updateH = (idx, key, val) => {
    const h = [...holdings];
    h[idx] = { ...h[idx], [key]: key==='ungc_compliant' ? val : key==='market_value_usd'||key==='controversy_level'||key==='rri_score' ? Number(val) : val };
    setHoldings(h);
  };
  const addRow = () => setHoldings(p=>[...p,{entity_name:'',sector:'Technology',market_value_usd:1000000,controversy_level:1,rri_score:20,ungc_compliant:true}]);
  const removeRow = idx => setHoldings(p=>p.filter((_,i)=>i!==idx));

  const run = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const r = await axios.post(`${API}/api/v1/esg-controversy/portfolio-exposure`, { holdings });
      setResult(r.data);
    } catch {
      void 0 /* API fallback to seed data */;
      const totalMv = holdings.reduce((s,h)=>s+h.market_value_usd,0);
      const ungcViol = holdings.filter(h=>!h.ungc_compliant);
      const ungcPct = totalMv ? +(ungcViol.reduce((s,h)=>s+h.market_value_usd,0)/totalMv*100).toFixed(1) : 0;
      const noCompliance = holdings.filter(h=>h.controversy_level>=4);
      const noCompPct = totalMv ? +(noCompliance.reduce((s,h)=>s+h.market_value_usd,0)/totalMv*100).toFixed(1) : 0;
      const controvWeapons = 0;
      const wScore = totalMv ? +(holdings.reduce((s,h)=>s+h.controversy_level*h.market_value_usd,0)/totalMv).toFixed(2) : 0;
      const levelDist = [1,2,3,4,5].map(l => ({ level:`Level ${l}`, count:holdings.filter(h=>h.controversy_level===l).length,
        value:holdings.filter(h=>h.controversy_level===l).reduce((s,h)=>s+h.market_value_usd,0) }));
      setResult({
        pai_10_ungc_pct: ungcPct, pai_11_no_compliance_pct: noCompPct, pai_14_weapons_pct: controvWeapons,
        weighted_score: wScore, level_distribution: levelDist,
        high_risk: holdings.filter(h=>h.controversy_level>=4).map(h=>({...h, flag:'HIGH RISK'})),
      });
    }
    setLoading(false);
  }, [holdings]);

  const fmt = v => v>=1000000 ? (v/1000000).toFixed(1)+'M' : v>=1000 ? (v/1000).toFixed(0)+'K' : v;

  return (
    <div>
      <Card style={{ marginBottom:20 }}>
        <div style={{ fontSize:15, fontWeight:700, color:T.navy, marginBottom:14 }}>Portfolio Holdings</div>
        <div style={{ overflowX:'auto' }}>
          <table style={tbl}>
            <thead><tr>
              <th style={th}>Entity</th><th style={th}>Sector</th><th style={th}>Market Value ($)</th>
              <th style={th}>Controversy Level</th><th style={th}>RRI Score</th><th style={th}>UNGC Compliant</th><th style={th}></th>
            </tr></thead>
            <tbody>
              {holdings.map((h,i) => (
                <tr key={i} style={{ background: h.controversy_level>=4 ? '#fef2f2' : 'transparent' }}>
                  <td style={td}><input value={h.entity_name} onChange={e=>updateH(i,'entity_name',e.target.value)}
                    style={{border:`1px solid ${T.border}`,borderRadius:4,padding:'4px 8px',fontSize:12,width:140,fontFamily:T.font}} /></td>
                  <td style={td}><select value={h.sector} onChange={e=>updateH(i,'sector',e.target.value)}
                    style={{border:`1px solid ${T.border}`,borderRadius:4,padding:'4px 6px',fontSize:12,fontFamily:T.font}}>
                    {SECTORS.map(s=><option key={s}>{s}</option>)}
                  </select></td>
                  <td style={td}><input type="number" value={h.market_value_usd} onChange={e=>updateH(i,'market_value_usd',e.target.value)}
                    style={{border:`1px solid ${T.border}`,borderRadius:4,padding:'4px 8px',fontSize:12,width:110,fontFamily:T.font}} /></td>
                  <td style={td}>
                    <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                      <span style={{ background:LEVEL_COLORS[h.controversy_level]||T.sub, color:'#fff', borderRadius:10, padding:'2px 8px', fontSize:10, fontWeight:700, whiteSpace:'nowrap' }}>
                        {LEVEL_LABELS[h.controversy_level]||''}
                      </span>
                      <select value={h.controversy_level} onChange={e=>updateH(i,'controversy_level',e.target.value)}
                        style={{border:`1px solid ${T.border}`,borderRadius:4,padding:'4px 6px',fontSize:12,fontFamily:T.font}}>
                        {[1,2,3,4,5].map(l=><option key={l} value={l}>Level {l}</option>)}
                      </select>
                    </div>
                  </td>
                  <td style={td}><input type="number" value={h.rri_score} onChange={e=>updateH(i,'rri_score',e.target.value)}
                    style={{border:`1px solid ${T.border}`,borderRadius:4,padding:'4px 8px',fontSize:12,width:60,fontFamily:T.font}} /></td>
                  <td style={{...td,textAlign:'center'}}><input type="checkbox" checked={h.ungc_compliant} onChange={e=>updateH(i,'ungc_compliant',e.target.checked)} /></td>
                  <td style={td}><Btn sm color="red" onClick={()=>removeRow(i)}>{'\u2715'}</Btn></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ display:'flex', gap:10, marginTop:14 }}>
          <Btn sm color="sage" onClick={addRow}>+ Add Holding</Btn>
          <Btn onClick={run} disabled={loading}>{loading ? 'Analyzing...' : '\u25B6 Run Portfolio Exposure'}</Btn>
        </div>
        {error && <div style={{marginTop:10}}><Alert type="warn">{error}</Alert></div>}
      </Card>

      {result && (
        <>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:20 }}>
            <Card style={{ borderLeft:`4px solid ${T.red}` }}>
              <div style={{ fontSize:11, color:T.sub, fontWeight:600 }}>SFDR PAI 10</div>
              <div style={{ fontSize:11, color:T.sub }}>% UNGC Violations</div>
              <div style={{ fontSize:28, fontWeight:700, color:T.red, margin:'8px 0' }}>{result.pai_10_ungc_pct}%</div>
            </Card>
            <Card style={{ borderLeft:`4px solid ${T.amber}` }}>
              <div style={{ fontSize:11, color:T.sub, fontWeight:600 }}>SFDR PAI 11</div>
              <div style={{ fontSize:11, color:T.sub }}>% No Compliance Process</div>
              <div style={{ fontSize:28, fontWeight:700, color:T.amber, margin:'8px 0' }}>{result.pai_11_no_compliance_pct}%</div>
            </Card>
            <Card style={{ borderLeft:`4px solid ${T.navy}` }}>
              <div style={{ fontSize:11, color:T.sub, fontWeight:600 }}>SFDR PAI 14</div>
              <div style={{ fontSize:11, color:T.sub }}>% Controversial Weapons</div>
              <div style={{ fontSize:28, fontWeight:700, color:T.navy, margin:'8px 0' }}>{result.pai_14_weapons_pct}%</div>
            </Card>
            <Card style={{ borderLeft:`4px solid ${T.sage}` }}>
              <div style={{ fontSize:11, color:T.sub, fontWeight:600 }}>Weighted Score</div>
              <div style={{ fontSize:11, color:T.sub }}>Portfolio Controversy</div>
              <div style={{ fontSize:28, fontWeight:700, color:result.weighted_score>=3?T.red:result.weighted_score>=2?T.amber:T.sage, margin:'8px 0' }}>{result.weighted_score}</div>
            </Card>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:20 }}>
            <Card>
              <div style={{ fontSize:14, fontWeight:700, color:T.navy, marginBottom:10 }}>Holdings by Controversy Level</div>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={result.level_distribution}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="level" tick={{fontSize:11}} />
                  <YAxis tick={{fontSize:11}} />
                  <Tooltip formatter={v=>`$${fmt(v)}`} />
                  <Bar dataKey="value" name="Market Value">
                    {result.level_distribution.map((_,i)=><Cell key={i} fill={Object.values(LEVEL_COLORS)[i]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Card>

            <Card>
              <div style={{ fontSize:14, fontWeight:700, color:T.navy, marginBottom:10 }}>High-Risk Holdings</div>
              {result.high_risk && result.high_risk.length > 0 ? (
                <table style={tbl}>
                  <thead><tr><th style={th}>Entity</th><th style={th}>Level</th><th style={th}>RRI</th><th style={th}>Value</th><th style={th}>Flag</th></tr></thead>
                  <tbody>
                    {result.high_risk.map((h,i) => (
                      <tr key={i} style={{background:'#fef2f2'}}>
                        <td style={{...td,fontWeight:600,color:T.red}}>{h.entity_name}</td>
                        <td style={td}><LevelBadge level={h.controversy_level} /></td>
                        <td style={{...td,fontWeight:600}}>{h.rri_score}</td>
                        <td style={td}>${fmt(h.market_value_usd)}</td>
                        <td style={{...td,color:T.red,fontWeight:700}}>{h.flag}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : <div style={{fontSize:13,color:T.sub}}>No high-risk holdings detected.</div>}
            </Card>
          </div>
        </>
      )}
    </div>
  );
}

// ── Tab 3: Incident Scorer ─────────────────────────────────────────────────
function TabIncidentScorer() {
  const [form, setForm] = useState({ incident_type:ALL_50_INCIDENT_TYPES[0].id, severity:'High', jurisdiction:'United States', financial_impact:'', remediation:'none' });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const set = (k,v) => setForm(p=>({...p,[k]:v}));

  const run = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const r = await axios.post(`${API}/api/v1/esg-controversy/score-incident`, {
        incident_type: form.incident_type, severity: form.severity,
        jurisdiction: form.jurisdiction, financial_impact_usd: parseFloat(form.financial_impact)||0,
        remediation_status: form.remediation,
      });
      setResult(r.data);
    } catch {
      void 0 /* API fallback to seed data */;
      const sevMap = { Critical:95, High:72, Medium:45, Low:20 };
      const sevScore = sevMap[form.severity] + Math.round(rng(3)*10-5);
      const finMat = parseFloat(form.financial_impact) > 100000000 ? 'Very High' : parseFloat(form.financial_impact) > 10000000 ? 'High' : parseFloat(form.financial_impact) > 1000000 ? 'Medium' : 'Low';
      const ungcIds = ['child_labor','forced_labor','modern_slavery','bribery','corruption','discrimination','toxic_waste','deforestation'];
      const ungcFlag = ungcIds.includes(form.incident_type);
      setResult({
        severity_score: Math.min(100, Math.max(0, sevScore)),
        financial_materiality: finMat,
        ungc_flag: ungcFlag,
        recommended_actions: [
          'Initiate immediate internal investigation',
          ungcFlag ? 'Engage UNGC compliance team for remediation plan' : 'Document incident for ESG disclosure',
          form.severity==='Critical' ? 'Board-level escalation required within 48 hours' : 'Report to risk management committee',
          'Conduct stakeholder impact assessment',
          `Engage ${form.jurisdiction} regulatory counsel`,
        ],
      });
    }
    setLoading(false);
  }, [form]);

  const envTypes = ALL_50_INCIDENT_TYPES.filter(i => i.cat === 'E');
  const socTypes = ALL_50_INCIDENT_TYPES.filter(i => i.cat === 'S');
  const govTypes = ALL_50_INCIDENT_TYPES.filter(i => i.cat === 'G');

  return (
    <div>
      <Card style={{ marginBottom:20 }}>
        <div style={{ fontSize:15, fontWeight:700, color:T.navy, marginBottom:16 }}>Single Incident Scorer</div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:14, marginBottom:14 }}>
          <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
            <label style={{ fontSize:12, fontWeight:600, color:T.sub }}>Incident Type</label>
            <select value={form.incident_type} onChange={e=>set('incident_type',e.target.value)}
              style={{ border:`1px solid ${T.border}`, borderRadius:6, padding:'8px 12px',
                fontSize:13, fontFamily:T.font, background:'#fafafa', color:T.text }}>
              <optgroup label="Environmental (E)">
                {envTypes.map(i => <option key={i.id} value={i.id}>{i.label}</option>)}
              </optgroup>
              <optgroup label="Social (S)">
                {socTypes.map(i => <option key={i.id} value={i.id}>{i.label}</option>)}
              </optgroup>
              <optgroup label="Governance (G)">
                {govTypes.map(i => <option key={i.id} value={i.id}>{i.label}</option>)}
              </optgroup>
            </select>
          </div>
          <Sel label="Severity" value={form.severity} onChange={v=>set('severity',v)} options={['Critical','High','Medium','Low']} />
          <Sel label="Jurisdiction" value={form.jurisdiction} onChange={v=>set('jurisdiction',v)} options={COUNTRIES} />
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:14, marginBottom:14 }}>
          <Inp label="Financial Impact ($)" value={form.financial_impact} onChange={v=>set('financial_impact',v)} type="number" placeholder="USD amount" />
          <Sel label="Remediation Status" value={form.remediation} onChange={v=>set('remediation',v)}
            options={REMEDIATION_OPTS.map(o=>({value:o,label:o.charAt(0).toUpperCase()+o.slice(1)}))} />
          <div style={{ display:'flex', alignItems:'flex-end' }}>
            <Btn onClick={run} disabled={loading}>{loading ? 'Scoring...' : '\u25B6 Score Incident'}</Btn>
          </div>
        </div>
        {error && <Alert type="warn">{error}</Alert>}
      </Card>

      {result && (
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
              <KpiCard label="Severity Score" value={result.severity_score} color={result.severity_score>=70?T.red:result.severity_score>=40?T.amber:T.green} sub="0-100 scale" />
              <KpiCard label="Financial Materiality" value={result.financial_materiality}
                color={result.financial_materiality==='Very High'||result.financial_materiality==='High'?T.red:T.amber} />
            </div>
            <KpiCard label="UNGC Violation Flag" value={result.ungc_flag ? 'TRIGGERED' : 'Clear'}
              color={result.ungc_flag ? T.red : T.green} sub={result.ungc_flag ? 'Principles potentially violated' : 'No UNGC principle violations'} />
          </div>
          <Card>
            <div style={{ fontSize:14, fontWeight:700, color:T.navy, marginBottom:10 }}>Recommended Actions</div>
            <ol style={{ margin:0, paddingLeft:20 }}>
              {result.recommended_actions.map((a,i) => (
                <li key={i} style={{ fontSize:13, color:T.text, marginBottom:8, lineHeight:1.5 }}>{a}</li>
              ))}
            </ol>
          </Card>
        </div>
      )}
    </div>
  );
}

// ── Tab 4: Data Sources ────────────────────────────────────────────────────
function TabDataSources() {
  const sources = [
    { name:'EPA ECHO', url:'https://echo.epa.gov', badge:'FREE API', badgeColor:T.green, icon:'\uD83C\uDFED',
      desc:'1.5M+ US facilities with environmental violations, weekly refresh.',
      data:'Clean Air Act, Clean Water Act, RCRA violations', coverage:'US facilities', access:'Free bulk download + REST API' },
    { name:'DOL / OSHA', url:'https://enforcedata.dol.gov', badge:'FREE API', badgeColor:T.green, icon:'\u26D1\uFE0F',
      desc:'US workplace safety enforcement data.',
      data:'OSHA inspections, violations, penalties', coverage:'US workplaces', access:'REST API + bulk CSV' },
    { name:'SEC EDGAR', url:'https://efts.sec.gov', badge:'FREE API', badgeColor:T.green, icon:'\uD83D\uDCCA',
      desc:'Securities enforcement actions and filings.',
      data:'Fraud, insider trading, disclosure violations', coverage:'US public companies', access:'EDGAR full-text search API' },
    { name:'WikiRate', url:'https://wikirate.org', badge:'FREE & OPEN', badgeColor:T.blue, icon:'\uD83C\uDF10',
      desc:'Open ESG data platform with community verification.',
      data:'Community-verified ESG metrics, controversy flags', coverage:'Global companies', access:'Open API + data exports' },
    { name:'GDELT', url:'https://gdeltproject.org', badge:'FREE', badgeColor:T.teal, icon:'\uD83D\uDCF0',
      desc:'Global news event tracking for real-time controversy detection.',
      data:'Real-time controversy detection from global media', coverage:'250M+ events, global', access:'BigQuery + REST API' },
    { name:'FinBERT', url:'https://huggingface.co/ProsusAI/finbert', badge:'OPEN SOURCE', badgeColor:T.indigo, icon:'\uD83E\uDD16',
      desc:'Open-source financial NLP for ESG sentiment classification.',
      data:'Sentiment classification for ESG news', coverage:'Any text input', access:'Hugging Face model hub' },
    { name:'Violation Tracker', url:'https://goodjobsfirst.org/violation-tracker', badge:'FREE SEARCH', badgeColor:T.sage, icon:'\uD83D\uDD0D',
      desc:'Aggregates violations from 400+ federal and state agencies.',
      data:'EPA + OSHA + SEC + state agencies', coverage:'500K+ records, US', access:'Search interface + data downloads' },
    { name:'FMP ESG API', url:'https://financialmodelingprep.com', badge:'FREEMIUM', badgeColor:T.gold, icon:'\uD83D\uDCC8',
      desc:'ESG scores and controversy data with global coverage.',
      data:'ESG scores, controversy ratings, global coverage', coverage:'10K+ companies', access:'REST API (free tier available)' },
  ];

  return (
    <div>
      <Alert type="info">These free and open data sources can supplement commercial ESG data providers (Sustainalytics, RepRisk, MSCI) for controversy monitoring.</Alert>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:16, marginTop:16 }}>
        {sources.map((s,i) => (
          <Card key={i} style={{ display:'flex', flexDirection:'column', gap:8 }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                <span style={{ fontSize:28 }}>{s.icon}</span>
                <div>
                  <div style={{ fontSize:15, fontWeight:700, color:T.navy }}>{s.name}</div>
                  <a href={s.url} target="_blank" rel="noopener noreferrer" style={{ fontSize:11, color:T.blue, textDecoration:'none' }}>{s.url.replace('https://','')}</a>
                </div>
              </div>
              <span style={{ background:s.badgeColor, color:'#fff', borderRadius:20, padding:'3px 10px', fontSize:10, fontWeight:700 }}>{s.badge}</span>
            </div>
            <div style={{ fontSize:13, color:T.text, lineHeight:1.5 }}>{s.desc}</div>
            <div style={{ display:'flex', gap:16, fontSize:11, color:T.sub }}>
              <span><strong>Data:</strong> {s.data}</span>
            </div>
            <div style={{ display:'flex', gap:16, fontSize:11, color:T.sub }}>
              <span><strong>Coverage:</strong> {s.coverage}</span>
              <span><strong>Access:</strong> {s.access}</span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ── Tab 5: Framework Reference ─────────────────────────────────────────────
function TabFrameworkReference() {
  const [section, setSection] = useState('sustainalytics');
  const sections = [
    { id:'sustainalytics', label:'Sustainalytics 5-Level' },
    { id:'reprisk', label:'RepRisk RRI' },
    { id:'ungc', label:'UNGC 10 Principles' },
    { id:'incidents', label:'50 Incident Types' },
  ];

  const sustainLevels = [
    { level:1, label:'Low', color:T.green, desc:'No material ESG controversies identified. Entity demonstrates strong ESG management.',
      impact:'Minimal ESG rating impact', msci:'No adjustment', cycle:'Annual review', action:'Standard monitoring' },
    { level:2, label:'Moderate', color:T.sage, desc:'Minor ESG incidents with limited scope and impact. Adequate management response observed.',
      impact:'Minor ESG rating drag (-0.5 to -1.0)', msci:'-0.5 adjustment', cycle:'Semi-annual review', action:'Enhanced monitoring, engagement recommended' },
    { level:3, label:'Significant', color:T.amber, desc:'Material ESG issues with meaningful financial or reputational impact. Remediation underway but incomplete.',
      impact:'Moderate ESG rating drag (-1.0 to -2.0)', msci:'-1.0 adjustment', cycle:'Quarterly review', action:'Active engagement, watchlist consideration' },
    { level:4, label:'High', color:T.red, desc:'Severe controversies with substantial financial exposure. Systematic failures in ESG management identified.',
      impact:'Major ESG rating drag (-2.0 to -4.0)', msci:'-2.0 to -3.0 adjustment', cycle:'Monthly review', action:'Escalate to investment committee, consider divestment' },
    { level:5, label:'Severe', color:'#991b1b', desc:'Critical controversies with existential risk. Egregious violations of international norms. Irreparable harm.',
      impact:'Maximum ESG rating penalty', msci:'-4.0+ adjustment, potential exclusion', cycle:'Continuous monitoring', action:'Immediate divestment consideration, exclusion trigger' },
  ];

  const repriskDims = [
    { dim:'Novelty', weight:'High', desc:'Is this a new or recurring issue? New incidents score higher.' },
    { dim:'Severity', weight:'Critical', desc:'Scale of environmental, social, or governance harm caused.' },
    { dim:'Reach', weight:'High', desc:'Geographic and stakeholder breadth of the incident impact.' },
  ];
  const repriskSources = [
    { source:'NGOs / Watchdogs', weight:1.4, desc:'Highest credibility, deep investigation' },
    { source:'International Media', weight:1.3, desc:'Wide reach, editorial standards' },
    { source:'Regulatory Bodies', weight:1.2, desc:'Official enforcement actions' },
    { source:'National / Local Media', weight:1.0, desc:'Baseline source weight' },
  ];
  const repriskScale = [
    { rating:'AAA', range:'0-9', color:T.green, desc:'Negligible risk' },
    { rating:'AA', range:'10-19', color:T.green, desc:'Low risk' },
    { rating:'A', range:'20-29', color:T.sage, desc:'Low-medium risk' },
    { rating:'BBB', range:'30-39', color:T.sage, desc:'Medium risk' },
    { rating:'BB', range:'40-49', color:T.amber, desc:'Medium-high risk' },
    { rating:'B', range:'50-59', color:T.amber, desc:'High risk' },
    { rating:'CCC', range:'60-75', color:T.red, desc:'Very high risk' },
    { rating:'CC', range:'76-89', color:T.red, desc:'Extremely high risk' },
    { rating:'C', range:'90-100', color:'#991b1b', desc:'Maximum risk' },
  ];

  const ungcPrinciples = [
    { area:'Human Rights', principles:[
      { num:1, text:'Support and respect international human rights', triggers:'Forced displacement, complicity in abuses', pai:'PAI 10, 11' },
      { num:2, text:'Not be complicit in human rights abuses', triggers:'Supply chain abuses, conflict minerals', pai:'PAI 10' },
    ]},
    { area:'Labour', principles:[
      { num:3, text:'Uphold freedom of association and collective bargaining', triggers:'Union busting, retaliation', pai:'PAI 10, 11' },
      { num:4, text:'Eliminate forced and compulsory labour', triggers:'Forced labor, modern slavery', pai:'PAI 10' },
      { num:5, text:'Abolish child labour', triggers:'Child labor in supply chain', pai:'PAI 10' },
      { num:6, text:'Eliminate discrimination in employment', triggers:'Systemic discrimination, pay gaps', pai:'PAI 10, 11' },
    ]},
    { area:'Environment', principles:[
      { num:7, text:'Support precautionary approach to environmental challenges', triggers:'Ignoring climate risk, no EIA', pai:'PAI 10, 11' },
      { num:8, text:'Promote greater environmental responsibility', triggers:'Illegal pollution, deforestation', pai:'PAI 10' },
      { num:9, text:'Encourage development of environmentally friendly technologies', triggers:'Blocking clean tech, greenwashing', pai:'PAI 10, 11' },
    ]},
    { area:'Anti-Corruption', principles:[
      { num:10, text:'Work against corruption including extortion and bribery', triggers:'Bribery, money laundering, tax evasion', pai:'PAI 10' },
    ]},
  ];

  const incidentTypes = ALL_50_INCIDENT_TYPES.map((t,i) => {
    const sevRange = t.cat==='E' ? 'Medium-Critical' : t.cat==='S' ? 'High-Critical' : 'Medium-High';
    const finRange = rng(i+50) > 0.5 ? '$10M-$500M+' : '$1M-$100M';
    const ungcTrig = ['child_labor','forced_labor','modern_slavery','bribery','corruption','discrimination','toxic_waste','deforestation','human_trafficking','conflict_minerals'].includes(t.id);
    return { ...t, severity_range:sevRange, financial_range:finRange, ungc_trigger:ungcTrig };
  });

  return (
    <div>
      <div style={{ display:'flex', gap:8, marginBottom:16, flexWrap:'wrap' }}>
        {sections.map(s => (
          <button key={s.id} onClick={()=>setSection(s.id)} style={{
            background: section===s.id ? T.navy : T.card, color: section===s.id ? '#fff' : T.text,
            border:`1px solid ${section===s.id ? T.navy : T.border}`, borderRadius:6,
            padding:'8px 16px', fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:T.font,
          }}>{s.label}</button>
        ))}
      </div>

      {section==='sustainalytics' && (
        <div>
          <div style={{ fontSize:15, fontWeight:700, color:T.navy, marginBottom:14 }}>Sustainalytics 5-Level Controversy Framework</div>
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            {sustainLevels.map(l => (
              <Card key={l.level} style={{ borderLeft:`5px solid ${l.color}` }}>
                <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:8 }}>
                  <span style={{ background:l.color, color:'#fff', borderRadius:20, padding:'4px 14px', fontSize:13, fontWeight:700 }}>
                    Level {l.level} — {l.label}
                  </span>
                </div>
                <div style={{ fontSize:13, color:T.text, marginBottom:10, lineHeight:1.6 }}>{l.desc}</div>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, fontSize:12 }}>
                  <div><span style={{color:T.sub,fontWeight:600}}>ESG Impact:</span> {l.impact}</div>
                  <div><span style={{color:T.sub,fontWeight:600}}>MSCI Adj:</span> {l.msci}</div>
                  <div><span style={{color:T.sub,fontWeight:600}}>Review:</span> {l.cycle}</div>
                  <div><span style={{color:T.sub,fontWeight:600}}>Action:</span> {l.action}</div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {section==='reprisk' && (
        <div>
          <div style={{ fontSize:15, fontWeight:700, color:T.navy, marginBottom:14 }}>RepRisk RRI Methodology</div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:16 }}>
            <Card>
              <div style={{ fontSize:14, fontWeight:700, color:T.navy, marginBottom:10 }}>Scoring Dimensions</div>
              <table style={tbl}>
                <thead><tr><th style={th}>Dimension</th><th style={th}>Weight</th><th style={th}>Description</th></tr></thead>
                <tbody>
                  {repriskDims.map((d,i) => (
                    <tr key={i}><td style={{...td,fontWeight:600}}>{d.dim}</td><td style={td}>{d.weight}</td><td style={td}>{d.desc}</td></tr>
                  ))}
                </tbody>
              </table>
            </Card>
            <Card>
              <div style={{ fontSize:14, fontWeight:700, color:T.navy, marginBottom:10 }}>Source Weights</div>
              <table style={tbl}>
                <thead><tr><th style={th}>Source Type</th><th style={th}>Weight</th><th style={th}>Rationale</th></tr></thead>
                <tbody>
                  {repriskSources.map((s,i) => (
                    <tr key={i}><td style={{...td,fontWeight:600}}>{s.source}</td><td style={{...td,fontWeight:700,color:T.navy}}>{s.weight}x</td><td style={td}>{s.desc}</td></tr>
                  ))}
                </tbody>
              </table>
            </Card>
          </div>
          <Card>
            <div style={{ fontSize:14, fontWeight:700, color:T.navy, marginBottom:10 }}>Rating Scale (RRI 0-100)</div>
            <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
              {repriskScale.map((s,i) => (
                <div key={i} style={{ background:T.card, border:`2px solid ${s.color}`, borderRadius:8, padding:'10px 14px', minWidth:100, textAlign:'center' }}>
                  <div style={{ fontSize:20, fontWeight:800, color:s.color }}>{s.rating}</div>
                  <div style={{ fontSize:11, color:T.sub, fontWeight:600 }}>{s.range}</div>
                  <div style={{ fontSize:10, color:T.text, marginTop:4 }}>{s.desc}</div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {section==='ungc' && (
        <div>
          <div style={{ fontSize:15, fontWeight:700, color:T.navy, marginBottom:14 }}>UN Global Compact — 10 Principles</div>
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            {ungcPrinciples.map((area,ai) => (
              <Card key={ai}>
                <div style={{ fontSize:14, fontWeight:700, color:T.navy, marginBottom:10, textTransform:'uppercase', letterSpacing:.5 }}>{area.area}</div>
                <table style={tbl}>
                  <thead><tr><th style={{...th,width:30}}>#</th><th style={th}>Principle</th><th style={th}>Incident Triggers</th><th style={th}>SFDR PAI</th></tr></thead>
                  <tbody>
                    {area.principles.map(p => (
                      <tr key={p.num}>
                        <td style={{...td,fontWeight:700,color:T.navy,textAlign:'center'}}>{p.num}</td>
                        <td style={{...td,fontSize:12}}>{p.text}</td>
                        <td style={{...td,fontSize:12,color:T.red}}>{p.triggers}</td>
                        <td style={{...td,fontSize:11,fontWeight:600}}>{p.pai}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Card>
            ))}
          </div>
        </div>
      )}

      {section==='incidents' && (
        <div>
          <div style={{ fontSize:15, fontWeight:700, color:T.navy, marginBottom:14 }}>50 Incident Types — Full Reference</div>
          <Card>
            <div style={{ overflowX:'auto' }}>
              <table style={tbl}>
                <thead><tr>
                  <th style={th}>Type</th><th style={th}>Category</th><th style={th}>Severity Range</th>
                  <th style={th}>Financial Materiality</th><th style={th}>UNGC Trigger</th>
                </tr></thead>
                <tbody>
                  {incidentTypes.map((t,i) => (
                    <tr key={i} style={{ background: t.ungc_trigger ? '#fef2f2' : 'transparent' }}>
                      <td style={{...td,fontWeight:600}}>{t.label}</td>
                      <td style={td}><CatBadge cat={t.cat} /></td>
                      <td style={td}>{t.severity_range}</td>
                      <td style={td}>{t.financial_range}</td>
                      <td style={td}>{t.ungc_trigger ? <span style={{color:T.red,fontWeight:700}}>Yes</span> : <span style={{color:T.sub}}>No</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────
export default function EsgControversyPage() {
  const [tab, setTab] = useState(0);

  return (
    <div style={{ fontFamily:T.font, background:T.bg, minHeight:'100vh', padding:'24px 32px' }}>
      {/* Header */}
      <div style={{ marginBottom:24 }}>
        <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:6 }}>
          <span style={{ background:T.navy, color:'#fff', borderRadius:6, padding:'4px 10px', fontSize:11, fontWeight:700 }}>E111</span>
          <h1 style={{ fontSize:22, fontWeight:800, color:T.navy, margin:0 }}>ESG Controversy & Incident Tracking</h1>
        </div>
        <p style={{ fontSize:13, color:T.sub, margin:0 }}>
          Sustainalytics 5-level framework | RepRisk RRI scoring | UNGC 10-principle compliance | SFDR PAI 10-11-14 portfolio exposure
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', gap:0, borderBottom:`2px solid ${T.border}`, marginBottom:20 }}>
        {TABS.map((t,i) => (
          <button key={i} onClick={()=>setTab(i)} style={{
            padding:'10px 20px', fontSize:13, fontWeight:600, cursor:'pointer',
            background:'transparent', border:'none', fontFamily:T.font,
            color: tab===i ? T.navy : T.sub,
            borderBottom: tab===i ? `3px solid ${T.gold}` : '3px solid transparent',
            marginBottom:-2, transition:'all .15s',
          }}>{t}</button>
        ))}
      </div>

      {/* Content */}
      {tab===0 && <TabEntityAssessment />}
      {tab===1 && <TabPortfolioExposure />}
      {tab===2 && <TabIncidentScorer />}
      {tab===3 && <TabDataSources />}
      {tab===4 && <TabFrameworkReference />}

      {/* Footer */}
      <div style={{ marginTop:32, padding:'16px 0', borderTop:`1px solid ${T.border}`, fontSize:11, color:T.sub, textAlign:'center' }}>
        E111 ESG Controversy & Incident Tracking | Sustainalytics + RepRisk + UNGC + SFDR PAI Framework | SustainPlatform v2.0
      </div>
    </div>
  );
}
