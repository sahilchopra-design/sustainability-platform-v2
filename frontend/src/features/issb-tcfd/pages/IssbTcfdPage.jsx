import React, { useState, useCallback, useRef, useEffect } from 'react';
import axios from 'axios';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, CartesianGrid, Cell, PieChart, Pie,
} from 'recharts';

const API = 'http://localhost:8000';

// ── Theme ──────────────────────────────────────────────────────────────────
const T={bg:'#f6f4f0',surface:'#ffffff',surfaceH:'#f0ede7',border:'#e5e0d8',borderL:'#d5cfc5',navy:'#1b3a5c',navyL:'#2c5a8c',gold:'#c5a96a',goldL:'#d4be8a',sage:'#5a8a6a',sageL:'#7ba67d',teal:'#5a8a6a',text:'#1b3a5c',textSec:'#5c6b7e',textMut:'#9aa3ae',red:'#dc2626',green:'#16a34a',amber:'#d97706',font:"'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"};

const PILLAR_META = [
  { key:'governance',      label:'Governance',        color:T.navy,   icon:'\u2699' },
  { key:'strategy',        label:'Strategy',          color:T.indigo, icon:'\u2693' },
  { key:'risk_management', label:'Risk Management',   color:T.teal,   icon:'\u26A0' },
  { key:'metrics_targets', label:'Metrics & Targets', color:T.sage,   icon:'\u2B50' },
];

const PHYSICAL_ACUTE  = ['Flooding','Cyclone','Wildfire','Heatwave'];
const PHYSICAL_CHRONIC = ['Sea Level Rise','Drought','Temperature Shift','Precipitation Change'];
const TRANSITION_POLICY = ['Carbon Tax','Emissions Regulation','Mandatory Disclosure','Land Use Restrictions'];
const TRANSITION_TECH   = ['Clean Tech Disruption','Asset Obsolescence','R&D Reallocation'];
const TRANSITION_MARKET = ['Demand Shifts','Commodity Price Volatility','Stranded Assets'];
const TRANSITION_REPUTE = ['Stigmatisation','Stakeholder Pressure','Greenwashing Litigation'];

const SCENARIOS = [
  { value:'1.5c', label:'1.5\u00B0C Paris-Aligned (Net Zero 2050)' },
  { value:'2c',   label:'2\u00B0C NDC Pathway' },
  { value:'3c',   label:'3\u00B0C+ BAU / Hot House' },
];
const HORIZONS = ['2030','2040','2050'];

const SECTOR_OPTIONS = [
  'Energy','Materials','Industrials','Consumer Discretionary','Consumer Staples',
  'Health Care','Financials','Information Technology','Communication Services',
  'Utilities','Real Estate','Agriculture','Mining','Cement','Steel',
];

const COMPANY_SUGGESTIONS = [
  { name:'Reliance Industries', cin:'L17110MH1973PLC019786', sector:'Energy' },
  { name:'Tata Steel Ltd', cin:'L27102OR1907PLC000002', sector:'Materials' },
  { name:'NTPC Ltd', cin:'L40101DL1975GOI007966', sector:'Utilities' },
  { name:'HDFC Bank', cin:'L65920MH1994PLC080618', sector:'Financials' },
  { name:'Infosys Ltd', cin:'L85110KA1981PLC013115', sector:'Information Technology' },
  { name:'Larsen & Toubro', cin:'L99999MH1946PLC004768', sector:'Industrials' },
  { name:'Tata Motors', cin:'L28920MH1945PLC004520', sector:'Consumer Discretionary' },
  { name:'Adani Green Energy', cin:'L40100GJ2015PLC082803', sector:'Utilities' },
  { name:'Coal India Ltd', cin:'L10101WB1973GOI028844', sector:'Mining' },
  { name:'UltraTech Cement', cin:'L26940MH2000PLC128420', sector:'Cement' },
  { name:'JSW Steel', cin:'L27102MH1994PLC152925', sector:'Steel' },
  { name:'Sun Pharma', cin:'L24230GJ1993PLC019050', sector:'Health Care' },
  { name:'ITC Ltd', cin:'L16005WB1910PLC001985', sector:'Consumer Staples' },
  { name:'Maruti Suzuki', cin:'L34103DL1981PLC011375', sector:'Consumer Discretionary' },
  { name:'State Bank of India', cin:'L64190WB1955GOI022605', sector:'Financials' },
];

const CHART_COLORS = ['#1b3a5c','#c5a96a','#5a8a6a','#2563eb','#9333ea','#ea580c','#0d9488','#dc2626'];

// ── Mini components ────────────────────────────────────────────────────────
const Btn = ({ children, onClick, disabled, color='navy', sm }) => (
  <button onClick={onClick} disabled={disabled} style={{
    background: disabled ? '#9ca3af' : ({ navy:T.navy, gold:T.gold, green:T.green, red:T.red, sage:T.sage, indigo:T.indigo, teal:T.teal }[color] || T.navy),
    color:'#fff', border:'none', borderRadius:6,
    padding: sm ? '6px 14px' : '10px 22px',
    fontSize: sm ? 12 : 14, fontWeight:600, cursor: disabled ? 'not-allowed' : 'pointer',
    fontFamily:T.font, transition:'opacity .15s',
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

const Inp = ({ label, value, onChange, type='text', placeholder, small, style:sx }) => (
  <div style={{ display:'flex', flexDirection:'column', gap:4, ...sx }}>
    {label && <label style={{ fontSize:12, fontWeight:600, color:T.sub }}>{label}</label>}
    <input value={value} onChange={e => onChange(e.target.value)} type={type} placeholder={placeholder}
      style={{ border:`1px solid ${T.border}`, borderRadius:6, padding: small ? '5px 10px' : '8px 12px',
        fontSize: small ? 12 : 13, fontFamily:T.font, background:'#fafafa', color:T.text, outline:'none' }} />
  </div>
);

const Sel = ({ label, value, onChange, options, style:sx }) => (
  <div style={{ display:'flex', flexDirection:'column', gap:4, ...sx }}>
    {label && <label style={{ fontSize:12, fontWeight:600, color:T.sub }}>{label}</label>}
    <select value={value} onChange={e => onChange(e.target.value)}
      style={{ border:`1px solid ${T.border}`, borderRadius:6, padding:'8px 12px',
        fontSize:13, fontFamily:T.font, background:'#fafafa', color:T.text }}>
      {options.map(o => <option key={typeof o==='string'?o:o.value} value={typeof o==='string'?o:o.value}>{typeof o==='string'?o:o.label}</option>)}
    </select>
  </div>
);

const Toggle = ({ label, value, onChange }) => (
  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
    <div onClick={() => onChange(!value)} style={{ width:38, height:20, borderRadius:10,
      background: value ? T.green : '#d1d5db', cursor:'pointer', position:'relative', transition:'background .2s' }}>
      <div style={{ width:16, height:16, borderRadius:8, background:'#fff',
        position:'absolute', top:2, left: value ? 20 : 2, transition:'left .2s', boxShadow:'0 1px 3px rgba(0,0,0,.2)' }} />
    </div>
    <span style={{ fontSize:13, color:T.text }}>{label}</span>
  </div>
);

const MultiCheck = ({ label, options, selected, onChange }) => (
  <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
    {label && <label style={{ fontSize:12, fontWeight:600, color:T.sub }}>{label}</label>}
    <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
      {options.map(o => {
        const active = selected.includes(o);
        return (
          <div key={o} onClick={() => onChange(active ? selected.filter(x=>x!==o) : [...selected, o])}
            style={{ padding:'4px 12px', borderRadius:16, fontSize:12, cursor:'pointer', fontWeight:500,
              border: `1px solid ${active ? T.navy : T.border}`,
              background: active ? T.navy : '#fafafa', color: active ? '#fff' : T.text, transition:'all .15s' }}>
            {o}
          </div>
        );
      })}
    </div>
  </div>
);

const Alert = ({ children, type='info' }) => {
  const colors = { info:{bg:'#eff6ff',border:'#93c5fd',text:'#1e40af'}, warn:{bg:'#fffbeb',border:'#fcd34d',text:'#92400e'}, ok:{bg:'#f0fdf4',border:'#86efac',text:'#166534'}, err:{bg:'#fef2f2',border:'#fca5a5',text:'#991b1b'} };
  const c = colors[type]||colors.info;
  return <div style={{ background:c.bg, border:`1px solid ${c.border}`, borderRadius:8, padding:'12px 16px', fontSize:13, color:c.text }}>{children}</div>;
};

const PillarCard = ({ pillar, open, onToggle, children }) => (
  <Card style={{ borderLeft:`4px solid ${pillar.color}`, cursor:'default' }}>
    <div onClick={onToggle} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', cursor:'pointer' }}>
      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
        <span style={{ fontSize:20 }}>{pillar.icon}</span>
        <span style={{ fontSize:15, fontWeight:700, color:pillar.color }}>{pillar.label}</span>
      </div>
      <span style={{ fontSize:18, color:T.sub, transform: open ? 'rotate(180deg)' : 'none', transition:'transform .2s' }}>{'\u25BC'}</span>
    </div>
    {open && <div style={{ marginTop:16, display:'flex', flexDirection:'column', gap:14 }}>{children}</div>}
  </Card>
);

const ScoreBadge = ({ score, size='md' }) => {
  const bg = score >= 80 ? T.green : score >= 60 ? T.gold : score >= 40 ? T.amber : T.red;
  const sz = size==='lg' ? { w:64,h:64,fs:22 } : { w:44,h:44,fs:16 };
  return (
    <div style={{ width:sz.w, height:sz.h, borderRadius:'50%', background:bg, color:'#fff',
      display:'flex', alignItems:'center', justifyContent:'center', fontSize:sz.fs, fontWeight:700 }}>
      {Math.round(score)}
    </div>
  );
};

const CompanyAutocomplete = ({ value, onChange, onSelect, placeholder, width }) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(value || '');
  const ref = useRef(null);
  const suggestions = query.length >= 2 ? COMPANY_SUGGESTIONS.filter(c => c.name.toLowerCase().includes(query.toLowerCase())).slice(0,5) : [];
  useEffect(() => { setQuery(value || ''); }, [value]);
  useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);
  return (
    <div ref={ref} style={{ position:'relative', width:width||'100%' }}>
      <input value={query} onChange={e => { setQuery(e.target.value); onChange(e.target.value); setOpen(true); }}
        onFocus={() => query.length >= 2 && setOpen(true)} placeholder={placeholder}
        style={{ width:'100%', border:`1px solid ${T.border}`, borderRadius:6, padding:'8px 12px',
          fontSize:13, fontFamily:T.font, background:'#fafafa', color:T.text, outline:'none', boxSizing:'border-box' }} />
      {open && suggestions.length > 0 && (
        <div style={{ position:'absolute', top:'100%', left:0, right:0, background:'#fff', border:`1px solid ${T.border}`,
          borderRadius:6, marginTop:2, zIndex:50, boxShadow:'0 4px 12px rgba(0,0,0,.1)', maxHeight:200, overflowY:'auto' }}>
          {suggestions.map(s => (
            <div key={s.cin} onClick={() => { setQuery(s.name); onSelect(s); setOpen(false); }}
              style={{ padding:'8px 12px', fontSize:13, cursor:'pointer', borderBottom:`1px solid ${T.border}` }}
              onMouseEnter={e => e.target.style.background='#f6f4f0'} onMouseLeave={e => e.target.style.background='#fff'}>
              <span style={{ fontWeight:600 }}>{s.name}</span>
              <span style={{ color:T.sub, fontSize:11, marginLeft:8 }}>{s.sector}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const SectionHeading = ({ children, color }) => (
  <div style={{ fontSize:13, fontWeight:700, color: color||T.navy, textTransform:'uppercase', letterSpacing:.5, borderBottom:`2px solid ${color||T.navy}`, paddingBottom:4, marginBottom:8 }}>
    {children}
  </div>
);

const Spinner = () => (
  <div style={{ display:'flex', alignItems:'center', gap:8, padding:20 }}>
    <div style={{ width:20, height:20, border:`3px solid ${T.border}`, borderTop:`3px solid ${T.navy}`, borderRadius:'50%', animation:'spin 1s linear infinite' }} />
    <span style={{ fontSize:13, color:T.sub }}>Running assessment...</span>
    <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
  </div>
);

const Grid = ({ cols=2, gap=14, children }) => (
  <div style={{ display:'grid', gridTemplateColumns:`repeat(${cols}, 1fr)`, gap }}>{children}</div>
);

const RiskRow = ({ risk, data, onChange }) => (
  <div style={{ display:'grid', gridTemplateColumns:'1fr 100px 100px 120px 120px', gap:8, alignItems:'center', padding:'6px 0', borderBottom:`1px solid ${T.border}` }}>
    <span style={{ fontSize:13, fontWeight:500 }}>{risk}</span>
    <Sel value={data.likelihood||'3'} onChange={v => onChange({...data, likelihood:v})} options={['1','2','3','4','5']} />
    <Sel value={data.impact||'3'} onChange={v => onChange({...data, impact:v})} options={['1','2','3','4','5']} />
    <Sel value={data.horizon||'Medium'} onChange={v => onChange({...data, horizon:v})} options={['Short','Medium','Long']} />
    <Inp value={data.exposure||''} onChange={v => onChange({...data, exposure:v})} type="number" placeholder="\u20B9 Cr" small />
  </div>
);

// ── Tab definitions ────────────────────────────────────────────────────────
const TABS = [
  { key:'assess',    label:'ISSB S2 Assessment' },
  { key:'scenario',  label:'Scenario Analysis' },
  { key:'risks',     label:'Climate Risks' },
  { key:'metrics',   label:'Metrics & Targets' },
  { key:'reference', label:'Framework Reference' },
];

// ============================================================================
// MAIN PAGE COMPONENT
// ============================================================================
export default function IssbTcfdPage() {
  const [tab, setTab] = useState('assess');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // ── Shared company state ──
  const [company, setCompany] = useState('');
  const [cin, setCin] = useState('');
  const [sector, setSector] = useState('Energy');

  // ── Tab 1: ISSB S2 Assessment ──
  const [openPillars, setOpenPillars] = useState({ governance:true, strategy:false, risk_management:false, metrics_targets:false });
  const [gov, setGov] = useState({ boardOversight:false, boardDetail:'', mgmtRole:'', competency:'', targetMonitoring:'' });
  const [strat, setStrat] = useState({ physicalRisks:[], transitionRisks:[], financialImpact:'', scenariosConducted:[], transitionPlan:false });
  const [rm, setRm] = useState({ identificationProcess:'', assessmentMethodology:'', ermIntegration:'', monitoringFrequency:'Quarterly' });
  const [mt, setMt] = useState({ scope1:'', scope2:'', scope3:'', reductionTarget:'', targetYear:'2030', carbonCredits:'', carbonPrice:'' });
  const [assessResult, setAssessResult] = useState(null);

  // ── Tab 2: Scenario ──
  const [scenarioIn, setScenarioIn] = useState({ scenario:'1.5c', horizons:['2030','2050'], sector:'Energy' });
  const [scenarioResult, setScenarioResult] = useState(null);

  // ── Tab 3: Risks ──
  const initRisks = (list) => list.reduce((a,r) => ({...a, [r]:{ likelihood:'3', impact:'3', horizon:'Medium', exposure:'' }}), {});
  const [physicalRisks, setPhysicalRisks] = useState(initRisks([...PHYSICAL_ACUTE,...PHYSICAL_CHRONIC]));
  const [transitionRisks, setTransitionRisks] = useState(initRisks([...TRANSITION_POLICY,...TRANSITION_TECH,...TRANSITION_MARKET,...TRANSITION_REPUTE]));
  const [riskResult, setRiskResult] = useState(null);

  // ── Tab 4: Metrics ──
  const [ghg, setGhg] = useState({ scope1:'', scope2:'', scope3:'', baseYear:'2024', targetPct:'', targetYear:'2030', sbtiAligned:false, carbonPrice:'', credits:'' });
  const [pathwayData, setPathwayData] = useState(null);

  // ── Handlers ──
  const togglePillar = k => setOpenPillars(p => ({...p, [k]:!p[k]}));
  const handleCompanySelect = s => { setCompany(s.name); setCin(s.cin); setSector(s.sector); };

  const runAssessment = useCallback(async () => {
    setLoading(true); setError(''); setAssessResult(null);
    try {
      const { data } = await axios.post(`${API}/api/v1/issb-s2/assess`, {
        company_name: company, cin, sector,
        governance: gov, strategy: strat, risk_management: rm, metrics_targets: mt,
      });
      setAssessResult(data);
    } catch (e) { setError(e.response?.data?.detail || e.message); }
    setLoading(false);
  }, [company, cin, sector, gov, strat, rm, mt]);

  const runScenario = useCallback(async () => {
    setLoading(true); setError(''); setScenarioResult(null);
    try {
      const { data } = await axios.post(`${API}/api/v1/issb-s2/scenario-analysis`, scenarioIn);
      setScenarioResult(data);
    } catch (e) { setError(e.response?.data?.detail || e.message); }
    setLoading(false);
  }, [scenarioIn]);

  const runRiskId = useCallback(async () => {
    setLoading(true); setError(''); setRiskResult(null);
    try {
      const { data } = await axios.post(`${API}/api/v1/issb-s2/risk-identification`, {
        company_name: company, sector,
        physical_risks: physicalRisks, transition_risks: transitionRisks,
      });
      setRiskResult(data);
    } catch (e) { setError(e.response?.data?.detail || e.message); }
    setLoading(false);
  }, [company, sector, physicalRisks, transitionRisks]);

  const computePathway = useCallback(() => {
    const s1 = parseFloat(ghg.scope1)||0, s2 = parseFloat(ghg.scope2)||0, s3 = parseFloat(ghg.scope3)||0;
    const total = s1+s2+s3; if (!total) return;
    const tgtPct = parseFloat(ghg.targetPct)||42;
    const tgtYear = parseInt(ghg.targetYear)||2030;
    const baseYear = parseInt(ghg.baseYear)||2024;
    const years = [];
    for (let y = baseYear; y <= 2050; y++) {
      const elapsed = y - baseYear;
      const span = tgtYear - baseYear || 1;
      const factor = elapsed <= span ? 1 - (tgtPct/100)*(elapsed/span) : Math.max(0.05, 1 - (tgtPct/100) - 0.03*(elapsed-span));
      years.push({ year:y, total: Math.round(total*factor), scope1:Math.round(s1*factor), scope2:Math.round(s2*factor*0.85), scope3:Math.round(s3*factor*1.05) });
    }
    setPathwayData(years);
  }, [ghg]);

  // ── Render ──
  return (
    <div style={{ fontFamily:T.font, background:T.bg, minHeight:'100vh', padding:'24px 32px' }}>
      {/* Header */}
      <div style={{ marginBottom:24 }}>
        <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:4 }}>
          <span style={{ background:T.navy, color:'#fff', padding:'4px 10px', borderRadius:6, fontSize:11, fontWeight:700, letterSpacing:.5 }}>E149</span>
          <h1 style={{ fontSize:22, fontWeight:800, color:T.navy, margin:0 }}>TCFD / ISSB S2 Climate Disclosure</h1>
        </div>
        <p style={{ fontSize:13, color:T.sub, margin:0 }}>Unified climate disclosure assessment combining ISSB IFRS S2 (4 pillars) and TCFD (11 recommendations)</p>
      </div>

      {/* Company bar */}
      <Card style={{ marginBottom:20 }}>
        <div style={{ display:'flex', gap:14, alignItems:'flex-end', flexWrap:'wrap' }}>
          <div style={{ flex:1, minWidth:220 }}>
            <label style={{ fontSize:12, fontWeight:600, color:T.sub, display:'block', marginBottom:4 }}>Company</label>
            <CompanyAutocomplete value={company} onChange={setCompany} onSelect={handleCompanySelect} placeholder="Search company..." />
          </div>
          <Inp label="CIN" value={cin} onChange={setCin} placeholder="L-series CIN" style={{ width:220 }} />
          <Sel label="Sector" value={sector} onChange={setSector} options={SECTOR_OPTIONS} style={{ width:200 }} />
        </div>
      </Card>

      {/* Tab bar */}
      <div style={{ display:'flex', gap:2, marginBottom:20, background:T.card, borderRadius:8, padding:3, border:`1px solid ${T.border}` }}>
        {TABS.map(t => (
          <div key={t.key} onClick={() => setTab(t.key)}
            style={{ padding:'10px 18px', borderRadius:6, fontSize:13, fontWeight:600, cursor:'pointer', transition:'all .15s',
              background: tab===t.key ? T.navy : 'transparent', color: tab===t.key ? '#fff' : T.sub }}>
            {t.label}
          </div>
        ))}
      </div>

      {error && <Alert type="err">{error}</Alert>}

      {/* ═══ TAB 1: ISSB S2 ASSESSMENT ═══ */}
      {tab==='assess' && (
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
          {/* Governance */}
          <PillarCard pillar={PILLAR_META[0]} open={openPillars.governance} onToggle={() => togglePillar('governance')}>
            <Toggle label="Board oversight of climate-related risks & opportunities" value={gov.boardOversight} onChange={v => setGov({...gov, boardOversight:v})} />
            {gov.boardOversight && <Inp label="Board oversight details" value={gov.boardDetail} onChange={v => setGov({...gov, boardDetail:v})} placeholder="Describe frequency, committee structure..." />}
            <Inp label="Management's role in climate governance" value={gov.mgmtRole} onChange={v => setGov({...gov, mgmtRole:v})} placeholder="CRO, sustainability committee..." />
            <Sel label="Climate competency assessment" value={gov.competency} onChange={v => setGov({...gov, competency:v})}
              options={[{value:'',label:'-- Select --'},{value:'formal',label:'Formal training programme'},{value:'external',label:'External expert advisory'},{value:'basic',label:'Basic awareness only'},{value:'none',label:'No assessment'}]} />
            <Sel label="Target monitoring frequency" value={gov.targetMonitoring} onChange={v => setGov({...gov, targetMonitoring:v})}
              options={[{value:'',label:'-- Select --'},{value:'quarterly',label:'Quarterly board review'},{value:'biannual',label:'Bi-annual review'},{value:'annual',label:'Annual review'},{value:'adhoc',label:'Ad hoc only'}]} />
          </PillarCard>

          {/* Strategy */}
          <PillarCard pillar={PILLAR_META[1]} open={openPillars.strategy} onToggle={() => togglePillar('strategy')}>
            <MultiCheck label="Physical risks identified" options={['Flooding','Heat Stress','Drought','Sea Level Rise','Wildfire','Cyclone']}
              selected={strat.physicalRisks} onChange={v => setStrat({...strat, physicalRisks:v})} />
            <MultiCheck label="Transition risks identified" options={['Policy & Regulation','Technology Disruption','Market Shifts','Reputation']}
              selected={strat.transitionRisks} onChange={v => setStrat({...strat, transitionRisks:v})} />
            <Inp label="Estimated financial impact (\u20B9 Cr)" value={strat.financialImpact} onChange={v => setStrat({...strat, financialImpact:v})} type="number" placeholder="0" />
            <MultiCheck label="Scenario analysis conducted" options={['1.5\u00B0C','2\u00B0C','3\u00B0C+']}
              selected={strat.scenariosConducted} onChange={v => setStrat({...strat, scenariosConducted:v})} />
            <Toggle label="Climate transition plan in place" value={strat.transitionPlan} onChange={v => setStrat({...strat, transitionPlan:v})} />
          </PillarCard>

          {/* Risk Management */}
          <PillarCard pillar={PILLAR_META[2]} open={openPillars.risk_management} onToggle={() => togglePillar('risk_management')}>
            <Sel label="Risk identification process" value={rm.identificationProcess} onChange={v => setRm({...rm, identificationProcess:v})}
              options={[{value:'',label:'-- Select --'},{value:'dedicated',label:'Dedicated climate risk team'},{value:'integrated',label:'Integrated into existing risk framework'},{value:'external',label:'External consultants'},{value:'none',label:'No formal process'}]} />
            <Sel label="Assessment methodology" value={rm.assessmentMethodology} onChange={v => setRm({...rm, assessmentMethodology:v})}
              options={[{value:'',label:'-- Select --'},{value:'quantitative',label:'Quantitative (VaR, stress testing)'},{value:'qualitative',label:'Qualitative (expert judgement)'},{value:'mixed',label:'Mixed methodology'},{value:'none',label:'No formal methodology'}]} />
            <Sel label="Integration with enterprise risk management (ERM)" value={rm.ermIntegration} onChange={v => setRm({...rm, ermIntegration:v})}
              options={[{value:'',label:'-- Select --'},{value:'full',label:'Fully integrated into ERM'},{value:'partial',label:'Partially integrated'},{value:'standalone',label:'Standalone climate risk register'},{value:'none',label:'Not integrated'}]} />
            <Sel label="Monitoring frequency" value={rm.monitoringFrequency} onChange={v => setRm({...rm, monitoringFrequency:v})}
              options={['Monthly','Quarterly','Bi-annual','Annual']} />
          </PillarCard>

          {/* Metrics & Targets */}
          <PillarCard pillar={PILLAR_META[3]} open={openPillars.metrics_targets} onToggle={() => togglePillar('metrics_targets')}>
            <Grid cols={3}>
              <Inp label="Scope 1 (tCO\u2082e)" value={mt.scope1} onChange={v => setMt({...mt, scope1:v})} type="number" placeholder="0" />
              <Inp label="Scope 2 (tCO\u2082e)" value={mt.scope2} onChange={v => setMt({...mt, scope2:v})} type="number" placeholder="0" />
              <Inp label="Scope 3 (tCO\u2082e)" value={mt.scope3} onChange={v => setMt({...mt, scope3:v})} type="number" placeholder="0" />
            </Grid>
            <Grid cols={4}>
              <Inp label="Reduction target (%)" value={mt.reductionTarget} onChange={v => setMt({...mt, reductionTarget:v})} type="number" placeholder="42" />
              <Inp label="Target year" value={mt.targetYear} onChange={v => setMt({...mt, targetYear:v})} type="number" placeholder="2030" />
              <Inp label="Carbon credits (tCO\u2082e)" value={mt.carbonCredits} onChange={v => setMt({...mt, carbonCredits:v})} type="number" placeholder="0" />
              <Inp label="Internal carbon price (\u20B9/tCO\u2082e)" value={mt.carbonPrice} onChange={v => setMt({...mt, carbonPrice:v})} type="number" placeholder="0" />
            </Grid>
          </PillarCard>

          <div style={{ display:'flex', gap:12 }}>
            <Btn onClick={runAssessment} disabled={loading || !company}>Run ISSB S2 Assessment</Btn>
          </div>
          {loading && <Spinner />}

          {/* Assessment results */}
          {assessResult && (
            <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
              <SectionHeading>Assessment Results</SectionHeading>
              {/* Overall + Pillar KPIs */}
              <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
                <KpiCard label="Overall ISSB Readiness" value={assessResult.overall_score ?? assessResult.readiness_score ?? '--'} color={T.navy} wide />
                {PILLAR_META.map(p => (
                  <KpiCard key={p.key} label={p.label}
                    value={assessResult.pillar_scores?.[p.key] ?? assessResult[p.key+'_score'] ?? '--'}
                    color={p.color} />
                ))}
              </div>

              {/* Radar chart */}
              <Card>
                <h3 style={{ fontSize:14, fontWeight:700, color:T.navy, margin:'0 0 12px' }}>Pillar Maturity Radar</h3>
                <ResponsiveContainer width="100%" height={320}>
                  <RadarChart data={PILLAR_META.map(p => ({
                    pillar: p.label,
                    score: assessResult.pillar_scores?.[p.key] ?? assessResult[p.key+'_score'] ?? 0,
                    fullMark: 100,
                  }))}>
                    <PolarGrid stroke={T.border} />
                    <PolarAngleAxis dataKey="pillar" tick={{ fontSize:12, fill:T.text }} />
                    <PolarRadiusAxis angle={30} domain={[0,100]} tick={{ fontSize:10 }} />
                    <Radar name="Score" dataKey="score" stroke={T.navy} fill={T.navy} fillOpacity={0.25} />
                  </RadarChart>
                </ResponsiveContainer>
              </Card>

              {/* Gap analysis */}
              {assessResult.gaps && (
                <Card>
                  <h3 style={{ fontSize:14, fontWeight:700, color:T.navy, margin:'0 0 12px' }}>Gap Analysis</h3>
                  {(Array.isArray(assessResult.gaps) ? assessResult.gaps : Object.entries(assessResult.gaps).map(([k,v]) => ({pillar:k, items: Array.isArray(v) ? v : [v]}))).map((g,i) => (
                    <div key={i} style={{ marginBottom:12 }}>
                      <div style={{ fontSize:13, fontWeight:700, color:T.indigo, marginBottom:4 }}>{g.pillar || g.category}</div>
                      <ul style={{ margin:0, paddingLeft:18 }}>
                        {(g.items || g.recommendations || [g.detail || g.gap]).map((item,j) => (
                          <li key={j} style={{ fontSize:13, color:T.text, marginBottom:2 }}>{typeof item === 'string' ? item : item.description || JSON.stringify(item)}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </Card>
              )}

              {/* TCFD cross-reference */}
              {assessResult.tcfd_crossref && (
                <Card>
                  <h3 style={{ fontSize:14, fontWeight:700, color:T.navy, margin:'0 0 12px' }}>TCFD Cross-Reference</h3>
                  <div style={{ overflowX:'auto' }}>
                    <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
                      <thead>
                        <tr style={{ background:'#f8f7f4' }}>
                          <th style={{ padding:'8px 10px', textAlign:'left', borderBottom:`2px solid ${T.border}` }}>TCFD Recommendation</th>
                          <th style={{ padding:'8px 10px', textAlign:'left', borderBottom:`2px solid ${T.border}` }}>ISSB S2 Paragraph</th>
                          <th style={{ padding:'8px 10px', textAlign:'center', borderBottom:`2px solid ${T.border}` }}>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(Array.isArray(assessResult.tcfd_crossref) ? assessResult.tcfd_crossref : []).map((row,i) => (
                          <tr key={i} style={{ borderBottom:`1px solid ${T.border}` }}>
                            <td style={{ padding:'6px 10px' }}>{row.tcfd_rec || row.recommendation}</td>
                            <td style={{ padding:'6px 10px', color:T.indigo }}>{row.issb_para || row.paragraph}</td>
                            <td style={{ padding:'6px 10px', textAlign:'center' }}>
                              <span style={{ padding:'2px 8px', borderRadius:10, fontSize:11, fontWeight:600,
                                background: (row.status||'').toLowerCase()==='met' ? '#dcfce7' : (row.status||'').toLowerCase()==='partial' ? '#fef9c3' : '#fee2e2',
                                color: (row.status||'').toLowerCase()==='met' ? T.green : (row.status||'').toLowerCase()==='partial' ? T.amber : T.red }}>
                                {row.status || 'Gap'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              )}
            </div>
          )}
        </div>
      )}

      {/* ═══ TAB 2: SCENARIO ANALYSIS ═══ */}
      {tab==='scenario' && (
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
          <Card>
            <h3 style={{ fontSize:15, fontWeight:700, color:T.navy, margin:'0 0 16px' }}>Climate Scenario Configuration</h3>
            <Grid cols={3}>
              <Sel label="Scenario" value={scenarioIn.scenario} onChange={v => setScenarioIn({...scenarioIn, scenario:v})} options={SCENARIOS} />
              <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
                <label style={{ fontSize:12, fontWeight:600, color:T.sub }}>Time Horizons</label>
                <div style={{ display:'flex', gap:6 }}>
                  {HORIZONS.map(h => {
                    const active = scenarioIn.horizons.includes(h);
                    return <div key={h} onClick={() => setScenarioIn({...scenarioIn, horizons: active ? scenarioIn.horizons.filter(x=>x!==h) : [...scenarioIn.horizons,h]})}
                      style={{ padding:'6px 14px', borderRadius:6, fontSize:12, fontWeight:600, cursor:'pointer',
                        border:`1px solid ${active ? T.indigo : T.border}`, background: active ? T.indigo : '#fafafa', color: active ? '#fff' : T.text }}>{h}</div>;
                  })}
                </div>
              </div>
              <Sel label="Sector" value={scenarioIn.sector} onChange={v => setScenarioIn({...scenarioIn, sector:v})} options={SECTOR_OPTIONS} />
            </Grid>
            <div style={{ marginTop:16 }}><Btn onClick={runScenario} disabled={loading} color="indigo">Run Scenario Analysis</Btn></div>
          </Card>
          {loading && <Spinner />}

          {scenarioResult && (
            <>
              {/* KPIs */}
              <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
                <KpiCard label="Strategy Resilience" value={scenarioResult.resilience_score ?? '--'} color={T.indigo} wide />
                <KpiCard label="Physical Risk Score" value={scenarioResult.physical_risk_score ?? '--'} color={T.amber} />
                <KpiCard label="Transition Risk Score" value={scenarioResult.transition_risk_score ?? '--'} color={T.teal} />
                <KpiCard label="Financial Impact" value={scenarioResult.financial_impact ? `\u20B9${scenarioResult.financial_impact} Cr` : '--'} color={T.red} />
              </div>

              {/* Physical risk heatmap */}
              {scenarioResult.physical_risks && (
                <Card>
                  <h3 style={{ fontSize:14, fontWeight:700, color:T.amber, margin:'0 0 12px' }}>Physical Risk Heatmap</h3>
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(140px,1fr))', gap:8 }}>
                    {(Array.isArray(scenarioResult.physical_risks) ? scenarioResult.physical_risks : Object.entries(scenarioResult.physical_risks).map(([k,v]) => ({name:k, score:typeof v==='number'?v:v.score||0}))).map((r,i) => {
                      const score = r.score ?? r.value ?? 0;
                      const bg = score >= 8 ? T.red : score >= 5 ? T.amber : score >= 3 ? T.gold : T.green;
                      return (
                        <div key={i} style={{ background:bg+'1a', border:`1px solid ${bg}`, borderRadius:8, padding:'10px 12px', textAlign:'center' }}>
                          <div style={{ fontSize:11, fontWeight:600, color:T.text }}>{r.name || r.risk}</div>
                          <div style={{ fontSize:22, fontWeight:700, color:bg, marginTop:4 }}>{score}</div>
                        </div>
                      );
                    })}
                  </div>
                </Card>
              )}

              {/* Transition risk waterfall */}
              {scenarioResult.transition_risks && (
                <Card>
                  <h3 style={{ fontSize:14, fontWeight:700, color:T.teal, margin:'0 0 12px' }}>Transition Risk Impact</h3>
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={(Array.isArray(scenarioResult.transition_risks) ? scenarioResult.transition_risks : Object.entries(scenarioResult.transition_risks).map(([k,v]) => ({name:k, impact:typeof v==='number'?v:v.impact||0}))).slice(0,8)}>
                      <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                      <XAxis dataKey="name" tick={{ fontSize:11 }} angle={-20} textAnchor="end" height={60} />
                      <YAxis tick={{ fontSize:11 }} />
                      <Tooltip />
                      <Bar dataKey="impact" radius={[4,4,0,0]}>
                        {(Array.isArray(scenarioResult.transition_risks) ? scenarioResult.transition_risks : []).map((_,i) => <Cell key={i} fill={CHART_COLORS[i%CHART_COLORS.length]} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </Card>
              )}

              {/* Financial impact ranges */}
              {scenarioResult.financial_ranges && (
                <Card>
                  <h3 style={{ fontSize:14, fontWeight:700, color:T.navy, margin:'0 0 12px' }}>Financial Impact Ranges by Horizon</h3>
                  <div style={{ overflowX:'auto' }}>
                    <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
                      <thead><tr style={{ background:'#f8f7f4' }}>
                        <th style={{ padding:'8px 10px', textAlign:'left', borderBottom:`2px solid ${T.border}` }}>Horizon</th>
                        <th style={{ padding:'8px 10px', textAlign:'right', borderBottom:`2px solid ${T.border}` }}>Low (\u20B9 Cr)</th>
                        <th style={{ padding:'8px 10px', textAlign:'right', borderBottom:`2px solid ${T.border}` }}>Mid (\u20B9 Cr)</th>
                        <th style={{ padding:'8px 10px', textAlign:'right', borderBottom:`2px solid ${T.border}` }}>High (\u20B9 Cr)</th>
                      </tr></thead>
                      <tbody>
                        {(Array.isArray(scenarioResult.financial_ranges) ? scenarioResult.financial_ranges : []).map((r,i) => (
                          <tr key={i} style={{ borderBottom:`1px solid ${T.border}` }}>
                            <td style={{ padding:'6px 10px', fontWeight:600 }}>{r.horizon || r.year}</td>
                            <td style={{ padding:'6px 10px', textAlign:'right', color:T.green }}>{r.low ?? '--'}</td>
                            <td style={{ padding:'6px 10px', textAlign:'right', color:T.amber }}>{r.mid ?? '--'}</td>
                            <td style={{ padding:'6px 10px', textAlign:'right', color:T.red }}>{r.high ?? '--'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              )}
            </>
          )}
        </div>
      )}

      {/* ═══ TAB 3: CLIMATE RISKS ═══ */}
      {tab==='risks' && (
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
          {/* Header row */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 100px 100px 120px 120px', gap:8, padding:'0 0 4px',
            fontSize:11, fontWeight:700, color:T.sub, textTransform:'uppercase', letterSpacing:.5 }}>
            <span>Risk</span><span>Likelihood</span><span>Impact</span><span>Horizon</span><span>Exposure (\u20B9 Cr)</span>
          </div>

          {/* Physical - Acute */}
          <Card style={{ borderLeft:`4px solid ${T.amber}` }}>
            <SectionHeading color={T.amber}>Physical Risks \u2014 Acute</SectionHeading>
            {PHYSICAL_ACUTE.map(r => <RiskRow key={r} risk={r} data={physicalRisks[r]} onChange={v => setPhysicalRisks({...physicalRisks, [r]:v})} />)}
          </Card>

          {/* Physical - Chronic */}
          <Card style={{ borderLeft:`4px solid ${T.amber}` }}>
            <SectionHeading color={T.amber}>Physical Risks \u2014 Chronic</SectionHeading>
            {PHYSICAL_CHRONIC.map(r => <RiskRow key={r} risk={r} data={physicalRisks[r]} onChange={v => setPhysicalRisks({...physicalRisks, [r]:v})} />)}
          </Card>

          {/* Transition - Policy */}
          <Card style={{ borderLeft:`4px solid ${T.indigo}` }}>
            <SectionHeading color={T.indigo}>Transition Risks \u2014 Policy & Legal</SectionHeading>
            {TRANSITION_POLICY.map(r => <RiskRow key={r} risk={r} data={transitionRisks[r]} onChange={v => setTransitionRisks({...transitionRisks, [r]:v})} />)}
          </Card>

          {/* Transition - Technology */}
          <Card style={{ borderLeft:`4px solid ${T.indigo}` }}>
            <SectionHeading color={T.indigo}>Transition Risks \u2014 Technology</SectionHeading>
            {TRANSITION_TECH.map(r => <RiskRow key={r} risk={r} data={transitionRisks[r]} onChange={v => setTransitionRisks({...transitionRisks, [r]:v})} />)}
          </Card>

          {/* Transition - Market */}
          <Card style={{ borderLeft:`4px solid ${T.indigo}` }}>
            <SectionHeading color={T.indigo}>Transition Risks \u2014 Market</SectionHeading>
            {TRANSITION_MARKET.map(r => <RiskRow key={r} risk={r} data={transitionRisks[r]} onChange={v => setTransitionRisks({...transitionRisks, [r]:v})} />)}
          </Card>

          {/* Transition - Reputation */}
          <Card style={{ borderLeft:`4px solid ${T.indigo}` }}>
            <SectionHeading color={T.indigo}>Transition Risks \u2014 Reputation</SectionHeading>
            {TRANSITION_REPUTE.map(r => <RiskRow key={r} risk={r} data={transitionRisks[r]} onChange={v => setTransitionRisks({...transitionRisks, [r]:v})} />)}
          </Card>

          <div style={{ display:'flex', gap:12 }}>
            <Btn onClick={runRiskId} disabled={loading || !company} color="teal">Assess Climate Risks</Btn>
          </div>
          {loading && <Spinner />}

          {/* Risk results */}
          {riskResult && (
            <>
              <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
                <KpiCard label="Overall Risk Score" value={riskResult.overall_score ?? '--'} color={T.red} wide />
                <KpiCard label="Physical Risk" value={riskResult.physical_score ?? '--'} color={T.amber} />
                <KpiCard label="Transition Risk" value={riskResult.transition_score ?? '--'} color={T.indigo} />
                <KpiCard label="Total Exposure" value={riskResult.total_exposure ? `\u20B9${riskResult.total_exposure} Cr` : '--'} color={T.navy} />
              </div>

              {/* Risk matrix */}
              {riskResult.risk_matrix && (
                <Card>
                  <h3 style={{ fontSize:14, fontWeight:700, color:T.navy, margin:'0 0 12px' }}>Risk Matrix (Likelihood x Impact)</h3>
                  <div style={{ display:'grid', gridTemplateColumns:'60px repeat(5,1fr)', gap:2 }}>
                    <div />
                    {[1,2,3,4,5].map(i => <div key={i} style={{ textAlign:'center', fontSize:11, fontWeight:600, color:T.sub, padding:4 }}>Impact {i}</div>)}
                    {[5,4,3,2,1].map(l => (
                      <React.Fragment key={l}>
                        <div style={{ fontSize:11, fontWeight:600, color:T.sub, display:'flex', alignItems:'center', justifyContent:'center' }}>L{l}</div>
                        {[1,2,3,4,5].map(imp => {
                          const risks = (riskResult.risk_matrix || []).filter(r => r.likelihood==l && r.impact==imp);
                          const severity = l*imp;
                          const bg = severity >= 15 ? '#fecaca' : severity >= 8 ? '#fef3c7' : '#dcfce7';
                          return (
                            <div key={imp} style={{ background:bg, borderRadius:4, padding:4, minHeight:32, fontSize:10 }}>
                              {risks.map((r,i) => <div key={i} style={{ fontWeight:500 }}>{r.name || r.risk}</div>)}
                            </div>
                          );
                        })}
                      </React.Fragment>
                    ))}
                  </div>
                </Card>
              )}

              {riskResult.recommendations && (
                <Card>
                  <h3 style={{ fontSize:14, fontWeight:700, color:T.navy, margin:'0 0 12px' }}>Risk Mitigation Recommendations</h3>
                  <ul style={{ margin:0, paddingLeft:18 }}>
                    {(Array.isArray(riskResult.recommendations) ? riskResult.recommendations : []).map((r,i) => (
                      <li key={i} style={{ fontSize:13, color:T.text, marginBottom:4 }}>{typeof r === 'string' ? r : r.description || r.text}</li>
                    ))}
                  </ul>
                </Card>
              )}
            </>
          )}
        </div>
      )}

      {/* ═══ TAB 4: METRICS & TARGETS ═══ */}
      {tab==='metrics' && (
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
          {/* GHG Input */}
          <Card style={{ borderLeft:`4px solid ${T.sage}` }}>
            <SectionHeading color={T.sage}>GHG Emissions Inventory</SectionHeading>
            <Grid cols={3}>
              <Inp label="Scope 1 \u2014 Direct (tCO\u2082e)" value={ghg.scope1} onChange={v => setGhg({...ghg, scope1:v})} type="number" placeholder="0" />
              <Inp label="Scope 2 \u2014 Indirect Energy (tCO\u2082e)" value={ghg.scope2} onChange={v => setGhg({...ghg, scope2:v})} type="number" placeholder="0" />
              <Inp label="Scope 3 \u2014 Value Chain (tCO\u2082e)" value={ghg.scope3} onChange={v => setGhg({...ghg, scope3:v})} type="number" placeholder="0" />
            </Grid>
            <div style={{ marginTop:12 }}>
              <Inp label="Base year" value={ghg.baseYear} onChange={v => setGhg({...ghg, baseYear:v})} type="number" style={{ width:120 }} />
            </div>
          </Card>

          {/* Targets */}
          <Card style={{ borderLeft:`4px solid ${T.green}` }}>
            <SectionHeading color={T.green}>Reduction Targets</SectionHeading>
            <Grid cols={4}>
              <Inp label="Reduction target (%)" value={ghg.targetPct} onChange={v => setGhg({...ghg, targetPct:v})} type="number" placeholder="42" />
              <Inp label="Target year" value={ghg.targetYear} onChange={v => setGhg({...ghg, targetYear:v})} type="number" placeholder="2030" />
              <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
                <label style={{ fontSize:12, fontWeight:600, color:T.sub }}>SBTi alignment</label>
                <Toggle label={ghg.sbtiAligned ? 'Aligned' : 'Not aligned'} value={ghg.sbtiAligned} onChange={v => setGhg({...ghg, sbtiAligned:v})} />
              </div>
              <div />
            </Grid>
            {ghg.sbtiAligned && <Alert type="ok">SBTi-aligned: Near-term target requires 42% reduction by 2030 (1.5\u00B0C pathway). Long-term requires 90% by 2050.</Alert>}
          </Card>

          {/* Carbon pricing & credits */}
          <Card style={{ borderLeft:`4px solid ${T.gold}` }}>
            <SectionHeading color={T.gold}>Internal Carbon Pricing & Credits</SectionHeading>
            <Grid cols={3}>
              <Inp label="Internal carbon price (\u20B9/tCO\u2082e)" value={ghg.carbonPrice} onChange={v => setGhg({...ghg, carbonPrice:v})} type="number" placeholder="500" />
              <Inp label="Carbon credits purchased (tCO\u2082e)" value={ghg.credits} onChange={v => setGhg({...ghg, credits:v})} type="number" placeholder="0" />
              <div style={{ display:'flex', flexDirection:'column', gap:4, justifyContent:'flex-end' }}>
                <div style={{ fontSize:12, fontWeight:600, color:T.sub }}>Implied carbon cost</div>
                <div style={{ fontSize:18, fontWeight:700, color:T.gold }}>
                  {ghg.carbonPrice && (parseFloat(ghg.scope1||0)+parseFloat(ghg.scope2||0))
                    ? `\u20B9${((parseFloat(ghg.carbonPrice)*(parseFloat(ghg.scope1||0)+parseFloat(ghg.scope2||0)))/10000000).toFixed(2)} Cr`
                    : '--'}
                </div>
              </div>
            </Grid>
          </Card>

          <Btn onClick={computePathway} disabled={!ghg.scope1 && !ghg.scope2} color="sage">Generate Reduction Pathway</Btn>

          {/* Pathway chart */}
          {pathwayData && (
            <Card>
              <h3 style={{ fontSize:14, fontWeight:700, color:T.sage, margin:'0 0 12px' }}>Emissions Reduction Pathway (2024 \u2192 2050)</h3>
              <ResponsiveContainer width="100%" height={320}>
                <LineChart data={pathwayData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="year" tick={{ fontSize:11 }} />
                  <YAxis tick={{ fontSize:11 }} />
                  <Tooltip formatter={v => `${v.toLocaleString()} tCO\u2082e`} />
                  <Legend />
                  <Line type="monotone" dataKey="total" stroke={T.navy} strokeWidth={2} name="Total" dot={{ r:3 }} />
                  <Line type="monotone" dataKey="scope1" stroke={T.red} strokeWidth={1.5} strokeDasharray="4 2" name="Scope 1" dot={false} />
                  <Line type="monotone" dataKey="scope2" stroke={T.amber} strokeWidth={1.5} strokeDasharray="4 2" name="Scope 2" dot={false} />
                  <Line type="monotone" dataKey="scope3" stroke={T.sage} strokeWidth={1.5} strokeDasharray="4 2" name="Scope 3" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </Card>
          )}

          {/* Scope breakdown donut */}
          {(ghg.scope1 || ghg.scope2 || ghg.scope3) && (
            <Card>
              <h3 style={{ fontSize:14, fontWeight:700, color:T.navy, margin:'0 0 12px' }}>Scope Breakdown</h3>
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={[
                    { name:'Scope 1', value:parseFloat(ghg.scope1)||0 },
                    { name:'Scope 2', value:parseFloat(ghg.scope2)||0 },
                    { name:'Scope 3', value:parseFloat(ghg.scope3)||0 },
                  ].filter(d=>d.value>0)} cx="50%" cy="50%" innerRadius={60} outerRadius={100} dataKey="value" label={({ name, percent }) => `${name}: ${(percent*100).toFixed(0)}%`}>
                    {[T.red, T.amber, T.sage].map((c,i) => <Cell key={i} fill={c} />)}
                  </Pie>
                  <Tooltip formatter={v => `${v.toLocaleString()} tCO\u2082e`} />
                </PieChart>
              </ResponsiveContainer>
            </Card>
          )}
        </div>
      )}

      {/* ═══ TAB 5: FRAMEWORK REFERENCE ═══ */}
      {tab==='reference' && (
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
          {/* ISSB S2 Pillars */}
          <Card style={{ borderLeft:`4px solid ${T.navy}` }}>
            <h3 style={{ fontSize:15, fontWeight:700, color:T.navy, margin:'0 0 14px' }}>ISSB IFRS S2 \u2014 Four Pillars</h3>
            <Alert type="info">Effective January 2024. December 2025 amendments: Scope 3 Category 15 (financed emissions) relief for first 2 years; GHG Protocol flexibility for measurement methodologies.</Alert>
            <div style={{ marginTop:14, display:'flex', flexDirection:'column', gap:12 }}>
              {[
                { p:PILLAR_META[0], reqs:['Board/committee oversight of climate risks & opportunities (S2.6a)','Describe management\'s role in governance processes (S2.6b)','Climate-related competencies and assessment approach','How climate targets are monitored by the board'] },
                { p:PILLAR_META[1], reqs:['Climate-related risks & opportunities reasonably expected (S2.10a)','Effects on business model and value chain (S2.13)','Financial effects: current and anticipated (S2.14-15)','Climate resilience: scenario analysis (S2.22)','Transition plans towards low-carbon economy (S2.16)'] },
                { p:PILLAR_META[2], reqs:['Processes to identify climate risks and opportunities (S2.24a)','Processes to assess, prioritise, and monitor (S2.24b)','Integration into overall risk management (S2.24c)','Describe inputs and parameters used (S2.25)'] },
                { p:PILLAR_META[3], reqs:['Cross-industry metrics: GHG Scope 1/2/3 (S2.29b)','Internal carbon prices if used (S2.29e)','Climate-related targets: base year, milestones (S2.33)','Remuneration linked to climate (S2.29f)','Amount of capital expenditure deployed (S2.29d)','Industry-based metrics per SASB Standards (S2.32)'] },
              ].map(({ p, reqs }) => (
                <div key={p.key} style={{ padding:'12px 16px', borderRadius:8, border:`1px solid ${T.border}`, background:'#fafaf8' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
                    <span style={{ background:p.color, color:'#fff', borderRadius:4, padding:'2px 8px', fontSize:11, fontWeight:700 }}>{p.label}</span>
                  </div>
                  <ul style={{ margin:0, paddingLeft:18 }}>
                    {reqs.map((r,i) => <li key={i} style={{ fontSize:12, color:T.text, marginBottom:3, lineHeight:1.5 }}>{r}</li>)}
                  </ul>
                </div>
              ))}
            </div>
          </Card>

          {/* TCFD 11 Recommendations */}
          <Card style={{ borderLeft:`4px solid ${T.gold}` }}>
            <h3 style={{ fontSize:15, fontWeight:700, color:T.gold, margin:'0 0 14px' }}>TCFD 11 Recommendations \u2192 ISSB S2 Mapping</h3>
            <div style={{ overflowX:'auto' }}>
              <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
                <thead>
                  <tr style={{ background:'#f8f7f4' }}>
                    <th style={{ padding:'8px 10px', textAlign:'left', borderBottom:`2px solid ${T.border}`, width:'30%' }}>TCFD Recommendation</th>
                    <th style={{ padding:'8px 10px', textAlign:'left', borderBottom:`2px solid ${T.border}` }}>ISSB S2 Paragraphs</th>
                    <th style={{ padding:'8px 10px', textAlign:'left', borderBottom:`2px solid ${T.border}`, width:'35%' }}>Key Requirements</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ['Gov-a: Board oversight','S2.6(a)','Describe board/committee processes for climate oversight'],
                    ['Gov-b: Management role','S2.6(b)','Describe management\'s role in assessing and managing'],
                    ['Strat-a: Risks & opportunities','S2.10-12','Climate risks & opportunities over short/medium/long term'],
                    ['Strat-b: Impact on business','S2.13-15','Impact on strategy, financial planning, business model'],
                    ['Strat-c: Resilience (scenario)','S2.22','Climate resilience assessment using scenario analysis'],
                    ['RM-a: Identify & assess','S2.24(a-b)','Process for identifying and assessing climate risks'],
                    ['RM-b: Manage risks','S2.24(c)','Process for managing and prioritising climate risks'],
                    ['RM-c: Integration','S2.24(c)','Integration into overall risk management'],
                    ['MT-a: Metrics used','S2.29','Cross-industry and industry-specific metrics'],
                    ['MT-b: GHG Scope 1/2/3','S2.29(b)','Absolute Scope 1, 2, 3 emissions (tCO\u2082e)'],
                    ['MT-c: Targets','S2.33-34','Climate targets, base year, progress, milestones'],
                  ].map(([rec, para, req], i) => (
                    <tr key={i} style={{ borderBottom:`1px solid ${T.border}` }}>
                      <td style={{ padding:'6px 10px', fontWeight:600 }}>{rec}</td>
                      <td style={{ padding:'6px 10px', color:T.indigo, fontWeight:600 }}>{para}</td>
                      <td style={{ padding:'6px 10px', color:T.sub }}>{req}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* SASB Industry Metrics */}
          <Card style={{ borderLeft:`4px solid ${T.teal}` }}>
            <h3 style={{ fontSize:15, fontWeight:700, color:T.teal, margin:'0 0 14px' }}>SASB Industry-Specific Metrics (S2.32)</h3>
            <div style={{ overflowX:'auto' }}>
              <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
                <thead>
                  <tr style={{ background:'#f8f7f4' }}>
                    <th style={{ padding:'8px 10px', textAlign:'left', borderBottom:`2px solid ${T.border}` }}>Sector</th>
                    <th style={{ padding:'8px 10px', textAlign:'left', borderBottom:`2px solid ${T.border}` }}>Key Climate Metrics</th>
                    <th style={{ padding:'8px 10px', textAlign:'left', borderBottom:`2px solid ${T.border}` }}>SASB Standard</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ['Oil & Gas','Scope 1 methane, flaring, reserves in carbon-constrained scenarios','EM-EP / EM-RM'],
                    ['Electric Utilities','GHG emissions intensity (tCO\u2082e/MWh), renewable generation %','IF-EU'],
                    ['Commercial Banks','Financed emissions (Scope 3 Cat 15), climate-related credit risk','FN-CB'],
                    ['Insurance','Physical risk exposure, catastrophe losses, underwriting ESG','FN-IN'],
                    ['Metals & Mining','Energy intensity, tailings management, water withdrawal','EM-MM'],
                    ['Real Estate','Energy intensity (kWh/sq ft), green building certifications','IF-RE'],
                    ['Transportation','Fleet emissions intensity, EV transition pathway','TR-RO / TR-AF'],
                    ['Chemicals','Process emissions, hazardous waste, product lifecycle','RT-CH'],
                  ].map(([sector, metrics, std], i) => (
                    <tr key={i} style={{ borderBottom:`1px solid ${T.border}` }}>
                      <td style={{ padding:'6px 10px', fontWeight:600 }}>{sector}</td>
                      <td style={{ padding:'6px 10px' }}>{metrics}</td>
                      <td style={{ padding:'6px 10px', color:T.indigo, fontWeight:600, fontFamily:'monospace' }}>{std}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Global Adoption */}
          <Card style={{ borderLeft:`4px solid ${T.sage}` }}>
            <h3 style={{ fontSize:15, fontWeight:700, color:T.sage, margin:'0 0 14px' }}>Global ISSB Adoption Map</h3>
            <Alert type="info">As of March 2026: 21+ jurisdictions have adopted or announced adoption of ISSB standards. SEBI India mandated BRSR Core (ISSB-aligned) for top 1,000 listed companies from FY2024-25.</Alert>
            <div style={{ marginTop:12, display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(200px,1fr))', gap:8 }}>
              {[
                { jurisdiction:'India (SEBI)', status:'Mandatory', date:'FY2024-25', note:'BRSR Core for top 1,000' },
                { jurisdiction:'UK', status:'Mandatory', date:'2025', note:'UK SDS based on ISSB' },
                { jurisdiction:'Japan', status:'Mandatory', date:'Apr 2025', note:'Prime market listed cos' },
                { jurisdiction:'Australia', status:'Mandatory', date:'Jan 2025', note:'AASB S1/S2 phased' },
                { jurisdiction:'Canada', status:'Mandatory', date:'2025', note:'CSSB adopted ISSB' },
                { jurisdiction:'Singapore', status:'Mandatory', date:'FY2025', note:'SGX listed companies' },
                { jurisdiction:'Hong Kong', status:'Mandatory', date:'Jan 2025', note:'HKEX main board' },
                { jurisdiction:'Nigeria', status:'Mandatory', date:'2025', note:'FRC adoption' },
                { jurisdiction:'Brazil', status:'Mandatory', date:'2026', note:'CVM phased approach' },
                { jurisdiction:'EU', status:'Interoperable', date:'2024', note:'ESRS with ISSB mapping' },
                { jurisdiction:'South Korea', status:'Voluntary', date:'2025', note:'KSSB standards' },
                { jurisdiction:'Malaysia', status:'Mandatory', date:'2025', note:'Bursa phased' },
                { jurisdiction:'Saudi Arabia', status:'Mandatory', date:'2025', note:'CMA listed cos' },
                { jurisdiction:'Kenya', status:'Mandatory', date:'2025', note:'NSE listed companies' },
                { jurisdiction:'Egypt', status:'Voluntary', date:'2025', note:'FRA guidance' },
                { jurisdiction:'Turkey', status:'Mandatory', date:'2025', note:'CMB listed cos' },
                { jurisdiction:'Philippines', status:'Mandatory', date:'2026', note:'SEC phased' },
                { jurisdiction:'New Zealand', status:'Mandatory', date:'2024', note:'XRB CS1/CS2' },
                { jurisdiction:'Taiwan', status:'Mandatory', date:'2026', note:'FSC phased' },
                { jurisdiction:'China', status:'Voluntary', date:'2025', note:'MoF convergence' },
                { jurisdiction:'South Africa', status:'Voluntary', date:'2025', note:'JSE guidance' },
              ].map((j,i) => {
                const color = j.status==='Mandatory' ? T.green : j.status==='Interoperable' ? T.blue : T.amber;
                return (
                  <div key={i} style={{ background:'#fafaf8', border:`1px solid ${T.border}`, borderRadius:8, padding:'10px 12px' }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:4 }}>
                      <span style={{ fontSize:13, fontWeight:700, color:T.text }}>{j.jurisdiction}</span>
                      <span style={{ padding:'2px 8px', borderRadius:10, fontSize:10, fontWeight:700, background:color+'1a', color }}>{j.status}</span>
                    </div>
                    <div style={{ fontSize:11, color:T.sub }}>{j.date} \u2014 {j.note}</div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      )}

      {/* Footer */}
      <div style={{ marginTop:32, padding:'16px 0', borderTop:`1px solid ${T.border}`, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <span style={{ fontSize:11, color:T.sub }}>E149 TCFD / ISSB S2 Climate Disclosure \u2014 Risk Analytics Platform</span>
        <span style={{ fontSize:11, color:T.sub }}>ISSB IFRS S2 (eff. Jan 2024) + TCFD (11 recommendations) | SEBI BRSR Core aligned</span>
      </div>
    </div>
  );
}
