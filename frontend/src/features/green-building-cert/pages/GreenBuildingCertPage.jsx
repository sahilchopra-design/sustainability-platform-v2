import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PieChart, Pie, BarChart, Bar, Cell, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from 'recharts';

/* ───────────────────── THEME ───────────────────── */
const T={bg:'#f6f4f0',surface:'#ffffff',surfaceH:'#f0ede7',border:'#e5e0d8',borderL:'#d5cfc5',navy:'#1b3a5c',navyL:'#2c5a8c',gold:'#c5a96a',goldL:'#d4be8a',sage:'#5a8a6a',sageL:'#7ba67d',teal:'#5a8a6a',text:'#1b3a5c',textSec:'#5c6b7e',textMut:'#9aa3ae',red:'#dc2626',green:'#16a34a',amber:'#d97706',font:"'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"};

/* ───────────────────── CERT SCHEMES (15 schemes) ───────────────────── */
const CERT_SCHEMES = {
  LEED:         { name:'LEED',        color:'#16a34a', levels:['Certified','Silver','Gold','Platinum'], org:'USGBC' },
  BREEAM:       { name:'BREEAM',      color:'#1b3a5c', levels:['Pass','Good','Very Good','Excellent','Outstanding'], org:'BRE' },
  NABERS:       { name:'NABERS',      color:'#2563eb', levels:['1 Star','2 Star','3 Star','4 Star','5 Star','6 Star'], org:'NABERS AU' },
  'Green Star': { name:'Green Star',  color:'#0d9488', levels:['1 Star','2 Star','3 Star','4 Star','5 Star','6 Star'], org:'GBCA' },
  DGNB:         { name:'DGNB',        color:'#d97706', levels:['Bronze','Silver','Gold','Platinum'], org:'DGNB DE' },
  WELL:         { name:'WELL',        color:'#7c3aed', levels:['Silver','Gold','Platinum'], org:'IWBI' },
  IGBC:         { name:'IGBC',        color:'#f97316', levels:['Certified','Silver','Gold','Platinum'], org:'CII India' },
  Fitwel:       { name:'Fitwel',      color:'#ec4899', levels:['1 Star','2 Star','3 Star'], org:'CFAAB' },
  EDGE:         { name:'EDGE',        color:'#06b6d4', levels:['EDGE Certified','EDGE Advanced','EDGE Zero Carbon'], org:'IFC' },
  HQE:          { name:'HQE',         color:'#8b5cf6', levels:['Good','Very Good','Excellent','Exceptional'], org:'Cerway' },
  CASBEE:       { name:'CASBEE',      color:'#14b8a6', levels:['C','B-','B+','A','S'], org:'JSBC' },
  Earthcheck:   { name:'Earthcheck',  color:'#84cc16', levels:['Benchmarked','Silver','Gold','Platinum'], org:'EC3 Global' },
  Svanen:       { name:'Svanen',      color:'#22d3ee', levels:['Nordic Swan'], org:'Nordic Council' },
  'Green Mark': { name:'Green Mark',  color:'#10b981', levels:['Certified','Gold','Gold Plus','Platinum','Super Low Energy','Zero Energy'], org:'BCA Singapore' },
  'G-SEED':     { name:'G-SEED',      color:'#f59e0b', levels:['Grade 4','Grade 3','Grade 2','Grade 1'], org:'Korea' },
};

const ALL_SCHEME_NAMES = Object.keys(CERT_SCHEMES);

const REGIONAL_REQUIREMENTS = [
  { jurisdiction:'EU (CSRD/Taxonomy)', mandatory:'EPC B+ by 2030', recommended:'BREEAM/DGNB', notes:'EU Taxonomy alignment requires top 15% energy performance' },
  { jurisdiction:'UK', mandatory:'EPC B by 2030 (commercial)', recommended:'BREEAM Very Good+', notes:'MEES regulations tightening' },
  { jurisdiction:'Singapore', mandatory:'Green Mark (new builds)', recommended:'Green Mark Platinum', notes:'BCA Green Mark mandatory for new & major retrofits' },
  { jurisdiction:'USA (NYC)', mandatory:'LL97 carbon limits', recommended:'LEED Gold+', notes:'Local Law 97 penalties from 2024' },
  { jurisdiction:'Australia', mandatory:'NABERS disclosure', recommended:'NABERS 5 Star+', notes:'Commercial Building Disclosure program' },
  { jurisdiction:'India', mandatory:'ECBC compliance', recommended:'IGBC Gold+', notes:'Energy Conservation Building Code for commercial' },
  { jurisdiction:'Germany', mandatory:'GEG energy standards', recommended:'DGNB Gold+', notes:'Building Energy Act (GEG) requirements' },
  { jurisdiction:'Japan', mandatory:'CASBEE (large builds)', recommended:'CASBEE S rank', notes:'Energy efficiency standards for large buildings' },
  { jurisdiction:'France', mandatory:'RE2020 (new builds)', recommended:'HQE Excellent+', notes:'RE2020 regulations for new construction' },
  { jurisdiction:'UAE/Dubai', mandatory:'Al Sa\'faat (new builds)', recommended:'LEED Gold+ / Estidama', notes:'Green building regulations for new construction' },
];

const CERT_COST_BENEFIT = [
  { scheme:'LEED Gold', estCostPerM2:15, rentPremiumPct:8.2, occupancyUplift:3.5, paybackYears:4.2 },
  { scheme:'LEED Platinum', estCostPerM2:28, rentPremiumPct:12.5, occupancyUplift:5.0, paybackYears:5.8 },
  { scheme:'BREEAM Excellent', estCostPerM2:18, rentPremiumPct:7.8, occupancyUplift:3.2, paybackYears:4.8 },
  { scheme:'BREEAM Outstanding', estCostPerM2:35, rentPremiumPct:14.0, occupancyUplift:6.0, paybackYears:6.5 },
  { scheme:'DGNB Gold', estCostPerM2:16, rentPremiumPct:6.5, occupancyUplift:2.8, paybackYears:5.0 },
  { scheme:'Green Star 5 Star', estCostPerM2:14, rentPremiumPct:7.0, occupancyUplift:3.0, paybackYears:4.5 },
  { scheme:'WELL Gold', estCostPerM2:22, rentPremiumPct:5.5, occupancyUplift:4.2, paybackYears:6.0 },
  { scheme:'IGBC Gold', estCostPerM2:8, rentPremiumPct:5.0, occupancyUplift:2.5, paybackYears:3.5 },
  { scheme:'NABERS 5 Star', estCostPerM2:12, rentPremiumPct:6.8, occupancyUplift:3.0, paybackYears:4.0 },
  { scheme:'Fitwel 2 Star', estCostPerM2:10, rentPremiumPct:4.0, occupancyUplift:3.5, paybackYears:3.8 },
  { scheme:'EDGE Certified', estCostPerM2:6, rentPremiumPct:3.5, occupancyUplift:2.0, paybackYears:3.0 },
  { scheme:'HQE Excellent', estCostPerM2:20, rentPremiumPct:7.5, occupancyUplift:3.0, paybackYears:5.2 },
  { scheme:'CASBEE S', estCostPerM2:18, rentPremiumPct:7.0, occupancyUplift:3.2, paybackYears:5.0 },
  { scheme:'Green Mark Platinum', estCostPerM2:14, rentPremiumPct:6.5, occupancyUplift:3.0, paybackYears:4.2 },
  { scheme:'G-SEED Grade 1', estCostPerM2:12, rentPremiumPct:5.5, occupancyUplift:2.5, paybackYears:4.0 },
];

/* Scheme comparison calculator data */
const SCHEME_EVAL = (prop) => {
  const ei = prop.energy_intensity_kwh || 150;
  const ci = prop.carbon_intensity_kgco2 || 50;
  const wi = prop.water_intensity_l_m2 || 1.5;
  const wd = prop.waste_diversion_rate_pct || 60;
  const rn = prop.renewable_share_pct || 15;
  const score = (200 - ei) * 0.3 + (100 - ci) * 0.2 + (100 - wi * 20) * 0.1 + wd * 0.2 + rn * 0.2;
  return ALL_SCHEME_NAMES.map(scheme => {
    const s = CERT_SCHEMES[scheme];
    const levels = s.levels;
    const idx = Math.min(levels.length - 1, Math.max(0, Math.floor(score / (100 / levels.length))));
    const achievable = levels[idx];
    const costBase = CERT_COST_BENEFIT.find(c => c.scheme.startsWith(scheme))?.estCostPerM2 || 15;
    const estCost = costBase * (prop.gfa_m2 || 10000) / 1e6;
    const premium = CERT_COST_BENEFIT.find(c => c.scheme.startsWith(scheme))?.rentPremiumPct || 5;
    const roi = ((premium / 100) * (prop.noi_usd_mn || 10)) / estCost;
    const payback = estCost / ((premium / 100) * (prop.noi_usd_mn || 10)) || 0;
    const recommend = roi > 2.5 ? 'best' : roi > 1.0 ? 'consider' : 'not';
    return { scheme, org: s.org, color: s.color, achievable, estCostMn: estCost, premiumPct: premium, roi, payback, recommend };
  });
};

/* ───────────────────── PORTFOLIO LOAD ───────────────────── */
const LS_KEY = 'ra_re_portfolio_v1';
const PIPELINE_KEY = 'ra_cert_pipeline_v1';

function loadPortfolio() {
  try { const d = JSON.parse(localStorage.getItem(LS_KEY)); if (d && d.properties && d.properties.length >= 30) return d; } catch {}
  return null;
}

function loadPipeline() {
  try { return JSON.parse(localStorage.getItem(PIPELINE_KEY) || '[]'); } catch { return []; }
}

/* ───────────────────── HELPERS ───────────────────── */
const fmt = (n,d=0) => n == null ? '-' : Number(n).toLocaleString(undefined,{minimumFractionDigits:d,maximumFractionDigits:d});
const fmtPct = n => n == null ? '-' : `${Number(n).toFixed(1)}%`;
const fmtMn = n => n == null ? '-' : `$${Number(n).toFixed(1)}Mn`;
const PIE_COLORS = ['#16a34a','#1b3a5c','#2563eb','#0d9488','#d97706','#7c3aed','#f97316','#dc2626','#7ba67d','#eab308','#6b7280','#ec4899','#14b8a6','#06b6d4','#8b5cf6'];

const card = { background:T.surface, border:`1px solid ${T.border}`, borderRadius:10, padding:20, marginBottom:16 };
const thS = { padding:'8px 10px', textAlign:'left', fontSize:11, fontWeight:600, color:T.textSec, borderBottom:`2px solid ${T.border}`, whiteSpace:'nowrap' };
const tdS = { padding:'7px 10px', fontSize:12, color:T.text, borderBottom:`1px solid ${T.border}` };
const inputS = { width:'100%', padding:'6px 10px', border:`1px solid ${T.border}`, borderRadius:6, fontSize:12, fontFamily:T.font, color:T.text, background:T.surface, outline:'none', boxSizing:'border-box' };
const selectS = { ...inputS, cursor:'pointer' };
const labelS = { display:'block', fontSize:11, fontWeight:600, color:T.textSec, marginBottom:3 };
const btnPrimary = { padding:'7px 16px', background:T.navy, color:'#fff', border:'none', borderRadius:6, fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:T.font };
const btnSecondary = { padding:'7px 16px', background:'transparent', color:T.navy, border:`1px solid ${T.border}`, borderRadius:6, fontSize:12, fontWeight:500, cursor:'pointer', fontFamily:T.font };
const btnDanger = { padding:'5px 12px', background:T.red, color:'#fff', border:'none', borderRadius:6, fontSize:11, fontWeight:600, cursor:'pointer', fontFamily:T.font };
const badgeS = (bg, c) => ({ display:'inline-block', padding:'2px 8px', borderRadius:8, fontSize:11, fontWeight:600, background:bg, color:c });

const PIPELINE_STATUSES = ['Applied','Assessment Scheduled','Under Assessment','Awaiting Result','Certified'];

/* ───────────────────── MAIN COMPONENT ───────────────────── */
export default function GreenBuildingCertPage() {
  const navigate = useNavigate();
  const [portfolio, setPortfolio] = useState(() => loadPortfolio());
  const [pipeline, setPipeline] = useState(() => loadPipeline());
  const [activeTab, setActiveTab] = useState('overview');
  const [sortCol, setSortCol] = useState('id');
  const [sortDir, setSortDir] = useState('asc');
  const [expSortCol, setExpSortCol] = useState('expiry');
  const [expSortDir, setExpSortDir] = useState('asc');

  /* Cert CRUD state */
  const [editCertPropId, setEditCertPropId] = useState(null);
  const [editCertIdx, setEditCertIdx] = useState(null);
  const [certForm, setCertForm] = useState({ scheme:'LEED', level:'Gold', year:2026, expiry:2031, score:70, assessor:'' });
  const [showAddCert, setShowAddCert] = useState(false);
  const [deleteCertConfirm, setDeleteCertConfirm] = useState(null);

  /* Pipeline state */
  const [showAddPipeline, setShowAddPipeline] = useState(false);
  const [pipeForm, setPipeForm] = useState({ propId:'', scheme:'LEED', targetLevel:'Gold', status:'Applied', targetDate:2027, estimatedCost:0.5, notes:'' });

  /* Green Lease batch state */
  const [batchGreenLease, setBatchGreenLease] = useState(null);

  /* Targets state */
  const [targetPct, setTargetPct] = useState(80);
  const [targetYear, setTargetYear] = useState(2027);

  /* Scheme comparison selected property */
  const [compPropId, setCompPropId] = useState(null);

  /* Load portfolio fallback */
  useEffect(() => {
    if (!portfolio) {
      const poll = setInterval(() => {
        const p = loadPortfolio();
        if (p) { setPortfolio(p); clearInterval(poll); }
      }, 500);
      return () => clearInterval(poll);
    }
  }, [portfolio]);

  /* Persist portfolio changes */
  useEffect(() => {
    if (portfolio) localStorage.setItem(LS_KEY, JSON.stringify(portfolio));
  }, [portfolio]);

  /* Persist pipeline changes */
  useEffect(() => {
    localStorage.setItem(PIPELINE_KEY, JSON.stringify(pipeline));
  }, [pipeline]);

  const props = portfolio?.properties || [];

  const updateProperty = useCallback((propId, field, value) => {
    setPortfolio(prev => ({
      ...prev,
      properties: prev.properties.map(p => p.id === propId ? { ...p, [field]: value } : p)
    }));
  }, []);

  /* Certification CRUD */
  const addCertification = useCallback((propId) => {
    setPortfolio(prev => ({
      ...prev,
      properties: prev.properties.map(p => {
        if (p.id !== propId) return p;
        return { ...p, certifications: [...p.certifications, { ...certForm }] };
      })
    }));
    setShowAddCert(false);
    setCertForm({ scheme:'LEED', level:'Gold', year:2026, expiry:2031, score:70, assessor:'' });
  }, [certForm]);

  const updateCertification = useCallback((propId, idx, field, value) => {
    setPortfolio(prev => ({
      ...prev,
      properties: prev.properties.map(p => {
        if (p.id !== propId) return p;
        const certs = [...p.certifications];
        certs[idx] = { ...certs[idx], [field]: value };
        return { ...p, certifications: certs };
      })
    }));
  }, []);

  const removeCertification = useCallback((propId, idx) => {
    setPortfolio(prev => ({
      ...prev,
      properties: prev.properties.map(p => {
        if (p.id !== propId) return p;
        return { ...p, certifications: p.certifications.filter((_, i) => i !== idx) };
      })
    }));
    setDeleteCertConfirm(null);
  }, []);

  /* Pipeline CRUD */
  const addPipelineEntry = useCallback(() => {
    const entry = { ...pipeForm, id: 'PL' + Date.now().toString(36) };
    setPipeline(prev => [...prev, entry]);
    setShowAddPipeline(false);
    setPipeForm({ propId:'', scheme:'LEED', targetLevel:'Gold', status:'Applied', targetDate:2027, estimatedCost:0.5, notes:'' });
  }, [pipeForm]);

  const updatePipelineStatus = useCallback((id, newStatus) => {
    setPipeline(prev => prev.map(e => e.id === id ? { ...e, status: newStatus } : e));
  }, []);

  const removePipelineEntry = useCallback((id) => {
    setPipeline(prev => prev.filter(e => e.id !== id));
  }, []);

  /* Batch operations */
  const renewAllExpiring = useCallback(() => {
    const now = new Date('2026-03-25');
    setPortfolio(prev => ({
      ...prev,
      properties: prev.properties.map(p => ({
        ...p,
        certifications: p.certifications.map(c => {
          const exp = new Date(c.expiry + '-12-31');
          const diff = (exp - now) / (1000 * 60 * 60 * 24 * 365);
          if (diff <= 1 && diff > 0) return { ...c, expiry: c.expiry + 5 };
          return c;
        })
      }))
    }));
  }, []);

  const setAllGreenLease = useCallback((val) => {
    setPortfolio(prev => ({
      ...prev,
      properties: prev.properties.map(p => ({ ...p, green_lease_pct: val }))
    }));
    setBatchGreenLease(null);
  }, []);

  /* Computed data */
  const allCerts = useMemo(() => {
    const out = [];
    props.forEach(p => {
      p.certifications.forEach((c, idx) => {
        out.push({ ...c, propId: p.id, propName: p.name, type: p.type, city: p.city, country: p.country, gfa_m2: p.gfa_m2, gav_usd_mn: p.gav_usd_mn, noi_usd_mn: p.noi_usd_mn, rent_psf_usd: p.rent_psf_usd, occupancy_pct: p.occupancy_pct, wault_years: p.wault_years, certIdx: idx });
      });
    });
    return out;
  }, [props]);

  const certifiedProps = useMemo(() => props.filter(p => p.certifications.length > 0), [props]);
  const uncertifiedProps = useMemo(() => props.filter(p => p.certifications.length === 0), [props]);

  /* KPIs */
  const kpis = useMemo(() => {
    if (!props.length) return {};
    const certGFA = certifiedProps.reduce((s,p) => s+p.gfa_m2, 0);
    const totalGFA = props.reduce((s,p) => s+p.gfa_m2, 0);
    const certGAV = certifiedProps.reduce((s,p) => s+p.gav_usd_mn, 0);
    const totalGAV = props.reduce((s,p) => s+p.gav_usd_mn, 0);
    const schemes = new Set(); allCerts.forEach(c => schemes.add(c.scheme));
    const avgScore = allCerts.length > 0 ? allCerts.reduce((s,c) => s+c.score, 0) / allCerts.length : 0;
    const now = new Date('2026-03-25');
    const expiring12 = allCerts.filter(c => { const exp = new Date(c.expiry+'-12-31'); const diff = (exp - now)/(1000*60*60*24*365); return diff <= 1 && diff > 0; }).length;
    const expired = allCerts.filter(c => new Date(c.expiry+'-12-31') < now).length;
    const avgGreenLease = props.reduce((s,p) => s+p.green_lease_pct, 0) / props.length;
    const avgRent = certifiedProps.length > 0 ? certifiedProps.reduce((s,p) => s+p.rent_psf_usd, 0) / certifiedProps.length : 0;
    const avgRentUnc = uncertifiedProps.length > 0 ? uncertifiedProps.reduce((s,p) => s+p.rent_psf_usd, 0) / uncertifiedProps.length : 0;
    const greenPremium = avgRentUnc > 0 ? ((avgRent - avgRentUnc) / avgRentUnc * 100) : 0;
    return { certGFA, totalGFA, certGFAPct: totalGFA>0?certGFA/totalGFA*100:0, certGAV, totalGAV, certGAVPct: totalGAV>0?certGAV/totalGAV*100:0, schemes: schemes.size, avgScore, expiring12, expired, avgGreenLease, greenPremium, certCount: allCerts.length, certPropCount: certifiedProps.length, uncertPropCount: uncertifiedProps.length };
  }, [props, allCerts, certifiedProps, uncertifiedProps]);

  /* Coverage by scheme pie */
  const schemePie = useMemo(() => {
    const counts = {};
    allCerts.forEach(c => { counts[c.scheme] = (counts[c.scheme]||0)+1; });
    return Object.entries(counts).map(([scheme,count]) => ({ name:scheme, value:count, color: CERT_SCHEMES[scheme]?.color || '#666' }));
  }, [allCerts]);

  /* Coverage by level pie */
  const levelPie = useMemo(() => {
    const counts = {};
    allCerts.forEach(c => { const k = `${c.scheme} ${c.level}`; counts[k] = (counts[k]||0)+1; });
    return Object.entries(counts).map(([k,v]) => ({ name:k, value:v }));
  }, [allCerts]);

  /* Stacked bar by property type */
  const typeBar = useMemo(() => {
    const types = [...new Set(props.map(p => p.type))];
    return types.map(t => {
      const tProps = props.filter(p => p.type === t);
      return { type: t, certified: tProps.filter(p => p.certifications.length > 0).length, uncertified: tProps.filter(p => p.certifications.length === 0).length };
    });
  }, [props]);

  /* Expiry tracking */
  const expiryData = useMemo(() => {
    const dir = expSortDir === 'asc' ? 1 : -1;
    const d = [...allCerts];
    d.sort((a,b) => {
      const va = a[expSortCol], vb = b[expSortCol];
      if (typeof va === 'string') return va.localeCompare(vb) * dir;
      return ((va||0) - (vb||0)) * dir;
    });
    return d;
  }, [allCerts, expSortCol, expSortDir]);

  const toggleExpSort = col => { if (expSortCol === col) setExpSortDir(d => d==='asc'?'desc':'asc'); else { setExpSortCol(col); setExpSortDir('asc'); } };

  /* Scheme comparison for selected property */
  const schemeComparison = useMemo(() => {
    const p = props.find(p => p.id === compPropId) || props[0];
    if (!p) return [];
    return SCHEME_EVAL(p);
  }, [compPropId, props]);

  /* Target progress */
  const targetProgress = useMemo(() => {
    const totalGFA = props.reduce((s,p) => s+p.gfa_m2, 0);
    const certGFA = certifiedProps.reduce((s,p) => s+p.gfa_m2, 0);
    const currentPct = totalGFA > 0 ? (certGFA / totalGFA * 100) : 0;
    const gap = targetPct - currentPct;
    const needed = gap > 0 ? (gap / 100) * totalGFA : 0;
    const prioritized = [...uncertifiedProps].sort((a,b) => b.epc_score - a.epc_score).slice(0, 10);
    return { currentPct, gap: Math.max(0, gap), needed, prioritized };
  }, [props, certifiedProps, uncertifiedProps, targetPct]);

  /* Exports */
  const exportCSV = useCallback(() => {
    const headers = ['Property ID','Property Name','Type','City','Scheme','Level','Year','Expiry','Score'];
    const rows = allCerts.map(c => [c.propId,c.propName,c.type,c.city,c.scheme,c.level,c.year,c.expiry,c.score].join(','));
    const blob = new Blob([headers.join(',') + '\n' + rows.join('\n')], { type:'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'green_building_certifications.csv'; a.click();
  }, [allCerts]);

  const exportJSON = useCallback(() => {
    const blob = new Blob([JSON.stringify({ certifications: allCerts, pipeline }, null, 2)], { type:'application/json' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'green_cert_data.json'; a.click();
  }, [allCerts, pipeline]);

  const exportPDF = useCallback(() => { window.print(); }, []);

  const TABS = [
    { key:'overview', label:'Certification Overview' },
    { key:'addEdit', label:'Add/Edit Certifications' },
    { key:'pipeline', label:'Pipeline Tracker' },
    { key:'comparison', label:'Scheme Comparison' },
    { key:'targets', label:'Portfolio Targets' },
  ];

  const KpiCard = ({ title, value, sub, color }) => (
    <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:10, padding:'14px 16px', minWidth:130, flex:'1 1 130px' }}>
      <div style={{ fontSize:11, color:T.textSec, fontWeight:500, marginBottom:4 }}>{title}</div>
      <div style={{ fontSize:22, fontWeight:700, color: color || T.navy }}>{value}</div>
      {sub && <div style={{ fontSize:11, color:T.textMut, marginTop:2 }}>{sub}</div>}
    </div>
  );

  if (!portfolio) return <div style={{ padding:40, fontFamily:T.font, color:T.textSec }}>Loading portfolio data...</div>;

  /* ───────────────────── RENDER ───────────────────── */
  return (
    <div style={{ fontFamily:T.font, background:T.bg, minHeight:'100vh', padding:'24px 28px', color:T.text }}>
      {/* HEADER */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
        <div>
          <h1 style={{ fontSize:22, fontWeight:700, color:T.navy, margin:0 }}>EP-I2 Green Building Certification Tracker</h1>
          <p style={{ fontSize:12, color:T.textSec, margin:'4px 0 0' }}>{portfolio.portfolioName} | {certifiedProps.length} certified | {uncertifiedProps.length} uncertified | {allCerts.length} certificates</p>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <button style={btnSecondary} onClick={exportCSV}>Export CSV</button>
          <button style={btnSecondary} onClick={exportJSON}>Export JSON</button>
          <button style={btnSecondary} onClick={exportPDF}>Print / PDF</button>
          <button style={btnPrimary} onClick={() => navigate('/crrem')}>CRREM</button>
          <button style={btnPrimary} onClick={() => navigate('/stranded-assets')}>Stranded Assets</button>
          <button style={btnPrimary} onClick={() => navigate('/pipeline-dashboard')}>Pipeline</button>
        </div>
      </div>

      {/* TAB BAR */}
      <div style={{ display:'flex', gap:4, marginBottom:16, background:T.surface, border:`1px solid ${T.border}`, borderRadius:10, padding:4 }}>
        {TABS.map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key)}
            style={{ flex:1, padding:'8px 12px', border:'none', borderRadius:8, fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:T.font,
              background: activeTab === t.key ? T.navy : 'transparent', color: activeTab === t.key ? '#fff' : T.textSec }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ═══════ TAB: CERTIFICATION OVERVIEW ═══════ */}
      {activeTab === 'overview' && (
        <>
          {/* KPI ROW */}
          <div style={{ display:'flex', gap:10, marginBottom:16, flexWrap:'wrap' }}>
            <KpiCard title="GFA Certified" value={fmtPct(kpis.certGFAPct)} sub={`${fmt(kpis.certGFA)} / ${fmt(kpis.totalGFA)} m\u00b2`} color={kpis.certGFAPct >= 70 ? T.green : T.amber} />
            <KpiCard title="GAV Certified" value={fmtPct(kpis.certGAVPct)} sub={fmtMn(kpis.certGAV)} />
            <KpiCard title="Active Schemes" value={kpis.schemes} />
            <KpiCard title="Avg Cert Score" value={fmt(kpis.avgScore,0)} sub="across all certs" />
            <KpiCard title="Expiring <12mo" value={kpis.expiring12} color={kpis.expiring12 > 0 ? T.amber : T.green} />
            <KpiCard title="Expired" value={kpis.expired} color={kpis.expired > 0 ? T.red : T.green} />
            <KpiCard title="Green Premium" value={`+${(kpis.greenPremium||0).toFixed(1)}%`} sub="rent certified vs uncer." color={T.green} />
            <KpiCard title="Avg Green Lease" value={fmtPct(kpis.avgGreenLease)} />
            <KpiCard title="Total Certificates" value={kpis.certCount} sub={`${kpis.certPropCount} properties`} />
            <KpiCard title="Uncertified" value={kpis.uncertPropCount} color={kpis.uncertPropCount > 5 ? T.red : T.amber} />
          </div>

          {/* CHARTS ROW */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:16 }}>
            <div style={card}>
              <h3 style={{ fontSize:15, fontWeight:600, color:T.navy, marginBottom:12 }}>Coverage by Scheme</h3>
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={schemePie} cx="50%" cy="50%" outerRadius={95} dataKey="value" label={({ name, percent }) => `${name} ${(percent*100).toFixed(0)}%`} labelLine={{ stroke:T.textMut }} style={{ fontSize:11 }}>
                    {schemePie.map((d, i) => <Cell key={i} fill={d.color || PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ fontSize:11 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div style={card}>
              <h3 style={{ fontSize:15, fontWeight:600, color:T.navy, marginBottom:12 }}>Certified vs Uncertified by Type</h3>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={typeBar}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="type" tick={{ fontSize:10 }} />
                  <YAxis tick={{ fontSize:11 }} />
                  <Tooltip contentStyle={{ fontSize:11 }} />
                  <Legend wrapperStyle={{ fontSize:11 }} />
                  <Bar dataKey="certified" stackId="a" fill={T.green} name="Certified" radius={[0,0,0,0]} />
                  <Bar dataKey="uncertified" stackId="a" fill={T.red} name="Uncertified" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* EXPIRY TRACKING TABLE */}
          <div style={{ ...card, overflowX:'auto' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
              <h3 style={{ fontSize:15, fontWeight:600, color:T.navy, margin:0 }}>Certification Expiry Tracker</h3>
              <button style={btnSecondary} onClick={renewAllExpiring}>Renew All Expiring (&lt;12mo)</button>
            </div>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
              <thead>
                <tr>
                  {[{k:'propId',l:'ID'},{k:'propName',l:'Property'},{k:'type',l:'Type'},{k:'scheme',l:'Scheme'},{k:'level',l:'Level'},{k:'year',l:'Year'},{k:'expiry',l:'Expiry'},{k:'score',l:'Score'}].map(h => (
                    <th key={h.k} style={{ ...thS, cursor:'pointer' }} onClick={() => toggleExpSort(h.k)}>{h.l} {expSortCol===h.k ? (expSortDir==='asc'?'\u25b2':'\u25bc'):''}</th>
                  ))}
                  <th style={thS}>Status</th>
                </tr>
              </thead>
              <tbody>
                {expiryData.map((c,i) => {
                  const now = new Date('2026-03-25');
                  const exp = new Date(c.expiry+'-12-31');
                  const diff = (exp - now)/(1000*60*60*24*365);
                  const status = diff < 0 ? 'Expired' : diff <= 1 ? 'Expiring' : 'Active';
                  return (
                    <tr key={i} style={{ background: i%2===0 ? 'transparent' : T.surfaceH }}>
                      <td style={tdS}>{c.propId}</td>
                      <td style={{...tdS,fontWeight:500}}>{c.propName}</td>
                      <td style={tdS}>{c.type}</td>
                      <td style={tdS}><span style={badgeS(CERT_SCHEMES[c.scheme]?.color+'18',CERT_SCHEMES[c.scheme]?.color||T.navy)}>{c.scheme}</span></td>
                      <td style={tdS}>{c.level}</td>
                      <td style={{...tdS,textAlign:'right'}}>{c.year}</td>
                      <td style={{...tdS,textAlign:'right'}}>{c.expiry}</td>
                      <td style={{...tdS,textAlign:'right'}}>{c.score}</td>
                      <td style={tdS}>
                        <span style={badgeS(status==='Expired'?'#fef2f2':status==='Expiring'?'#fef3c7':'#f0fdf4', status==='Expired'?T.red:status==='Expiring'?T.amber:T.green)}>{status}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* COST-BENEFIT TABLE */}
          <div style={{ ...card, overflowX:'auto' }}>
            <h3 style={{ fontSize:15, fontWeight:600, color:T.navy, marginBottom:12 }}>Certification Cost-Benefit Analysis</h3>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
              <thead>
                <tr>
                  {['Scheme + Level','Est. Cost/m\u00b2','Rent Premium','Occupancy Uplift','Payback'].map(h => <th key={h} style={thS}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {CERT_COST_BENEFIT.map((r,i) => (
                  <tr key={i} style={{ background:i%2===0?'transparent':T.surfaceH }}>
                    <td style={{...tdS,fontWeight:500}}>{r.scheme}</td>
                    <td style={{...tdS,textAlign:'right'}}>${fmt(r.estCostPerM2)}</td>
                    <td style={{...tdS,textAlign:'right',color:T.green}}>+{r.rentPremiumPct}%</td>
                    <td style={{...tdS,textAlign:'right',color:T.green}}>+{r.occupancyUplift}%</td>
                    <td style={{...tdS,textAlign:'right'}}>{r.paybackYears} yr</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* REGIONAL REQUIREMENTS */}
          <div style={card}>
            <h3 style={{ fontSize:15, fontWeight:600, color:T.navy, marginBottom:12 }}>Regional Certification Requirements</h3>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
              <thead>
                <tr>
                  {['Jurisdiction','Mandatory Requirements','Recommended Certification','Notes'].map(h => <th key={h} style={thS}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {REGIONAL_REQUIREMENTS.map((r,i) => (
                  <tr key={i} style={{ background:i%2===0?'transparent':T.surfaceH }}>
                    <td style={{...tdS,fontWeight:500}}>{r.jurisdiction}</td>
                    <td style={tdS}>{r.mandatory}</td>
                    <td style={tdS}><span style={badgeS('#dbeafe',T.navyL)}>{r.recommended}</span></td>
                    <td style={{...tdS,color:T.textSec,fontSize:11}}>{r.notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ═══════ TAB: ADD/EDIT CERTIFICATIONS ═══════ */}
      {activeTab === 'addEdit' && (
        <>
          <div style={{ display:'flex', gap:8, marginBottom:16, flexWrap:'wrap', alignItems:'center' }}>
            <button style={btnSecondary} onClick={renewAllExpiring}>Renew All Expiring</button>
            <button style={btnSecondary} onClick={() => setBatchGreenLease(50)}>Set All Green Lease %</button>
            {batchGreenLease !== null && (
              <div style={{ display:'flex', gap:8, alignItems:'center', padding:'6px 12px', background:T.surface, border:`1px solid ${T.border}`, borderRadius:8 }}>
                <input type="range" min={0} max={100} value={batchGreenLease} onChange={e => setBatchGreenLease(Number(e.target.value))} style={{ width:120, accentColor:T.navy }} />
                <span style={{ fontSize:12, fontWeight:600 }}>{batchGreenLease}%</span>
                <button style={btnPrimary} onClick={() => setAllGreenLease(batchGreenLease)}>Apply</button>
                <button style={btnSecondary} onClick={() => setBatchGreenLease(null)}>Cancel</button>
              </div>
            )}
          </div>

          {props.map(p => (
            <div key={p.id} style={{ ...card, marginBottom:12 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
                <div>
                  <span style={{ fontSize:14, fontWeight:600, color:T.navy }}>{p.id} - {p.name}</span>
                  <span style={{ fontSize:12, color:T.textSec, marginLeft:8 }}>{p.type} | {p.city}</span>
                </div>
                <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:4 }}>
                    <label style={{ fontSize:11, color:T.textSec }}>Green Lease:</label>
                    <input type="range" min={0} max={100} value={p.green_lease_pct} style={{ width:80, accentColor:T.green }}
                      onChange={e => updateProperty(p.id, 'green_lease_pct', Number(e.target.value))} />
                    <span style={{ fontSize:11, fontWeight:600 }}>{p.green_lease_pct}%</span>
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:4 }}>
                    <label style={{ fontSize:11, color:T.textSec }}>Tenant Score:</label>
                    <input type="number" min={1} max={10} step={0.1} value={p.tenant_satisfaction_score} style={{ ...inputS, width:60 }}
                      onChange={e => updateProperty(p.id, 'tenant_satisfaction_score', Number(e.target.value))} />
                  </div>
                  <button style={{ ...btnPrimary, fontSize:11 }} onClick={() => { setEditCertPropId(p.id); setShowAddCert(true); }}>+ Add Cert</button>
                </div>
              </div>
              {p.certifications.length === 0 ? (
                <div style={{ padding:12, background:T.surfaceH, borderRadius:8, fontSize:12, color:T.textMut, textAlign:'center' }}>No certifications -- click "+ Add Cert" to add one</div>
              ) : (
                <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
                  <thead>
                    <tr>
                      {['Scheme','Level','Year','Expiry','Score','Assessor','Actions'].map(h => <th key={h} style={thS}>{h}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {p.certifications.map((c, idx) => (
                      <tr key={idx} style={{ background: idx%2===0 ? 'transparent' : T.surfaceH }}>
                        <td style={tdS}>
                          <select style={{ ...selectS, width:110 }} value={c.scheme} onChange={e => updateCertification(p.id, idx, 'scheme', e.target.value)}>
                            {ALL_SCHEME_NAMES.map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                        </td>
                        <td style={tdS}>
                          <select style={{ ...selectS, width:110 }} value={c.level} onChange={e => updateCertification(p.id, idx, 'level', e.target.value)}>
                            {(CERT_SCHEMES[c.scheme]?.levels || ['N/A']).map(l => <option key={l} value={l}>{l}</option>)}
                          </select>
                        </td>
                        <td style={tdS}><input type="number" style={{ ...inputS, width:65 }} value={c.year} onChange={e => updateCertification(p.id, idx, 'year', Number(e.target.value))} /></td>
                        <td style={tdS}><input type="number" style={{ ...inputS, width:65 }} value={c.expiry} onChange={e => updateCertification(p.id, idx, 'expiry', Number(e.target.value))} /></td>
                        <td style={tdS}><input type="number" min={0} max={100} style={{ ...inputS, width:55 }} value={c.score} onChange={e => updateCertification(p.id, idx, 'score', Number(e.target.value))} /></td>
                        <td style={tdS}><input type="text" style={{ ...inputS, width:100 }} value={c.assessor || ''} onChange={e => updateCertification(p.id, idx, 'assessor', e.target.value)} /></td>
                        <td style={tdS}>
                          <button style={{ ...btnDanger, fontSize:10, padding:'3px 8px' }} onClick={() => setDeleteCertConfirm({ propId: p.id, idx })}>Remove</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          ))}
        </>
      )}

      {/* ═══════ TAB: PIPELINE TRACKER ═══════ */}
      {activeTab === 'pipeline' && (
        <>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
            <h3 style={{ fontSize:16, fontWeight:600, color:T.navy, margin:0 }}>Certification Pipeline ({pipeline.length} entries)</h3>
            <button style={btnPrimary} onClick={() => setShowAddPipeline(true)}>+ Add Pipeline Entry</button>
          </div>

          {/* KANBAN BOARD */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(5, 1fr)', gap:12, marginBottom:20 }}>
            {PIPELINE_STATUSES.map(status => (
              <div key={status} style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:10, padding:12, minHeight:200 }}>
                <div style={{ fontSize:12, fontWeight:700, color:T.navy, marginBottom:10, paddingBottom:6, borderBottom:`2px solid ${status === 'Certified' ? T.green : T.border}` }}>
                  {status} ({pipeline.filter(e => e.status === status).length})
                </div>
                {pipeline.filter(e => e.status === status).map(entry => {
                  const prop = props.find(p => p.id === entry.propId);
                  return (
                    <div key={entry.id} style={{ background:T.surfaceH, borderRadius:8, padding:10, marginBottom:8, border:`1px solid ${T.border}` }}>
                      <div style={{ fontSize:12, fontWeight:600, color:T.navy, marginBottom:4 }}>{prop?.name || entry.propId}</div>
                      <div style={{ fontSize:11, color:T.textSec }}>{entry.scheme} - {entry.targetLevel}</div>
                      <div style={{ fontSize:11, color:T.textMut, marginTop:2 }}>Target: {entry.targetDate} | ${entry.estimatedCost}Mn</div>
                      {entry.notes && <div style={{ fontSize:10, color:T.textMut, marginTop:2, fontStyle:'italic' }}>{entry.notes}</div>}
                      <div style={{ display:'flex', gap:4, marginTop:6, flexWrap:'wrap' }}>
                        {PIPELINE_STATUSES.filter(s => s !== status).map(s => (
                          <button key={s} style={{ ...btnSecondary, fontSize:9, padding:'2px 6px' }} onClick={() => updatePipelineStatus(entry.id, s)}>{s.split(' ')[0]}</button>
                        ))}
                        <button style={{ ...btnDanger, fontSize:9, padding:'2px 6px' }} onClick={() => removePipelineEntry(entry.id)}>Del</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Pipeline summary table */}
          <div style={{ ...card, overflowX:'auto' }}>
            <h3 style={{ fontSize:14, fontWeight:600, color:T.navy, marginBottom:12 }}>Pipeline Summary</h3>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
              <thead>
                <tr>
                  {['Property','Scheme','Target Level','Status','Target Date','Est. Cost','Notes'].map(h => <th key={h} style={thS}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {pipeline.map((e,i) => {
                  const prop = props.find(p => p.id === e.propId);
                  return (
                    <tr key={e.id} style={{ background:i%2===0?'transparent':T.surfaceH }}>
                      <td style={{...tdS,fontWeight:500}}>{prop?.name || e.propId}</td>
                      <td style={tdS}>{e.scheme}</td>
                      <td style={tdS}>{e.targetLevel}</td>
                      <td style={tdS}><span style={badgeS(e.status==='Certified'?'#f0fdf4':'#dbeafe',e.status==='Certified'?T.green:T.navyL)}>{e.status}</span></td>
                      <td style={{...tdS,textAlign:'right'}}>{e.targetDate}</td>
                      <td style={{...tdS,textAlign:'right'}}>${e.estimatedCost}Mn</td>
                      <td style={{...tdS,color:T.textSec,fontSize:11}}>{e.notes}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ═══════ TAB: SCHEME COMPARISON ═══════ */}
      {activeTab === 'comparison' && (
        <>
          <div style={{ marginBottom:16 }}>
            <label style={labelS}>Select Property for Comparison</label>
            <select style={{ ...selectS, width:300 }} value={compPropId || props[0]?.id || ''} onChange={e => setCompPropId(e.target.value)}>
              {props.map(p => <option key={p.id} value={p.id}>{p.id} - {p.name} ({p.type})</option>)}
            </select>
          </div>

          <div style={{ ...card, overflowX:'auto' }}>
            <h3 style={{ fontSize:15, fontWeight:600, color:T.navy, marginBottom:12 }}>Certification Scheme Comparison - {props.find(p => p.id === (compPropId || props[0]?.id))?.name}</h3>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
              <thead>
                <tr>
                  {['Scheme','Org','Achievable Level','Est. Cost $Mn','Rent Premium','ROI','Payback Yr','Recommendation'].map(h => <th key={h} style={thS}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {schemeComparison.map((s,i) => (
                  <tr key={s.scheme} style={{ background:i%2===0?'transparent':T.surfaceH }}>
                    <td style={{...tdS,fontWeight:600}}>
                      <span style={{ display:'inline-block', width:8, height:8, borderRadius:4, background:s.color, marginRight:6 }}></span>
                      {s.scheme}
                    </td>
                    <td style={{...tdS,color:T.textSec,fontSize:11}}>{s.org}</td>
                    <td style={tdS}><span style={badgeS(s.color+'18',s.color)}>{s.achievable}</span></td>
                    <td style={{...tdS,textAlign:'right'}}>{s.estCostMn.toFixed(2)}</td>
                    <td style={{...tdS,textAlign:'right',color:T.green}}>+{s.premiumPct}%</td>
                    <td style={{...tdS,textAlign:'right',fontWeight:600}}>{s.roi.toFixed(1)}x</td>
                    <td style={{...tdS,textAlign:'right'}}>{s.payback.toFixed(1)} yr</td>
                    <td style={tdS}>
                      {s.recommend === 'best' && <span style={badgeS('#f0fdf4',T.green)}>{'★'} Best Value</span>}
                      {s.recommend === 'consider' && <span style={badgeS('#fef3c7',T.amber)}>{'☆'} Consider</span>}
                      {s.recommend === 'not' && <span style={badgeS('#fef2f2',T.red)}>{'○'} Not Recommended</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ═══════ TAB: PORTFOLIO TARGETS ═══════ */}
      {activeTab === 'targets' && (
        <>
          <div style={card}>
            <h3 style={{ fontSize:15, fontWeight:600, color:T.navy, marginBottom:12 }}>Portfolio Certification Target</h3>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
              <div>
                <label style={labelS}>Target % GFA Certified</label>
                <input type="range" min={0} max={100} value={targetPct} onChange={e => setTargetPct(Number(e.target.value))} style={{ width:'100%', accentColor:T.navy }} />
                <div style={{ fontSize:14, fontWeight:700, color:T.navy, marginTop:4 }}>{targetPct}%</div>
              </div>
              <div>
                <label style={labelS}>Target Year</label>
                <select style={selectS} value={targetYear} onChange={e => setTargetYear(Number(e.target.value))}>
                  {[2026,2027,2028,2029,2030].map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
            </div>

            {/* Progress bar */}
            <div style={{ marginTop:16 }}>
              <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, marginBottom:4 }}>
                <span>Current: {targetProgress.currentPct.toFixed(1)}%</span>
                <span>Target: {targetPct}% by {targetYear}</span>
              </div>
              <div style={{ width:'100%', height:24, background:T.surfaceH, borderRadius:12, overflow:'hidden', position:'relative' }}>
                <div style={{ width:`${Math.min(100, targetProgress.currentPct)}%`, height:'100%', background:T.green, borderRadius:12, transition:'width 0.3s' }}></div>
                <div style={{ position:'absolute', left:`${targetPct}%`, top:0, bottom:0, width:2, background:T.navy }}></div>
              </div>
              <div style={{ display:'flex', gap:16, marginTop:12 }}>
                <div style={{ padding:10, background:T.surfaceH, borderRadius:8, flex:1 }}>
                  <div style={{ fontSize:11, color:T.textSec }}>Gap to Target</div>
                  <div style={{ fontSize:18, fontWeight:700, color: targetProgress.gap > 0 ? T.amber : T.green }}>{targetProgress.gap.toFixed(1)}%</div>
                </div>
                <div style={{ padding:10, background:T.surfaceH, borderRadius:8, flex:1 }}>
                  <div style={{ fontSize:11, color:T.textSec }}>GFA Needed</div>
                  <div style={{ fontSize:18, fontWeight:700, color:T.navy }}>{fmt(targetProgress.needed)} m\u00b2</div>
                </div>
              </div>
            </div>
          </div>

          {/* Priority uncertified properties */}
          <div style={card}>
            <h3 style={{ fontSize:15, fontWeight:600, color:T.navy, marginBottom:12 }}>Priority Uncertified Properties (by achievability)</h3>
            <p style={{ fontSize:12, color:T.textSec, marginBottom:12 }}>Properties ranked by EPC score (higher = easier to certify)</p>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
              <thead>
                <tr>
                  {['Rank','ID','Name','Type','City','GFA m\u00b2','EPC','Energy kWh/m\u00b2','Carbon kgCO\u2082/m\u00b2','Recommended Action'].map(h => <th key={h} style={thS}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {targetProgress.prioritized.map((p,i) => (
                  <tr key={p.id} style={{ background:i%2===0?'transparent':T.surfaceH }}>
                    <td style={{...tdS,fontWeight:700,color:i<3?T.green:T.textSec}}>{i+1}</td>
                    <td style={tdS}>{p.id}</td>
                    <td style={{...tdS,fontWeight:500}}>{p.name}</td>
                    <td style={tdS}>{p.type}</td>
                    <td style={tdS}>{p.city}</td>
                    <td style={{...tdS,textAlign:'right'}}>{fmt(p.gfa_m2)}</td>
                    <td style={tdS}><span style={badgeS(p.epc_rating<='B'?'#dcfce7':'#fef3c7',p.epc_rating<='B'?T.green:T.amber)}>{p.epc_rating} ({p.epc_score})</span></td>
                    <td style={{...tdS,textAlign:'right'}}>{p.energy_intensity_kwh}</td>
                    <td style={{...tdS,textAlign:'right'}}>{p.carbon_intensity_kgco2}</td>
                    <td style={{...tdS,fontSize:11}}>
                      {p.epc_score >= 70 ? 'Ready for LEED/BREEAM' : p.epc_score >= 50 ? 'Minor upgrades then certify' : 'Major retrofit needed first'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ═══════ MODALS ═══════ */}
      {/* ADD CERTIFICATION MODAL */}
      {showAddCert && editCertPropId && (
        <div style={{ position:'fixed', top:0, left:0, right:0, bottom:0, background:'rgba(0,0,0,0.4)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center' }}
          onClick={() => setShowAddCert(false)}>
          <div style={{ background:T.surface, borderRadius:12, padding:24, width:420 }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize:16, fontWeight:700, color:T.navy, marginBottom:16 }}>Add Certification to {props.find(p=>p.id===editCertPropId)?.name}</h3>
            <div style={{ marginBottom:10 }}>
              <label style={labelS}>Scheme</label>
              <select style={selectS} value={certForm.scheme} onChange={e => { setCertForm(prev => ({ ...prev, scheme: e.target.value, level: CERT_SCHEMES[e.target.value]?.levels[0] || '' })); }}>
                {ALL_SCHEME_NAMES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div style={{ marginBottom:10 }}>
              <label style={labelS}>Level</label>
              <select style={selectS} value={certForm.level} onChange={e => setCertForm(prev => ({ ...prev, level: e.target.value }))}>
                {(CERT_SCHEMES[certForm.scheme]?.levels || []).map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:10 }}>
              <div>
                <label style={labelS}>Year Obtained</label>
                <input type="number" style={inputS} value={certForm.year} onChange={e => setCertForm(prev => ({ ...prev, year: Number(e.target.value) }))} />
              </div>
              <div>
                <label style={labelS}>Expiry Year</label>
                <input type="number" style={inputS} value={certForm.expiry} onChange={e => setCertForm(prev => ({ ...prev, expiry: Number(e.target.value) }))} />
              </div>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:10 }}>
              <div>
                <label style={labelS}>Score (0-100)</label>
                <input type="number" min={0} max={100} style={inputS} value={certForm.score} onChange={e => setCertForm(prev => ({ ...prev, score: Number(e.target.value) }))} />
              </div>
              <div>
                <label style={labelS}>Assessor</label>
                <input type="text" style={inputS} value={certForm.assessor} onChange={e => setCertForm(prev => ({ ...prev, assessor: e.target.value }))} />
              </div>
            </div>
            <div style={{ display:'flex', gap:8, marginTop:16 }}>
              <button style={btnPrimary} onClick={() => addCertification(editCertPropId)}>Add Certification</button>
              <button style={btnSecondary} onClick={() => setShowAddCert(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CERT CONFIRMATION MODAL */}
      {deleteCertConfirm && (
        <div style={{ position:'fixed', top:0, left:0, right:0, bottom:0, background:'rgba(0,0,0,0.4)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center' }}
          onClick={() => setDeleteCertConfirm(null)}>
          <div style={{ background:T.surface, borderRadius:12, padding:24, width:360 }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize:16, fontWeight:700, color:T.red, marginBottom:12 }}>Remove Certification?</h3>
            <p style={{ fontSize:13, color:T.textSec, marginBottom:16 }}>This will remove the certification from the property. This cannot be undone.</p>
            <div style={{ display:'flex', gap:8 }}>
              <button style={btnDanger} onClick={() => removeCertification(deleteCertConfirm.propId, deleteCertConfirm.idx)}>Remove</button>
              <button style={btnSecondary} onClick={() => setDeleteCertConfirm(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* ADD PIPELINE ENTRY MODAL */}
      {showAddPipeline && (
        <div style={{ position:'fixed', top:0, left:0, right:0, bottom:0, background:'rgba(0,0,0,0.4)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center' }}
          onClick={() => setShowAddPipeline(false)}>
          <div style={{ background:T.surface, borderRadius:12, padding:24, width:450 }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize:16, fontWeight:700, color:T.navy, marginBottom:16 }}>Add Pipeline Entry</h3>
            <div style={{ marginBottom:10 }}>
              <label style={labelS}>Property</label>
              <select style={selectS} value={pipeForm.propId} onChange={e => setPipeForm(prev => ({ ...prev, propId: e.target.value }))}>
                <option value="">Select property...</option>
                {props.map(p => <option key={p.id} value={p.id}>{p.id} - {p.name}</option>)}
              </select>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:10 }}>
              <div>
                <label style={labelS}>Scheme</label>
                <select style={selectS} value={pipeForm.scheme} onChange={e => setPipeForm(prev => ({ ...prev, scheme: e.target.value, targetLevel: CERT_SCHEMES[e.target.value]?.levels[0] || '' }))}>
                  {ALL_SCHEME_NAMES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label style={labelS}>Target Level</label>
                <select style={selectS} value={pipeForm.targetLevel} onChange={e => setPipeForm(prev => ({ ...prev, targetLevel: e.target.value }))}>
                  {(CERT_SCHEMES[pipeForm.scheme]?.levels || []).map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
            </div>
            <div style={{ marginBottom:10 }}>
              <label style={labelS}>Status</label>
              <select style={selectS} value={pipeForm.status} onChange={e => setPipeForm(prev => ({ ...prev, status: e.target.value }))}>
                {PIPELINE_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:10 }}>
              <div>
                <label style={labelS}>Target Year</label>
                <input type="number" style={inputS} value={pipeForm.targetDate} onChange={e => setPipeForm(prev => ({ ...prev, targetDate: Number(e.target.value) }))} />
              </div>
              <div>
                <label style={labelS}>Estimated Cost $Mn</label>
                <input type="number" step={0.1} min={0} style={inputS} value={pipeForm.estimatedCost} onChange={e => setPipeForm(prev => ({ ...prev, estimatedCost: Number(e.target.value) }))} />
              </div>
            </div>
            <div style={{ marginBottom:10 }}>
              <label style={labelS}>Notes</label>
              <input type="text" style={inputS} value={pipeForm.notes} onChange={e => setPipeForm(prev => ({ ...prev, notes: e.target.value }))} />
            </div>
            <div style={{ display:'flex', gap:8, marginTop:16 }}>
              <button style={btnPrimary} onClick={addPipelineEntry} disabled={!pipeForm.propId}>Add to Pipeline</button>
              <button style={btnSecondary} onClick={() => setShowAddPipeline(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* FOOTER */}
      <div style={{ marginTop:24, padding:16, background:T.surface, border:`1px solid ${T.border}`, borderRadius:10, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <span style={{ fontSize:11, color:T.textMut }}>Green Building Certification Tracker v6.0 | {portfolio.portfolioName} | {portfolio.lastUpdated}</span>
        <span style={{ fontSize:11, color:T.textMut }}>{certifiedProps.length} certified | {uncertifiedProps.length} uncertified | {allCerts.length} certificates | {pipeline.length} pipeline</span>
      </div>
    </div>
  );
}
