import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, Cell,
  PieChart, Pie, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  LineChart, Line, AreaChart, Area,
} from 'recharts';
import { GLOBAL_COMPANY_MASTER } from '../../../data/globalCompanyMaster';

/* =================================================================
   THEME
   ================================================================= */
const T = { bg:'#f6f4f0', surface:'#ffffff', surfaceH:'#f0ede7', border:'#e5e0d8', borderL:'#d5cfc5', navy:'#1b3a5c', navyL:'#2c5a8c', gold:'#c5a96a', goldL:'#d4be8a', sage:'#5a8a6a', sageL:'#7ba67d', text:'#1b3a5c', textSec:'#5c6b7e', textMut:'#9aa3ae', red:'#dc2626', green:'#16a34a', amber:'#d97706', font:"'Inter','SF Pro Display',system-ui,-apple-system,sans-serif" };
const PIE_COLORS = ['#16a34a','#2563eb','#d97706','#f97316','#dc2626','#7c3aed','#0d9488','#1b3a5c','#c5a96a','#5a8a6a'];

/* =================================================================
   IMP 5 DIMENSIONS
   ================================================================= */
const IMP_DIMENSIONS = [
  { id:'what', name:'WHAT \u2014 Impact Outcomes', description:'What outcomes does the enterprise cause?', assessment:['Outcome importance','Outcome depth','Positive vs negative'], weight:25 },
  { id:'who', name:'WHO \u2014 Stakeholders', description:'Who experiences the outcomes?', assessment:['Underserved demographics','Geographic context','Vulnerability level'], weight:20 },
  { id:'how_much', name:'HOW MUCH \u2014 Scale, Depth, Duration', description:'How significant is the impact?', assessment:['Number of beneficiaries','Degree of change','Duration of impact'], weight:25 },
  { id:'contribution', name:'CONTRIBUTION \u2014 Additionality', description:'What is the enterprise\'s contribution?', assessment:['Financial additionality','Counterfactual','Catalytic effect'], weight:15 },
  { id:'risk', name:'RISK \u2014 Impact Risk', description:'What is the risk to impact?', assessment:['Execution risk','External factors','Stakeholder risk','Evidence quality'], weight:15 },
];

/* =================================================================
   EVIDENCE QUALITY TIERS
   ================================================================= */
const EVIDENCE_TIERS = [
  { tier:1, name:'Randomized Control Trial', quality:'Gold Standard', description:'Impact measured via RCT with control group', confidence:95, color:'#16a34a', examples:['J-PAL studies','Medical trials','Development impact evaluations'] },
  { tier:2, name:'Quasi-Experimental', quality:'High', description:'Natural experiment, difference-in-differences, propensity score matching', confidence:85, color:'#2563eb', examples:['Before/after with comparison group','Regression discontinuity'] },
  { tier:3, name:'Theory of Change + Data', quality:'Moderate', description:'Clear causal pathway with supporting quantitative data', confidence:70, color:'#d97706', examples:['Most corporate impact reporting','SDG bond impact reports'] },
  { tier:4, name:'Self-Reported', quality:'Low', description:'Company-reported impact without independent verification', confidence:50, color:'#f97316', examples:['Sustainability report claims','Unverified CSR data'] },
  { tier:5, name:'Anecdotal/Estimated', quality:'Very Low', description:'Case studies, testimonials, or proxy estimates', confidence:30, color:'#dc2626', examples:['Press releases','Marketing claims','Sector averages'] },
];

/* =================================================================
   IMPACT WASHING FLAGS
   ================================================================= */
const IMPACT_WASHING_FLAGS = [
  { id:'IW01', flag:'Vague impact claims without metrics', severity:'High' },
  { id:'IW02', flag:'No independent verification', severity:'Medium' },
  { id:'IW03', flag:'Impact claims disproportionate to investment size', severity:'High' },
  { id:'IW04', flag:'Cherry-picked positive impacts, ignoring negative', severity:'High' },
  { id:'IW05', flag:'Conflating outputs with outcomes', severity:'Medium' },
  { id:'IW06', flag:'No theory of change documented', severity:'Medium' },
  { id:'IW07', flag:'Additionality not demonstrated', severity:'High' },
  { id:'IW08', flag:'SDG-washing (claimed SDG alignment without evidence)', severity:'High' },
];

const VERIFIERS = [
  { name:'DNV', specialty:'Environmental & Climate', credibility:95, region:'Global', avgCost:85, turnaround:'6-8 wk' },
  { name:'Sustainalytics', specialty:'ESG & Impact', credibility:92, region:'Global', avgCost:65, turnaround:'4-6 wk' },
  { name:'CICERO', specialty:'Green Bonds / Climate', credibility:94, region:'Europe', avgCost:70, turnaround:'4-6 wk' },
  { name:'KPMG', specialty:'Full Assurance', credibility:96, region:'Global', avgCost:150, turnaround:'8-12 wk' },
  { name:'EY', specialty:'Sustainability Reporting', credibility:95, region:'Global', avgCost:140, turnaround:'8-10 wk' },
  { name:'PwC', specialty:'Impact Audit', credibility:96, region:'Global', avgCost:160, turnaround:'8-12 wk' },
  { name:'Bureau Veritas', specialty:'Social & Labour', credibility:90, region:'Global', avgCost:55, turnaround:'4-6 wk' },
  { name:'ISS ESG', specialty:'ESG Ratings Validation', credibility:88, region:'Global', avgCost:50, turnaround:'3-5 wk' },
];

const TOC_STAGES = ['Inputs','Activities','Outputs','Outcomes','Impact'];

const SDGS_17 = Array.from({length:17},(_,i)=>({ id:i+1, name:['No Poverty','Zero Hunger','Good Health','Quality Education','Gender Equality','Clean Water','Affordable Energy','Decent Work','Industry & Innovation','Reduced Inequalities','Sustainable Cities','Responsible Consumption','Climate Action','Life Below Water','Life on Land','Peace & Justice','Partnerships'][i] }));

/* =================================================================
   HELPERS
   ================================================================= */
const LS_PORT = 'ra_portfolio_v1';
const LS_VERIFY = 'ra_impact_verification_v1';
const loadLS = (k) => { try { return JSON.parse(localStorage.getItem(k)) || null; } catch { return null; } };
const saveLS = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };
const seed = (s) => { let x = Math.sin(s * 9973 + 7) * 10000; return x - Math.floor(x); };
const fmt = (n, d=1) => n == null ? '\u2014' : Number(n).toFixed(d);
const pct = (n) => n == null ? '\u2014' : `${Math.round(n)}%`;

const enrichHolding = (c, i) => {
  const s = i + 1;
  const evidenceTier = Math.min(5, Math.max(1, Math.ceil(seed(s * 11) * 5)));
  const tierObj = EVIDENCE_TIERS.find(t => t.tier === evidenceTier);
  const impDims = {};
  IMP_DIMENSIONS.forEach(d => { impDims[d.id] = Math.round(30 + seed(s * 17 + d.weight) * 65); });
  const impScore = Math.round(IMP_DIMENSIONS.reduce((acc, d) => acc + impDims[d.id] * d.weight, 0) / 100);
  const verifiedImpactMn = Math.round(seed(s * 23) * 80 + 5);
  const hasToC = seed(s * 29) > 0.35;
  const additionalityProven = seed(s * 31) > 0.45;
  const sdgsClaimed = Math.ceil(seed(s * 37) * 5);
  const sdgsVerified = Math.floor(sdgsClaimed * (0.3 + seed(s * 41) * 0.6));
  const flags = [];
  if (evidenceTier >= 4 && seed(s * 43) > 0.3) flags.push('IW02');
  if (!hasToC) flags.push('IW06');
  if (!additionalityProven) flags.push('IW07');
  if (seed(s * 47) > 0.7) flags.push('IW01');
  if (sdgsClaimed > sdgsVerified + 2) flags.push('IW08');
  if (seed(s * 51) > 0.8) flags.push('IW04');
  if (seed(s * 53) > 0.85) flags.push('IW03');
  if (seed(s * 55) > 0.75) flags.push('IW05');
  const verificationStatus = seed(s * 59) > 0.7 ? 'Fully Verified' : seed(s * 61) > 0.45 ? 'Partially Verified' : seed(s * 63) > 0.3 ? 'Under Review' : 'Unverified';
  const beneficiaries = Math.round(seed(s * 67) * 50000 + 1000);
  const tocData = TOC_STAGES.map(st => ({ stage: st, strength: Math.round(40 + seed(s * 71 + st.length) * 55) }));
  const counterfactual = Math.round(seed(s * 73) * 60 + 10);
  const costOfVerification = Math.round(seed(s * 79) * 120 + 20);
  const credibilityPremium = Math.round(costOfVerification * (0.8 + seed(s * 83) * 2.5));
  return {
    ...c,
    company_name: c.company_name || c.company || `Company ${i+1}`,
    sector: c.sector || 'Diversified',
    weight: c.weight || 1,
    evidenceTier, tierObj, impDims, impScore, verifiedImpactMn, hasToC, additionalityProven,
    sdgsClaimed, sdgsVerified, flags, verificationStatus, beneficiaries, tocData,
    counterfactual, costOfVerification, credibilityPremium,
  };
};

/* =================================================================
   UI COMPONENTS
   ================================================================= */
const KPI = ({ label, value, sub, accent }) => (
  <div style={{ background:T.surface, border:`1px solid ${accent||T.border}`, borderRadius:10, padding:'14px 18px', borderTop:`3px solid ${accent||T.gold}` }}>
    <div style={{ fontSize:11, color:T.textMut, fontWeight:600, letterSpacing:0.5, textTransform:'uppercase', marginBottom:4, fontFamily:T.font }}>{label}</div>
    <div style={{ fontSize:22, fontWeight:700, color:T.navy, fontFamily:T.font }}>{value}</div>
    {sub && <div style={{ fontSize:11, color:T.textSec, marginTop:2 }}>{sub}</div>}
  </div>
);

const Btn = ({ children, onClick, active, small, style:sx }) => (
  <button onClick={onClick} style={{ padding:small?'5px 12px':'8px 18px', borderRadius:8, border:`1px solid ${active?T.navy:T.border}`, background:active?T.navy:T.surface, color:active?'#fff':T.text, fontWeight:600, fontSize:small?12:13, cursor:'pointer', fontFamily:T.font, transition:'all .15s', ...sx }}>{children}</button>
);

const Section = ({ title, children, badge }) => (
  <div style={{ marginBottom:28 }}>
    <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14, paddingBottom:8, borderBottom:`2px solid ${T.gold}` }}>
      <span style={{ fontSize:16, fontWeight:700, color:T.navy, fontFamily:T.font }}>{title}</span>
      {badge && <span style={{ fontSize:11, padding:'2px 10px', borderRadius:20, background:T.gold+'22', color:T.gold, fontWeight:700, fontFamily:T.font }}>{badge}</span>}
    </div>
    {children}
  </div>
);

const SevBadge = ({ sev }) => {
  const c = sev === 'High' ? { bg:'#fee2e2',t:'#991b1b' } : sev === 'Medium' ? { bg:'#fef3c7',t:'#92400e' } : { bg:'#d1fae5',t:'#065f46' };
  return <span style={{ padding:'2px 8px', borderRadius:10, fontSize:11, fontWeight:700, background:c.bg, color:c.t }}>{sev}</span>;
};

const StatusBadge = ({ status }) => {
  const m = { 'Fully Verified':{bg:'#d1fae5',t:'#065f46'}, 'Partially Verified':{bg:'#dbeafe',t:'#1e40af'}, 'Under Review':{bg:'#fef3c7',t:'#92400e'}, 'Unverified':{bg:'#fee2e2',t:'#991b1b'} };
  const c = m[status] || m['Unverified'];
  return <span style={{ padding:'2px 9px', borderRadius:10, fontSize:11, fontWeight:700, background:c.bg, color:c.t }}>{status}</span>;
};

const ThCell = ({ label, col, sortCol, sortDir, onSort }) => (
  <th onClick={()=>onSort(col)} style={{ padding:'10px 8px', textAlign:'left', fontSize:11, fontWeight:700, color:T.textSec, cursor:'pointer', borderBottom:`2px solid ${T.border}`, userSelect:'none', whiteSpace:'nowrap', fontFamily:T.font }}>
    {label} {sortCol===col ? (sortDir==='asc'?'\u25B2':'\u25BC') : ''}
  </th>
);

/* =================================================================
   MAIN COMPONENT
   ================================================================= */
export default function ImpactVerificationPage() {
  const navigate = useNavigate();

  /* ── portfolio ────────────────────────────────────────────────── */
  const portfolioRaw = useMemo(() => {
    const saved = loadLS(LS_PORT);
    const data = saved || { portfolios:{}, activePortfolio:null };
    return data.portfolios?.[data.activePortfolio]?.holdings || [];
  }, []);

  const [sortCol, setSortCol] = useState('impScore');
  const [sortDir, setSortDir] = useState('desc');
  const [selectedDim, setSelectedDim] = useState(null);
  const [verifyOverrides, setVerifyOverrides] = useState(() => loadLS(LS_VERIFY) || {});
  const [filterTier, setFilterTier] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [tocCompany, setTocCompany] = useState(null);
  const [improvementTarget, setImprovementTarget] = useState(null);
  const [costBenefitSlider, setCostBenefitSlider] = useState(50);

  useEffect(() => { saveLS(LS_VERIFY, verifyOverrides); }, [verifyOverrides]);

  /* ── build holdings ──────────────────────────────────────────── */
  const holdings = useMemo(() => {
    if (!portfolioRaw.length) return GLOBAL_COMPANY_MASTER.slice(0, 40).map((c, i) => enrichHolding(c, i));
    const lookup = {};
    GLOBAL_COMPANY_MASTER.forEach(c => { const k = (c.company_name || '').toLowerCase(); lookup[k] = c; });
    return portfolioRaw.map((h, i) => {
      const master = lookup[(h.company || '').toLowerCase()] || {};
      return enrichHolding({ ...master, ...h, company_name: h.company || master.company_name, sector: h.sector || master.sector, weight: h.weight }, i);
    });
  }, [portfolioRaw]);

  /* ── Aggregates ──────────────────────────────────────────────── */
  const agg = useMemo(() => {
    const tw = holdings.reduce((s, h) => s + (h.weight || 1), 0) || 1;
    const wAvg = fn => holdings.reduce((s, h) => s + fn(h) * (h.weight || 1), 0) / tw;
    const avgEvTier = wAvg(h => h.evidenceTier);
    const goldPct = holdings.filter(h => h.evidenceTier === 1).length / holdings.length * 100;
    const highPct = holdings.filter(h => h.evidenceTier <= 2).length / holdings.length * 100;
    const lowPct = holdings.filter(h => h.evidenceTier >= 4).length / holdings.length * 100;
    const totalFlags = holdings.reduce((s, h) => s + h.flags.length, 0);
    const avgIMP = wAvg(h => h.impScore);
    const totalVerifiedMn = holdings.reduce((s, h) => s + h.verifiedImpactMn, 0);
    const addPct = holdings.filter(h => h.additionalityProven).length / holdings.length * 100;
    const sdgVerPct = holdings.reduce((s, h) => s + h.sdgsVerified, 0) / Math.max(1, holdings.reduce((s, h) => s + h.sdgsClaimed, 0)) * 100;
    const dimAvgs = {};
    IMP_DIMENSIONS.forEach(d => { dimAvgs[d.id] = Math.round(wAvg(h => h.impDims[d.id]) * 10) / 10; });
    const tierDist = EVIDENCE_TIERS.map(t => ({ name:`Tier ${t.tier}`, count:holdings.filter(h => h.evidenceTier === t.tier).length, color:t.color }));
    return { avgEvTier, goldPct, highPct, lowPct, totalFlags, avgIMP, totalVerifiedMn, addPct, sdgVerPct, dimAvgs, tierDist };
  }, [holdings]);

  /* ── filtered + sorted ──────────────────────────────────────── */
  const displayed = useMemo(() => {
    let h = [...holdings];
    if (filterTier !== 'all') h = h.filter(x => x.evidenceTier === Number(filterTier));
    if (filterStatus !== 'all') h = h.filter(x => (verifyOverrides[x.company_name]?.status || x.verificationStatus) === filterStatus);
    h.sort((a, b) => {
      let va, vb;
      switch (sortCol) {
        case 'company': va = a.company_name; vb = b.company_name; return sortDir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va);
        case 'impScore': va = a.impScore; vb = b.impScore; break;
        case 'evidenceTier': va = a.evidenceTier; vb = b.evidenceTier; break;
        case 'flags': va = a.flags.length; vb = b.flags.length; break;
        case 'additionality': va = a.additionalityProven ? 1 : 0; vb = b.additionalityProven ? 1 : 0; break;
        case 'verified': va = a.verifiedImpactMn; vb = b.verifiedImpactMn; break;
        default: va = a.impScore; vb = b.impScore;
      }
      return sortDir === 'asc' ? va - vb : vb - va;
    });
    return h;
  }, [holdings, sortCol, sortDir, filterTier, filterStatus, verifyOverrides]);

  const onSort = col => { setSortCol(col); setSortDir(prev => sortCol === col ? (prev === 'asc' ? 'desc' : 'asc') : 'desc'); };

  /* ── Impact washing flagged companies ───────────────────────── */
  const flaggedCompanies = useMemo(() => holdings.filter(h => h.flags.length > 0).sort((a, b) => b.flags.length - a.flags.length), [holdings]);

  /* ── SDG Claim validation data ──────────────────────────────── */
  const sdgValidation = useMemo(() => {
    return SDGS_17.map(sdg => {
      const claiming = holdings.filter(h => Math.ceil(seed(h.evidenceTier * 7 + sdg.id) * 17) <= h.sdgsClaimed && seed(sdg.id * 13 + (h.impScore || 0)) > 0.4);
      const verified = claiming.filter(h => seed(sdg.id * 19 + h.impScore) > 0.5);
      return { ...sdg, claimed: claiming.length, verified: verified.length, gap: claiming.length - verified.length };
    }).filter(s => s.claimed > 0);
  }, [holdings]);

  /* ── Exports ────────────────────────────────────────────────── */
  const exportCSV = useCallback(() => {
    const rows = [['Company','Sector','IMP Score','Evidence Tier','Quality','Verification Status','Flags','Additionality','Verified Impact ($Mn)','SDGs Claimed','SDGs Verified','Beneficiaries'].join(',')];
    holdings.forEach(h => rows.push([`"${h.company_name}"`,`"${h.sector}"`,h.impScore,h.evidenceTier,h.tierObj.quality,verifyOverrides[h.company_name]?.status||h.verificationStatus,h.flags.length,h.additionalityProven?'Yes':'No',h.verifiedImpactMn,h.sdgsClaimed,h.sdgsVerified,h.beneficiaries].join(',')));
    const blob = new Blob([rows.join('\n')], { type:'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'impact_verification_report.csv'; a.click();
  }, [holdings, verifyOverrides]);

  const exportJSON = useCallback(() => {
    const data = holdings.map(h => ({ company:h.company_name, sector:h.sector, impDimensions:h.impDims, impScore:h.impScore, evidenceTier:h.evidenceTier, quality:h.tierObj.quality, verificationStatus:verifyOverrides[h.company_name]?.status||h.verificationStatus, flags:h.flags, additionality:h.additionalityProven, verifiedImpact:h.verifiedImpactMn, sdgsClaimed:h.sdgsClaimed, sdgsVerified:h.sdgsVerified, theoryOfChange:h.tocData }));
    const blob = new Blob([JSON.stringify({ impAssessment:data, generatedAt:new Date().toISOString(), dimensions:IMP_DIMENSIONS }, null, 2)], { type:'application/json' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'imp_assessment.json'; a.click();
  }, [holdings, verifyOverrides]);

  const exportPrint = useCallback(() => window.print(), []);

  /* ── Radar data ─────────────────────────────────────────────── */
  const radarData = IMP_DIMENSIONS.map(d => ({ dimension: d.id.toUpperCase(), score: agg.dimAvgs[d.id], fullMark: 100 }));

  /* ── Cost-Benefit slider data ───────────────────────────────── */
  const costBenefitData = useMemo(() => {
    return holdings.slice(0, 15).map(h => ({
      company: (h.company_name || '').slice(0, 14),
      costK: h.costOfVerification,
      premiumK: Math.round(h.credibilityPremium * (costBenefitSlider / 50)),
      roi: Math.round(((h.credibilityPremium * (costBenefitSlider / 50)) - h.costOfVerification) / Math.max(1, h.costOfVerification) * 100),
    }));
  }, [holdings, costBenefitSlider]);

  /* ── Improvement recs ───────────────────────────────────────── */
  const getRecommendation = (h) => {
    const recs = [];
    if (h.evidenceTier >= 4) recs.push({ action:'Commission independent verification', from:`Tier ${h.evidenceTier}`, to:'Tier 3', effort:'Medium', impact:'High' });
    if (h.evidenceTier >= 3) recs.push({ action:'Design quasi-experimental evaluation', from:`Tier ${h.evidenceTier}`, to:'Tier 2', effort:'High', impact:'Very High' });
    if (!h.hasToC) recs.push({ action:'Document theory of change', from:'No ToC', to:'ToC mapped', effort:'Low', impact:'Medium' });
    if (!h.additionalityProven) recs.push({ action:'Conduct counterfactual analysis', from:'Not proven', to:'Demonstrated', effort:'Medium', impact:'High' });
    if (h.flags.includes('IW08')) recs.push({ action:'Align SDG claims with evidence', from:'Unvalidated', to:'Evidence-backed', effort:'Medium', impact:'High' });
    if (h.flags.includes('IW01')) recs.push({ action:'Define quantitative impact metrics', from:'Vague claims', to:'Measurable KPIs', effort:'Low', impact:'High' });
    return recs;
  };

  /* ── Render ─────────────────────────────────────────────────── */
  return (
    <div style={{ fontFamily:T.font, background:T.bg, minHeight:'100vh', padding:'24px 32px', color:T.text }}>

      {/* S1 — Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24 }}>
        <div>
          <h1 style={{ fontSize:26, fontWeight:800, color:T.navy, margin:0 }}>Impact Verification & Assurance</h1>
          <div style={{ display:'flex', gap:8, marginTop:8, flexWrap:'wrap' }}>
            {['IMP','5 Dimensions','Evidence Tiers','Impact Washing'].map(b => (
              <span key={b} style={{ fontSize:11, padding:'3px 10px', borderRadius:20, background:T.gold+'22', color:T.gold, fontWeight:700 }}>{b}</span>
            ))}
          </div>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <Btn onClick={exportCSV}>Export CSV</Btn>
          <Btn onClick={exportJSON}>Export JSON</Btn>
          <Btn onClick={exportPrint}>Print</Btn>
        </div>
      </div>

      {/* S2 — 10 KPI Cards */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:12, marginBottom:24 }}>
        <KPI label="Holdings Assessed" value={holdings.length} sub="Full portfolio" accent={T.navy} />
        <KPI label="Avg Evidence Tier" value={fmt(agg.avgEvTier)} sub={agg.avgEvTier <= 2.5 ? 'Strong' : agg.avgEvTier <= 3.5 ? 'Moderate' : 'Needs Improvement'} accent={agg.avgEvTier <= 2.5 ? T.green : T.amber} />
        <KPI label="Gold Standard %" value={pct(agg.goldPct)} sub="Tier 1 (RCT)" accent={T.green} />
        <KPI label="High Quality %" value={pct(agg.highPct)} sub="Tier 1-2" accent={T.sage} />
        <KPI label="Low / Very Low %" value={pct(agg.lowPct)} sub="Tier 4-5" accent={T.red} />
        <KPI label="Impact Washing Flags" value={agg.totalFlags} sub={`${flaggedCompanies.length} companies flagged`} accent={agg.totalFlags > 10 ? T.red : T.amber} />
        <KPI label="IMP Score (Avg)" value={fmt(agg.avgIMP,0)} sub="Weighted portfolio" accent={T.gold} />
        <KPI label="Verified Impact" value={`$${agg.totalVerifiedMn}Mn`} sub="Audited evidence" accent={T.sage} />
        <KPI label="Additionality Proven" value={pct(agg.addPct)} sub="Counterfactual tested" accent={agg.addPct > 60 ? T.green : T.amber} />
        <KPI label="SDG Claims Verified" value={pct(agg.sdgVerPct)} sub="Claims vs evidence" accent={agg.sdgVerPct > 70 ? T.green : T.amber} />
      </div>

      {/* S3 — IMP Radar + S4 — Evidence Tier Pie */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20, marginBottom:24 }}>
        <Section title="IMP 5-Dimension Portfolio Radar" badge="Weighted">
          <div style={{ background:T.surface, borderRadius:12, border:`1px solid ${T.border}`, padding:16 }}>
            <ResponsiveContainer width="100%" height={320}>
              <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="75%">
                <PolarGrid stroke={T.borderL} />
                <PolarAngleAxis dataKey="dimension" tick={{ fontSize:12, fill:T.navy, fontWeight:600 }} />
                <PolarRadiusAxis angle={90} domain={[0,100]} tick={{ fontSize:10 }} />
                <Radar name="Portfolio" dataKey="score" stroke={T.navy} fill={T.navy} fillOpacity={0.25} strokeWidth={2} />
              </RadarChart>
            </ResponsiveContainer>
            <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginTop:8 }}>
              {IMP_DIMENSIONS.map(d => (
                <Btn key={d.id} small active={selectedDim === d.id} onClick={() => setSelectedDim(selectedDim === d.id ? null : d.id)}>{d.id.toUpperCase()} ({agg.dimAvgs[d.id]})</Btn>
              ))}
            </div>
            {selectedDim && (
              <div style={{ marginTop:12, padding:12, background:T.surfaceH, borderRadius:8, fontSize:13 }}>
                <strong>{IMP_DIMENSIONS.find(d => d.id === selectedDim)?.name}</strong>
                <div style={{ color:T.textSec, marginTop:4 }}>{IMP_DIMENSIONS.find(d => d.id === selectedDim)?.description}</div>
                <div style={{ marginTop:6 }}><strong>Assessed via:</strong> {IMP_DIMENSIONS.find(d => d.id === selectedDim)?.assessment.join(', ')}</div>
              </div>
            )}
          </div>
        </Section>

        <Section title="Evidence Tier Distribution" badge="Quality Pyramid">
          <div style={{ background:T.surface, borderRadius:12, border:`1px solid ${T.border}`, padding:16 }}>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={agg.tierDist} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={({name,count}) => `${name}: ${count}`} labelLine>
                  {agg.tierDist.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:6, marginTop:8 }}>
              {EVIDENCE_TIERS.map(t => (
                <div key={t.tier} style={{ padding:8, borderRadius:6, border:`1px solid ${t.color}33`, background:t.color+'11', fontSize:11, textAlign:'center' }}>
                  <div style={{ fontWeight:700, color:t.color }}>Tier {t.tier}</div>
                  <div style={{ color:T.textSec }}>{t.quality}</div>
                  <div style={{ fontSize:10, color:T.textMut }}>{t.confidence}% conf.</div>
                </div>
              ))}
            </div>
          </div>
        </Section>
      </div>

      {/* S5 — Holdings Verification Table */}
      <Section title="Holdings Verification Table" badge={`${displayed.length} holdings`}>
        <div style={{ display:'flex', gap:10, marginBottom:12, flexWrap:'wrap' }}>
          <select value={filterTier} onChange={e => setFilterTier(e.target.value)} style={{ padding:'6px 12px', borderRadius:6, border:`1px solid ${T.border}`, fontSize:12, fontFamily:T.font }}>
            <option value="all">All Tiers</option>
            {EVIDENCE_TIERS.map(t => <option key={t.tier} value={t.tier}>Tier {t.tier} \u2014 {t.quality}</option>)}
          </select>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ padding:'6px 12px', borderRadius:6, border:`1px solid ${T.border}`, fontSize:12, fontFamily:T.font }}>
            <option value="all">All Statuses</option>
            {['Fully Verified','Partially Verified','Under Review','Unverified'].map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div style={{ overflowX:'auto', background:T.surface, borderRadius:12, border:`1px solid ${T.border}` }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12, fontFamily:T.font }}>
            <thead>
              <tr style={{ background:T.surfaceH }}>
                <ThCell label="Company" col="company" sortCol={sortCol} sortDir={sortDir} onSort={onSort} />
                <ThCell label="IMP Score" col="impScore" sortCol={sortCol} sortDir={sortDir} onSort={onSort} />
                <ThCell label="Evidence Tier" col="evidenceTier" sortCol={sortCol} sortDir={sortDir} onSort={onSort} />
                <th style={{ padding:'10px 8px', fontSize:11, fontWeight:700, color:T.textSec, borderBottom:`2px solid ${T.border}` }}>Status</th>
                <ThCell label="Flags" col="flags" sortCol={sortCol} sortDir={sortDir} onSort={onSort} />
                <ThCell label="Additionality" col="additionality" sortCol={sortCol} sortDir={sortDir} onSort={onSort} />
                <ThCell label="Verified ($Mn)" col="verified" sortCol={sortCol} sortDir={sortDir} onSort={onSort} />
                <th style={{ padding:'10px 8px', fontSize:11, fontWeight:700, color:T.textSec, borderBottom:`2px solid ${T.border}` }}>SDGs</th>
                <th style={{ padding:'10px 8px', fontSize:11, fontWeight:700, color:T.textSec, borderBottom:`2px solid ${T.border}` }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {displayed.slice(0, 30).map((h, i) => {
                const sts = verifyOverrides[h.company_name]?.status || h.verificationStatus;
                return (
                  <tr key={i} style={{ borderBottom:`1px solid ${T.border}`, background:i%2===0?'transparent':T.surfaceH }}>
                    <td style={{ padding:'10px 8px', fontWeight:600, color:T.navy, maxWidth:160, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{h.company_name}</td>
                    <td style={{ padding:'10px 8px' }}>
                      <span style={{ fontWeight:700, color:h.impScore >= 70 ? T.green : h.impScore >= 50 ? T.amber : T.red }}>{h.impScore}</span>
                    </td>
                    <td style={{ padding:'10px 8px' }}>
                      <span style={{ padding:'2px 8px', borderRadius:8, fontSize:11, fontWeight:700, background:h.tierObj.color+'22', color:h.tierObj.color }}>T{h.evidenceTier} \u2014 {h.tierObj.quality}</span>
                    </td>
                    <td style={{ padding:'10px 8px' }}><StatusBadge status={sts} /></td>
                    <td style={{ padding:'10px 8px', color:h.flags.length ? T.red : T.green, fontWeight:600 }}>{h.flags.length || '\u2713'}</td>
                    <td style={{ padding:'10px 8px' }}>{h.additionalityProven ? <span style={{ color:T.green, fontWeight:700 }}>Proven</span> : <span style={{ color:T.red }}>Not proven</span>}</td>
                    <td style={{ padding:'10px 8px', fontWeight:600 }}>${h.verifiedImpactMn}M</td>
                    <td style={{ padding:'10px 8px', fontSize:11 }}>{h.sdgsVerified}/{h.sdgsClaimed}</td>
                    <td style={{ padding:'10px 8px' }}>
                      <div style={{ display:'flex', gap:4 }}>
                        <Btn small onClick={() => setTocCompany(tocCompany === h.company_name ? null : h.company_name)}>ToC</Btn>
                        <Btn small onClick={() => setImprovementTarget(improvementTarget === h.company_name ? null : h.company_name)}>Recs</Btn>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Section>

      {/* S6 — Impact Washing Detection */}
      <Section title="Impact Washing Detection" badge={`${agg.totalFlags} flags`}>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
          <div style={{ background:T.surface, borderRadius:12, border:`1px solid ${T.border}`, padding:16 }}>
            <div style={{ fontSize:13, fontWeight:700, color:T.navy, marginBottom:10 }}>Flag Registry</div>
            {IMPACT_WASHING_FLAGS.map(f => {
              const cnt = holdings.filter(h => h.flags.includes(f.id)).length;
              return (
                <div key={f.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'8px 0', borderBottom:`1px solid ${T.border}` }}>
                  <div style={{ flex:1 }}>
                    <span style={{ fontWeight:600, color:T.navy, fontSize:12 }}>{f.id}</span>
                    <span style={{ fontSize:12, color:T.textSec, marginLeft:8 }}>{f.flag}</span>
                  </div>
                  <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                    <SevBadge sev={f.severity} />
                    <span style={{ fontWeight:700, color:cnt ? T.red : T.green, fontSize:13, minWidth:24, textAlign:'right' }}>{cnt}</span>
                  </div>
                </div>
              );
            })}
          </div>
          <div style={{ background:T.surface, borderRadius:12, border:`1px solid ${T.border}`, padding:16 }}>
            <div style={{ fontSize:13, fontWeight:700, color:T.navy, marginBottom:10 }}>Top Flagged Companies</div>
            {flaggedCompanies.slice(0, 10).map((h, i) => (
              <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'8px 0', borderBottom:`1px solid ${T.border}` }}>
                <span style={{ fontWeight:600, fontSize:12, color:T.navy }}>{(h.company_name || '').slice(0, 22)}</span>
                <div style={{ display:'flex', gap:4, flexWrap:'wrap' }}>
                  {h.flags.map(f => <span key={f} style={{ fontSize:10, padding:'1px 6px', borderRadius:6, background:'#fee2e2', color:'#991b1b', fontWeight:600 }}>{f}</span>)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* S7 — Verification Workflow */}
      <Section title="Verification Workflow" badge="Persistent">
        <div style={{ background:T.surface, borderRadius:12, border:`1px solid ${T.border}`, padding:16, overflowX:'auto' }}>
          <div style={{ fontSize:12, color:T.textSec, marginBottom:10 }}>Update verification status per holding. Changes persist to <strong>ra_impact_verification_v1</strong>.</div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))', gap:10 }}>
            {holdings.slice(0, 20).map((h, i) => {
              const cur = verifyOverrides[h.company_name]?.status || h.verificationStatus;
              const statuses = ['Unverified','Under Review','Partially Verified','Fully Verified'];
              return (
                <div key={i} style={{ padding:12, borderRadius:8, border:`1px solid ${T.border}`, background:T.surfaceH }}>
                  <div style={{ fontWeight:600, fontSize:12, color:T.navy, marginBottom:6, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{h.company_name}</div>
                  <div style={{ display:'flex', gap:4 }}>
                    {statuses.map(s => (
                      <button key={s} onClick={() => setVerifyOverrides(prev => ({ ...prev, [h.company_name]: { ...prev[h.company_name], status: s, updatedAt: new Date().toISOString() } }))}
                        style={{ padding:'3px 6px', borderRadius:4, border:`1px solid ${cur === s ? T.navy : T.border}`, background:cur === s ? T.navy : 'transparent', color:cur === s ? '#fff' : T.textSec, fontSize:9, fontWeight:600, cursor:'pointer' }}>{s.replace('Partially ','P-').replace('Fully ','F-').replace('Under ','U-')}</button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </Section>

      {/* S8 — Additionality Assessment */}
      <Section title="Additionality Assessment" badge="Counterfactual">
        <div style={{ background:T.surface, borderRadius:12, border:`1px solid ${T.border}`, padding:16 }}>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={holdings.slice(0, 15).map(h => ({ name:(h.company_name||'').slice(0,12), counterfactual:h.counterfactual, additional:100-h.counterfactual, proven:h.additionalityProven }))}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
              <XAxis dataKey="name" tick={{ fontSize:10, fill:T.textSec }} angle={-30} textAnchor="end" height={60} />
              <YAxis tick={{ fontSize:10 }} domain={[0,100]} />
              <Tooltip />
              <Legend />
              <Bar dataKey="counterfactual" name="Would Happen Anyway %" stackId="a" fill={T.red+'88'} />
              <Bar dataKey="additional" name="Additionality %" stackId="a" fill={T.green} />
            </BarChart>
          </ResponsiveContainer>
          <div style={{ fontSize:12, color:T.textSec, marginTop:8 }}>Higher green bars indicate stronger additionality: the impact would not have occurred without this investment.</div>
        </div>
      </Section>

      {/* S9 — Theory of Change Mapper */}
      <Section title="Theory of Change Mapper" badge="Visual">
        <div style={{ background:T.surface, borderRadius:12, border:`1px solid ${T.border}`, padding:16 }}>
          <div style={{ display:'flex', gap:8, marginBottom:12, flexWrap:'wrap' }}>
            {holdings.slice(0, 12).map((h, i) => (
              <Btn key={i} small active={tocCompany === h.company_name} onClick={() => setTocCompany(tocCompany === h.company_name ? null : h.company_name)}>
                {(h.company_name || '').slice(0, 15)}
              </Btn>
            ))}
          </div>
          {tocCompany ? (() => {
            const h = holdings.find(x => x.company_name === tocCompany);
            if (!h) return null;
            return (
              <div>
                <div style={{ fontSize:14, fontWeight:700, color:T.navy, marginBottom:12 }}>Theory of Change: {h.company_name}</div>
                <div style={{ display:'flex', gap:6, alignItems:'stretch' }}>
                  {h.tocData.map((st, idx) => (
                    <React.Fragment key={st.stage}>
                      <div style={{ flex:1, padding:14, borderRadius:10, background:`${T.navy}${String(Math.round(15 + st.strength * 0.6)).padStart(2,'0')}`, border:`2px solid ${st.strength > 60 ? T.green : st.strength > 40 ? T.amber : T.red}`, textAlign:'center' }}>
                        <div style={{ fontSize:12, fontWeight:700, color:T.navy }}>{st.stage}</div>
                        <div style={{ fontSize:20, fontWeight:800, color:st.strength > 60 ? T.green : st.strength > 40 ? T.amber : T.red, marginTop:4 }}>{st.strength}%</div>
                        <div style={{ fontSize:10, color:T.textSec, marginTop:2 }}>{st.strength > 60 ? 'Strong' : st.strength > 40 ? 'Moderate' : 'Weak'}</div>
                      </div>
                      {idx < h.tocData.length - 1 && <div style={{ display:'flex', alignItems:'center', fontSize:20, color:T.gold }}>{'\u2192'}</div>}
                    </React.Fragment>
                  ))}
                </div>
                <div style={{ marginTop:10, fontSize:12, color:T.textSec }}>
                  Theory of Change documented: {h.hasToC ? <span style={{ color:T.green, fontWeight:700 }}>Yes</span> : <span style={{ color:T.red, fontWeight:700 }}>No</span>}
                  {' | '}Additionality: {h.additionalityProven ? <span style={{ color:T.green, fontWeight:700 }}>Proven</span> : <span style={{ color:T.red, fontWeight:700 }}>Not proven</span>}
                </div>
              </div>
            );
          })() : <div style={{ fontSize:13, color:T.textMut, padding:20, textAlign:'center' }}>Select a company above to visualize its Theory of Change pathway</div>}
        </div>
      </Section>

      {/* S10 — Verifier Directory */}
      <Section title="Third-Party Verifier Directory" badge={`${VERIFIERS.length} verifiers`}>
        <div style={{ overflowX:'auto', background:T.surface, borderRadius:12, border:`1px solid ${T.border}` }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12, fontFamily:T.font }}>
            <thead>
              <tr style={{ background:T.surfaceH }}>
                {['Verifier','Specialty','Credibility','Region','Avg Cost ($K)','Turnaround'].map(h => (
                  <th key={h} style={{ padding:'10px 10px', textAlign:'left', fontSize:11, fontWeight:700, color:T.textSec, borderBottom:`2px solid ${T.border}` }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {VERIFIERS.map((v, i) => (
                <tr key={i} style={{ borderBottom:`1px solid ${T.border}`, background:i%2===0?'transparent':T.surfaceH }}>
                  <td style={{ padding:'10px 10px', fontWeight:700, color:T.navy }}>{v.name}</td>
                  <td style={{ padding:'10px 10px' }}>{v.specialty}</td>
                  <td style={{ padding:'10px 10px' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                      <div style={{ width:60, height:6, borderRadius:3, background:T.border }}>
                        <div style={{ width:`${v.credibility}%`, height:'100%', borderRadius:3, background:v.credibility >= 95 ? T.green : v.credibility >= 90 ? T.sage : T.amber }} />
                      </div>
                      <span style={{ fontWeight:600 }}>{v.credibility}%</span>
                    </div>
                  </td>
                  <td style={{ padding:'10px 10px' }}>{v.region}</td>
                  <td style={{ padding:'10px 10px', fontWeight:600 }}>${v.avgCost}K</td>
                  <td style={{ padding:'10px 10px' }}>{v.turnaround}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      {/* S11 — Verification Cost-Benefit */}
      <Section title="Verification Cost-Benefit Analysis" badge="Interactive">
        <div style={{ background:T.surface, borderRadius:12, border:`1px solid ${T.border}`, padding:16 }}>
          <div style={{ display:'flex', alignItems:'center', gap:16, marginBottom:12 }}>
            <span style={{ fontSize:12, fontWeight:600, color:T.navy }}>Credibility Premium Multiplier</span>
            <input type="range" min={10} max={100} value={costBenefitSlider} onChange={e => setCostBenefitSlider(Number(e.target.value))} style={{ flex:1, accentColor:T.gold }} />
            <span style={{ fontSize:13, fontWeight:700, color:T.gold }}>{(costBenefitSlider / 50).toFixed(1)}x</span>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={costBenefitData}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
              <XAxis dataKey="company" tick={{ fontSize:9, fill:T.textSec }} angle={-25} textAnchor="end" height={60} />
              <YAxis tick={{ fontSize:10 }} label={{ value:'$K', angle:-90, position:'insideLeft', fontSize:11 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="costK" name="Verification Cost ($K)" fill={T.red+'99'} />
              <Bar dataKey="premiumK" name="Credibility Premium ($K)" fill={T.green} />
            </BarChart>
          </ResponsiveContainer>
          <div style={{ fontSize:12, color:T.textSec, marginTop:6 }}>Holdings where green exceeds red indicate positive ROI on verification investment.</div>
        </div>
      </Section>

      {/* S12 — SDG Claim Validation */}
      <Section title="SDG Claim Validation" badge="Cross-check">
        <div style={{ background:T.surface, borderRadius:12, border:`1px solid ${T.border}`, padding:16 }}>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={sdgValidation}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
              <XAxis dataKey="name" tick={{ fontSize:9, fill:T.textSec }} angle={-25} textAnchor="end" height={70} />
              <YAxis tick={{ fontSize:10 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="claimed" name="SDG Claims" fill={T.amber} />
              <Bar dataKey="verified" name="Verified" fill={T.green} />
              <Bar dataKey="gap" name="Gap" fill={T.red+'88'} />
            </BarChart>
          </ResponsiveContainer>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))', gap:8, marginTop:12 }}>
            {sdgValidation.slice(0, 8).map(s => (
              <div key={s.id} style={{ padding:8, borderRadius:6, border:`1px solid ${T.border}`, background:T.surfaceH, fontSize:11 }}>
                <div style={{ fontWeight:700, color:T.navy }}>SDG {s.id}: {s.name}</div>
                <div>Claimed: <strong>{s.claimed}</strong> | Verified: <strong style={{ color:T.green }}>{s.verified}</strong> | Gap: <strong style={{ color:T.red }}>{s.gap}</strong></div>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* S13 — Improvement Recommendations */}
      <Section title="Improvement Recommendations" badge="Actionable">
        <div style={{ background:T.surface, borderRadius:12, border:`1px solid ${T.border}`, padding:16 }}>
          <div style={{ display:'flex', gap:8, marginBottom:12, flexWrap:'wrap' }}>
            {holdings.slice(0, 12).map((h, i) => (
              <Btn key={i} small active={improvementTarget === h.company_name} onClick={() => setImprovementTarget(improvementTarget === h.company_name ? null : h.company_name)}>
                {(h.company_name || '').slice(0, 15)}
              </Btn>
            ))}
          </div>
          {improvementTarget ? (() => {
            const h = holdings.find(x => x.company_name === improvementTarget);
            if (!h) return null;
            const recs = getRecommendation(h);
            return (
              <div>
                <div style={{ fontSize:14, fontWeight:700, color:T.navy, marginBottom:8 }}>Recommendations for: {h.company_name}</div>
                <div style={{ fontSize:12, marginBottom:12 }}>Current: Tier {h.evidenceTier} ({h.tierObj.quality}) | IMP Score: {h.impScore} | Flags: {h.flags.length}</div>
                {recs.length === 0 ? <div style={{ color:T.green, fontWeight:600, fontSize:13 }}>No improvement actions needed at this time.</div> : (
                  <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
                    <thead>
                      <tr style={{ background:T.surfaceH }}>
                        {['Action','From','To','Effort','Impact'].map(l => <th key={l} style={{ padding:'8px', textAlign:'left', fontWeight:700, color:T.textSec, borderBottom:`2px solid ${T.border}`, fontSize:11 }}>{l}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {recs.map((r, ri) => (
                        <tr key={ri} style={{ borderBottom:`1px solid ${T.border}` }}>
                          <td style={{ padding:'8px', fontWeight:600, color:T.navy }}>{r.action}</td>
                          <td style={{ padding:'8px', color:T.red }}>{r.from}</td>
                          <td style={{ padding:'8px', color:T.green, fontWeight:600 }}>{r.to}</td>
                          <td style={{ padding:'8px' }}><SevBadge sev={r.effort} /></td>
                          <td style={{ padding:'8px' }}><SevBadge sev={r.impact} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            );
          })() : <div style={{ fontSize:13, color:T.textMut, padding:20, textAlign:'center' }}>Select a company above to view tailored improvement recommendations</div>}
        </div>
      </Section>

      {/* S14 — Evidence Tier Detail Cards */}
      <Section title="Evidence Tier Reference" badge="PCAF-Aligned">
        <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:10 }}>
          {EVIDENCE_TIERS.map(t => (
            <div key={t.tier} style={{ background:T.surface, borderRadius:10, border:`1px solid ${t.color}44`, padding:14, borderTop:`3px solid ${t.color}` }}>
              <div style={{ fontWeight:800, fontSize:18, color:t.color }}>Tier {t.tier}</div>
              <div style={{ fontWeight:700, fontSize:13, color:T.navy, marginTop:4 }}>{t.name}</div>
              <div style={{ fontSize:11, color:T.textSec, marginTop:4 }}>{t.description}</div>
              <div style={{ marginTop:8, fontSize:11, fontWeight:600, color:T.textSec }}>Confidence: {t.confidence}%</div>
              <div style={{ marginTop:6, fontSize:10, color:T.textMut }}>{t.examples.join(' | ')}</div>
            </div>
          ))}
        </div>
      </Section>

      {/* S15 — Verification Timeline */}
      <Section title="Verification Timeline" badge="Progress Tracker">
        <div style={{ background:T.surface, borderRadius:12, border:`1px solid ${T.border}`, padding:16 }}>
          <div style={{ fontSize:12, color:T.textSec, marginBottom:12 }}>Portfolio-wide verification progress over time.</div>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={[
              { month:'Jan 25', verified:Math.round(holdings.filter(h=>h.evidenceTier<=2).length*0.4), partial:Math.round(holdings.filter(h=>h.evidenceTier===3).length*0.5), unverified:Math.round(holdings.length*0.6) },
              { month:'Apr 25', verified:Math.round(holdings.filter(h=>h.evidenceTier<=2).length*0.55), partial:Math.round(holdings.filter(h=>h.evidenceTier===3).length*0.65), unverified:Math.round(holdings.length*0.45) },
              { month:'Jul 25', verified:Math.round(holdings.filter(h=>h.evidenceTier<=2).length*0.7), partial:Math.round(holdings.filter(h=>h.evidenceTier===3).length*0.75), unverified:Math.round(holdings.length*0.35) },
              { month:'Oct 25', verified:Math.round(holdings.filter(h=>h.evidenceTier<=2).length*0.85), partial:Math.round(holdings.filter(h=>h.evidenceTier===3).length*0.85), unverified:Math.round(holdings.length*0.22) },
              { month:'Jan 26', verified:holdings.filter(h=>h.evidenceTier<=2).length, partial:holdings.filter(h=>h.evidenceTier===3).length, unverified:holdings.filter(h=>h.evidenceTier>=4).length },
            ]}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
              <XAxis dataKey="month" tick={{ fontSize:11 }} />
              <YAxis tick={{ fontSize:10 }} />
              <Tooltip />
              <Legend />
              <Area type="monotone" dataKey="verified" name="Verified (Tier 1-2)" stackId="1" stroke={T.green} fill={T.green+'55'} />
              <Area type="monotone" dataKey="partial" name="Moderate (Tier 3)" stackId="1" stroke={T.amber} fill={T.amber+'55'} />
              <Area type="monotone" dataKey="unverified" name="Unverified (Tier 4-5)" stackId="1" stroke={T.red} fill={T.red+'55'} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Section>

      {/* S16 — Sector Evidence Heatmap */}
      <Section title="Sector Evidence Quality Heatmap" badge="Sectors">
        <div style={{ background:T.surface, borderRadius:12, border:`1px solid ${T.border}`, padding:16 }}>
          {(() => {
            const sectors = [...new Set(holdings.map(h => h.sector))].slice(0, 12);
            return (
              <div>
                <div style={{ display:'grid', gridTemplateColumns:`180px repeat(5,1fr)`, gap:1, marginBottom:12 }}>
                  <div style={{ padding:8, fontWeight:700, fontSize:11, color:T.textSec }}>Sector</div>
                  {EVIDENCE_TIERS.map(t => <div key={t.tier} style={{ padding:8, fontWeight:700, fontSize:11, color:t.color, textAlign:'center' }}>Tier {t.tier}</div>)}
                  {sectors.map(sec => {
                    const sectorH = holdings.filter(h => h.sector === sec);
                    return (
                      <React.Fragment key={sec}>
                        <div style={{ padding:8, fontSize:11, fontWeight:600, color:T.navy, borderTop:`1px solid ${T.border}`, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{sec}</div>
                        {EVIDENCE_TIERS.map(t => {
                          const cnt = sectorH.filter(h => h.evidenceTier === t.tier).length;
                          const intensity = cnt / Math.max(1, sectorH.length);
                          return (
                            <div key={t.tier} style={{ padding:8, textAlign:'center', borderTop:`1px solid ${T.border}`, background:cnt > 0 ? `${t.color}${String(Math.round(15 + intensity * 40)).padStart(2,'0')}` : 'transparent', fontWeight:600, fontSize:12, color:cnt ? t.color : T.textMut }}>
                              {cnt || '\u2014'}
                            </div>
                          );
                        })}
                      </React.Fragment>
                    );
                  })}
                </div>
                <div style={{ fontSize:11, color:T.textSec }}>Darker cells indicate higher concentration of holdings at that evidence tier within the sector.</div>
              </div>
            );
          })()}
        </div>
      </Section>

      {/* S17 — Beneficiary Analysis */}
      <Section title="Beneficiary Impact Analysis" badge="Scale">
        <div style={{ background:T.surface, borderRadius:12, border:`1px solid ${T.border}`, padding:16 }}>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={holdings.slice(0, 15).sort((a,b) => b.beneficiaries - a.beneficiaries).map(h => ({
              name:(h.company_name||'').slice(0,12),
              beneficiaries:h.beneficiaries,
              perDollar:Math.round(h.beneficiaries / Math.max(1, h.verifiedImpactMn)),
            }))}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
              <XAxis dataKey="name" tick={{ fontSize:9, fill:T.textSec }} angle={-25} textAnchor="end" height={60} />
              <YAxis yAxisId="left" tick={{ fontSize:10 }} label={{ value:'Beneficiaries', angle:-90, position:'insideLeft', fontSize:10 }} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize:10 }} label={{ value:'Per $Mn', angle:90, position:'insideRight', fontSize:10 }} />
              <Tooltip />
              <Legend />
              <Bar yAxisId="left" dataKey="beneficiaries" name="Total Beneficiaries" fill={T.navy} />
              <Bar yAxisId="right" dataKey="perDollar" name="Per $Mn Invested" fill={T.gold} />
            </BarChart>
          </ResponsiveContainer>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10, marginTop:12 }}>
            <div style={{ padding:10, borderRadius:8, background:T.surfaceH, textAlign:'center' }}>
              <div style={{ fontSize:20, fontWeight:800, color:T.navy }}>{(holdings.reduce((s,h) => s + h.beneficiaries, 0)/1000).toFixed(0)}K</div>
              <div style={{ fontSize:11, color:T.textSec }}>Total Beneficiaries</div>
            </div>
            <div style={{ padding:10, borderRadius:8, background:T.surfaceH, textAlign:'center' }}>
              <div style={{ fontSize:20, fontWeight:800, color:T.gold }}>{Math.round(holdings.reduce((s,h)=>s+h.beneficiaries,0) / Math.max(1, holdings.reduce((s,h)=>s+h.verifiedImpactMn,0)))}</div>
              <div style={{ fontSize:11, color:T.textSec }}>Avg Per $Mn</div>
            </div>
            <div style={{ padding:10, borderRadius:8, background:T.surfaceH, textAlign:'center' }}>
              <div style={{ fontSize:20, fontWeight:800, color:T.sage }}>{Math.max(...holdings.map(h=>h.beneficiaries)).toLocaleString()}</div>
              <div style={{ fontSize:11, color:T.textSec }}>Max (Single Holding)</div>
            </div>
            <div style={{ padding:10, borderRadius:8, background:T.surfaceH, textAlign:'center' }}>
              <div style={{ fontSize:20, fontWeight:800, color:T.navyL }}>{Math.round(holdings.reduce((s,h)=>s+h.beneficiaries,0)/holdings.length).toLocaleString()}</div>
              <div style={{ fontSize:11, color:T.textSec }}>Avg Per Holding</div>
            </div>
          </div>
        </div>
      </Section>

      {/* S18 — Impact Dimension Deep-Dive Bars */}
      <Section title="IMP Dimension Breakdown by Holding" badge="Deep Dive">
        <div style={{ background:T.surface, borderRadius:12, border:`1px solid ${T.border}`, padding:16 }}>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={holdings.slice(0,12).map(h=>({ name:(h.company_name||'').slice(0,10), what:h.impDims.what, who:h.impDims.who, howMuch:h.impDims.how_much, contribution:h.impDims.contribution, risk:h.impDims.risk }))}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
              <XAxis dataKey="name" tick={{ fontSize:9, fill:T.textSec }} angle={-25} textAnchor="end" height={55} />
              <YAxis tick={{ fontSize:10 }} domain={[0,100]} />
              <Tooltip />
              <Legend />
              <Bar dataKey="what" name="WHAT" fill={T.navy} />
              <Bar dataKey="who" name="WHO" fill={T.sage} />
              <Bar dataKey="howMuch" name="HOW MUCH" fill={T.gold} />
              <Bar dataKey="contribution" name="CONTRIBUTION" fill='#7c3aed' />
              <Bar dataKey="risk" name="RISK" fill={T.red+'99'} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Section>

      {/* S19 — Portfolio Evidence Score Trend */}
      <Section title="Portfolio Evidence Score Over Time" badge="Trend">
        <div style={{ background:T.surface, borderRadius:12, border:`1px solid ${T.border}`, padding:16 }}>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={[
              { quarter:'Q1 24', score:3.8, target:3.0 },
              { quarter:'Q2 24', score:3.5, target:3.0 },
              { quarter:'Q3 24', score:3.2, target:2.8 },
              { quarter:'Q4 24', score:3.0, target:2.8 },
              { quarter:'Q1 25', score:2.8, target:2.5 },
              { quarter:'Q2 25', score:2.6, target:2.5 },
              { quarter:'Q3 25', score:2.5, target:2.3 },
              { quarter:'Q4 25', score:Math.round(agg.avgEvTier*10)/10, target:2.0 },
            ]}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
              <XAxis dataKey="quarter" tick={{ fontSize:11 }} />
              <YAxis tick={{ fontSize:10 }} reversed domain={[1,5]} label={{ value:'Tier (lower=better)', angle:-90, position:'insideLeft', fontSize:10 }} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="score" name="Actual Avg Tier" stroke={T.navy} strokeWidth={2} dot={{ fill:T.navy, r:4 }} />
              <Line type="monotone" dataKey="target" name="Target" stroke={T.gold} strokeWidth={2} strokeDasharray="5 5" dot={{ fill:T.gold, r:3 }} />
            </LineChart>
          </ResponsiveContainer>
          <div style={{ fontSize:11, color:T.textSec, marginTop:6 }}>Lower tier numbers represent higher evidence quality. Target trajectory shows planned improvement pathway.</div>
        </div>
      </Section>

      {/* S20 — Verification Budget Allocation */}
      <Section title="Verification Budget Allocation" badge="Planning">
        <div style={{ background:T.surface, borderRadius:12, border:`1px solid ${T.border}`, padding:16 }}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
            <div>
              <div style={{ fontSize:13, fontWeight:700, color:T.navy, marginBottom:8 }}>Budget by Evidence Upgrade Path</div>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={[
                    { name:'Tier 5\u21924', value:holdings.filter(h=>h.evidenceTier===5).length * 25, fill:'#dc2626' },
                    { name:'Tier 4\u21923', value:holdings.filter(h=>h.evidenceTier===4).length * 45, fill:'#f97316' },
                    { name:'Tier 3\u21922', value:holdings.filter(h=>h.evidenceTier===3).length * 80, fill:'#d97706' },
                    { name:'Tier 2\u21921', value:holdings.filter(h=>h.evidenceTier===2).length * 150, fill:'#2563eb' },
                  ]} dataKey="value" cx="50%" cy="50%" outerRadius={80} label={({name,value})=>`${name}: $${value}K`} labelLine>
                    {['#dc2626','#f97316','#d97706','#2563eb'].map((c,i)=><Cell key={i} fill={c} />)}
                  </Pie>
                  <Tooltip formatter={v => `$${v}K`} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div>
              <div style={{ fontSize:13, fontWeight:700, color:T.navy, marginBottom:8 }}>Estimated Costs by Verifier Type</div>
              {[
                { type:'Big 4 Audit (KPMG/EY/PwC/Deloitte)', range:'$120K\u2013$200K', timeline:'8\u201312 weeks', quality:'Highest' },
                { type:'Specialist ESG (DNV/CICERO)', range:'$55K\u2013$90K', timeline:'4\u20138 weeks', quality:'High' },
                { type:'Rating Agency (Sustainalytics/ISS)', range:'$40K\u2013$70K', timeline:'3\u20136 weeks', quality:'Good' },
                { type:'Academic/Research Partnership', range:'$80K\u2013$250K', timeline:'6\u201318 months', quality:'Gold Standard' },
              ].map((v, i) => (
                <div key={i} style={{ padding:10, marginBottom:6, borderRadius:8, border:`1px solid ${T.border}`, background:i%2===0?T.surfaceH:'transparent' }}>
                  <div style={{ fontWeight:600, fontSize:12, color:T.navy }}>{v.type}</div>
                  <div style={{ fontSize:11, color:T.textSec, display:'flex', gap:12, marginTop:3 }}>
                    <span>Cost: <strong>{v.range}</strong></span>
                    <span>Timeline: <strong>{v.timeline}</strong></span>
                    <span>Quality: <strong style={{ color:T.green }}>{v.quality}</strong></span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Section>

      {/* Cross-nav */}
      <div style={{ display:'flex', gap:10, flexWrap:'wrap', marginTop:20, paddingTop:16, borderTop:`2px solid ${T.border}` }}>
        {[
          { label:'Impact Hub', path:'/impact-hub' },
          { label:'IRIS+ Metrics', path:'/iris-metrics' },
          { label:'SDG Bond Impact', path:'/sdg-bond-impact' },
          { label:'IWA Classification', path:'/iwa-classification' },
          { label:'Blended Finance', path:'/blended-finance' },
          { label:'Greenwashing', path:'/greenwashing-detection' },
          { label:'Social Impact', path:'/social-impact' },
        ].map(n => (
          <Btn key={n.path} small onClick={() => navigate(n.path)} style={{ background:T.surfaceH }}>{n.label} {'\u2192'}</Btn>
        ))}
      </div>
    </div>
  );
}
