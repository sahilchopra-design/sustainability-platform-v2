import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line,
} from 'recharts';

// Backend E81 Green Securitisation & ESG Structured Finance engine (EU GBS
// Reg (EU) 2023/2631 / NGFS v4.0 climate VaR / CRREM v2.0 / ECBC Covered Bond
// Label). See backend/services/green_securitisation_engine.py +
// backend/api/v1/routes/green_securitisation.py
const API = 'http://localhost:8001';
const GS_API = `${API}/api/v1/green-securitisation`;
const T={bg:'#f4f6f9',surface:'#ffffff',surfaceH:'#eef1f6',border:'#e3e8ef',borderL:'#cfd6e0',navy:'#1b3a5c',navyL:'#2c5a8c',gold:'#c5a96a',goldL:'#d4be8a',sage:'#5a8a6a',sageL:'#7ba67d',teal:'#5a8a6a',text:'#1b3a5c',textSec:'#5c6b7e',textMut:'#9aa3ae',red:'#dc2626',green:'#16a34a',amber:'#d97706',font:"'DM Sans','SF Pro Display',system-ui,-apple-system,sans-serif",mono:"'JetBrains Mono','SF Mono','Fira Code',monospace"};
const seed = (s) => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };

const KpiCard = ({ label, value, sub, accent }) => (
  <div style={{ border: `1px solid ${accent ? '#059669' : '#e5e7eb'}`, borderRadius: 8, padding: '16px 20px', background: 'white' }}>
    <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>{label}</div>
    <div style={{ fontSize: 22, fontWeight: 700, color: '#1b3a5c' }}>{value}</div>
    {sub && <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>{sub}</div>}
  </div>
);
const Btn = ({ children, onClick, disabled }) => (
  <button onClick={onClick} disabled={disabled} style={{ padding: '8px 16px', borderRadius: 6, border: 'none', cursor: disabled ? 'not-allowed' : 'pointer', background: disabled ? '#9ca3af' : '#059669', color: 'white', fontWeight: 600, fontSize: 14 }}>{children}</button>
);
const Sel = ({ label, value, onChange, options }) => (
  <div style={{ marginBottom: 12 }}>
    {label && <div style={{ fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 4 }}>{label}</div>}
    <select value={value} onChange={e => onChange(e.target.value)}
      style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14, background: 'white' }}>
      {options.map(o => <option key={o.value || o} value={o.value || o}>{o.label || o}</option>)}
    </select>
  </div>
);
const Inp = ({ label, value, onChange, type = 'text', placeholder = '' }) => (
  <div style={{ marginBottom: 12 }}>
    {label && <div style={{ fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 4 }}>{label}</div>}
    <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
      style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14, boxSizing: 'border-box' }} />
  </div>
);
const Chk = ({ label, checked, onChange }) => (
  <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#374151', marginBottom: 10, cursor: 'pointer' }}>
    <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} />
    {label}
  </label>
);
const Section = ({ title, children, right }) => (
  <div style={{ marginBottom: 24 }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, paddingBottom: 8, borderBottom: '2px solid #059669' }}>
      <div style={{ fontSize: 16, fontWeight: 600, color: '#1b3a5c' }}>{title}</div>
      {right}
    </div>
    {children}
  </div>
);
const Row = ({ children, gap = 12 }) => (
  <div style={{ display: 'grid', gridTemplateColumns: `repeat(${React.Children.count(children)},1fr)`, gap }}>{children}</div>
);
const Badge = ({ label, color }) => {
  const colors = {
    green: { bg: '#d1fae5', text: '#065f46' },
    yellow: { bg: '#fef3c7', text: '#92400e' },
    red: { bg: '#fee2e2', text: '#991b1b' },
    blue: { bg: '#dbeafe', text: '#1e40af' },
    gray: { bg: '#f3f4f6', text: '#374151' },
    emerald: { bg: '#d1fae5', text: '#059669' },
  };
  const c = colors[color] || colors.gray;
  return <span style={{ padding: '3px 10px', borderRadius: 12, fontSize: 12, fontWeight: 700, background: c.bg, color: c.text }}>{label}</span>;
};
// Live/Demo status badge — convention shared with ai-governance/pages/AIGovernancePage.jsx
const LiveBadge = ({ status }) => {
  if (status === 'live') return <Badge label="● Live — /api/v1/green-securitisation" color="green" />;
  if (status === 'demo') return <Badge label="○ Demo Data — API unavailable" color="yellow" />;
  return <Badge label="… loading" color="gray" />;
};

const TABS = ['Deal Structure', 'EU GBS Compliance', 'Climate Risk Pass-Through', 'RMBS / ABS Analytics', 'Green Securitisation Overview'];
const PIE_COLORS_EPC = ['#059669', '#22c55e', '#84cc16', '#eab308', '#f97316', '#ef4444', '#9ca3af'];
const DEAL_TYPES = [
  { value: 'abs', label: 'ABS — Asset-Backed Security' },
  { value: 'rmbs', label: 'RMBS — Residential Mortgage-Backed' },
  { value: 'clo', label: 'CLO — Collateralised Loan Obligation' },
  { value: 'cmbs', label: 'CMBS — Commercial Mortgage-Backed' },
  { value: 'covered', label: 'Covered Bond' },
];
// Maps local dropdown values -> backend STRUCTURE_TYPES keys (green_securitisation_engine.py)
const STRUCTURE_TYPE_MAP = { abs: 'ABS', rmbs: 'RMBS', clo: 'CLO', cmbs: 'CMBS', covered: 'COVERED_BOND' };
const NGFS_SCENARIOS = [
  { value: 'net_zero_2050', label: 'Net Zero 2050' },
  { value: 'delayed_transition', label: 'Delayed Transition' },
  { value: 'current_policies', label: 'Current Policies' },
  { value: 'below_2c', label: 'Below 2°C' },
];
// Asset classes sent as pool_assets to /climate-var-passthrough + /full-assessment,
// in the same order as the "Pool Physical VaR vs Transition VaR" table below so the
// live engine response maps 1:1 onto the existing 4-row display.
const CLIMATE_ASSET_ORDER = [
  { label: 'Residential Mortgages', assetType: 'residential_mortgage', poolShare: 0.40 },
  { label: 'Commercial RE', assetType: 'commercial_real_estate', poolShare: 0.25 },
  { label: 'Auto Loans', assetType: 'auto_loans', poolShare: 0.20 },
  { label: 'Corp Loans', assetType: 'corporate_loans_industrials', poolShare: 0.15 },
];

// Seed data (fallback — used only when the live API is unavailable, clearly badged "Demo")
const trancheData = [
  { tranche: 'Senior AAA', size: 75, creditEnhancement: 25, coupon: 1.2, color: '#059669' },
  { tranche: 'Mezzanine A', size: 12, creditEnhancement: 13, coupon: 2.8, color: '#3b82f6' },
  { tranche: 'Mezzanine BB', size: 8, creditEnhancement: 5, coupon: 4.5, color: '#f59e0b' },
  { tranche: 'Junior / Equity', size: 5, creditEnhancement: 0, coupon: 8.2, color: '#ef4444' },
];
const gbsRequirements = [
  { req: 'EU Taxonomy Alignment', detail: 'DNSH + Minimum Safeguards', score: Math.round(seed(1) * 20 + 72), status: true },
  { req: 'Green Bond Framework', detail: 'Pre-issuance assessment per Art. 6', score: Math.round(seed(2) * 20 + 65), status: true },
  { req: 'Reporting', detail: 'Post-issuance annual allocation report', score: Math.round(seed(3) * 25 + 55), status: seed(3) > 0.3 },
  { req: 'External Review', detail: 'ESAP-registered External Reviewer', score: Math.round(seed(4) * 30 + 50), status: seed(4) > 0.4 },
];
const climateRiskData = [
  { asset: 'Residential Mortgages', physicalVar: Math.round(seed(11) * 3 + 1.5), transitionVar: Math.round(seed(12) * 4 + 2), pdUplift: Math.round(seed(13) * 15 + 5), lgdUplift: Math.round(seed(14) * 8 + 2) },
  { asset: 'Commercial RE', physicalVar: Math.round(seed(15) * 4 + 2), transitionVar: Math.round(seed(16) * 5 + 3), pdUplift: Math.round(seed(17) * 20 + 8), lgdUplift: Math.round(seed(18) * 10 + 3) },
  { asset: 'Auto Loans', physicalVar: Math.round(seed(19) * 2 + 0.8), transitionVar: Math.round(seed(20) * 5 + 3.5), pdUplift: Math.round(seed(21) * 12 + 4), lgdUplift: Math.round(seed(22) * 6 + 1) },
  { asset: 'Corp Loans', physicalVar: Math.round(seed(23) * 3 + 1), transitionVar: Math.round(seed(24) * 6 + 4), pdUplift: Math.round(seed(25) * 18 + 6), lgdUplift: Math.round(seed(26) * 9 + 2) },
];
const creditEnhancementComp = [
  { name: 'Base', senior: 18, mezz: 8, junior: 4 },
  { name: 'Net Zero', senior: 16, mezz: 7, junior: 3.5 },
  { name: 'Delayed Trans.', senior: 24, mezz: 11, junior: 6 },
  { name: 'Current Policy', senior: 28, mezz: 14, junior: 8 },
];
const epcData = [
  { band: 'A', value: Math.round(seed(31) * 10 + 8) },
  { band: 'B', value: Math.round(seed(32) * 12 + 15) },
  { band: 'C', value: Math.round(seed(33) * 15 + 18) },
  { band: 'D', value: Math.round(seed(34) * 10 + 22) },
  { band: 'E', value: Math.round(seed(35) * 8 + 16) },
  { band: 'F', value: Math.round(seed(36) * 6 + 10) },
  { band: 'G', value: Math.round(seed(37) * 4 + 5) },
];
const crremData = [
  { year: '2020', alignment: 62 }, { year: '2021', alignment: 65 }, { year: '2022', alignment: 67 },
  { year: '2023', alignment: 71 }, { year: '2024', alignment: 74 }, { year: '2025E', alignment: 76 },
  { year: '2030T', alignment: 85 },
];
const geoHazardData = [
  { region: 'S England', flood: 'High', heat: 'Medium', subsidence: 'Low', fire: 'Low', exposure: '€ 312M' },
  { region: 'SW France', flood: 'Medium', heat: 'High', subsidence: 'Low', fire: 'High', exposure: '€ 228M' },
  { region: 'N Italy', flood: 'High', heat: 'High', subsidence: 'Medium', fire: 'Medium', exposure: '€ 195M' },
  { region: 'NE Spain', flood: 'Low', heat: 'High', subsidence: 'Low', fire: 'High', exposure: '€ 178M' },
  { region: 'Netherlands', flood: 'High', heat: 'Low', subsidence: 'High', fire: 'Low', exposure: '€ 164M' },
];

export default function GreenSecuritisationPage() {
  const [tab, setTab] = useState(0);
  const [dealType, setDealType] = useState('rmbs');
  const [issuanceSize, setIssuanceSize] = useState('500');
  const [ngfsScenario, setNgfsScenario] = useState('net_zero_2050');

  // --- EU GBS Art 19 compliance inputs (drive the live /full-assessment call) ---
  const [taxonomyAlignmentPct, setTaxonomyAlignmentPct] = useState(72);
  const [hasFramework, setHasFramework] = useState(true);
  const [hasExternalReview, setHasExternalReview] = useState(true);
  const [dnshEvidence, setDnshEvidence] = useState(true);
  const [minSafeguardsEvidence, setMinSafeguardsEvidence] = useState(true);
  const [hasAllocationReport, setHasAllocationReport] = useState(true);
  const [hasImpactReport, setHasImpactReport] = useState(false);
  const [esapRegistered, setEsapRegistered] = useState(false);
  const [targetRating, setTargetRating] = useState('AAA');
  const [greenTargetPct, setGreenTargetPct] = useState(80);

  // --- Live backend wiring (E81 Green Securitisation Engine) ------------------
  // Full deal assessment: POST /api/v1/green-securitisation/full-assessment.
  // Falls back to the locally-seeded illustrative figures, clearly labelled
  // "Demo Data", if the API is unreachable.
  const [live, setLive] = useState(null);
  const [liveStatus, setLiveStatus] = useState('loading'); // 'loading' | 'live' | 'demo'

  const epcDistribution = useMemo(() => (
    epcData.reduce((acc, d) => { acc[d.band] = d.value; return acc; }, {})
  ), []);

  const runAnalysis = async () => {
    setLiveStatus('loading');
    const structureType = STRUCTURE_TYPE_MAP[dealType] || 'ABS';
    const totalIssuance = parseFloat(issuanceSize) || 500;
    const payload = {
      entity_id: 'FRONTEND-GREEN-SEC-001',
      deal_name: `${(DEAL_TYPES.find(d => d.value === dealType) || {}).label || dealType} Deal`,
      total_issuance_m: totalIssuance,
      structure_type: structureType,
      taxonomy_alignment_pct: Number(taxonomyAlignmentPct) || 0,
      has_framework: hasFramework,
      has_external_review: hasExternalReview,
      dnsh_evidence: dnshEvidence,
      min_safeguards_evidence: minSafeguardsEvidence,
      has_allocation_report: hasAllocationReport,
      has_impact_report: hasImpactReport,
      esap_registered: esapRegistered,
      pool_assets: CLIMATE_ASSET_ORDER.map(a => ({
        asset_type: a.assetType,
        balance_m: +(totalIssuance * a.poolShare).toFixed(2),
        base_pd: 0.02,
        base_lgd: 0.35,
      })),
      ngfs_scenario: ngfsScenario,
      time_horizon_years: 10,
      mortgage_pool: {
        mortgage_count: 1000,
        total_balance_m: totalIssuance,
        epc_distribution: epcDistribution,
        country_code: 'DE',
        vintage_year: 2021,
      },
      covered_bond_data: {
        oc_level_pct: 10.0,
        liquidity_buffer_days: 180,
        dual_recourse_structure: true,
        cover_pool_high_quality: true,
        national_competent_authority_supervised: true,
        quarterly_investor_report: true,
        green_use_of_proceeds: true,
        esg_pool_disclosure_published: true,
        issuer_type: 'mortgage_bank',
      },
      pool_data: {
        deal_name: dealType,
        pool_size_m: totalIssuance,
        structure_type: structureType,
        sts_eligible: true,
        green_label: 'EU_GBS',
        avg_loan_balance: 200000,
      },
      target_rating: targetRating,
      green_target_pct: Number(greenTargetPct) || 80,
    };
    try {
      const { data } = await axios.post(`${GS_API}/full-assessment`, payload, { timeout: 15000 });
      if (data && data.green_securitisation_assessment) {
        setLive(data.green_securitisation_assessment);
        setLiveStatus('live');
      } else {
        setLive(null);
        setLiveStatus('demo');
      }
    } catch (e) {
      setLive(null);
      setLiveStatus('demo');
    }
  };

  // Auto-run on mount and whenever a driving input changes (debounced), same
  // pattern as ai-governance/pages/AIGovernancePage.jsx live wiring.
  useEffect(() => {
    let cancelled = false;
    const t = setTimeout(() => { if (!cancelled) runAnalysis(); }, 300);
    return () => { cancelled = true; clearTimeout(t); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dealType, issuanceSize, ngfsScenario, taxonomyAlignmentPct, hasFramework, hasExternalReview,
      dnshEvidence, minSafeguardsEvidence, hasAllocationReport, hasImpactReport, esapRegistered,
      targetRating, greenTargetPct]);

  const liveGbs = live?.gbs_result || null;
  const liveVar = live?.climate_var_result || null;
  const liveEpc = live?.epc_result || null;
  const liveTranche = live?.tranche_result || null;

  // --- Seed-derived (demo) figures, used only when liveStatus !== 'live' ------
  const taxAlignmentPctSeed = Math.round(gbsRequirements[0].score);
  const gbsScoreSeed = Math.round(gbsRequirements.reduce((s, r) => s + r.score, 0) / gbsRequirements.length);
  const dealScoreSeed = Math.round(seed(91) * 20 + 72);
  const dealTierSeed = dealScoreSeed >= 85 ? 'Dark Green' : dealScoreSeed >= 72 ? 'Green' : dealScoreSeed >= 58 ? 'Light Green' : 'Amber';
  const greeniumSeed = Math.round(seed(92) * 10 + 8);
  const avgCrremAlignmentSeed = crremData[crremData.length - 2].alignment;
  const avgPhysicalVarSeed = (climateRiskData.reduce((s, r) => s + r.physicalVar, 0) / climateRiskData.length).toFixed(1);

  // --- Live-preferred display values (fall back to seed when API unavailable) -
  const gbsScore = liveGbs ? liveGbs.gbs_score : gbsScoreSeed;
  const taxAlignmentPct = liveGbs ? liveGbs.taxonomy_alignment_pct : taxAlignmentPctSeed;
  const gbsChecklist = liveGbs ? [
    { req: 'EU Taxonomy Alignment', detail: 'DNSH + Minimum Safeguards (Art 4 EU GBS)', score: liveGbs.component_scores.taxonomy_alignment, status: liveGbs.component_scores.taxonomy_alignment >= 70 },
    { req: 'Green Bond Framework', detail: 'Pre-issuance assessment per Art. 6', score: liveGbs.component_scores.green_bond_framework, status: liveGbs.component_scores.green_bond_framework >= 70 },
    { req: 'Reporting', detail: 'Post-issuance annual allocation report (Art 9-11)', score: liveGbs.component_scores.reporting, status: liveGbs.component_scores.reporting >= 70 },
    { req: 'External Review', detail: 'ESAP-registered External Reviewer (Art 14-20)', score: liveGbs.component_scores.external_review, status: liveGbs.component_scores.external_review >= 70 },
  ] : gbsRequirements;

  const climateRiskDataLive = liveVar ? liveVar.asset_breakdown.map((a, i) => ({
    asset: CLIMATE_ASSET_ORDER[i]?.label || a.asset_type,
    physicalVar: a.balance_m > 0 ? +((a.physical_var_contribution_m / a.balance_m) * 100).toFixed(2) : 0,
    transitionVar: a.balance_m > 0 ? +((a.transition_var_contribution_m / a.balance_m) * 100).toFixed(2) : 0,
    pdUplift: Math.round((a.climate_pd - a.base_pd) * 10000),
    lgdUplift: Math.round((a.climate_lgd - a.base_lgd) * 10000),
  })) : climateRiskData;

  const epcDataLive = liveEpc ? Object.keys(epcDistribution).map(band => ({
    band, value: Math.round(liveEpc.epc_distribution_pct?.[band] ?? epcDistribution[band]),
  })) : epcData;

  const dealScore = live ? live.green_securitisation_score : dealScoreSeed;
  const dealTier = live ? live.deal_tier : dealTierSeed;
  const dealTierColor = dealTier === 'Dark Green' ? 'green' : dealTier === 'Green' ? 'emerald' : dealTier === 'Light Green' ? 'blue' : dealTier === 'Amber' ? 'yellow' : 'red';
  const greenium = liveTranche ? liveTranche.greenium_estimate_bps : greeniumSeed;
  const avgCrremAlignment = liveEpc ? liveEpc.crrem_aligned_pct : avgCrremAlignmentSeed;
  const avgPhysicalVar = (climateRiskDataLive.reduce((s, r) => s + r.physicalVar, 0) / climateRiskDataLive.length).toFixed(1);

  const hazardColor = (level) => {
    if (level === 'High') return { bg: '#fee2e2', text: '#991b1b' };
    if (level === 'Medium') return { bg: '#fef3c7', text: '#92400e' };
    return { bg: '#d1fae5', text: '#065f46' };
  };

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#1b3a5c', margin: 0 }}>Green Securitisation</h1>
          <p style={{ color: '#6b7280', marginTop: 4, fontSize: 14 }}>EU GBS 2023/2631 · RMBS / ABS / CLO / CMBS · CRREM · Climate Pass-Through · E81</p>
        </div>
        <LiveBadge status={liveStatus} />
      </div>

      <div style={{ display: 'flex', gap: 4, marginBottom: 24, borderBottom: '1px solid #e5e7eb' }}>
        {TABS.map((t, i) => (
          <button key={i} onClick={() => setTab(i)} style={{
            padding: '10px 14px', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500,
            background: 'none', color: tab === i ? '#059669' : '#6b7280',
            borderBottom: tab === i ? '2px solid #059669' : '2px solid transparent',
          }}>{t}</button>
        ))}
      </div>

      {/* TAB 1 — Deal Structure */}
      {tab === 0 && (
        <div>
          <Section title="Deal Configuration">
            <Row>
              <Sel label="Structure Type" value={dealType} onChange={setDealType} options={DEAL_TYPES} />
              <Inp label="Total Issuance Size (€M)" value={issuanceSize} onChange={setIssuanceSize} type="number" placeholder="500" />
            </Row>
            <Btn onClick={runAnalysis} disabled={liveStatus === 'loading'}>{liveStatus === 'loading' ? 'Analysing…' : 'Re-run Live Analysis'}</Btn>
          </Section>

          {liveTranche && (
            <Section title="Live Tranche Waterfall (computed by E81 engine)" right={<LiveBadge status={liveStatus} />}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                <thead>
                  <tr style={{ background: '#f9fafb' }}>
                    {['Tranche', 'Rating', 'Pool Size (%)', 'Size (€M)', 'OC Req. (%)', 'CE Req. (%)', 'Greenium (bps)'].map(h => (
                      <th key={h} style={{ padding: '10px 12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb', fontWeight: 600, color: '#374151' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {liveTranche.tranche_waterfall.map((t, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #f3f4f6', background: t.is_target_tranche ? '#f0fdf4' : 'transparent' }}>
                      <td style={{ padding: '10px 12px', fontWeight: 600 }}>{t.description}{t.is_target_tranche && <Badge label="Target" color="green" />}</td>
                      <td style={{ padding: '10px 12px' }}><Badge label={t.target_rating} color="blue" /></td>
                      <td style={{ padding: '10px 12px', color: '#374151' }}>{t.size_pct_of_pool}%</td>
                      <td style={{ padding: '10px 12px', color: '#374151' }}>€ {t.size_m}M</td>
                      <td style={{ padding: '10px 12px', color: '#374151' }}>{t.oc_required_pct}%</td>
                      <td style={{ padding: '10px 12px', color: '#374151' }}>{t.ce_required_pct}%</td>
                      <td style={{ padding: '10px 12px', color: '#374151' }}>{t.greenium_bps || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div style={{ marginTop: 8, fontSize: 12, color: '#6b7280' }}>
                Green pool: € {liveTranche.green_pool_m}M of € {liveTranche.pool_size_m}M ({liveTranche.green_target_pct}%) ·
                Retention requirement: {liveTranche.retention_requirement_pct}% (STS Reg Art 6)
              </div>
            </Section>
          )}

          <Section title="Illustrative Reference Waterfall (static benchmark)">
            <Row gap={12}>
              <KpiCard label="Total Issuance" value={`€ ${issuanceSize}M`} sub="Pool size" accent />
              <KpiCard label="EU GBS Alignment" value={<Badge label="Aligned" color="green" />} sub="Pre-issuance" />
              <KpiCard label="Senior Tranche CE" value="25%" sub="Credit enhancement" />
              <KpiCard label="DNSH & Min. Safeguards" value={<Badge label="Compliant" color="green" />} sub="Art. 3 EU Taxonomy" />
            </Row>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={trancheData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" unit="%" />
                <YAxis type="category" dataKey="tranche" width={130} tick={{ fontSize: 12 }} />
                <Tooltip formatter={(val) => `${val}%`} />
                <Legend />
                <Bar dataKey="size" fill="#059669" name="Pool Size (%)" radius={[0, 4, 4, 0]} />
                <Bar dataKey="creditEnhancement" fill="#3b82f6" name="Credit Enhancement (%)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Section>

          <Section title="Tranche Economics (illustrative benchmark coupons)">
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr style={{ background: '#f9fafb' }}>
                  {['Tranche', 'Pool Size (%)', 'Credit Enhancement (%)', 'Indicative Coupon (%)', 'Rating'].map(h => (
                    <th key={h} style={{ padding: '10px 12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb', fontWeight: 600, color: '#374151' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {trancheData.map((r, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '10px 12px', fontWeight: 600 }} >
                      <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 2, background: r.color, marginRight: 8 }} />
                      {r.tranche}
                    </td>
                    <td style={{ padding: '10px 12px', color: '#374151' }}>{r.size}%</td>
                    <td style={{ padding: '10px 12px', color: '#374151' }}>{r.creditEnhancement}%</td>
                    <td style={{ padding: '10px 12px', color: '#374151' }}>{r.coupon}%</td>
                    <td style={{ padding: '10px 12px' }}>
                      <Badge label={i === 0 ? 'AAA' : i === 1 ? 'A' : i === 2 ? 'BB' : 'NR'} color={i === 0 ? 'green' : i === 1 ? 'blue' : i === 2 ? 'yellow' : 'red'} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Section>
        </div>
      )}

      {/* TAB 2 — EU GBS Compliance */}
      {tab === 1 && (
        <div>
          <Section title="EU GBS Art 19 Assessment Inputs">
            <Row>
              <div>
                <Inp label="Taxonomy Alignment (%)" value={taxonomyAlignmentPct} onChange={v => setTaxonomyAlignmentPct(v)} type="number" placeholder="72" />
                <Chk label="Green Bond Framework published (Art 6)" checked={hasFramework} onChange={setHasFramework} />
                <Chk label="External review obtained (Art 14-20)" checked={hasExternalReview} onChange={setHasExternalReview} />
              </div>
              <div>
                <Chk label="DNSH evidence documented" checked={dnshEvidence} onChange={setDnshEvidence} />
                <Chk label="Minimum Safeguards evidenced" checked={minSafeguardsEvidence} onChange={setMinSafeguardsEvidence} />
                <Chk label="Allocation report filed (Art 9)" checked={hasAllocationReport} onChange={setHasAllocationReport} />
                <Chk label="Impact report filed (Art 10)" checked={hasImpactReport} onChange={setHasImpactReport} />
                <Chk label="ESAP-registered reviewer" checked={esapRegistered} onChange={setEsapRegistered} />
              </div>
            </Row>
          </Section>

          <Section title="EU GBS Compliance Dashboard" right={<LiveBadge status={liveStatus} />}>
            <Row gap={12}>
              <KpiCard label="GBS Score" value={`${gbsScore}/100`} sub="4-requirement weighted score" accent />
              <KpiCard label="Taxonomy Alignment" value={`${taxAlignmentPct}%`} sub="Pool-level alignment" />
              <KpiCard label="DNSH" value={<Badge label={dnshEvidence ? 'Compliant' : 'Gap'} color={dnshEvidence ? 'green' : 'red'} />} sub="Do No Significant Harm" />
              <KpiCard label="Min. Safeguards" value={<Badge label={minSafeguardsEvidence ? 'Verified' : 'Gap'} color={minSafeguardsEvidence ? 'green' : 'red'} />} sub="Art. 18 EU Taxonomy" />
            </Row>
          </Section>

          <Section title="EU Taxonomy Alignment Gauge">
            <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
              <div style={{ flex: 1 }}>
                <div style={{ marginBottom: 8, fontSize: 13, color: '#374151' }}>Taxonomy Alignment: <strong>{taxAlignmentPct}%</strong></div>
                <div style={{ background: '#f3f4f6', borderRadius: 8, height: 24, overflow: 'hidden' }}>
                  <div style={{ width: `${taxAlignmentPct}%`, background: taxAlignmentPct >= 80 ? '#059669' : taxAlignmentPct >= 60 ? '#f59e0b' : '#ef4444', height: 24, borderRadius: 8, display: 'flex', alignItems: 'center', paddingLeft: 8 }}>
                    <span style={{ fontSize: 12, color: 'white', fontWeight: 600 }}>{taxAlignmentPct}%</span>
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#9ca3af', marginTop: 4 }}>
                  <span>0%</span><span>50%</span><span>100%</span>
                </div>
              </div>
            </div>
          </Section>

          <Section title="EU GBS Four-Requirement Checklist">
            {gbsChecklist.map((r, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', marginBottom: 8, border: `1px solid ${r.status ? '#bbf7d0' : '#fecaca'}`, borderRadius: 8, background: r.status ? '#f0fdf4' : '#fef2f2' }}>
                <span style={{ fontSize: 20, color: r.status ? '#059669' : '#ef4444' }}>{r.status ? '✓' : '✗'}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#1b3a5c' }}>{r.req}</div>
                  <div style={{ fontSize: 12, color: '#6b7280' }}>{r.detail}</div>
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#1b3a5c' }}>{r.score}/100</div>
                <Badge label={r.status ? 'Met' : 'Gap'} color={r.status ? 'green' : 'red'} />
              </div>
            ))}
          </Section>

          {liveGbs && liveGbs.gaps.length > 0 && (
            <Section title="Live Gap Analysis" right={<LiveBadge status={liveStatus} />}>
              {liveGbs.gaps.map((g, i) => (
                <div key={i} style={{ padding: '8px 12px', marginBottom: 6, background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 6, fontSize: 13, color: '#991b1b' }}>{g}</div>
              ))}
            </Section>
          )}

          <Section title="Taxonomy Alignment by Environmental Objective">
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr style={{ background: '#f9fafb' }}>
                  {['Objective', 'Alignment %', 'DNSH', 'Status'].map(h => (
                    <th key={h} style={{ padding: '10px 12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb', fontWeight: 600, color: '#374151' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  ['Climate Change Mitigation', Math.round(seed(51) * 20 + 72), true],
                  ['Climate Change Adaptation', Math.round(seed(52) * 25 + 55), true],
                  ['Water & Marine Resources', Math.round(seed(53) * 30 + 45), seed(53) > 0.4],
                  ['Circular Economy', Math.round(seed(54) * 30 + 40), seed(54) > 0.5],
                  ['Pollution Prevention', Math.round(seed(55) * 25 + 50), seed(55) > 0.45],
                  ['Biodiversity & Ecosystems', Math.round(seed(56) * 35 + 35), seed(56) > 0.55],
                ].map(([obj, pct, dnsh], i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '10px 12px', color: '#374151' }}>{obj}</td>
                    <td style={{ padding: '10px 12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 80, background: '#f3f4f6', borderRadius: 4, height: 6 }}>
                          <div style={{ width: `${pct}%`, background: pct >= 70 ? '#059669' : '#f59e0b', height: 6, borderRadius: 4 }} />
                        </div>
                        <span style={{ fontSize: 12, fontWeight: 600 }}>{pct}%</span>
                      </div>
                    </td>
                    <td style={{ padding: '10px 12px' }}><Badge label={dnsh ? 'Compliant' : 'Review'} color={dnsh ? 'green' : 'yellow'} /></td>
                    <td style={{ padding: '10px 12px' }}><Badge label={pct >= 70 ? 'Aligned' : pct >= 50 ? 'Partial' : 'Not Aligned'} color={pct >= 70 ? 'green' : pct >= 50 ? 'yellow' : 'red'} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Section>
        </div>
      )}

      {/* TAB 3 — Climate Risk Pass-Through */}
      {tab === 2 && (
        <div>
          <Section title="Climate Risk Inputs">
            <Row>
              <Sel label="NGFS Scenario" value={ngfsScenario} onChange={setNgfsScenario} options={NGFS_SCENARIOS} />
              <div />
            </Row>
          </Section>

          <Section title="Pool Physical VaR vs Transition VaR by Asset Type (%)" right={<LiveBadge status={liveStatus} />}>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={climateRiskDataLive}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="asset" tick={{ fontSize: 12 }} />
                <YAxis unit="%" />
                <Tooltip />
                <Legend />
                <Bar dataKey="physicalVar" fill="#ef4444" name="Physical VaR (%)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="transitionVar" fill="#f59e0b" name="Transition VaR (%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
            {liveVar && (
              <div style={{ marginTop: 8, fontSize: 12, color: '#6b7280' }}>
                {liveVar.scenario_description} · Pool climate VaR: {liveVar.climate_var_as_pct_pool}% of pool ·
                Recommended CE uplift: +{liveVar.ce_uplift_pct}pp (to {liveVar.ce_recommended_pct}%)
              </div>
            )}
          </Section>

          <Section title="PD / LGD Climate Uplift by Asset Type">
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr style={{ background: '#f9fafb' }}>
                  {['Asset Type', 'Physical VaR (%)', 'Transition VaR (%)', 'PD Uplift (bps)', 'LGD Uplift (bps)', 'Risk Level'].map(h => (
                    <th key={h} style={{ padding: '10px 12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb', fontWeight: 600, color: '#374151' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {climateRiskDataLive.map((r, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '10px 12px', fontWeight: 600, color: '#1b3a5c' }}>{r.asset}</td>
                    <td style={{ padding: '10px 12px', color: r.physicalVar > 3 ? '#dc2626' : '#374151' }}>{r.physicalVar}%</td>
                    <td style={{ padding: '10px 12px', color: r.transitionVar > 4 ? '#dc2626' : '#374151' }}>{r.transitionVar}%</td>
                    <td style={{ padding: '10px 12px', color: r.pdUplift > 15 ? '#dc2626' : '#374151' }}>{r.pdUplift} bps</td>
                    <td style={{ padding: '10px 12px', color: '#374151' }}>{r.lgdUplift} bps</td>
                    <td style={{ padding: '10px 12px' }}>
                      <Badge label={r.physicalVar + r.transitionVar > 7 ? 'High' : r.physicalVar + r.transitionVar > 4 ? 'Medium' : 'Low'}
                        color={r.physicalVar + r.transitionVar > 7 ? 'red' : r.physicalVar + r.transitionVar > 4 ? 'yellow' : 'green'} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Section>

          <Section title="Credit Enhancement Requirement — Base vs Climate Scenarios (%)">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={creditEnhancementComp}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis unit="%" />
                <Tooltip />
                <Legend />
                <Bar dataKey="senior" fill="#059669" name="Senior CE (%)" />
                <Bar dataKey="mezz" fill="#3b82f6" name="Mezz CE (%)" />
                <Bar dataKey="junior" fill="#ef4444" name="Junior CE (%)" />
              </BarChart>
            </ResponsiveContainer>
          </Section>
        </div>
      )}

      {/* TAB 4 — RMBS / ABS Analytics */}
      {tab === 3 && (
        <div>
          <Section title="EPC Band Distribution of Underlying Pool" right={<LiveBadge status={liveStatus} />}>
            <Row>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={epcDataLive} cx="50%" cy="50%" outerRadius={110} dataKey="value" label={({ band, value }) => `${band}: ${value}%`}>
                    {epcDataLive.map((_, i) => <Cell key={i} fill={PIE_COLORS_EPC[i]} />)}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
              <div>
                <KpiCard label="A+B EPC Share" value={`${epcDataLive[0].value + epcDataLive[1].value}%`} sub="Green eligible pool" accent />
                <div style={{ marginTop: 12 }}>
                  <KpiCard label="CRREM Alignment" value={`${avgCrremAlignment}%`} sub={liveEpc ? 'Live — CRREM v2.0 pathway' : 'Pool weighted average'} />
                </div>
                <div style={{ marginTop: 12, padding: '12px 16px', background: '#fef3c7', borderRadius: 8, border: '1px solid #fde68a' }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#92400e', marginBottom: 4 }}>EPC Upgrade Opportunity</div>
                  <div style={{ fontSize: 12, color: '#78350f' }}>
                    {epcDataLive[3].value + epcDataLive[4].value + epcDataLive[5].value + epcDataLive[6].value}% of pool (bands D-G) eligible for
                    retrofit financing — estimated greenium uplift of {Math.round(seed(81) * 5 + 4)} bps on upgraded tranche.
                  </div>
                </div>
                {liveEpc && (
                  <div style={{ marginTop: 12, fontSize: 12, color: '#6b7280' }}>
                    Weighted energy intensity: {liveEpc.weighted_energy_intensity_kwh_m2_yr} kWh/m²/yr (EU benchmark {liveEpc.benchmark_energy_intensity_kwh_m2_yr}) ·
                    Stranded asset risk (EPC E-G): {liveEpc.stranded_asset_risk_pct}% · Stranding year ({liveEpc.country_code}): {liveEpc.crrem_stranding_year_country}
                  </div>
                )}
              </div>
            </Row>
          </Section>

          <Section title="CRREM Alignment % Over Time (illustrative trend; live current-year figure above)">
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={crremData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="year" />
                <YAxis domain={[50, 100]} unit="%" />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="alignment" stroke="#059669" strokeWidth={2} dot={{ r: 5 }} name="CRREM Alignment (%)" />
              </LineChart>
            </ResponsiveContainer>
          </Section>

          <Section title="Physical Hazard Exposure by Geography">
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr style={{ background: '#f9fafb' }}>
                  {['Region', 'Flood Risk', 'Heat Risk', 'Subsidence', 'Wildfire', 'Pool Exposure'].map(h => (
                    <th key={h} style={{ padding: '10px 12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb', fontWeight: 600, color: '#374151' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {geoHazardData.map((r, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '10px 12px', fontWeight: 600, color: '#1b3a5c' }}>{r.region}</td>
                    {[r.flood, r.heat, r.subsidence, r.fire].map((h, j) => {
                      const c = hazardColor(h);
                      return (
                        <td key={j} style={{ padding: '10px 12px' }}>
                          <span style={{ padding: '2px 8px', borderRadius: 10, fontSize: 12, fontWeight: 600, background: c.bg, color: c.text }}>{h}</span>
                        </td>
                      );
                    })}
                    <td style={{ padding: '10px 12px', fontWeight: 600, color: '#1b3a5c' }}>{r.exposure}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Section>
        </div>
      )}

      {/* TAB 5 — Overview */}
      {tab === 4 && (
        <div>
          <Section title="Green Securitisation Deal Summary" right={<LiveBadge status={liveStatus} />}>
            <Row gap={12}>
              <KpiCard label="Deal Score" value={`${dealScore}/100`} sub="Composite green score" accent />
              <KpiCard label="Deal Tier" value={<Badge label={dealTier} color={dealTierColor} />} sub="Green classification" />
              <KpiCard label="Greenium Estimate" value={`${greenium} bps`} sub="vs conventional benchmark" />
              <KpiCard label="EU GBS Score" value={`${gbsScore}/100`} sub="4-requirement weighted" />
            </Row>
            <div style={{ marginTop: 12 }}>
              <Row gap={12}>
                <KpiCard label="Climate VaR (Physical)" value={`${avgPhysicalVar}%`} sub="Pool-level weighted avg" />
                <KpiCard label="CRREM Alignment" value={`${avgCrremAlignment}%`} sub="Current year" />
                <KpiCard label="EPC A+B Share" value={`${epcDataLive[0].value + epcDataLive[1].value}%`} sub="Green eligible mortgages" />
                <KpiCard label="Senior CE (Base)" value={liveTranche ? `${liveTranche.tranche_waterfall[0]?.ce_required_pct}%` : '25%'} sub="Credit enhancement floor" />
              </Row>
            </div>
            {live && live.priority_actions.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#1b3a5c', marginBottom: 8 }}>Live Priority Actions</div>
                {live.priority_actions.map((a, i) => (
                  <div key={i} style={{ padding: '8px 12px', marginBottom: 6, background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 6, fontSize: 13, color: '#92400e' }}>{a}</div>
                ))}
              </div>
            )}
          </Section>

          <Section title="Recommendation Summary">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {[
                { title: 'EU GBS Framework', body: `Taxonomy alignment at ${taxAlignmentPct}% — above 50% threshold. Commission ESAP-registered external reviewer to complete pre-issuance review.`, status: 'Action Required', color: 'yellow' },
                { title: 'EPC Pool Quality', body: `${epcDataLive[0].value + epcDataLive[1].value}% A/B rated. Consider ring-fenced green tranche for A-rated properties to maximise greenium of up to ${greenium + 4} bps.`, status: 'Opportunity', color: 'green' },
                { title: 'Climate Transition Risk', body: `${ngfsScenario.replace(/_/g, ' ')} scenario shows up to ${Math.max(...climateRiskDataLive.map(r => r.transitionVar))}% transition VaR. Senior CE sufficient under base; review under delayed transition.`, status: 'Monitor', color: 'blue' },
                { title: 'Post-Issuance Reporting', body: `Prepare annual allocation and impact report per EU GBS Art. 10. KPIs: energy savings (kWh), GHG avoided (tCO₂e), EPC upgrades completed.`, status: 'Planned', color: 'gray' },
              ].map((rec, i) => (
                <div key={i} style={{ padding: '14px 16px', border: '1px solid #e5e7eb', borderRadius: 8, background: 'white' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#1b3a5c' }}>{rec.title}</div>
                    <Badge label={rec.status} color={rec.color} />
                  </div>
                  <div style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.5 }}>{rec.body}</div>
                </div>
              ))}
            </div>
          </Section>
        </div>
      )}
    </div>
  );
}
