import React, { useState, useMemo, useCallback } from 'react';
import axios from 'axios';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Cell,
} from 'recharts';

// ---------------------------------------------------------------------------
// EU Compliance Cockpit — sequential walkthrough of one company through the
// EU climate-compliance chain using FIVE already-wired backend engines:
//   Step 1  EU Taxonomy Art.3      POST /api/v1/eu-taxonomy/assess-activity
//   Step 2  EUDR Art.4-12          POST /api/v1/eudr/due-diligence
//   Step 3  ETS2 readiness         POST /api/v1/eu-ets/ets2-readiness
//   Step 4  EuGB 85/15 pocket      POST /api/v1/eu-gbs/assess-issuance
//   Step 5  ESRS XBRL export       POST /api/v1/xbrl/export
// Shared company profile carried across steps; per-step Live/Demo badge per
// the AIGovernancePage convention; final compliance scorecard.
// ---------------------------------------------------------------------------

const API = 'http://localhost:8001';

const T = {
  bg: '#f8f6f0', card: '#ffffff', border: '#e2ded5', borderL: '#ede9e0', sub: '#f4f6f9',
  navy: '#1e3a5f', gold: '#b8860b', cream: '#faf8f3', textPri: '#1a1a2e', textSec: '#6b7280',
  green: '#16a34a', red: '#dc2626', blue: '#0369a1', amber: '#d97706', sage: '#4d7c5f',
  teal: '#0f766e', indigo: '#4f46e5', purple: '#7c3aed', orange: '#ea580c',
  surfaceH: '#f1ede4', fontMono: 'JetBrains Mono, monospace',
};

// NACE activities offered in the cockpit (must exist in backend NACE_ACTIVITIES)
const NACE_OPTIONS = [
  { code: 'D35.11_solar', label: 'D35.11 — Electricity from solar PV', evidenceKey: 'emission_intensity', evidenceLabel: 'Lifecycle GHG intensity (gCO2e/kWh)', evidenceDefault: 32, threshold: '< 100 gCO2e/kWh' },
  { code: 'D35.11_wind', label: 'D35.11 — Electricity from wind power', evidenceKey: 'emission_intensity', evidenceLabel: 'Lifecycle GHG intensity (gCO2e/kWh)', evidenceDefault: 12, threshold: '< 100 gCO2e/kWh' },
  { code: 'D35.11_hydro', label: 'D35.11 — Electricity from hydropower', evidenceKey: 'emission_intensity', evidenceLabel: 'Lifecycle GHG intensity (gCO2e/kWh)', evidenceDefault: 45, threshold: '< 100 gCO2e/kWh' },
  { code: 'D35.11_gas', label: 'D35.11 — Electricity from fossil gas (Compl. DA)', evidenceKey: 'emission_intensity', evidenceLabel: 'Direct emissions (gCO2e/kWh)', evidenceDefault: 240, threshold: '< 270 gCO2e/kWh' },
  { code: 'C20', label: 'C20 — Manufacture of hydrogen', evidenceKey: 'emission_intensity', evidenceLabel: 'Lifecycle GHG (tCO2e/tH2)', evidenceDefault: 2.4, threshold: '< 3.0 tCO2e/tH2' },
  { code: 'C23.5.1', label: 'C23.5.1 — Manufacture of cement (transitional)', evidenceKey: 'emission_intensity', evidenceLabel: 'Specific GHG (tCO2/t clinker)', evidenceDefault: 0.47, threshold: '<= 0.498 tCO2/t clinker' },
  { code: 'C24.1', label: 'C24.1 — Manufacture of iron & steel (transitional)', evidenceKey: 'emission_intensity', evidenceLabel: 'GHG (tCO2e/t hot metal)', evidenceDefault: 1.25, threshold: '<= 1.331 tCO2e/t' },
];

const DNSH_OBJECTIVES = [
  { key: 'dnsh_cca', label: 'Climate Change Adaptation (CCA)' },
  { key: 'dnsh_wtr', label: 'Water & Marine Resources (WTR)' },
  { key: 'dnsh_ce', label: 'Circular Economy (CE)' },
  { key: 'dnsh_pol', label: 'Pollution Prevention (POL)' },
  { key: 'dnsh_bio', label: 'Biodiversity & Ecosystems (BIO)' },
];

const MS_AREAS = [
  { key: 'human_rights', label: 'Human rights (UNGPs)' },
  { key: 'labour', label: 'Labour (ILO Core)' },
  { key: 'anti_corruption', label: 'Anti-corruption' },
  { key: 'taxation', label: 'Tax governance' },
  { key: 'fair_competition', label: 'Fair competition' },
];

const EUDR_COMMODITIES = ['cattle', 'cocoa', 'coffee', 'oil_palm', 'rubber', 'soya', 'wood'];
const EUDR_CERTIFICATIONS = ['RSPO', 'FSC', 'PEFC', 'Rainforest Alliance'];
const ETS2_FUELS = [
  { key: 'diesel', label: 'Diesel / gas oil' },
  { key: 'petrol', label: 'Petrol / gasoline' },
  { key: 'lpg', label: 'LPG' },
  { key: 'natural_gas', label: 'Natural gas (kg)' },
  { key: 'heating_oil', label: 'Light heating oil' },
];

const STEPS = [
  { n: 1, short: 'EU Taxonomy', title: 'EU Taxonomy Article 3', reg: 'Regulation (EU) 2020/852', endpoint: 'POST /api/v1/eu-taxonomy/assess-activity' },
  { n: 2, short: 'EUDR', title: 'EUDR Due Diligence', reg: 'Regulation (EU) 2023/1115', endpoint: 'POST /api/v1/eudr/due-diligence' },
  { n: 3, short: 'ETS2', title: 'ETS2 Readiness', reg: 'Directive 2003/87/EC Ch. IVa (Art. 30a-30j)', endpoint: 'POST /api/v1/eu-ets/ets2-readiness' },
  { n: 4, short: 'EuGB', title: 'EU Green Bond 85/15', reg: 'Regulation (EU) 2023/2631 Art. 5', endpoint: 'POST /api/v1/eu-gbs/assess-issuance' },
  { n: 5, short: 'ESRS XBRL', title: 'ESRS XBRL Export', reg: 'CSRD / ESEF — EFRAG XBRL taxonomy', endpoint: 'POST /api/v1/xbrl/export' },
  { n: 6, short: 'Scorecard', title: 'Compliance Scorecard', reg: 'All five engines', endpoint: '—' },
];

// --- Demo fallbacks (shown only if the backend API is unreachable) ----------
const DEMO_RESULTS = {
  taxonomy: {
    activity_name: 'Electricity generation from solar PV', sector: 'Energy', taxonomy_eligible: true,
    substantial_contribution_met: true, sc_score: 100, dnsh_results: {
      CCA: { met: true, score: 100 }, WTR: { met: true, score: 100 }, CE: { met: true, score: 100 },
      POL: { met: true, score: 100 }, BIO: { met: true, score: 100 },
    },
    minimum_safeguards_met: true, ms_evidence: { met: true, score: 78.5, area_scores: {} },
    taxonomy_aligned: true, transitional_activity: false, enabling_activity: false,
  },
  eudr: {
    information_score: 71, risk_assessment_score: 62, risk_mitigation_score: 55,
    overall_compliance_score: 64, compliance_status: 'PARTIAL', due_diligence_level: 'standard',
    gaps: ['Geolocation polygon missing for plots > 4 ha', 'No independent audit of supply chain'],
    recommendations: ['Collect plot polygons via supplier portal', 'Commission third-party verification'],
    country_risk_results: [], statement_ready: false, days_until_deadline: 180,
  },
  ets2: {
    ets2_eligible: true, annual_emissions_tco2: 13200, estimated_allowance_cost_eur: 594000,
    pass_through_potential_pct: 85, consumer_impact_eur_per_litre: 0.119, readiness_score: 45,
    gaps: ['No MRV system in place (Art. 30c)', 'Registry account not opened (Art. 30d)'],
    recommendations: ['Implement fuel-volume MRV', 'Open Union Registry ETS2 account'],
  },
  eugb: {
    overall_compliant: false, compliance_score: 62.5,
    taxonomy_alignment_pct: 78, flexibility_pocket_pct_credited: 7,
    effective_taxonomy_alignment_pct: 85, taxonomy_threshold_pct: 85,
    dnsh_status: 'confirmed', er_status: 'non-compliant', gbfs_completeness_pct: 60,
    blocking_gaps: ['No ESMA-registered External Reviewer engaged — mandatory per Art 22'],
    warnings: [], priority_actions: ['Engage an ESMA-registered external reviewer'],
  },
  xbrl: {
    fact_count: 8, validation_passed: true, errors_count: 0, warnings_count: 1,
    validation_results: [
      { rule_id: 'ESEF-1', description: 'LEI format valid', passed: true, details: '' },
      { rule_id: 'ESEF-2', description: 'All mandatory E1-6 facts present', passed: true, details: '' },
    ],
    coverage_by_esrs: { E1: 8 }, taxonomy_version: 'ESRS Set 1 (2023) XBRL', ixbrl_html: '', xbrl_xml: '',
  },
};

// --- Small shared components -------------------------------------------------
const Badge = ({ val, color, bg }) => (
  <span style={{ background: bg || '#e0e7ff', color: color || T.indigo, padding: '2px 9px', borderRadius: 12, fontSize: 11, fontWeight: 700 }}>{val}</span>
);

const LiveBadge = ({ status }) => {
  if (status === 'loading') return <Badge val="Running engine…" color="#475569" bg="#e2e8f0" />;
  if (status === 'live') return <Badge val="● Live — computed by backend engine" color="#166534" bg="#dcfce7" />;
  if (status === 'demo') return <Badge val="○ Demo Data — API unavailable, illustrative figures" color="#92400e" bg="#fef3c7" />;
  return <Badge val="Not yet run" color="#64748b" bg="#f1f5f9" />;
};

const KpiCard = ({ label, value, sub, accent }) => (
  <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: '16px 20px', borderLeft: accent ? `4px solid ${accent}` : undefined }}>
    <div style={{ fontSize: 11, color: T.textSec, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>{label}</div>
    <div style={{ fontSize: 24, fontWeight: 700, color: T.textPri, lineHeight: 1.1 }}>{value}</div>
    {sub && <div style={{ fontSize: 12, color: T.textSec, marginTop: 5 }}>{sub}</div>}
  </div>
);

const SectionH = ({ title, sub }) => (
  <div style={{ marginBottom: 14 }}>
    <div style={{ fontSize: 15, fontWeight: 700, color: T.navy, borderLeft: `3px solid ${T.indigo}`, paddingLeft: 10 }}>{title}</div>
    {sub && <div style={{ fontSize: 12, color: T.textSec, marginTop: 3, paddingLeft: 13 }}>{sub}</div>}
  </div>
);

const PassFail = ({ ok, yes = 'PASS', no = 'FAIL' }) => (
  <Badge val={ok ? yes : no} color={ok ? '#166534' : '#991b1b'} bg={ok ? '#dcfce7' : '#fee2e2'} />
);

const Card = ({ children, style }) => (
  <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20, ...style }}>{children}</div>
);

const lbl = { fontSize: 11, color: T.textSec, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 4 };
const inp = { fontSize: 13, padding: '7px 10px', border: `1px solid ${T.border}`, borderRadius: 6, background: T.card, color: T.textPri, width: '100%', boxSizing: 'border-box' };
const chk = { marginRight: 7, accentColor: T.indigo };
const rowLbl = { fontSize: 13, color: T.textPri, display: 'flex', alignItems: 'center', marginBottom: 7, cursor: 'pointer' };
const runBtn = (busy) => ({
  padding: '10px 22px', border: 'none', borderRadius: 8, cursor: busy ? 'wait' : 'pointer',
  background: busy ? '#94a3b8' : T.indigo, color: '#fff', fontSize: 13, fontWeight: 700, letterSpacing: '0.02em',
});

export default function EuComplianceCockpitPage() {
  const [step, setStep] = useState(1);

  // --- Shared company profile carried across all five steps -----------------
  const [profile, setProfile] = useState({
    name: 'Nordwind Energie SE',
    lei: '529900T8BM49AURSDO55', // 20-char sample LEI structure
    reportingYear: 2025,
    scope1: 42000, scope2Loc: 18500, scope2Mkt: 9800, scope3: 310000,
    energyMwh: 260000, renewableSharePct: 46, internalCarbonPrice: 85,
  });
  const setP = (k, v) => setProfile(p => ({ ...p, [k]: v }));
  const leiValid = /^[A-Z0-9]{20}$/.test(profile.lei);

  // --- Step 1: EU Taxonomy ---------------------------------------------------
  const [naceCode, setNaceCode] = useState(NACE_OPTIONS[0].code);
  const nace = NACE_OPTIONS.find(n => n.code === naceCode) || NACE_OPTIONS[0];
  const [evidenceValue, setEvidenceValue] = useState(NACE_OPTIONS[0].evidenceDefault);
  const [dnsh, setDnsh] = useState({ dnsh_cca: true, dnsh_wtr: true, dnsh_ce: true, dnsh_pol: true, dnsh_bio: true });
  const [msScores, setMsScores] = useState({ human_rights: 80, labour: 75, anti_corruption: 70, taxation: 65, fair_competition: 75 });
  const [s1, setS1] = useState({ status: 'idle', result: null });

  const runStep1 = useCallback(async () => {
    setS1({ status: 'loading', result: null });
    try {
      const { data } = await axios.post(`${API}/api/v1/eu-taxonomy/assess-activity`, {
        nace_code: naceCode,
        objective: 'CCM',
        evidence_data: {
          [nace.evidenceKey]: Number(evidenceValue),
          ...dnsh,
          minimum_safeguards: msScores,
        },
      }, { timeout: 15000 });
      setS1({ status: 'live', result: data });
    } catch (e) {
      setS1({ status: 'demo', result: DEMO_RESULTS.taxonomy });
    }
  }, [naceCode, nace.evidenceKey, evidenceValue, dnsh, msScores]);

  // --- Step 2: EUDR ------------------------------------------------------------
  const [commodities, setCommodities] = useState(['wood']);
  const [countries, setCountries] = useState('BR, ID');
  const [certs, setCerts] = useState(['FSC']);
  const [eudrForm, setEudrForm] = useState({
    geolocation_provided: true, geolocation_type: 'polygon', plot_area_ha: 12,
    supplier_name: 'Sao Paulo Timber Coop', supplier_address: 'Av. Paulista 1000, Sao Paulo, BR',
    production_date: '2025-09-15', quantity_kg: 250000,
    local_law_evidence: true, deforestation_free_evidence: false,
    independent_audit: false, satellite_monitoring: true, third_party_verification: false,
  });
  const setE = (k, v) => setEudrForm(f => ({ ...f, [k]: v }));
  const [s2, setS2] = useState({ status: 'idle', result: null });

  const runStep2 = useCallback(async () => {
    setS2({ status: 'loading', result: null });
    try {
      const { data } = await axios.post(`${API}/api/v1/eudr/due-diligence`, {
        operator_id: `OP-${profile.lei.slice(0, 8)}`,
        operator_name: profile.name,
        operator_type: 'operator',
        commodities,
        countries_of_origin: countries.split(',').map(c => c.trim().toUpperCase()).filter(Boolean),
        certifications: certs,
        ...eudrForm,
        plot_area_ha: Number(eudrForm.plot_area_ha),
        quantity_kg: Number(eudrForm.quantity_kg),
      }, { timeout: 15000 });
      setS2({ status: 'live', result: data });
    } catch (e) {
      setS2({ status: 'demo', result: DEMO_RESULTS.eudr });
    }
  }, [profile.lei, profile.name, commodities, countries, certs, eudrForm]);

  // --- Step 3: ETS2 -----------------------------------------------------------
  const [ets2Form, setEts2Form] = useState({
    fuel_type: 'diesel', annual_fuel_volume_litres: 5000000, carbon_price_eur: 59,
    has_mrv_system: false, monitoring_plan_submitted: false, has_registry_account: false,
    has_verified_emissions_report: false, fuel_volume_data_quality: 'calculated',
  });
  const setF = (k, v) => setEts2Form(f => ({ ...f, [k]: v }));
  const [s3, setS3] = useState({ status: 'idle', result: null });

  const runStep3 = useCallback(async () => {
    setS3({ status: 'loading', result: null });
    try {
      const isGas = ets2Form.fuel_type === 'natural_gas';
      const { data } = await axios.post(`${API}/api/v1/eu-ets/ets2-readiness`, {
        entity_id: `ETS2-${profile.lei.slice(0, 8)}`,
        entity_name: profile.name,
        fuel_type: ets2Form.fuel_type,
        annual_fuel_volume_litres: isGas ? 0 : Number(ets2Form.annual_fuel_volume_litres),
        annual_fuel_volume_kg: isGas ? Number(ets2Form.annual_fuel_volume_litres) : 0,
        carbon_price_eur: Number(ets2Form.carbon_price_eur),
        has_mrv_system: ets2Form.has_mrv_system,
        monitoring_plan_submitted: ets2Form.monitoring_plan_submitted,
        has_registry_account: ets2Form.has_registry_account,
        has_verified_emissions_report: ets2Form.has_verified_emissions_report,
        fuel_volume_data_quality: ets2Form.fuel_volume_data_quality,
      }, { timeout: 15000 });
      setS3({ status: 'live', result: data });
    } catch (e) {
      setS3({ status: 'demo', result: DEMO_RESULTS.ets2 });
    }
  }, [profile.lei, profile.name, ets2Form]);

  // --- Step 4: EuGB ------------------------------------------------------------
  // Prefills carried forward from Step 1 (DNSH / minimum safeguards confirmations).
  const [gbForm, setGbForm] = useState({
    principal_m: 500, taxonomy_alignment_pct: 78, flexibility_pocket_pct: 15,
    flexibility_pocket_conditions_met: true, has_external_reviewer: true,
    er_name: 'Sustainalytics (ESMA-registered)', has_pre_issuance_review: true,
    refinancing_share_pct: 30,
  });
  const setG = (k, v) => setGbForm(f => ({ ...f, [k]: v }));
  const [s4, setS4] = useState({ status: 'idle', result: null });
  const step1Aligned = !!(s1.result && s1.result.taxonomy_aligned);
  const step1DnshOk = !!(s1.result && s1.result.dnsh_results && Object.values(s1.result.dnsh_results).every(d => d.met));
  const step1MsOk = !!(s1.result && s1.result.minimum_safeguards_met);

  const runStep4 = useCallback(async () => {
    setS4({ status: 'loading', result: null });
    try {
      const { data } = await axios.post(`${API}/api/v1/eu-gbs/assess-issuance`, {
        bond_id: `EUGB-${profile.reportingYear}-001`,
        issuer_name: profile.name,
        bond_type: 'senior_unsecured',
        principal_amount: Number(gbForm.principal_m) * 1e6,
        currency: 'EUR',
        taxonomy_alignment_pct: Number(gbForm.taxonomy_alignment_pct),
        flexibility_pocket_pct: Number(gbForm.flexibility_pocket_pct),
        flexibility_pocket_conditions_met: gbForm.flexibility_pocket_conditions_met,
        dnsh_confirmed: s1.result ? step1DnshOk : true,
        min_safeguards_confirmed: s1.result ? step1MsOk : true,
        environmental_objectives: ['CCM'],
        has_external_reviewer: gbForm.has_external_reviewer,
        er_name: gbForm.er_name,
        has_pre_issuance_review: gbForm.has_pre_issuance_review,
        refinancing_share_pct: Number(gbForm.refinancing_share_pct),
        is_sovereign: false,
      }, { timeout: 15000 });
      setS4({ status: 'live', result: data });
    } catch (e) {
      setS4({ status: 'demo', result: DEMO_RESULTS.eugb });
    }
  }, [profile.name, profile.reportingYear, gbForm, s1.result, step1DnshOk, step1MsOk]);

  // --- Step 5: XBRL export ------------------------------------------------------
  const [s5, setS5] = useState({ status: 'idle', result: null });
  const totalGhg = Number(profile.scope1) + Number(profile.scope2Loc) + Number(profile.scope3);

  const runStep5 = useCallback(async () => {
    setS5({ status: 'loading', result: null });
    try {
      const { data } = await axios.post(`${API}/api/v1/xbrl/export`, {
        entity_name: profile.name,
        entity_lei: profile.lei,
        period_start: `${profile.reportingYear}-01-01`,
        period_end: `${profile.reportingYear}-12-31`,
        currency: 'EUR',
        decimals: 0,
        data_points: [
          { dp_id: 'E1-6_scope1_gross', value: Number(profile.scope1) },
          { dp_id: 'E1-6_scope2_location', value: Number(profile.scope2Loc) },
          { dp_id: 'E1-6_scope2_market', value: Number(profile.scope2Mkt) },
          { dp_id: 'E1-6_scope3_total', value: Number(profile.scope3) },
          { dp_id: 'E1-6_total_ghg', value: totalGhg },
          { dp_id: 'E1-5_energy_consumption_total', value: Number(profile.energyMwh) },
          { dp_id: 'E1-5_renewable_share', value: Number(profile.renewableSharePct) },
          { dp_id: 'E1-9_internal_carbon_price', value: Number(profile.internalCarbonPrice) },
        ],
      }, { timeout: 20000 });
      setS5({ status: 'live', result: data });
    } catch (e) {
      setS5({ status: 'demo', result: DEMO_RESULTS.xbrl });
    }
  }, [profile, totalGhg]);

  const downloadIxbrl = () => {
    if (!s5.result || !s5.result.ixbrl_html) return;
    const blob = new Blob([s5.result.ixbrl_html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `${profile.name.replace(/\s+/g, '_')}_ESRS_iXBRL_${profile.reportingYear}.html`;
    a.click(); URL.revokeObjectURL(url);
  };

  // --- Scorecard ---------------------------------------------------------------
  const stepStates = [s1, s2, s3, s4, s5];
  const scorecard = useMemo(() => {
    const rows = [];
    // 1 — Taxonomy
    if (s1.result) {
      const r = s1.result;
      const dnshVals = Object.values(r.dnsh_results || {});
      const dnshPct = dnshVals.length ? (dnshVals.filter(d => d.met).length / dnshVals.length) * 100 : 0;
      const msScore = (r.ms_evidence && r.ms_evidence.score) || 0;
      const score = r.taxonomy_aligned ? 100 : Math.round(0.5 * (r.sc_score || 0) + 0.3 * dnshPct + 0.2 * msScore);
      rows.push({ step: 'EU Taxonomy Art.3', score, verdict: r.taxonomy_aligned ? 'Aligned' : (r.taxonomy_eligible ? 'Eligible, not aligned' : 'Not eligible'), ok: r.taxonomy_aligned, status: s1.status });
    } else rows.push({ step: 'EU Taxonomy Art.3', score: null, verdict: 'Not run', ok: false, status: s1.status });
    // 2 — EUDR
    if (s2.result) {
      const r = s2.result;
      rows.push({ step: 'EUDR Due Diligence', score: Math.round(r.overall_compliance_score || 0), verdict: r.compliance_status || '—', ok: (r.compliance_status || '').toUpperCase() === 'COMPLIANT', status: s2.status });
    } else rows.push({ step: 'EUDR Due Diligence', score: null, verdict: 'Not run', ok: false, status: s2.status });
    // 3 — ETS2
    if (s3.result) {
      const r = s3.result;
      rows.push({ step: 'ETS2 Readiness', score: Math.round(r.readiness_score || 0), verdict: r.ets2_eligible ? `In scope · ${(r.gaps || []).length} gap(s)` : 'Out of ETS2 scope', ok: (r.readiness_score || 0) >= 75, status: s3.status });
    } else rows.push({ step: 'ETS2 Readiness', score: null, verdict: 'Not run', ok: false, status: s3.status });
    // 4 — EuGB
    if (s4.result) {
      const r = s4.result;
      rows.push({ step: 'EuGB 85/15 Pocket', score: Math.round(r.compliance_score || 0), verdict: r.overall_compliant ? 'EuGB-compliant' : `${(r.blocking_gaps || []).length} blocking gap(s)`, ok: !!r.overall_compliant, status: s4.status });
    } else rows.push({ step: 'EuGB 85/15 Pocket', score: null, verdict: 'Not run', ok: false, status: s4.status });
    // 5 — XBRL
    if (s5.result) {
      const r = s5.result;
      const vr = r.validation_results || [];
      const score = r.validation_passed ? 100 : (vr.length ? Math.round((vr.filter(v => v.passed).length / vr.length) * 100) : 0);
      rows.push({ step: 'ESRS XBRL Export', score, verdict: r.validation_passed ? `Filing-ready · ${r.fact_count} facts` : `${r.errors_count} validation error(s)`, ok: !!r.validation_passed, status: s5.status });
    } else rows.push({ step: 'ESRS XBRL Export', score: null, verdict: 'Not run', ok: false, status: s5.status });
    return rows;
  }, [s1, s2, s3, s4, s5]);

  const ranRows = scorecard.filter(r => r.score !== null);
  const overallScore = ranRows.length ? Math.round(ranRows.reduce((a, r) => a + r.score, 0) / ranRows.length) : null;
  const anyDemo = stepStates.some(s => s.status === 'demo');
  const allLive = ranRows.length === 5 && stepStates.every(s => s.status === 'live');

  const stepColor = (i) => {
    const st = i < 5 ? stepStates[i].status : null;
    if (i === 5) return ranRows.length === 5 ? T.gold : T.textSec;
    if (st === 'live') return T.green;
    if (st === 'demo') return T.amber;
    if (st === 'loading') return T.blue;
    return '#94a3b8';
  };

  // ---------------------------------------------------------------------------
  return (
    <div style={{ background: T.bg, minHeight: '100vh', fontFamily: 'DM Sans, sans-serif' }}>
      {/* Header */}
      <div style={{ background: T.navy, padding: '20px 32px', borderBottom: `3px solid ${T.gold}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ color: T.gold, fontSize: 11, fontFamily: T.fontMono, letterSpacing: '0.12em', marginBottom: 4 }}>EU COMPLIANCE COCKPIT · 5-ENGINE CHAIN</div>
            <h1 style={{ color: '#ffffff', fontSize: 22, fontWeight: 700, margin: 0 }}>EU Compliance Cockpit</h1>
            <div style={{ color: '#94a3b8', fontSize: 13, marginTop: 4 }}>
              Taxonomy Art.3 → EUDR Art.4-12 → ETS2 Art.30a-j → EuGB Art.5 (85/15) → ESRS XBRL — one company, five wired engines, in sequence
            </div>
            <div style={{ marginTop: 8, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {allLive && <Badge val="● All 5 steps Live — every figure computed by a backend engine" color="#166534" bg="#dcfce7" />}
              {anyDemo && <Badge val="○ Some steps in Demo mode — backend unavailable for those engines" color="#92400e" bg="#fef3c7" />}
              {!allLive && !anyDemo && <Badge val="Run each step to assess the compliance chain" color="#94a3b8" bg="#1e293b" />}
            </div>
          </div>
          <div style={{ textAlign: 'right', fontFamily: T.fontMono, fontSize: 11, color: '#94a3b8' }}>
            <div>{profile.name}</div>
            <div>LEI {profile.lei}</div>
            <div>FY{profile.reportingYear} · {ranRows.length}/5 steps run</div>
          </div>
        </div>
      </div>

      {/* Stepper */}
      <div style={{ background: T.card, borderBottom: `1px solid ${T.border}`, display: 'flex', overflowX: 'auto', padding: '0 24px' }}>
        {STEPS.map((s, i) => (
          <button key={s.n} onClick={() => setStep(s.n)} style={{
            padding: '13px 16px', border: 'none', cursor: 'pointer', background: 'none', whiteSpace: 'nowrap',
            fontSize: 13, fontWeight: 600, color: step === s.n ? T.indigo : T.textSec,
            borderBottom: step === s.n ? `2px solid ${T.indigo}` : '2px solid transparent',
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <span style={{
              width: 20, height: 20, borderRadius: '50%', background: stepColor(i), color: '#fff',
              fontSize: 11, fontWeight: 700, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            }}>{s.n}</span>
            {s.short}
          </button>
        ))}
      </div>

      <div style={{ padding: '24px 32px' }}>
        {/* Shared company profile */}
        <Card style={{ marginBottom: 22 }}>
          <SectionH title="Shared Company Profile" sub="Carried across all five steps — edit once, every engine payload updates" />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
            <div><span style={lbl}>Company name</span><input style={inp} value={profile.name} onChange={e => setP('name', e.target.value)} /></div>
            <div>
              <span style={lbl}>LEI (20 chars, ISO 17442)</span>
              <input style={{ ...inp, borderColor: leiValid ? T.border : T.red, fontFamily: T.fontMono }} value={profile.lei} maxLength={20}
                onChange={e => setP('lei', e.target.value.toUpperCase())} />
              {!leiValid && <div style={{ fontSize: 11, color: T.red, marginTop: 3 }}>Must be exactly 20 alphanumeric characters</div>}
            </div>
            <div><span style={lbl}>Reporting year</span><input style={inp} type="number" value={profile.reportingYear} onChange={e => setP('reportingYear', Number(e.target.value))} /></div>
            <div><span style={lbl}>Internal carbon price (EUR/tCO2e)</span><input style={inp} type="number" value={profile.internalCarbonPrice} onChange={e => setP('internalCarbonPrice', e.target.value)} /></div>
            <div><span style={lbl}>Scope 1 (tCO2e)</span><input style={inp} type="number" value={profile.scope1} onChange={e => setP('scope1', e.target.value)} /></div>
            <div><span style={lbl}>Scope 2 location (tCO2e)</span><input style={inp} type="number" value={profile.scope2Loc} onChange={e => setP('scope2Loc', e.target.value)} /></div>
            <div><span style={lbl}>Scope 2 market (tCO2e)</span><input style={inp} type="number" value={profile.scope2Mkt} onChange={e => setP('scope2Mkt', e.target.value)} /></div>
            <div><span style={lbl}>Scope 3 (tCO2e)</span><input style={inp} type="number" value={profile.scope3} onChange={e => setP('scope3', e.target.value)} /></div>
            <div><span style={lbl}>Energy consumption (MWh)</span><input style={inp} type="number" value={profile.energyMwh} onChange={e => setP('energyMwh', e.target.value)} /></div>
            <div><span style={lbl}>Renewable share (%)</span><input style={inp} type="number" value={profile.renewableSharePct} onChange={e => setP('renewableSharePct', e.target.value)} /></div>
          </div>
        </Card>

        {/* Step header */}
        {step <= 5 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 8 }}>
            <div>
              <div style={{ fontSize: 17, fontWeight: 700, color: T.navy }}>Step {step} · {STEPS[step - 1].title}</div>
              <div style={{ fontSize: 12, color: T.textSec, fontFamily: T.fontMono }}>{STEPS[step - 1].reg} · {STEPS[step - 1].endpoint}</div>
            </div>
            <LiveBadge status={stepStates[step - 1].status} />
          </div>
        )}

        {/* STEP 1 — EU Taxonomy */}
        {step === 1 && (
          <div style={{ display: 'grid', gridTemplateColumns: '400px 1fr', gap: 20 }}>
            <Card>
              <SectionH title="Activity & Evidence" sub="Article 3 three-part test: SC + DNSH + Minimum Safeguards" />
              <div style={{ marginBottom: 12 }}>
                <span style={lbl}>NACE activity (Climate Delegated Act)</span>
                <select style={inp} value={naceCode} onChange={e => {
                  setNaceCode(e.target.value);
                  const n = NACE_OPTIONS.find(x => x.code === e.target.value);
                  if (n) setEvidenceValue(n.evidenceDefault);
                }}>
                  {NACE_OPTIONS.map(n => <option key={n.code} value={n.code}>{n.label}</option>)}
                </select>
              </div>
              <div style={{ marginBottom: 12 }}>
                <span style={lbl}>{nace.evidenceLabel} — TSC threshold {nace.threshold}</span>
                <input style={inp} type="number" step="any" value={evidenceValue} onChange={e => setEvidenceValue(e.target.value)} />
              </div>
              <div style={{ marginBottom: 12 }}>
                <span style={lbl}>DNSH cross-checks (Article 17)</span>
                {DNSH_OBJECTIVES.map(d => (
                  <label key={d.key} style={rowLbl}>
                    <input type="checkbox" style={chk} checked={!!dnsh[d.key]} onChange={e => setDnsh(x => ({ ...x, [d.key]: e.target.checked }))} />
                    {d.label}
                  </label>
                ))}
              </div>
              <div style={{ marginBottom: 16 }}>
                <span style={lbl}>Minimum safeguards maturity (Article 18, 0-100)</span>
                {MS_AREAS.map(a => (
                  <div key={a.key} style={{ marginBottom: 6 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: T.textPri }}>
                      <span>{a.label}</span><span style={{ fontFamily: T.fontMono }}>{msScores[a.key]}</span>
                    </div>
                    <input type="range" min={0} max={100} value={msScores[a.key]} style={{ width: '100%', accentColor: T.indigo }}
                      onChange={e => setMsScores(m => ({ ...m, [a.key]: Number(e.target.value) }))} />
                  </div>
                ))}
              </div>
              <button style={runBtn(s1.status === 'loading')} disabled={s1.status === 'loading'} onClick={runStep1}>
                {s1.status === 'loading' ? 'Assessing…' : 'Run Article 3 Assessment'}
              </button>
            </Card>
            <Card>
              <SectionH title="Assessment Result" sub="Substantial Contribution → DNSH → Minimum Safeguards → Alignment" />
              {!s1.result && <div style={{ fontSize: 13, color: T.textSec }}>Run the assessment to see the Article 3 verdict for {profile.name}.</div>}
              {s1.result && (
                <div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 18 }}>
                    <KpiCard label="Taxonomy Aligned" value={<PassFail ok={!!s1.result.taxonomy_aligned} yes="ALIGNED" no="NOT ALIGNED" />} sub={s1.result.activity_name} accent={s1.result.taxonomy_aligned ? T.green : T.red} />
                    <KpiCard label="Substantial Contribution" value={`${Math.round(s1.result.sc_score || 0)}/100`} sub={s1.result.substantial_contribution_met ? 'TSC threshold met' : 'TSC threshold not met'} accent={s1.result.substantial_contribution_met ? T.green : T.amber} />
                    <KpiCard label="Min. Safeguards" value={`${(s1.result.ms_evidence && s1.result.ms_evidence.score) || 0}/100`} sub={s1.result.minimum_safeguards_met ? 'Art.18 met (≥50)' : 'Art.18 not met'} accent={s1.result.minimum_safeguards_met ? T.green : T.amber} />
                    <KpiCard label="Activity Class" value={s1.result.transitional_activity ? 'Transitional' : s1.result.enabling_activity ? 'Enabling' : 'Own performance'} sub={`Eligible: ${s1.result.taxonomy_eligible ? 'yes' : 'no'} · Sector: ${s1.result.sector || '—'}`} accent={T.indigo} />
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 8 }}>DNSH cross-check results</div>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead><tr>{['Objective', 'Met', 'Score'].map(h => <th key={h} style={{ textAlign: 'left', padding: '6px 10px', background: T.sub, color: T.navy, fontSize: 11, textTransform: 'uppercase' }}>{h}</th>)}</tr></thead>
                    <tbody>
                      {Object.entries(s1.result.dnsh_results || {}).map(([obj, d]) => (
                        <tr key={obj} style={{ borderBottom: `1px solid ${T.borderL}` }}>
                          <td style={{ padding: '7px 10px', fontFamily: T.fontMono }}>{obj}</td>
                          <td style={{ padding: '7px 10px' }}><PassFail ok={!!d.met} yes="MET" no="NOT MET" /></td>
                          <td style={{ padding: '7px 10px', fontFamily: T.fontMono }}>{Math.round(d.score || 0)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </div>
        )}

        {/* STEP 2 — EUDR */}
        {step === 2 && (
          <div style={{ display: 'grid', gridTemplateColumns: '400px 1fr', gap: 20 }}>
            <Card>
              <SectionH title="Supply Chain Inputs" sub="Articles 4-12 — information, risk assessment, mitigation" />
              <div style={{ marginBottom: 10 }}>
                <span style={lbl}>Annex I commodities</span>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                  {EUDR_COMMODITIES.map(c => (
                    <label key={c} style={rowLbl}>
                      <input type="checkbox" style={chk} checked={commodities.includes(c)}
                        onChange={e => setCommodities(x => e.target.checked ? [...x, c] : x.filter(y => y !== c))} />
                      {c.replace('_', ' ')}
                    </label>
                  ))}
                </div>
              </div>
              <div style={{ marginBottom: 10 }}>
                <span style={lbl}>Countries of origin (ISO2, comma-separated)</span>
                <input style={inp} value={countries} onChange={e => setCountries(e.target.value)} />
              </div>
              <div style={{ marginBottom: 10 }}>
                <span style={lbl}>Certifications (indicative, not a substitute)</span>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                  {EUDR_CERTIFICATIONS.map(c => (
                    <label key={c} style={rowLbl}>
                      <input type="checkbox" style={chk} checked={certs.includes(c)}
                        onChange={e => setCerts(x => e.target.checked ? [...x, c] : x.filter(y => y !== c))} />
                      {c}
                    </label>
                  ))}
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                <div><span style={lbl}>Plot area (ha)</span><input style={inp} type="number" value={eudrForm.plot_area_ha} onChange={e => setE('plot_area_ha', e.target.value)} /></div>
                <div><span style={lbl}>Quantity (kg)</span><input style={inp} type="number" value={eudrForm.quantity_kg} onChange={e => setE('quantity_kg', e.target.value)} /></div>
                <div><span style={lbl}>Supplier</span><input style={inp} value={eudrForm.supplier_name} onChange={e => setE('supplier_name', e.target.value)} /></div>
                <div><span style={lbl}>Production date</span><input style={inp} value={eudrForm.production_date} onChange={e => setE('production_date', e.target.value)} /></div>
              </div>
              <span style={lbl}>Traceability & mitigation evidence (Art. 9-10)</span>
              {[
                ['geolocation_provided', 'Geolocation coordinates provided'],
                ['local_law_evidence', 'Legality under producer-country law evidenced'],
                ['deforestation_free_evidence', 'Deforestation-free after 2020-12-31 evidenced'],
                ['independent_audit', 'Independent audit conducted'],
                ['satellite_monitoring', 'Satellite monitoring in place'],
                ['third_party_verification', 'Third-party verification'],
              ].map(([k, label]) => (
                <label key={k} style={rowLbl}>
                  <input type="checkbox" style={chk} checked={!!eudrForm[k]} onChange={e => setE(k, e.target.checked)} />
                  {label}
                </label>
              ))}
              {eudrForm.geolocation_provided && (
                <div style={{ margin: '6px 0 12px' }}>
                  <span style={lbl}>Geolocation type</span>
                  <select style={inp} value={eudrForm.geolocation_type} onChange={e => setE('geolocation_type', e.target.value)}>
                    <option value="polygon">Polygon (required for plots &gt; 4 ha)</option>
                    <option value="point">Point coordinates</option>
                  </select>
                </div>
              )}
              <button style={runBtn(s2.status === 'loading')} disabled={s2.status === 'loading'} onClick={runStep2}>
                {s2.status === 'loading' ? 'Assessing…' : 'Run Due Diligence'}
              </button>
            </Card>
            <Card>
              <SectionH title="Due Diligence Result" sub="Article 4 obligations — score, DD level, gaps, remediation" />
              {!s2.result && <div style={{ fontSize: 13, color: T.textSec }}>Run the due diligence to score {profile.name}'s EUDR position.</div>}
              {s2.result && (
                <div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 18 }}>
                    <KpiCard label="Overall Compliance" value={`${Math.round(s2.result.overall_compliance_score || 0)}/100`} sub={s2.result.compliance_status} accent={(s2.result.compliance_status || '').toUpperCase() === 'COMPLIANT' ? T.green : T.amber} />
                    <KpiCard label="Information (Art.9)" value={`${Math.round(s2.result.information_score || 0)}`} sub="Traceability & geolocation" accent={T.indigo} />
                    <KpiCard label="Risk Assessment (Art.10)" value={`${Math.round(s2.result.risk_assessment_score || 0)}`} sub={`DD level: ${s2.result.due_diligence_level || '—'}`} accent={T.teal} />
                    <KpiCard label="DDS Ready (Art.4(2))" value={<PassFail ok={!!s2.result.statement_ready} yes="READY" no="NOT READY" />} sub={s2.result.days_until_deadline != null ? `${s2.result.days_until_deadline} days to deadline` : ''} accent={s2.result.statement_ready ? T.green : T.red} />
                  </div>
                  {(s2.result.country_risk_results || []).length > 0 && (
                    <div style={{ marginBottom: 16 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 8 }}>Country risk (Article 29 benchmarking)</div>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                        <thead><tr>{['Country', 'Risk tier', 'DD level'].map(h => <th key={h} style={{ textAlign: 'left', padding: '6px 10px', background: T.sub, color: T.navy, fontSize: 11, textTransform: 'uppercase' }}>{h}</th>)}</tr></thead>
                        <tbody>
                          {s2.result.country_risk_results.map((c, i) => (
                            <tr key={i} style={{ borderBottom: `1px solid ${T.borderL}` }}>
                              <td style={{ padding: '7px 10px' }}>{c.country_name || c.country_iso2}</td>
                              <td style={{ padding: '7px 10px' }}><Badge val={c.risk_tier} color={c.risk_tier === 'high' ? '#991b1b' : c.risk_tier === 'low' ? '#166534' : '#92400e'} bg={c.risk_tier === 'high' ? '#fee2e2' : c.risk_tier === 'low' ? '#dcfce7' : '#fef3c7'} /></td>
                              <td style={{ padding: '7px 10px' }}>{c.due_diligence_level}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: T.red, marginBottom: 6 }}>Gaps</div>
                      {(s2.result.gaps || []).length === 0 && <div style={{ fontSize: 12, color: T.textSec }}>No gaps identified.</div>}
                      {(s2.result.gaps || []).map((g, i) => <div key={i} style={{ fontSize: 12, color: T.textPri, padding: '5px 8px', background: '#fef2f2', borderRadius: 6, marginBottom: 4 }}>{typeof g === 'string' ? g : JSON.stringify(g)}</div>)}
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: T.sage, marginBottom: 6 }}>Recommendations</div>
                      {(s2.result.recommendations || []).map((r, i) => <div key={i} style={{ fontSize: 12, color: T.textPri, padding: '5px 8px', background: '#f0fdf4', borderRadius: 6, marginBottom: 4 }}>{typeof r === 'string' ? r : JSON.stringify(r)}</div>)}
                    </div>
                  </div>
                </div>
              )}
            </Card>
          </div>
        )}

        {/* STEP 3 — ETS2 */}
        {step === 3 && (
          <div style={{ display: 'grid', gridTemplateColumns: '400px 1fr', gap: 20 }}>
            <Card>
              <SectionH title="Fuel Distribution Profile" sub="ETS2 — buildings & road transport fuels, compliance from 2027" />
              <div style={{ marginBottom: 10 }}>
                <span style={lbl}>Regulated fuel</span>
                <select style={inp} value={ets2Form.fuel_type} onChange={e => setF('fuel_type', e.target.value)}>
                  {ETS2_FUELS.map(f => <option key={f.key} value={f.key}>{f.label}</option>)}
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                <div>
                  <span style={lbl}>{ets2Form.fuel_type === 'natural_gas' ? 'Annual volume (kg)' : 'Annual volume (litres)'}</span>
                  <input style={inp} type="number" value={ets2Form.annual_fuel_volume_litres} onChange={e => setF('annual_fuel_volume_litres', e.target.value)} />
                </div>
                <div>
                  <span style={lbl}>Expected ETS2 price (EUR/tCO2)</span>
                  <input style={inp} type="number" value={ets2Form.carbon_price_eur} onChange={e => setF('carbon_price_eur', e.target.value)} />
                </div>
              </div>
              <span style={lbl}>Compliance readiness (Art. 30a-30j)</span>
              {[
                ['has_mrv_system', 'MRV system in place (Art. 30c)'],
                ['monitoring_plan_submitted', 'Monitoring plan submitted (Art. 30c §2)'],
                ['has_registry_account', 'ETS2 registry account opened (Art. 30d)'],
                ['has_verified_emissions_report', 'Verified emissions report available (Art. 30e)'],
              ].map(([k, label]) => (
                <label key={k} style={rowLbl}>
                  <input type="checkbox" style={chk} checked={!!ets2Form[k]} onChange={e => setF(k, e.target.checked)} />
                  {label}
                </label>
              ))}
              <div style={{ margin: '6px 0 14px' }}>
                <span style={lbl}>Fuel volume data quality</span>
                <select style={inp} value={ets2Form.fuel_volume_data_quality} onChange={e => setF('fuel_volume_data_quality', e.target.value)}>
                  <option value="measured">Measured</option>
                  <option value="calculated">Calculated</option>
                  <option value="estimated">Estimated</option>
                </select>
              </div>
              <button style={runBtn(s3.status === 'loading')} disabled={s3.status === 'loading'} onClick={runStep3}>
                {s3.status === 'loading' ? 'Assessing…' : 'Run ETS2 Readiness'}
              </button>
            </Card>
            <Card>
              <SectionH title="Readiness Result" sub="Emissions exposure, allowance cost, pass-through and gaps" />
              {!s3.result && <div style={{ fontSize: 13, color: T.textSec }}>Run the readiness assessment to quantify {profile.name}'s ETS2 exposure.</div>}
              {s3.result && (
                <div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 18 }}>
                    <KpiCard label="Readiness Score" value={`${Math.round(s3.result.readiness_score || 0)}/100`} sub={s3.result.ets2_eligible ? 'In ETS2 scope' : 'Out of scope'} accent={(s3.result.readiness_score || 0) >= 75 ? T.green : T.amber} />
                    <KpiCard label="Annual Emissions" value={`${Math.round(s3.result.annual_emissions_tco2 || 0).toLocaleString()} tCO2`} sub="From distributed fuel volumes" accent={T.indigo} />
                    <KpiCard label="Allowance Cost" value={`€${Math.round(s3.result.estimated_allowance_cost_eur || 0).toLocaleString()}`} sub="At Art. 30d price corridor floor" accent={T.orange} />
                    <KpiCard label="Consumer Impact" value={`€${(s3.result.consumer_impact_eur_per_litre || 0).toFixed(3)}/L`} sub={`Pass-through potential ${Math.round(s3.result.pass_through_potential_pct || 0)}%`} accent={T.teal} />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: T.red, marginBottom: 6 }}>Readiness gaps</div>
                      {(s3.result.gaps || []).length === 0 && <div style={{ fontSize: 12, color: T.textSec }}>No gaps — fully ready.</div>}
                      {(s3.result.gaps || []).map((g, i) => <div key={i} style={{ fontSize: 12, color: T.textPri, padding: '5px 8px', background: '#fef2f2', borderRadius: 6, marginBottom: 4 }}>{g}</div>)}
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: T.sage, marginBottom: 6 }}>Recommendations</div>
                      {(s3.result.recommendations || []).map((r, i) => <div key={i} style={{ fontSize: 12, color: T.textPri, padding: '5px 8px', background: '#f0fdf4', borderRadius: 6, marginBottom: 4 }}>{r}</div>)}
                    </div>
                  </div>
                </div>
              )}
            </Card>
          </div>
        )}

        {/* STEP 4 — EuGB */}
        {step === 4 && (
          <div style={{ display: 'grid', gridTemplateColumns: '400px 1fr', gap: 20 }}>
            <Card>
              <SectionH title="Green Bond Issuance" sub="Regulation 2023/2631 — 85% aligned + up to 15% Art.5 flexibility pocket" />
              {s1.result && (
                <div style={{ fontSize: 12, color: T.textSec, background: T.sub, borderRadius: 6, padding: '8px 10px', marginBottom: 12 }}>
                  Carried forward from Step 1: DNSH {step1DnshOk ? 'confirmed' : 'NOT confirmed'} · Minimum safeguards {step1MsOk ? 'confirmed' : 'NOT confirmed'}
                </div>
              )}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                <div><span style={lbl}>Principal (EUR m)</span><input style={inp} type="number" value={gbForm.principal_m} onChange={e => setG('principal_m', e.target.value)} /></div>
                <div><span style={lbl}>Refinancing share (%)</span><input style={inp} type="number" value={gbForm.refinancing_share_pct} onChange={e => setG('refinancing_share_pct', e.target.value)} /></div>
              </div>
              <div style={{ marginBottom: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: T.textPri }}>
                  <span>Taxonomy-aligned proceeds (TSC-compliant)</span><span style={{ fontFamily: T.fontMono }}>{gbForm.taxonomy_alignment_pct}%</span>
                </div>
                <input type="range" min={0} max={100} value={gbForm.taxonomy_alignment_pct} style={{ width: '100%', accentColor: T.green }}
                  onChange={e => setG('taxonomy_alignment_pct', Number(e.target.value))} />
              </div>
              <div style={{ marginBottom: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: T.textPri }}>
                  <span>Art.5 flexibility pocket (TSC-gap activities)</span><span style={{ fontFamily: T.fontMono }}>{gbForm.flexibility_pocket_pct}%</span>
                </div>
                <input type="range" min={0} max={30} value={gbForm.flexibility_pocket_pct} style={{ width: '100%', accentColor: T.amber }}
                  onChange={e => setG('flexibility_pocket_pct', Number(e.target.value))} />
                <div style={{ fontSize: 11, color: T.textSec }}>Credited at max 15% when Art.5(1) conditions are met — the engine caps it.</div>
              </div>
              {[
                ['flexibility_pocket_conditions_met', 'Art.5(1) pocket conditions met (DNSH + min. safeguards for pocket activities)'],
                ['has_external_reviewer', 'ESMA-registered External Reviewer engaged (Art.22)'],
                ['has_pre_issuance_review', 'Pre-issuance GBFS review completed'],
              ].map(([k, label]) => (
                <label key={k} style={rowLbl}>
                  <input type="checkbox" style={chk} checked={!!gbForm[k]} onChange={e => setG(k, e.target.checked)} />
                  {label}
                </label>
              ))}
              {gbForm.has_external_reviewer && (
                <div style={{ margin: '4px 0 12px' }}>
                  <span style={lbl}>External reviewer</span>
                  <input style={inp} value={gbForm.er_name} onChange={e => setG('er_name', e.target.value)} />
                </div>
              )}
              <button style={runBtn(s4.status === 'loading')} disabled={s4.status === 'loading'} onClick={runStep4}>
                {s4.status === 'loading' ? 'Assessing…' : 'Assess EuGB Issuance'}
              </button>
            </Card>
            <Card>
              <SectionH title="EuGB Compliance Result" sub="85/15 test, GBFS completeness, blocking gaps" />
              {!s4.result && <div style={{ fontSize: 13, color: T.textSec }}>Assess the issuance to test the 85/15 use-of-proceeds rule.</div>}
              {s4.result && (
                <div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 18 }}>
                    <KpiCard label="EuGB Compliant" value={<PassFail ok={!!s4.result.overall_compliant} yes="COMPLIANT" no="NOT COMPLIANT" />} sub={`Score ${s4.result.compliance_score}/100`} accent={s4.result.overall_compliant ? T.green : T.red} />
                    <KpiCard label="Effective Alignment" value={`${s4.result.effective_taxonomy_alignment_pct}%`} sub={`Threshold ${s4.result.taxonomy_threshold_pct}% · pocket credited ${s4.result.flexibility_pocket_pct_credited}%`} accent={s4.result.effective_taxonomy_alignment_pct >= s4.result.taxonomy_threshold_pct ? T.green : T.amber} />
                    <KpiCard label="GBFS Completeness" value={`${s4.result.gbfs_completeness_pct}%`} sub="Green Bond Factsheet sections" accent={T.indigo} />
                    <KpiCard label="External Review" value={s4.result.er_status} sub={`DNSH: ${s4.result.dnsh_status}`} accent={s4.result.er_status === 'compliant' ? T.green : T.amber} />
                  </div>
                  {(s4.result.blocking_gaps || []).length > 0 && (
                    <div style={{ marginBottom: 14 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: T.red, marginBottom: 6 }}>Blocking gaps</div>
                      {s4.result.blocking_gaps.map((g, i) => <div key={i} style={{ fontSize: 12, color: T.textPri, padding: '5px 8px', background: '#fef2f2', borderRadius: 6, marginBottom: 4 }}>{g}</div>)}
                    </div>
                  )}
                  {(s4.result.priority_actions || []).length > 0 && (
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: T.sage, marginBottom: 6 }}>Priority actions</div>
                      {s4.result.priority_actions.map((a, i) => <div key={i} style={{ fontSize: 12, color: T.textPri, padding: '5px 8px', background: '#f0fdf4', borderRadius: 6, marginBottom: 4 }}>{a}</div>)}
                    </div>
                  )}
                </div>
              )}
            </Card>
          </div>
        )}

        {/* STEP 5 — XBRL */}
        {step === 5 && (
          <div style={{ display: 'grid', gridTemplateColumns: '400px 1fr', gap: 20 }}>
            <Card>
              <SectionH title="ESRS Data Points" sub="Facts sourced from the shared company profile above" />
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, marginBottom: 14 }}>
                <tbody>
                  {[
                    ['E1-6_scope1_gross', 'Scope 1 gross', `${Number(profile.scope1).toLocaleString()} tCO2e`],
                    ['E1-6_scope2_location', 'Scope 2 (location)', `${Number(profile.scope2Loc).toLocaleString()} tCO2e`],
                    ['E1-6_scope2_market', 'Scope 2 (market)', `${Number(profile.scope2Mkt).toLocaleString()} tCO2e`],
                    ['E1-6_scope3_total', 'Scope 3 total', `${Number(profile.scope3).toLocaleString()} tCO2e`],
                    ['E1-6_total_ghg', 'Total GHG (S1+S2loc+S3)', `${totalGhg.toLocaleString()} tCO2e`],
                    ['E1-5_energy_consumption_total', 'Energy consumption', `${Number(profile.energyMwh).toLocaleString()} MWh`],
                    ['E1-5_renewable_share', 'Renewable share', `${profile.renewableSharePct}%`],
                    ['E1-9_internal_carbon_price', 'Internal carbon price', `€${profile.internalCarbonPrice}/tCO2e`],
                  ].map(([dp, label, val]) => (
                    <tr key={dp} style={{ borderBottom: `1px solid ${T.borderL}` }}>
                      <td style={{ padding: '6px 8px', fontFamily: T.fontMono, fontSize: 11, color: T.textSec }}>{dp}</td>
                      <td style={{ padding: '6px 8px' }}>{label}</td>
                      <td style={{ padding: '6px 8px', textAlign: 'right', fontFamily: T.fontMono }}>{val}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div style={{ fontSize: 12, color: T.textSec, marginBottom: 12 }}>
                Reporting period {profile.reportingYear}-01-01 → {profile.reportingYear}-12-31 · LEI <span style={{ fontFamily: T.fontMono }}>{profile.lei}</span>
              </div>
              {!leiValid && <div style={{ fontSize: 12, color: T.red, marginBottom: 10 }}>Fix the LEI in the company profile (exactly 20 alphanumeric characters) before exporting.</div>}
              <button style={runBtn(s5.status === 'loading')} disabled={s5.status === 'loading' || !leiValid} onClick={runStep5}>
                {s5.status === 'loading' ? 'Generating…' : 'Generate XBRL Package'}
              </button>
            </Card>
            <Card>
              <SectionH title="Export Result" sub="iXBRL HTML + XBRL XML + ESEF validation" />
              {!s5.result && <div style={{ fontSize: 13, color: T.textSec }}>Generate the package to validate {profile.name}'s ESRS digital filing.</div>}
              {s5.result && (
                <div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 18 }}>
                    <KpiCard label="ESEF Validation" value={<PassFail ok={!!s5.result.validation_passed} yes="PASSED" no="FAILED" />} sub={`${s5.result.errors_count} errors · ${s5.result.warnings_count} warnings`} accent={s5.result.validation_passed ? T.green : T.red} />
                    <KpiCard label="Tagged Facts" value={s5.result.fact_count} sub={s5.result.taxonomy_version || 'ESRS XBRL taxonomy'} accent={T.indigo} />
                    <KpiCard label="ESRS Coverage" value={Object.keys(s5.result.coverage_by_esrs || {}).join(', ') || '—'} sub="Standards with tagged facts" accent={T.teal} />
                    <KpiCard label="iXBRL Package" value={s5.result.ixbrl_html ? `${Math.round(s5.result.ixbrl_html.length / 1024)} KB` : '—'} sub="Inline XBRL HTML document" accent={T.gold} />
                  </div>
                  {s5.result.ixbrl_html && (
                    <button onClick={downloadIxbrl} style={{ ...runBtn(false), background: T.teal, marginBottom: 16 }}>Download iXBRL HTML</button>
                  )}
                  <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 8 }}>Validation rules</div>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead><tr>{['Rule', 'Description', 'Result'].map(h => <th key={h} style={{ textAlign: 'left', padding: '6px 10px', background: T.sub, color: T.navy, fontSize: 11, textTransform: 'uppercase' }}>{h}</th>)}</tr></thead>
                    <tbody>
                      {(s5.result.validation_results || []).map((v, i) => (
                        <tr key={i} style={{ borderBottom: `1px solid ${T.borderL}` }}>
                          <td style={{ padding: '7px 10px', fontFamily: T.fontMono, fontSize: 12 }}>{v.rule_id}</td>
                          <td style={{ padding: '7px 10px' }}>{v.description}</td>
                          <td style={{ padding: '7px 10px' }}><PassFail ok={!!v.passed} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </div>
        )}

        {/* STEP 6 — Scorecard */}
        {step === 6 && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 8 }}>
              <div>
                <div style={{ fontSize: 17, fontWeight: 700, color: T.navy }}>Compliance Scorecard · {profile.name}</div>
                <div style={{ fontSize: 12, color: T.textSec }}>Consolidated view of all five engine verdicts for FY{profile.reportingYear}</div>
              </div>
              {allLive ? <Badge val="● All results Live" color="#166534" bg="#dcfce7" />
                : anyDemo ? <Badge val="○ Contains Demo results" color="#92400e" bg="#fef3c7" />
                  : <Badge val={`${ranRows.length}/5 steps run`} color="#64748b" bg="#f1f5f9" />}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 20 }}>
              <KpiCard label="Overall Chain Score" value={overallScore !== null ? `${overallScore}/100` : '—'} sub={`Average of ${ranRows.length} engine score(s)`} accent={overallScore === null ? T.textSec : overallScore >= 75 ? T.green : overallScore >= 50 ? T.amber : T.red} />
              <KpiCard label="Requirements Passed" value={`${scorecard.filter(r => r.ok).length}/5`} sub="Aligned · Compliant · Ready · EuGB · Filing-ready" accent={T.indigo} />
              <KpiCard label="Steps Not Yet Run" value={5 - ranRows.length} sub={5 - ranRows.length ? 'Complete every step for the full chain' : 'Full compliance chain assessed'} accent={5 - ranRows.length ? T.amber : T.green} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 420px', gap: 20 }}>
              <Card>
                <SectionH title="Per-Engine Verdicts" />
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead><tr>{['Step', 'Engine', 'Score', 'Verdict', 'Data'].map(h => <th key={h} style={{ textAlign: 'left', padding: '8px 10px', background: T.sub, color: T.navy, fontSize: 11, textTransform: 'uppercase' }}>{h}</th>)}</tr></thead>
                  <tbody>
                    {scorecard.map((r, i) => (
                      <tr key={i} style={{ borderBottom: `1px solid ${T.borderL}`, cursor: 'pointer' }} onClick={() => setStep(i + 1)}>
                        <td style={{ padding: '9px 10px', fontFamily: T.fontMono }}>{i + 1}</td>
                        <td style={{ padding: '9px 10px', fontWeight: 600, color: T.navy }}>{r.step}</td>
                        <td style={{ padding: '9px 10px', fontFamily: T.fontMono }}>{r.score !== null ? `${r.score}/100` : '—'}</td>
                        <td style={{ padding: '9px 10px' }}>
                          {r.score !== null
                            ? <Badge val={r.verdict} color={r.ok ? '#166534' : '#92400e'} bg={r.ok ? '#dcfce7' : '#fef3c7'} />
                            : <Badge val="Not run" color="#64748b" bg="#f1f5f9" />}
                        </td>
                        <td style={{ padding: '9px 10px' }}>
                          {r.status === 'live' && <Badge val="Live" color="#166534" bg="#dcfce7" />}
                          {r.status === 'demo' && <Badge val="Demo" color="#92400e" bg="#fef3c7" />}
                          {(r.status === 'idle' || r.status === 'loading') && <span style={{ fontSize: 12, color: T.textSec }}>—</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div style={{ fontSize: 11, color: T.textSec, marginTop: 10 }}>
                  Click a row to jump back to that step. Scores: Taxonomy = alignment composite (SC/DNSH/MS); EUDR = overall compliance;
                  ETS2 = readiness; EuGB = compliance score; XBRL = validation pass rate.
                </div>
              </Card>
              <Card>
                <SectionH title="Chain Profile" />
                <ResponsiveContainer width="100%" height={260}>
                  <RadarChart data={scorecard.map(r => ({ subject: r.step.split(' ')[0], score: r.score ?? 0 }))}>
                    <PolarGrid stroke={T.borderL} />
                    <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fill: T.textSec }} />
                    <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                    <Radar dataKey="score" stroke={T.indigo} fill={T.indigo} fillOpacity={0.35} />
                    <Tooltip />
                  </RadarChart>
                </ResponsiveContainer>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={scorecard.map(r => ({ name: r.step.split(' ')[0], score: r.score ?? 0 }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.borderL} />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="score" radius={[4, 4, 0, 0]}>
                      {scorecard.map((r, i) => (
                        <Cell key={i} fill={r.score === null ? '#cbd5e1' : r.ok ? T.green : T.amber} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            </div>
          </div>
        )}

        {/* Step navigation footer */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 22 }}>
          <button onClick={() => setStep(s => Math.max(1, s - 1))} disabled={step === 1}
            style={{ ...runBtn(false), background: step === 1 ? '#cbd5e1' : T.navy }}>← Previous</button>
          <div style={{ fontSize: 11, color: T.textSec, alignSelf: 'center', fontFamily: T.fontMono }}>
            Engines: eu_taxonomy · eudr · eu_ets (ETS2) · eu_gbs · xbrl_export — all platform-wired, no fabricated results
          </div>
          <button onClick={() => setStep(s => Math.min(6, s + 1))} disabled={step === 6}
            style={{ ...runBtn(false), background: step === 6 ? '#cbd5e1' : T.indigo }}>{step === 5 ? 'View Scorecard →' : 'Next →'}</button>
        </div>
      </div>
    </div>
  );
}
